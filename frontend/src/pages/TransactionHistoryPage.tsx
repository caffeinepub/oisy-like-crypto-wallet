import { useState } from 'react';
import {
  getTransactions,
  deleteTransaction,
  clearTransactions,
  type TransactionRecord,
} from '../lib/walletStorage';
import { truncateAddress } from '../utils/addressDerivation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Search, Clock, CheckCircle, XCircle } from 'lucide-react';

function StatusBadge({ status }: { status: TransactionRecord['status'] }) {
  if (status === 'success')
    return (
      <Badge variant="default" className="bg-success/20 text-success border-success/30 gap-1">
        <CheckCircle className="w-3 h-3" /> Success
      </Badge>
    );
  if (status === 'failed')
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" /> Failed
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="w-3 h-3" /> Pending
    </Badge>
  );
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>(getTransactions);
  const [search, setSearch] = useState('');

  const refresh = () => setTransactions(getTransactions());

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    refresh();
  };

  const handleClearAll = () => {
    clearTransactions();
    refresh();
  };

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    return (
      tx.network.toLowerCase().includes(q) ||
      tx.to.toLowerCase().includes(q) ||
      tx.from.toLowerCase().includes(q) ||
      tx.symbol.toLowerCase().includes(q) ||
      (tx.tokenSymbol ?? '').toLowerCase().includes(q) ||
      (tx.tokenContractAddress ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground mt-1">All recorded send intents</p>
          </div>
          {transactions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all transactions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all transaction records. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by network, address, or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">
              {transactions.length === 0 ? 'No transactions yet' : 'No results found'}
            </p>
            <p className="text-sm">
              {transactions.length === 0
                ? 'Your send history will appear here.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {tx.amount} {tx.tokenSymbol ?? tx.symbol}
                    </span>
                    <StatusBadge status={tx.status} />
                    <span className="text-xs text-muted-foreground">{tx.network}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>
                      <span className="font-medium">To:</span>{' '}
                      <span className="font-mono">{truncateAddress(tx.to)}</span>
                    </p>
                    <p>
                      <span className="font-medium">From:</span>{' '}
                      <span className="font-mono">{truncateAddress(tx.from)}</span>
                    </p>
                    {tx.tokenContractAddress && (
                      <p>
                        <span className="font-medium">Contract:</span>{' '}
                        <span className="font-mono">{truncateAddress(tx.tokenContractAddress)}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tx.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
