import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import apiClient from './services/api';

const Web3Context = createContext();
export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const refreshBlockchain = useCallback(async (account) => {
    try {
      const { data } = await apiClient.get('/blockchain/config', { params: { account } });
      setConfig(data);
      setError(null);
    } catch (err) {
      setConfig(null);
      setError(err.response?.data?.error || 'Sepolia service is unavailable.');
    }
  }, []);
  const disconnectWallet = useCallback(() => {
    setProvider(null); setSigner(null); setUserAddress(null);
  }, []);
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) { setError('Install MetaMask to connect your demo wallet.'); return; }
    setLoading(true);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const nextProvider = new BrowserProvider(window.ethereum);
      const nextSigner = await nextProvider.getSigner();
      const account = await nextSigner.getAddress();
      setProvider(nextProvider); setSigner(nextSigner); setUserAddress(account);
      await refreshBlockchain(account);
    } catch (err) { setError(err.message || 'Wallet connection failed.'); }
    finally { setLoading(false); }
  }, [refreshBlockchain]);
  useEffect(() => { refreshBlockchain(userAddress); }, [refreshBlockchain, userAddress]);
  useEffect(() => {
    if (!window.ethereum) return;
    const accountsChanged = async (accounts) => {
      disconnectWallet();
      if (!accounts.length) return;
      try {
        const p = new BrowserProvider(window.ethereum);
        const s = await p.getSigner(accounts[0]);
        setProvider(p); setSigner(s); setUserAddress(await s.getAddress());
      } catch (err) { setError(err.message); }
    };
    const chainChanged = () => { disconnectWallet(); };
    window.ethereum.request({ method: 'eth_accounts' }).then(accountsChanged).catch(() => {});
    window.ethereum.on('accountsChanged', accountsChanged);
    window.ethereum.on('chainChanged', chainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', accountsChanged);
      window.ethereum.removeListener('chainChanged', chainChanged);
    };
  }, [disconnectWallet]);
  return <Web3Context.Provider value={{ provider, signer, contract: null, userAddress,
    isAdmin: Boolean(config?.owner && userAddress && config.owner.toLowerCase() === userAddress.toLowerCase()),
    bctBalance: config?.balance || '0', totalSupply: config?.totalSupply || '0',
    blockchainConfig: config, refreshBlockchain, error, loading, connectWallet, disconnectWallet }}>
    {children}
  </Web3Context.Provider>;
};
export const useWeb3 = () => useContext(Web3Context);
