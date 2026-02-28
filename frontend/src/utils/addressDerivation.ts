/**
 * Utility functions for deriving ICP and EVM wallet addresses from a Principal.
 * All derivations are purely client-side and deterministic.
 */

/**
 * Derive an ICP account address (text representation) from a Principal.
 * Uses the principal's text representation as the ICP address.
 */
export function deriveICPAddress(principalText: string): string {
  return principalText;
}

/**
 * Derive an EVM-compatible address from a Principal.
 * Deterministically hashes the principal bytes using SHA-256,
 * then takes the last 20 bytes as a 0x-prefixed hex string.
 */
export async function deriveEVMAddress(principalText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(principalText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  // Take last 20 bytes (EVM address is 20 bytes)
  const addressBytes = hashArray.slice(hashArray.length - 20);
  const hexAddress = Array.from(addressBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hexAddress;
}

/**
 * Truncate an address for display: show first 6 and last 4 characters.
 */
export function truncateAddress(address: string, front = 8, back = 6): string {
  if (address.length <= front + back + 3) return address;
  return `${address.slice(0, front)}...${address.slice(-back)}`;
}
