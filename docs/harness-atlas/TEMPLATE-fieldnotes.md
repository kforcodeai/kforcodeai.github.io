# Field notes — <harness>

> The primary artifact of the reading phase. Append-only, written *while* reading.
> Plain markdown, no tooling, no schema. Notes strictly dominate a matrix on information:
> a filled cell is lossy, a note is not. You can project notes → matrix later; you can
> never project matrix → notes.

**Repo** · `<org>/<repo>`
**Read at** · `<sha>` · YYYY-MM-DD
**Time spent** ·

## Facts (safe to record, no interpretation)

license · language · lines in the core loop · tool count · provider count ·
interaction model · last release

## The ten questions

Answer only what the code actually shows. `not present` is a real answer and often the
interesting one. Every claim gets `path/file.py:L120`.

- **01 Loop** — who decides the next action, who decides to stop?
- **02 Tools** — what is the action space, what comes back?
- **03 Context** — what is re-sent every turn, what gets dropped first?
- **04 State** — what survives the process, how is it resumed?
- **05 Delegate** — when does work move to a fresh context, what returns?
- **06 Guard** — what can it not do, who is asked?
- **07 Extend** — how is capability added without a permanent prompt tax?
- **08 Model** — how many models, which dialects, chosen how?
- **09 Cost** — where does the money actually go?
- **10 Eval** — can you replay it, can you prove it got better?

## Surprises

Anything that contradicted what I expected walking in. Cheap to write now, impossible to
reconstruct later.

## Pillar ledger — the point of the whole exercise

For every mechanism found: what does it buy, in which currency, and what does it spend?
Fill this *while reading*, not while drafting.

`▲ improves · ▼ degrades · ● neutral · ◆ depends on workload`

| Mechanism | Accuracy | Latency | Cost | Free win or real trade? | Evidence |
|---|:--:|:--:|:--:|---|---|
| | | | | | |

**What does this harness optimize for?** (input tokens · latency · accuracy · cost per successful
task — most optimize the first, almost none the last)

**Latency observations** — the neglected pillar. Sandbox boot, tool-call concurrency, synchronous
hooks, compaction blocking the loop, retry backoff, time-to-first-token:

## Candidate axes

Questions that turned out to be *discriminating* here. Tag each with the harnesses it has
also discriminated in — an axis needs three before it earns a column (PLAN.md §4).

| Candidate axis | Pillar it moves | Also seen discriminating in | Count |
|---|---|---|---|
| | | | |

An axis that cannot be connected to accuracy, latency or cost is trivia, however cleanly it
separates harnesses.

## Doesn't fit the ten

**The most valuable section in this file.** Observations with nowhere to go. This is where an
eleventh primitive comes from, or where one of the ten turns out to want splitting in two.

## Singular — no counterpart anywhere else

Feeds block 05b of the teardown and C01's showcase section. Do **not** try to make these
into shared axes; the n/a majority test says they are features, not dimensions.

## Verdict

- **Optimizing for:** (the steelman, one sentence)
- **One idea worth stealing:** (named mechanism + file link)
- **Where it will bite you:** (one sentence)
