import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';


// --- Your Contract Details ---
const contractAddress = "0xcd91f2fFd3faE5ffeFFDc11Cd182684aEa09Af71";
const contractABI = [{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"offChainProjectId","type":"string"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountMinted","type":"uint256"}],"name":"ApprovalRecord","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"offChainProjectId","type":"string"}],"name":"mintAndRecordApproval","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bctBalance, setBctBalance] = useState("0");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /** Fetch BCT token balance */
  const fetchBctBalance = useCallback(async (user, tokenContract) => {
    if (!user || !tokenContract) return;
    try {
      const balance = await tokenContract.balanceOf(user);
      setBctBalance(balance.toString());
    } catch (err) {
      console.error("Failed to fetch BCT balance:", err);
      setBctBalance("0");
    }
  }, []);

  /** Connect Wallet (always fresh) */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use this dApp.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Always ask for permission explicitly
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) throw new Error("No accounts found");

      const _provider = new BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _userAddress = await _signer.getAddress();
      const _contract = new Contract(contractAddress, contractABI, _signer);

      const ownerAddress = await _contract.owner();
      const _isAdmin = _userAddress.toLowerCase() === ownerAddress.toLowerCase();

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setUserAddress(_userAddress);
      setIsAdmin(_isAdmin);

      // Fetch BCT balance immediately
      await fetchBctBalance(_userAddress, _contract);

      console.log("✅ Connected wallet:", _userAddress);
    } catch (err) {
      if (err.code === 4001) {
        setError("User rejected wallet connection.");
        console.warn("🛑 User rejected connection");
      } else {
        console.error("Connection Error:", err);
        setError("Wallet connection failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchBctBalance]);

  /** Hard Disconnect Wallet */
  const disconnectWallet = useCallback(async () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setUserAddress(null);
    setIsAdmin(false);
    setBctBalance("0");
    setError(null);
    setLoading(false);

    try {
      if (window.ethereum?.request) {
        // Revoke permissions to force fresh connect next time
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (err) {
      console.warn("⚠️ Could not reset permissions:", err.message);
    }

    console.log("🔌 Wallet fully disconnected");
  }, []);

  /** Handle account & chain changes */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        await disconnectWallet();
      } else {
        await connectWallet(); // Always fresh connection
      }
    };

    const handleChainChanged = () => {
      console.log("🌐 Chain changed, reloading...");
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        userAddress,
        isAdmin,
        bctBalance,
        error,
        loading,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
