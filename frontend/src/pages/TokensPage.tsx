import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import GlassCard from '../components/GlassCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Plus, Trash2, Copy, Check, Loader2, Search } from 'lucide-react';
import {
  loadTokens,
  saveTokens,
  loadNetworks,
  type TokenConfig,
  type NetworkConfig,
  generateId,
  shortAddress,
  formatTimestamp,
} from '../lib/walletStorage';

const ERC20_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

export default function TokensPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? '';

  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TokenConfig | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contractAddress: '',
    symbol: '',
    name: '',
    decimals: '18',
    networkId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (principal) {
      setTokens(loadTokens(principal));
      setNetworks(loadNetworks(principal));
    }
  }, [principal]);

  const persist = (updated: TokenConfig[]) => {
    setTokens(updated);
    if (principal) saveTokens(principal, updated);
  };

  const copyAddress = async (id: string, address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!ERC20_ADDRESS_REGEX.test(form.contractAddress)) {
      errors.contractAddress = 'Invalid address (must be 0x followed by 40 hex characters)';
    }
    if (!form.symbol.trim()) errors.symbol = 'Symbol is required';
    if (!form.name.trim()) errors.name = 'Token name is required';
    const dec = parseInt(form.decimals);
    if (isNaN(dec) || dec < 0 || dec > 18) errors.decimals = 'Decimals must be 0–18';
    if (!form.networkId) errors.networkId = 'Select a network';
    return errors;
  };

  const handleAdd = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const token: TokenConfig = {
      id: generateId(),
      contractAddress: form.contractAddress.trim(),
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
      decimals: parseInt(form.decimals),
      networkId: form.networkId,
      addedAt: Date.now(),
    };
    persist([...tokens, token]);
    setSaving(false);
    setAddOpen(false);
    setForm({ contractAddress: '', symbol: '', name: '', decimals: '18', networkId: '' });
    setFormErrors({});
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    persist(tokens.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const filtered = tokens.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.contractAddress.toLowerCase().includes(search.toLowerCase())
  );

  const getNetwork = (id: string) => networks.find(n => n.id === id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'oklch(0.95 0.01 240)' }}>Tokens</h1>
          <p className="text-sm" style={{ color: 'oklch(0.55 0.02 240)' }}>
            Manage your ERC-20 and custom tokens
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2"
          style={{ background: 'oklch(0.78 0.18 185)', color: 'oklch(0.08 0.01 240)' }}
        >
          <Plus className="w-4 h-4" />
          Add Token
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'oklch(0.50 0.02 240)' }} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tokens..."
          className="pl-9"
          style={{
            background: 'oklch(0.16 0.01 240)',
            borderColor: 'oklch(0.28 0.015 240)',
            color: 'oklch(0.90 0.01 240)',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Coins className="w-12 h-12 mx-auto mb-4" style={{ color: 'oklch(0.35 0.02 240)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'oklch(0.70 0.01 240)' }}>
            {search ? 'No tokens found' : 'No tokens added yet'}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'oklch(0.50 0.02 240)' }}>
            {search ? 'Try a different search term' : 'Add your first ERC-20 token to get started'}
          </p>
          {!search && (
            <Button
              onClick={() => setAddOpen(true)}
              style={{ background: 'oklch(0.78 0.18 185)', color: 'oklch(0.08 0.01 240)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Token
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((token) => {
            const net = getNetwork(token.networkId);
            return (
              <GlassCard key={token.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{
                        background: 'oklch(0.72 0.20 140 / 0.15)',
                        border: '1px solid oklch(0.72 0.20 140 / 0.3)',
                        color: 'oklch(0.72 0.20 140)',
                      }}
                    >
                      {token.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'oklch(0.90 0.01 240)' }}>{token.name}</h3>
                      <p className="text-sm" style={{ color: 'oklch(0.55 0.02 240)' }}>{token.symbol}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteTarget(token)}
                    className="w-8 h-8 hover:bg-destructive/10"
                    style={{ color: 'oklch(0.55 0.02 240)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>Contract</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono" style={{ color: 'oklch(0.70 0.01 240)' }}>
                        {shortAddress(token.contractAddress)}
                      </span>
                      <button
                        onClick={() => copyAddress(token.id, token.contractAddress)}
                        className="p-0.5 rounded transition-colors"
                        style={{ color: copiedId === token.id ? 'oklch(0.72 0.18 145)' : 'oklch(0.50 0.02 240)' }}
                      >
                        {copiedId === token.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>Decimals</span>
                    <span className="text-xs font-mono" style={{ color: 'oklch(0.70 0.01 240)' }}>{token.decimals}</span>
                  </div>
                  {net && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>Network</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${net.color.replace(')', ' / 0.12)')}`,
                          color: net.color,
                          border: `1px solid ${net.color.replace(')', ' / 0.25)')}`,
                        }}
                      >
                        {net.symbol}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>Added</span>
                    <span className="text-xs" style={{ color: 'oklch(0.55 0.02 240)' }}>{formatTimestamp(token.addedAt)}</span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add Token Modal */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setFormErrors({}); }}>
        <DialogContent style={{ background: 'oklch(0.16 0.01 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>Add ERC-20 Token</DialogTitle>
            <DialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              Enter the token contract details to add it to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Contract Address *</Label>
              <Input
                value={form.contractAddress}
                onChange={(e) => { setForm(p => ({ ...p, contractAddress: e.target.value })); setFormErrors(p => ({ ...p, contractAddress: '' })); }}
                placeholder="0x..."
                className="font-mono text-sm"
                style={{
                  background: 'oklch(0.14 0.01 240)',
                  borderColor: formErrors.contractAddress ? 'oklch(0.60 0.22 25)' : 'oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />
              {formErrors.contractAddress && <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>{formErrors.contractAddress}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Symbol *</Label>
                <Input
                  value={form.symbol}
                  onChange={(e) => { setForm(p => ({ ...p, symbol: e.target.value })); setFormErrors(p => ({ ...p, symbol: '' })); }}
                  placeholder="USDT"
                  style={{
                    background: 'oklch(0.14 0.01 240)',
                    borderColor: formErrors.symbol ? 'oklch(0.60 0.22 25)' : 'oklch(0.28 0.015 240)',
                    color: 'oklch(0.90 0.01 240)',
                  }}
                />
                {formErrors.symbol && <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>{formErrors.symbol}</p>}
              </div>
              <div className="space-y-1">
                <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Decimals *</Label>
                <Input
                  value={form.decimals}
                  onChange={(e) => { setForm(p => ({ ...p, decimals: e.target.value })); setFormErrors(p => ({ ...p, decimals: '' })); }}
                  placeholder="18"
                  type="number"
                  min="0"
                  max="18"
                  style={{
                    background: 'oklch(0.14 0.01 240)',
                    borderColor: formErrors.decimals ? 'oklch(0.60 0.22 25)' : 'oklch(0.28 0.015 240)',
                    color: 'oklch(0.90 0.01 240)',
                  }}
                />
                {formErrors.decimals && <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>{formErrors.decimals}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Token Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => { setForm(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: '' })); }}
                placeholder="Tether USD"
                style={{
                  background: 'oklch(0.14 0.01 240)',
                  borderColor: formErrors.name ? 'oklch(0.60 0.22 25)' : 'oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />
              {formErrors.name && <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Network *</Label>
              <Select
                value={form.networkId}
                onValueChange={(v) => { setForm(p => ({ ...p, networkId: v })); setFormErrors(p => ({ ...p, networkId: '' })); }}
              >
                <SelectTrigger
                  style={{
                    background: 'oklch(0.14 0.01 240)',
                    borderColor: formErrors.networkId ? 'oklch(0.60 0.22 25)' : 'oklch(0.28 0.015 240)',
                    color: 'oklch(0.90 0.01 240)',
                  }}
                >
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent style={{ background: 'oklch(0.18 0.012 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
                  {networks.map(n => (
                    <SelectItem key={n.id} value={n.id} style={{ color: 'oklch(0.85 0.01 240)' }}>
                      {n.name} ({n.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.networkId && <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>{formErrors.networkId}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAddOpen(false); setFormErrors({}); }}
              style={{ borderColor: 'oklch(0.28 0.015 240)', color: 'oklch(0.65 0.02 240)', background: 'transparent' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving}
              style={{ background: 'oklch(0.78 0.18 185)', color: 'oklch(0.08 0.01 240)' }}
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent style={{ background: 'oklch(0.16 0.01 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>Remove Token</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              Remove <strong style={{ color: 'oklch(0.85 0.01 240)' }}>{deleteTarget?.name}</strong> ({deleteTarget?.symbol}) from your token list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{ borderColor: 'oklch(0.28 0.015 240)', color: 'oklch(0.65 0.02 240)', background: 'transparent' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ background: 'oklch(0.60 0.22 25)', color: 'oklch(0.98 0 0)' }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
