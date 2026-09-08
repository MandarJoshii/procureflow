import { useEffect, useState } from "react";
import { apiClient } from "../../../lib/api-client";

interface Summary {
  totalSpend: number;
  pendingApprovalValue: number;
  counts: {
    rfqs: number;
    purchaseOrders: number;
    invoices: number;
    completedPayments: number;
  };
  poStatusCounts: Record<string, number>;
  rfqStatusCounts: Record<string, number>;
}

interface VendorSpend {
  vendorId: string;
  vendorName: string;
  total: number;
}

interface NetworkNode {
  id: string;
  label: string;
  type: "organization" | "vendor";
  value: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export function useAnalytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [spendByVendor, setSpendByVendor] = useState<VendorSpend[]>([]);
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [summaryRes, spendRes, networkRes] = await Promise.all([
          apiClient.get("/api/analytics/summary"),
          apiClient.get("/api/analytics/spend-by-vendor"),
          apiClient.get("/api/analytics/network"),
        ]);
        setSummary(summaryRes.data);
        setSpendByVendor(spendRes.data);
        setNetwork(networkRes.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { summary, spendByVendor, network, loading };
}