import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Star, Search, MapPin, Package, BadgeCheck } from 'lucide-react';

const VendorsPage = () => {
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (country) params.append('country', country);
        const response = await api.get(`/vendors?${params.toString()}`);
        setVendors(response.data);
        
        // Extract unique countries
        const uniqueCountries = [...new Set(response.data.map(v => v.country).filter(Boolean))];
        setCountries(uniqueCountries);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [country]);

  const filteredVendors = vendors.filter(v => 
    v.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Vendors</h1>
        <p className="text-gray-600">Discover authentic African vendors from across the continent</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">No vendors found</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Link key={vendor.id} to={`/vendors/${vendor.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`vendor-card-${vendor.id}`}>
                {vendor.banner_url && (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 -mt-8 border-4 border-white relative z-10">
                      {vendor.logo_url ? (
                        <img src={vendor.logo_url} alt={vendor.store_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-red-600">{vendor.store_name?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">{vendor.store_name}</h3>
                        {vendor.is_verified && (
                          <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0" title="Verified Vendor" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{vendor.city}, {vendor.country}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-4 line-clamp-2">{vendor.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{vendor.average_rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Package className="h-4 w-4" />
                      <span>{vendor.product_count} products</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorsPage;
