import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string().min(2, "Vendor name is too short").max(200),
  contactEmail: z.string().email("Invalid email address"),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;