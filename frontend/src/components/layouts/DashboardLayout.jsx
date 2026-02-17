import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Package,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  ShoppingBag,
  Users,
  Store,
  BarChart3,
  Home,
  Briefcase,
  CheckCircle,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const DashboardLayout = ({ isVendor, isAdmin }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const customerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/orders', icon: Package, label: 'My Orders' },
    { to: '/dashboard/bookings', icon: Calendar, label: 'My Bookings' },
    { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/dashboard/profile', icon: Settings, label: 'Settings' },
  ];

  const vendorLinks = [
    { to: '/vendor', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendor/products', icon: ShoppingBag, label: 'Products' },
    { to: '/vendor/services', icon: Briefcase, label: 'Services' },
    { to: '/vendor/orders', icon: Package, label: 'Orders' },
    { to: '/vendor/bookings', icon: Calendar, label: 'Bookings' },
    { to: '/vendor/subscription', icon: CreditCard, label: 'Subscription' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/vendors', icon: Store, label: 'Vendors' },
    { to: '/admin/orders', icon: Package, label: 'Orders' },
  ];

  const links = isAdmin ? adminLinks : isVendor ? vendorLinks : customerLinks;
  const title = isAdmin ? 'Admin Dashboard' : isVendor ? 'Vendor Dashboard' : 'My Account';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-lg font-bold text-amber-900">AfroVending</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Back to Store
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {user?.picture ? (
                <img src={user.picture} alt={user.first_name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-medium">{user?.first_name?.[0]}</span>
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium">{user?.first_name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] hidden md:block">
          <nav className="p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              {!isVendor && !isAdmin && user?.role === 'customer' && (
                <Link
                  to="/register"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Store className="h-5 w-5" />
                  Become a Vendor
                </Link>
              )}
              {user?.role === 'vendor' && !isVendor && (
                <Link
                  to="/vendor"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Store className="h-5 w-5" />
                  Vendor Dashboard
                </Link>
              )}
              {user?.role === 'admin' && !isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <BarChart3 className="h-5 w-5" />
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around py-2">
            {links.slice(0, 5).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-1',
                    isActive ? 'text-amber-600' : 'text-gray-500'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{link.label.split(' ').pop()}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
