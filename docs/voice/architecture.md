# Luganda voice: architecture decision

Status: accepted, 24 Nov 2026. Builds on the team paper "Luganda Conversational AI".
Phase 1 (voice notes) is built on Sunbird AI. Crane is not yet tested. Measurements are in [poc-results.md](poc-results.md).

## How it is built

| Piece | Where |
|---|---|
| Speech service interface, Sunbird adapter, e2e mock | `src/lib/voice/` |
| Answer translation with the number check | `src/lib/voice/translate-answer.ts` |
| Routes: `transcribe`, `question`, `answer`, `speak` | `src/app/api/voice/` |
| Recording (turned into 16 kHz WAV in the browser), playback | `src/components/voice/`, `src/lib/audio/` |
| Turning voice on | `SUNBIRD_API_KEY`; no key, no microphone button |
| Not an open proxy | `/api/ask` signs each answer, and `/api/voice/answer` signs each speech piece (`src/lib/voice/sign.ts`). Translation and speech refuse anything unsigned, so the routes can't be used to spend our credits on arbitrary text |
| What is read aloud | Built on the server: law points without a source and lines left in English are never spoken; caveats are |

## Decision

We will build **Option A**: speech-to-text, then our existing checked answer, then text-to-speech. The trader uses it like a voice note. A hands-free **call mode** will follow, built on the same steps. **Option B**, real-time speech-to-speech, is on hold.

## Why not Option B now

1. **No service offers live Luganda speech.** Gemini Live does not list Luganda. Sunbird's text-to-speech builds the whole clip before sending any of it. Crane does not say it offers streaming.
2. **It would get around our safeguards.** In a live speech-to-speech system the model talks as it thinks. Manya Legal checks every answer before anyone sees it: citations must point to sources we actually retrieved, money amounts must appear in our sources, and out-of-scope questions are refused. Legal content must never be spoken before that check runs.
3. **Vercel functions cannot keep the always-open connections a live call needs.**

We will look at Option B again when a service offers live Luganda speech in both directions. Even then, the live layer would handle only turn-taking and filler phrases. Legal content would still be spoken only after the check.

## Why English sits in the middle

Our sources, the search over them and the answer checks all work in English. A Luganda question is therefore:
1. transcribed;
2. translated to English;
3. **shown to the trader to confirm or edit**;
4. answered by the existing `/api/ask`.

The checked English answer is then translated to Luganda in full. The original law text is never translated: it is shown as written, in English, labelled as such.

The translated answer is checked too. Every number, money amount and section number in the English answer must appear in the Luganda version. If one is missing, that part stays in English with a warning.

## Services

We have no budget, so every service must be usable on a free tier. Crane and Sunbird are both built behind one `VoiceProvider` interface. A short test (Phase 0) of about 10 recorded Luganda questions decides which one is the default.

| | Sunbird AI | Crane Voice Studio |
|---|---|---|
| Speech-to-text (Luganda) | Yes (`lug`) | Yes |
| Text-to-speech (Luganda) | Yes, 8 voices | Yes, watermarked |
| Translation | Yes (`sunflower-9b`) | No. Use Gemini or Sunbird |
| Free use | Free sign-up; limits not published | 100 credits ≈ 10,000 characters of speech |
| Keeps recordings | Appears to (cloud storage URL returned) | Yes, until you ask for deletion |

Gemini, which we already use on a free key, is the translation fallback.

## Privacy

Before the first recording, the trader is told:

> "Your voice is sent to [provider] to turn it into text. They may keep the recording. We don't."

Manya Legal stores no audio. The only new profile field is the preferred language, and it is kept in the browser.

## Phases

0. Sign up for both services, record test clips, score them, pick defaults. Results go in `docs/voice/poc-results.md`.
1. Voice notes: record, confirm the transcript, get a checked answer in Luganda, play it on demand.
2. Call mode: hands-free listening that notices when the trader stops talking, plays answers automatically and lets the trader interrupt. The aim is about 6 to 12 seconds to the first sound.
3. Option B: on hold, as above.
