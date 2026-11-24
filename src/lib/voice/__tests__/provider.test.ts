/** @jest-environment node */
import { getVoiceProvider, hasVoice } from "../provider";

const KEYS = ["SUNBIRD_API_KEY", "SUNBIRD_TTS_VOICE", "E2E_MOCK_VOICE", "VERCEL_ENV"];

describe("voice provider", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
  });
  afterAll(() => {
    process.env = saved;
  });

  it("is off with no key, so the mic is hidden", () => {
    expect(hasVoice()).toBe(false);
  });

  it("uses Sunbird when its key is set", () => {
    process.env["SUNBIRD_API_KEY"] = "k";
    expect(hasVoice()).toBe(true);
    expect(getVoiceProvider().name).toBe("sunbird");
  });

  it("uses the mock in e2e runs, without a key", () => {
    process.env["E2E_MOCK_VOICE"] = "1";
    expect(hasVoice()).toBe(true);
    expect(getVoiceProvider().name).toBe("mock");
  });

  it("never uses the mock on a Vercel production deploy", () => {
    process.env["E2E_MOCK_VOICE"] = "1";
    process.env["VERCEL_ENV"] = "production";
    expect(hasVoice()).toBe(false);
  });

  it("names the missing variable when asked to build without a key", () => {
    expect(() => getVoiceProvider()).toThrow("SUNBIRD_API_KEY");
  });
});
