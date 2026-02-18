import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCurrency } from '../contexts/CurrencyContext';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Store, DollarSign, Package, Quote, ArrowRight, BadgeCheck } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const VendorSuccess = () => {
  const { formatPrice } = useCurrency();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorSuccess();
  }, []);

  const fetchVendorSuccess = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/homepage/vendor-success`);
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendor success:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || vendors.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-amber-500 text-white mb-4">Success Stories</Badge>
          <h2 className="text-3xl font-bold mb-4">Vendors Earning Big on AfroVending</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join successful African entrepreneurs reaching customers worldwide
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {vendors.map((vendor) => (
            <Card key={vendor.vendor_id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{vendor.store_name?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {vendor.store_name}
                      <BadgeCheck className="h-5 w-5 text-blue-400" />
                    </h3>
                    <p className="text-gray-400 text-sm">{vendor.country}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 text-center p-3 bg-gray-900 rounded-lg">
                    <DollarSign className="h-5 w-5 mx-auto text-green-400 mb-1" />
                    <p className="text-xl font-bold text-green-400">${vendor.total_sales?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Sales</p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-gray-900 rounded-lg">
                    <Package className="h-5 w-5 mx-auto text-blue-400 mb-1" />
                    <p className="text-xl font-bold">{vendor.products}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                </div>
                
                <div className="relative">
                  <Quote className="absolute -top-2 -left-1 h-6 w-6 text-amber-500 opacity-50" />
                  <p className="text-gray-300 text-sm italic pl-6">
                    "{vendor.testimonial}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/pricing">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
              <Store className="h-5 w-5 mr-2" />
              Start Selling Today
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            No setup fees • Start with our free plan
          </p>
        </div>
      </div>
    </section>
  );
};

export default VendorSuccess;
