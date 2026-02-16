import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Star, Search, MapPin, Clock, Calendar } from 'lucide-react';

const ServicesPage = () => {
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    locationType: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category_id', filters.category);
        if (filters.locationType) params.append('location_type', filters.locationType);
        params.append('limit', '50');

        const response = await api.get(`/services?${params.toString()}`);
        setServices(response.data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [filters]);

  const getPriceLabel = (service) => {
    switch (service.price_type) {
      case 'hourly':
        return `$${service.price}/hr`;
      case 'starting_from':
        return `From $${service.price}`;
      default:
        return `$${service.price}`;
    }
  };

  const getLocationLabel = (type) => {
    switch (type) {
      case 'remote':
        return 'Remote Only';
      case 'onsite':
        return 'On-site Only';
      default:
        return 'Remote & On-site';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
        <p className="text-gray-600">Book professional services from African experts</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters */}
        <aside className="lg:w-64 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search services..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

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

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Location Type</label>
                <Select
                  value={filters.locationType || "all"}
                  onValueChange={(value) => setFilters({ ...filters, locationType: value === "all" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ search: '', category: '', locationType: '' })}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Services Grid */}
        <div className="flex-1">
          <div className="mb-6">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${services.length} services found`}
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4 w-3/4" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500 text-lg">No services found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <Link key={service.id} to={`/services/${service.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`service-card-${service.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg hover:text-amber-600 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-sm text-amber-600">{service.vendor_name}</p>
                        </div>
                        <span className="text-xl font-bold text-amber-600">{getPriceLabel(service)}</span>
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{service.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{getLocationLabel(service.location_type)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>{service.average_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>

                      <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
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

export default ServicesPage;
