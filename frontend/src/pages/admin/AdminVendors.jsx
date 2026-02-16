import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Store, CheckCircle, MapPin, BadgeCheck, XCircle } from 'lucide-react';

const AdminVendors = () => {
  const { api } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const [approved, pending] = await Promise.all([
        api.get('/vendors?is_approved=true'),
        api.get('/vendors?is_approved=false'),
      ]);
      setVendors([...pending.data, ...approved.data]);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const approveVendor = async (vendorId) => {
    try {
      await api.put(`/admin/vendors/${vendorId}/approve`);
      toast.success('Vendor approved');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to approve vendor');
    }
  };

  const toggleVerification = async (vendorId, isVerified) => {
    try {
      if (isVerified) {
        await api.put(`/admin/vendors/${vendorId}/unverify`);
        toast.success('Verification removed');
      } else {
        await api.put(`/admin/vendors/${vendorId}/verify`);
        toast.success('Vendor verified!');
      }
      fetchVendors();
    } catch (error) {
      toast.error('Failed to update verification');
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-gray-100" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Badge variant="outline">{vendors.length} total</Badge>
      </div>

      {vendors.length === 0 ? (
        <Card className="p-12 text-center">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No vendors yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {vendor.logo_url ? (
                        <img src={vendor.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-amber-600">{vendor.store_name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{vendor.store_name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{vendor.city}, {vendor.country}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{vendor.description}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {vendor.is_verified ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : vendor.is_approved && (
                      <Badge variant="outline" className="text-gray-500">Not Verified</Badge>
                    )}
                    {vendor.is_approved ? (
                      <div className="flex flex-col gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                        <Button 
                          size="sm" 
                          variant={vendor.is_verified ? "outline" : "default"}
                          onClick={() => toggleVerification(vendor.id, vendor.is_verified)}
                          className={vendor.is_verified ? "border-gray-300" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          {vendor.is_verified ? (
                            <><XCircle className="h-3 w-3 mr-1" />Remove Badge</>
                          ) : (
                            <><BadgeCheck className="h-3 w-3 mr-1" />Add Badge</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                        <Button size="sm" onClick={() => approveVendor(vendor.id)} className="bg-green-600 hover:bg-green-700 block w-full">
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-gray-500">
                  <span>Products: {vendor.product_count}</span>
                  <span>Sales: ${vendor.total_sales?.toFixed(2) || '0.00'}</span>
                  <span>Rating: {vendor.average_rating?.toFixed(1) || '0.0'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVendors;
