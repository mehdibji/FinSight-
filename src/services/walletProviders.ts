// ============================================================
// Wallet Provider Service Layer
// ============================================================

export type WalletProvider = 'metamask' | 'coinbase' | 'binance' | 'phantom' | 'trust' | 'manual';

export type ConnectedWallet = {
  id: string;
  provider: WalletProvider;
  address: string;
  chain: string;
  label: string;
  balance?: number;
  connectedAt: number;
};

export const WALLET_PROVIDERS: Record<WalletProvider, {
  name: string;
  icon: string;
  color: string;
  chains: string[];
  description: string;
  available: boolean;
}> = {
  metamask: {
    name: 'MetaMask',
    icon: '🦊',
    color: '#F6851B',
    chains: ['Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'],
    description: 'Connect your MetaMask browser extension wallet',
    available: true,
  },
  coinbase: {
    name: 'Coinbase',
    icon: '🔵',
    color: '#0052FF',
    chains: ['Ethereum', 'Polygon', 'Solana', 'Base'],
    description: 'Connect via Coinbase Wallet or Coinbase account',
    available: true,
  },
  binance: {
    name: 'Binance',
    icon: '⬡',
    color: '#F0B90B',
    chains: ['BSC', 'Ethereum', 'BTC'],
    description: 'Sync your Binance portfolio via read-only API key',
    available: true,
  },
  phantom: {
    name: 'Phantom',
    icon: '👻',
    color: '#AB9FF2',
    chains: ['Solana', 'Ethereum'],
    description: 'Connect your Phantom wallet for Solana & Ethereum',
    available: true,
  },
  trust: {
    name: 'Trust Wallet',
    icon: '🛡️',
    color: '#3375BB',
    chains: ['Ethereum', 'BSC', 'Polygon', 'Solana'],
    description: 'Connect via WalletConnect protocol',
    available: false,
  },
  manual: {
    name: 'Manual Address',
    icon: '📋',
    color: '#6B7280',
    chains: ['Ethereum', 'Bitcoin', 'Solana', 'Any'],
    description: 'Enter any wallet address for read-only portfolio tracking',
    available: true,
  },
};

// MetaMask Connection
export async function connectMetaMask(): Promise<ConnectedWallet | null> {
  const ethereum = (window as any).ethereum;
  if (!ethereum?.isMetaMask) {
    throw new Error('MetaMask is not installed. Please install the MetaMask browser extension.');
  }
  try {
    const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts.length) throw new Error('No accounts found');
    const chainId: string = await ethereum.request({ method: 'eth_chainId' });
    const chainNames: Record<string, string> = {
      '0x1': 'Ethereum', '0x89': 'Polygon', '0x38': 'BSC',
      '0xa4b1': 'Arbitrum', '0xa': 'Optimism',
    };
    return {
      id: `mm-${accounts[0].slice(0, 8)}`,
      provider: 'metamask',
      address: accounts[0],
      chain: chainNames[chainId] || `Chain ${parseInt(chainId, 16)}`,
      label: 'MetaMask',
      connectedAt: Date.now(),
    };
  } catch (err: any) {
    throw new Error(err.message || 'MetaMask connection failed');
  }
}

// Coinbase Wallet Connection
export async function connectCoinbase(): Promise<ConnectedWallet | null> {
  // Check for Coinbase Wallet provider
  const ethereum = (window as any).ethereum;
  if (ethereum?.isCoinbaseWallet || ethereum?.providers?.find((p: any) => p.isCoinbaseWallet)) {
    const provider = ethereum.isCoinbaseWallet ? ethereum : ethereum.providers.find((p: any) => p.isCoinbaseWallet);
    try {
      const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts.length) throw new Error('No accounts found');
      return {
        id: `cb-${accounts[0].slice(0, 8)}`,
        provider: 'coinbase',
        address: accounts[0],
        chain: 'Ethereum',
        label: 'Coinbase Wallet',
        connectedAt: Date.now(),
      };
    } catch (err: any) {
      throw new Error(err.message || 'Coinbase Wallet connection failed');
    }
  }
  throw new Error('Coinbase Wallet extension not detected. Install the Coinbase Wallet extension.');
}

// Phantom (Solana) Connection
export async function connectPhantom(): Promise<ConnectedWallet | null> {
  const solana = (window as any).solana;
  if (!solana?.isPhantom) {
    throw new Error('Phantom wallet is not installed. Install the Phantom browser extension.');
  }
  try {
    const resp = await solana.connect();
    const pubKey = resp.publicKey.toString();
    return {
      id: `ph-${pubKey.slice(0, 8)}`,
      provider: 'phantom',
      address: pubKey,
      chain: 'Solana',
      label: 'Phantom',
      connectedAt: Date.now(),
    };
  } catch (err: any) {
    throw new Error(err.message || 'Phantom connection failed');
  }
}

// Binance API Sync (via server proxy)
export async function connectBinance(apiKey: string, apiSecret: string, idToken: string): Promise<ConnectedWallet | null> {
  try {
    const res = await fetch('/api/wallet/binance-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ apiKey, apiSecret }),
    });
    if (!res.ok) throw new Error('Binance API sync failed');
    const data = await res.json();
    return {
      id: `bn-${apiKey.slice(0, 8)}`,
      provider: 'binance',
      address: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
      chain: 'Binance',
      label: 'Binance Account',
      balance: data.totalBalance,
      connectedAt: Date.now(),
    };
  } catch (err: any) {
    throw new Error(err.message || 'Binance sync failed');
  }
}

// Manual address entry
export function connectManual(address: string, chain: string): ConnectedWallet {
  return {
    id: `man-${address.slice(0, 8)}`,
    provider: 'manual',
    address,
    chain,
    label: `${chain} Address`,
    connectedAt: Date.now(),
  };
}

// Local storage helpers for wallet persistence
const STORAGE_KEY = 'finsight_wallets';

export function getSavedWallets(): ConnectedWallet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveWallets(wallets: ConnectedWallet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

export function removeWallet(id: string): ConnectedWallet[] {
  const wallets = getSavedWallets().filter(w => w.id !== id);
  saveWallets(wallets);
  return wallets;
}
