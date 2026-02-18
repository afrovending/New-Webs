import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import WishlistButton from '../components/WishlistButton';
import { toast } from 'sonner';
import { Search, Star, Filter, ShoppingCart, Grid, List, BadgeCheck } from 'lucide-react';

const ProductsPage = () => {
  const { api } = useAuth();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    country: searchParams.get('country') || '',
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'created_at',
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catResponse, countryResponse] = await Promise.all([
          api.get('/categories?type=product'),
          api.get('/countries'),
        ]);
        setCategories(catResponse.data);
        setCountries(countryResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category_id', filters.category);
        if (filters.country) params.append('country', filters.country);
        if (filters.minPrice > 0) params.append('min_price', filters.minPrice);
        if (filters.maxPrice < 1000) params.append('max_price', filters.maxPrice);
        params.append('sort_by', filters.sortBy);
        params.append('limit', '50');

        const response = await api.get(`/products?${params.toString()}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
        <p className="text-gray-600">Discover authentic African products from verified vendors</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <Select
                  value={filters.category || "all"}
                  onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Country</label>
                <Select
                  value={filters.country || "all"}
                  onValueChange={(value) => setFilters({ ...filters, country: value === "all" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Price Range: ${filters.minPrice} - ${filters.maxPrice}
                </label>
                <Slider
                  value={[filters.minPrice, filters.maxPrice]}
                  min={0}
                  max={1000}
                  step={10}
                  onValueChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                  className="mt-4"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Newest</SelectItem>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="average_rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  country: '',
                  minPrice: 0,
                  maxPrice: 1000,
                  sortBy: 'created_at',
                })}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${products.length} products found`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-6' : 'space-y-4'}>
              {[...Array(9)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters</p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow overflow-hidden h-full" data-testid={`product-card-${product.id}`}>
                  <Link to={`/products/${product.id}`}>
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
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1">
                        <p className="text-sm text-gray-500">{product.vendor_name}</p>
                        {product.vendor_verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-blue-500" title="Verified Vendor" />
                        )}
                      </div>
                      <WishlistButton productId={product.id} size="sm" />
                    </div>
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm text-gray-600">
                        {product.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-red-600">{formatPrice(product.price)}</span>
                        {product.compare_price && product.compare_price > product.price && (
                          <span className="text-sm text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-red-600 hover:bg-red-700"
                        onClick={(e) => handleAddToCart(e, product)}
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`product-card-${product.id}`}>
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{product.vendor_name}</p>
                        <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mt-1">{product.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-red-600">${product.price}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm text-gray-600">{product.average_rating?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                          <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={(e) => handleAddToCart(e, product)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
