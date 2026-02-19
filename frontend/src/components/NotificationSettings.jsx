import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Check, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import pushService from '../services/pushNotificationService';
import { toast } from 'sonner';

const NotificationSettings = () => {
  const { user, api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Notification preferences
  const [preferences, setPreferences] = useState({
    order_updates: true,
    promotions: true,
    price_alerts: true,
    new_products: false,
    vendor_messages: true
  });

  useEffect(() => {
    initNotifications();
    loadPreferences();
  }, []);

  const initNotifications = async () => {
    setLoading(true);
    try {
      const initialized = await pushService.init();
      if (initialized) {
        const status = await pushService.getPermissionStatus();
        setPermissionStatus(status);
        
        const subscribed = await pushService.isSubscribed();
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error('Failed to init notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences');
      if (response.data) {
        setPreferences({
          order_updates: response.data.order_updates ?? true,
          promotions: response.data.promotions ?? true,
          price_alerts: response.data.price_alerts ?? true,
          new_products: response.data.new_products ?? false,
          vendor_messages: response.data.vendor_messages ?? true
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setSubscribing(true);
    try {
      // Request permission
      const permResult = await pushService.requestPermission();
      
      if (permResult.success) {
        setPermissionStatus('granted');
        
        // Subscribe
        const subResult = await pushService.subscribe(user?.id);
        
        if (subResult.success) {
          setIsSubscribed(true);
          toast.success('Notifications enabled!');
          
          // Show test notification
          await pushService.showLocalNotification('Notifications Enabled!', {
            body: 'You will now receive updates about your orders and deals.'
          });
        } else {
          toast.error('Failed to enable notifications');
        }
      } else {
        setPermissionStatus(permResult.permission || 'denied');
        if (permResult.permission === 'denied') {
          toast.error('Please enable notifications in your browser settings');
        }
      }
    } catch (error) {
      console.error('Enable notifications error:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const handleDisableNotifications = async () => {
    setSubscribing(true);
    try {
      const result = await pushService.unsubscribe();
      if (result.success) {
        setIsSubscribed(false);
        toast.success('Notifications disabled');
      }
    } catch (error) {
      toast.error('Failed to disable notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // In production, save to backend
    toast.success('Preference updated');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  // Check if push is supported
  if (!pushService.isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="notification-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Stay updated with order status, deals, and price drops
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="bg-green-100 p-2 rounded-lg">
                <BellRing className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="bg-gray-200 p-2 rounded-lg">
                <BellOff className="h-5 w-5 text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
              </p>
              <p className="text-sm text-gray-500">
                {isSubscribed 
                  ? 'You will receive push notifications'
                  : 'Get instant updates on your device'}
              </p>
            </div>
          </div>
          <Button
            onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
            disabled={subscribing || permissionStatus === 'denied'}
            variant={isSubscribed ? 'outline' : 'default'}
            className={!isSubscribed ? 'bg-red-600 hover:bg-red-700' : ''}
            data-testid="toggle-notifications-btn"
          >
            {subscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              'Disable'
            ) : (
              'Enable'
            )}
          </Button>
        </div>

        {permissionStatus === 'denied' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>Notifications Blocked</strong>
            <p className="mt-1">
              You've blocked notifications. To enable them, click the lock icon in your browser's address bar and allow notifications.
            </p>
          </div>
        )}

        {/* Notification Preferences */}
        {isSubscribed && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Notification Preferences</h4>
            
            <div className="space-y-3">
              {[
                { key: 'orderUpdates', label: 'Order Updates', desc: 'Shipping and delivery notifications' },
                { key: 'promotions', label: 'Promotions & Deals', desc: 'Sales and special offers' },
                { key: 'priceAlerts', label: 'Price Alerts', desc: 'When items on your wishlist drop in price' },
                { key: 'newProducts', label: 'New Products', desc: 'New arrivals from vendors you follow' },
                { key: 'vendorMessages', label: 'Vendor Messages', desc: 'Direct messages from sellers' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">{label}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <Switch
                    checked={preferences[key]}
                    onCheckedChange={() => togglePreference(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
