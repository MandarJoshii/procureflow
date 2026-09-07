import { z } from "zod";

export const createRFQSchema = z.object({
  title: z.string().min(3, "Title is too short").max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  vendorIds: z.array(z.string()).min(1, "Invite at least one vendor"),
});

export type CreateRFQInput = z.infer<typeof createRFQSchema>;

export const updateRFQStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "CLOSED", "AWARDED"]),
});

export type UpdateRFQStatusInput = z.infer<typeof updateRFQStatusSchema>;