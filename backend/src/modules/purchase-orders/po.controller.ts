import { Request, Response } from "express";
import {
  createPurchaseOrderFromQuote,
  listPurchaseOrders,
  getPurchaseOrderById,
} from "./po.service";

export async function createPOController(req: Request, res: Response) {
  try {
    const { organizationId, userId } = req.user!;
    const { rfqId, quoteId } = req.body;

    if (!rfqId || !quoteId) {
      return res.status(422).json({ error: "VALIDATION_ERROR" });
    }

    const po = await createPurchaseOrderFromQuote(organizationId, userId, rfqId, quoteId);
    return res.status(201).json(po);
  } catch (err) {
    if (err instanceof Error && err.message === "SELECTED_QUOTE_NOT_FOUND") {
      return res.status(404).json({ error: "SELECTED_QUOTE_NOT_FOUND" });
    }
    if (err instanceof Error && err.message === "PO_ALREADY_EXISTS") {
      return res.status(409).json({ error: "PO_ALREADY_EXISTS" });
    }
    console.error("Create PO error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function listPOsController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const pos = await listPurchaseOrders(organizationId);
    return res.status(200).json(pos);
  } catch (err) {
    console.error("List POs error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getPOController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const po = await getPurchaseOrderById(organizationId, req.params.id as string);
    return res.status(200).json(po);
  } catch (err) {
    if (err instanceof Error && err.message === "PO_NOT_FOUND") {
      return res.status(404).json({ error: "PO_NOT_FOUND" });
    }
    console.error("Get PO error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}