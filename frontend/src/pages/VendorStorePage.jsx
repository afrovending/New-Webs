import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Star, MapPin, Package, Briefcase, MessageSquare, ShoppingCart, BadgeCheck } from 'lucide-react';

const VendorStorePage = () => {
  const { id } = useParams();
  const { api, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const [vendorRes, productsRes, servicesRes] = await Promise.all([
          api.get(`/vendors/${id}`),
          api.get(`/products?vendor_id=${id}`),
          api.get(`/services?vendor_id=${id}`),
        ]);
        setVendor(vendorRes.data);
        setProducts(productsRes.data);
        setServices(servicesRes.data);
      } catch (error) {
        console.error('Error fetching vendor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-8" />
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!vendor) return <div className="container mx-auto px-4 py-8">Vendor not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-red-600 to-red-800 rounded-lg overflow-hidden mb-8">
        {vendor.banner_url && (
          <img src={vendor.banner_url} alt="" className="w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 flex items-end p-6">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-red-600">{vendor.store_name?.[0]}</span>
              )}
            </div>
            <div className="text-white mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold" data-testid="vendor-name">{vendor.store_name}</h1>
                {vendor.is_verified && (
                  <BadgeCheck className="h-7 w-7 text-blue-400" title="Verified Vendor" />
                )}
              </div>
              <div className="flex items-center gap-2 text-amber-100">
                <MapPin className="h-4 w-4" />
                <span>{vendor.city}, {vendor.country}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
              <Star className="h-5 w-5 fill-amber-400" />
              <span className="text-2xl font-bold">{vendor.average_rating?.toFixed(1) || '0.0'}</span>
            </div>
            <p className="text-sm text-gray-500">Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">{vendor.product_count}</div>
            <p className="text-sm text-gray-500">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">{services.length}</div>
            <p className="text-sm text-gray-500">Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">${vendor.total_sales?.toFixed(0) || '0'}</div>
            <p className="text-sm text-gray-500">Total Sales</p>
          </CardContent>
        </Card>
      </div>

      {/* About & Contact */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-gray-600">{vendor.description}</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Contact</h2>
              {isAuthenticated ? (
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              ) : (
                <p className="text-gray-500 text-sm">
                  <Link to="/login" className="text-red-600 hover:underline">Login</Link> to contact this vendor
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Products & Services */}
      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Services ({services.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No products yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                      {product.compare_price && product.compare_price > product.price && (
                        <Badge className="absolute top-2 left-2 bg-red-500">Sale</Badge>
                      )}
                      <Button
                        size="icon"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm text-gray-600">{product.average_rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-lg font-bold text-red-600 mt-2">${product.price}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services">
          {services.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No services yet</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <Link key={service.id} to={`/services/${service.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg hover:text-red-600">{service.name}</h3>
                        <span className="text-xl font-bold text-red-600">${service.price}</span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{service.description}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm text-gray-600">{service.average_rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorStorePage;
