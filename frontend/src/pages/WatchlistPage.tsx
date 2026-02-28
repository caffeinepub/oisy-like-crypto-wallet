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
import {
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Tag,
  Loader2,
} from 'lucide-react';
import {
  loadWatchlist,
  saveWatchlist,
  loadNetworks,
  type WatchlistEntry,
  type NetworkConfig,
  generateId,
  shortAddress,
  formatTimestamp,
} from '../lib/walletStorage';

export default function WatchlistPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? '';

  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WatchlistEntry | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({ address: '', label: '', networkId: '', balance: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (principal) {
      setEntries(loadWatchlist(principal));
      setNetworks(loadNetworks(principal));
    }
  }, [principal]);

  const persist = (updated: WatchlistEntry[]) => {
    setEntries(updated);
    if (principal) saveWatchlist(principal, updated);
  };

  const copyAddress = async (id: string, address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    // Simulate balance refresh (in a real app, this would call an RPC endpoint)
    await new Promise(r => setTimeout(r, 1200));
    const updated = entries.map(e =>
      e.id === id
        ? { ...e, lastUpdated: Date.now(), balance: e.balance || '0.000' }
        : e
    );
    persist(updated);
    setRefreshingId(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.address.trim()) errors.address = 'Address is required';
    else if (form.address.trim().length < 10) errors.address = 'Enter a valid address';
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
    const entry: WatchlistEntry = {
      id: generateId(),
      address: form.address.trim(),
      label: form.label.trim(),
      balance: form.balance.trim() || '—',
      networkId: form.networkId,
      lastUpdated: form.balance ? Date.now() : null,
    };
    persist([...entries, entry]);
    setSaving(false);
    setAddOpen(false);
    setForm({ address: '', label: '', networkId: '', balance: '' });
    setFormErrors({});
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    persist(entries.filter(e => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const getNetwork = (id: string) => networks.find(n => n.id === id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'oklch(0.95 0.01 240)' }}>Watchlist</h1>
          <p className="text-sm" style={{ color: 'oklch(0.55 0.02 240)' }}>
            Monitor wallet addresses and track balances
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2"
          style={{ background: 'oklch(0.78 0.18 185)', color: 'oklch(0.08 0.01 240)' }}
        >
          <Plus className="w-4 h-4" />
          Add Address
        </Button>
      </div>

      {entries.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Eye className="w-12 h-12 mx-auto mb-4" style={{ color: 'oklch(0.35 0.02 240)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'oklch(0.70 0.01 240)' }}>
            No addresses watched
          </h3>
          <p className="text-sm mb-4" style={{ color: 'oklch(0.50 0.02 240)' }}>
            Add wallet addresses to monitor their balances
          </p>
          <Button
            onClick={() => setAddOpen(true)}
            style={{ background: 'oklch(0.78 0.18 185)', color: 'oklch(0.08 0.01 240)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const net = getNetwork(entry.networkId);
            const isRefreshing = refreshingId === entry.id;
            return (
              <GlassCard key={entry.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: 'oklch(0.70 0.18 75 / 0.12)',
                        border: '1px solid oklch(0.70 0.18 75 / 0.25)',
                      }}
                    >
                      <Eye className="w-4.5 h-4.5" style={{ color: 'oklch(0.70 0.18 75)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {entry.label && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" style={{ color: 'oklch(0.78 0.18 185)' }} />
                            <span className="text-sm font-semibold" style={{ color: 'oklch(0.90 0.01 240)' }}>
                              {entry.label}
                            </span>
                          </div>
                        )}
                        {net && (
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
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm font-mono truncate" style={{ color: 'oklch(0.65 0.02 240)' }}>
                          {shortAddress(entry.address, 8)}
                        </span>
                        <button
                          onClick={() => copyAddress(entry.id, entry.address)}
                          className="p-0.5 rounded flex-shrink-0"
                          style={{ color: copiedId === entry.id ? 'oklch(0.72 0.18 145)' : 'oklch(0.45 0.02 240)' }}
                        >
                          {copiedId === entry.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>Balance: </span>
                          <span className="text-sm font-semibold" style={{ color: 'oklch(0.85 0.01 240)' }}>
                            {isRefreshing ? (
                              <span className="shimmer inline-block w-16 h-4 rounded" />
                            ) : (
                              entry.balance
                            )}
                          </span>
                        </div>
                        {entry.lastUpdated && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" style={{ color: 'oklch(0.45 0.02 240)' }} />
                            <span className="text-xs" style={{ color: 'oklch(0.45 0.02 240)' }}>
                              {formatTimestamp(entry.lastUpdated)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRefresh(entry.id)}
                      disabled={isRefreshing}
                      className="gap-1.5 text-xs"
                      style={{
                        borderColor: 'oklch(0.28 0.015 240)',
                        color: 'oklch(0.65 0.02 240)',
                        background: 'transparent',
                      }}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteTarget(entry)}
                      className="w-8 h-8"
                      style={{ color: 'oklch(0.50 0.02 240)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add Address Modal */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setFormErrors({}); }}>
        <DialogContent style={{ background: 'oklch(0.16 0.01 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>Add Address to Watchlist</DialogTitle>
            <DialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              Monitor a wallet address and track its balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Wallet Address *</Label>
              <Input
                value={form.address}
                onChange={(e) => { setForm(p => ({ ...p, address: e.target.value })); setFormErrors(p => ({ ...p, address: '' })); }}
                placeholder="0x... or principal ID"
                className="font-mono text-sm"
                style={{
                  background: 'oklch(0.14 0.01 240)',
                  borderColor: formErrors.address ? 'oklch(0.60 0.22 25)' : 'oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />
              {formErrors.address && <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>{formErrors.address}</p>}
            </div>

            <div className="space-y-1">
              <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Label (optional)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. My Cold Wallet"
                style={{
                  background: 'oklch(0.14 0.01 240)',
                  borderColor: 'oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />
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

            <div className="space-y-1">
              <Label style={{ color: 'oklch(0.80 0.01 240)' }}>Known Balance (optional)</Label>
              <Input
                value={form.balance}
                onChange={(e) => setForm(p => ({ ...p, balance: e.target.value }))}
                placeholder="e.g. 1.234 ETH"
                style={{
                  background: 'oklch(0.14 0.01 240)',
                  borderColor: 'oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />
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
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent style={{ background: 'oklch(0.16 0.01 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>Remove Address</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              Remove{' '}
              <strong style={{ color: 'oklch(0.85 0.01 240)' }}>
                {deleteTarget?.label || shortAddress(deleteTarget?.address ?? '')}
              </strong>{' '}
              from your watchlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderColor: 'oklch(0.28 0.015 240)', color: 'oklch(0.65 0.02 240)', background: 'transparent' }}>
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
