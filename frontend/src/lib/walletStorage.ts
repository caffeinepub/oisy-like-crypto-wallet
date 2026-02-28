// Wallet storage utilities using localStorage

export interface NetworkConfig {
  id: string;
  name: string;
  type: 'ICP' | 'EVM';
  chainId?: number;
  symbol: string;
  explorerUrl?: string;
  color?: string;
  icon?: string;
  rpcUrl?: string;
  isCustomRpc?: boolean;
}

export interface TokenConfig {
  id: string;
  networkId: string;
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  balance?: string;
  addedAt?: number;
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
  timestamp: number;
  network: string;
  networkId: string;
  from: string;
  to: string;
  // 'recipient' alias kept for backward compat with old records
  recipient?: string;
  amount: string;
  symbol: string;
  // 'token' alias kept for backward compat with old records
  token?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'success';
  txHash?: string;
  note?: string;
  tokenSymbol?: string;
  tokenContractAddress?: string;
  // ICP address sub-type used in the transaction
  icpAddressType?: 'icp-native' | 'icp-token';
}

export interface WhitelistEntry {
  id: string;
  type: 'icp-native' | 'icp-token' | 'evm';
  address: string;
  label: string;
  createdAt: number;
}

const STORAGE_KEYS = {
  NETWORKS: 'wallet_networks',
  TOKENS: 'wallet_tokens',
  TRANSACTIONS: 'wallet_transactions',
  WATCHLIST: 'wallet_watchlist',
  WHITELIST: 'wallet_whitelist',
};

// Default EVM networks
export const DEFAULT_NETWORKS: NetworkConfig[] = [
  {
    id: 'icp',
    name: 'Internet Computer',
    type: 'ICP',
    symbol: 'ICP',
    explorerUrl: 'https://dashboard.internetcomputer.org',
    color: '#29ABE2',
    icon: '∞',
    rpcUrl: 'https://ic0.app',
    isCustomRpc: false,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    type: 'EVM',
    chainId: 1,
    symbol: 'ETH',
    explorerUrl: 'https://etherscan.io',
    color: '#627EEA',
    icon: 'Ξ',
    rpcUrl: 'https://mainnet.infura.io/v3/your-key',
    isCustomRpc: false,
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    type: 'EVM',
    chainId: 56,
    symbol: 'BNB',
    explorerUrl: 'https://bscscan.com',
    color: '#F3BA2F',
    icon: '◈',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    isCustomRpc: false,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    type: 'EVM',
    chainId: 137,
    symbol: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    color: '#8247E5',
    icon: '⬡',
    rpcUrl: 'https://polygon-rpc.com',
    isCustomRpc: false,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    type: 'EVM',
    chainId: 42161,
    symbol: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    color: '#28A0F0',
    icon: '◎',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    isCustomRpc: false,
  },
];

// ─── Address Validation ───────────────────────────────────────────────────────

/** ICP Native Account ID: exactly 64 hex characters */
export function validateIcpNativeAddress(address: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(address.trim());
}

/** ICP Token Principal ID: groups of alphanumeric chars separated by hyphens (e.g. xxxxx-xxxxx-...) */
export function validateIcpTokenAddress(address: string): boolean {
  return /^[a-z0-9]{5}(-[a-z0-9]{5})+(-[a-z0-9]{3})?$/.test(address.trim());
}

/** EVM address: 0x followed by exactly 40 hex characters */
export function validateEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

// ─── Whitelist Migration ──────────────────────────────────────────────────────

/**
 * Migrates legacy 'icp' type entries in localStorage to 'icp-native'.
 * Should be called once on app startup.
 */
export function migrateWhitelistEntries(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WHITELIST);
    if (!stored) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: any[] = JSON.parse(stored);
    let changed = false;
    const migrated = entries.map((e) => {
      if (e.type === 'icp') {
        changed = true;
        return { ...e, type: 'icp-native' };
      }
      return e;
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(migrated));
    }
  } catch {
    // ignore
  }
}

// ─── Networks ────────────────────────────────────────────────────────────────

export function getNetworks(): NetworkConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NETWORKS);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return DEFAULT_NETWORKS;
}

export function saveNetworks(networks: NetworkConfig[]): void {
  localStorage.setItem(STORAGE_KEYS.NETWORKS, JSON.stringify(networks));
}

/** @deprecated Use getNetworks() */
export function loadNetworks(_principal?: string): NetworkConfig[] {
  return getNetworks();
}

// ─── Tokens ──────────────────────────────────────────────────────────────────

export function getTokens(): TokenConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

export function saveTokens(tokens: TokenConfig[]): void {
  localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
}

export function getTokensByNetwork(networkId: string): TokenConfig[] {
  return getTokens().filter((t) => t.networkId === networkId);
}

export function setTokenBalance(tokenId: string, balance: string): void {
  const tokens = getTokens();
  const idx = tokens.findIndex((t) => t.id === tokenId);
  if (idx !== -1) {
    tokens[idx] = { ...tokens[idx], balance };
    saveTokens(tokens);
  }
}

export function getTokenBalance(tokenId: string): string {
  const token = getTokens().find((t) => t.id === tokenId);
  return token?.balance ?? '0';
}

/** @deprecated Use getTokens() */
export function loadTokens(_principal?: string): TokenConfig[] {
  return getTokens();
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export function getWatchlist(): WatchlistEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

export function saveWatchlistEntries(entries: WatchlistEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(entries));
}

/** @deprecated Use getWatchlist() */
export function loadWatchlist(_principal?: string): WatchlistEntry[] {
  return getWatchlist();
}

/** @deprecated Use saveWatchlistEntries() */
export function saveWatchlist(_principal: string, entries: WatchlistEntry[]): void {
  saveWatchlistEntries(entries);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function getTransactions(): TransactionRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

export function saveTransaction(tx: TransactionRecord): void {
  const txs = getTransactions();
  txs.unshift(tx);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
}

export function saveTransactions(_principal: string, txs: TransactionRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
}

export function loadTransactions(_principal?: string): TransactionRecord[] {
  return getTransactions();
}

export function deleteTransaction(id: string): void {
  const txs = getTransactions().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
}

export function clearTransactions(): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
}

// ─── Whitelist ────────────────────────────────────────────────────────────────

export function getWhitelistEntries(): WhitelistEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WHITELIST);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

export function addWhitelistEntry(entry: Omit<WhitelistEntry, 'id' | 'createdAt'>): WhitelistEntry {
  const entries = getWhitelistEntries();
  const newEntry: WhitelistEntry = {
    ...entry,
    id: generateId(),
    createdAt: Date.now(),
  };
  entries.push(newEntry);
  localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(entries));
  return newEntry;
}

export function updateWhitelistEntry(id: string, updates: Partial<Omit<WhitelistEntry, 'id' | 'createdAt'>>): void {
  const entries = getWhitelistEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(entries));
  }
}

export function deleteWhitelistEntry(id: string): void {
  const entries = getWhitelistEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(entries));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function shortAddress(address: string, chars = 6): string {
  if (!address || address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
