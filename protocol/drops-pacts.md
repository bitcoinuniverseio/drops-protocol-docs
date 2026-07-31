# Drops Pacts

**Turn clear agreements into histories people can follow on Bitcoin.**

Drops Pacts is a protocol and verification design for agreement records on
Bitcoin. Its aim is simple: people should be able to see what was agreed, what
changed, and which part Bitcoin itself proves.

## Current implementation status

Today, InScribe Pacts Studio creates proposals, blueprints, hashes, and optional
Drops references. The Drops reference indexer reports `mode: reference` through
`GET /pacts/capabilities`. It is not a transaction, signature, broadcast,
custody, live Pact Cell, contract-execution, or value-bearing Pact authority.
Pacts write requests to that reference service are rejected.

No funds or live Pact state are held here. If another screen claims a Pact
transaction is pending, do not sign or send funds. Keep the full blueprint and
plan hash, verify any Bitcoin transaction independently, and contact support
with the plan hash.

The model below describes a future audited deployment; it does not describe a
live custody or settlement service.

## Agreements with a beginning, a present, and a history

```mermaid
flowchart LR
  A[Review the terms] --> B[Create the Pact]
  B --> C[Follow the current state]
  C --> D[Confirm a change]
  D --> E[Revisit the shared history]
```

In a future audited Pacts system, a Pact Seed would preserve the starting
identity and a Pact Cell would identify the current state. Each accepted update
would connect that state to its successor in a confirmed Bitcoin transaction.

## Experiences Pacts can shape

| Experience | What stays visible |
| --- | --- |
| Shared custody | Controllers, recovery expectations, and the current agreement state |
| Escrow | Release and refund paths alongside the confirmed history |
| Vesting | Beneficiary, schedule, and progress through the agreement |
| Community treasury | Shared policy, current state, and approved changes |
| Asset policy | The agreement attached to a readable OP_DROP experience |

These are future-model examples, not services currently offered by the
reference indexer or Pacts Studio.

## Proof without pretending

Bitcoin can enforce signatures, timelocks, and whether a specific output has
already been spent. A compatible Pact experience would also check the
agreement's declared rules. The interface must keep that boundary visible so
people know which conditions Bitcoin enforces directly and which depend on Pact
validation.

Common future states would stay plain:

- **Verified:** the confirmed change and its agreement proof belong together.
- **Waiting for proof:** Bitcoin shows a commitment, but the supporting record
  is not available yet.
- **Closed:** the live agreement output was spent without a recognized next
  Pact state.
- **Recorded:** the agreement exists on Bitcoin, without claiming that a later
  change has already been verified.

## Before you use a future Pacts system

Review the agreement identity, visible terms, current and next state,
destination, and miner fee. Keep signing inside a wallet you trust. Drops and
Pacts tools never need a seed phrase or private key.

[Discover Drops Pacts](../pages/pacts.html) or
[shape a proposal in Pacts Studio](../pages/studio.html).
