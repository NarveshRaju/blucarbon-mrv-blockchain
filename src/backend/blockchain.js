const ethers = require('ethers');
const { abi } = require('../contracts/BlueCarbonToken.json');
const CHAIN_ID = 11155111n;
const explorer = hash => `https://sepolia.etherscan.io/tx/${hash}`;
function mintMessage(project, address, timestamp) {
  return ['BlueCarbon demo mint authorization', 'Chain: 11155111',
    `Contract: ${address.toLowerCase()}`, `Project: ${project._id}`,
    `Recipient: ${project.walletAddress.toLowerCase()}`,
    `Demo tokens: ${project.saplingsPlanted}`, `Timestamp: ${timestamp}`].join('\n');
}
function validateAuthorization(project, address, timestamp, signature, owner, now = Date.now()) {
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300000) throw new Error('Authorization expired. Sign a new mint request.');
  const signer = ethers.verifyMessage(mintMessage(project, address, timestamp), signature);
  if (signer.toLowerCase() !== owner.toLowerCase()) throw new Error('Only the contract owner can authorize minting.');
}
async function getBlockchain(sdk = ethers) {
  const rpc = process.env.ALCHEMY_SEPOLIA_RPC_URL;
  const address = process.env.CONTRACT_ADDRESS;
  if (!rpc || !ethers.isAddress(address) || !process.env.ADMIN_PRIVATE_KEY) throw new Error('Configure the backend Sepolia RPC, contract address and demo relayer key.');
  const provider = new sdk.JsonRpcProvider(rpc);
  try {
    if ((await provider.getNetwork()).chainId !== CHAIN_ID) throw new Error('Only Sepolia is allowed. Mainnet transactions are disabled.');
    if (await provider.getCode(address) === '0x') throw new Error('No contract found at the configured Sepolia address.');
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(address, abi, wallet);
    const owner = await contract.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) throw new Error('The demo relayer must own the token contract.');
    return { provider, wallet, contract, address, owner };
  } catch (err) { provider.destroy(); throw err; }
}
async function triggerMinting(project, chain, savePrepared) {
  if (!ethers.isAddress(project.walletAddress) || project.walletAddress === ethers.ZeroAddress) throw new Error('Project needs a valid recipient wallet.');
  if (!Number.isSafeInteger(project.saplingsPlanted) || project.saplingsPlanted <= 0) throw new Error('Demo token quantity must be a positive safe integer.');
  const amount = ethers.parseUnits(String(project.saplingsPlanted), 18);
  const request = await chain.contract.mintAndRecordApproval.populateTransaction(project.walletAddress, amount, String(project._id));
  const populated = await chain.wallet.populateTransaction(request);
  if (BigInt(populated.chainId) !== CHAIN_ID) throw new Error('Refusing to sign a transaction outside Sepolia.');
  const raw = await chain.wallet.signTransaction(populated);
  const hash = ethers.keccak256(raw);
  // Record the deterministic hash before broadcast, preventing automatic duplicate issuance after crashes.
  await savePrepared(hash);
  await chain.provider.broadcastTransaction(raw);
  return hash;
}
module.exports = { CHAIN_ID, explorer, mintMessage, validateAuthorization, getBlockchain, triggerMinting };
