import React, { useEffect, useState } from 'react';
import { Globe, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { deriveICPAddress, deriveEVMAddress, truncateAddress } from '@/utils/addressDerivation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Network {
  id: string;
  name: string;
  symbol: string;
  type: 'ICP' | 'EVM';
  chainId: string;
  rpc?: string;
  explorer?: string;
  color: string;
}

const NETWORKS: Network[] = [
  {
    id: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    type: 'ICP',
    chainId: 'icp',
    explorer: 'https://dashboard.internetcomputer.org',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'EVM',
    chainId: '1',
    rpc: 'https://mainnet.infura.io',
    explorer: 'https://etherscan.io',
    color: 'bg-purple-500/20 text-purple-400',
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    type: 'EVM',
    chainId: '56',
    rpc: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    color: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    type: 'EVM',
    chainId: '137',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    color: 'bg-violet-500/20 text-violet-400',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB',
    type: 'EVM',
    chainId: '42161',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    color: 'bg-cyan-500/20 text-cyan-400',
  },
];

function CopyAddressButton({ address, label }: { address: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success(`${label} address copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors text-foreground/50 hover:text-foreground"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function NetworksPage() {
  const { identity } = useInternetIdentity();
  const [icpAddress, setIcpAddress] = useState<string>('');
  const [evmAddress, setEvmAddress] = useState<string>('');

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

  const getAddressForNetwork = (network: Network): string => {
    if (network.type === 'ICP') return icpAddress;
    return evmAddress;
  };

  const isAuthenticated = !!identity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Networks</h1>
          <p className="text-foreground/60 mt-0.5">Supported blockchain networks and your associated addresses</p>
        </div>
      </div>

      {/* Network Cards */}
      <div className="space-y-3">
        {NETWORKS.map((network) => {
          const address = getAddressForNetwork(network);
          return (
            <div
              key={network.id}
              className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Network Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${network.color}`}>
                    {network.symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{network.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${network.color}`}>
                        {network.type}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/50">
                      {network.type === 'ICP' ? 'Chain: Internet Computer' : `Chain ID: ${network.chainId}`}
                    </p>
                  </div>
                </div>

                {/* Associated Address */}
                {isAuthenticated && address ? (
                  <div className="flex items-center gap-2 min-w-0 sm:max-w-xs">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/40 mb-0.5">Your Address</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-mono text-xs text-foreground/70 truncate cursor-default">
                              {truncateAddress(address, 10, 6)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs break-all font-mono text-xs">
                            {address}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <CopyAddressButton address={address} label={network.name} />
                  </div>
                ) : isAuthenticated ? (
                  <div className="text-xs text-foreground/30 italic">Deriving address...</div>
                ) : (
                  <div className="text-xs text-foreground/30 italic">Login to see your address</div>
                )}

                {/* Explorer Link */}
                {network.explorer && (
                  <a
                    href={network.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Explorer ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 text-sm text-foreground/60">
        <p className="font-medium text-foreground/80 mb-1">About your addresses</p>
        <p>
          Your ICP address is your Internet Identity principal. Your EVM address is deterministically derived from your principal — it is consistent across all EVM-compatible networks and does not require a separate private key.
        </p>
      </div>
    </div>
  );
}
