import { withFallback } from "../fallback";
import { type VoiceProvider, VoiceServiceError } from "../types";

const quota = () => Promise.reject(new VoiceServiceError("Sunbird failed", 429));

const primary = (overrides: Partial<VoiceProvider>): VoiceProvider => ({
  name: "sunbird",
  transcribe: async () => "from sunbird",
  translate: async () => "from sunbird",
  synthesize: async () => ({ audio: new ArrayBuffer(0), contentType: "audio/wav" }),
  ...overrides,
});

const backup = {
  transcribe: jest.fn(async () => "from model"),
  translate: jest.fn(async () => "from model"),
};

describe("withFallback", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses the speech service while it works, without loading the model", async () => {
    const load = jest.fn(async () => backup);
    const v = withFallback(primary({}), load);
    expect(await v.transcribe(new Blob(["x"]), "lug")).toBe("from sunbird");
    expect(load).not.toHaveBeenCalled();
  });

  it("falls back to the model when the speech service is over quota", async () => {
    const v = withFallback(primary({ transcribe: quota, translate: quota }), async () => backup);
    expect(await v.transcribe(new Blob(["x"]), "eng")).toBe("from model");
    expect(backup.transcribe).toHaveBeenCalledWith(expect.any(Blob), "eng");
    expect(await v.translate("Hi", "lug", "eng")).toBe("from model");
  });

  it("never falls back for Luganda speech output", async () => {
    const v = withFallback(primary({ synthesize: quota }), async () => backup);
    await expect(v.synthesize("Genda")).rejects.toThrow(VoiceServiceError);
  });
});
