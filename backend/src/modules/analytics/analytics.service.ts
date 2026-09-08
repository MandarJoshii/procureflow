import { prisma } from "../../config/db";

/**
 * High-level spend and pipeline summary for the dashboard's chart cards.
 */
export async function getSummary(organizationId: string) {
  const [pos, invoices, payments, rfqs] = await Promise.all([
    prisma.purchaseOrder.findMany({ where: { organizationId } }),
    prisma.invoice.findMany({ where: { organizationId } }),
    prisma.payment.findMany({ where: { organizationId, status: "COMPLETED" } }),
    prisma.rFQ.findMany({ where: { organizationId } }),
  ]);

  const totalSpend = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingApprovalValue = pos
    .filter((po) => po.status === "PENDING_APPROVAL")
    .reduce((sum, po) => sum + Number(po.totalAmount), 0);

  const poStatusCounts = pos.reduce<Record<string, number>>((acc, po) => {
    acc[po.status] = (acc[po.status] ?? 0) + 1;
    return acc;
  }, {});

  const rfqStatusCounts = rfqs.reduce<Record<string, number>>((acc, rfq) => {
    acc[rfq.status] = (acc[rfq.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalSpend,
    pendingApprovalValue,
    counts: {
      rfqs: rfqs.length,
      purchaseOrders: pos.length,
      invoices: invoices.length,
      completedPayments: payments.length,
    },
    poStatusCounts,
    rfqStatusCounts,
  };
}

/**
 * Spend grouped by vendor — powers a bar chart and the size/weight of
 * each vendor node in the 3D network graph.
 */
export async function getSpendByVendor(organizationId: string) {
  const pos = await prisma.purchaseOrder.findMany({
    where: { organizationId, status: { in: ["APPROVED", "FULFILLED"] } },
    include: { vendor: true },
  });

  const byVendor = new Map<string, { vendorId: string; vendorName: string; total: number }>();

  for (const po of pos) {
    const existing = byVendor.get(po.vendorId);
    const amount = Number(po.totalAmount);
    if (existing) {
      existing.total += amount;
    } else {
      byVendor.set(po.vendorId, {
        vendorId: po.vendorId,
        vendorName: po.vendor.name,
        total: amount,
      });
    }
  }

  return Array.from(byVendor.values()).sort((a, b) => b.total - a.total);
}

/**
 * Returns the node/edge data shape for the 3D supply-chain network graph.
 * One central "organization" node, one node per vendor with transactions,
 * and edges weighted by total transaction volume with that vendor.
 */
export async function getNetworkData(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  const spendByVendor = await getSpendByVendor(organizationId);

  const nodes = [
    { id: "org", label: org?.name ?? "Organization", type: "organization", value: 0 },
    ...spendByVendor.map((v) => ({
      id: v.vendorId,
      label: v.vendorName,
      type: "vendor" as const,
      value: v.total,
    })),
  ];

  const edges = spendByVendor.map((v) => ({
    source: "org",
    target: v.vendorId,
    weight: v.total,
  }));

  return { nodes, edges };
}