import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useIsSubscribed,
  useGetSubscriptionStatus,
  useVerifyAndActivateSubscription,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Clock,
  ExternalLink,
  Hash,
  Info,
} from 'lucide-react';
import { Variant_active_expired_pending } from '../backend';

// The treasury ICP Account ID that receives subscription payments.
const TREASURY_ACCOUNT_ID = '156853c40cb612680accef359c70d569cc9cd60453f5b055bf69e4ce87cf67a5';
const SUBSCRIPTION_FEE_ICP = 0.001;
const SUBSCRIPTION_FEE_E8S = 100_000;

function CopyButton({ text, size = 'sm' }: { text: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-white/10"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check
          className={size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'}
          style={{ color: 'oklch(0.78 0.18 145)' }}
        />
      ) : (
        <Copy
          className={size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'}
          style={{ color: 'oklch(0.55 0.02 240)' }}
        />
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: Variant_active_expired_pending }) {
  if (status === Variant_active_expired_pending.active) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
        style={{
          background: 'oklch(0.35 0.12 145 / 0.25)',
          color: 'oklch(0.75 0.18 145)',
          border: '1px solid oklch(0.75 0.18 145 / 0.3)',
        }}
      >
        <CheckCircle className="w-3.5 h-3.5" />
        Active
      </span>
    );
  }
  if (status === Variant_active_expired_pending.pending) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
        style={{
          background: 'oklch(0.35 0.12 80 / 0.25)',
          color: 'oklch(0.80 0.18 80)',
          border: '1px solid oklch(0.80 0.18 80 / 0.3)',
        }}
      >
        <Clock className="w-3.5 h-3.5" />
        Pending Verification
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
      style={{
        background: 'oklch(0.35 0.12 25 / 0.25)',
        color: 'oklch(0.75 0.18 25)',
        border: '1px solid oklch(0.75 0.18 25 / 0.3)',
      }}
    >
      <AlertCircle className="w-3.5 h-3.5" />
      Expired
    </span>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
      style={{
        background: 'oklch(0.78 0.18 185 / 0.2)',
        color: 'oklch(0.78 0.18 185)',
        border: '1px solid oklch(0.78 0.18 185 / 0.3)',
      }}
    >
      {n}
    </span>
  );
}

export default function SubscriptionPage() {
  const { identity } = useInternetIdentity();
  const { data: isSubscribed, isLoading: subLoading } = useIsSubscribed();
  const { data: statusResult } = useGetSubscriptionStatus();
  const verifyMutation = useVerifyAndActivateSubscription();

  const [tosAccepted, setTosAccepted] = useState(false);
  const [blockIndexInput, setBlockIndexInput] = useState('');
  const [blockIndexError, setBlockIndexError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const principal = identity?.getPrincipal().toString() ?? '';

  const subscriptionRecord =
    statusResult && statusResult.__kind__ === 'ok' ? statusResult.ok : null;

  const isActive = isSubscribed === true;

  // Validate block index input — returns true if valid
  const validateBlockIndex = (value: string): boolean => {
    if (!value.trim()) {
      setBlockIndexError('Transaction index is required.');
      return false;
    }
    const num = Number(value.trim());
    if (!Number.isInteger(num) || num < 0) {
      setBlockIndexError('Transaction index must be a non-negative integer.');
      return false;
    }
    setBlockIndexError('');
    return true;
  };

  const handleBlockIndexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setBlockIndexInput(val);
    // Clear error as user types so canSubmit re-evaluates correctly
    setBlockIndexError('');
  };

  const handleVerify = async () => {
    if (!validateBlockIndex(blockIndexInput)) return;
    if (!tosAccepted) return;
    setSuccessMessage('');
    try {
      const msg = await verifyMutation.mutateAsync(BigInt(blockIndexInput.trim()));
      setSuccessMessage(msg);
    } catch {
      // error is surfaced via verifyMutation.error
    }
  };

  // Button is enabled when: block index is non-empty, no validation error, ToS accepted, not pending
  const canSubmit =
    tosAccepted &&
    blockIndexInput.trim() !== '' &&
    blockIndexError === '' &&
    !verifyMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
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
            Activate your NexWallet access with a one-time ICP payment
          </p>
        </div>
      </div>

      {/* Current Status Card */}
      {!subLoading && subscriptionRecord && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: 'oklch(0.14 0.010 240 / 0.85)',
            border: '1px solid oklch(0.25 0.015 240)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'oklch(0.70 0.02 240)' }}>
              Subscription Status
            </span>
            <StatusBadge status={subscriptionRecord.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'oklch(0.50 0.02 240)' }}>
                Amount Paid
              </p>
              <p className="font-semibold font-mono" style={{ color: 'oklch(0.90 0.01 240)' }}>
                {(Number(subscriptionRecord.paidAmount) / 1e8).toFixed(5)} ICP
              </p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'oklch(0.50 0.02 240)' }}>
                Paid At
              </p>
              <p className="font-semibold" style={{ color: 'oklch(0.90 0.01 240)' }}>
                {new Date(
                  Number(subscriptionRecord.paidAt) / 1_000_000
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

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
        /* Plan A: Manual Transfer + Transaction Index Verification */
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'oklch(0.14 0.010 240 / 0.85)',
            border: '1px solid oklch(0.25 0.015 240)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Fee Summary */}
          <div
            className="px-6 py-5 border-b flex items-center justify-between"
            style={{ borderColor: 'oklch(0.22 0.012 240)' }}
          >
            <div>
              <p className="font-semibold" style={{ color: 'oklch(0.90 0.01 240)' }}>
                One-Time Subscription Fee
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.02 240)' }}>
                Lifetime access · Verified on-chain
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: 'oklch(0.78 0.18 185)' }}>
                {SUBSCRIPTION_FEE_ICP} ICP
              </p>
              <p className="text-xs" style={{ color: 'oklch(0.50 0.02 240)' }}>
                {SUBSCRIPTION_FEE_E8S.toLocaleString()} e8s
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Step-by-step instructions */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'oklch(0.55 0.02 240)' }}
              >
                How to activate
              </p>
              <ol className="space-y-4">
                {/* Step 1 */}
                <li className="flex gap-3">
                  <StepBadge n={1} />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm" style={{ color: 'oklch(0.75 0.02 240)' }}>
                      Send exactly{' '}
                      <strong style={{ color: 'oklch(0.90 0.01 240)' }}>
                        {SUBSCRIPTION_FEE_ICP} ICP
                      </strong>{' '}
                      to the treasury address below using any ICP wallet (e.g.{' '}
                      <a
                        href="https://nns.ic0.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 underline underline-offset-2"
                        style={{ color: 'oklch(0.78 0.18 185)' }}
                      >
                        NNS App
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {' '}or Plug Wallet).
                    </p>

                    {/* Treasury Address */}
                    <div
                      className="rounded-xl p-3 space-y-1.5"
                      style={{
                        background: 'oklch(0.11 0.010 240)',
                        border: '1px solid oklch(0.28 0.015 240)',
                      }}
                    >
                      <p className="text-xs font-medium" style={{ color: 'oklch(0.50 0.02 240)' }}>
                        Treasury Address (Account ID)
                      </p>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 text-xs font-mono break-all"
                          style={{ color: 'oklch(0.78 0.18 185)' }}
                        >
                          {TREASURY_ACCOUNT_ID}
                        </code>
                        <CopyButton text={TREASURY_ACCOUNT_ID} size="md" />
                      </div>
                    </div>
                  </div>
                </li>

                {/* Step 2 */}
                <li className="flex gap-3">
                  <StepBadge n={2} />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm" style={{ color: 'oklch(0.75 0.02 240)' }}>
                      After the transfer completes, find{' '}
                      <strong style={{ color: 'oklch(0.90 0.01 240)' }}>
                        the index of the transaction in the ICP ledger
                      </strong>{' '}
                      from your wallet's transaction history.
                    </p>
                    {/* Where to find it */}
                    <div
                      className="rounded-xl p-3 flex gap-2.5"
                      style={{
                        background: 'oklch(0.78 0.18 185 / 0.07)',
                        border: '1px solid oklch(0.78 0.18 185 / 0.2)',
                      }}
                    >
                      <Info
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: 'oklch(0.78 0.18 185)' }}
                      />
                      <div className="text-xs space-y-1" style={{ color: 'oklch(0.65 0.02 240)' }}>
                        <p className="font-semibold" style={{ color: 'oklch(0.78 0.18 185)' }}>
                          Where to find the transaction index:
                        </p>
                        <ul className="space-y-0.5">
                          <li>
                            •{' '}
                            <a
                              href="https://nns.ic0.app"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2"
                              style={{ color: 'oklch(0.78 0.18 185)' }}
                            >
                              NNS App
                            </a>
                            {' '}→ Tokens → ICP → click the transaction → copy the index shown as
                            "The index of the transaction in the ICP ledger."
                          </li>
                          <li>
                            •{' '}
                            <a
                              href="https://dashboard.internetcomputer.org/transactions"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2"
                              style={{ color: 'oklch(0.78 0.18 185)' }}
                            >
                              ICP Dashboard
                            </a>
                            {' '}→ search your address → find the transfer → note the Block Index.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>

                {/* Step 3 */}
                <li className="flex gap-3">
                  <StepBadge n={3} />
                  <div className="flex-1 space-y-3">
                    <p className="text-sm" style={{ color: 'oklch(0.75 0.02 240)' }}>
                      Enter the transaction index below and click{' '}
                      <strong style={{ color: 'oklch(0.90 0.01 240)' }}>
                        Verify &amp; Activate
                      </strong>
                      . The canister will verify your transfer on-chain and activate your
                      subscription instantly.
                    </p>

                    {/* Transaction Index Input */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="blockIndex"
                        className="text-xs font-medium flex items-center gap-1.5"
                        style={{ color: 'oklch(0.65 0.02 240)' }}
                      >
                        <Hash className="w-3.5 h-3.5" />
                        The index of the transaction in the ICP ledger
                      </Label>
                      <Input
                        id="blockIndex"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Enter the transaction index from your ICP wallet"
                        value={blockIndexInput}
                        onChange={handleBlockIndexChange}
                        onBlur={() => {
                          if (blockIndexInput) validateBlockIndex(blockIndexInput);
                        }}
                        disabled={verifyMutation.isPending}
                        className="font-mono"
                        style={{
                          background: 'oklch(0.11 0.010 240)',
                          border: blockIndexError
                            ? '1px solid oklch(0.60 0.18 25 / 0.6)'
                            : '1px solid oklch(0.28 0.015 240)',
                          color: 'oklch(0.90 0.01 240)',
                        }}
                      />
                      {blockIndexError ? (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: 'oklch(0.70 0.18 25)' }}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {blockIndexError}
                        </p>
                      ) : (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: 'oklch(0.50 0.02 240)' }}
                        >
                          <Info className="w-3 h-3" />
                          Find this numeric index in your ICP wallet transaction history (NNS App, ICP Dashboard, etc.)
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            {/* Your Principal ID */}
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{
                background: 'oklch(0.11 0.010 240)',
                border: '1px solid oklch(0.28 0.015 240)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: 'oklch(0.50 0.02 240)' }}>
                Your Principal ID (for reference)
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 text-xs font-mono break-all"
                  style={{ color: 'oklch(0.75 0.02 240)' }}
                >
                  {principal}
                </code>
                <CopyButton text={principal} size="md" />
              </div>
            </div>

            {/* Terms of Service */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'oklch(0.11 0.010 240)',
                border: '1px solid oklch(0.28 0.015 240)',
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'oklch(0.55 0.02 240)' }}
              >
                Terms of Service
              </p>
              <ul className="text-xs space-y-1.5" style={{ color: 'oklch(0.55 0.02 240)' }}>
                <li>• This is a one-time, non-refundable subscription fee for lifetime access.</li>
                <li>
                  • Payment must be at least {SUBSCRIPTION_FEE_ICP} ICP (
                  {SUBSCRIPTION_FEE_E8S.toLocaleString()} e8s) to activate.
                </li>
                <li>• The transaction index must correspond to a valid ICP transfer to the treasury address.</li>
                <li>• Verification is performed on-chain; results are final and tamper-proof.</li>
              </ul>
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-cyan-400 cursor-pointer"
                />
                <span
                  className="text-xs leading-relaxed"
                  style={{ color: 'oklch(0.65 0.02 240)' }}
                >
                  I understand and agree to the terms above.
                </span>
              </label>
            </div>

            {/* Error / Success Messages */}
            {verifyMutation.isError && (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: 'oklch(0.20 0.08 25 / 0.3)',
                  border: '1px solid oklch(0.60 0.18 25 / 0.4)',
                }}
              >
                <AlertCircle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: 'oklch(0.70 0.18 25)' }}
                />
                <p className="text-sm" style={{ color: 'oklch(0.80 0.10 25)' }}>
                  {verifyMutation.error instanceof Error
                    ? verifyMutation.error.message
                    : 'Verification failed. Please check the transaction index and try again.'}
                </p>
              </div>
            )}

            {successMessage && (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: 'oklch(0.20 0.08 145 / 0.3)',
                  border: '1px solid oklch(0.60 0.18 145 / 0.4)',
                }}
              >
                <CheckCircle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: 'oklch(0.75 0.18 145)' }}
                />
                <p className="text-sm" style={{ color: 'oklch(0.80 0.10 145)' }}>
                  {successMessage}
                </p>
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={!canSubmit}
              className="w-full h-11 font-semibold text-sm rounded-xl transition-all"
              style={
                canSubmit
                  ? {
                      background: 'oklch(0.78 0.18 185)',
                      color: 'oklch(0.10 0.01 240)',
                      border: 'none',
                    }
                  : {
                      background: 'oklch(0.22 0.012 240)',
                      color: 'oklch(0.45 0.02 240)',
                      border: '1px solid oklch(0.28 0.015 240)',
                      cursor: 'not-allowed',
                    }
              }
            >
              {verifyMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying on-chain…
                </span>
              ) : (
                'Verify & Activate'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
