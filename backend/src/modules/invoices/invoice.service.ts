import { prisma } from "../../config/db";
import { startApprovalInstance } from "../approvals/approval.service";
import type { CreateInvoiceInput } from "./invoice.schema";

/**
 * Vendor (or org staff on their behalf) submits an invoice against an
 * already-APPROVED Purchase Order. Immediately starts a new approval
 * instance scoped to the invoice itself — this is the finance sign-off
 * step required before payment can ever be released.
 */
export async function createInvoice(organizationId: string, input: CreateInvoiceInput) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: input.purchaseOrderId, organizationId, status: "APPROVED" },
  });

  if (!po) {
    throw new Error("APPROVED_PO_NOT_FOUND");
  }

  const existingInvoice = await prisma.invoice.findFirst({
    where: { purchaseOrderId: po.id },
  });

  if (existingInvoice) {
    throw new Error("INVOICE_ALREADY_EXISTS");
  }

  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      purchaseOrderId: po.id,
      vendorId: po.vendorId,
      amount: input.amount,
      status: "SUBMITTED",
    },
    include: { vendor: true, purchaseOrder: true },
  });

  await startApprovalInstance(organizationId, { invoiceId: invoice.id });

  return invoice;
}

export async function listInvoices(organizationId: string) {
  return prisma.invoice.findMany({
    where: { organizationId },
    include: {
      vendor: true,
      purchaseOrder: true,
      payment: true,
      approvalInstances: {
        include: { steps: { orderBy: { sequenceOrder: "asc" } } },
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getInvoiceById(organizationId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      vendor: true,
      purchaseOrder: true,
      payment: true,
      approvalInstances: {
        include: {
          steps: {
            orderBy: { sequenceOrder: "asc" },
            include: { assignedApprover: { select: { id: true, email: true } } },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  return invoice;
}

/**
 * Called by approval.service.ts when an invoice's approval instance
 * reaches a final state, to sync the Invoice's own status.
 */
export async function syncInvoiceStatusWithApproval(
  invoiceId: string,
  approvalStatus: "APPROVED" | "REJECTED"
) {
  if (approvalStatus === "APPROVED") {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "APPROVED" },
    });
  }
  // if rejected, status stays SUBMITTED for now — a dedicated REJECTED
  // enum value could be added later if we need to distinguish this case
}