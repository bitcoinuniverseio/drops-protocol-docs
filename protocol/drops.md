# Drops wire specification

## Scope

Drops defines a compact, canonical artifact carried by a native Taproot script-path spend. It is designed for small, self-contained content and a deterministic proof path. The protocol does not assign an artifact to a satoshi number.

An indexer MUST only accept a confirmed reveal input after it validates all rules in this document and proves the Taproot commitment against the spent output.

## Canonical leaf

```text
PUSH "drops"           OP_DROP
PUSH <canonical MIME>   OP_DROP
PUSH SHA256(body)       OP_DROP
PUSH <body, max 256B>   OP_DROP
PUSH <x-only pubkey>    OP_CHECKSIG
```

The existing marker `bip110-op-drop` is a separate registered compatibility carrier for op-drop. It is not a replacement spelling for `drops`. A generic Drops parser recognizing that marker does not make its body a valid op-drop event. Only the strict op-drop JSON decoder can establish that.

## Acceptance rules

1. The Taproot leaf byte is `0xc0`.
2. The script contains exactly five data pushes in the order above, four `OP_DROP` opcodes, and a final `OP_CHECKSIG`.
3. Every data push is minimally encoded. Alternative push encodings are invalid.
4. The marker is the ASCII string `drops`.
5. The MIME type is lowercase ASCII, has no parameters, matches `type/subtype`, and is at most 80 bytes.
6. `SHA256(body)` is exactly 32 bytes and equals the committed body hash.
7. The body is one push no larger than 256 bytes.
8. The public key is a valid 32-byte x-only secp256k1 public key.
9. The reveal witness has no annex and exposes this leaf script and a structurally valid Taproot control block.
10. The indexer calculates the BIP341 Tapleaf and TapBranch hashes, tweaks the internal key, and confirms the resulting x-only output key and parity match the actual P2TR scriptPubKey of the spent outpoint.

An invalid or ambiguous item is not a Drop. Indexers SHOULD record diagnostic counters but MUST NOT create a canonical record.

## Identity

For network `N`, reveal transaction ID `T`, and reveal input index `I`, canonical identity is:

```text
drops:N:T:dI
```

Example:

```text
drops:mainnet:6b...91:d0
```

The human display sequence `Drop #42` is indexer-local presentation metadata. It is never a portable identity. A Dropmark is the first ten uppercase hexadecimal characters of the body hash and is decorative only.

## Content policy

Drops limits the native body to 256 bytes. This supports small text, JSON objects, identifiers, manifests, and checksums. Larger material uses an explicit content-addressed artifact with its own marker and canonical grammar. A separate artifact never reinterprets a confirmed Drops leaf.

## Product and parser boundary

Drops is the compact artifact carrier. It proves a small body, its MIME type, and its Taproot commitment. It does not by itself decode an op-drop token event, maintain a fungible-token ledger, or validate a Pact state transition.

Wallets, explorers, and indexers MUST keep carrier meanings separate:

| Carrier | What its parser may establish |
| --- | --- |
| `drops` | A canonical Drops artifact with the five-value leaf grammar in this document. |
| `bip110-op-drop` | A compatibility carrier whose body requires the strict op-drop JSON decoder before it may be treated as a token event. |
| `drops-pact` | A Pact Seed record with its own fixed binary grammar. |
| `drops-cell` | A deliberately unspendable descriptor leaf used to audit the state commitment of a Pact Cell. |
| `DPC1` | A transition-discovery output for a Pact state update, not a Drops artifact. |

This separation is intentional. A colorful product interface may connect these pieces, but proof still begins with the exact parser and commitment rule for the thing being displayed.

## Reference material

- [BIP-341, Taproot](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki)
- [BIP-342, Tapscript](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki)
- [Drops implementation](https://github.com/bitcoinuniverse/drops)
