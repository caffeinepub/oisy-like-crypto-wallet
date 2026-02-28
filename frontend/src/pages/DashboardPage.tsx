import React, { useEffect, useState } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { deriveICPAddress, deriveEVMAddress } from '@/utils/addressDerivation';
import WalletAddressCard from '@/components/WalletAddressCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Activity } from 'lucide-react';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  change24h: string;
  positive: boolean;
}

const MOCK_BALANCES: TokenBalance[] = [
  { symbol: 'ICP', name: 'Internet Computer', balance: '0.00', usdValue: '$0.00', change24h: '+0.00%', positive: true },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', usdValue: '$0.00', change24h: '+0.00%', positive: true },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.00', usdValue: '$0.00', change24h: '+0.00%', positive: true },
];

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const [icpAddress, setIcpAddress] = useState<string>('');
  const [evmAddress, setEvmAddress] = useState<string>('');
  const [addressesLoading, setAddressesLoading] = useState(false);

  useEffect(() => {
    if (!identity) {
      setIcpAddress('');
      setEvmAddress('');
      return;
    }
    setAddressesLoading(true);
    const principalText = identity.getPrincipal().toString();
    const icp = deriveICPAddress(principalText);
    setIcpAddress(icp);
    deriveEVMAddress(principalText).then((evm) => {
      setEvmAddress(evm);
      setAddressesLoading(false);
    });
  }, [identity]);

  const isAuthenticated = !!identity;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/60 mt-1">Overview of your crypto wallet</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Connected</span>
        </div>
      </div>

      {/* Wallet Addresses Section */}
      {isAuthenticated && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Wallet Addresses</h2>
          </div>
          <p className="text-sm text-foreground/50 mb-4">
            These addresses are derived from your Internet Identity. Use them to receive tokens.
          </p>
          {addressesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WalletAddressCard
                label="ICP Address"
                address={icpAddress}
                icon="∞"
                badgeColor="bg-blue-500/20 text-blue-400"
              />
              <WalletAddressCard
                label="EVM Address"
                address={evmAddress}
                icon="⬡"
                badgeColor="bg-purple-500/20 text-purple-400"
              />
            </div>
          )}
        </section>
      )}

      {/* Portfolio Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Portfolio</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
            <p className="text-xs text-foreground/50 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-foreground">$0.00</p>
            <p className="text-xs text-foreground/40 mt-1">USD equivalent</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
            <p className="text-xs text-foreground/50 mb-1">24h Change</p>
            <p className="text-2xl font-bold text-green-400">+$0.00</p>
            <p className="text-xs text-foreground/40 mt-1">+0.00%</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
            <p className="text-xs text-foreground/50 mb-1">Assets</p>
            <p className="text-2xl font-bold text-foreground">{MOCK_BALANCES.length}</p>
            <p className="text-xs text-foreground/40 mt-1">Tracked tokens</p>
          </div>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          {MOCK_BALANCES.map((token) => (
            <div
              key={token.symbol}
              className="glass-card rounded-xl p-4 border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{token.symbol}</p>
                  <p className="text-xs text-foreground/50">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground text-sm">{token.balance}</p>
                <p className="text-xs text-foreground/50">{token.usdValue}</p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-xs font-medium ${token.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change24h}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Send</p>
              <p className="text-xs text-foreground/50">Transfer tokens</p>
            </div>
          </button>
          <button className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Receive</p>
              <p className="text-xs text-foreground/50">Show your address</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
