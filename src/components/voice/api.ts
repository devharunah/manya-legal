/** Browser-side calls to /api/voice/*. The speech service key never leaves the server. */

async function readJson<T>(res: Response): Promise<T> {
  const data = res.headers.get("content-type")?.includes("application/json")
    ? ((await res.json()) as T | { error: string })
    : { error: "The voice service is busy. Please try again in a moment." };
  if (!res.ok || (typeof data === "object" && data !== null && "error" in data)) {
    throw new Error((data as { error?: string }).error ?? "Something went wrong.");
  }
  return data as T;
}

/** Voice note to text, for the trader to check before sending. */
export class NoSpeechError extends Error {
  constructor() {
    super("No words heard");
    this.name = "NoSpeechError";
  }
}

export async function transcribe(wav: Blob, language: "lug" | "eng" = "lug"): Promise<string> {
  const form = new FormData();
  form.append("audio", wav, "question.wav");
  form.append("language", language);
  const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
  // 422: the service heard no words yet. Normal for the first seconds of a live recording.
  if (res.status === 422) throw new NoSpeechError();
  return (await readJson<{ text: string }>(res)).text;
}
