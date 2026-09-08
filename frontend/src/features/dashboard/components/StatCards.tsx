interface Props {
  totalSpend: number;
  pendingApprovalValue: number;
  counts: {
    rfqs: number;
    purchaseOrders: number;
    invoices: number;
    completedPayments: number;
  };
}

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function StatCards({ totalSpend, pendingApprovalValue, counts }: Props) {
  const secondary = [
    { label: "Pending approval", value: formatINR(pendingApprovalValue) },
    { label: "Active RFQs", value: counts.rfqs.toString() },
    { label: "Purchase orders", value: counts.purchaseOrders.toString() },
    { label: "Completed payments", value: counts.completedPayments.toString() },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 mb-10">
      {/* hero stat */}
      <div
        className="rounded-2xl px-7 py-6 lg:w-[300px] shrink-0"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">
          Total confirmed spend
        </p>
        <p className="font-mono text-4xl text-white leading-none">{formatINR(totalSpend)}</p>
      </div>

      {/* secondary stats */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {secondary.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-5 py-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-[11px] uppercase tracking-wider text-white/35 mb-1.5">
              {stat.label}
            </p>
            <p className="font-mono text-xl text-white/90">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}