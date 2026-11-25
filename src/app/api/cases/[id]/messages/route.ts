import { z } from "zod";

import { fail, json, withStore } from "@/lib/api";
import { scriptedExtract } from "@/lib/demo/script";
import { enT } from "@/lib/i18n/translate";
import { type TraderInput, TranslationError, intakeTurn } from "@/lib/intake/engine";
import { extractFields } from "@/lib/intake/extract";
import { getVoiceProvider, hasVoice } from "@/lib/voice/provider";

export const maxDuration = 60;

const bodySchema = z.union([
  z.object({
    text: z.string().trim().min(1).max(1500),
    inputType: z.enum(["text", "voice"]),
  }),
  z.object({ skip: z.literal(true) }),
]);

/** One trader message (or "I don't know") into the guided intake. */
export const POST = (req: Request, ctx: RouteContext<"/api/cases/[id]/messages">) =>
  withStore(async (store) => {
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Write a message of up to 1,500 characters.", 400);
    const record = await store.getCase(id);
    if (!record) return fail("Case not found.", 404);
    if (record.status === "completed") return fail("This case is closed.", 409);

    const input: TraderInput =
      "skip" in parsed.data
        ? { kind: "skip" }
        : { kind: "message", text: parsed.data.text, inputType: parsed.data.inputType };
    if (record.language === "lug" && input.kind === "message" && !hasVoice()) {
      return fail("Luganda isn't available right now. Please switch to English.", 503);
    }

    try {
      const result = await intakeTurn(store, record, input, {
        // Live demo cases read the prepared answers without AI; anything else is read as usual.
        extract: async (english, context) =>
          (record.intake.demo === "live" && scriptedExtract(english)) ||
          extractFields(english, context),
        toEnglish: (text) => getVoiceProvider().translate(text, "eng", "lug"),
        questionText: (key) => enT(key as Parameters<typeof enT>[0]),
      });
      return json(result);
    } catch (error) {
      if (error instanceof TranslationError) {
        return fail("We couldn't translate your message. Try again, or switch to English.", 502);
      }
      throw error;
    }
  });
