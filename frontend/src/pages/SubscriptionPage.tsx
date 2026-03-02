import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useIsSubscribed, useActivateByInviteCode } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

const VALID_INVITE_CODE = '156853c40cb612680accef359c70d569cc9cd60453f5b055bf69e4ce87cf67a5';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { data: isSubscribed, isLoading: subLoading } = useIsSubscribed();
  const activateMutation = useActivateByInviteCode();

  const [inviteCode, setInviteCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const isActive = isSubscribed === true;

  const handleActivate = async () => {
    setCodeError('');
    const trimmed = inviteCode.trim();

    if (trimmed !== VALID_INVITE_CODE) {
      setCodeError('Invalid invite code. Please check and try again.');
      return;
    }

    try {
      await activateMutation.mutateAsync();
      navigate({ to: '/' });
    } catch {
      // error surfaced via activateMutation.error
    }
  };

  const canSubmit = inviteCode.trim() !== '' && !activateMutation.isPending;

  if (subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: 'oklch(0.78 0.18 185)' }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'oklch(0.78 0.18 185 / 0.15)',
            border: '1px solid oklch(0.78 0.18 185 / 0.3)',
          }}
        >
          <Shield className="w-6 h-6" style={{ color: 'oklch(0.78 0.18 185)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'oklch(0.95 0.01 240)' }}>
            Subscription
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.02 240)' }}>
            Enter your invite code to activate NexWallet access
          </p>
        </div>
      </div>

      {/* Active Subscription State */}
      {isActive ? (
        <div
          className="rounded-2xl p-8 text-center space-y-4"
          style={{
            background: 'oklch(0.14 0.010 240 / 0.85)',
            border: '1px solid oklch(0.35 0.12 145 / 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{
              background: 'oklch(0.35 0.12 145 / 0.2)',
              border: '1px solid oklch(0.75 0.18 145 / 0.4)',
            }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: 'oklch(0.75 0.18 145)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'oklch(0.95 0.01 240)' }}>
              Subscription Active
            </h2>
            <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 240)' }}>
              Your NexWallet subscription is active. You have full access to all features.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              background: 'oklch(0.35 0.12 145 / 0.2)',
              color: 'oklch(0.75 0.18 145)',
              border: '1px solid oklch(0.75 0.18 145 / 0.3)',
            }}
          >
            <CheckCircle className="w-4 h-4" />
            Active Subscription
          </span>
        </div>
      ) : (
        /* Invite Code Form */
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'oklch(0.14 0.010 240 / 0.85)',
            border: '1px solid oklch(0.25 0.015 240)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Card Header */}
          <div
            className="px-6 py-5 border-b flex items-center gap-3"
            style={{ borderColor: 'oklch(0.22 0.012 240)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'oklch(0.78 0.18 185 / 0.12)',
                border: '1px solid oklch(0.78 0.18 185 / 0.25)',
              }}
            >
              <KeyRound className="w-4 h-4" style={{ color: 'oklch(0.78 0.18 185)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'oklch(0.90 0.01 240)' }}>
                Enter Invite Code
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.02 240)' }}>
                A valid invite code grants lifetime access
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* Invite Code Input */}
            <div className="space-y-2">
              <Label
                htmlFor="inviteCode"
                className="text-xs font-medium"
                style={{ color: 'oklch(0.65 0.02 240)' }}
              >
                Invite Code
              </Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Paste your invite code here"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setCodeError('');
                  activateMutation.reset();
                }}
                disabled={activateMutation.isPending}
                className="font-mono text-sm"
                style={{
                  background: 'oklch(0.11 0.010 240)',
                  border: codeError
                    ? '1px solid oklch(0.60 0.20 25)'
                    : '1px solid oklch(0.28 0.015 240)',
                  color: 'oklch(0.90 0.01 240)',
                }}
              />

              {/* Inline error */}
              {codeError && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertCircle
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: 'oklch(0.65 0.20 25)' }}
                  />
                  <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>
                    {codeError}
                  </p>
                </div>
              )}

              {/* Backend error */}
              {activateMutation.isError && !codeError && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertCircle
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: 'oklch(0.65 0.20 25)' }}
                  />
                  <p className="text-xs" style={{ color: 'oklch(0.65 0.20 25)' }}>
                    {activateMutation.error instanceof Error
                      ? activateMutation.error.message
                      : 'Activation failed. Please try again.'}
                  </p>
                </div>
              )}
            </div>

            {/* Activate Button */}
            <Button
              onClick={handleActivate}
              disabled={!canSubmit}
              className="w-full font-semibold"
              style={
                canSubmit
                  ? {
                      background: 'oklch(0.55 0.18 185)',
                      color: 'oklch(0.98 0.005 240)',
                      border: 'none',
                    }
                  : undefined
              }
            >
              {activateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating…
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>

            {/* Helper text */}
            <p className="text-xs text-center" style={{ color: 'oklch(0.45 0.02 240)' }}>
              Contact support if you don't have an invite code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
