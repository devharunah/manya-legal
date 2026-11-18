import { activeProvider, modelId } from "../provider";

const KEYS = ["AI_PROVIDER", "GOOGLE_GENERATIVE_AI_API_KEY", "OPENAI_API_KEY", "GEMINI_MODEL"];

describe("activeProvider", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
  });
  afterAll(() => {
    process.env = saved;
  });

  it("is null with no keys, so the app falls back to sources-only", () => {
    expect(activeProvider()).toBeNull();
  });

  it("prefers Gemini when both keys are set", () => {
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] = "g";
    process.env["OPENAI_API_KEY"] = "o";
    expect(activeProvider()).toBe("google");
  });

  it("honours AI_PROVIDER when its key exists", () => {
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] = "g";
    process.env["OPENAI_API_KEY"] = "o";
    process.env["AI_PROVIDER"] = "openai";
    expect(activeProvider()).toBe("openai");
  });

  it("uses OpenAI when only its key is set", () => {
    process.env["OPENAI_API_KEY"] = "o";
    expect(activeProvider()).toBe("openai");
  });

  it("lets GEMINI_MODEL override the default", () => {
    expect(modelId("google")).toBe("gemini-3.8-flash");
    process.env["GEMINI_MODEL"] = "gemini-3.5-flash";
    expect(modelId("google")).toBe("gemini-3.5-flash");
  });
});
