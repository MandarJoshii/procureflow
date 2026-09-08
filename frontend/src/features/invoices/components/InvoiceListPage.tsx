import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";
import AppShell from "../../../app/components/AppShell";
import { Card, Badge, PrimaryButton, Label, EmptyState } from "../../../app/components/ui";

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

  const selectClass =
    "w-full rounded-lg px-3.5 py-2.5 text-sm outline-none text-white/90 transition-colors focus:border-indigo-400";
  const selectStyle = { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-white/90">Invoices</h1>
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Submit Invoice"}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreateInvoice} className="space-y-3">
            <div>
              <Label>Purchase Order</Label>
              {approvedPOs.length === 0 ? (
                <p className="text-sm text-white/40">
                  No approved Purchase Orders available to invoice against.
                </p>
              ) : (
                <select
                  value={selectedPOId}
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  required
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="" className="bg-slate-900">
                    Select a Purchase Order
                  </option>
                  {approvedPOs.map((po) => (
                    <option key={po.id} value={po.id} className="bg-slate-900">
                      PO {po.id.slice(-8)} — ₹{Number(po.totalAmount).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <Label>Invoice Amount</Label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={0}
                className={selectClass}
                style={selectStyle}
                placeholder="1100000"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <PrimaryButton type="submit" disabled={submitting || approvedPOs.length === 0}>
              {submitting ? "Submitting..." : "Submit Invoice"}
            </PrimaryButton>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-white/35 text-sm">Loading invoices...</p>
      ) : invoices.length === 0 ? (
        <EmptyState>No invoices yet. Submit one against an approved Purchase Order.</EmptyState>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <p className="font-medium text-white/90">{invoice.vendor.name}</p>
                  <p className="font-mono text-sm text-white/40">
                    ₹{Number(invoice.amount).toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge status={invoice.status} />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}