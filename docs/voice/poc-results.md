# Luganda voice: test results

Measured 24 Nov 2026 on Sunbird AI's free tier, from Kampala, through our own `/api/voice/*` routes. **Crane has not been tested yet**: it needs an account to see its API docs. Add it here when it is.

These are a handful of runs, not a benchmark. The next step is about 10 real recordings from different speakers, scored by a Luganda speaker.

## Speed

| Step | Time | Notes |
|---|---|---|
| Voice note → Luganda text | 11–16 s | for 9 s of audio |
| Luganda question → English | 1–4 s | English text passes through unchanged |
| English answer → Luganda (7 lines) | ~7 s | lines are sent in parallel; 6 at once took the same time as 1 |
| Luganda text → speech | 5–6 s for a short sentence, 14–18 s for two long ones | Sunbird makes the whole clip before sending, so we speak in short pieces |
| Replaying a clip | instant | cached on our server and in the browser |

**"Listen" on a full answer** (6 pieces of 64–133 characters, all requested at once): first sound after ~10 s. The pieces arrived at 10, 11, 21, 28, 30 and 47 s, so Sunbird seems to process 2–3 at a time. Expect a pause partway through long answers. A cold Sunbird worker once took 24 s for a single short sentence, so speech calls get 55 s before we give up.

A full voice question therefore takes about **30–45 seconds** before the Luganda answer is on screen. The English answer appears earlier, and audio takes a further 5–8 seconds once you press play. That is fine for a voice note. It is far from the 2–3 seconds of a phone call, which is why live calling (Option B) is on hold.

## Accuracy: what went wrong

| Case | What happened | How we handle it |
|---|---|---|
| Transcribing "KCCA" | Heard as "kessisye" | The transcript goes into the question box, so the trader can fix it before asking |
| Transcribing "12" (spoken by the TTS voice) | Garbled ("ttiwandayire") | Same as above |
| Translating "fine" | Became **"Omusolo" (tax)** | Machine-translation warning on every Luganda answer; English one tap away |
| Translating "your shop needs a renewal" | Became "your **building** needs **repairing**" | Same as above |
| Translating "valid for 12 months" | "12" written as words, so the number check failed | The line stays in English, and the trader is told why |
| Translating "2 passport photos" | "2" written as a word | Allowed: we only check numbers of 10 or more, and section numbers |
| Translating "Section 8(1)" | Kept as "Ekitundu 8(1)" | Passes the check |

**Conclusion:** the number check catches dropped amounts and section numbers, but it cannot catch a wrong word. Before the demo, a Luganda speaker should review the Luganda answers to the three demo questions. Recurring mistakes (fine → tax, renewal → repair) are candidates for a fixed glossary later.

## Privacy

Sunbird's transcription response includes a Google Cloud Storage link to the uploaded audio, so it keeps a copy. We found no published retention policy. The app tells traders this before they record.

## Cost

Sunbird's free tier did not refuse any request during these tests. Its limits aren't published, so we have emailed to ask for hackathon access.
