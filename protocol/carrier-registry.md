# One marker, one meaning

Drops keeps every kind of Bitcoin record easy to recognize. Each marker has one
clear purpose, so an artifact, token event, or agreement never quietly changes
meaning from one app to another.

## The Drops family

| Marker | What it represents | What you can understand |
| --- | --- | --- |
| `drops` | A compact Bitcoin artifact | The exact content, creator key, and proof anchor |
| `drops-pact` | The beginning of a Drops Pact | The agreement identity and the terms people started from |
| `drops-cell` | The current state of a Pact | Which agreement state is live now |
| `DPC1` | A confirmed Pact update | How one visible agreement state moved to the next |

## Why the distinction matters

- A Drop remains an artifact; it does not become a token balance.
- A token record counts only when its own confirmed rules recognize it.
- A Pact record describes an agreement; it does not rewrite an asset ledger.
- A transition marker points to a possible update, while the complete Bitcoin
  proof shows whether that update belongs to the agreement.

That separation keeps histories understandable long after a particular website
or visual style changes.

## Records keep their meaning

A confirmed Drops record keeps the meaning it had when it was created. New
experiences can present it with richer art and clearer storytelling, but they do
not get to redefine the original proof.

Explore [Drops artifacts](../pages/discover.html), meet
[op-drop and `$DROP`](../pages/op-drop.html), or discover
[Drops Pacts](../pages/pacts.html).
