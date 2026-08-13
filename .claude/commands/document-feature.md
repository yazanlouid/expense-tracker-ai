<!--
description: Generate paired developer + user documentation for a feature
argument-hint: <feature name or short description>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(npm run dev:*), Bash(git log:*), Bash(git diff:*), Bash(git status:*)
-->

## Input

Feature to document: $ARGUMENTS

If this is empty or too vague to identify real code (e.g. just "feature"), stop and ask the user
to name the feature or point to the relevant files/component. Do not guess.

## What you're building

Two documents for the feature above, grounded only in code you actually read — never invent
behavior, config, or UI copy that isn't in the source:

1. `docs/dev/<feature-slug>-implementation.md` — technical reference for developers
2. `docs/user/how-to-<action-slug>.md` — plain-language walkthrough for end users

Follow this project's CLAUDE.md conventions throughout: concise, no fluff, code paths in
backticks, `file:line` references for anything specific. This app is a fully client-side Next.js
SPA with **no backend or API routes** — everything is React state backed by `localStorage`. Never
describe anything here as "backend" in the server sense.

## Step 1 — Find the relevant code

1. `Grep`/`Glob` the codebase for the feature name and obvious synonyms across `src/`.
2. Cross-check against recent history for signal on what's actually new/changed:
   `git log --oneline -15` and `git diff main...HEAD --stat` (skip if on `main` already).
3. Read every matched file in full — component(s), the `src/lib` module(s) it depends on, and its
   types in `src/lib/types.ts`. Don't rely on filenames alone; confirm relevance by content.
4. If nothing matches with reasonable confidence, tell the user what you searched for and stop
   rather than fabricating a doc for code that doesn't exist.

## Step 2 — Classify the feature

Based on the files found:

- **UI-only** — lives entirely in `src/components/` or `src/app/`, no new state/storage logic.
- **Data/state layer** — lives in `src/lib/` (e.g. a new `useX()` hook, a new `localStorage` key,
  new pure functions), with no significant new UI.
- **Full feature (UI + state)** — touches both, e.g. a new component wired to a new or extended
  hook in `src/lib/`.

State the classification at the top of the dev doc in one line. This replaces "frontend / backend
/ full-stack" for this codebase — call it out explicitly so nobody assumes a server exists.

## Step 3 — Learn the existing doc conventions

- `Glob` `docs/dev/**/*.md` and `docs/user/**/*.md`.
- If prior docs exist, read one of each and match their heading structure, tone, and any metadata
  block instead of the defaults below.
- If `docs/dev/` or `docs/user/` don't exist yet, create them — this run establishes the pattern,
  so keep it clean and reusable for next time.
- Note any existing docs whose topic overlaps this feature (shared component, shared category,
  same part of the app) — you'll link to them, not edit them.

## Step 4 — Write the developer doc

`docs/dev/<feature-slug>-implementation.md` (kebab-case the feature name for `<feature-slug>`).

```markdown
# <Feature Name> — Implementation

**Type:** <UI-only | Data/state layer | Full feature> · **Last updated:** <today's date>

## Overview
1-3 sentences: what it does and why it exists, in this app's terms.

## Architecture / data flow
How data moves: component -> hook -> localStorage, or whatever the real path is. Call out the
localStorage key if a new/changed one is involved, and confirm the load/save effect pair follows
the existing `isLoaded`-gated try/catch pattern described in CLAUDE.md — flag it in this doc if it
doesn't.

## Key files
- `path/to/File.tsx:12` — what it's responsible for
(only real files you read, with real line numbers for the load-bearing parts)

## Types & interfaces
Relevant types from `src/lib/types.ts` or local ones, only if they changed or are central.

## Edge cases & gotchas
Anything non-obvious you noticed reading the code (empty states, validation limits, simulated vs
real behavior if this touches Export Center's fake integrations, etc).

## Related documentation
- [How to <do the thing>](../user/how-to-<action-slug>.md)
- any overlapping existing docs found in Step 3
```

## Step 5 — Write the user doc

`docs/user/how-to-<action-slug>.md`. `<action-slug>` is the feature rephrased as a short action
("password reset" -> "reset-password"); if no natural rephrasing exists, reuse `<feature-slug>`.

```markdown
# How to <do the thing>

*Last updated: <today's date>*

<1-2 sentence plain-language summary of what this lets you do, no jargon.>

## Before you start
Only include this section if there's a real prerequisite (e.g. "you need at least one expense
logged"). Omit otherwise.

## Steps
1. <Action.>

   ![Screenshot: <what should be visible here>](./assets/<feature-slug>/step-1.png)

2. <Action.>

   ![Screenshot: <what should be visible here>](./assets/<feature-slug>/step-2.png)

(one screenshot placeholder per step that shows meaningfully different UI state — don't add one
for trivial steps like "click Save")

## Tips
Only real, useful tips grounded in the code (e.g. actual validation limits, actual defaults).

## Related guides
- links to any overlapping existing user docs found in Step 3

---
For implementation details, see the [developer doc](../dev/<feature-slug>-implementation.md).
```

## Step 6 — Screenshots

Try, in order:
1. If a browser-automation tool or the `run` skill's screenshot capability is available in this
   session, use it: start the dev server (`npm run dev`), navigate to the states each step
   describes, and save real PNGs to `docs/user/assets/<feature-slug>/step-N.png`, updating the
   markdown image paths to match.
2. If nothing like that is available, leave the placeholders from Step 5 exactly as written —
   don't fake having taken screenshots, and say so plainly in your final summary to the user.

## Step 7 — Cross-link, don't rewrite

Add links to related existing docs found in Step 3 inside the two new files' "Related" sections.
Do not edit any pre-existing doc file to add backlinks — that's out of scope for this command and
those files aren't yours to change without being asked.

## Step 8 — Report back

Short summary: the two file paths created, the feature's classification from Step 2, whether
screenshots are real or placeholders, and any related docs you linked to.
