import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/config/db";
import { startApprovalInstance, decideApprovalStep } from "../../src/modules/approvals/approval.service";

describe("approval authorization", () => {
  let orgId: string;
  let correctApproverId: string;
  let wrongUserId: string;
  let poId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { name: "Test Org - Approval Auth", slug: `test-approval-auth-${Date.now()}` },
    });
    orgId = org.id;

    const correctApprover = await prisma.user.create({
      data: {
        organizationId: orgId,
        email: `approver-${Date.now()}@test.com`,
        passwordHash: "irrelevant-for-this-test",
        role: "SUPER_ADMIN",
      },
    });
    correctApproverId = correctApprover.id;

    const wrongUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        email: `intruder-${Date.now()}@test.com`,
        passwordHash: "irrelevant-for-this-test",
        role: "BUYER",
      },
    });
    wrongUserId = wrongUser.id;

    const vendor = await prisma.vendor.create({
      data: { name: "Test Vendor", contactEmail: `vendor-${Date.now()}@test.com` },
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId: orgId,
        vendorId: vendor.id,
        createdByUserId: correctApproverId,
        status: "PENDING_APPROVAL",
        totalAmount: 1000,
      },
    });
    poId = po.id;

    await startApprovalInstance(orgId, { purchaseOrderId: poId });
  });

  afterAll(async () => {
    // clean up test data
    await prisma.approvalStep.deleteMany({ where: { approvalInstance: { organizationId: orgId } } });
    await prisma.approvalInstance.deleteMany({ where: { organizationId: orgId } });
    await prisma.purchaseOrder.deleteMany({ where: { organizationId: orgId } });
    await prisma.approvalChainStepDef.deleteMany({ where: { template: { organizationId: orgId } } });
    await prisma.approvalChainTemplate.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it("rejects a decision from a user who is not the assigned approver", async () => {
    const instance = await prisma.approvalInstance.findFirstOrThrow({
      where: { purchaseOrderId: poId },
    });

    await expect(
      decideApprovalStep(orgId, instance.id, wrongUserId, "APPROVED")
    ).rejects.toThrow("NOT_ASSIGNED_APPROVER");
  });

  it("allows the correctly assigned approver to approve", async () => {
    const instance = await prisma.approvalInstance.findFirstOrThrow({
      where: { purchaseOrderId: poId },
    });

    const result = await decideApprovalStep(orgId, instance.id, correctApproverId, "APPROVED");
    expect(result.status).toBe("APPROVED");
  });

  it("rejects a second decision on an already-finalized approval instance", async () => {
    const instance = await prisma.approvalInstance.findFirstOrThrow({
      where: { purchaseOrderId: poId },
    });

    await expect(
      decideApprovalStep(orgId, instance.id, correctApproverId, "APPROVED")
    ).rejects.toThrow("APPROVAL_ALREADY_FINALIZED");
  });
});