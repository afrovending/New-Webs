import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Check, Star, Zap, Crown, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const VendorSubscription = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState(null);

  const planIcons = {
    starter: Star,
    growth: Zap,
    pro: Crown
  };

  const planColors = {
    starter: 'bg-gray-100 text-gray-600',
    growth: 'bg-yellow-100 text-yellow-700',
    pro: 'bg-purple-100 text-purple-700'
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');

    if (sessionId && success) {
      pollSubscriptionStatus(sessionId);
    } else {
      fetchSubscription();
    }
  }, [searchParams]);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscription(response.data);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const pollSubscriptionStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      setMessage({ type: 'error', text: 'Could not verify payment. Please refresh the page.' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/subscription/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        setMessage({ type: 'success', text: `Your ${response.data.plan_id} subscription is now active!` });
        window.history.replaceState({}, '', '/vendor/subscription');
        fetchSubscription();
      } else {
        setTimeout(() => pollSubscriptionStatus(sessionId, attempts + 1), 2000);
      }
    } catch (err) {
      setTimeout(() => pollSubscriptionStatus(sessionId, attempts + 1), 2000);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will be downgraded to the Starter plan.')) {
      return;
    }

    setCancelling(true);
    try {
      await axios.post(`${API_URL}/api/subscription/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Subscription cancelled. You have been downgraded to Starter.' });
      fetchSubscription();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to cancel subscription.' });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  const planId = subscription?.plan_id || 'starter';
  const plan = subscription?.plan || {};
  const IconComponent = planIcons[planId] || Star;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600">Manage your vendor subscription plan</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${planColors[planId]}`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{plan.name || 'Starter'} Plan</CardTitle>
                <CardDescription>
                  {subscription?.is_free ? 'Free plan' : `$${plan.price}/month`}
                </CardDescription>
              </div>
            </div>
            <Badge variant={planId === 'starter' ? 'secondary' : 'default'} className={
              planId === 'growth' ? 'bg-yellow-500' : planId === 'pro' ? 'bg-purple-500' : ''
            }>
              {subscription?.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Plan Features */}
            <div>
              <h3 className="font-semibold mb-3">Plan Features</h3>
              <ul className="space-y-2">
                {(plan.features || []).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Details */}
            <div>
              <h3 className="font-semibold mb-3">Plan Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Commission Rate</span>
                  <span className="font-medium">{plan.commission_rate || 20}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Product Limit</span>
                  <span className="font-medium">
                    {plan.max_products === -1 ? 'Unlimited' : plan.max_products || 5}
                  </span>
                </div>
                {subscription?.current_period_start && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Billing Started</span>
                    <span className="font-medium">
                      {new Date(subscription.current_period_start).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Link to="/pricing">
              <Button variant={planId === 'pro' ? 'outline' : 'default'} className={
                planId !== 'pro' ? 'bg-red-600 hover:bg-red-700' : ''
              }>
                {planId === 'pro' ? 'View Plans' : 'Upgrade Plan'}
              </Button>
            </Link>
            {planId !== 'starter' && !subscription?.is_free && (
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={cancelling}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {cancelling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...</> : 'Cancel Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Benefits */}
      {planId === 'starter' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Upgrade to Growth</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get lower commission rates (15%), verified seller badge, and list up to 50 products for just $25/month.
                </p>
                <Link to="/pricing">
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                    View Upgrade Options
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorSubscription;
