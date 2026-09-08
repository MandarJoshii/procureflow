import { useEffect, useState } from "react";
import { apiClient } from "../../../lib/api-client";
import AppShell from "../../../app/components/AppShell";
import { Card, Badge, PrimaryButton, TextInput, Label, EmptyState } from "../../../app/components/ui";

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
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-white/90">Vendors</h1>
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Vendor"}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleAddVendor} className="space-y-3">
            <div>
              <Label>Vendor name</Label>
              <TextInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Acme Supplies"
              />
            </div>
            <div>
              <Label>Contact email</Label>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="contact@vendor.com"
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Vendor"}
            </PrimaryButton>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-white/35 text-sm">Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <EmptyState>No vendors yet. Add your first vendor to start creating RFQs.</EmptyState>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {vendors.map((v) => (
              <div key={v.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white/90">{v.vendor.name}</p>
                  <p className="text-sm text-white/40">{v.vendor.contactEmail}</p>
                </div>
                <Badge status={v.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}