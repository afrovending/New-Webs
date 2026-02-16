import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, removeFromCart, addToCart, loading } = useCart();

  const handleUpdateQuantity = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } else {
      await addToCart(productId, delta);
    }
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
    toast.success('Item removed from cart');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-6 h-24 bg-gray-100" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven't added any products yet</p>
        <Link to="/products">
          <Button className="bg-red-600 hover:bg-red-700">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8" data-testid="cart-title">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <Card key={item.product_id} data-testid={`cart-item-${item.product_id}`}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product_id}`} className="font-medium text-gray-900 hover:text-red-600 line-clamp-1">
                    {item.product?.name || 'Product'}
                  </Link>
                  <p className="text-sm text-gray-500">{item.product?.vendor_name}</p>
                  <p className="text-lg font-bold text-red-600 mt-1">${item.product?.price || 0}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(item.product_id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center border rounded-lg">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(item.product_id, item.quantity, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(item.product_id, item.quantity, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cart.items.length} items)</span>
                  <span className="font-medium">${cart.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-red-600" data-testid="cart-total">${cart.total?.toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleCheckout} data-testid="checkout-btn">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Link to="/products" className="block text-center text-sm text-red-600 hover:underline">
                Continue Shopping
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
