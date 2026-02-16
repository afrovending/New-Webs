import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Loader2, CreditCard, Lock } from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_country: 'Nigeria',
  });

  const countries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia', 'Tanzania', 'Uganda', 'Morocco', 'Egypt', 'Senegal'];

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
        <Button onClick={() => navigate('/products')} className="bg-amber-600 hover:bg-amber-700">
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
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter your shipping address"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    required
                    data-testid="shipping-address-input"
                  />
                </div>
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
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={formData.shipping_country}
                      onValueChange={(value) => setFormData({ ...formData, shipping_country: value })}
                    >
                      <SelectTrigger data-testid="shipping-country-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Lock className="h-4 w-4" />
                    <span>Secure payment powered by Stripe</span>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 h-12"
                    disabled={loading}
                    data-testid="place-order-btn"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Processing...' : `Pay $${cart.total?.toFixed(2)}`}
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
                    <p className="text-sm font-medium text-amber-600">${item.item_total?.toFixed(2)}</p>
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
                  <span className="text-amber-600">${cart.total?.toFixed(2)}</span>
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
