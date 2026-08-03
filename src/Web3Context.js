import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import contractData from './contracts/BlueCarbonToken.json';

const { contractAddress } = contractData;
const contractABI = contractData.abi;

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bctBalance, setBctBalance] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
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

  /** Fetch total supply */
  const fetchTotalSupply = useCallback(async (tokenContract) => {
    if (!tokenContract) return;
    try {
      const supply = await tokenContract.totalSupply();
      setTotalSupply(supply.toString());
    } catch (err) {
      console.error("Failed to fetch total supply:", err);
      setTotalSupply("0");
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

      // Fetch BCT balance and total supply
      await fetchBctBalance(_userAddress, _contract);
      await fetchTotalSupply(_contract);

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
  }, [fetchBctBalance, fetchTotalSupply]);

  /** Hard Disconnect Wallet */
  const disconnectWallet = useCallback(async () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setUserAddress(null);
    setIsAdmin(false);
    setBctBalance("0");
    setTotalSupply("0");
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
        totalSupply,
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
