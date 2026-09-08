import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";
import AppShell from "../../../app/components/AppShell";
import { Card, Badge, PrimaryButton, GhostButton, TextInput, TextArea, Label } from "../../../app/components/ui";

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
  const navigate = useNavigate();
  const [generatingPO, setGeneratingPO] = useState(false);
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
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
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

  async function handleGeneratePO() {
    const selectedQuote = rfq?.quotes.find((q) => q.status === "SELECTED");
    if (!selectedQuote || !id) return;

    setGeneratingPO(true);
    try {
      const response = await apiClient.post("/api/purchase-orders", {
        rfqId: id,
        quoteId: selectedQuote.id,
      });
      navigate(`/purchase-orders/${response.data.id}`);
    } catch (err) {
      console.error("Failed to generate PO:", err);
      setGeneratingPO(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-white/35 text-sm">Loading...</p>
      </AppShell>
    );
  }

  if (!rfq) {
    return (
      <AppShell>
        <p className="text-white/35 text-sm">RFQ not found.</p>
      </AppShell>
    );
  }

  const quotedVendorIds = new Set(rfq.quotes.map((q) => q.vendor.id));
  const isAwarded = rfq.status === "AWARDED";

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-xl font-medium text-white/90">{rfq.title}</h1>
        <Badge status={rfq.status} />
      </div>
      {rfq.description && <p className="text-white/40 text-sm mb-4">{rfq.description}</p>}

      {isAwarded && (
        <div className="mb-8">
          <PrimaryButton onClick={handleGeneratePO} disabled={generatingPO}>
            {generatingPO ? "Generating..." : "Generate Purchase Order"}
          </PrimaryButton>
        </div>
      )}

      <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">Invited Vendors</h2>
      <Card className="mb-8">
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {rfq.vendorInvites.map((invite) => (
            <div key={invite.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-white/90">{invite.vendor.name}</p>
                <p className="text-sm text-white/40">{invite.vendor.contactEmail}</p>
              </div>
              {quotedVendorIds.has(invite.vendor.id) ? (
                <span className="text-xs text-white/35">Quote submitted</span>
              ) : !isAwarded ? (
                <button
                  onClick={() => setQuoteFormVendorId(invite.vendor.id)}
                  className="text-sm text-indigo-400 font-medium hover:underline"
                >
                  Submit quote
                </button>
              ) : (
                <span className="text-xs text-white/25">No response</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {quoteFormVendorId && (
        <Card className="p-5 mb-8">
          <form onSubmit={handleSubmitQuote} className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70">
              Submit quote for{" "}
              {rfq.vendorInvites.find((v) => v.vendor.id === quoteFormVendorId)?.vendor.name}
            </h3>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <TextInput
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    required
                    className="flex-1"
                  />
                  <TextInput
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                    required
                    min={1}
                    className="w-20"
                  />
                  <TextInput
                    type="number"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                    required
                    min={0}
                    className="w-28"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-white/30 hover:text-rose-400 text-sm px-2"
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
              className="text-sm text-indigo-400 font-medium hover:underline"
            >
              + Add line item
            </button>

            <div>
              <Label>Notes</Label>
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Quote"}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setQuoteFormVendorId(null)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {rfq.quotes.length > 0 && (
        <>
          <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">Quotes</h2>
          <div className="space-y-4">
            {rfq.quotes.map((quote) => (
              <Card key={quote.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-white/90">{quote.vendor.name}</p>
                    <p className="font-mono text-lg text-white/90 mt-1">
                      ₹{Number(quote.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={quote.status} />
                    {!isAwarded && quote.status === "SUBMITTED" && (
                      <button
                        onClick={() => handleAward(quote.id)}
                        disabled={awardingId === quote.id}
                        className="rounded-lg bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {awardingId === quote.id ? "Awarding..." : "Award"}
                      </button>
                    )}
                  </div>
                </div>
                {quote.notes && <p className="text-sm text-white/40 mb-3">{quote.notes}</p>}
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
                    {quote.lineItems.map((li) => (
                      <tr key={li.id} className="border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <td className="py-2 text-white/70">{li.description}</td>
                        <td className="py-2 text-white/70">{li.quantity}</td>
                        <td className="py-2 font-mono text-white/70">
                          ₹{Number(li.unitPrice).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 font-mono text-white/70 text-right">
                          ₹{Number(li.total).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}