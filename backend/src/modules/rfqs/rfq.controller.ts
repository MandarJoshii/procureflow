import { Request, Response } from "express";
import { createRFQSchema } from "./rfq.schema";
import { createRFQ, listRFQs, getRFQById } from "./rfq.service";

export async function createRFQController(req: Request, res: Response) {
  const parseResult = createRFQSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const { organizationId, userId } = req.user!;
    const rfq = await createRFQ(organizationId, userId, parseResult.data);
    return res.status(201).json(rfq);
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_VENDOR_SELECTION") {
      return res.status(422).json({ error: "INVALID_VENDOR_SELECTION" });
    }
    console.error("Create RFQ error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function listRFQsController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const rfqs = await listRFQs(organizationId);
    return res.status(200).json(rfqs);
  } catch (err) {
    console.error("List RFQs error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getRFQController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const rfq = await getRFQById(organizationId, req.params.id as string);
    return res.status(200).json(rfq);
  } catch (err) {
    if (err instanceof Error && err.message === "RFQ_NOT_FOUND") {
      return res.status(404).json({ error: "RFQ_NOT_FOUND" });
    }
    console.error("Get RFQ error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}