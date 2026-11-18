# Manya Legal: SME Legal Companion

Plain-language, source-cited guidance on Ugandan business law for small business owners.
**Hack4Justice 2026** (JLOS Justice Week), track **SME legal support**.

> A small business owner describes a legal or regulatory problem in ordinary language, and Manya
> Legal explains the relevant Ugandan law, what it means for that business and what the owner can
> reasonably do next, citing the official source for every point.

- Concept note: [`docs/CONCEPT_NOTE.md`](docs/CONCEPT_NOTE.md)
- Demo pitch and script: [`docs/DEMO_PITCH.md`](docs/DEMO_PITCH.md)

## MVP scope

The user is a general merchandise retailer in Kikuubo, Kampala. The domain is trading licences, business registration (URSB), TIN and related compliance. The three scenarios from the brief are part of the eval set in `src/data/evals.ts`.

## How it works

```
question + business profile (browser only)
        │
        ▼
BM25 retrieval over curated official sources ── out of scope? ──► refuse + legal-aid referral
        │                                                         (no AI call)
        ▼
OpenAI via Vercel AI SDK, generateObject with a strict schema
(answer only from the chunks; cite chunk ids; never invent fees, fines or sections)
        │
        ▼
validation: drop citations not retrieved, mark unsupported claims,
warn on amounts not in sources, flag older text
        │
        ▼
answer card: direct answer · what the law says · what it means for you ·
next steps · what to double-check · sources · where to get help
```

| Path | What lives there |
|---|---|
| `src/data/kb/` | Sources and chunks, each tagged with legal currency |
| `src/lib/kb/retrieve.ts` | BM25 retriever and domain/score refusal gate |
| `src/lib/answer/` | Prompt, answer schema, validation and fallbacks |
| `src/app/api/ask/route.ts` | The pipeline |
| `src/components/` | Answer card, source drawer, profile form, ask view |

Without `OPENAI_API_KEY`, or if the model call fails, the app still runs. It shows the matching official provisions directly instead of an explanation.

## Run it

```bash
pnpm install
cp .env.example .env.local   # add OPENAI_API_KEY
pnpm dev
```

`pnpm verify` runs lint, typecheck, Jest (KB integrity, retrieval evals, validator) and Playwright.

## Deploy

The repository is connected to the Vercel project `manya-legal`. Each PR gets a preview deployment and `main` deploys to production. Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in the Vercel project's environment variables.

## Sources and their limits

The official sources are ULII (Trade (Licensing) Act), URA, KCCA and URSB. ULII and KCCA pages sit behind bot protection, so the 2023 revised edition and the 2015 Amendment Act text were not available to us. Those positions are described from KCCA and URA guidance and labelled as official summaries. Lawyers should review the knowledge base before any real-world use.

Built on the `claude-nextjs-supabase-template` Claude Code harness. See `CLAUDE.md`.
