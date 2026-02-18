import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Heart, ShoppingCart, Trash2, Star, BadgeCheck, 
  Package, ArrowRight, HeartOff 
} from 'lucide-react';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { api, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/wishlist');
      setWishlist(response.data.items || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId) => {
    setActionLoading(itemId);
    try {
      await api.delete(`/wishlist/remove/${itemId}`);
      setWishlist(prev => prev.filter(item => item.id !== itemId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setActionLoading(null);
    }
  };

  const moveToCart = async (itemId) => {
    setActionLoading(itemId);
    try {
      await api.post(`/wishlist/move-to-cart/${itemId}`);
      setWishlist(prev => prev.filter(item => item.id !== itemId));
      toast.success('Moved to cart!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to move to cart');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your Wishlist</h1>
          <p className="text-gray-600 mb-6">Sign in to save items to your wishlist</p>
          <Button onClick={() => navigate('/login')} className="bg-red-600 hover:bg-red-700">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-72 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="wishlist-title">
            <Heart className="h-6 w-6 text-red-600" />
            Your Wishlist
          </h1>
          <p className="text-gray-600">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        </div>
        {wishlist.length > 0 && (
          <Link to="/products">
            <Button variant="outline">
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      {wishlist.length === 0 ? (
        <Card className="p-12 text-center">
          <HeartOff className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">
            Start adding items you love by clicking the heart icon on products
          </p>
          <Link to="/products">
            <Button className="bg-red-600 hover:bg-red-700">
              <Package className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const product = item.product;
            const service = item.service;
            const vendor = item.vendor;
            const itemData = product || service;

            if (!itemData) return null;

            return (
              <Card key={item.id} className="overflow-hidden group" data-testid={`wishlist-item-${item.id}`}>
                <Link to={product ? `/products/${product.id}` : `/services/${service.id}`}>
                  <div className="relative h-48 bg-gray-100">
                    {itemData.images?.[0] ? (
                      <img
                        src={itemData.images[0]}
                        alt={itemData.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {product?.stock === 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-500">Out of Stock</Badge>
                    )}
                  </div>
                </Link>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link to={product ? `/products/${product.id}` : `/services/${service.id}`}>
                      <h3 className="font-semibold line-clamp-2 hover:text-red-600 transition-colors">
                        {itemData.name}
                      </h3>
                    </Link>
                    {vendor?.is_verified && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  {vendor && (
                    <p className="text-sm text-gray-500 mb-2">{vendor.store_name}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    {itemData.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm">{itemData.average_rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-red-600">
                      {formatPrice(itemData.price)}
                    </span>
                    {itemData.compare_price && itemData.compare_price > itemData.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(itemData.compare_price)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {product && (
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        disabled={product.stock === 0 || actionLoading === item.id}
                        onClick={() => moveToCart(item.id)}
                        data-testid={`move-to-cart-${item.id}`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {actionLoading === item.id ? 'Moving...' : 'Add to Cart'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={actionLoading === item.id}
                      className="text-gray-500 hover:text-red-600 hover:border-red-600"
                      data-testid={`remove-wishlist-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
