import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, Calendar, DollarSign, TrendingUp, AlertTriangle, PackageX, ArrowRight, EyeOff, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VendorDashboard = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, bookings: 0, revenue: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [lowStockData, setLowStockData] = useState({ products: [], summary: { total: 0, out_of_stock: 0, critical: 0, low: 0, auto_deactivated: 0 } });
  const [loading, setLoading] = useState(true);
  const [reactivatingId, setReactivatingId] = useState(null);

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
        
        // Fetch data with individual error handling
        let ordersData = [];
        let bookingsData = [];
        let lowStockResult = { products: [], summary: { total: 0, out_of_stock: 0, critical: 0, low: 0 } };
        
        try {
          const ordersRes = await api.get('/vendor/orders');
          ordersData = ordersRes.data || [];
        } catch (e) {
          console.log('No orders data available');
        }
        
        try {
          const bookingsRes = await api.get('/vendor/bookings');
          bookingsData = bookingsRes.data || [];
        } catch (e) {
          console.log('No bookings data available');
        }
        
        try {
          const lowStockRes = await api.get('/vendors/me/low-stock');
          lowStockResult = lowStockRes.data;
        } catch (e) {
          console.log('No low stock data available');
        }
        
        setRecentOrders(ordersData.slice(0, 5));
        setRecentBookings(bookingsData.slice(0, 5));
        setLowStockData(lowStockResult);
        
        const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total || 0), 0) +
                           bookingsData.filter(b => b.payment_status === 'released').reduce((sum, b) => sum + (b.price || 0), 0);
        
        setStats({
          orders: ordersData.length,
          bookings: bookingsData.length,
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

  const handleReactivateProduct = async (productId) => {
    setReactivatingId(productId);
    try {
      await api.post(`/vendors/me/products/${productId}/reactivate`);
      toast.success('Product reactivated successfully!');
      
      // Refresh low stock data
      const lowStockRes = await api.get('/vendors/me/low-stock');
      setLowStockData(lowStockRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reactivate product. Make sure stock is greater than 0.');
    } finally {
      setReactivatingId(null);
    }
  };

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

      {/* Low Stock Alert Widget */}
      {lowStockData.summary.total > 0 && (
        <Card className={`border-2 ${lowStockData.summary.auto_deactivated > 0 || lowStockData.summary.out_of_stock > 0 || lowStockData.summary.critical > 0 ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${lowStockData.summary.auto_deactivated > 0 || lowStockData.summary.out_of_stock > 0 || lowStockData.summary.critical > 0 ? 'text-red-500' : 'text-amber-500'}`} />
                Low Stock Alert
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/vendor/products')}
                className="text-xs"
                data-testid="view-all-inventory-btn"
              >
                Manage Inventory <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="flex flex-wrap gap-3 mb-4">
              {lowStockData.summary.auto_deactivated > 0 && (
                <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <EyeOff className="h-4 w-4" />
                  {lowStockData.summary.auto_deactivated} Hidden
                </div>
              )}
              {lowStockData.summary.out_of_stock > 0 && (
                <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <PackageX className="h-4 w-4" />
                  {lowStockData.summary.out_of_stock} Out of Stock
                </div>
              )}
              {lowStockData.summary.critical > 0 && (
                <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {lowStockData.summary.critical} Critical
                </div>
              )}
              {lowStockData.summary.low > 0 && (
                <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Package className="h-4 w-4" />
                  {lowStockData.summary.low} Low
                </div>
              )}
            </div>
            
            {/* Product List */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lowStockData.products.slice(0, 6).map((product) => (
                <div 
                  key={product.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${product.auto_deactivated ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}
                  data-testid={`low-stock-item-${product.id}`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className={`w-full h-full object-cover ${product.auto_deactivated ? 'opacity-50' : ''}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    {product.auto_deactivated && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <EyeOff className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${product.auto_deactivated ? 'text-gray-500' : ''}`}>{product.name}</p>
                    <p className="text-xs text-gray-500">${product.price?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.auto_deactivated ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                        {product.stock > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                            onClick={() => handleReactivateProduct(product.id)}
                            disabled={reactivatingId === product.id}
                            data-testid={`reactivate-btn-${product.id}`}
                          >
                            {reactivatingId === product.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><RotateCcw className="h-3 w-3 mr-1" /> Reactivate</>
                            )}
                          </Button>
                        )}
                      </>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.stock === 0 
                          ? 'bg-red-100 text-red-700' 
                          : product.stock <= 3 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {lowStockData.products.length > 6 && (
              <p className="text-center text-sm text-gray-500 mt-3">
                +{lowStockData.products.length - 6} more products need attention
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorDashboard;
