import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";

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
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-500 text-sm">Loading...</div>;
  }

  if (!invoice) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-500 text-sm">Invoice not found.</div>;
  }

  const statusStyles: Record<string, string> = {
    SUBMITTED: "bg-slate-100 text-slate-600",
    APPROVED: "bg-blue-50 text-blue-700",
    PAYMENT_RELEASED: "bg-amber-50 text-amber-700",
    PAID: "bg-emerald-50 text-emerald-700",
  };

  const stepStatusStyles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
    SKIPPED: "bg-slate-100 text-slate-500",
  };

  const paymentStatusStyles: Record<string, string> = {
    INITIATED: "bg-amber-50 text-amber-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-red-50 text-red-700",
  };

  const instance = invoice.approvalInstances[0];
  const currentStep = instance?.steps.find((s) => s.sequenceOrder === instance.currentStepOrder);
  const canDecide =
    instance?.status === "IN_PROGRESS" &&
    currentStep?.status === "PENDING" &&
    currentStep?.assignedApprover.id === currentUserId;

  const canReleasePayment = invoice.status === "APPROVED" && !invoice.payment;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Invoice</h1>
            <p className="text-sm text-slate-500">{invoice.vendor.name}</p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[invoice.status]}`}
          >
            {invoice.status.replace("_", " ")}
          </span>
        </div>

        <p className="text-2xl font-semibold text-slate-900 mt-4 mb-8">
          ₹{Number(invoice.amount).toLocaleString("en-IN")}
        </p>

        {/* Approval chain */}
        {instance && (
          <>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Finance Approval</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-6">
              {instance.steps.map((step) => (
                <div key={step.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Step {step.sequenceOrder} — {step.assignedApprover.email}
                      </p>
                      {step.decidedAt && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Decided {new Date(step.decidedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${stepStatusStyles[step.status]}`}
                    >
                      {step.status}
                    </span>
                  </div>
                  {step.comment && (
                    <p className="text-sm text-slate-500 mt-2 italic">"{step.comment}"</p>
                  )}
                </div>
              ))}
            </div>

            {canDecide && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Your approval is required
                </h3>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Optional comment..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                {error && <p className="text-sm text-status-rejected mb-3">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecide("APPROVED")}
                    disabled={deciding}
                    className="rounded-lg bg-status-approved text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {deciding ? "Submitting..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleDecide("REJECTED")}
                    disabled={deciding}
                    className="rounded-lg bg-status-rejected text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {deciding ? "Submitting..." : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Payment release */}
        {canReleasePayment && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Ready for payment</h3>
            <p className="text-sm text-slate-500 mb-4">
              This invoice has been approved. Release payment to the vendor via Razorpay.
            </p>
            <button
              onClick={handleReleasePayment}
              disabled={releasingPayment}
              className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors disabled:opacity-50"
            >
              {releasingPayment ? "Releasing..." : "Release Payment"}
            </button>
          </div>
        )}

        {/* Payment status */}
        {invoice.payment && (
          <>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Payment</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-700">Status</p>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${paymentStatusStyles[invoice.payment.status]}`}
                >
                  {invoice.payment.status}
                </span>
              </div>
              {invoice.payment.webhookConfirmedAt && (
                <p className="text-xs text-slate-400">
                  Confirmed {new Date(invoice.payment.webhookConfirmedAt).toLocaleString()}
                </p>
              )}
              {invoice.payment.razorpayTransferId && (
                <p className="text-xs text-slate-400 mt-1">
                  Transfer ref: {invoice.payment.razorpayTransferId}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}