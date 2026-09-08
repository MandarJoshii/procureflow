import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";
import AppShell from "../../../app/components/AppShell";
import { Card, Badge, PrimaryButton, TextInput, TextArea, Label, EmptyState } from "../../../app/components/ui";

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
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
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
      await apiClient.post("/api/rfqs", { title, description, vendorIds: selectedVendorIds });
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

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-white/90">RFQs</h1>
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New RFQ"}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreateRFQ} className="space-y-4">
            <div>
              <Label>Title</Label>
              <TextInput
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Office Laptops Q1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What do you need?"
              />
            </div>

            <div>
              <Label>Invite vendors</Label>
              {vendors.length === 0 ? (
                <p className="text-sm text-white/40">
                  No vendors yet.{" "}
                  <Link to="/vendors" className="text-indigo-400 hover:underline">
                    Add one first
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-2">
                  {vendors.map((v) => (
                    <label key={v.vendor.id} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(v.vendor.id)}
                        onChange={() => toggleVendor(v.vendor.id)}
                        className="rounded border-white/20 text-indigo-500 focus:ring-indigo-500"
                      />
                      {v.vendor.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create RFQ"}
            </PrimaryButton>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-white/35 text-sm">Loading RFQs...</p>
      ) : rfqs.length === 0 ? (
        <EmptyState>No RFQs yet. Create one to start requesting quotes from vendors.</EmptyState>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {rfqs.map((rfq) => (
              <Link
                key={rfq.id}
                to={`/rfqs/${rfq.id}`}
                className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <p className="font-medium text-white/90">{rfq.title}</p>
                  <p className="text-sm text-white/40">
                    {rfq.vendorInvites.length} vendor(s) invited · {rfq.quotes.length} quote(s)
                  </p>
                </div>
                <Badge status={rfq.status} />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}