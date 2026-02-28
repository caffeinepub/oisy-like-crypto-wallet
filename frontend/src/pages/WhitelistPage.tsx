import { useState, useCallback } from 'react';
import {
  getWhitelistEntries,
  addWhitelistEntry,
  updateWhitelistEntry,
  deleteWhitelistEntry,
  shortAddress,
  validateIcpNativeAddress,
  validateIcpTokenAddress,
  validateEvmAddress,
  type WhitelistEntry,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Plus, Copy, Check, Pencil, Trash2, BookUser } from 'lucide-react';

type AddressType = 'icp-native' | 'icp-token' | 'evm';

interface EntryFormState {
  label: string;
  type: AddressType;
  address: string;
}

const defaultForm: EntryFormState = { label: '', type: 'icp-native', address: '' };

const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  'icp-native': 'ICP Native (Account ID)',
  'icp-token': 'ICP Token (Principal ID)',
  'evm': 'EVM (0x…)',
};

const ADDRESS_TYPE_PLACEHOLDERS: Record<AddressType, string> = {
  'icp-native': '64-character hex Account ID',
  'icp-token': 'xxxxx-xxxxx-xxxxx-... Principal ID',
  'evm': '0x...',
};

const ADDRESS_TYPE_HINTS: Record<AddressType, string> = {
  'icp-native': 'Must be a 64-character hexadecimal string (ICP Account ID).',
  'icp-token': 'Must be a valid Principal ID format (e.g. xxxxx-xxxxx-xxxxx-cai).',
  'evm': 'Must be a valid 0x-prefixed 40-character hex address.',
};

function useWhitelist() {
  const [entries, setEntries] = useState<WhitelistEntry[]>(() => getWhitelistEntries());

  const refresh = useCallback(() => {
    setEntries(getWhitelistEntries());
  }, []);

  return { entries, refresh };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded transition-colors hover:bg-white/10"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" style={{ color: 'oklch(0.78 0.18 185)' }} />
      ) : (
        <Copy className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.02 240)' }} />
      )}
    </button>
  );
}

function TypeBadge({ type }: { type: AddressType }) {
  if (type === 'icp-native') {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
        style={{
          background: 'oklch(0.35 0.10 185 / 0.25)',
          color: 'oklch(0.78 0.18 185)',
          border: '1px solid oklch(0.78 0.18 185 / 0.3)',
        }}
      >
        ICP Native
      </span>
    );
  }
  if (type === 'icp-token') {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
        style={{
          background: 'oklch(0.35 0.12 200 / 0.25)',
          color: 'oklch(0.75 0.18 200)',
          border: '1px solid oklch(0.75 0.18 200 / 0.3)',
        }}
      >
        ICP Token
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        background: 'oklch(0.35 0.12 280 / 0.25)',
        color: 'oklch(0.75 0.15 280)',
        border: '1px solid oklch(0.75 0.15 280 / 0.3)',
      }}
    >
      EVM
    </span>
  );
}

export default function WhitelistPage() {
  const { entries, refresh } = useWhitelist();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryFormState>(defaultForm);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (entry: WhitelistEntry) => {
    setEditingId(entry.id);
    setForm({ label: entry.label, type: entry.type, address: entry.address });
    setFormError('');
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    if (!form.label.trim()) {
      setFormError('Label is required.');
      return false;
    }
    if (!form.address.trim()) {
      setFormError('Address is required.');
      return false;
    }
    if (form.type === 'icp-native' && !validateIcpNativeAddress(form.address)) {
      setFormError('ICP Native address must be a 64-character hexadecimal string (Account ID).');
      return false;
    }
    if (form.type === 'icp-token' && !validateIcpTokenAddress(form.address)) {
      setFormError('ICP Token address must be a valid Principal ID (e.g. xxxxx-xxxxx-xxxxx-cai).');
      return false;
    }
    if (form.type === 'evm' && !validateEvmAddress(form.address)) {
      setFormError('EVM address must be a valid 0x-prefixed 40-character hex address.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (editingId) {
      updateWhitelistEntry(editingId, {
        label: form.label.trim(),
        type: form.type,
        address: form.address.trim(),
      });
    } else {
      addWhitelistEntry({
        label: form.label.trim(),
        type: form.type,
        address: form.address.trim(),
      });
    }
    refresh();
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteWhitelistEntry(deleteId);
    refresh();
    setDeleteId(null);
  };

  const deleteEntry = entries.find((e) => e.id === deleteId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'oklch(0.78 0.18 185 / 0.15)',
              border: '1px solid oklch(0.78 0.18 185 / 0.3)',
            }}
          >
            <BookUser className="w-5 h-5" style={{ color: 'oklch(0.78 0.18 185)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'oklch(0.95 0.01 240)' }}>
              Whitelist
            </h1>
            <p className="text-sm" style={{ color: 'oklch(0.55 0.02 240)' }}>
              Manage trusted addresses for quick transfers
            </p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="flex items-center gap-2"
          style={{
            background: 'oklch(0.78 0.18 185)',
            color: 'oklch(0.10 0.008 240)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Address
        </Button>
      </div>

      {/* Table / Empty state */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'oklch(0.14 0.010 240 / 0.85)',
          border: '1px solid oklch(0.25 0.015 240)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'oklch(0.78 0.18 185 / 0.08)',
                border: '1px solid oklch(0.78 0.18 185 / 0.2)',
              }}
            >
              <BookUser className="w-8 h-8" style={{ color: 'oklch(0.78 0.18 185 / 0.5)' }} />
            </div>
            <div>
              <p className="font-semibold text-lg" style={{ color: 'oklch(0.75 0.01 240)' }}>
                No whitelist addresses yet
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.45 0.02 240)' }}>
                Add trusted ICP Native, ICP Token, or EVM addresses to quickly select them when sending.
              </p>
            </div>
            <Button
              onClick={openAdd}
              variant="outline"
              className="mt-2"
              style={{
                borderColor: 'oklch(0.78 0.18 185 / 0.4)',
                color: 'oklch(0.78 0.18 185)',
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Address
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.22 0.012 240)' }}>
                  <th
                    className="text-left px-5 py-3 font-medium"
                    style={{ color: 'oklch(0.50 0.02 240)' }}
                  >
                    Label
                  </th>
                  <th
                    className="text-left px-5 py-3 font-medium"
                    style={{ color: 'oklch(0.50 0.02 240)' }}
                  >
                    Type
                  </th>
                  <th
                    className="text-left px-5 py-3 font-medium"
                    style={{ color: 'oklch(0.50 0.02 240)' }}
                  >
                    Address
                  </th>
                  <th
                    className="text-right px-5 py-3 font-medium"
                    style={{ color: 'oklch(0.50 0.02 240)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{
                      borderBottom:
                        idx < entries.length - 1 ? '1px solid oklch(0.20 0.010 240)' : 'none',
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium" style={{ color: 'oklch(0.90 0.01 240)' }}>
                        {entry.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <TypeBadge type={entry.type} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-xs"
                          style={{ color: 'oklch(0.70 0.02 240)' }}
                          title={entry.address}
                        >
                          {shortAddress(entry.address, 8)}
                        </span>
                        <CopyButton text={entry.address} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.02 240)' }} />
                        </button>
                        <button
                          onClick={() => setDeleteId(entry.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: 'oklch(0.60 0.18 25)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          style={{
            background: 'oklch(0.16 0.012 240)',
            border: '1px solid oklch(0.28 0.015 240)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>
              {editingId ? 'Edit Address' : 'Add Whitelist Address'}
            </DialogTitle>
            <DialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              {editingId
                ? 'Update the details for this whitelist entry.'
                : 'Add a trusted address to your whitelist for quick selection when sending.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Label */}
            <div className="space-y-1.5">
              <Label style={{ color: 'oklch(0.75 0.02 240)' }}>Label</Label>
              <Input
                placeholder="e.g. My Exchange, Alice's Wallet"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                style={{
                  background: 'oklch(0.12 0.010 240)',
                  border: '1px solid oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label style={{ color: 'oklch(0.75 0.02 240)' }}>Address Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as AddressType, address: '' }))
                }
              >
                <SelectTrigger
                  style={{
                    background: 'oklch(0.12 0.010 240)',
                    border: '1px solid oklch(0.28 0.015 240)',
                    color: 'oklch(0.90 0.01 240)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: 'oklch(0.18 0.012 240)',
                    border: '1px solid oklch(0.28 0.015 240)',
                  }}
                >
                  <SelectItem value="icp-native">
                    ICP Native (Account ID) — 64-char hex
                  </SelectItem>
                  <SelectItem value="icp-token">
                    ICP Token (Principal ID) — ICRC-1/2 tokens
                  </SelectItem>
                  <SelectItem value="evm">
                    EVM (0x…) — Ethereum / EVM chains
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label style={{ color: 'oklch(0.75 0.02 240)' }}>Address</Label>
              <Input
                placeholder={ADDRESS_TYPE_PLACEHOLDERS[form.type]}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="font-mono text-xs"
                style={{
                  background: 'oklch(0.12 0.010 240)',
                  border: '1px solid oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />
              <p className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>
                {ADDRESS_TYPE_HINTS[form.type]}
              </p>
            </div>

            {formError && (
              <p className="text-xs font-medium" style={{ color: 'oklch(0.65 0.20 25)' }}>
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              style={{
                borderColor: 'oklch(0.30 0.015 240)',
                color: 'oklch(0.65 0.02 240)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              style={{
                background: 'oklch(0.78 0.18 185)',
                color: 'oklch(0.10 0.008 240)',
              }}
            >
              {editingId ? 'Save Changes' : 'Add Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent
          style={{
            background: 'oklch(0.16 0.012 240)',
            border: '1px solid oklch(0.28 0.015 240)',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'oklch(0.95 0.01 240)' }}>
              Remove Whitelist Entry
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'oklch(0.55 0.02 240)' }}>
              Are you sure you want to remove{' '}
              <span className="font-semibold" style={{ color: 'oklch(0.85 0.01 240)' }}>
                {deleteEntry?.label}
              </span>{' '}
              from your whitelist? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                background: 'oklch(0.20 0.012 240)',
                borderColor: 'oklch(0.30 0.015 240)',
                color: 'oklch(0.75 0.02 240)',
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{
                background: 'oklch(0.50 0.20 25)',
                color: 'oklch(0.97 0.01 240)',
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
