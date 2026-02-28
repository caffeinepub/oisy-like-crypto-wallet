// Wallet data types and localStorage persistence helpers

export interface NetworkConfig {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  chainId?: number;
  isCustomRpc: boolean;
  color: string;
  icon: string;
}

export interface TokenConfig {
  id: string;
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  networkId: string;
  addedAt: number;
}

export interface WatchlistEntry {
  id: string;
  address: string;
  label: string;
  balance: string;
  networkId: string;
  lastUpdated: number | null;
}

export interface TransactionRecord {
  id: string;
  recipient: string;
  amount: string;
  token: string;
  networkId: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  note?: string;
}

// Default networks
export const DEFAULT_NETWORKS: NetworkConfig[] = [
  {
    id: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    rpcUrl: 'https://ic0.app',
    explorerUrl: 'https://dashboard.internetcomputer.org',
    isCustomRpc: false,
    color: '#29ABE2',
    icon: '∞',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/your-key',
    explorerUrl: 'https://etherscan.io',
    chainId: 1,
    isCustomRpc: false,
    color: '#627EEA',
    icon: 'Ξ',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    chainId: 137,
    isCustomRpc: false,
    color: '#8247E5',
    icon: '⬡',
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    chainId: 56,
    isCustomRpc: false,
    color: '#F3BA2F',
    icon: '◈',
  },
];

function storageKey(principal: string, ns: string) {
  return `wallet_${principal}_${ns}`;
}

// Networks
export function loadNetworks(principal: string): NetworkConfig[] {
  try {
    const raw = localStorage.getItem(storageKey(principal, 'networks'));
    return raw ? JSON.parse(raw) : DEFAULT_NETWORKS;
  } catch {
    return DEFAULT_NETWORKS;
  }
}

export function saveNetworks(principal: string, networks: NetworkConfig[]) {
  localStorage.setItem(storageKey(principal, 'networks'), JSON.stringify(networks));
}

// Tokens
export function loadTokens(principal: string): TokenConfig[] {
  try {
    const raw = localStorage.getItem(storageKey(principal, 'tokens'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTokens(principal: string, tokens: TokenConfig[]) {
  localStorage.setItem(storageKey(principal, 'tokens'), JSON.stringify(tokens));
}

// Watchlist
export function loadWatchlist(principal: string): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(principal, 'watchlist'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(principal: string, entries: WatchlistEntry[]) {
  localStorage.setItem(storageKey(principal, 'watchlist'), JSON.stringify(entries));
}

// Transactions
export function loadTransactions(principal: string): TransactionRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(principal, 'transactions'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(principal: string, txs: TransactionRecord[]) {
  localStorage.setItem(storageKey(principal, 'transactions'), JSON.stringify(txs));
}

// Generate a simple unique ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Format address for display
export function shortAddress(address: string, chars = 6): string {
  if (!address || address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Format timestamp
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
