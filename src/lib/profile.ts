import { z } from "zod";

/**
 * The minimum we need to contextualise guidance (brief 3.1 and 6.7). Kept in
 * the browser only; sent with each question, never stored on a server.
 */
export const BUSINESS_CATEGORIES = [
  "General merchandise retail",
  "Wholesale",
  "Food & beverages",
  "Hardware & building materials",
  "Clothing & textiles",
  "Electronics & phones",
  "Salon & beauty",
  "Other services",
] as const;

export const REGISTRATION_STATUSES = [
  "Not registered yet",
  "Registered business name (URSB)",
  "Registered company",
  "Not sure",
] as const;

export const LICENCE_STATUSES = [
  "Have a valid trading licence",
  "Licence expired or expiring",
  "No trading licence",
  "Not sure",
] as const;

export const profileSchema = z.object({
  businessName: z.string().trim().max(80).default(""),
  category: z.enum(BUSINESS_CATEGORIES),
  location: z.string().trim().min(2).max(80),
  operations: z.string().trim().max(240).default(""),
  registration: z.enum(REGISTRATION_STATUSES),
  licence: z.enum(LICENCE_STATUSES),
});

export type Profile = z.infer<typeof profileSchema>;

export const DEMO_PROFILE: Profile = {
  businessName: "Nakato General Store",
  category: "General merchandise retail",
  location: "Kikuubo, Kampala",
  operations: "Retail shop selling household goods, soap, sugar and school supplies; 2 employees",
  registration: "Registered business name (URSB)",
  licence: "Licence expired or expiring",
};

export function describeProfile(p: Profile): string {
  return [
    p.businessName ? `Business name: ${p.businessName}` : null,
    `Category: ${p.category}`,
    `Location: ${p.location}`,
    p.operations ? `Operations: ${p.operations}` : null,
    `Registration status: ${p.registration}`,
    `Trading licence status: ${p.licence}`,
  ]
    .filter(Boolean)
    .join("\n");
}
