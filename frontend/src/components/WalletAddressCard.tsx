import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { truncateAddress } from '@/utils/addressDerivation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WalletAddressCardProps {
  label: string;
  address: string;
  icon?: React.ReactNode;
  badgeColor?: string;
}

export default function WalletAddressCard({
  label,
  address,
  icon,
  badgeColor = 'bg-primary/20 text-primary',
}: WalletAddressCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 border border-white/10 bg-white/5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-sm text-foreground/80 truncate flex-1 cursor-default select-all">
                {truncateAddress(address)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs break-all font-mono text-xs">
              {address}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <button
          onClick={handleCopy}
          className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-foreground/60 hover:text-foreground"
          title="Copy address"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      <p className="text-xs text-foreground/40 leading-relaxed">
        {label === 'ICP Address'
          ? 'Use this address to receive ICP tokens on the Internet Computer.'
          : 'Use this address to receive tokens on EVM-compatible chains (Ethereum, BSC, etc.).'}
      </p>
    </div>
  );
}
