import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { deriveICPAddress, deriveEVMAddress, truncateAddress } from '../utils/addressDerivation';
import WalletAddressCard from '../components/WalletAddressCard';
import { ArrowUpRight, ArrowDownLeft, Clock, Coins } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { getTokens, getNetworks } from '../lib/walletStorage';

interface PortfolioToken {
  symbol: string;
  balance: string;
  value: string;
  change: string;
  positive: boolean;
}

const mockPortfolio: PortfolioToken[] = [
  { symbol: 'ICP', balance: '125.50', value: '$1,255.00', change: '+5.2%', positive: true },
  { symbol: 'ETH', balance: '0.85', value: '$2,550.00', change: '-1.3%', positive: false },
  { symbol: 'USDC', balance: '500.00', value: '$500.00', change: '0.0%', positive: true },
];

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const [icpAddress, setIcpAddress] = useState('');
  const [evmAddress, setEvmAddress] = useState('');

  useEffect(() => {
    if (!identity) {
      setIcpAddress('');
      setEvmAddress('');
      return;
    }
    const principalText = identity.getPrincipal().toString();
    setIcpAddress(deriveICPAddress(principalText));
    deriveEVMAddress(principalText).then(setEvmAddress);
  }, [identity]);

  // Load ERC-20 tokens from storage (EVM networks only)
  const allTokens = getTokens();
  const networks = getNetworks();
  const evmNetworkIds = new Set(networks.filter((n) => n.type === 'EVM').map((n) => n.id));
  const erc20Tokens = allTokens.filter((t) => evmNetworkIds.has(t.networkId));

  const totalMockValue = 4305.0;
  const erc20Value = erc20Tokens.reduce((sum, t) => {
    const bal = parseFloat(t.balance ?? '0');
    return sum + (isNaN(bal) ? 0 : bal);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your multi-chain wallet</p>
        </div>

        {/* Wallet Addresses */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Wallet Addresses</h2>
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
        </section>

        {/* Portfolio Summary */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Summary</h2>
          <div className="bg-card border border-border rounded-2xl p-6 mb-4">
            <p className="text-muted-foreground text-sm">Total Estimated Value</p>
            <p className="text-4xl font-bold text-foreground mt-1">
              ${(totalMockValue + erc20Value).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-green-400 mt-1">+3.8% (24h)</p>
          </div>

          {/* Native token balances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mockPortfolio.map((token) => (
              <div
                key={token.symbol}
                className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{token.symbol}</span>
                  <span
                    className={`text-xs font-medium ${
                      token.positive ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {token.change}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground">{token.balance}</p>
                <p className="text-sm text-muted-foreground">{token.value}</p>
              </div>
            ))}
          </div>

          {/* ERC-20 Tokens */}
          {erc20Tokens.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                ERC-20 Tokens
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {erc20Tokens.map((token) => {
                  const network = networks.find((n) => n.id === token.networkId);
                  return (
                    <div
                      key={token.id}
                      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {network?.name ?? token.networkId}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-foreground">{token.balance ?? '0'}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(token.contractAddress)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {erc20Tokens.length === 0 && (
            <div className="mt-4 border border-dashed border-border rounded-xl p-4 text-center text-muted-foreground text-sm">
              No ERC-20 tokens added yet.{' '}
              <button
                className="text-primary underline underline-offset-2"
                onClick={() => navigate({ to: '/tokens' })}
              >
                Add tokens
              </button>{' '}
              to track ERC-20 balances.
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate({ to: '/send' })}
              className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl p-4 hover:opacity-90 transition-opacity"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span className="font-medium">Send</span>
            </button>
            <button
              onClick={() => navigate({ to: '/networks' })}
              className="flex items-center gap-3 bg-card border border-border text-foreground rounded-xl p-4 hover:bg-muted transition-colors"
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span className="font-medium">Receive</span>
            </button>
            <button
              onClick={() => navigate({ to: '/history' })}
              className="flex items-center gap-3 bg-card border border-border text-foreground rounded-xl p-4 hover:bg-muted transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">History</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
