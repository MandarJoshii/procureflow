import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";
import AppShell from "../../../app/components/AppShell";
import { Card, Badge, PrimaryButton, TextArea } from "../../../app/components/ui";

interface Vendor {
  id: string;
  name: string;
  contactEmail: string;
}

interface PurchaseOrder {
  id: string;
  totalAmount: string;
}

interface Payment {
  id: string;
  status: string;
  webhookConfirmedAt: string | null;
  razorpayTransferId: string | null;
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

interface InvoiceDetail {
  id: string;
  amount: string;
  status: string;
  vendor: Vendor;
  purchaseOrder: PurchaseOrder;
  payment: Payment | null;
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [releasingPayment, setReleasingPayment] = useState(false);

  const currentUserId = getCurrentUserId();

  async function loadInvoice() {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/invoices/${id}`);
      setInvoice(response.data);
    } catch (err) {
      console.error("Failed to load invoice:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function handleDecide(decision: "APPROVED" | "REJECTED") {
    const instance = invoice?.approvalInstances[0];
    if (!instance) return;

    setDeciding(true);
    setError(null);
    try {
      await apiClient.post(`/api/approvals/${instance.id}/decide`, {
        decision,
        comment: comment || undefined,
      });
      setComment("");
      loadInvoice();
    } catch (err) {
      setError("Something went wrong recording your decision.");
    } finally {
      setDeciding(false);
    }
  }

  async function handleReleasePayment() {
    if (!id) return;
    setReleasingPayment(true);
    try {
      await apiClient.post("/api/payments", { invoiceId: id });
      loadInvoice();
    } catch (err) {
      console.error("Failed to release payment:", err);
    } finally {
      setReleasingPayment(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-white/35 text-sm">Loading...</p>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell>
        <p className="text-white/35 text-sm">Invoice not found.</p>
      </AppShell>
    );
  }

  const instance = invoice.approvalInstances[0];
  const currentStep = instance?.steps.find((s) => s.sequenceOrder === instance.currentStepOrder);
  const canDecide =
    instance?.status === "IN_PROGRESS" &&
    currentStep?.status === "PENDING" &&
    currentStep?.assignedApprover.id === currentUserId;

  const canReleasePayment = invoice.status === "APPROVED" && !invoice.payment;

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-medium text-white/90">Invoice</h1>
          <p className="text-sm text-white/40">{invoice.vendor.name}</p>
        </div>
        <Badge status={invoice.status} />
      </div>

      <p className="font-mono text-3xl text-white/90 mt-4 mb-8">
        ₹{Number(invoice.amount).toLocaleString("en-IN")}
      </p>

      {instance && (
        <>
          <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">Finance Approval</h2>
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
            <Card className="p-5 mb-8">
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

      {canReleasePayment && (
        <Card className="p-5 mb-8">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Ready for payment</h3>
          <p className="text-sm text-white/40 mb-4">
            This invoice has been approved. Release payment to the vendor via Razorpay.
          </p>
          <PrimaryButton onClick={handleReleasePayment} disabled={releasingPayment}>
            {releasingPayment ? "Releasing..." : "Release Payment"}
          </PrimaryButton>
        </Card>
      )}

      {invoice.payment && (
        <>
          <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">Payment</h2>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/70">Status</p>
              <Badge status={invoice.payment.status} />
            </div>
            {invoice.payment.webhookConfirmedAt && (
              <p className="text-xs text-white/30">
                Confirmed {new Date(invoice.payment.webhookConfirmedAt).toLocaleString()}
              </p>
            )}
            {invoice.payment.razorpayTransferId && (
              <p className="font-mono text-xs text-white/30 mt-1">
                Transfer ref: {invoice.payment.razorpayTransferId}
              </p>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}