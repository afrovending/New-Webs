import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

const WishlistButton = ({ productId, className = '', size = 'icon' }) => {
  const { api, isAuthenticated } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && productId) {
      checkWishlist();
    }
  }, [isAuthenticated, productId]);

  const checkWishlist = async () => {
    try {
      const response = await api.get(`/wishlist/check/${productId}`);
      setIsInWishlist(response.data.in_wishlist);
      setWishlistItemId(response.data.item_id);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/remove-product/${productId}`);
        setIsInWishlist(false);
        setWishlistItemId(null);
        toast.success('Removed from wishlist');
      } else {
        const response = await api.post('/wishlist/add', { product_id: productId });
        setIsInWishlist(true);
        setWishlistItemId(response.data.item?.id);
        toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleWishlist}
      disabled={loading}
      className={`${className} ${isInWishlist ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
      data-testid={`wishlist-btn-${productId}`}
    >
      <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
    </Button>
  );
};

export default WishlistButton;
