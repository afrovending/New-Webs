import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Search, SlidersHorizontal, X, Star, BadgeCheck } from 'lucide-react';

const AdvancedSearch = ({ onSearch, categories = [], type = 'products' }) => {
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    category_id: '',
    min_price: 0,
    max_price: 1000,
    min_rating: 0,
    in_stock: false,
    verified_vendor: false,
    sort_by: 'relevance',
  });
  const [activeFilters, setActiveFilters] = useState([]);

  const handleSearch = () => {
    const searchFilters = { ...filters };
    
    // Only include non-default values
    if (!searchFilters.query) delete searchFilters.query;
    if (!searchFilters.category_id) delete searchFilters.category_id;
    if (searchFilters.min_price === 0) delete searchFilters.min_price;
    if (searchFilters.max_price === 1000) delete searchFilters.max_price;
    if (searchFilters.min_rating === 0) delete searchFilters.min_rating;
    if (!searchFilters.in_stock) delete searchFilters.in_stock;
    if (!searchFilters.verified_vendor) delete searchFilters.verified_vendor;
    if (searchFilters.sort_by === 'relevance') delete searchFilters.sort_by;
    
    // Track active filters for display
    const active = [];
    if (filters.query) active.push({ key: 'query', label: `"${filters.query}"` });
    if (filters.category_id) {
      const cat = categories.find(c => c.id === filters.category_id);
      if (cat) active.push({ key: 'category_id', label: cat.name });
    }
    if (filters.min_price > 0 || filters.max_price < 1000) {
      active.push({ key: 'price', label: `${formatPrice(filters.min_price)} - ${formatPrice(filters.max_price)}` });
    }
    if (filters.min_rating > 0) active.push({ key: 'min_rating', label: `${filters.min_rating}+ stars` });
    if (filters.in_stock) active.push({ key: 'in_stock', label: 'In Stock' });
    if (filters.verified_vendor) active.push({ key: 'verified_vendor', label: 'Verified Vendor' });
    
    setActiveFilters(active);
    
    if (onSearch) {
      onSearch(searchFilters);
    }
  };

  const clearFilter = (key) => {
    const newFilters = { ...filters };
    
    switch (key) {
      case 'query':
        newFilters.query = '';
        break;
      case 'category_id':
        newFilters.category_id = '';
        break;
      case 'price':
        newFilters.min_price = 0;
        newFilters.max_price = 1000;
        break;
      case 'min_rating':
        newFilters.min_rating = 0;
        break;
      case 'in_stock':
        newFilters.in_stock = false;
        break;
      case 'verified_vendor':
        newFilters.verified_vendor = false;
        break;
    }
    
    setFilters(newFilters);
    setActiveFilters(prev => prev.filter(f => f.key !== key));
    
    // Re-trigger search
    setTimeout(() => handleSearch(), 0);
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      category_id: '',
      min_price: 0,
      max_price: 1000,
      min_rating: 0,
      in_stock: false,
      verified_vendor: false,
      sort_by: 'relevance',
    });
    setActiveFilters([]);
    if (onSearch) onSearch({});
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${type}...`}
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(!isOpen)}
          className={isOpen ? 'bg-gray-100' : ''}
          data-testid="filters-toggle"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button onClick={handleSearch} className="bg-red-600 hover:bg-red-700" data-testid="search-btn">
          Search
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
              {filter.label}
              <button onClick={() => clearFilter(filter.key)} className="ml-1 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-600">
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      {isOpen && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select 
                  value={filters.category_id} 
                  onValueChange={(v) => setFilters({ ...filters, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range: {formatPrice(filters.min_price)} - {formatPrice(filters.max_price)}
                </label>
                <div className="px-2">
                  <Slider
                    value={[filters.min_price, filters.max_price]}
                    onValueChange={([min, max]) => setFilters({ ...filters, min_price: min, max_price: max })}
                    min={0}
                    max={1000}
                    step={10}
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                <Select 
                  value={filters.min_rating.toString()} 
                  onValueChange={(v) => setFilters({ ...filters, min_rating: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="4">
                      <span className="flex items-center gap-1">
                        4+ <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </span>
                    </SelectItem>
                    <SelectItem value="3">
                      <span className="flex items-center gap-1">
                        3+ <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </span>
                    </SelectItem>
                    <SelectItem value="2">
                      <span className="flex items-center gap-1">
                        2+ <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select 
                  value={filters.sort_by} 
                  onValueChange={(v) => setFilters({ ...filters, sort_by: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkbox Filters */}
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="in_stock"
                  checked={filters.in_stock}
                  onCheckedChange={(checked) => setFilters({ ...filters, in_stock: checked })}
                />
                <label htmlFor="in_stock" className="text-sm cursor-pointer">In Stock Only</label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="verified_vendor"
                  checked={filters.verified_vendor}
                  onCheckedChange={(checked) => setFilters({ ...filters, verified_vendor: checked })}
                />
                <label htmlFor="verified_vendor" className="text-sm cursor-pointer flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                  Verified Vendors Only
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;
