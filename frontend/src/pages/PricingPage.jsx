import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Check, Star, Zap, Crown, Building2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const PricingPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [message, setMessage] = useState(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$0',
      priceValue: 0,
      period: 'month',
      description: 'Perfect for new vendors getting started',
      icon: Star,
      features: [
        'Vendor profile on AfroVending',
        'Up to 5 products',
        'Standard category placement',
        'Search visibility',
        'Email support',
        '20% commission on each sale'
      ],
      buttonText: 'Start Free',
      popular: false,
      color: 'gray'
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '$25',
      priceValue: 25,
      period: 'month',
      description: 'Built for growing African brands',
      icon: Zap,
      features: [
        'Up to 50 products',
        '15% commission on each sale',
        'Boosted category visibility',
        'Basic sales & traffic analytics',
        'Priority email support',
        'Verified Seller badge'
      ],
      buttonText: 'Get Started',
      popular: true,
      color: 'red'
    },
    {
      id: 'pro',
      name: 'Pro Vendor',
      price: '$50',
      priceValue: 50,
      period: 'month',
      description: 'For serious sellers & top-performing brands',
      icon: Crown,
      features: [
        'Unlimited products',
        '10% commission on each sale',
        'Featured category placement',
        'Homepage promotion eligibility',
        'Advanced analytics (views, clicks, conversions)',
        'Priority chat support',
        'Early access to promotions'
      ],
      buttonText: 'Go Pro',
      popular: false,
      color: 'gray'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      priceValue: null,
      period: 'pricing',
      description: 'For distributors, collectives & exporters',
      icon: Building2,
      features: [
        'Dedicated account manager',
        'Custom storefront page',
        'Bulk uploads & integrations',
        'Wholesale & B2B visibility',
        'Marketing collaborations',
        'Custom commission rates'
      ],
      buttonText: 'Contact Us',
      popular: false,
      color: 'gray'
    }
  ];

  // Check for success/cancelled from URL params
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (cancelled) {
      setMessage({ type: 'error', text: 'Subscription cancelled. You can try again anytime.' });
    }

    if (sessionId && success) {
      // Poll for subscription status
      pollSubscriptionStatus(sessionId);
    }
  }, [searchParams]);

  // Fetch current subscription if logged in as vendor
  useEffect(() => {
    if (user && user.role === 'vendor' && token) {
      fetchCurrentPlan();
    }
  }, [user, token]);

  const fetchCurrentPlan = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentPlan(response.data.plan_id);
    } catch (err) {
      console.log('No current subscription');
    }
  };

  const pollSubscriptionStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      setMessage({ type: 'error', text: 'Could not verify payment. Please check your email for confirmation.' });
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/subscription/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        setMessage({ type: 'success', text: `Success! Your ${response.data.plan_id} plan is now active.` });
        setCurrentPlan(response.data.plan_id);
        // Clear URL params
        window.history.replaceState({}, '', '/pricing');
      } else {
        // Continue polling
        setTimeout(() => pollSubscriptionStatus(sessionId, attempts + 1), 2000);
      }
    } catch (err) {
      setTimeout(() => pollSubscriptionStatus(sessionId, attempts + 1), 2000);
    }
  };

  const handleSubscribe = async (planId) => {
    // Enterprise plan - redirect to contact
    if (planId === 'enterprise') {
      window.location.href = 'mailto:enterprise@afrovending.com?subject=Enterprise Plan Inquiry';
      return;
    }

    // Must be logged in as vendor
    if (!user) {
      navigate(`/register?role=vendor&plan=${planId}`);
      return;
    }

    if (user.role !== 'vendor') {
      setMessage({ type: 'error', text: 'You need a vendor account to subscribe. Please register as a vendor.' });
      return;
    }

    // Already on this plan
    if (currentPlan === planId) {
      setMessage({ type: 'info', text: 'You are already on this plan.' });
      return;
    }

    setLoading(planId);
    setMessage(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/subscription/checkout`,
        {
          plan_id: planId,
          origin_url: window.location.origin
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else if (response.data.status === 'activated') {
        // Plan activated directly (free plan or test mode)
        setMessage({ 
          type: 'success', 
          text: response.data.message || `${planId} plan activated successfully!`
        });
        setCurrentPlan(planId);
        if (response.data.test_mode) {
          setMessage({ 
            type: 'success', 
            text: `${response.data.message} (Demo mode - no payment required)`
          });
        }
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to start subscription. Please try again.' 
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24 text-center px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Sell African Products.<br />
            <span className="text-red-600">Grow Without Limits.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AfroVending helps African-owned brands reach more customers, increase sales, 
            and scale globally — without upfront risk.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Start free
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Upgrade anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              No hidden fees
            </span>
          </div>
        </div>
      </section>

      {/* Message Banner */}
      {message && (
        <div className={`max-w-4xl mx-auto px-4 mb-8`}>
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : 
             message.type === 'error' ? <XCircle className="h-5 w-5" /> : null}
            {message.text}
          </div>
        </div>
      )}

      {/* Current Plan Banner */}
      {currentPlan && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <span className="text-gray-600">Your current plan: </span>
            <span className="font-semibold text-gray-900 capitalize">{currentPlan}</span>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Choose the Right Plan for Your Business
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
            Start free. Upgrade only when you're ready to grow. No hidden fees.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isCurrentPlan = currentPlan === plan.id;
              const isLoading = loading === plan.id;
              
              return (
                <Card 
                  key={plan.name} 
                  className={`relative overflow-hidden ${
                    plan.popular 
                      ? 'border-2 border-red-500 shadow-xl scale-105' 
                      : isCurrentPlan
                      ? 'border-2 border-green-500'
                      : 'border border-gray-200 hover:border-gray-300'
                  } transition-all`}
                  data-testid={`pricing-card-${plan.id}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                      Current Plan
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      plan.popular ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${plan.popular ? 'text-red-600' : 'text-gray-600'}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.period !== 'pricing' && (
                        <span className="text-gray-500 ml-1">/ {plan.period}</span>
                      )}
                    </div>
                    <ul className="space-y-3 mb-8 text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            plan.popular ? 'text-red-500' : 'text-green-500'
                          }`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${
                        isCurrentPlan
                          ? 'bg-green-600 hover:bg-green-700'
                          : plan.popular 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading || isCurrentPlan}
                      data-testid={`pricing-cta-${plan.id}`}
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lower Fees Section */}
      <section className="py-16 px-4 bg-gray-900 text-white mt-16">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lower Fees as You Grow
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            AfroVending is built to reward growth. As your business scales, your platform fees decrease. 
            No long-term contracts. Cancel or upgrade anytime.
          </p>
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-4xl font-bold text-red-400 mb-2">20%</div>
              <div className="text-gray-400 text-sm">Starter</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-400 mb-2">15%</div>
              <div className="text-gray-400 text-sm">Growth</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-400 mb-2">10%</div>
              <div className="text-gray-400 text-sm">Pro Vendor</div>
            </div>
          </div>
          {!user && (
            <Link to="/register?role=vendor">
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                Start Selling Today
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* FAQ or Additional Info */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Grow Your African Business?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Join hundreds of African vendors already selling on AfroVending. 
            Start free today and upgrade when you're ready.
          </p>
          {!user ? (
            <Link to="/register?role=vendor">
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                Create Your Vendor Account
              </Button>
            </Link>
          ) : user.role === 'vendor' && currentPlan !== 'pro' ? (
            <Button 
              size="lg" 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleSubscribe('pro')}
            >
              Upgrade to Pro
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
