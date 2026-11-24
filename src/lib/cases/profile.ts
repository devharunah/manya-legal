import { z } from "zod";

/** What MANYA asks a trader once (PRD 9.1/9.2): enough to fill a report, nothing more. */
export const BUSINESS_TYPES = [
  "general_retail",
  "wholesale",
  "food_beverages",
  "hardware",
  "clothing",
  "electronics",
  "beauty",
  "other",
] as const;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{9,16}$/, "Enter a phone number, e.g. 0772 123456"),
  preferredLanguage: z.enum(["en", "lug"]),
  businessName: z.string().trim().max(80).default(""),
  businessType: z.enum(BUSINESS_TYPES),
  location: z.string().trim().max(80).default(""),
});
