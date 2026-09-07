import { prisma } from "../../config/db";
import type { CreateVendorInput } from "./vendor.schema";

/**
 * Creates a vendor and immediately links it to the calling organization.
 * If a vendor with the same contact email already exists globally (shared
 * vendor identity model), we reuse that vendor record and just create a new
 * org-link instead of duplicating the vendor.
 */
export async function createVendor(organizationId: string, input: CreateVendorInput) {
  let vendor = await prisma.vendor.findFirst({
    where: { contactEmail: input.contactEmail },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: input.name,
        contactEmail: input.contactEmail,
      },
    });
  }

  const existingLink = await prisma.organizationVendor.findUnique({
    where: {
      organizationId_vendorId: {
        organizationId,
        vendorId: vendor.id,
      },
    },
  });

  if (existingLink) {
    throw new Error("VENDOR_ALREADY_LINKED");
  }

  const link = await prisma.organizationVendor.create({
    data: {
      organizationId,
      vendorId: vendor.id,
      status: "PENDING_VERIFICATION",
    },
    include: { vendor: true },
  });

  return link;
}

export async function listVendors(organizationId: string) {
  return prisma.organizationVendor.findMany({
    where: { organizationId },
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
  });
}