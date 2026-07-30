# Drops Pacts

**Turn clear agreements into histories people can follow on Bitcoin.**

Drops Pacts gives an agreement a lasting identity, a visible current state, and
a trail of confirmed changes. The goal is simple: everyone should be able to
see what was agreed, what changed, and which part Bitcoin itself proves.

## Agreements with a beginning, a present, and a history

```mermaid
flowchart LR
  A[Review the terms] --> B[Create the Pact]
  B --> C[Follow the current state]
  C --> D[Confirm a change]
  D --> E[Revisit the shared history]
```

The Pact Seed preserves the starting identity. The live Pact Cell points to the
current state. Each accepted update connects that state to its successor in a
confirmed Bitcoin transaction.

## Experiences Pacts can shape

| Experience | What stays visible |
| --- | --- |
| Shared custody | Controllers, recovery expectations, and the current agreement state |
| Escrow | Release and refund paths alongside the confirmed history |
| Vesting | Beneficiary, schedule, and progress through the agreement |
| Community treasury | Shared policy, current state, and approved changes |
| Asset policy | The agreement attached to a readable op-drop experience |

## Proof without pretending

Bitcoin can enforce signatures, timelocks, and whether a specific output has
already been spent. A compatible Pact experience also checks the agreement's
declared rules. The interface keeps that boundary visible so people know which
conditions Bitcoin enforces directly and which belong to Pact validation.

Common states stay plain:

- **Verified:** the confirmed change and its agreement proof belong together.
- **Waiting for proof:** Bitcoin shows a commitment, but the supporting record
  is not available yet.
- **Closed:** the live agreement output was spent without a recognized next
  Pact state.
- **Recorded:** the agreement exists on Bitcoin, without claiming that a later
  change has already been verified.

## Before you join or sign

Review the agreement identity, the visible terms, the current state, the next
state, the destination, and the miner fee. Keep signing inside a wallet you
trust. Drops and Pacts tools never need a seed phrase or private key.

[Discover Drops Pacts](../pages/pacts.html) or
[shape an agreement in Pacts Studio](../pages/studio.html).
