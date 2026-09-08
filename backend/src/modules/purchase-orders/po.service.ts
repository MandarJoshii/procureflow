import { prisma } from "../../config/db";
import { startApprovalForPurchaseOrder } from "../approvals/approval.service";

/**
 * Generates a Purchase Order from an awarded (SELECTED) quote. Copies the
 * quote's line items onto the PO, then immediately kicks off the approval
 * workflow by creating an ApprovalInstance for it.
 */
export async function createPurchaseOrderFromQuote(
  organizationId: string,
  createdByUserId: string,
  rfqId: string,
  quoteId: string
) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, rfqId, status: "SELECTED" },
    include: { lineItems: true, rfq: true },
  });

  if (!quote) {
    throw new Error("SELECTED_QUOTE_NOT_FOUND");
  }

  if (quote.rfq.organizationId !== organizationId) {
    throw new Error("SELECTED_QUOTE_NOT_FOUND");
  }

  // prevent creating duplicate POs for the same RFQ
  const existingPO = await prisma.purchaseOrder.findFirst({
    where: { rfqId },
  });

  if (existingPO) {
    throw new Error("PO_ALREADY_EXISTS");
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      organizationId,
      rfqId,
      vendorId: quote.vendorId,
      createdByUserId,
      status: "PENDING_APPROVAL",
      totalAmount: quote.amount,
      lineItems: {
        create: quote.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
    include: { lineItems: true, vendor: true },
  });

  await startApprovalForPurchaseOrder(organizationId, po.id);

  return po;
}

export async function listPurchaseOrders(organizationId: string) {
  return prisma.purchaseOrder.findMany({
    where: { organizationId },
    include: {
      vendor: true,
      lineItems: true,
      approvalInstances: {
        include: { steps: { orderBy: { sequenceOrder: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseOrderById(organizationId: string, poId: string) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, organizationId },
    include: {
      vendor: true,
      lineItems: true,
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

  if (!po) {
    throw new Error("PO_NOT_FOUND");
  }

  return po;
}

/**
 * Called after an approval instance reaches a final state, to sync the
 * PurchaseOrder's own status with the outcome of its approval chain.
 */
export async function syncPOStatusWithApproval(poId: string, approvalStatus: "APPROVED" | "REJECTED") {
  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: approvalStatus === "APPROVED" ? "APPROVED" : "REJECTED" },
  });
}