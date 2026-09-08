import { z } from "zod";

export const decideApprovalStepSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().max(1000).optional(),
});

export type DecideApprovalStepInput = z.infer<typeof decideApprovalStepSchema>;