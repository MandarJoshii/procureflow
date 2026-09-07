import { prisma } from "../../config/db";
import type { CreateQuoteInput } from "./quote.schema";

export async function createQuote(
  organizationId: string,
  rfqId: string,
  input: CreateQuoteInput
) {
  // confirm this RFQ belongs to this org, and this vendor was actually invited to it
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, organizationId },
  });

  if (!rfq) {
    throw new Error("RFQ_NOT_FOUND");
  }

  const invite = await prisma.rFQVendorInvite.findUnique({
    where: {
      rfqId_vendorId: {
        rfqId,
        vendorId: input.vendorId,
      },
    },
  });

  if (!invite) {
    throw new Error("VENDOR_NOT_INVITED");
  }

  const totalAmount = input.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const quote = await prisma.quote.create({
    data: {
      rfqId,
      vendorId: input.vendorId,
      amount: totalAmount,
      notes: input.notes,
      lineItems: {
        create: input.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      vendor: true,
      lineItems: true,
    },
  });

  // mark the invite as responded
  await prisma.rFQVendorInvite.update({
    where: { id: invite.id },
    data: { respondedAt: new Date() },
  });

  return quote;
}

export async function selectQuote(organizationId: string, rfqId: string, quoteId: string) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, organizationId },
  });

  if (!rfq) {
    throw new Error("RFQ_NOT_FOUND");
  }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, rfqId },
  });

  if (!quote) {
    throw new Error("QUOTE_NOT_FOUND");
  }

  const [updatedQuote] = await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { status: "SELECTED" },
    }),
    prisma.quote.updateMany({
      where: { rfqId, id: { not: quoteId } },
      data: { status: "REJECTED" },
    }),
    prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: "AWARDED" },
    }),
  ]);

  return updatedQuote;
}