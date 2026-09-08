import { useNavigate, Link } from "react-router-dom";
import type { ReactNode } from "react";

const navLinks = [
  { to: "/vendors", label: "Vendors" },
  { to: "/rfqs", label: "RFQs" },
  { to: "/invoices", label: "Invoices" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("procureflow_token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0b0d12" }}>
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <circle cx="4" cy="18" r="2" fill="#818cf8" />
                <circle cx="11" cy="4" r="2" fill="#818cf8" opacity="0.55" />
                <circle cx="18" cy="18" r="2" fill="#818cf8" />
                <path d="M4 16 C 7 10, 8 6, 11 6 C 14 6, 15 10, 18 16" stroke="#818cf8" strokeWidth="1.2" fill="none" opacity="0.6" />
              </svg>
              <span className="text-[13px] font-medium text-white/80">ProcureFlow</span>
            </Link>
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
          <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white/80 transition-colors">
            Log out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-10">{children}</div>
    </div>
  );
}