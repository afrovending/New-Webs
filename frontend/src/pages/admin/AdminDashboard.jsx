import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Users, Store, Package, DollarSign, TrendingUp, TrendingDown,
  ShoppingBag, Calendar, BadgeCheck, AlertTriangle, Activity,
  ArrowUpRight, ArrowDownRight, Star, ImageOff, RefreshCw
} from 'lucide-react';
import AdminNotificationCenter from '../../components/admin/AdminNotificationCenter';

const AdminDashboard = () => {
  const { api } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [brokenImages, setBrokenImages] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [notifyingVendors, setNotifyingVendors] = useState(false);
  const [notificationResult, setNotificationResult] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/analytics?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBrokenImages = async () => {
    setLoadingImages(true);
    setNotificationResult(null);
    try {
      const response = await api.get('/admin/products/broken-images');
      setBrokenImages(response.data);
    } catch (error) {
      console.error('Error checking broken images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const notifyVendors = async () => {
    setNotifyingVendors(true);
    try {
      const response = await api.post('/admin/products/notify-broken-images');
      setNotificationResult(response.data);
    } catch (error) {
      console.error('Error notifying vendors:', error);
      setNotificationResult({ success: false, message: 'Failed to send notifications' });
    } finally {
      setNotifyingVendors(false);
    }
  };

  const GrowthIndicator = ({ value }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(value)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Analytics Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Card key={i} className="h-28 animate-pulse bg-gray-100" />)}
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const growth = analytics?.growth || {};
  const topVendors = analytics?.top_vendors || [];
  const topProducts = analytics?.top_products || [];
  const dailyStats = analytics?.daily_stats || [];

  // Calculate chart max values
  const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1);
  const maxOrders = Math.max(...dailyStats.map(d => d.orders), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold" data-testid="admin-analytics-title">Analytics Dashboard</h1>
            <p className="text-gray-300 mt-1">Comprehensive platform performance overview</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white" data-testid="period-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="total-users-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-500" />
              <GrowthIndicator value={growth.users} />
            </div>
            <p className="text-2xl font-bold mt-2">{summary.total_users?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-xs text-gray-400 mt-1">+{summary.new_users} new</p>
          </CardContent>
        </Card>

        <Card data-testid="total-vendors-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Store className="h-8 w-8 text-amber-500" />
              <Badge variant="outline" className="text-xs">{summary.active_vendors} active</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{summary.total_vendors?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Vendors</p>
            <div className="flex gap-2 mt-1">
              {summary.pending_vendors > 0 && (
                <span className="text-xs text-amber-600">{summary.pending_vendors} pending</span>
              )}
              {summary.deactivated_vendors > 0 && (
                <span className="text-xs text-red-600">{summary.deactivated_vendors} deactivated</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="total-products-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <ShoppingBag className="h-8 w-8 text-purple-500" />
              <Badge variant="outline" className="text-xs">{summary.active_products} active</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{summary.total_products?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </CardContent>
        </Card>

        <Card data-testid="revenue-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-500" />
              <GrowthIndicator value={growth.revenue} />
            </div>
            <p className="text-2xl font-bold mt-2">${summary.revenue?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Period Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders & Bookings Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Package className="h-6 w-6 text-indigo-500" />
              <GrowthIndicator value={growth.orders} />
            </div>
            <p className="text-xl font-bold mt-2">{summary.total_orders?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-xs text-gray-400">{summary.period_orders} this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Calendar className="h-6 w-6 text-teal-500" />
            <p className="text-xl font-bold mt-2">{summary.total_bookings?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-xs text-gray-400">{summary.period_bookings} this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Activity className="h-6 w-6 text-cyan-500" />
            <p className="text-xl font-bold mt-2">{summary.total_services?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Services</p>
            <p className="text-xs text-gray-400">{summary.active_services} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <BadgeCheck className="h-6 w-6 text-blue-500" />
            <p className="text-xl font-bold mt-2">{summary.verified_vendors?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Verified Vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Lists Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Daily Activity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {dailyStats.slice(-30).map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: $${day.revenue} revenue, ${day.orders} orders`}>
                  <div 
                    className="w-full bg-green-400 rounded-t transition-all hover:bg-green-500"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                  />
                  <div 
                    className="w-full bg-blue-400 rounded-t transition-all hover:bg-blue-500"
                    style={{ height: `${(day.orders / maxOrders) * 40}%`, minHeight: day.orders > 0 ? '2px' : '0' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs text-gray-500">
              <span>{dailyStats[0]?.date}</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded" /> Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded" /> Orders</span>
              </div>
              <span>{dailyStats[dailyStats.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.pending_vendors > 0 && (
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <p className="font-medium text-amber-800">Pending Vendor Approvals</p>
                  <p className="text-sm text-amber-600">{summary.pending_vendors} vendors awaiting review</p>
                </div>
                <Button size="sm" variant="outline" className="border-amber-400 text-amber-700" onClick={() => window.location.href = '/admin/vendors'}>
                  Review
                </Button>
              </div>
            )}
            
            {summary.deactivated_vendors > 0 && (
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-800">Deactivated Vendors</p>
                  <p className="text-sm text-red-600">{summary.deactivated_vendors} vendors currently deactivated</p>
                </div>
                <Button size="sm" variant="outline" className="border-red-400 text-red-700" onClick={() => window.location.href = '/admin/vendors'}>
                  Manage
                </Button>
              </div>
            )}

            {summary.pending_vendors === 0 && summary.deactivated_vendors === 0 && (
              <div className="text-center py-6 text-gray-500">
                <BadgeCheck className="h-12 w-12 mx-auto text-green-400 mb-2" />
                <p>All caught up! No pending actions.</p>
              </div>
            )}

            {/* Broken Images Check */}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ImageOff className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Product Images Health</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={checkBrokenImages}
                  disabled={loadingImages}
                  data-testid="check-broken-images-btn"
                >
                  {loadingImages ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Check Now'
                  )}
                </Button>
              </div>
              
              {brokenImages && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <p className="text-green-700 font-bold">{brokenImages.summary.products_with_cloudinary_images}</p>
                      <p className="text-green-600 text-xs">Cloudinary (OK)</p>
                    </div>
                    <div className={`p-2 rounded text-center ${brokenImages.summary.total_needing_attention > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <p className={`font-bold ${brokenImages.summary.total_needing_attention > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                        {brokenImages.summary.total_needing_attention}
                      </p>
                      <p className={`text-xs ${brokenImages.summary.total_needing_attention > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        Need Attention
                      </p>
                    </div>
                  </div>
                  
                  {brokenImages.summary.total_needing_attention > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                      <p className="text-amber-800 font-medium mb-2">Affected Products:</p>
                      <ul className="space-y-1 text-amber-700 max-h-32 overflow-y-auto">
                        {[...brokenImages.broken_images, ...brokenImages.no_images].map((item, i) => (
                          <li key={i} className="flex justify-between text-xs">
                            <span className="truncate flex-1">{item.product_name}</span>
                            <span className="text-amber-600 ml-2">{item.vendor_store}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <Button
                          size="sm"
                          onClick={notifyVendors}
                          disabled={notifyingVendors}
                          className="w-full bg-amber-600 hover:bg-amber-700"
                          data-testid="notify-vendors-btn"
                        >
                          {notifyingVendors ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Email Affected Vendors
                        </Button>
                      </div>
                      {notificationResult && (
                        <div className={`mt-2 p-2 rounded text-xs ${notificationResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {notificationResult.message}
                          {notificationResult.vendors_notified && (
                            <span className="block mt-1">
                              Notified: {notificationResult.vendors_notified.map(v => v.store_name).join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Top Vendors by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topVendors.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No vendor data yet</p>
            ) : (
              <div className="space-y-3">
                {topVendors.slice(0, 5).map((vendor, i) => (
                  <div key={vendor.vendor_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100'}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          {vendor.store_name}
                          {vendor.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
                        </p>
                        <p className="text-xs text-gray-500">{vendor.orders} orders</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">${vendor.revenue?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-500" />
              Top Products by Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No product data yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, i) => (
                  <div key={product.product_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-purple-500 text-white' : i === 1 ? 'bg-purple-300' : i === 2 ? 'bg-purple-200' : 'bg-gray-100'}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.quantity_sold} units sold</p>
                      </div>
                    </div>
                    <span className="font-bold text-purple-600">${product.revenue?.toFixed(2)}</span>
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

export default AdminDashboard;
