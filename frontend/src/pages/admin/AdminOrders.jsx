import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Package } from 'lucide-react';

const AdminOrders = () => {
  const { api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/admin/orders?limit=100');
        setOrders(response.data.orders || []);
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
      case 'processing': case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Card className="h-96 animate-pulse bg-gray-100" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Orders</h1>
        <Badge variant="outline">{orders.length} total</Badge>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-gray-500">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{order.items?.length || 0} items</TableCell>
                  <TableCell className="font-medium text-red-600">${order.total}</TableCell>
                  <TableCell><Badge className={getStatusColor(order.status)}>{order.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{order.payment_status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default AdminOrders;
