import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, Calendar, DollarSign, TrendingUp, AlertTriangle, PackageX, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const VendorDashboard = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, bookings: 0, revenue: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [lowStockData, setLowStockData] = useState({ products: [], summary: { total: 0, out_of_stock: 0, critical: 0, low: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAndFetch = async () => {
      try {
        // Auto-setup vendor profile if not exists
        if (user?.role === 'vendor' && !user?.vendor_id) {
          try {
            await api.post('/vendors/setup');
            toast.success('Vendor profile created! You can now add products.');
          } catch (e) {
            // Profile might already exist, that's fine
          }
        }
        
        const [ordersRes, bookingsRes, lowStockRes] = await Promise.all([
          api.get('/vendor/orders'),
          api.get('/vendor/bookings'),
          api.get('/vendors/me/low-stock').catch(() => ({ data: { products: [], summary: { total: 0, out_of_stock: 0, critical: 0, low: 0 } } })),
        ]);
        setRecentOrders(ordersRes.data.slice(0, 5));
        setRecentBookings(bookingsRes.data.slice(0, 5));
        setLowStockData(lowStockRes.data);
        
        const totalRevenue = ordersRes.data.reduce((sum, o) => sum + (o.total || 0), 0) +
                           bookingsRes.data.filter(b => b.payment_status === 'released').reduce((sum, b) => sum + (b.price || 0), 0);
        
        setStats({
          orders: ordersRes.data.length,
          bookings: bookingsRes.data.length,
          revenue: totalRevenue,
          products: 0,
        });
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
      }
    };
    setupAndFetch();
  }, [api, user]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold" data-testid="vendor-dashboard-title">Vendor Dashboard</h1>
        <p className="text-amber-100 mt-1">Manage your store and track performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.bookings}</p>
            <p className="text-sm text-gray-500">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">${stats.revenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">This Month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-medium text-red-600">${order.total}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{booking.service_name}</p>
                      <p className="text-xs text-gray-500">{booking.booking_date}</p>
                    </div>
                    <span className="font-medium text-red-600">${booking.price}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;
