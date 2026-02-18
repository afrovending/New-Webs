import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { Bell, BellRing, TrendingDown } from 'lucide-react';

const PriceAlertButton = ({ productId, currentPrice, productName }) => {
  const { api, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [targetPrice, setTargetPrice] = useState(currentPrice * 0.9); // Default 10% below
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyApp, setNotifyApp] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && productId) {
      checkExistingAlert();
    }
  }, [isAuthenticated, productId]);

  const checkExistingAlert = async () => {
    try {
      const response = await api.get('/price-alerts');
      const existing = response.data.alerts.find(a => a.product_id === productId);
      if (existing) {
        setHasAlert(true);
        setTargetPrice(existing.target_price);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to set price alerts');
      return;
    }

    if (targetPrice >= currentPrice) {
      toast.error('Target price must be lower than current price');
      return;
    }

    setLoading(true);
    try {
      await api.post('/price-alerts/create', {
        product_id: productId,
        target_price: parseFloat(targetPrice),
        notify_email: notifyEmail,
        notify_app: notifyApp
      });
      
      setHasAlert(true);
      toast.success('Price alert set! We\'ll notify you when the price drops.');
      setIsOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to set alert');
    } finally {
      setLoading(false);
    }
  };

  const quickSetPrice = (percentage) => {
    setTargetPrice(Math.round(currentPrice * (1 - percentage) * 100) / 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={hasAlert ? 'text-green-600 border-green-300' : ''}
          data-testid={`price-alert-btn-${productId}`}
        >
          {hasAlert ? (
            <><BellRing className="h-4 w-4 mr-2" />Alert Set</>
          ) : (
            <><Bell className="h-4 w-4 mr-2" />Price Alert</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-500" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when {productName?.slice(0, 30)}... drops to your target price.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Current Price</span>
            <span className="text-lg font-bold">{formatPrice(currentPrice)}</span>
          </div>
          
          <div>
            <label className="text-sm font-medium">Target Price (USD)</label>
            <div className="flex gap-2 mt-2">
              <Input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                step="0.01"
                className="flex-1"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => quickSetPrice(0.1)}>-10%</Button>
              <Button variant="outline" size="sm" onClick={() => quickSetPrice(0.2)}>-20%</Button>
              <Button variant="outline" size="sm" onClick={() => quickSetPrice(0.3)}>-30%</Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium">Notification Preferences</label>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="notify-email" 
                checked={notifyEmail} 
                onCheckedChange={setNotifyEmail}
              />
              <label htmlFor="notify-email" className="text-sm cursor-pointer">
                Email notification
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="notify-app" 
                checked={notifyApp} 
                onCheckedChange={setNotifyApp}
              />
              <label htmlFor="notify-app" className="text-sm cursor-pointer">
                In-app notification
              </label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateAlert}
            disabled={loading || targetPrice >= currentPrice}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Setting...' : hasAlert ? 'Update Alert' : 'Set Alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertButton;
