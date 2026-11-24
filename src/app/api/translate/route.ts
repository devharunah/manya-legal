import { z } from "zod";

import { createRateLimiter } from "@/lib/rate-limit";
import { keepsNumbers } from "@/lib/text/numbers";
import { guard, serviceFailure } from "@/lib/voice/http";
import { getVoiceProvider } from "@/lib/voice/provider";

export const maxDuration = 60;

const allow = createRateLimiter({ limit: 20, windowMs: 60_000 });
const bodySchema = z.object({ text: z.string().trim().min(1).max(2000) });

/**
 * English to Luganda for MANYA's own generated text (the AI summary). A
 * translation that changes or adds a number is refused, never shown.
 */
export async function POST(req: Request) {
  const blocked = guard(req, allow);
  if (blocked) return blocked;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send some text." }, { status: 400 });
  try {
    const text = await getVoiceProvider().translate(parsed.data.text, "lug", "eng");
    if (!keepsNumbers(parsed.data.text, text)) {
      return Response.json({ error: "The translation changed a number." }, { status: 422 });
    }
    return Response.json({ text });
  } catch (error) {
    return serviceFailure("translate", error, "The Luganda version isn't available right now.");
  }
}
