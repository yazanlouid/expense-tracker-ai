---
description: Audit changes against this project's landmines — timezone math, isLoaded gates, NaN divisors, empty states, category colors
argument-hint: [paths, or "all" — defaults to uncommitted changes]
allowed-tools: Read, Grep, Glob, Bash(npm run lint), Bash(npx tsc --noEmit), Bash(git status:*), Bash(git diff:*)
---

Scope: $ARGUMENTS — empty → uncommitted (`git status --short`, `git diff`, `git diff --staged`);
`all` → `src/`; else treat as paths. Conformance to CLAUDE.md only — complements `/code-review`.

## 1. Gates

`npm run lint` and `npx tsc --noEmit`. Both clean on `master`, so any output is from this change.
Report verbatim. No test suite exists — never report "tests pass".

## 2. Sweep

Read every grep hit in context; report only what survives — a false positive costs more than a miss.

**Dates**

- `new Date(` on an ISO string (`e.date`, `range.start`, any `*ISO`) → UTC midnight, a day early
  west of Greenwich, wrong bucket. Fix: `iso.split("-").map(Number)` → `new Date(y, m-1, d)`.
- `.toISOString()` on a Date built from local parts → same shift; use `toISO`/`todayISO()`.
  Pre-existing at `analytics.ts:20` and `utils.ts:30` — flag only if the change touches them.
- A date-dependent function missing `reference: Date = new Date()` last, or range filtering moved to
  `Date` objects (lexicographic `YYYY-MM-DD` is deliberate).

**Numbers**

- Unguarded division (`/ total`, `/ count`, `/ length`, any `share`/`percent`/`average`) → `NaN%` on
  the empty periods that are normal here. Fix: `total > 0 ? part / total : 0`.
- `percentChange` coerced with `?? 0` or `|| 0` — `null` means "no prior data", not a confident
  wrong `0%`. Same for `topCategory` and `suggestedMonthlyBudget`.

**State**

- `localStorage.setItem` in a `useEffect` with no `if (!isLoaded) return` — the initial empty state
  overwrites stored data on first render. Also check the loader: `try/catch`, empty fallback,
  `typeof window === "undefined"` guard.
- A key not namespaced `expense-tracker:`, or a changed `Expense` shape — stored data is trusted
  after only `Array.isArray`, so a shape change has no migration path.
- A second `useExpenses()` treated as shared state. It's a hook, not a context; `/` and `/insights`
  hold separate copies, so sharing live state means lifting to a provider.

**UI**

- A new list/chart/card with no empty state — `.map(` over a prop array, no `length === 0` branch.
- A category color hardcoded outside `categories.ts`; `CATEGORY_META` is the only source.
- A new chart encoding by color alone — the palette isn't colorblind-safe (`#a855f7` ≈ `#3b82f6`
  under deuteranopia). Direct-label like `CategoryBreakdown`, or `role="img"` + `aria-label` like
  `MonthlyInsights`. `Charts.tsx`'s pie is a known gap — flag only if touched.
- A write path skipping `ExpenseForm.validate` (amount > 0 and ≤ 1,000,000, description 2–200 chars,
  date capped at today) — the store accepts anything.
- A hand-written string union instead of `as const` + `(typeof X)[number]`. Adding to
  `EXPENSE_CATEGORIES` *must* break `CATEGORY_META`'s typecheck — don't loosen it with `Partial<>`.

**Flag, don't fix:** anything on CLAUDE.md's do-not-without-asking list — server paths, new
state/UI/icon libraries, dark mode, reformatting, deps added in passing.

## 3. Report

Order by severity: breaks silently (dates, `isLoaded`, `NaN`, coerced `null`) > breaks loudly >
convention. Per finding give `file:line`, the rule, the concrete failure it produces (wrong bucket,
`NaN%`, overwritten data — not "violates convention"), and the fix naming the existing helper. Close
with a verdict plus lint/tsc results. **If it's clean, say exactly that** — don't pad with
speculation about untouched code.
