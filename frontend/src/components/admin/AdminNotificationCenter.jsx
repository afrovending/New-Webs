import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
  Bell,
  ShoppingCart,
  Store,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Check,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ type }) => {
  const icons = {
    new_order: <ShoppingCart className="h-4 w-4 text-green-600" />,
    vendor_application: <Store className="h-4 w-4 text-blue-600" />,
    low_stock: <Package className="h-4 w-4 text-amber-600" />,
    out_of_stock: <AlertTriangle className="h-4 w-4 text-red-600" />,
    new_users: <Users className="h-4 w-4 text-purple-600" />,
    payout: <DollarSign className="h-4 w-4 text-emerald-600" />
  };
  return icons[type] || <Bell className="h-4 w-4 text-gray-600" />;
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return (
    <Badge className={`${styles[priority]} text-xs`}>
      {priority}
    </Badge>
  );
};

const AdminNotificationCenter = () => {
  const { api } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/admin/notification-center');
      setNotifications(response.data.notifications || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.post('/admin/notification-center/mark-read', null, {
        params: { notification_id: notificationId }
      });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full" data-testid="notification-center">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-600" />
            Notification Center
            {summary.high_priority > 0 && (
              <Badge className="bg-red-500 text-white ml-2">
                {summary.high_priority}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-lg font-bold text-green-700">{summary.new_orders_24h || 0}</p>
            <p className="text-xs text-green-600">New Orders</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-700">{summary.pending_vendors || 0}</p>
            <p className="text-xs text-blue-600">Pending</p>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <p className="text-lg font-bold text-amber-700">{summary.low_stock_products || 0}</p>
            <p className="text-xs text-amber-600">Low Stock</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <p className="text-lg font-bold text-red-700">{summary.out_of_stock_count || 0}</p>
            <p className="text-xs text-red-600">Out of Stock</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
              <p className="text-sm text-gray-400">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                    notification.read
                      ? 'bg-gray-50 border-gray-100'
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <NotificationIcon type={notification.type} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {notification.title}
                        </span>
                        <PriorityBadge priority={notification.priority} />
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(notification.created_at)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          <Link to={notification.link}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              View
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminNotificationCenter;
