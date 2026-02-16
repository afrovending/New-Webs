import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Store, Package, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';

const AdminDashboard = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Card key={i} className="h-24 animate-pulse bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold" data-testid="admin-dashboard-title">Admin Dashboard</h1>
        <p className="text-gray-300 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_vendors || 0}</p>
            <p className="text-sm text-gray-500">Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_products || 0}</p>
            <p className="text-sm text-gray-500">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${stats?.total_revenue?.toFixed(2) || '0.00'}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Revenue</span>
                <span>${stats?.order_revenue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Booking Revenue</span>
                <span>${stats?.booking_revenue?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <span className="text-gray-600">Pending Vendors</span>
                <span className="font-bold text-amber-600">{stats?.pending_vendors || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600">Total Services</span>
                <span className="font-bold text-blue-600">{stats?.total_services || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600">Total Bookings</span>
                <span className="font-bold text-green-600">{stats?.total_bookings || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
