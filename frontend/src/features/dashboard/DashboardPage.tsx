import { useNavigate } from "react-router-dom";

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
      <p className="text-slate-500">
        You're logged in. This is a placeholder — we'll build the real dashboard in a later phase.
      </p>
    </div>
  );
}