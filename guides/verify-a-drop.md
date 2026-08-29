# Verify a Drop

Every confirmed Drop carries a proof path that can be checked from the record back to Bitcoin.

## The proof path

1. **Find the confirmed transaction.** A Drop becomes authoritative only after Bitcoin confirms it.
2. **Read the authoritative leaf.** The marker, content type, body hash, body, and creator key must appear in the exact Drops order.
3. **Match the content.** Hash the body with SHA256 and compare it with the committed body hash.
4. **Check the Taproot commitment.** The control block must commit the exact leaf to the spent Taproot output.
5. **Confirm the identity.** The network, reveal transaction, and input index form the authoritative Drop ID.

## What success means

A successful result proves that the displayed bytes match a confirmed Bitcoin commitment. It does not add off-chain ownership, legal rights, custody, or guarantees that are absent from the record.

## Review before you sign

- Confirm the Bitcoin network and destination.
- Read the exact content or agreement summary.
- Check the miner fee and every wallet output.
- Keep seed phrases and private keys private.
- Wait for confirmation before treating the Drop as permanent.

Bitcoin transactions are difficult to reverse. If any detail is unfamiliar or unexpected, stop before signing and review it in a wallet you trust.
