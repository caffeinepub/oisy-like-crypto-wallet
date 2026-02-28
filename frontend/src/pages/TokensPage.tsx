import { useState } from 'react';
import {
  getTokens,
  saveTokens,
  getNetworks,
  setTokenBalance,
  type TokenConfig,
} from '../lib/walletStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { truncateAddress } from '../utils/addressDerivation';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TokensPage() {
  const networks = getNetworks().filter((n) => n.type === 'EVM');
  const [tokens, setTokens] = useState<TokenConfig[]>(getTokens);
  const [addOpen, setAddOpen] = useState(false);
  const [editToken, setEditToken] = useState<TokenConfig | null>(null);
  const [editBalance, setEditBalance] = useState('');

  // Add token form state
  const [form, setForm] = useState({
    networkId: '',
    symbol: '',
    name: '',
    contractAddress: '',
    decimals: '18',
    balance: '',
  });

  const refresh = () => setTokens(getTokens());

  const handleAddToken = () => {
    if (!form.networkId || !form.symbol || !form.contractAddress) return;
    const newToken: TokenConfig = {
      id: generateId(),
      networkId: form.networkId,
      symbol: form.symbol.toUpperCase(),
      name: form.name || form.symbol.toUpperCase(),
      contractAddress: form.contractAddress,
      decimals: parseInt(form.decimals) || 18,
      balance: form.balance || '0',
    };
    const updated = [...getTokens(), newToken];
    saveTokens(updated);
    refresh();
    setAddOpen(false);
    setForm({ networkId: '', symbol: '', name: '', contractAddress: '', decimals: '18', balance: '' });
  };

  const handleDelete = (id: string) => {
    const updated = getTokens().filter((t) => t.id !== id);
    saveTokens(updated);
    refresh();
  };

  const handleEditBalance = () => {
    if (!editToken) return;
    setTokenBalance(editToken.id, editBalance);
    refresh();
    setEditToken(null);
    setEditBalance('');
  };

  const networkName = (id: string) => networks.find((n) => n.id === id)?.name ?? id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ERC-20 Tokens</h1>
            <p className="text-muted-foreground mt-1">Manage custom ERC-20 tokens for EVM networks</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Token
          </Button>
        </div>

        {tokens.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No tokens added yet</p>
            <p className="text-sm">Add ERC-20 tokens to track their balances across EVM networks.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-semibold">{token.symbol}</TableCell>
                    <TableCell className="text-muted-foreground">{token.name}</TableCell>
                    <TableCell>{networkName(token.networkId)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {truncateAddress(token.contractAddress)}
                    </TableCell>
                    <TableCell>{token.balance ?? '0'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditToken(token);
                            setEditBalance(token.balance ?? '0');
                          }}
                          title="Edit balance"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(token.id)}
                          title="Delete token"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Token Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add ERC-20 Token</DialogTitle>
              <DialogDescription>
                Enter the token details to track its balance on an EVM network.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Network</Label>
                <Select
                  value={form.networkId}
                  onValueChange={(v) => setForm((f) => ({ ...f, networkId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select EVM network" />
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
              <div className="space-y-1.5">
                <Label>Contract Address</Label>
                <Input
                  placeholder="0x..."
                  value={form.contractAddress}
                  onChange={(e) => setForm((f) => ({ ...f, contractAddress: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Symbol</Label>
                  <Input
                    placeholder="USDT"
                    value={form.symbol}
                    onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    placeholder="Tether USD"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Decimals</Label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={form.decimals}
                    onChange={(e) => setForm((f) => ({ ...f, decimals: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Balance</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.balance}
                    onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddToken}
                disabled={!form.networkId || !form.symbol || !form.contractAddress}
              >
                Add Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Balance Dialog */}
        <Dialog open={!!editToken} onOpenChange={(open) => { if (!open) setEditToken(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Balance — {editToken?.symbol}</DialogTitle>
              <DialogDescription>
                Update the balance for {editToken?.name} on{' '}
                {editToken ? networkName(editToken.networkId) : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Balance</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditToken(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditBalance}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
