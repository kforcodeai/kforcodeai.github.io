# LinkedIn template — Question → Stake → Answer → Door

One per article, drafted the same day. Keep in `docs/harness-atlas/linkedin/<slug>.md`.

## Rules (the ones that actually move numbers)

- **Give the answer away.** The post must be independently valuable. A teaser gets low
  dwell and no shares; the blog is for the reader who wants the trade-off table and the drills.
- **≤ 1,300 characters** so the "see more" fold lands after the hook, never mid-answer.
- **The hook is a real question with a contested answer.** Must survive truncation at ~210 chars.
- **One number, one source.** A single concrete figure does more than three adjectives.
- **Link at the end of the body *and* pinned as the first comment.** Test both, assume neither penalty nor bonus.
- **One native image**: the harness map with this post's block lit. Series-recognizable at thumbnail size.
- **Reply to every comment for 90 minutes.** This matters more than posting time.
- Three hashtags, topical. No emoji ladders. No "🧵".

## Skeleton

```
<HOOK — one question, no jargon>

<STAKE — two lines: the obvious answer, and why it's wrong>

<ANSWER — 3-5 short lines or a 3-row mini-table. The real mechanism.>

<PROOF — one number, one attribution>

<DOOR — what the long version adds, then the link>

#agents #llm #softwarearchitecture
```

---

## Worked example — P03 (context compaction)

> Your agent's context is full. Do you summarize it, or delete it?
>
> Most harnesses summarize. It's both the more expensive option and the lossier one —
> you pay an extra model call to produce something you can no longer audit.
>
> The cheaper ladder, in order:
>
> 1. Cap tool output; spill anything large to disk and keep a reference
> 2. Replace all but the 3 newest tool results with short placeholders
> 3. *Only then* spend a model call summarizing the old middle
>
> Eviction works because the agent already extracted what it needed from that 2MB of
> grep output. The summary is trying to preserve information that stopped mattering
> twenty turns ago.
>
> Long version — the trade-off table, the failure modes, and 5 interview questions from
> "what's in a tool_result" up to staff level: <link>
>
> #agents #llm #softwarearchitecture

## Worked example — T08 (Agentless)

> Eight harnesses into a teardown series, here's the uncomfortable one: what if you
> don't need the agent loop at all?
>
> Agentless replaces autonomous tool use with a fixed three-stage pipeline — localize,
> repair, test. No loop. No planner. And it stays competitive with agents that cost
> multiples more per issue.
>
> What the loop actually buys you:
>
> - recovery from its own mistakes
> - handling tasks whose shape you can't predict
> - and a bill that scales with how confused it gets
>
> If your task shape is known, the loop is a tax.
>
> I read it as the control group for the whole series: <link>

## Worked example — C01 (the matrix)

> I read 8 open-source agent harnesses and compared them across 10 subsystems.
>
> The thing that surprised me: they don't disagree about the loop. They disagree about
> what to *stop sending* — and that single choice explains most of the cost difference
> between them.
>
> Three patterns that showed up everywhere:
>
> - Everyone implements all ten subsystems. Most do 4 of them by accident.
> - The cheapest harnesses are the ones that delete most aggressively.
> - Nobody enforces a budget *before* the call. Everyone detects overspend afterward.
>
> Full table — 10 subsystems × 8 harnesses, every cell citing a file and a commit: <link>

---

## Cadence

| Every | Format |
|---|---|
| Post | Question → Stake → Answer → Door, one native diagram |
| 3rd post | Carousel PDF — one diagram split into 6-8 frames (highest reach on the platform, and the diagram already exists) |
| Wave 3 | The matrix post. This is the one with a real shot at going wide — save the best diagram for it. |
