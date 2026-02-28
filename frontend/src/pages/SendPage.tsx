import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, AlertCircle, Loader2, Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { deriveICPAddress, deriveEVMAddress } from '@/utils/addressDerivation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type NetworkType = 'ICP' | 'EVM';

interface NetworkOption {
  id: string;
  name: string;
  symbol: string;
  type: NetworkType;
}

const NETWORK_OPTIONS: NetworkOption[] = [
  { id: 'icp', name: 'Internet Computer', symbol: 'ICP', type: 'ICP' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', type: 'EVM' },
  { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', type: 'EVM' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', type: 'EVM' },
  { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ARB', type: 'EVM' },
];

type Step = 'form' | 'confirm' | 'success';

interface TransactionRecord {
  id: string;
  network: string;
  token: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

export default function SendPage() {
  const { identity } = useInternetIdentity();

  const [step, setStep] = useState<Step>('form');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption>(NETWORK_OPTIONS[0]);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ICP');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derive addresses from identity
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

  // Auto-populate from address when network or addresses change
  useEffect(() => {
    if (selectedNetwork.type === 'ICP') {
      setFromAddress(icpAddress);
      setToken(selectedNetwork.symbol);
    } else {
      setFromAddress(evmAddress);
      setToken(selectedNetwork.symbol);
    }
  }, [selectedNetwork, icpAddress, evmAddress]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!toAddress.trim()) newErrors.toAddress = 'Recipient address is required';
    if (!amount.trim()) newErrors.amount = 'Amount is required';
    else if (isNaN(Number(amount)) || Number(amount) <= 0) newErrors.amount = 'Enter a valid positive amount';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Simulate transaction submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Save to localStorage
      const record: TransactionRecord = {
        id: crypto.randomUUID(),
        network: selectedNetwork.name,
        token,
        from: fromAddress,
        to: toAddress,
        amount,
        timestamp: Date.now(),
        status: 'completed',
      };
      const existing = JSON.parse(localStorage.getItem('txHistory') || '[]');
      localStorage.setItem('txHistory', JSON.stringify([record, ...existing]));

      setStep('success');
      toast.success('Transaction submitted successfully!');
    } catch {
      toast.error('Transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setToAddress('');
    setAmount('');
    setErrors({});
  };

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="glass-card rounded-2xl p-8 border border-white/10 bg-white/5 backdrop-blur-md text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Transaction Submitted!</h2>
          <p className="text-foreground/60">
            Your transfer of <span className="text-foreground font-semibold">{amount} {token}</span> on{' '}
            <span className="text-foreground font-semibold">{selectedNetwork.name}</span> has been submitted.
          </p>
          <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-left space-y-1">
            <p className="text-xs text-foreground/40">To</p>
            <p className="font-mono text-xs text-foreground/70 break-all">{toAddress}</p>
          </div>
          <Button onClick={handleReset} className="w-full">
            Send Another
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="glass-card rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-foreground">Confirm Transaction</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-foreground/50">Network</span>
              <span className="text-foreground font-medium">{selectedNetwork.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-foreground/50">Token</span>
              <span className="text-foreground font-medium">{token}</span>
            </div>
            <div className="flex flex-col gap-1 py-2 border-b border-white/10">
              <span className="text-foreground/50">From</span>
              <span className="font-mono text-xs text-foreground/70 break-all">{fromAddress}</span>
            </div>
            <div className="flex flex-col gap-1 py-2 border-b border-white/10">
              <span className="text-foreground/50">To</span>
              <span className="font-mono text-xs text-foreground/70 break-all">{toAddress}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-foreground/50">Amount</span>
              <span className="text-foreground font-bold text-lg">{amount} {token}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('form')} className="flex-1" disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={handleConfirm} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirm Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Send className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Send</h1>
          <p className="text-foreground/60 mt-0.5">Transfer tokens to another address</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        {/* Network Selection */}
        <div className="space-y-2">
          <Label className="text-foreground/70">Network</Label>
          <div className="relative">
            <select
              value={selectedNetwork.id}
              onChange={(e) => {
                const net = NETWORK_OPTIONS.find((n) => n.id === e.target.value);
                if (net) setSelectedNetwork(net);
              }}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-md"
            >
              {NETWORK_OPTIONS.map((net) => (
                <option key={net.id} value={net.id} className="bg-background text-foreground">
                  {net.name} ({net.symbol})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
          </div>
        </div>

        {/* From Address (read-only, derived) */}
        <div className="space-y-2">
          <Label className="text-foreground/70">
            From Address
            <span className="ml-2 text-xs text-foreground/40">(your {selectedNetwork.type} address)</span>
          </Label>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs text-foreground/60 break-all min-h-[42px] flex items-center">
            {fromAddress || (
              <span className="text-foreground/30 italic">Login to see your address</span>
            )}
          </div>
        </div>

        {/* To Address */}
        <div className="space-y-2">
          <Label htmlFor="toAddress" className="text-foreground/70">Recipient Address</Label>
          <Input
            id="toAddress"
            value={toAddress}
            onChange={(e) => {
              setToAddress(e.target.value);
              if (errors.toAddress) setErrors((prev) => ({ ...prev, toAddress: '' }));
            }}
            placeholder={selectedNetwork.type === 'ICP' ? 'Enter ICP principal or account ID' : '0x...'}
            className="font-mono text-sm bg-white/5 border-white/10"
          />
          {errors.toAddress && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.toAddress}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-foreground/70">Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              placeholder="0.00"
              className="pr-16 bg-white/5 border-white/10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/50">
              {token}
            </span>
          </div>
          {errors.amount && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.amount}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={!identity}>
          {!identity ? (
            'Login to Send'
          ) : (
            <>
              Review Transaction
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
