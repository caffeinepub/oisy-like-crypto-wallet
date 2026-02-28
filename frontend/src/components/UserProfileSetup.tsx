import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wallet } from 'lucide-react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';

interface UserProfileSetupProps {
  open: boolean;
}

export default function UserProfileSetup({ open }: UserProfileSetupProps) {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userName.trim();
    if (!trimmed) {
      setError('Please enter a display name');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError('');
    await saveProfile.mutateAsync({ userName: trimmed, description: '' });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-wallet-border"
        style={{ background: 'oklch(0.16 0.01 240)', borderColor: 'oklch(0.28 0.015 240)' }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center teal-glow"
              style={{ background: 'oklch(0.78 0.18 185 / 0.15)', border: '1px solid oklch(0.78 0.18 185 / 0.4)' }}>
              <Wallet className="w-8 h-8" style={{ color: 'oklch(0.78 0.18 185)' }} />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Welcome to NexWallet
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set up your display name to get started. This helps personalize your wallet experience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm font-medium text-foreground">
              Display Name
            </Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name..."
              className="input-dark"
              style={{
                background: 'oklch(0.14 0.01 240)',
                borderColor: error ? 'oklch(0.60 0.22 25)' : 'oklch(0.28 0.015 240)',
                color: 'oklch(0.95 0.01 240)',
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm" style={{ color: 'oklch(0.70 0.20 25)' }}>{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={saveProfile.isPending}
            className="w-full btn-primary"
            style={{ background: 'oklch(0.78 0.18 185)', color: 'oklch(0.08 0.01 240)' }}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
