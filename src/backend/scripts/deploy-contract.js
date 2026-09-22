const fs = require('node:fs');
const path = require('node:path');
const { JsonRpcProvider, Wallet, ContractFactory, formatEther } = require('ethers');
const { compileContract } = require('./compile-contract');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

async function main() {
  if (!process.env.ALCHEMY_SEPOLIA_RPC_URL || !process.env.ADMIN_PRIVATE_KEY) {
    throw new Error('Set ALCHEMY_SEPOLIA_RPC_URL and ADMIN_PRIVATE_KEY in src/backend/.env. Use a new dedicated demo wallet; no old contract access is needed.');
  }
  const destination = path.join(__dirname, '../deployments/sepolia.json');
  if (fs.existsSync(destination)) throw new Error('A deployment record already exists. Review deployments/sepolia.json before deploying again.');
  const artifact = compileContract();
  const provider = new JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_RPC_URL);
  try {
    if ((await provider.getNetwork()).chainId !== 11155111n) throw new Error('Deployment is restricted to Sepolia. Mainnet is disabled.');
    const wallet = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(`New contract owner: ${wallet.address}\nSepolia test ETH: ${formatEther(balance)}`);
    if (balance === 0n) throw new Error('Fund this address with free Sepolia faucet ETH, then retry. Do not buy ETH.');
    const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const request = await wallet.populateTransaction(await factory.getDeployTransaction(wallet.address));
    if (BigInt(request.chainId) !== 11155111n) throw new Error('Refusing to sign outside Sepolia.');
    const maxCost = request.gasLimit * (request.maxFeePerGas || request.gasPrice);
    if (balance < maxCost) throw new Error('Insufficient free test ETH for the estimated deployment gas. Refill from a Sepolia faucet.');
    // Save a recoverable deployment record before broadcasting to avoid accidental repeat deployments.
    const { keccak256, getCreateAddress } = require('ethers');
    const raw = await wallet.signTransaction(request);
    const record = { chainId: 11155111, contractAddress: getCreateAddress({ from: wallet.address, nonce: request.nonce }),
      owner: wallet.address, transactionHash: keccak256(raw), status: 'prepared', compiler: artifact.compiler };
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
    const tx = await provider.broadcastTransaction(raw);
    console.log(`Deployment submitted: https://sepolia.etherscan.io/tx/${tx.hash}`);
    const receipt = await tx.wait(1, 120000);
    if (!receipt || receipt.status !== 1) throw new Error('Deployment was not confirmed. Review the saved transaction before retrying.');
    record.status = 'confirmed'; record.blockNumber = receipt.blockNumber;
    fs.writeFileSync(destination, JSON.stringify(record, null, 2) + '\n');
    console.log(`Set CONTRACT_ADDRESS=${record.contractAddress} in src/backend/.env and restart the backend.\nConnect the owner wallet in MetaMask to authorize demo minting.`);
  } finally { provider.destroy(); }
}
main().catch(error => {
  // Avoid provider error bodies which can include private RPC URLs.
  console.error(error.shortMessage || (error.code ? `Deployment failed (${error.code}). Check configuration and the saved deployment record.` : error.message));
  process.exitCode = 1;
});
