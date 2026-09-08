import { useNavigate, Link } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("procureflow_token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Log out
        </button>
      </div>

      <div className="flex gap-4">
        <Link
          to="/vendors"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-accent-400 transition-colors"
        >
          <p className="font-medium text-slate-900">Vendors</p>
          <p className="text-sm text-slate-500">Manage your vendor list</p>
        </Link>
        <Link
          to="/rfqs"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-accent-400 transition-colors"
        >
          <p className="font-medium text-slate-900">RFQs</p>
          <p className="text-sm text-slate-500">Requests for quote</p>
        </Link>
      </div>

            <div className="flex gap-4">
        <Link
          to="/vendors"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-accent-400 transition-colors"
        >
          <p className="font-medium text-slate-900">Vendors</p>
          <p className="text-sm text-slate-500">Manage your vendor list</p>
        </Link>
        <Link
          to="/rfqs"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-accent-400 transition-colors"
        >
          <p className="font-medium text-slate-900">RFQs</p>
          <p className="text-sm text-slate-500">Requests for quote</p>
        </Link>
        <Link
          to="/invoices"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-accent-400 transition-colors"
        >
          <p className="font-medium text-slate-900">Invoices</p>
          <p className="text-sm text-slate-500">Payments & invoices</p>
        </Link>
      </div>
    </div>
  );
}