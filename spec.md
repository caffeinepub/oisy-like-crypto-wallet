# Specification

## Summary
**Goal:** Replace the existing ICP Ledger block-verification subscription flow with a simple invite code authentication flow, where validation happens entirely on the frontend.

**Planned changes:**
- Update `SubscriptionPage.tsx` to remove all treasury address, ICP transfer instructions, block index input, and "Verify & Activate" button; replace with an "Enter Invite Code" heading, a single invite code text input, and an "Activate" button (enabled only when input is non-empty)
- On "Activate" click, compare the trimmed input against the hardcoded invite code string on the frontend; show an inline error message if it does not match
- If the code matches, call the backend activation function, then invalidate the `isSubscribed` React Query cache to redirect to the dashboard
- If the user is already subscribed, hide the form and show an "Active Subscription" badge instead
- Add or update a mutation hook (`useActivateByInviteCode` or `useVerifyAndActivateSubscription`) in `useQueries.ts` that calls the backend activation function with a nominal amount, invalidates the `isSubscribed` cache on success, and exposes `isPending`, `isSuccess`, and `isError` states
- Update `backend/main.mo` so that `recordPayment` marks the caller's subscription as active immediately without any minimum payment amount check; `isSubscribed` continues to return `true` for active principals; subscription records persist through canister upgrades

**User-visible outcome:** Users can unlock the wallet by entering a valid invite code on the Subscription page instead of going through an ICP Ledger transfer flow. Entering the correct code activates the subscription and redirects to the dashboard; an incorrect code shows a clear error message.
