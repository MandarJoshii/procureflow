import { prisma } from "../../config/db";
import type { CreateRFQInput } from "./rfq.schema";

export async function createRFQ(
  organizationId: string,
  createdByUserId: string,
  input: CreateRFQInput
) {
  // verify every invited vendor actually belongs to this org (tenant isolation)
  const validLinks = await prisma.organizationVendor.findMany({
    where: {
      organizationId,
      vendorId: { in: input.vendorIds },
    },
  });

  if (validLinks.length !== input.vendorIds.length) {
    throw new Error("INVALID_VENDOR_SELECTION");
  }

  const rfq = await prisma.rFQ.create({
    data: {
      organizationId,
      createdByUserId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      status: "SENT",
      vendorInvites: {
        create: input.vendorIds.map((vendorId) => ({ vendorId })),
      },
    },
    include: {
      vendorInvites: { include: { vendor: true } },
    },
  });

  return rfq;
}

export async function listRFQs(organizationId: string) {
  return prisma.rFQ.findMany({
    where: { organizationId },
    include: {
      vendorInvites: { include: { vendor: true } },
      quotes: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRFQById(organizationId: string, rfqId: string) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, organizationId }, // organizationId check prevents cross-tenant access
    include: {
      vendorInvites: { include: { vendor: true } },
      quotes: {
        include: {
          vendor: true,
          lineItems: true,
        },
      },
    },
  });

  if (!rfq) {
    throw new Error("RFQ_NOT_FOUND");
  }

  return rfq;
}