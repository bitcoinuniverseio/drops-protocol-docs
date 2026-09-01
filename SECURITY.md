# Security policy

## Reporting a vulnerability

Report privately. Do not open a public issue for a security finding.

Use GitHub's private vulnerability reporting for this repository:
<https://github.com/bitcoinuniverseio/drops-protocol-docs/security/advisories/new>

If the finding is in the OP_DROP carrier protocol or its documentation, report it at
<https://github.com/bitcoinuniverseio/op-drop/security/advisories/new> instead.

If the finding is in a Bitcoin Universe product or service rather than in this
documentation, follow the security policy published at <https://docs.bitcoinuniverse.io>.

## What is in scope here

This repository holds documentation, test vectors and two client-side tools. In scope:

- A normative rule stated incorrectly, so that an implementation following this
  documentation would accept something it must reject, or reject something it must accept.
- A test vector whose stated expected outcome is wrong.
- The payload decoder or the Pact outcome verifier reporting a false pass or a false fail.
- Either tool transmitting, storing or logging pasted input. Neither should do any of these,
  and both are single static files you can read.
- Cross-site scripting or content injection in a published page.
- Guidance that would lead a reader to expose a key, sign something they should not, or
  trust a record more than the protocol supports.

A disagreement between this documentation and the reference implementation is the most
valuable finding either can have, and it is worth reporting even when neither behaviour is
obviously dangerous. A byte string this documentation says is invalid but the implementation
accepts, or the reverse, is the ideal report.

## What is out of scope

- Vulnerabilities in Bitcoin itself, or in Taproot, BIP 340 or BIP 341.
- Vulnerabilities in the reference indexer's deployment or infrastructure. Report those
  through the product security policy above.
- The fact that anyone can commit arbitrary content to Bitcoin. That is a property of the
  chain, not a defect in this protocol, and no protocol change can remove data from Bitcoin.
- Content published by third parties in Drops records. Serving decisions belong to the
  operator serving them.

## A useful report

Include what you did, what you expected, what happened, and the smallest input that
reproduces it. For a protocol-level finding, a test vector in the style of
<https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/test-vectors.html> is the most
useful thing you can send: the bytes, the rule you believe applies, and the outcome you
believe is correct.

Please do not include private keys, seed phrases or credentials in a report. They are never
necessary to demonstrate a finding here.

## Response

Reports are triaged through GitHub's advisory workflow on the repository they were filed
against. Documentation corrections that change what an implementation should do are recorded
as rule changes in the
[version history](https://bitcoinuniverseio.github.io/drops-protocol-docs/changelog.html).
