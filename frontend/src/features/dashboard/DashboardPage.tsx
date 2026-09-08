import { useNavigate, Link } from "react-router-dom";
import { useAnalytics } from "./hooks/useAnalytics";
import StatCards from "./components/StatCards";
import SpendChart from "./components/SpendChart";
import NetworkGraph from "./components/network/NetworkGraph";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { summary, spendByVendor, network, loading } = useAnalytics();

  function handleLogout() {
    localStorage.removeItem("procureflow_token");
    navigate("/login");
  }

  const navLinks = [
    { to: "/vendors", label: "Vendors" },
    { to: "/rfqs", label: "RFQs" },
    { to: "/invoices", label: "Invoices" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0b0d12" }}>
      {/* header */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <circle cx="4" cy="18" r="2" fill="#818cf8" />
                <circle cx="11" cy="4" r="2" fill="#818cf8" opacity="0.55" />
                <circle cx="18" cy="18" r="2" fill="#818cf8" />
                <path d="M4 16 C 7 10, 8 6, 11 6 C 14 6, 15 10, 18 16" stroke="#818cf8" strokeWidth="1.2" fill="none" opacity="0.6" />
              </svg>
              <span className="text-[13px] font-medium text-white/80">ProcureFlow</span>
            </div>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-white/50 hover:text-white/90 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-white/40 hover:text-white/80 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {loading ? (
          <div className="flex gap-6 mb-10">
            <div className="rounded-2xl h-[92px] w-[300px] animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.03)" }} />
            <div className="grid grid-cols-2 gap-4 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl h-[92px] animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.02)" }} />
              ))}
            </div>
          </div>
        ) : summary ? (
          <StatCards
            totalSpend={summary.totalSpend}
            pendingApprovalValue={summary.pendingApprovalValue}
            counts={summary.counts}
          />
        ) : null}

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">
              Supply-chain network
            </h2>
            {loading ? (
              <div className="rounded-xl h-[340px] animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.02)" }} />
            ) : network ? (
              <NetworkGraph data={network} />
            ) : null}
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">
              Vendor spend
            </h2>
            {loading ? (
              <div className="rounded-xl h-[340px] animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.02)" }} />
            ) : (
              <SpendChart data={spendByVendor} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}