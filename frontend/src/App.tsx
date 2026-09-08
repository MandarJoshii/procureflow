import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./features/auth/components/AuthPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import VendorListPage from "./features/vendors/components/VendorListPage";
import RFQListPage from "./features/rfqs/components/RFQListPage";
import RFQDetailPage from "./features/rfqs/components/RFQDetailPage";
import PODetailPage from "./features/purchase-orders/components/PODetailPage";
import InvoiceListPage from "./features/invoices/components/InvoiceListPage";
import InvoiceDetailPage from "./features/invoices/components/InvoiceDetailPage";
import ProtectedRoute from "./app/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <VendorListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs"
          element={
            <ProtectedRoute>
              <RFQListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:id"
          element={
            <ProtectedRoute>
              <RFQDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders/:id"
          element={
            <ProtectedRoute>
              <PODetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoiceListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute>
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;