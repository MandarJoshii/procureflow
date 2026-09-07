import { useEffect, useState } from "react";
import { apiClient } from "../../../lib/api-client";

interface Vendor {
  id: string;
  status: string;
  vendor: {
    id: string;
    name: string;
    contactEmail: string;
  };
}

export default function VendorListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadVendors() {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/vendors");
      setVendors(response.data);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiClient.post("/api/vendors", { name, contactEmail: email });
      setName("");
      setEmail("");
      setShowForm(false);
      loadVendors();
    } catch (err: any) {
      if (err.response?.data?.error === "VENDOR_ALREADY_LINKED") {
        setError("This vendor is already in your list.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Vendors</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Vendor"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddVendor}
            className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vendor name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="Acme Supplies"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="contact@vendor.com"
              />
            </div>
            {error && <p className="text-sm text-status-rejected">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Vendor"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">
              No vendors yet. Add your first vendor to start creating RFQs.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {vendors.map((v) => (
              <div key={v.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{v.vendor.name}</p>
                  <p className="text-sm text-slate-500">{v.vendor.contactEmail}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    v.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {v.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}