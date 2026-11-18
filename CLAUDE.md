@AGENTS.md

# CLAUDE.md

## Project context

**Manya Legal (SME Legal Companion)** explains Ugandan business law in plain language to small
business owners, starting with a Kikuubo general retailer and trading-licence compliance. Built for
JLOS Hack4Justice 2026, track "SME legal support".

**Non-negotiables (from the product brief):** answers are grounded only in the curated knowledge
base in `src/data/kb/`; never invent Acts, sections, fines or procedures; every legal statement
carries a citation; separate what the law requires from how it may apply; say when sources don't
cover a question; we are not a substitute for a lawyer; collect only the minimum business profile
(kept in the browser, not a database).

**Stack**

- Framework: Next.js 16, App Router
- Language: TypeScript, strict
- UI: React 19, Tailwind CSS v4 through PostCSS
- AI: Vercel AI SDK (`ai`, `@ai-sdk/openai`), `generateObject` with Zod schemas
- Data: curated JSON knowledge base + in-repo BM25 retriever. No database in the MVP
- Package manager: pnpm, pinned in `packageManager`

**Layout**

| Path | What lives there |
|---|---|
| `src/app/` | Routes, layouts and pages |
| `src/lib/` | Pure modules: retrieval, prompts, validation |
| `src/lib/ai/model.ts` | OpenAI model, built per request so builds run without a key |
| `src/data/kb/` | Curated legal sources, one chunk per provision or FAQ answer, with `asOf` dates |
| `src/lib/env.ts` | `requireEnv`. Every environment variable goes through it |
| `next.config.ts` | Next config. Typed, and where `typedRoutes` and `typedEnv` are switched on |
| `eslint.config.ts` | ESLint flat config. TypeScript, loaded through `jiti` |
| `e2e/` | Playwright. Anything that renders or fetches belongs here |
| `**/__tests__/` | Jest. Pure modules only |
| `.claude/` | The Claude Code harness. See `.claude/README.md` |

## Environment

Never read `process.env` directly. Call `requireEnv` from `src/lib/env.ts`, so a missing variable
fails at the point of use with a message naming the variable and pointing at `.env.example`.

Add every new variable to `.env.example` in the same commit as the code that reads it. A variable
that only exists in someone's `.env.local` does not exist.

`OPENAI_API_KEY` is server only. Never import `src/lib/ai/model.ts` from a client component.

## TypeScript

`strict` is on, and so are the flags `strict` leaves out. The ones that change how you write code:

| Flag | What it costs you |
|---|---|
| `noUncheckedIndexedAccess` | `arr[0]` and `record[key]` come back `T \| undefined`. Narrow before use |
| `exactOptionalPropertyTypes` | `{ a?: string }` will not accept `{ a: undefined }`. Omit the key instead |
| `noPropertyAccessFromIndexSignature` | Index signatures need brackets: `process.env["CI"]`, never `process.env.CI` |
| `verbatimModuleSyntax` | Type-only imports must say `import type`. No exceptions |
| `noUnusedLocals`, `noUnusedParameters` | An unused binding fails the build. Prefix with `_` if it has to stay |
| `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride` | Every branch returns, every case breaks, every override is declared |

Biome's `useLiteralKeys` is off in `biome.json` because it is the exact inverse of
`noPropertyAccessFromIndexSignature`: it rewrites `process.env["CI"]` back to `process.env.CI`,
which the compiler then rejects. The compiler flag wins, so the lint rule goes. Do not switch it
back on without removing the compiler flag in the same commit.

`typedRoutes` generates route types into `.next/types`, so a bad `Link href` is a compile error.
`experimental.typedEnv` types the variables the dev server loaded. Both write into `.next/types`,
which a clean clone does not have, so `pnpm typecheck` runs `next typegen` first. That is why the
script is not a bare `tsc --noEmit`: without it, CI would typecheck a project whose route and env
types do not exist yet and pass for the wrong reason.

`next-env.d.ts` is generated and git-ignored, on Next's own instruction. Never edit it, and never
commit it back.

## The test split

This is the line that decides where a test goes:

- **Jest** covers pure modules. No DOM that matters, no network, no LLM.
- **Playwright** covers anything that renders, fetches or runs on the server. It boots the real
  app, so it is the only place that can prove a Server Action actually runs. A `"use server"`
  module typechecks cleanly and still fails the first time a person presses submit.

Jest and Playwright both claim `*.spec.ts` by default. `jest.config.cjs` ignores `e2e/`
explicitly. Without that, Jest collects the Playwright suite, finds no browser, and reports a wall
of failures that look like the unit tests broke. **Name unit tests `*.test.ts`.**

## Before you push

```bash
pnpm verify
```

That chains lint, typecheck, Jest and Playwright. Do not push if any step fails. Keep the branch
buildable at every commit.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `style`, `refactor`, `test`, `chore`, `docs`, `perf`, `ci`, `revert`.

Subject line in imperative mood, lowercase, no trailing period, 72 characters at most. Breaking
changes take a `!` after the type or scope and a `BREAKING CHANGE:` footer.

Commit early and often. One logical change per commit, never unrelated changes bundled together.

## Branches

Never push to `main`. Everything goes through a PR, and `main` stays deployable.

```
<type>/<short-description>
```

CI runs on every PR and must be green before merge.

## What the harness adds

`.claude/` carries subagents, slash commands, skills, rules and hooks, vendored from
[everything-claude-code](https://github.com/devharunah/everything-claude-code). Read
`.claude/README.md` for what is there and what was changed from upstream.

**This file wins.** Where a vendored rule disagrees with anything above, the text here is the
answer. The vendored rules were written for a general audience and know nothing about this
project.
