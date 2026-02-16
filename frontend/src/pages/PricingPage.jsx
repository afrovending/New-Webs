import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Check, Star, Zap, Crown, Building2 } from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$0',
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
      name: 'Growth',
      price: '$25',
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
      name: 'Pro Vendor',
      price: '$50',
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
      name: 'Enterprise',
      price: 'Custom',
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
              return (
                <Card 
                  key={plan.name} 
                  className={`relative overflow-hidden ${
                    plan.popular 
                      ? 'border-2 border-red-500 shadow-xl scale-105' 
                      : 'border border-gray-200 hover:border-gray-300'
                  } transition-all`}
                  data-testid={`pricing-card-${plan.name.toLowerCase()}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      Most Popular
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
                    <Link to="/register?role=vendor">
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                        data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
                      >
                        {plan.buttonText}
                      </Button>
                    </Link>
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
          <Link to="/register?role=vendor">
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              Start Selling Today
            </Button>
          </Link>
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
          <Link to="/register?role=vendor">
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              Create Your Vendor Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
