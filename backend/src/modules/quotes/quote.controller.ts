import { Request, Response } from "express";
import { createQuoteSchema } from "./quote.schema";
import { createQuote, selectQuote } from "./quote.service";

export async function createQuoteController(req: Request, res: Response) {
  const parseResult = createQuoteSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const { organizationId } = req.user!;
    const rfqId = req.params.rfqId as string;
    const quote = await createQuote(organizationId, rfqId, parseResult.data);
    return res.status(201).json(quote);
  } catch (err) {
    if (err instanceof Error && err.message === "RFQ_NOT_FOUND") {
      return res.status(404).json({ error: "RFQ_NOT_FOUND" });
    }
    if (err instanceof Error && err.message === "VENDOR_NOT_INVITED") {
      return res.status(422).json({ error: "VENDOR_NOT_INVITED" });
    }
    console.error("Create quote error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function selectQuoteController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const rfqId = req.params.rfqId as string;
    const quoteId = req.params.quoteId as string;
    const quote = await selectQuote(organizationId, rfqId, quoteId);
    return res.status(200).json(quote);
  } catch (err) {
    if (err instanceof Error && err.message === "RFQ_NOT_FOUND") {
      return res.status(404).json({ error: "RFQ_NOT_FOUND" });
    }
    if (err instanceof Error && err.message === "QUOTE_NOT_FOUND") {
      return res.status(404).json({ error: "QUOTE_NOT_FOUND" });
    }
    console.error("Select quote error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}