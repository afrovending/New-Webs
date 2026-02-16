import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package } from 'lucide-react';

const OrdersPage = () => {
  const { api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Card key={i} className="h-24 animate-pulse bg-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="orders-title">My Orders</h1>
      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} data-testid={`order-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-600">${order.total}</p>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span className="text-gray-600">${item.item_total}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-3 pt-3 border-t">
                  <p>Ship to: {order.shipping_address}, {order.shipping_city}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
