import { Request, Response } from "express";
import {
  initiatePayment,
  getPaymentByInvoiceId,
  verifyWebhookSignature,
  markPaymentCompleted,
} from "./payment.service";

export async function initiatePaymentController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(422).json({ error: "VALIDATION_ERROR" });
    }

    const payment = await initiatePayment(organizationId, invoiceId);
    return res.status(201).json(payment);
  } catch (err) {
    if (err instanceof Error && err.message === "APPROVED_INVOICE_NOT_FOUND") {
      return res.status(404).json({ error: "APPROVED_INVOICE_NOT_FOUND" });
    }
    if (err instanceof Error && err.message === "PAYMENT_ALREADY_INITIATED") {
      return res.status(409).json({ error: "PAYMENT_ALREADY_INITIATED" });
    }
    console.error("Initiate payment error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getPaymentController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const payment = await getPaymentByInvoiceId(organizationId, req.params.invoiceId as string);
    return res.status(200).json(payment);
  } catch (err) {
    if (err instanceof Error && err.message === "PAYMENT_NOT_FOUND") {
      return res.status(404).json({ error: "PAYMENT_NOT_FOUND" });
    }
    console.error("Get payment error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

/**
 * Handles incoming Razorpay webhooks. This endpoint is NOT protected by
 * our normal requireAuth middleware, since Razorpay's servers (not a
 * logged-in user) call it directly. Instead, it's protected by verifying
 * the webhook signature — this is what proves the request genuinely came
 * from Razorpay and wasn't forged by an attacker hitting this URL directly.
 */
export async function razorpayWebhookController(req: Request, res: Response) {
  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody = JSON.stringify(req.body);

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ error: "INVALID_SIGNATURE" });
  }

  try {
    const transferId = req.body?.payload?.transfer?.entity?.id ?? "";
    await markPaymentCompleted(transferId);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    // still return 200 so Razorpay doesn't endlessly retry a payment
    // we can't match — log it for manual investigation instead
    return res.status(200).json({ received: true, warning: "PAYMENT_NOT_MATCHED" });
  }
}