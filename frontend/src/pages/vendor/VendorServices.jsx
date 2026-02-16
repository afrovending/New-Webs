import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';

const VendorServices = () => {
  const { api } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', price_type: 'fixed', duration_minutes: '60', location_type: 'both', category_id: '', images: '', tags: ''
  });

  const fetchServices = async () => {
    try {
      const response = await api.get('/services?vendor_id=me&limit=100');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        images: formData.images ? formData.images.split(',').map(s => s.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()) : [],
      };
      await api.post('/services', data);
      toast.success('Service created');
      setDialogOpen(false);
      setFormData({ name: '', description: '', price: '', price_type: 'fixed', duration_minutes: '60', location_type: 'both', category_id: '', images: '', tags: '' });
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Price Type</Label>
                  <Select value={formData.price_type} onValueChange={(v) => setFormData({ ...formData, price_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="starting_from">Starting From</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Location Type</Label>
                  <Select value={formData.location_type} onValueChange={(v) => setFormData({ ...formData, location_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote Only</SelectItem>
                      <SelectItem value="onsite">On-site Only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image URLs (comma-separated)</Label>
                <Input value={formData.images} onChange={(e) => setFormData({ ...formData, images: e.target.value })} />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Create Service</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-gray-100" />)}
        </div>
      ) : services.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No services yet. Add your first service!</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-4">
                <h3 className="font-medium text-lg">{service.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">{service.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-red-600">${service.price}</span>
                  <span className="text-sm text-gray-500">{service.duration_minutes} min</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorServices;
