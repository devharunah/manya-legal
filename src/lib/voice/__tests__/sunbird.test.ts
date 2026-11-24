/** @jest-environment node */
import { createSunbird } from "../sunbird";
import { VoiceServiceError } from "../types";

type Call = { url: string; init: RequestInit };

function fakeFetch(...responses: Response[]) {
  const calls: Call[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    return next;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const sleep = jest.fn(async () => {});

function sunbird(fetchFn: typeof fetch) {
  return createSunbird({ apiKey: "k", voice: "Namuli", fetch: fetchFn, sleep });
}

describe("Sunbird adapter", () => {
  beforeEach(() => sleep.mockClear());

  it("translates with a bearer token and the documented field names", async () => {
    const { fn, calls } = fakeFetch(
      json({ output: { translated_text: " Genda e KCCA. " }, status: "COMPLETED" }),
    );
    await expect(sunbird(fn).translate("Go to KCCA.", "lug", "eng")).resolves.toBe("Genda e KCCA.");

    const [call] = calls;
    expect(call?.url).toBe("https://api.sunbird.ai/tasks/translate");
    expect(new Headers(call?.init.headers).get("authorization")).toBe("Bearer k");
    expect(JSON.parse(String(call?.init.body))).toEqual({
      text: "Go to KCCA.",
      target_language: "lug",
      source_language: "eng",
    });
  });

  it("leaves source_language out so the service detects it", async () => {
    const { fn, calls } = fakeFetch(json({ output: { translated_text: "Hi" } }));
    await sunbird(fn).translate("Hi", "eng");
    expect(JSON.parse(String(calls[0]?.init.body))).not.toHaveProperty("source_language");
  });

  it("always sends Luganda as the transcription language", async () => {
    const { fn, calls } = fakeFetch(json({ audio_transcription: "Nkole ki?" }));
    const text = await sunbird(fn).transcribe(new Blob(["x"], { type: "audio/wav" }));
    expect(text).toBe("Nkole ki?");
    const form = calls[0]?.init.body as FormData;
    expect(form.get("language")).toBe("lug");
    expect(form.get("audio")).toBeInstanceOf(Blob);
  });

  it("returns audio bytes from text-to-speech in stream mode", async () => {
    const { fn, calls } = fakeFetch(
      new Response(new Uint8Array([82, 73, 70, 70]), { headers: { "content-type": "audio/wav" } }),
    );
    const speech = await sunbird(fn).synthesize("Genda.");
    expect(speech.contentType).toBe("audio/wav");
    expect(speech.audio.byteLength).toBe(4);
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({
      voice: "Namuli",
      language: "lug",
      response_mode: "stream",
    });
  });

  it("rejects a speech response that isn't audio", async () => {
    const { fn } = fakeFetch(json({ audio_url: "https://..." }));
    await expect(sunbird(fn).synthesize("Genda.")).rejects.toBeInstanceOf(VoiceServiceError);
  });

  it("retries once after a 429, honouring Retry-After", async () => {
    const { fn, calls } = fakeFetch(
      json({ detail: "slow down" }, 429, { "retry-after": "2" }),
      json({ output: { translated_text: "ok" } }),
    );
    await expect(sunbird(fn).translate("x", "lug")).resolves.toBe("ok");
    expect(calls).toHaveLength(2);
    expect(sleep).toHaveBeenCalledWith(2_000);
  });

  it("raises a typed error with the status, without the upstream body", async () => {
    const { fn } = fakeFetch(json({ detail: "secret upstream detail" }, 500));
    const error = await sunbird(fn)
      .translate("x", "lug")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(VoiceServiceError);
    expect((error as VoiceServiceError).status).toBe(500);
    expect((error as Error).message).not.toContain("secret");
  });

  it("treats an empty translation as a failure", async () => {
    const { fn } = fakeFetch(json({ output: { translated_text: null } }));
    await expect(sunbird(fn).translate("x", "lug")).rejects.toBeInstanceOf(VoiceServiceError);
  });
});
