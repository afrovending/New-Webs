import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Package, Truck, CheckCircle, Clock, MapPin, 
  ChevronRight, ArrowLeft, Box, Calendar, CreditCard,
  AlertCircle, RefreshCw, FileDown, RotateCcw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// Order Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
    processing: { label: 'Processing', className: 'bg-purple-100 text-purple-800' },
    shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800' },
    out_for_delivery: { label: 'Out for Delivery', className: 'bg-cyan-100 text-cyan-800' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
    refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' },
  };
  
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  
  return (
    <Badge className={config.className}>{config.label}</Badge>
  );
};

// Order Timeline Component
const OrderTimeline = ({ timeline, trackingNumber }) => {
  return (
    <div className="space-y-4">
      {trackingNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-800">
            <Truck className="h-5 w-5" />
            <span className="font-medium">Tracking Number:</span>
            <span className="font-mono">{trackingNumber}</span>
          </div>
        </div>
      )}
      
      <div className="relative">
        {timeline.map((stage, index) => {
          const isLast = index === timeline.length - 1;
          const Icon = stage.status === 'delivered' ? CheckCircle :
                       stage.status === 'shipped' ? Truck :
                       stage.status === 'processing' ? Package :
                       stage.status === 'cancelled' ? AlertCircle :
                       Clock;
          
          return (
            <div key={stage.status} className="flex gap-4 pb-6">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  stage.completed 
                    ? stage.current 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 mt-2 ${
                    stage.completed ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              
              {/* Content */}
              <div className={`flex-1 pb-2 ${!stage.completed ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${stage.current ? 'text-green-700' : ''}`}>
                    {stage.label}
                    {stage.current && <span className="ml-2 text-xs text-green-600">(Current)</span>}
                  </h4>
                  {stage.timestamp && (
                    <span className="text-sm text-gray-500">
                      {new Date(stage.timestamp).toLocaleDateString()} {new Date(stage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Order Detail Page
const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { api, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrderDetail();
    }
  }, [isAuthenticated, orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`/orders/${orderId}/detail`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      await api.post(`/orders/${orderId}/reorder`);
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error(error.response?.data?.detail || 'Failed to reorder items');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <Button onClick={() => navigate('/dashboard/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/dashboard/orders')} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order #{order.id?.slice(0, 8)}
                </CardTitle>
                <StatusBadge status={order.status} />
              </div>
            </CardHeader>
            <CardContent>
              {/* Timeline */}
              <OrderTimeline 
                timeline={order.timeline || []} 
                trackingNumber={order.tracking_number}
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Box className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name || item.product?.name}</h4>
                      {item.vendor && (
                        <p className="text-sm text-gray-500">{item.vendor.store_name}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Ordered on {new Date(order.created_at).toLocaleDateString()}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-red-600">{formatPrice(order.total)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="capitalize">{order.payment_status}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {order.shipping_address}<br />
                {order.shipping_city}, {order.shipping_country}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                data-testid="download-invoice-btn"
              >
                {downloadingInvoice ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Download Invoice
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleReorder}
                disabled={reordering}
                data-testid="reorder-btn"
              >
                {reordering ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reorder Items
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Order History List Page
const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { api, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await api.get(`/orders/history?${params}`);
      setOrders(response.data.orders || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Order History</h1>
        <p className="text-gray-600 mb-6">Sign in to view your orders</p>
        <Button onClick={() => navigate('/login')} className="bg-red-600 hover:bg-red-700">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="order-history-title">
          <Package className="h-6 w-6" />
          Order History
        </h1>
        
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">
            Your order history will appear here once you make a purchase
          </p>
          <Link to="/products">
            <Button className="bg-red-600 hover:bg-red-700">
              Start Shopping
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/dashboard/orders/${order.id}`)}
              data-testid={`order-card-${order.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {/* Order Items Preview */}
                    <div className="flex -space-x-4">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div 
                          key={i} 
                          className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-white overflow-hidden"
                        >
                          {item.product_image ? (
                            <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Box className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg border-2 border-white flex items-center justify-center">
                          <span className="text-sm text-gray-600">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium">Order #{order.id?.slice(0, 8)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()} • {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.items?.map(i => i.product_name).join(', ').slice(0, 50)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{formatPrice(order.total)}</p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { OrderHistoryPage, OrderDetailPage, OrderTimeline, StatusBadge };
export default OrderHistoryPage;
