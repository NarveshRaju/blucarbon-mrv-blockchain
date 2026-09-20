// --- blockchain.js ---
const { ethers } = require("ethers");
require("dotenv").config();

// --- Configuration ---
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALCHEMY_RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // ✅ don’t hardcode

const contractABI = [
  "constructor(address initialOwner)",
  "event ApprovalRecord(string indexed offChainProjectId, address indexed recipient, uint256 amountMinted)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "function mintAndRecordApproval(address recipient, uint256 amount, string memory offChainProjectId)",
  "function owner() view returns (address)",
  "function balanceOf(address account) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)"
];

/**
 * Trigger blockchain minting after project approval
 * @param {string} ngoWalletAddress - Wallet address of the NGO
 * @param {number} numberOfTokens - Number of tokens to mint
 * @param {string} projectId - MongoDB projectId
 */
async function triggerMinting(ngoWalletAddress, numberOfTokens, projectId) {
  if (!ADMIN_PRIVATE_KEY || !ALCHEMY_RPC_URL || !CONTRACT_ADDRESS) {
    console.error("❌ Missing required configuration.");
    return { success: false, message: "Server configuration error." };
  }

  if (!ethers.utils.isAddress(ngoWalletAddress)) {
    console.error("❌ Invalid NGO wallet address:", ngoWalletAddress);
    return { success: false, message: "Invalid NGO wallet address." };
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, adminWallet);

    const amountInWei = ethers.utils.parseUnits(numberOfTokens.toString(), 18);

    console.log(`⏳ Attempting to mint ${numberOfTokens} tokens for project '${projectId}' to ${ngoWalletAddress}`);

    const tx = await contract.mintAndRecordApproval(ngoWalletAddress, amountInWei, projectId);

    console.log(`📤 Transaction sent! Waiting for confirmation... Tx Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    const txLink = `https://sepolia.etherscan.io/tx/${receipt.transactionHash}`;

    console.log(`✅ Success! Confirmed in block ${receipt.blockNumber}`);
    console.log(`🔗 Verify on Etherscan: ${txLink}`);

    return { success: true, transactionHash: receipt.transactionHash, link: txLink };

  } catch (error) {
    console.error("❌ Minting failed:", error.reason || error.message);
    return { success: false, message: error.reason || "Unexpected blockchain error" };
  }
}

module.exports = { triggerMinting };
