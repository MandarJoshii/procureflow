import { z } from "zod";

export const quoteLineItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const createQuoteSchema = z.object({
  vendorId: z.string(),
  notes: z.string().max(1000).optional(),
  lineItems: z.array(quoteLineItemSchema).min(1, "Add at least one line item"),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;