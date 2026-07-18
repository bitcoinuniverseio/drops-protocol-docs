# Drops carrier registry

The carrier registry prevents one permissive parser from assigning different meanings to the same Taproot leaf. Every marker has one grammar, one validator, and a published test-vector set.

## Registry

| Marker or prefix | Purpose | Validator |
| --- | --- | --- |
| `drops` | Compact generic artifact | Drops five-push validator |
| `drops-pact` | Immutable Pact Seed | Pact Seed validator |
| `drops-cell` | Hidden Cell descriptor leaf | Pact Cell descriptor validator |
| `DPC1` | 36-byte transition payload inside an `OP_RETURN` output | Pact transition validator |

`DPC1` is a fixed transition-discovery prefix. It is exactly four bytes followed by a 32-byte transition commitment in a 38-byte `OP_RETURN` script.

## Registration requirements

A carrier is accepted only when its specification includes:

1. A precise binary grammar, including character set, ordering, length bounds, and canonical encodings.
2. A parser that rejects noncanonical alternatives rather than trying to repair them.
3. BIP341 compatibility rules.
4. Stable error codes and valid and invalid test vectors.
5. Reorganization, duplicate, closure, and data-availability behavior.
6. Security analysis and an owner for coordinated vulnerability disclosure.
7. At least one independently runnable verifier.

## Non-interference rule

No carrier may reinterpret a confirmed record from another marker. In particular:

- A `drops` artifact never implies an op-drop balance.
- A generic `bip110-op-drop` record is not a valid token event until the strict token decoder accepts it.
- A Pact Seed cannot modify an asset ledger.
- An `op-drop-pact` binding cannot modify a Pact state.
- A `DPC1` commitment is not a Pact transition until its parent Cell, successor Cell, and Proof Pack verify.

## Deprecation

Confirmed records retain their original meaning forever. A carrier may be marked deprecated for new construction, but its parser and vectors remain available. Security fixes may reject malformed records only when the original specification already made them invalid. A new interpretation requires a new marker.
