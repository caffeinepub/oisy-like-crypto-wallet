import { useEffect, useState, useCallback } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { deriveICPAddress, deriveEVMAddress, truncateAddress } from '../utils/addressDerivation';
import {
  getNetworks,
  getTokensByNetwork,
  getWhitelistEntries,
  saveTransaction,
  validateIcpNativeAddress,
  validateIcpTokenAddress,
  validateEvmAddress,
  type NetworkConfig,
  type TokenConfig,
  type WhitelistEntry,
  generateId,
} from '../lib/walletStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CheckCircle, ArrowLeft, Send, BookUser, ChevronDown, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

type Step = 'form' | 'confirm' | 'success';

// ICP address sub-type for when ICP network is selected
type IcpAddressSubType = 'icp-native' | 'icp-token';

interface FormState {
  networkId: string;
  assetType: 'native' | 'erc20';
  tokenId: string;
  to: string;
  amount: string;
  icpAddressSubType: IcpAddressSubType;
}

function TypeBadge({ type }: { type: 'icp-native' | 'icp-token' | 'evm' }) {
  if (type === 'icp-native') {
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
        style={{
          background: 'oklch(0.35 0.10 185 / 0.25)',
          color: 'oklch(0.78 0.18 185)',
        }}
      >
        ICP Native
      </span>
    );
  }
  if (type === 'icp-token') {
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
        style={{
          background: 'oklch(0.35 0.12 200 / 0.25)',
          color: 'oklch(0.75 0.18 200)',
        }}
      >
        ICP Token
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
      style={{
        background: 'oklch(0.35 0.12 280 / 0.25)',
        color: 'oklch(0.75 0.15 280)',
      }}
    >
      EVM
    </span>
  );
}

interface WhitelistPickerProps {
  networkType: 'ICP' | 'EVM' | undefined;
  icpSubType: IcpAddressSubType;
  onSelect: (entry: WhitelistEntry) => void;
}

function WhitelistPicker({ networkType, icpSubType, onSelect }: WhitelistPickerProps) {
  const [open, setOpen] = useState(false);

  const allEntries = getWhitelistEntries();
  const filtered = allEntries.filter((e) => {
    if (!networkType) return false;
    if (networkType === 'EVM') return e.type === 'evm';
    // ICP: filter by sub-type
    return e.type === icpSubType;
  });

  const handleSelect = (entry: WhitelistEntry) => {
    onSelect(entry);
    setOpen(false);
  };

  const subTypeLabel = networkType === 'ICP'
    ? (icpSubType === 'icp-native' ? 'ICP Native' : 'ICP Token')
    : networkType ?? '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'oklch(0.78 0.18 185 / 0.12)',
            border: '1px solid oklch(0.78 0.18 185 / 0.3)',
            color: 'oklch(0.78 0.18 185)',
          }}
          title="Select from whitelist"
        >
          <BookUser className="w-3.5 h-3.5" />
          Whitelist
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-0"
        style={{
          background: 'oklch(0.18 0.012 240)',
          border: '1px solid oklch(0.28 0.015 240)',
        }}
      >
        <div
          className="px-3 py-2 border-b text-xs font-medium"
          style={{
            borderColor: 'oklch(0.25 0.015 240)',
            color: 'oklch(0.55 0.02 240)',
          }}
        >
          {networkType ? `${subTypeLabel} Whitelist Addresses` : 'Select a network first'}
        </div>

        {!networkType ? (
          <div className="px-3 py-4 text-center text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>
            Please select a network first.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-4 text-center space-y-2">
            <p className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>
              No {subTypeLabel} whitelist addresses found.
            </p>
            <Link
              to="/whitelist"
              className="inline-flex items-center gap-1 text-xs hover:underline"
              style={{ color: 'oklch(0.78 0.18 185)' }}
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="w-3 h-3" />
              Manage Whitelist
            </Link>
          </div>
        ) : (
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleSelect(entry)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
              >
                <TypeBadge type={entry.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'oklch(0.90 0.01 240)' }}>
                    {entry.label}
                  </p>
                  <p className="text-xs font-mono truncate" style={{ color: 'oklch(0.50 0.02 240)' }}>
                    {entry.address.length > 20
                      ? `${entry.address.slice(0, 10)}...${entry.address.slice(-8)}`
                      : entry.address}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function SendPage() {
  const { identity } = useInternetIdentity();
  const networks = getNetworks();

  const [icpAddress, setIcpAddress] = useState('');
  const [evmAddress, setEvmAddress] = useState('');
  const [selectedWhitelistLabel, setSelectedWhitelistLabel] = useState('');
  const [addressError, setAddressError] = useState('');

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

  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormState>({
    networkId: '',
    assetType: 'native',
    tokenId: '',
    to: '',
    amount: '',
    icpAddressSubType: 'icp-native',
  });

  const selectedNetwork: NetworkConfig | undefined = networks.find((n) => n.id === form.networkId);
  const fromAddress = selectedNetwork?.type === 'ICP' ? icpAddress : evmAddress;

  const erc20Tokens: TokenConfig[] = form.networkId ? getTokensByNetwork(form.networkId) : [];
  const selectedToken: TokenConfig | undefined = erc20Tokens.find((t) => t.id === form.tokenId);

  const assetSymbol =
    form.assetType === 'erc20' && selectedToken
      ? selectedToken.symbol
      : selectedNetwork?.symbol ?? '';

  // Validate recipient address based on network type and ICP sub-type
  const validateRecipient = (address: string): string => {
    if (!address.trim()) return '';
    if (!selectedNetwork) return '';
    if (selectedNetwork.type === 'EVM') {
      return validateEvmAddress(address) ? '' : 'Invalid EVM address. Must be 0x followed by 40 hex characters.';
    }
    if (form.icpAddressSubType === 'icp-native') {
      return validateIcpNativeAddress(address) ? '' : 'Invalid ICP Native address. Must be a 64-character hex Account ID.';
    }
    return validateIcpTokenAddress(address) ? '' : 'Invalid ICP Token address. Must be a valid Principal ID (e.g. xxxxx-xxxxx-cai).';
  };

  const isFormValid =
    !!form.networkId &&
    !!form.to &&
    !!form.amount &&
    !addressError &&
    (form.assetType === 'native' || (form.assetType === 'erc20' && !!form.tokenId));

  const handleNetworkChange = (networkId: string) => {
    setForm((f) => ({ ...f, networkId, assetType: 'native', tokenId: '', to: '', icpAddressSubType: 'icp-native' }));
    setSelectedWhitelistLabel('');
    setAddressError('');
  };

  const handleIcpSubTypeChange = (subType: IcpAddressSubType) => {
    setForm((f) => ({ ...f, icpAddressSubType: subType, to: '' }));
    setSelectedWhitelistLabel('');
    setAddressError('');
  };

  const handleAssetChange = (value: string) => {
    if (value === 'native') {
      setForm((f) => ({ ...f, assetType: 'native', tokenId: '' }));
    } else {
      setForm((f) => ({ ...f, assetType: 'erc20', tokenId: value }));
    }
  };

  const handleWhitelistSelect = useCallback((entry: WhitelistEntry) => {
    setForm((f) => ({ ...f, to: entry.address }));
    setSelectedWhitelistLabel(entry.label);
    setAddressError('');
  }, []);

  const handleToChange = (value: string) => {
    setForm((f) => ({ ...f, to: value }));
    if (selectedWhitelistLabel) setSelectedWhitelistLabel('');
    setAddressError(validateRecipient(value));
  };

  const handleSend = () => {
    if (!selectedNetwork) return;
    const tx = {
      id: generateId(),
      timestamp: Date.now(),
      network: selectedNetwork.name,
      networkId: selectedNetwork.id,
      from: fromAddress,
      to: form.to,
      recipient: form.to,
      amount: form.amount,
      symbol: assetSymbol,
      token: assetSymbol,
      status: 'pending' as const,
      ...(form.assetType === 'erc20' && selectedToken
        ? {
            tokenSymbol: selectedToken.symbol,
            tokenContractAddress: selectedToken.contractAddress,
          }
        : {}),
      ...(selectedNetwork.type === 'ICP'
        ? { icpAddressType: form.icpAddressSubType }
        : {}),
    };
    saveTransaction(tx);
    setStep('success');
  };

  const handleReset = () => {
    setForm({ networkId: '', assetType: 'native', tokenId: '', to: '', amount: '', icpAddressSubType: 'icp-native' });
    setSelectedWhitelistLabel('');
    setAddressError('');
    setStep('form');
  };

  const recipientPlaceholder = () => {
    if (!selectedNetwork) return 'Address';
    if (selectedNetwork.type === 'EVM') return '0x...';
    return form.icpAddressSubType === 'icp-native'
      ? '64-character hex Account ID'
      : 'Principal ID (xxxxx-xxxxx-...)';
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Transaction Submitted</h2>
          <p className="text-muted-foreground">
            Your send intent has been recorded. The transaction is pending.
          </p>
          <div className="bg-muted rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">{selectedNetwork?.name}</span>
            </div>
            {selectedNetwork?.type === 'ICP' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address Type</span>
                <span className="font-medium">
                  {form.icpAddressSubType === 'icp-native' ? 'Native (Account ID)' : 'Token (Principal ID)'}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset</span>
              <span className="font-medium">{assetSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">
                {form.amount} {assetSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span className="font-mono font-medium">{truncateAddress(form.to)}</span>
            </div>
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full space-y-6">
          <div>
            <button
              onClick={() => setStep('form')}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-2xl font-bold text-foreground">Confirm Transaction</h2>
            <p className="text-muted-foreground text-sm mt-1">Review the details before sending</p>
          </div>

          <div className="bg-muted rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">{selectedNetwork?.name}</span>
            </div>
            {selectedNetwork?.type === 'ICP' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address Type</span>
                <span className="font-medium">
                  {form.icpAddressSubType === 'icp-native' ? 'Native (Account ID)' : 'Token (Principal ID)'}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset</span>
              <span className="font-medium">{assetSymbol}</span>
            </div>
            {form.assetType === 'erc20' && selectedToken && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-mono font-medium text-xs">
                  {truncateAddress(selectedToken.contractAddress)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span className="font-mono font-medium text-xs">{truncateAddress(fromAddress)}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">To</span>
              <div className="text-right">
                <span className="font-mono font-medium text-xs block">{truncateAddress(form.to)}</span>
                {selectedWhitelistLabel && (
                  <span className="text-xs" style={{ color: 'oklch(0.78 0.18 185)' }}>
                    {selectedWhitelistLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">
                {form.amount} {assetSymbol}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Confirm Send
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Form step
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Send</h1>
          <p className="text-muted-foreground text-sm mt-1">Transfer assets to another address</p>
        </div>

        <div className="space-y-4">
          {/* Network */}
          <div className="space-y-1.5">
            <Label>Network</Label>
            <Select value={form.networkId} onValueChange={handleNetworkChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ICP Address Sub-Type selector */}
          {selectedNetwork?.type === 'ICP' && (
            <div className="space-y-1.5">
              <Label>ICP Address Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleIcpSubTypeChange('icp-native')}
                  className="flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: form.icpAddressSubType === 'icp-native'
                      ? 'oklch(0.35 0.10 185 / 0.25)'
                      : 'oklch(0.14 0.010 240)',
                    border: form.icpAddressSubType === 'icp-native'
                      ? '1px solid oklch(0.78 0.18 185 / 0.5)'
                      : '1px solid oklch(0.28 0.015 240)',
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: form.icpAddressSubType === 'icp-native'
                        ? 'oklch(0.78 0.18 185)'
                        : 'oklch(0.65 0.02 240)',
                    }}
                  >
                    Native ICP
                  </span>
                  <span className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.02 240)' }}>
                    Account ID (64-char hex)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleIcpSubTypeChange('icp-token')}
                  className="flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: form.icpAddressSubType === 'icp-token'
                      ? 'oklch(0.35 0.12 200 / 0.25)'
                      : 'oklch(0.14 0.010 240)',
                    border: form.icpAddressSubType === 'icp-token'
                      ? '1px solid oklch(0.75 0.18 200 / 0.5)'
                      : '1px solid oklch(0.28 0.015 240)',
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: form.icpAddressSubType === 'icp-token'
                        ? 'oklch(0.75 0.18 200)'
                        : 'oklch(0.65 0.02 240)',
                    }}
                  >
                    ICRC Token
                  </span>
                  <span className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.02 240)' }}>
                    Principal ID (ICRC-1/2)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Asset / Token selection */}
          {form.networkId && (
            <div className="space-y-1.5">
              <Label>Asset</Label>
              <Select
                value={form.assetType === 'native' ? 'native' : form.tokenId}
                onValueChange={handleAssetChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">
                    {selectedNetwork?.symbol ?? 'Native'} (Native)
                  </SelectItem>
                  {selectedNetwork?.type === 'EVM' &&
                    erc20Tokens.map((token) => (
                      <SelectItem key={token.id} value={token.id}>
                        {token.symbol} — {truncateAddress(token.contractAddress)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* From address (read-only) */}
          {form.networkId && (
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input value={fromAddress} readOnly className="font-mono text-xs bg-muted" />
            </div>
          )}

          {/* To address with whitelist picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>To Address</Label>
              <WhitelistPicker
                networkType={selectedNetwork?.type}
                icpSubType={form.icpAddressSubType}
                onSelect={handleWhitelistSelect}
              />
            </div>
            <Input
              placeholder={recipientPlaceholder()}
              value={form.to}
              onChange={(e) => handleToChange(e.target.value)}
              style={addressError ? { borderColor: 'oklch(0.60 0.18 25 / 0.6)' } : {}}
            />
            {selectedWhitelistLabel && !addressError && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.78 0.18 185)' }}>
                <BookUser className="w-3 h-3" />
                {selectedWhitelistLabel}
              </p>
            )}
            {addressError && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.65 0.20 25)' }}>
                <AlertCircle className="w-3 h-3" />
                {addressError}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Amount {assetSymbol ? `(${assetSymbol})` : ''}</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
        </div>

        <Button className="w-full" disabled={!isFormValid} onClick={() => setStep('confirm')}>
          <Send className="w-4 h-4 mr-2" />
          Review Transaction
        </Button>
      </div>
    </div>
  );
}
