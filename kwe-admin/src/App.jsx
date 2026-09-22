import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layouts/AppLayout';
import { Toaster } from '@/components/ui/sonner';

import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import InstantQuote from '@/pages/InstantQuote';
import InstantQuoteResults from '@/pages/InstantQuoteResults';

import Dashboard from '@/pages/Dashboard';
import QuoteSearch from '@/pages/QuoteSearch';
import QuoteResults from '@/pages/QuoteResults';
import QuoteComparison from '@/pages/QuoteComparison';
import Booking from '@/pages/Booking';
import Shipments from '@/pages/Shipments';
import ShipmentDetail from '@/pages/ShipmentDetail';
import Invoices from '@/pages/Invoices';
import Notifications from '@/pages/Notifications';

import ProviderDashboard from '@/pages/provider/ProviderDashboard';
import RateManagement from '@/pages/provider/RateManagement';
import RouteManagement from '@/pages/provider/RouteManagement';
import BookingRequests from '@/pages/provider/BookingRequests';
import Analytics from '@/pages/provider/Analytics';

import ProviderManagement from '@/pages/admin/ProviderManagement';
import Leads from '@/pages/admin/Leads';

import PricingLayout from '@/components/layouts/PricingLayout';
import PricingOverview from '@/pages/admin/pricing/PricingOverview';
import AirMatrix from '@/pages/admin/pricing/AirMatrix';
import MatrixHistory from '@/pages/admin/pricing/MatrixHistory';
import QuoteCalculator from '@/pages/admin/pricing/QuoteCalculator';
import MatrixDetail from '@/pages/admin/pricing/MatrixDetail';
import MatrixForm from '@/pages/admin/pricing/MatrixForm';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/instant-quote" element={<InstantQuote />} />
            <Route path="/instant-quote/results" element={<InstantQuoteResults />} />

            {/* Authenticated */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/quotes/search" element={<QuoteSearch />} />
              <Route path="/quotes/results" element={<QuoteResults />} />
              <Route path="/quotes/compare" element={<QuoteComparison />} />
              <Route path="/bookings/new" element={<Booking />} />
              <Route path="/shipments" element={<Shipments />} />
              <Route path="/shipments/:id" element={<ShipmentDetail />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/notifications" element={<Notifications />} />

              <Route path="/provider/dashboard" element={<ProtectedRoute allowedRoles={['provider', 'admin']}><ProviderDashboard /></ProtectedRoute>} />
              <Route path="/provider/rates" element={<ProtectedRoute allowedRoles={['provider', 'admin']}><RateManagement /></ProtectedRoute>} />
              <Route path="/provider/routes" element={<ProtectedRoute allowedRoles={['provider', 'admin']}><RouteManagement /></ProtectedRoute>} />
              <Route path="/provider/booking-requests" element={<ProtectedRoute allowedRoles={['provider', 'admin']}><BookingRequests /></ProtectedRoute>} />
              <Route path="/provider/analytics" element={<ProtectedRoute allowedRoles={['provider', 'admin']}><Analytics /></ProtectedRoute>} />

              <Route path="/admin/dashboard" element={<Navigate to="/admin/pricing" replace />} />
              <Route path="/admin/pricing" element={<ProtectedRoute allowedRoles={['admin']}><PricingLayout /></ProtectedRoute>}>
                <Route index element={<PricingOverview />} />
              <Route path="air" element={<AirMatrix />} />
                <Route path="history" element={<MatrixHistory />} />
                <Route path="calculator" element={<QuoteCalculator />} />
              </Route>
              <Route path="/admin/pricing/matrix/new" element={<ProtectedRoute allowedRoles={['admin']}><MatrixForm /></ProtectedRoute>} />
              <Route path="/admin/pricing/matrix/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><MatrixForm /></ProtectedRoute>} />
              <Route path="/admin/pricing/matrix/:id" element={<ProtectedRoute allowedRoles={['admin']}><MatrixDetail /></ProtectedRoute>} />
              <Route path="/admin/providers" element={<ProtectedRoute allowedRoles={['admin']}><ProviderManagement /></ProtectedRoute>} />
              <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={['admin']}><Leads /></ProtectedRoute>} />
            </Route>

            <Route path="/" element={<Navigate to="/instant-quote" replace />} />
            <Route path="*" element={<Navigate to="/instant-quote" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

