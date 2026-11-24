import { toAnswerText } from "@/lib/answer/text";
import type { Answer, LugandaAnswer, SpeechPiece } from "@/lib/answer/types";

/** Browser-side calls to /api/voice/*. The speech service key never leaves the server. */

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson<T>(res);
}

async function readJson<T>(res: Response): Promise<T> {
  const data = res.headers.get("content-type")?.includes("application/json")
    ? ((await res.json()) as T | { error: string })
    : { error: "The voice service is busy. Please try again in a moment." };
  if (!res.ok || (typeof data === "object" && data !== null && "error" in data)) {
    throw new Error((data as { error?: string }).error ?? "Something went wrong.");
  }
  return data as T;
}

export async function transcribe(wav: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", wav, "question.wav");
  const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
  return (await readJson<{ text: string }>(res)).text;
}

export async function questionToEnglish(text: string): Promise<string> {
  return (await postJson<{ english: string }>("/api/voice/question", { text })).english;
}

/** Only answers /api/ask signed can be translated; returns null when there's no token. */
export function answerToLuganda(answer: Answer): Promise<LugandaAnswer> | null {
  if (!answer.voiceToken) return null;
  return postJson<LugandaAnswer>("/api/voice/answer", {
    answer: toAnswerText(answer),
    supported: answer.lawSays.map((l) => l.supported),
    token: answer.voiceToken,
  });
}

export async function speak(piece: SpeechPiece): Promise<Blob> {
  const res = await fetch("/api/voice/speak", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(piece),
  });
  if (!res.ok || !res.headers.get("content-type")?.startsWith("audio/")) {
    await readJson(res);
    throw new Error("We couldn't read this aloud right now.");
  }
  return res.blob();
}
