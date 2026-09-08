import { prisma } from "../../config/db";
import type { UserRole } from "@prisma/client";

/**
 * Ensures the organization has at least one approval chain template.
 * If none exists yet, creates a simple default: one step, requiring
 * any user with the APPROVER role (or SUPER_ADMIN, who can always act
 * as a fallback approver). This lets the system work immediately
 * without forcing manual configuration first.
 */
export async function getOrCreateDefaultTemplate(organizationId: string) {
  let template = await prisma.approvalChainTemplate.findFirst({
    where: { organizationId, department: null },
    include: { steps: { orderBy: { sequenceOrder: "asc" } } },
  });

  if (!template) {
    template = await prisma.approvalChainTemplate.create({
      data: {
        organizationId,
        name: "Default Approval Chain",
        department: null,
        steps: {
          create: [
            {
              sequenceOrder: 1,
              approverRole: "APPROVER",
            },
          ],
        },
      },
      include: { steps: { orderBy: { sequenceOrder: "asc" } } },
    });
  }

  return template;
}

/**
 * Finds a specific user in the org to assign as the approver for a given
 * step definition. If the step names a specific approverUserId, use that.
 * Otherwise, find any user with the required role. Falls back to
 * SUPER_ADMIN if no one with the exact role exists yet (keeps the demo
 * usable with just one user).
 */
export async function resolveApproverForStep(
  organizationId: string,
  stepDef: { approverRole: UserRole | null; approverUserId: string | null }
) {
  if (stepDef.approverUserId) {
    return stepDef.approverUserId;
  }

  const roleUser = await prisma.user.findFirst({
    where: { organizationId, role: stepDef.approverRole ?? undefined },
  });

  if (roleUser) return roleUser.id;

  const fallback = await prisma.user.findFirst({
    where: { organizationId, role: "SUPER_ADMIN" },
  });

  if (!fallback) {
    throw new Error("NO_APPROVER_AVAILABLE");
  }

  return fallback.id;
}

/**
 * Generic function that starts an approval instance anchored to either a
 * Purchase Order or an Invoice (never both). Used by both the PO and
 * Invoice modules to avoid duplicating this logic.
 */
export async function startApprovalInstance(
  organizationId: string,
  anchor: { purchaseOrderId?: string; invoiceId?: string }
) {
  const template = await getOrCreateDefaultTemplate(organizationId);

  const instance = await prisma.approvalInstance.create({
    data: {
      organizationId,
      templateId: template.id,
      purchaseOrderId: anchor.purchaseOrderId,
      invoiceId: anchor.invoiceId,
      status: "IN_PROGRESS",
      currentStepOrder: 1,
    },
  });

  const firstStepDef = template.steps[0];
  const approverId = await resolveApproverForStep(organizationId, firstStepDef);

  await prisma.approvalStep.create({
    data: {
      approvalInstanceId: instance.id,
      sequenceOrder: 1,
      assignedApproverId: approverId,
      status: "PENDING",
    },
  });

  return instance;
}

/**
 * Kept for backwards compatibility with existing calls — creates an
 * approval instance anchored specifically to a Purchase Order.
 */
export async function startApprovalForPurchaseOrder(
  organizationId: string,
  purchaseOrderId: string
) {
  return startApprovalInstance(organizationId, { purchaseOrderId });
}

/**
 * Records a decision (approve/reject) on the current pending step of an
 * approval instance. Only the assigned approver for that specific step
 * may act. On approval: if more steps exist in the template, creates the
 * next step as PENDING and advances currentStepOrder. If this was the
 * last step, marks the whole instance APPROVED. On rejection: the whole
 * instance is immediately marked REJECTED, no further steps are created.
 */
export async function decideApprovalStep(
  organizationId: string,
  approvalInstanceId: string,
  actingUserId: string,
  decision: "APPROVED" | "REJECTED",
  comment?: string
) {
  const instance = await prisma.approvalInstance.findFirst({
    where: { id: approvalInstanceId, organizationId },
    include: { template: { include: { steps: { orderBy: { sequenceOrder: "asc" } } } } },
  });

  if (!instance) {
    throw new Error("APPROVAL_INSTANCE_NOT_FOUND");
  }

  if (instance.status !== "IN_PROGRESS") {
    throw new Error("APPROVAL_ALREADY_FINALIZED");
  }

  const currentStep = await prisma.approvalStep.findFirst({
    where: {
      approvalInstanceId: instance.id,
      sequenceOrder: instance.currentStepOrder,
    },
  });

  if (!currentStep) {
    throw new Error("APPROVAL_STEP_NOT_FOUND");
  }

  if (currentStep.assignedApproverId !== actingUserId) {
    throw new Error("NOT_ASSIGNED_APPROVER");
  }

  if (currentStep.status !== "PENDING") {
    throw new Error("STEP_ALREADY_DECIDED");
  }

  // record this step's decision
  await prisma.approvalStep.update({
    where: { id: currentStep.id },
    data: {
      status: decision,
      comment,
      decidedAt: new Date(),
    },
  });

  if (decision === "REJECTED") {
    const rejected = await prisma.approvalInstance.update({
      where: { id: instance.id },
      data: { status: "REJECTED" },
    });

    if (instance.purchaseOrderId) {
      const { syncPOStatusWithApproval } = await import("../purchase-orders/po.service");
      await syncPOStatusWithApproval(instance.purchaseOrderId, "REJECTED");
    }

    if (instance.invoiceId) {
      const { syncInvoiceStatusWithApproval } = await import("../invoices/invoice.service");
      await syncInvoiceStatusWithApproval(instance.invoiceId, "REJECTED");
    }

    return rejected;
  }

  // decision === "APPROVED" — check if there's a next step in the template
  const nextStepDef = instance.template.steps.find(
    (s) => s.sequenceOrder === instance.currentStepOrder + 1
  );

  if (!nextStepDef) {
    // no more steps — the whole chain is approved
    const approved = await prisma.approvalInstance.update({
      where: { id: instance.id },
      data: { status: "APPROVED" },
    });

    if (instance.purchaseOrderId) {
      const { syncPOStatusWithApproval } = await import("../purchase-orders/po.service");
      await syncPOStatusWithApproval(instance.purchaseOrderId, "APPROVED");
    }

    if (instance.invoiceId) {
      const { syncInvoiceStatusWithApproval } = await import("../invoices/invoice.service");
      await syncInvoiceStatusWithApproval(instance.invoiceId, "APPROVED");
    }

    return approved;
  }

  // create the next step and advance the instance
  const nextApproverId = await resolveApproverForStep(organizationId, nextStepDef);

  await prisma.approvalStep.create({
    data: {
      approvalInstanceId: instance.id,
      sequenceOrder: nextStepDef.sequenceOrder,
      assignedApproverId: nextApproverId,
      status: "PENDING",
    },
  });

  return prisma.approvalInstance.update({
    where: { id: instance.id },
    data: { currentStepOrder: nextStepDef.sequenceOrder },
  });
}

export async function getApprovalInstance(organizationId: string, approvalInstanceId: string) {
  const instance = await prisma.approvalInstance.findFirst({
    where: { id: approvalInstanceId, organizationId },
    include: {
      steps: {
        orderBy: { sequenceOrder: "asc" },
        include: { assignedApprover: { select: { id: true, email: true } } },
      },
    },
  });

  if (!instance) {
    throw new Error("APPROVAL_INSTANCE_NOT_FOUND");
  }

  return instance;
}