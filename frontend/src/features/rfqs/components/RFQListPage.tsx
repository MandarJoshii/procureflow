import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";

interface Vendor {
  id: string;
  name: string;
  contactEmail: string;
}

interface OrgVendorLink {
  id: string;
  vendor: Vendor;
}

interface RFQ {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  quotes: { id: string }[];
  vendorInvites: { id: string; vendor: Vendor }[];
}

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [vendors, setVendors] = useState<OrgVendorLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [rfqsRes, vendorsRes] = await Promise.all([
        apiClient.get("/api/rfqs"),
        apiClient.get("/api/vendors"),
      ]);
      setRfqs(rfqsRes.data);
      setVendors(vendorsRes.data);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleVendor(vendorId: string) {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  }

  async function handleCreateRFQ(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedVendorIds.length === 0) {
      setError("Select at least one vendor to invite.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/api/rfqs", {
        title,
        description,
        vendorIds: selectedVendorIds,
      });
      setTitle("");
      setDescription("");
      setSelectedVendorIds([]);
      setShowForm(false);
      loadData();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    SENT: "bg-blue-50 text-blue-700",
    CLOSED: "bg-slate-100 text-slate-600",
    AWARDED: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">RFQs</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ New RFQ"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreateRFQ}
            className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="Office Laptops Q1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="What do you need?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invite vendors
              </label>
              {vendors.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No vendors yet.{" "}
                  <Link to="/vendors" className="text-accent-600 hover:underline">
                    Add one first
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-2">
                  {vendors.map((v) => (
                    <label
                      key={v.vendor.id}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(v.vendor.id)}
                        onChange={() => toggleVendor(v.vendor.id)}
                        className="rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                      />
                      {v.vendor.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-status-rejected">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create RFQ"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading RFQs...</p>
        ) : rfqs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">
              No RFQs yet. Create one to start requesting quotes from vendors.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {rfqs.map((rfq) => (
              <Link
                key={rfq.id}
                to={`/rfqs/${rfq.id}`}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{rfq.title}</p>
                  <p className="text-sm text-slate-500">
                    {rfq.vendorInvites.length} vendor(s) invited · {rfq.quotes.length} quote(s)
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[rfq.status]}`}
                >
                  {rfq.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}