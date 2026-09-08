import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";

interface Vendor {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  status: string;
  totalAmount: string;
}

interface Payment {
  id: string;
  status: string;
}

interface Invoice {
  id: string;
  amount: string;
  status: string;
  submittedAt: string;
  vendor: Vendor;
  purchaseOrder: PurchaseOrder;
  payment: Payment | null;
}

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [invoicesRes, posRes] = await Promise.all([
        apiClient.get("/api/invoices"),
        apiClient.get("/api/purchase-orders"),
      ]);
      setInvoices(invoicesRes.data);
      setApprovedPOs(posRes.data.filter((po: PurchaseOrder) => po.status === "APPROVED"));
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiClient.post("/api/invoices", {
        purchaseOrderId: selectedPOId,
        amount: Number(amount),
      });
      setSelectedPOId("");
      setAmount("");
      setShowForm(false);
      loadData();
    } catch (err: any) {
      if (err.response?.data?.error === "INVOICE_ALREADY_EXISTS") {
        setError("An invoice already exists for this Purchase Order.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const statusStyles: Record<string, string> = {
    SUBMITTED: "bg-slate-100 text-slate-600",
    APPROVED: "bg-blue-50 text-blue-700",
    PAYMENT_RELEASED: "bg-amber-50 text-amber-700",
    PAID: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ Submit Invoice"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Purchase Order
              </label>
              {approvedPOs.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No approved Purchase Orders available to invoice against.
                </p>
              ) : (
                <select
                  value={selectedPOId}
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Select a Purchase Order</option>
                  {approvedPOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      PO {po.id.slice(-8)} — ₹{Number(po.totalAmount).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Invoice Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={0}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="1100000"
              />
            </div>

            {error && <p className="text-sm text-status-rejected">{error}</p>}

            <button
              type="submit"
              disabled={submitting || approvedPOs.length === 0}
              className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Invoice"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">
              No invoices yet. Submit one against an approved Purchase Order.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{invoice.vendor.name}</p>
                  <p className="text-sm text-slate-500">
                    ₹{Number(invoice.amount).toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[invoice.status]}`}
                >
                  {invoice.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}