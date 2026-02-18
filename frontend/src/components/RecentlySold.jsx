import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCurrency } from '../contexts/CurrencyContext';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ShoppingBag, MapPin, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const RecentlySold = () => {
  const { formatPrice } = useCurrency();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentlySold();
    // Refresh every 2 minutes for dynamic feel
    const interval = setInterval(fetchRecentlySold, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentlySold = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/homepage/recently-sold`);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching recently sold:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShoppingBag className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold text-center">Recently Sold</h2>
          <Badge className="bg-green-500 text-white animate-pulse">Live</Badge>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
          {items.map((item, index) => (
            <Link 
              key={`${item.product_id}-${index}`}
              to={`/products/${item.product_id}`}
              className="flex-shrink-0"
            >
              <Card className="w-48 hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gray-100 rounded-t-lg overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                  <p className="text-red-600 font-bold text-sm mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <MapPin className="h-3 w-3" />
                    <span>Sold to {item.sold_to}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{item.time_ago}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Join thousands of customers shopping authentic African products
        </p>
      </div>
    </section>
  );
};

export default RecentlySold;
