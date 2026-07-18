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

## Reference material

- [BIP-341, Taproot](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki)
- [BIP-342, Tapscript](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki)
- [Drops implementation](https://github.com/bitcoinuniverse/drops)
