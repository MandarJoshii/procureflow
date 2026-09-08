import { z } from "zod";

export const createInvoiceSchema = z.object({
  purchaseOrderId: z.string(),
  amount: z.number().positive(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;