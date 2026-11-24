# Deviations from the MANYA PRD (v1.0)

PRD section 20 asks us to record every place the build departs from the PRD. Each row below gives what we did instead and why.

| PRD | What we built | Why |
|---|---|---|
| 8.2 FastAPI backend | Next.js route handlers in the existing app (a modular monolith) | 8.2 allows adjusting to the team's repo. Keeping one language and one deploy target means fewer moving parts for the demo. |
| 8.2 JWT / session auth, 9.1 `password_hash` | Supabase anonymous sessions plus a registration profile (name, phone, business). No password. | Phone OTP needs a paid SMS provider and email isn't common among traders. The session is a real Supabase user, so row-level security applies exactly as it would with a login. Phone OTP is the next step. |
| 9.8 separate `document_extractions` table | The extraction is stored on the `documents` row (`extracted_metadata`, `extraction_confidence`) | The prototype keeps one extraction per document. Splitting it out later is a migration, not a redesign. |
| 9.9 `providers` table | Providers live in code (`src/data/providers.ts`), with their verification source and date | The list is small, curated and reviewed like the legal sources, so changes go through a PR. |
| 8.2 Tesseract OCR | The vision model reads each document and returns its category and fields in one structured response | Better on phone photos and WhatsApp screenshots. The trader still confirms every field, and `unknown` is allowed when the model isn't confident. |
| 8.2 ReportLab | `pdf-lib`, with Noto Sans embedded (SIL OFL, in `src/assets/fonts`) | Pure JavaScript that runs on Vercel. The embedded font covers Luganda letters such as ŋ. |
| 9.3 one status column | `cases.status` holds the 4.6 workflow states. The 7.2 dashboard labels (evidence collection, referral prepared and so on) are worked out from the case's documents and referrals. | Only the backend moves the workflow (`src/lib/cases/state.ts`). Display labels don't need their own transitions. |
| 4.5 example JSON shape | Intake is stored as flat field keys (`transaction.amount` and so on), each with its value, provenance and a confirmed flag | Missing fields, questions, provenance labels and edits all use the same key. The report rebuilds the 4.5 grouping. |
| 6.4 CADR practitioner directory | Institutions only, each checked against its own official page. No individual practitioners. | We have no authoritative register to verify individuals against, and 6.4 forbids an unchecked "verified" label. Also, CADR stopped being an independent body on 23 Dec 2024 (Arbitration and Conciliation (Amendment) Act, Act 44 of 2024) and is now a department of the Ministry of Justice. |

## Guardrails kept exactly as the PRD states them

- The LLM only extracts fields and classifies documents. Workflow transitions, missing fields, consistency checks, pathway choices, consent and verification status are all decided in code (10.1).
- A value the model returns is kept only if it can be traced to the trader's own words (amounts, dates, phone numbers and currency are checked). Otherwise it is dropped and the question is asked again (4.4: "never invent missing information").
- Original Luganda text is stored next to the English it was read as (10.4).
- Uploaded originals are stored unchanged and fingerprinted with SHA-256, and are never labelled authentic (5.7).
- Nothing is shared with a provider automatically. The trader picks what goes into a package, gives consent, and downloads the package themselves (6.5).
