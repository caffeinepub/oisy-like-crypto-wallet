import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import GlassCard from '../components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  History,
  Send,
  Search,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import {
  loadTransactions,
  saveTransactions,
  loadNetworks,
  type TransactionRecord,
  type NetworkConfig,
  shortAddress,
  formatTimestamp,
} from '../lib/walletStorage';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'failed';

function StatusBadge({ status }: { status: TransactionRecord['status'] }) {
  const config = {
    pending: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: 'Pending',
      className: 'badge-pending',
    },
    confirmed: {
      icon: <CheckCircle className="w-3 h-3" />,
      label: 'Confirmed',
      className: 'badge-success',
    },
    failed: {
      icon: <XCircle className="w-3 h-3" />,
      label: 'Failed',
      className: 'badge-warning',
    },
  };
  const { icon, label, className } = config[status];
  return (
    <span className={`${className} flex items-center gap-1`}>
      {icon}
      {label}
    </span>
  );
}

export default function TransactionHistoryPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? '';

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<TransactionRecord | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  useEffect(() => {
    if (principal) {
      setTransactions(loadTransactions(principal));
      setNetworks(loadNetworks(principal));
    }
  }, [principal]);

  const persist = (updated: TransactionRecord[]) => {
    setTransactions(updated);
    if (principal) saveTransactions(principal, updated);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    persist(transactions.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleClearAll = () => {
    persist([]);
    setClearAllOpen(false);
  };

  const getNetwork = (id: string): NetworkConfig | undefined => networks.find(n => n.id === id);

  const filtered = transactions.filter(tx => {
    const matchesSearch =
      !search ||
      tx.recipient.toLowerCase().includes(search.toLowerCase()) ||
      tx.token.toLowerCase().includes(search.toLowerCase()) ||
      tx.amount.includes(search);
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    confirmed: transactions.filter(t => t.status === 'confirmed').length,
    failed: transactions.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'oklch(0.95 0.01 240)' }}>
            Transaction History
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.55 0.02 240)' }}>
            All recorded send intents and their statuses
          </p>
        </div>
        {transactions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearAllOpen(true)}
            className="gap-1.5 text-xs"
            style={{
              borderColor: 'oklch(0.60 0.22 25 / 0.4)',
              color: 'oklch(0.65 0.20 25)',
              background: 'transparent',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['all', 'pending', 'confirmed', 'failed'] as StatusFilter[]).map((s) => {
          const labels = { all: 'Total', pending: 'Pending', confirmed: 'Confirmed', failed: 'Failed' };
          const colors = {
            all: 'oklch(0.78 0.18 185)',
            pending: 'oklch(0.72 0.15 220)',
            confirmed: 'oklch(0.72 0.18 145)',
            failed: 'oklch(0.70 0.18 75)',
          };
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: isActive ? `${colors[s].replace(')', ' / 0.15)')}` : 'oklch(0.16 0.01 240)',
                border: `1px solid ${isActive ? colors[s].replace(')', ' / 0.4)') : 'oklch(0.25 0.015 240)'}`,
              }}
            >
              <p className="text-lg font-bold" style={{ color: isActive ? colors[s] : 'oklch(0.80 0.01 240)' }}>
                {counts[s]}
              </p>
              <p className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>{labels[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'oklch(0.50 0.02 240)' }} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address, token, or amount..."
            className="pl-9"
            style={{
              background: 'oklch(0.16 0.01 240)',
              borderColor: 'oklch(0.28 0.015 240)',
              color: 'oklch(0.90 0.01 240)',
            }}
          />
        </div>
        <div className="flex items-center gap-1.5 px-3 rounded-lg"
          style={{ background: 'oklch(0.16 0.01 240)', border: '1px solid oklch(0.28 0.015 240)' }}>
          <Filter className="w-4 h-4" style={{ color: 'oklch(0.50 0.02 240)' }} />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger
              className="border-0 bg-transparent p-0 h-auto text-sm w-28"
              style={{ color: 'oklch(0.75 0.02 240)' }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: 'oklch(0.18 0.012 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
              <SelectItem value="all" style={{ color: 'oklch(0.85 0.01 240)' }}>All</SelectItem>
              <SelectItem value="pending" style={{ color: 'oklch(0.85 0.01 240)' }}>Pending</SelectItem>
              <SelectItem value="confirmed" style={{ color: 'oklch(0.85 0.01 240)' }}>Confirmed</SelectItem>
              <SelectItem value="failed" style={{ color: 'oklch(0.85 0.01 240)' }}>Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <History className="w-12 h-12 mx-auto mb-4" style={{ color: 'oklch(0.35 0.02 240)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'oklch(0.70 0.01 240)' }}>
            {search || statusFilter !== 'all' ? 'No matching transactions' : 'No transactions yet'}
          </h3>
          <p className="text-sm" style={{ color: 'oklch(0.50 0.02 240)' }}>
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Your transaction history will appear here after you send assets'}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => {
            const net = getNetwork(tx.networkId);
            return (
              <GlassCard key={tx.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: 'oklch(0.78 0.18 185 / 0.12)',
                      border: '1px solid oklch(0.78 0.18 185 / 0.25)',
                    }}
                  >
                    <Send className="w-4.5 h-4.5" style={{ color: 'oklch(0.78 0.18 185)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: 'oklch(0.90 0.01 240)' }}>
                          {tx.amount} {tx.token}
                        </span>
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
                      <StatusBadge status={tx.status} />
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <span className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>To: </span>
                        <span className="text-xs font-mono" style={{ color: 'oklch(0.65 0.02 240)' }}>
                          {shortAddress(tx.recipient, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: 'oklch(0.45 0.02 240)' }} />
                        <span className="text-xs" style={{ color: 'oklch(0.45 0.02 240)' }}>
                          {formatTimestamp(tx.timestamp)}
                        </span>
                      </div>
                    </div>

                    {tx.note && (
                      <p className="text-xs mt-1 italic" style={{ color: 'oklch(0.50 0.02 240)' }}>
                        "{tx.note}"
                      </p>
                    )}
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteTarget(tx)}
                    className="w-8 h-8 flex-shrink-0"
                    style={{ color: 'oklch(0.45 0.02 240)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Delete single */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent style={{ background: 'oklch(0.16 0.01 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              Remove this transaction record from your history? This cannot be undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all */}
      <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <AlertDialogContent style={{ background: 'oklch(0.16 0.01 240)', borderColor: 'oklch(0.28 0.015 240)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>Clear All Transactions</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              This will permanently delete all {transactions.length} transaction records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{ borderColor: 'oklch(0.28 0.015 240)', color: 'oklch(0.65 0.02 240)', background: 'transparent' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              style={{ background: 'oklch(0.60 0.22 25)', color: 'oklch(0.98 0 0)' }}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
