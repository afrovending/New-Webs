import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ReviewsList, ReviewForm } from '../components/Reviews';
import { toast } from 'sonner';
import { 
  Star, 
  ShoppingCart, 
  Minus, 
  Plus, 
  MapPin, 
  Truck, 
  Shield, 
  MessageSquare,
  Heart,
  ChevronRight,
  BadgeCheck,
  Sparkles
} from 'lucide-react';

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
  const [crossSellProducts, setCrossSellProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews?product_id=${id}`),
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data);

        // Fetch related products from same category
        if (productRes.data.category_id) {
          const relatedRes = await api.get(`/products?category_id=${productRes.data.category_id}&limit=8`);
          setRelatedProducts(relatedRes.data.filter(p => p.id !== id).slice(0, 4));
        }

        // Fetch cross-sell products from other categories (for variety)
        const allProductsRes = await api.get('/products?limit=12');
        const otherCategoryProducts = allProductsRes.data.filter(
          p => p.id !== id && p.category_id !== productRes.data.category_id
        );
        setCrossSellProducts(otherCategoryProducts.slice(0, 4));
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
        <Link to="/" className="hover:text-red-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-red-600">Products</Link>
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
                    selectedImage === index ? 'border-red-600' : 'border-transparent'
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
              <Link to={`/vendors/${product.vendor.id}`} className="text-red-600 hover:underline text-sm font-medium">
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
            <span className="text-3xl font-bold text-red-600" data-testid="product-price">${product.price}</span>
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
              className="flex-1 bg-red-600 hover:bg-red-700 h-12"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border-red-600 text-red-600 hover:bg-amber-50"
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
              <Truck className="h-5 w-5 text-red-600" />
              <span>Free shipping on orders over $100</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Secure payment with buyer protection</span>
            </div>
            {product.vendor && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="h-5 w-5 text-red-600" />
                <span>Ships from {product.vendor.city}, {product.vendor.country}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent">
            Description
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent">
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="vendor" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent">
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
                      <span className="text-2xl font-bold text-red-600">{product.vendor.store_name?.[0]}</span>
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

      {/* Related Products - Same Category */}
      {relatedProducts.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">More African Treasures Like This</h2>
              <p className="text-gray-600 mt-1">Handpicked products from the same collection</p>
            </div>
            <Link to="/products" className="text-red-600 hover:text-red-700 font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct.id} to={`/products/${relatedProduct.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 shadow-md" data-testid={`related-product-${relatedProduct.id}`}>
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {relatedProduct.images?.[0] ? (
                      <img 
                        src={relatedProduct.images[0]} 
                        alt={relatedProduct.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    {relatedProduct.compare_price && relatedProduct.compare_price > relatedProduct.price && (
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        {Math.round((1 - relatedProduct.price / relatedProduct.compare_price) * 100)}% OFF
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Button 
                      size="sm" 
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-white text-gray-900 hover:bg-red-600 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(relatedProduct, 1);
                        toast.success(`${relatedProduct.name} added to cart!`);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-red-600 font-medium mb-1">AfroVending Official</p>
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">{relatedProduct.name}</h3>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">{relatedProduct.average_rating || 4.5}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-bold text-red-600">${relatedProduct.price}</span>
                      {relatedProduct.compare_price && relatedProduct.compare_price > relatedProduct.price && (
                        <span className="text-sm text-gray-400 line-through">${relatedProduct.compare_price}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cross-sell - Complete Your Collection */}
      {crossSellProducts.length > 0 && (
        <section className="mb-16 bg-gradient-to-br from-amber-50 to-orange-50 -mx-4 px-4 py-12 md:-mx-8 md:px-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <span className="text-amber-700 font-semibold text-sm uppercase tracking-wide">Complete Your Collection</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">You May Also Love</h2>
              <p className="text-gray-600 mt-1">Discover more authentic African treasures</p>
            </div>
            <Link to="/products" className="text-red-600 hover:text-red-700 font-medium flex items-center">
              Explore All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {crossSellProducts.map((crossProduct) => (
              <Link key={crossProduct.id} to={`/products/${crossProduct.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white" data-testid={`crosssell-product-${crossProduct.id}`}>
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {crossProduct.images?.[0] ? (
                      <img 
                        src={crossProduct.images[0]} 
                        alt={crossProduct.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    {crossProduct.compare_price && crossProduct.compare_price > crossProduct.price && (
                      <Badge className="absolute top-2 left-2 bg-amber-500">
                        Save ${(crossProduct.compare_price - crossProduct.price).toFixed(0)}
                      </Badge>
                    )}
                    <button 
                      className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => {
                        e.preventDefault();
                        toast.success('Added to wishlist!');
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      <BadgeCheck className="h-3 w-3 text-blue-500" />
                      <p className="text-xs text-gray-500">Verified Vendor</p>
                    </div>
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">{crossProduct.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(crossProduct.average_rating || 4.5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({crossProduct.review_count || 0})</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-gray-900">${crossProduct.price}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 px-3 text-xs hover:bg-red-600 hover:text-white hover:border-red-600"
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(crossProduct, 1);
                          toast.success(`${crossProduct.name} added to cart!`);
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* African Heritage Banner */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white mb-8">
        <div className="max-w-2xl">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            Every Purchase Supports African Artisans
          </h3>
          <p className="text-gray-300 mb-6">
            When you shop at AfroVending, you're not just buying products — you're supporting families, 
            preserving traditions, and empowering communities across Africa.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/vendors">
              <Button className="bg-red-600 hover:bg-red-700">
                Meet Our Artisans
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
