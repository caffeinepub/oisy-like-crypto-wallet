# Specification

## Summary
**Goal:** After login, derive and display the user's ICP and EVM wallet addresses across the app so they can receive and send tokens.

**Planned changes:**
- Add a "Your Wallet Addresses" section to the Dashboard, showing the user's ICP account address (derived from their principal) and a deterministic EVM-compatible address (derived by hashing the principal bytes and taking the last 20 bytes as a 0x-prefixed hex string), each with a copy-to-clipboard button and a confirmation toast.
- Display addresses in full or truncated-with-tooltip format; section is only visible when authenticated.
- On the Networks page, show the user's ICP address for ICP/Internet Computer network rows and the EVM address for Ethereum/EVM network rows.
- On the Send page, auto-populate the "From" address field with the appropriate derived address based on the selected network.
- All address derivation is purely client-side; addresses are consistent across reloads for the same principal.

**User-visible outcome:** After logging in, users can view, copy, and use their ICP and EVM wallet addresses throughout the app — on the Dashboard, Networks page, and Send form — enabling them to receive and send tokens.
