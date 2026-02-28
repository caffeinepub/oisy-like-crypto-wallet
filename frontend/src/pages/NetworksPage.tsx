import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { deriveICPAddress, deriveEVMAddress, truncateAddress } from '../utils/addressDerivation';
import { getNetworks, getTokensByNetwork, type NetworkConfig } from '../lib/walletStorage';
import { Copy, Check, ExternalLink, Coins } from 'lucide-react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
      title="Copy address"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function NetworkCard({
  network,
  address,
}: {
  network: NetworkConfig;
  address: string;
}) {
  const tokens = getTokensByNetwork(network.id);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{network.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                network.type === 'ICP'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              {network.type}
            </span>
            {network.chainId && (
              <span className="text-xs text-muted-foreground">Chain ID: {network.chainId}</span>
            )}
          </div>
        </div>
        {network.explorerUrl && (
          <a
            href={network.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Open explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Address */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">Your Address</p>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm text-foreground break-all">{address || '—'}</span>
          {address && <CopyButton text={address} />}
        </div>
      </div>

      {/* ERC-20 Tokens (EVM only) */}
      {network.type === 'EVM' && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Coins className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              ERC-20 Tokens
            </p>
          </div>
          {tokens.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No custom tokens added</p>
          ) : (
            <div className="space-y-2">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground">{token.symbol}</span>
                    <p className="text-xs text-muted-foreground font-mono">
                      {truncateAddress(token.contractAddress)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{token.balance ?? '0'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworksPage() {
  const { identity } = useInternetIdentity();
  const networks = getNetworks();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Networks</h1>
          <p className="text-muted-foreground mt-1">
            Supported blockchain networks and your derived addresses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {networks.map((network) => (
            <NetworkCard
              key={network.id}
              network={network}
              address={network.type === 'ICP' ? icpAddress : evmAddress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
