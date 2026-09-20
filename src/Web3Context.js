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

  /** Fetch BCT token balance safely */
  const fetchBctBalance = useCallback(async (user, tokenContract) => {
    if (!user || !tokenContract) return;
    try {
      const balance = await tokenContract.balanceOf(user);
      setBctBalance(balance.toString());
    } catch (err) {
      console.warn("Could not fetch BCT balance (likely network/contract mismatch):", err.message);
      setBctBalance("0");
    }
  }, []);

  /** Fetch total supply safely */
  const fetchTotalSupply = useCallback(async (tokenContract) => {
    if (!tokenContract) return;
    try {
      const supply = await tokenContract.totalSupply();
      setTotalSupply(supply.toString());
    } catch (err) {
      console.warn("Could not fetch total supply:", err.message);
      setTotalSupply("0");
    }
  }, []);

  /** Connect Wallet (always fresh & resilient) */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use this dApp.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Request account access from MetaMask
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) throw new Error("No accounts authorized");

      const _provider = new BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _userAddress = await _signer.getAddress();

      // Set user address & provider immediately so UI reacts right away
      setUserAddress(_userAddress);
      setProvider(_provider);
      setSigner(_signer);

      // Connect to contract safely
      let _contract = null;
      let _isAdmin = false;
      try {
        if (contractAddress && contractABI) {
          _contract = new Contract(contractAddress, contractABI, _signer);
          setContract(_contract);
          try {
            const ownerAddress = await _contract.owner();
            _isAdmin = _userAddress.toLowerCase() === ownerAddress.toLowerCase();
          } catch (oErr) {
            console.warn("Owner check warning:", oErr.message);
          }
        }
      } catch (cErr) {
        console.warn("Contract initialization notice:", cErr.message);
      }
      setIsAdmin(_isAdmin);

      // Fetch balances asynchronously without blocking connection
      if (_contract) {
        fetchBctBalance(_userAddress, _contract);
        fetchTotalSupply(_contract);
      }

      console.log("✅ Connected wallet:", _userAddress);
    } catch (err) {
      if (err.code === 4001) {
        setError("User rejected wallet connection in MetaMask.");
        console.warn("🛑 User rejected connection");
      } else {
        console.error("Connection Error:", err);
        setError("Wallet connection error: " + (err.message || "Please check MetaMask."));
      }
    } finally {
      setLoading(false);
    }
  }, [fetchBctBalance, fetchTotalSupply]);

  /** Disconnect Wallet */
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

    console.log("🔌 Wallet disconnected");
  }, []);

  /** Eagerly connect if already authorized in MetaMask */
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then(async (accounts) => {
      if (accounts && accounts.length > 0) {
        try {
          const _provider = new BrowserProvider(window.ethereum);
          const _signer = await _provider.getSigner();
          const _userAddress = await _signer.getAddress();

          setUserAddress(_userAddress);
          setProvider(_provider);
          setSigner(_signer);

          let _contract = null;
          let _isAdmin = false;
          try {
            if (contractAddress && contractABI) {
              _contract = new Contract(contractAddress, contractABI, _signer);
              setContract(_contract);
              try {
                const ownerAddress = await _contract.owner();
                _isAdmin = _userAddress.toLowerCase() === ownerAddress.toLowerCase();
              } catch {}
            }
          } catch {}
          setIsAdmin(_isAdmin);

          if (_contract) {
            fetchBctBalance(_userAddress, _contract);
            fetchTotalSupply(_contract);
          }
        } catch (err) {
          console.warn("Silent eager connect notice:", err);
        }
      }
    }).catch(() => {});
  }, [fetchBctBalance, fetchTotalSupply]);

  /** Handle account & chain changes */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        await disconnectWallet();
      } else {
        await connectWallet();
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
