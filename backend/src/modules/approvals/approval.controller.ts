import { Request, Response } from "express";
import { decideApprovalStepSchema } from "./approval.schema";
import { decideApprovalStep, getApprovalInstance } from "./approval.service";

export async function getApprovalInstanceController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const instance = await getApprovalInstance(organizationId, req.params.id as string);
    return res.status(200).json(instance);
  } catch (err) {
    if (err instanceof Error && err.message === "APPROVAL_INSTANCE_NOT_FOUND") {
      return res.status(404).json({ error: "APPROVAL_INSTANCE_NOT_FOUND" });
    }
    console.error("Get approval instance error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function decideApprovalStepController(req: Request, res: Response) {
  const parseResult = decideApprovalStepSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const { organizationId, userId } = req.user!;
    const { decision, comment } = parseResult.data;

    const result = await decideApprovalStep(
      organizationId,
      req.params.id as string,
      userId,
      decision,
      comment
    );

    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      const knownErrors = [
        "APPROVAL_INSTANCE_NOT_FOUND",
        "APPROVAL_STEP_NOT_FOUND",
        "APPROVAL_ALREADY_FINALIZED",
        "STEP_ALREADY_DECIDED",
      ];
      if (knownErrors.includes(err.message)) {
        return res.status(409).json({ error: err.message });
      }
      if (err.message === "NOT_ASSIGNED_APPROVER") {
        return res.status(403).json({ error: "NOT_ASSIGNED_APPROVER" });
      }
    }
    console.error("Decide approval step error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}