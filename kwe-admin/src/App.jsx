import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layouts/AppLayout';
import { Toaster } from '@/components/ui/sonner';

import Login from '@/pages/Login';
import LoginCallback from '@/pages/LoginCallback';
import SsoSignIn from '@/pages/SsoSignIn';
import AccessDenied from '@/pages/AccessDenied';
import HomeRedirect from '@/components/HomeRedirect';
import { ANY_ROLE, WRITE_ROLE } from '@/lib/admin-nav';
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
import Quotes from '@/pages/admin/Quotes';

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
            <Route path="/login/callback" element={<LoginCallback />} />
            <Route path="/login/sso" element={<SsoSignIn />} />
            <Route path="/access-denied" element={<AccessDenied />} />
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
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><Dashboard /></ProtectedRoute>} />
              <Route path="/quotes/search" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><QuoteSearch /></ProtectedRoute>} />
              <Route path="/quotes/results" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><QuoteResults /></ProtectedRoute>} />
              <Route path="/quotes/compare" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><QuoteComparison /></ProtectedRoute>} />
              <Route path="/bookings/new" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><Booking /></ProtectedRoute>} />
              <Route path="/shipments" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><Shipments /></ProtectedRoute>} />
              <Route path="/shipments/:id" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><ShipmentDetail /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><Invoices /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><Notifications /></ProtectedRoute>} />

              <Route path="/provider/dashboard" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><ProviderDashboard /></ProtectedRoute>} />
              <Route path="/provider/rates" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><RateManagement /></ProtectedRoute>} />
              <Route path="/provider/routes" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><RouteManagement /></ProtectedRoute>} />
              <Route path="/provider/booking-requests" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><BookingRequests /></ProtectedRoute>} />
              <Route path="/provider/analytics" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><Analytics /></ProtectedRoute>} />

              <Route path="/admin/dashboard" element={<Navigate to="/admin/pricing" replace />} />
              <Route path="/admin/pricing" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><PricingLayout /></ProtectedRoute>}>
                <Route index element={<PricingOverview />} />
              <Route path="air" element={<AirMatrix />} />
                <Route path="history" element={<MatrixHistory />} />
                <Route path="calculator" element={<QuoteCalculator />} />
              </Route>
              <Route path="/admin/pricing/matrix/new" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><MatrixForm /></ProtectedRoute>} />
              <Route path="/admin/pricing/matrix/:id/edit" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><MatrixForm /></ProtectedRoute>} />
              <Route path="/admin/pricing/matrix/:id" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><MatrixDetail /></ProtectedRoute>} />
              <Route path="/admin/providers" element={<ProtectedRoute allowedRoles={WRITE_ROLE}><ProviderManagement /></ProtectedRoute>} />
              <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={ANY_ROLE}><Leads /></ProtectedRoute>} />
              <Route path="/admin/quotes" element={<ProtectedRoute allowedRoles={ANY_ROLE}><Quotes /></ProtectedRoute>} />
            </Route>

            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

