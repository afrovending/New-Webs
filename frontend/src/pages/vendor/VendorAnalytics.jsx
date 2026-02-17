import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Eye, 
  BarChart3, MapPin, Package, Star, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const VendorAnalytics = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [productAnalytics, setProductAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/api/vendor/analytics?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/vendor/analytics/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAnalytics(analyticsRes.data);
      setProductAnalytics(productsRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const GrowthIndicator = ({ value }) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(value)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const growth = analytics?.growth || {};
  const customerInsights = analytics?.customer_insights || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your store performance and customer insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['7d', '30d', '90d', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.revenue || 0)}</p>
                <GrowthIndicator value={growth.revenue || 0} />
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{summary.total_orders || 0}</p>
                <GrowthIndicator value={growth.orders || 0} />
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{summary.total_views?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-500">{summary.conversion_rate || 0}% conversion</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.avg_order_value || 0)}</p>
                <p className="text-sm text-gray-500">{summary.total_bookings || 0} bookings</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-1">
              {(analytics?.daily_revenue || []).slice(-30).map((day, index) => {
                const maxRevenue = Math.max(...(analytics?.daily_revenue || []).map(d => d.revenue), 1);
                const height = (day.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 bg-red-500 rounded-t hover:bg-red-600 transition-colors cursor-pointer group relative"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ${formatCurrency(day.revenue)}`}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {day.date.slice(5)}: {formatCurrency(day.revenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Insights</CardTitle>
            <CardDescription>Understanding your customer base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Total Customers</p>
                  <p className="text-sm text-gray-500">Unique buyers</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{customerInsights.total_customers || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Repeat Customers</p>
                  <p className="text-sm text-gray-500">Came back for more</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{customerInsights.repeat_customers || 0}</span>
                <p className="text-sm text-green-600">{customerInsights.repeat_rate || 0}% rate</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Avg Orders/Customer</p>
                  <p className="text-sm text-gray-500">Order frequency</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{customerInsights.avg_orders_per_customer || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics?.top_products || []).length > 0 ? (
                analytics.top_products.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.orders} orders</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">{formatCurrency(product.revenue)}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No sales data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geographic Breakdown</CardTitle>
            <CardDescription>Where your customers are ordering from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.geographic_breakdown || {}).length > 0 ? (
                Object.entries(analytics.geographic_breakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([country, count]) => {
                    const total = Object.values(analytics.geographic_breakdown).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    return (
                      <div key={country} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{country}</span>
                          </div>
                          <span className="text-sm text-gray-600">{count} orders ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-center text-gray-500 py-8">No geographic data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Performance</CardTitle>
          <CardDescription>Detailed metrics for all your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Product</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 px-2">Stock</th>
                  <th className="text-right py-3 px-2">Views</th>
                  <th className="text-right py-3 px-2">Orders</th>
                  <th className="text-right py-3 px-2">Units Sold</th>
                  <th className="text-right py-3 px-2">Revenue</th>
                  <th className="text-right py-3 px-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {(productAnalytics?.products || []).slice(0, 10).map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-medium">{product.name}</span>
                    </td>
                    <td className="text-right py-3 px-2">{formatCurrency(product.price)}</td>
                    <td className="text-right py-3 px-2">
                      <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-2">{product.views.toLocaleString()}</td>
                    <td className="text-right py-3 px-2">{product.orders}</td>
                    <td className="text-right py-3 px-2">{product.units_sold}</td>
                    <td className="text-right py-3 px-2 text-green-600 font-medium">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="text-right py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        {product.rating.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalytics;
