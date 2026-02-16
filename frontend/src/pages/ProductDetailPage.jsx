import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Star, ShoppingCart, Minus, Plus, MapPin, Truck, Shield, MessageSquare } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews?product_id=${id}`),
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data);

        // Fetch related products
        if (productRes.data.category_id) {
          const relatedRes = await api.get(`/products?category_id=${productRes.data.category_id}&limit=4`);
          setRelatedProducts(relatedRes.data.filter(p => p.id !== id));
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product.id, quantity);
      navigate('/cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-amber-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-amber-600">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.images?.[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    selectedImage === index ? 'border-amber-600' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            {product.vendor && (
              <Link to={`/vendors/${product.vendor.id}`} className="text-amber-600 hover:underline text-sm font-medium">
                {product.vendor.store_name}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mt-1" data-testid="product-name">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(product.average_rating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              {product.average_rating?.toFixed(1) || '0.0'} ({product.review_count || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-amber-600" data-testid="product-price">${product.price}</span>
            {product.compare_price && product.compare_price > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through">${product.compare_price}</span>
                <Badge className="bg-red-500">
                  Save {Math.round((1 - product.price / product.compare_price) * 100)}%
                </Badge>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Stock */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                In Stock ({product.stock} available)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-gray-700 font-medium">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 h-12"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border-amber-600 text-amber-600 hover:bg-amber-50"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              data-testid="buy-now-btn"
            >
              Buy Now
            </Button>
          </div>

          {/* Features */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Truck className="h-5 w-5 text-amber-600" />
              <span>Free shipping on orders over $100</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Shield className="h-5 w-5 text-amber-600" />
              <span>Secure payment with buyer protection</span>
            </div>
            {product.vendor && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="h-5 w-5 text-amber-600" />
                <span>Ships from {product.vendor.city}, {product.vendor.country}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent">
            Description
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent">
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="vendor" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent">
            Vendor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="pt-6">
          <div className="prose max-w-none">
            <p className="text-gray-600">{product.description}</p>
            {product.tags?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="pt-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{review.user_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="vendor" className="pt-6">
          {product.vendor && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {product.vendor.logo_url ? (
                      <img src={product.vendor.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-amber-600">{product.vendor.store_name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{product.vendor.store_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{product.vendor.city}, {product.vendor.country}</span>
                    </div>
                    <p className="text-gray-600 mt-3">{product.vendor.description}</p>
                    <div className="flex gap-3 mt-4">
                      <Link to={`/vendors/${product.vendor.id}`}>
                        <Button variant="outline">Visit Store</Button>
                      </Link>
                      {isAuthenticated && (
                        <Button variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((product) => (
              <Link key={product.id} to={`/products/${product.id}`}>
                <Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-amber-600">{product.name}</h3>
                    <p className="text-lg font-bold text-amber-600 mt-2">${product.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
