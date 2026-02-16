import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  ArrowRight,
  Star,
  Truck,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  BadgeCheck,
  Users,
  Calendar,
  Quote,
} from 'lucide-react';

const HomePage = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState({ total_vendors: 0, total_products: 0, countries_served: 0 });
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [spotlightVendor, setSpotlightVendor] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, productsRes, vendorsRes, productCatsRes, serviceCatsRes] = await Promise.all([
          api.get('/stats/platform'),
          api.get('/products?limit=8'),
          api.get('/vendors?limit=6'),
          api.get('/categories?type=product'),
          api.get('/categories?type=service'),
        ]);
        setStats(statsRes.data);
        setFeaturedProducts(productsRes.data);
        setFeaturedVendors(vendorsRes.data);
        setProductCategories(productCatsRes.data);
        setServiceCategories(serviceCatsRes.data.filter(c => c.name !== 'Services'));
        
        // Find vendor with story for spotlight
        const vendorWithStory = vendorsRes.data.find(v => v.story);
        if (vendorWithStory) {
          setSpotlightVendor(vendorWithStory);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryIcons = {
    // Product categories
    Fashion: '👗',
    'Art & Crafts': '🎨',
    'Food & Groceries': '🍲',
    Jewelry: '💎',
    'Home Decor': '🏠',
    Beauty: '✨',
    // Service categories
    'Event and Decor': '🎉',
    'Fashion Designing': '✂️',
    'Catering Services': '🍽️',
    'Barbing Services': '💈',
    'Beauty and Facials': '💆',
    'Braiding Services': '💇',
    'Professional Services': '💼',
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-800 to-red-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
              Discover Authentic African Treasures
            </h1>
            <p className="text-xl md:text-2xl text-amber-100 mb-8">
              Connect with artisans and vendors across Africa. Shop unique products and book services from the comfort of your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-white text-red-800 hover:bg-amber-100 font-semibold" data-testid="shop-now-btn">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" data-testid="browse-services-btn">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-red-600">{stats.total_vendors}+</p>
              <p className="text-gray-600 mt-1">Verified Vendors</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-red-600">{stats.total_products}+</p>
              <p className="text-gray-600 mt-1">Products</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-red-600">{stats.countries_served}+</p>
              <p className="text-gray-600 mt-1">African Countries</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-red-600">50K+</p>
              <p className="text-gray-600 mt-1">Happy Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-red-600 hover:text-red-700 font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {productCategories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <span className="text-4xl mb-3 block">{categoryIcons[category.name] || '📦'}</span>
                    <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                      {category.name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Browse Services</h2>
            <Link to="/services" className="text-red-600 hover:text-red-700 font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {serviceCategories.map((category) => (
              <Link
                key={category.id}
                to={`/services?category=${category.id}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white">
                  <CardContent className="p-6 text-center">
                    <span className="text-4xl mb-3 block">{categoryIcons[category.name] || '🛠️'}</span>
                    <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors text-sm">
                      {category.name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products" className="text-red-600 hover:text-red-700 font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden" data-testid={`product-card-${product.id}`}>
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      {product.compare_price && product.compare_price > product.price && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500 mb-1">{product.vendor_name}</p>
                      <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm text-gray-600">
                          {product.average_rating?.toFixed(1) || '0.0'} ({product.review_count || 0})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-lg font-bold text-red-600">${product.price}</span>
                        {product.compare_price && product.compare_price > product.price && (
                          <span className="text-sm text-gray-400 line-through">${product.compare_price}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose AfroVending?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600">Protected transactions with escrow for services</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Global Shipping</h3>
              <p className="text-gray-600">Worldwide delivery from African vendors</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Vendors</h3>
              <p className="text-gray-600">Quality assured by our verification process</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Always here to help you</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Vendors</h2>
            <Link to="/vendors" className="text-red-600 hover:text-red-700 font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredVendors.map((vendor) => (
              <Link key={vendor.id} to={`/vendors/${vendor.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`vendor-card-${vendor.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt={vendor.store_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-red-600">{vendor.store_name?.[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{vendor.store_name}</h3>
                          {vendor.is_verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" title="Verified Vendor" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{vendor.city}, {vendor.country}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm text-gray-600">
                            {vendor.average_rating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-sm text-gray-400">• {vendor.product_count} products</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-4 line-clamp-2">{vendor.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Join thousands of African vendors and reach customers worldwide. It's free to get started.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-red-800 hover:bg-amber-100 font-semibold">
              Become a Vendor Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
