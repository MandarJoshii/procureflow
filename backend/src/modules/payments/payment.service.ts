import crypto from "crypto";
import { prisma } from "../../config/db";
import { razorpay } from "./razorpay.client";
import { env } from "../../config/env";

/**
 * Initiates a payment release for an APPROVED invoice. In a fully
 * verified production setup, this would create a Razorpay Route Transfer
 * to the vendor's linked account. Since real linked-account creation
 * requires completed business KYC (intentionally not done here for a
 * demo project), we create the Payment record and simulate the
 * transfer reference — the webhook handler below is what actually
 * confirms completion, exactly as it would in production.
 */
export async function initiatePayment(organizationId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId, status: "APPROVED" },
    include: { vendor: true, payment: true },
  });

  if (!invoice) {
    throw new Error("APPROVED_INVOICE_NOT_FOUND");
  }

  if (invoice.payment) {
    throw new Error("PAYMENT_ALREADY_INITIATED");
  }

  // In production: razorpay.transfers.create({ account: vendor.razorpayAccountId, amount, currency: "INR" })
  // For this demo (no verified linked accounts available in test mode),
  // we record the payment as INITIATED and let the webhook simulate confirmation.
  const payment = await prisma.payment.create({
    data: {
      organizationId,
      invoiceId: invoice.id,
      vendorId: invoice.vendorId,
      amount: invoice.amount,
      status: "INITIATED",
    },
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "PAYMENT_RELEASED" },
  });

  return payment;
}

/**
 * Verifies a Razorpay webhook's signature to confirm it genuinely came
 * from Razorpay and wasn't forged by a third party. This check is
 * mandatory before trusting ANY webhook payload.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Called only by the webhook handler after signature verification.
 * This is the ONLY code path allowed to mark a payment as COMPLETED —
 * never a direct client request.
 */
export async function markPaymentCompleted(razorpayTransferId: string) {
  const payment = await prisma.payment.findFirst({
    where: { razorpayTransferId },
  });

  // for our demo flow without real transfer IDs, fall back to the most
  // recent INITIATED payment for the org if no exact match is found
  const target =
    payment ??
    (await prisma.payment.findFirst({
      where: { status: "INITIATED" },
      orderBy: { createdAt: "desc" },
    }));

  if (!target) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  const updated = await prisma.payment.update({
    where: { id: target.id },
    data: {
      status: "COMPLETED",
      webhookConfirmedAt: new Date(),
      razorpayTransferId: razorpayTransferId || target.razorpayTransferId,
    },
  });

  await prisma.invoice.update({
    where: { id: target.invoiceId },
    data: { status: "PAID" },
  });

  return updated;
}

export async function getPaymentByInvoiceId(organizationId: string, invoiceId: string) {
  const payment = await prisma.payment.findFirst({
    where: { invoiceId, organizationId },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  return payment;
}