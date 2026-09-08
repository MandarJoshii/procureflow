import { Request, Response } from "express";
import { createInvoiceSchema } from "./invoice.schema";
import { createInvoice, listInvoices, getInvoiceById } from "./invoice.service";

export async function createInvoiceController(req: Request, res: Response) {
  const parseResult = createInvoiceSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const { organizationId } = req.user!;
    const invoice = await createInvoice(organizationId, parseResult.data);
    return res.status(201).json(invoice);
  } catch (err) {
    if (err instanceof Error && err.message === "APPROVED_PO_NOT_FOUND") {
      return res.status(404).json({ error: "APPROVED_PO_NOT_FOUND" });
    }
    if (err instanceof Error && err.message === "INVOICE_ALREADY_EXISTS") {
      return res.status(409).json({ error: "INVOICE_ALREADY_EXISTS" });
    }
    console.error("Create invoice error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function listInvoicesController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const invoices = await listInvoices(organizationId);
    return res.status(200).json(invoices);
  } catch (err) {
    console.error("List invoices error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getInvoiceController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const invoice = await getInvoiceById(organizationId, req.params.id as string);
    return res.status(200).json(invoice);
  } catch (err) {
    if (err instanceof Error && err.message === "INVOICE_NOT_FOUND") {
      return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
    }
    console.error("Get invoice error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}