import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Loader2, CreditCard, Lock, MapPin, Truck, Globe, CheckCircle } from 'lucide-react';
import GoogleAddressAutocomplete from '../components/GoogleAddressAutocomplete';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countriesByRegion, setCountriesByRegion] = useState({});
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [addressVerified, setAddressVerified] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [formData, setFormData] = useState({
    shipping_name: '',
    shipping_address: '',
    shipping_address2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: '',
    shipping_phone: '',
  });

  // Fetch countries and detect user location on mount
  useEffect(() => {
    fetchCountries();
    detectUserCountry();
  }, []);

  // Update shipping estimate when country changes
  useEffect(() => {
    if (formData.shipping_country) {
      estimateShipping();
    }
  }, [formData.shipping_country]);

  const fetchCountries = async () => {
    try {
      const response = await api.get('/shipping/countries');
      setCountries(response.data.countries || []);
      setCountriesByRegion(response.data.by_region || {});
    } catch (error) {
      console.error('Error fetching countries:', error);
      // Fallback countries
      setCountries([
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
        { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
      ]);
    }
  };

  const detectUserCountry = async () => {
    try {
      const response = await api.get('/shipping/detect-country');
      if (response.data.detected_country) {
        setFormData(prev => ({
          ...prev,
          shipping_country: response.data.detected_country.code
        }));
      }
    } catch (error) {
      console.error('Error detecting country:', error);
    }
  };

  const estimateShipping = async () => {
    if (!formData.shipping_country) return;
    
    setLoadingShipping(true);
    try {
      // Calculate approximate weight from cart (assume 0.5kg per item)
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const estimatedWeight = Math.max(0.5, totalItems * 0.5);
      
      const response = await api.post('/shipping/estimate', null, {
        params: {
          country_code: formData.shipping_country,
          weight_kg: estimatedWeight
        }
      });
      setShippingEstimate(response.data);
    } catch (error) {
      console.error('Error estimating shipping:', error);
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderResponse = await api.post('/orders', {
        items: cart.items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        ...formData,
      });

      const orderId = orderResponse.data.id;

      // Create checkout session
      const checkoutResponse = await api.post(`/checkout/order/${orderId}`, {
        origin_url: window.location.origin,
      });

      // Redirect to Stripe
      window.location.href = checkoutResponse.data.checkout_url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Checkout failed');
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Button onClick={() => navigate('/products')} className="bg-red-600 hover:bg-red-700">
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.shipping_name}
                    onChange={(e) => setFormData({ ...formData, shipping_name: e.target.value })}
                    required
                    data-testid="shipping-name-input"
                  />
                </div>
                
                {/* Address Line 1 */}
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    required
                    data-testid="shipping-address-input"
                  />
                </div>
                
                {/* Address Line 2 */}
                <div className="space-y-2">
                  <Label htmlFor="address2">Apartment, Suite, etc. (optional)</Label>
                  <Input
                    id="address2"
                    placeholder="Apt 4B"
                    value={formData.shipping_address2}
                    onChange={(e) => setFormData({ ...formData, shipping_address2: e.target.value })}
                  />
                </div>
                
                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.shipping_city}
                      onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                      required
                      data-testid="shipping-city-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={formData.shipping_state}
                      onChange={(e) => setFormData({ ...formData, shipping_state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                {/* ZIP and Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP / Postal Code</Label>
                    <Input
                      id="zip"
                      placeholder="12345"
                      value={formData.shipping_zip}
                      onChange={(e) => setFormData({ ...formData, shipping_zip: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={formData.shipping_country}
                      onValueChange={(value) => setFormData({ ...formData, shipping_country: value })}
                    >
                      <SelectTrigger data-testid="shipping-country-select">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Object.entries(countriesByRegion).map(([region, regionCountries]) => (
                          <div key={region}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                              {region}
                            </div>
                            {regionCountries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                <span className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.shipping_phone}
                    onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                    required
                  />
                </div>
                
                {/* Shipping Estimate */}
                {shippingEstimate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                      <Truck className="h-4 w-4" />
                      Estimated Shipping
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-blue-700">
                          {shippingEstimate.country?.flag} {shippingEstimate.country?.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Delivery: {shippingEstimate.delivery_days}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-800">
                        ${shippingEstimate.estimated_cost?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Lock className="h-4 w-4" />
                    <span>Secure payment powered by Stripe</span>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 h-12"
                    disabled={loading || !formData.shipping_country}
                    data-testid="place-order-btn"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Processing...' : `Pay $${(cart.total + (shippingEstimate?.estimated_cost || 0))?.toFixed(2)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.product_id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.product?.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-red-600">${item.item_total?.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${cart.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-red-600">${cart.total?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
