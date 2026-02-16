import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package, Calendar, MessageSquare, ArrowRight } from 'lucide-react';

const DashboardPage = () => {
  const { user, api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, bookingsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/bookings'),
        ]);
        setOrders(ordersRes.data.slice(0, 5));
        setBookings(bookingsRes.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'processing': case 'confirmed': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold" data-testid="dashboard-welcome">Welcome back, {user?.first_name}!</h1>
        <p className="text-amber-100 mt-1">Here's an overview of your recent activity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{bookings.length}</p>
            <p className="text-sm text-gray-500">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-amber-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-amber-600 font-bold">{user?.first_name?.[0]}</span>
            </div>
            <p className="text-sm font-medium capitalize">{user?.role}</p>
            <p className="text-xs text-gray-500">Account Type</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link to="/dashboard/orders">
              <Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-amber-600">${order.total}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Link to="/dashboard/bookings">
              <Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{booking.service_name}</p>
                      <p className="text-xs text-gray-500">{booking.booking_date} at {booking.booking_time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-amber-600">${booking.price}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
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

export default DashboardPage;
