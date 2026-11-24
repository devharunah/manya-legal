import { fail, json, withStore } from "@/lib/api";
import { profileSchema } from "@/lib/cases/profile";

export const GET = () => withStore(async (store) => json({ profile: await store.getProfile() }));

export const PUT = (req: Request) =>
  withStore(async (store) => {
    const parsed = profileSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Check your name, phone number and business type.", 400);
    await store.saveProfile(parsed.data);
    return json({ profile: parsed.data });
  });
