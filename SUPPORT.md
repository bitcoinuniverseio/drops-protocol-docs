# Support

## Start with the documentation

<https://bitcoinuniverseio.github.io/drops-protocol-docs/>

The site has a search box. Press `/` anywhere on a page to focus it.

| Question | Page |
| --- | --- |
| What is a Drop, and what does one prove? | [Home](https://bitcoinuniverseio.github.io/drops-protocol-docs/) |
| What exactly must a leaf look like? | [Specification](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/drops-specification.html) |
| Why was my record rejected? | [Invalid conditions](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/drops-specification.html#invalid) and the [decoder](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/decoder.html) |
| Why has my Drop not appeared yet? | [Confirmation policy](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/validation.html#confirmation) |
| What can Drop Pacts actually do today? | [Capability contract](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/pacts.html#capability) |
| What does an endpoint return? | [API reference](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/api.html) |
| What does a term mean? | [Glossary](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/reference.html#glossary) |
| How do I test my implementation? | [Test vectors](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/test-vectors.html) and [conformance](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/conformance.html) |

## Diagnosing a record yourself

Two questions cover most problems, and you can answer both without asking anyone.

**Is my leaf well formed?** Paste it into the
[payload decoder](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/decoder.html).
It names the rule that failed. It runs entirely in your browser.

**Is the record the one I made?** Fetch it from an indexer, fetch its body, and check that
SHA-256 of the returned body equals the record's `bodySha256` and equals the hash you put in
the leaf. If those three agree, the record is yours and unchanged.

## Where to ask

| What you have | Where it goes |
| --- | --- |
| An error in this documentation, a broken link, an unclear rule | [Open an issue](https://github.com/bitcoinuniverseio/drops-protocol-docs/issues) |
| A question about the OP_DROP carrier protocol | [bitcoinuniverseio/op-drop](https://github.com/bitcoinuniverseio/op-drop) |
| A security finding | [SECURITY.md](SECURITY.md). Report privately, never in an issue |
| A question about a Bitcoin Universe product | <https://docs.bitcoinuniverse.io> |

A good issue names the page you were on, quotes the sentence in question, and says what you
expected instead. If it concerns a record, include the full
`drops:<network>:<txid>:d<input>` identity rather than a screenshot.

## What this repository cannot help with

- **Recovering or reversing a transaction.** A confirmed Bitcoin transaction is difficult to
  reverse, and nobody here can undo one.
- **Removing content from Bitcoin.** The protocol has no removal mechanism, and adding one
  would not remove anything from the chain.
- **Prices, availability or trading.** This is a protocol specification, not a market.
- **Anything involving your keys.** No Drops or Pacts interface ever needs a seed phrase or a
  private key. Anyone asking for one is attacking you, without exception.

If a screen tells you a Pact transaction is pending, do not sign and do not send funds. The
Pacts reference service holds no funds and no live Pact state. Keep the full blueprint and
the plan hash together, and verify any Bitcoin transaction independently in a wallet or
explorer you chose yourself.
