import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";

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

interface Quote {
  id: string;
  amount: string;
  notes: string | null;
  status: string;
  vendor: Vendor;
  lineItems: LineItem[];
}

interface VendorInvite {
  id: string;
  vendor: Vendor;
  respondedAt: string | null;
}

interface RFQDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  vendorInvites: VendorInvite[];
  quotes: Quote[];
}

interface LineItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function RFQDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RFQDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteFormVendorId, setQuoteFormVendorId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awardingId, setAwardingId] = useState<string | null>(null);

  async function loadRFQ() {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/rfqs/${id}`);
      setRfq(response.data);
    } catch (err) {
      console.error("Failed to load RFQ:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRFQ();
  }, [id]);

  function updateLineItem(index: number, field: keyof LineItemDraft, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!quoteFormVendorId) return;

    setSubmitting(true);
    try {
      await apiClient.post(`/api/rfqs/${id}/quotes`, {
        vendorId: quoteFormVendorId,
        notes,
        lineItems: lineItems.map((li) => ({
          description: li.description,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
        })),
      });
      setQuoteFormVendorId(null);
      setLineItems([{ description: "", quantity: "1", unitPrice: "" }]);
      setNotes("");
      loadRFQ();
    } catch (err) {
      setError("Something went wrong submitting the quote.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAward(quoteId: string) {
    setAwardingId(quoteId);
    try {
      await apiClient.post(`/api/rfqs/${id}/quotes/${quoteId}/select`);
      loadRFQ();
    } catch (err) {
      console.error("Failed to award quote:", err);
    } finally {
      setAwardingId(null);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-500 text-sm">Loading...</div>;
  }

  if (!rfq) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-500 text-sm">RFQ not found.</div>;
  }

  const quotedVendorIds = new Set(rfq.quotes.map((q) => q.vendor.id));
  const isAwarded = rfq.status === "AWARDED";

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    SENT: "bg-blue-50 text-blue-700",
    CLOSED: "bg-slate-100 text-slate-600",
    AWARDED: "bg-emerald-50 text-emerald-700",
  };

  const quoteStatusStyles: Record<string, string> = {
    SUBMITTED: "bg-slate-100 text-slate-600",
    SELECTED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-semibold text-slate-900">{rfq.title}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[rfq.status]}`}>
            {rfq.status}
          </span>
        </div>
        {rfq.description && (
          <p className="text-slate-500 text-sm mb-8">{rfq.description}</p>
        )}

        {/* Invited vendors */}
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Invited Vendors</h2>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-8">
          {rfq.vendorInvites.map((invite) => (
            <div key={invite.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{invite.vendor.name}</p>
                <p className="text-sm text-slate-500">{invite.vendor.contactEmail}</p>
              </div>
              {quotedVendorIds.has(invite.vendor.id) ? (
                <span className="text-xs text-slate-500">Quote submitted</span>
              ) : !isAwarded ? (
                <button
                  onClick={() => setQuoteFormVendorId(invite.vendor.id)}
                  className="text-sm text-accent-600 font-medium hover:underline"
                >
                  Submit quote
                </button>
              ) : (
                <span className="text-xs text-slate-400">No response</span>
              )}
            </div>
          ))}
        </div>

        {/* Quote submission form */}
        {quoteFormVendorId && (
          <form
            onSubmit={handleSubmitQuote}
            className="bg-white rounded-xl border border-slate-200 p-5 mb-8 space-y-4"
          >
            <h3 className="text-sm font-semibold text-slate-700">
              Submit quote for{" "}
              {rfq.vendorInvites.find((v) => v.vendor.id === quoteFormVendorId)?.vendor.name}
            </h3>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    required
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                    required
                    min={1}
                    className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                  <input
                    type="number"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                    required
                    min={0}
                    className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-slate-400 hover:text-status-rejected text-sm px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="text-sm text-accent-600 font-medium hover:underline"
            >
              + Add line item
            </button>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            {error && <p className="text-sm text-status-rejected">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Quote"}
              </button>
              <button
                type="button"
                onClick={() => setQuoteFormVendorId(null)}
                className="text-sm text-slate-500 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Quote comparison */}
        {rfq.quotes.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Quotes</h2>
            <div className="space-y-4">
              {rfq.quotes.map((quote) => (
                <div key={quote.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-slate-900">{quote.vendor.name}</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">
                        ₹{Number(quote.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${quoteStatusStyles[quote.status]}`}
                      >
                        {quote.status}
                      </span>
                      {!isAwarded && quote.status === "SUBMITTED" && (
                        <button
                          onClick={() => handleAward(quote.id)}
                          disabled={awardingId === quote.id}
                          className="rounded-lg bg-accent-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-accent-700 transition-colors disabled:opacity-50"
                        >
                          {awardingId === quote.id ? "Awarding..." : "Award"}
                        </button>
                      )}
                    </div>
                  </div>
                  {quote.notes && (
                    <p className="text-sm text-slate-500 mb-3">{quote.notes}</p>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100">
                        <th className="pb-2 font-normal">Item</th>
                        <th className="pb-2 font-normal">Qty</th>
                        <th className="pb-2 font-normal">Unit Price</th>
                        <th className="pb-2 font-normal text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.lineItems.map((li) => (
                        <tr key={li.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 text-slate-700">{li.description}</td>
                          <td className="py-2 text-slate-700">{li.quantity}</td>
                          <td className="py-2 text-slate-700">
                            ₹{Number(li.unitPrice).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 text-slate-700 text-right">
                            ₹{Number(li.total).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}