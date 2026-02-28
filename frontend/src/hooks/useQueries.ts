import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile } from '../backend';

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
