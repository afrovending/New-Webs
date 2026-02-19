import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Store, CheckCircle, MapPin, BadgeCheck, XCircle, 
  AlertTriangle, Search, Filter, Ban, RefreshCw,
  Mail, Package, DollarSign, Star, Trash2, Edit, Eye
} from 'lucide-react';

const AdminVendors = () => {
  const { api } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deactivateDialog, setDeactivateDialog] = useState({ open: false, vendor: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, vendor: null });
  const [deactivateReason, setDeactivateReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await api.get(`/admin/vendors?${params.toString()}`);
      // Handle both array and object response formats
      const vendorData = Array.isArray(response.data) ? response.data : response.data.vendors || [];
      setVendors(vendorData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Fallback to old method if new endpoint doesn't exist
      try {
        const [approved, pending] = await Promise.all([
          api.get('/vendors?is_approved=true'),
          api.get('/vendors?is_approved=false'),
        ]);
        setVendors([...pending.data, ...approved.data]);
      } catch (fallbackError) {
        toast.error('Failed to load vendors');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, [statusFilter]);

  const approveVendor = async (vendorId) => {
    setActionLoading(vendorId);
    try {
      await api.put(`/admin/vendors/${vendorId}/approve`);
      toast.success('Vendor approved successfully');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to approve vendor');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVerification = async (vendorId, isVerified) => {
    setActionLoading(vendorId);
    try {
      if (isVerified) {
        await api.put(`/admin/vendors/${vendorId}/unverify`);
        toast.success('Verification badge removed');
      } else {
        await api.put(`/admin/vendors/${vendorId}/verify`);
        toast.success('Vendor verified successfully!');
      }
      fetchVendors();
    } catch (error) {
      toast.error('Failed to update verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateDialog.vendor) return;
    
    setActionLoading(deactivateDialog.vendor.id);
    try {
      await api.put(`/admin/vendors/${deactivateDialog.vendor.id}/deactivate?reason=${encodeURIComponent(deactivateReason)}`);
      toast.success('Vendor deactivated successfully');
      setDeactivateDialog({ open: false, vendor: null });
      setDeactivateReason('');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to deactivate vendor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (vendorId) => {
    setActionLoading(vendorId);
    try {
      await api.put(`/admin/vendors/${vendorId}/activate`);
      toast.success('Vendor reactivated successfully');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to reactivate vendor');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      vendor.store_name?.toLowerCase().includes(search) ||
      vendor.email?.toLowerCase().includes(search) ||
      vendor.country?.toLowerCase().includes(search) ||
      vendor.city?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (vendor) => {
    if (vendor.is_active === false) {
      return <Badge className="bg-red-100 text-red-800"><Ban className="h-3 w-3 mr-1" />Deactivated</Badge>;
    }
    if (!vendor.is_approved) {
      return <Badge className="bg-amber-100 text-amber-800"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Vendor Management</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold" data-testid="vendor-management-title">Vendor Management</h1>
        <p className="text-amber-100 mt-1">Approve, verify, and manage vendor accounts</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by store name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="vendor-search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchVendors} data-testid="refresh-btn">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{vendors.filter(v => v.is_approved && v.is_active !== false).length}</p>
            <p className="text-sm text-green-600">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{vendors.filter(v => !v.is_approved).length}</p>
            <p className="text-sm text-amber-600">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{vendors.filter(v => v.is_active === false).length}</p>
            <p className="text-sm text-red-600">Deactivated</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{vendors.filter(v => v.is_verified).length}</p>
            <p className="text-sm text-blue-600">Verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor List */}
      {filteredVendors.length === 0 ? (
        <Card className="p-12 text-center">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No vendors found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className={vendor.is_active === false ? 'border-red-200 bg-red-50/30' : ''} data-testid={`vendor-card-${vendor.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Vendor Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {vendor.logo_url ? (
                        <img src={vendor.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-amber-600">{vendor.store_name?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{vendor.store_name}</h3>
                        {vendor.is_verified && (
                          <BadgeCheck className="h-5 w-5 text-blue-500" title="Verified Vendor" />
                        )}
                        {getStatusBadge(vendor)}
                      </div>
                      
                      {vendor.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{vendor.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{vendor.city}, {vendor.country}</span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{vendor.description}</p>
                      
                      {/* Deactivation info */}
                      {vendor.is_active === false && vendor.deactivation_reason && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                          <strong>Reason:</strong> {vendor.deactivation_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-center">
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <Package className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="font-semibold">{vendor.product_count || 0}</p>
                      <p className="text-xs text-gray-500">Products</p>
                    </div>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <DollarSign className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="font-semibold">${(vendor.total_sales || 0).toFixed(0)}</p>
                      <p className="text-xs text-gray-500">Sales</p>
                    </div>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <Star className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="font-semibold">{(vendor.average_rating || 0).toFixed(1)}</p>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {/* Deactivated vendor - show reactivate */}
                    {vendor.is_active === false ? (
                      <Button 
                        onClick={() => handleActivate(vendor.id)}
                        disabled={actionLoading === vendor.id}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`activate-btn-${vendor.id}`}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${actionLoading === vendor.id ? 'animate-spin' : ''}`} />
                        Reactivate
                      </Button>
                    ) : !vendor.is_approved ? (
                      /* Pending vendor - show approve */
                      <Button 
                        onClick={() => approveVendor(vendor.id)}
                        disabled={actionLoading === vendor.id}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`approve-btn-${vendor.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    ) : (
                      /* Active vendor - show verify/deactivate */
                      <>
                        <Button 
                          size="sm"
                          variant={vendor.is_verified ? "outline" : "default"}
                          onClick={() => toggleVerification(vendor.id, vendor.is_verified)}
                          disabled={actionLoading === vendor.id}
                          className={vendor.is_verified ? "" : "bg-blue-600 hover:bg-blue-700"}
                          data-testid={`verify-btn-${vendor.id}`}
                        >
                          {vendor.is_verified ? (
                            <><XCircle className="h-4 w-4 mr-1" />Remove Badge</>
                          ) : (
                            <><BadgeCheck className="h-4 w-4 mr-1" />Verify</>
                          )}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setDeactivateDialog({ open: true, vendor })}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          data-testid={`deactivate-btn-${vendor.id}`}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialog.open} onOpenChange={(open) => !open && setDeactivateDialog({ open: false, vendor: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Deactivate Vendor
            </DialogTitle>
            <DialogDescription>
              You are about to deactivate <strong>{deactivateDialog.vendor?.store_name}</strong>. 
              This will hide all their products and services from the marketplace.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Reason for deactivation (required)</label>
              <Textarea
                placeholder="e.g., Policy violation, Non-compliance, Fraudulent activity..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="mt-1"
                data-testid="deactivate-reason-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialog({ open: false, vendor: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeactivate}
              disabled={!deactivateReason.trim() || actionLoading === deactivateDialog.vendor?.id}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-deactivate-btn"
            >
              {actionLoading === deactivateDialog.vendor?.id ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-1" />
              )}
              Deactivate Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendors;
