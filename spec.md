# Specification

## Summary
**Goal:** Fix the `verifyAndActivateSubscription` function in `backend/main.mo` so it correctly parses ICP Ledger block responses and validates ICP transfer operations.

**Planned changes:**
- Correct the Motoko actor type definition for the ICP Ledger (`ryjl3-tyaaa-aaaaa-aaaba-cai`) to include all required fields for `QueryBlocksResponse`, `Block`, `Transaction`, and `Operation` types with accurate field names
- Fix the block parsing logic to correctly access the `transaction.operation` variant and match the `#Transfer` tag as returned by the ICP Ledger
- Fix the treasury account ID comparison so it uses the same binary/text format as the `to` field stored in the ledger block
- Ensure the amount check verifies the transfer is >= 100,000 e8s (0.001 ICP)
- Replace the generic "Block does not contain a transfer operation" error with descriptive variants: "Block not found", "Transfer amount insufficient", "Wrong destination address", and "Subscription already active"
- Preserve the existing `recordPayment` function without modification

**User-visible outcome:** After sending 0.001 ICP to the treasury address and obtaining the block index, calling `verifyAndActivateSubscription(blockIndex)` will correctly detect the transfer and activate the subscription instead of returning a false-negative error.
