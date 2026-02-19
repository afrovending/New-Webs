import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Toaster } from './components/ui/sonner';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import VendorsPage from './pages/VendorsPage';
import VendorStorePage from './pages/VendorStorePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PricingPage from './pages/PricingPage';
import CategoryLandingPage from './pages/CategoryLandingPage';
import WishlistPage from './pages/WishlistPage';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import BookingsPage from './pages/BookingsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import { OrderHistoryPage, OrderDetailPage } from './pages/OrderHistoryPage';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorServices from './pages/vendor/VendorServices';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorBookings from './pages/vendor/VendorBookings';
import VendorSubscription from './pages/vendor/VendorSubscription';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorStoreSettings from './pages/vendor/VendorStoreSettings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVendors from './pages/admin/AdminVendors';
import AdminOrders from './pages/admin/AdminOrders';

import './App.css';

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const { processGoogleSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionIdMatch = hash.match(/session_id=([^&]+)/);
    
    if (sessionIdMatch) {
      const sessionId = sessionIdMatch[1];
      processGoogleSession(sessionId)
        .then((user) => {
          // Clear the hash
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/dashboard', { state: { user } });
        })
        .catch((error) => {
          console.error('Auth callback error:', error);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (requiredRole === 'vendor' && user?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// App Router
const AppRouter = () => {
  const location = useLocation();

  // Check URL fragment for session_id (Google OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:id" element={<ServiceDetailPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/:id" element={<VendorStorePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        
        {/* Category Landing Pages */}
        <Route path="category/:categorySlug" element={<CategoryLandingPage />} />
        
        <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Customer Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrderHistoryPage />} />
        <Route path="orders/:orderId" element={<OrderDetailPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Vendor Dashboard */}
      <Route path="/vendor" element={<ProtectedRoute requiredRole="vendor"><DashboardLayout isVendor /></ProtectedRoute>}>
        <Route index element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="services" element={<VendorServices />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="bookings" element={<VendorBookings />} />
        <Route path="analytics" element={<VendorAnalytics />} />
        <Route path="subscription" element={<VendorSubscription />} />
        <Route path="store-settings" element={<VendorStoreSettings />} />
      </Route>

      {/* Admin Dashboard */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><DashboardLayout isAdmin /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <AppRouter />
            <Toaster position="top-right" />
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
