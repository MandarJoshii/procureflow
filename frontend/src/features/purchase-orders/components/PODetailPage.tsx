import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";
import AppShell from "../../../app/components/AppShell";
import { Card, Badge, TextArea } from "../../../app/components/ui";

interface Vendor {
  id: string;
  name: string;
  contactEmail: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

interface ApprovalStep {
  id: string;
  sequenceOrder: number;
  status: string;
  comment: string | null;
  decidedAt: string | null;
  assignedApprover: { id: string; email: string };
}

interface ApprovalInstance {
  id: string;
  status: string;
  currentStepOrder: number;
  steps: ApprovalStep[];
}

interface PODetail {
  id: string;
  status: string;
  totalAmount: string;
  vendor: Vendor;
  lineItems: LineItem[];
  approvalInstances: ApprovalInstance[];
}

function getCurrentUserId(): string | null {
  const token = localStorage.getItem("procureflow_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId;
  } catch {
    return null;
  }
}

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const [po, setPo] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUserId = getCurrentUserId();

  async function loadPO() {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/purchase-orders/${id}`);
      setPo(response.data);
    } catch (err) {
      console.error("Failed to load PO:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPO();
  }, [id]);

  async function handleDecide(decision: "APPROVED" | "REJECTED") {
    const instance = po?.approvalInstances[0];
    if (!instance) return;

    setDeciding(true);
    setError(null);
    try {
      await apiClient.post(`/api/approvals/${instance.id}/decide`, {
        decision,
        comment: comment || undefined,
      });
      setComment("");
      loadPO();
    } catch (err) {
      setError("Something went wrong recording your decision.");
    } finally {
      setDeciding(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-white/35 text-sm">Loading...</p>
      </AppShell>
    );
  }

  if (!po) {
    return (
      <AppShell>
        <p className="text-white/35 text-sm">Purchase Order not found.</p>
      </AppShell>
    );
  }

  const instance = po.approvalInstances[0];
  const currentStep = instance?.steps.find((s) => s.sequenceOrder === instance.currentStepOrder);
  const canDecide =
    instance?.status === "IN_PROGRESS" &&
    currentStep?.status === "PENDING" &&
    currentStep?.assignedApprover.id === currentUserId;

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-medium text-white/90">Purchase Order</h1>
          <p className="text-sm text-white/40">{po.vendor.name}</p>
        </div>
        <Badge status={po.status} />
      </div>

      <p className="font-mono text-3xl text-white/90 mt-4 mb-8">
        ₹{Number(po.totalAmount).toLocaleString("en-IN")}
      </p>

      <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">Line Items</h2>
      <Card className="p-5 mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/30 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <th className="pb-2 font-normal">Item</th>
              <th className="pb-2 font-normal">Qty</th>
              <th className="pb-2 font-normal">Unit Price</th>
              <th className="pb-2 font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.lineItems.map((li) => (
              <tr key={li.id} className="border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <td className="py-2 text-white/70">{li.description}</td>
                <td className="py-2 text-white/70">{li.quantity}</td>
                <td className="py-2 font-mono text-white/70">₹{Number(li.unitPrice).toLocaleString("en-IN")}</td>
                <td className="py-2 font-mono text-white/70 text-right">₹{Number(li.total).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {instance && (
        <>
          <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">Approval Chain</h2>
          <Card className="mb-6">
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {instance.steps.map((step) => (
                <div key={step.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/90">
                        Step {step.sequenceOrder} — {step.assignedApprover.email}
                      </p>
                      {step.decidedAt && (
                        <p className="text-xs text-white/30 mt-0.5">
                          Decided {new Date(step.decidedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Badge status={step.status} />
                  </div>
                  {step.comment && <p className="text-sm text-white/40 mt-2 italic">"{step.comment}"</p>}
                </div>
              ))}
            </div>
          </Card>

          {canDecide && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-white/70 mb-3">Your approval is required</h3>
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Optional comment..."
                className="mb-3"
              />
              {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecide("APPROVED")}
                  disabled={deciding}
                  className="rounded-lg bg-emerald-500 text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {deciding ? "Submitting..." : "Approve"}
                </button>
                <button
                  onClick={() => handleDecide("REJECTED")}
                  disabled={deciding}
                  className="rounded-lg bg-rose-500 text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {deciding ? "Submitting..." : "Reject"}
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}