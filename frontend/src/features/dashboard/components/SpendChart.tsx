import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface VendorSpend {
  vendorId: string;
  vendorName: string;
  total: number;
}

export default function SpendChart({ data }: { data: VendorSpend[] }) {
  if (data.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center h-[340px] flex items-center justify-center"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-white/35 text-sm">
          No spend data yet — approve a Purchase Order to see it here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 h-[340px]"
      style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="vendorName"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [`₹${Number(value ?? 0).toLocaleString("en-IN")}`, "Spend"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "#12151c",
              color: "#f4f3ef",
              fontSize: 13,
            }}
            labelStyle={{ color: "#f4f3ef" }}
          />
          <Bar dataKey="total" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}