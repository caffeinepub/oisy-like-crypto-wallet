import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile } from '../backend';
import { migrateWhitelistEntries } from '../lib/walletStorage';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export function useIsSubscribed() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isSubscribed', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return actor.isSubscribed(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
    staleTime: 30_000,
  });
}

export function useGetSubscriptionStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ['subscriptionStatus', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) throw new Error('Actor not available');
      return actor.getSubscriptionStatus(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useRecordPayment() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor || !identity) throw new Error('Actor not available');
      return actor.recordPayment(identity.getPrincipal(), amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isSubscribed'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
    },
  });
}

/**
 * Maps the backend verifyAndActivateSubscription result variants to a
 * human-readable error message, or returns the success string.
 */
function parseVerifyResult(
  result: Awaited<ReturnType<import('../backend').backendInterface['verifyAndActivateSubscription']>>
): string {
  switch (result.__kind__) {
    case 'ok':
      return result.ok;
    case 'alreadySubscribed':
      throw new Error('Your subscription is already active.');
    case 'blockNotFound':
      throw new Error(
        `Block #${result.blockNotFound} was not found on the ICP Ledger. ` +
        'Please double-check the block index and try again.'
      );
    case 'invalidBlock':
      throw new Error(
        'The specified block does not contain a valid ICP transfer operation. ' +
        'Please make sure you are entering the correct block index from your ICP transfer transaction.'
      );
    case 'insufficientAmount':
      throw new Error(
        `Transfer amount is insufficient (${result.insufficientAmount} e8s). ` +
        'A minimum of 100,000 e8s (0.001 ICP) is required.'
      );
    case 'wrongAddress':
      throw new Error(
        `The transfer was sent to the wrong address. ${result.wrongAddress}`
      );
    case 'exceedsMaximumSubscriptionTime':
      throw new Error(result.exceedsMaximumSubscriptionTime);
    default:
      throw new Error('Verification failed. Please try again.');
  }
}

export function useVerifyAndActivateSubscription() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockIndex: bigint) => {
      if (!actor || !identity) throw new Error('Actor not available');
      const result = await actor.verifyAndActivateSubscription(blockIndex);
      return parseVerifyResult(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isSubscribed'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
    },
  });
}

// ─── Whitelist Migration ──────────────────────────────────────────────────────

/**
 * Runs once per session to migrate legacy 'icp' whitelist entries to 'icp-native'.
 */
export function useWhitelistMigration() {
  const migrated = useRef(false);

  useEffect(() => {
    if (!migrated.current) {
      migrated.current = true;
      migrateWhitelistEntries();
    }
  }, []);
}

// ─── Local Storage Helpers for Wallet Data ───────────────────────────────────
// Since the backend only stores user profiles, wallet-specific data
// (networks, tokens, watchlist, transactions) is stored in localStorage
// keyed by principal ID.

function getStorageKey(principal: string, key: string): string {
  return `wallet_${principal}_${key}`;
}

export function useLocalStorage<T>(principal: string | null, key: string, defaultValue: T) {
  const storageKey = principal ? getStorageKey(principal, key) : null;

  const getData = (): T => {
    if (!storageKey) return defaultValue;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const setData = (value: T) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(value));
  };

  return { getData, setData };
}
