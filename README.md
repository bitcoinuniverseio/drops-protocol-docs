# Drops

**A record that is dropped once and meant to last.**

Drops is an original Bitcoin Universe application protocol for two kinds of permanent Bitcoin record: **media-first artifacts**, and **Drop Pacts**, agreements whose terms are committed on chain so every party can check them later. Both travel in an `OP_DROP` Tapscript leaf, and both are counted only after the Taproot commitment verifies against confirmed chain data.

**Documentation site: <https://bitcoinuniverseio.github.io/drops-protocol-docs/>**

![The Drops wordmark: a faceted magenta droplet beside the word DROPS in a high-contrast serif, over a fine spectrum rule](assets/img/wordmark-drops.png)

## The leaf, in full

```text
PUSH <marker>         OP_DROP     drops | drops-pact
PUSH <content type>   OP_DROP     lowercase type/subtype, at most 80 bytes
PUSH SHA256(body)     OP_DROP     32 bytes
PUSH <body>           OP_DROP     1 to 256 bytes
PUSH <x-only pubkey>  OP_CHECKSIG 32 bytes
```

Five pushes, fixed order, minimal push encoding, Tapleaf version `0xc0`. The leaf must be a leaf the spent Taproot output actually committed to. An indexer that only pattern-matches a transaction has not verified a Drop.

Every artifact gets a portable identity from the input that revealed it:

```text
drops:<network>:<reveal-txid>:d<reveal-input-index>
```

## Availability today

The Bitcoin Universe capability registry records both `drops` and `op_drop` as **feature-gated** with mode **external-execution**. The code is implemented and wired into Core, and every marketplace action stays off unless an operator enables the gate: `dropsMarketplaceV1` for Drops, `opDropTrading` for OP_DROP. The `sell` action is not supported on any deployment, gate or no gate.

**Drop Pacts are reference-only.** The indexer's capability contract reports `mode: reference`, with every execution, custody, authorization, signature, broadcast, live-Cell and value-bearing field set to `false`. Pact records are readable; there is no Pact settlement authority. If a screen tells you a Pact transaction is pending, do not sign and do not send funds.

## Start here

| I want to | Go to |
| --- | --- |
| Understand the protocol in plain language | [Home](https://bitcoinuniverseio.github.io/drops-protocol-docs/) |
| Read the normative rules | [Specification](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/drops-specification.html) |
| See the transaction structure | [Carrier and anatomy](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/carriers.html) |
| Understand agreements | [Drop Pacts](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/pacts.html) |
| Make a Drop | [Create a Drop](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/create.html) |
| Implement an indexer | [Integration guide](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/integrate.html) and [conformance](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/conformance.html) |
| Decode a payload | [Decoder](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/decoder.html) |
| Check a Pact outcome | [Verifier](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/verifier.html) |
| Test my implementation | [Test vectors](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/test-vectors.html) |
| Call the API | [API reference](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/api.html) |

## What a confirmed Drop proves

1. These exact body bytes, this content type, this marker and this key were committed together in one Tapscript leaf.
2. That leaf is a leaf the spent Taproot output committed to, before the spend existed.
3. The declared SHA-256 equals the revealed body.
4. The spend is in a block on the chain the reading implementation follows, at or beyond its confirmation depth. On mainnet that floor is six confirmations.

It does not prove authorship, legal rights, market value, that a Pact's off-chain terms were performed, or that another implementation reads it the same way. [Security and safety](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/security.html) states this in full.

Bitcoin transactions are difficult to reverse. Review the body, the network, the destination and the fee in a wallet you trust before signing. No Drops or Pacts interface ever needs a seed phrase or a private key.

## Related

- [bitcoinuniverseio/op-drop](https://github.com/bitcoinuniverseio/op-drop): the OP_DROP carrier protocol, which shares the leaf shape and nothing else. Summarised here, specified there.
- [docs.bitcoinuniverse.io](https://docs.bitcoinuniverse.io): the Bitcoin Universe documentation portal, which ingests this repository through `docs.manifest.json`.

## This repository

Hand-authored static HTML, CSS and vanilla JavaScript. No build step, no framework, no external requests, no trackers. Deployed by GitHub Pages from `main` at the repository root.

```text
index.html            Overview and site map
changelog.html        Protocol and document version history
404.html              Where former pages went
pages/                17 documentation pages
assets/drops.css      The design system
assets/site.js        Theme toggle, local search, copy buttons
assets/decoder.js     The payload decoder
assets/verifier.js    The Pact outcome verifier
assets/img/           Optimized image derivatives, all under 200KB
search-index.json     One entry per section, for the local search
docs.manifest.json    Portal ingestion manifest
llms.txt              Machine-readable site description
```

Every page works with JavaScript disabled. JavaScript adds search, the theme toggle, copy buttons and the two interactive tools; both tools state what they check and what they do not, and neither transmits, stores or logs anything you paste.

To work on the site, open `index.html` in a browser, or serve the directory with any static file server. There is nothing to install and nothing to compile.

Contributions: see [CONTRIBUTING.md](CONTRIBUTING.md). Questions: [SUPPORT.md](SUPPORT.md). Security: [SECURITY.md](SECURITY.md).

Drops and OP_DROP are original Bitcoin Universe protocols. Content is licensed under the terms in [LICENSE](LICENSE).
