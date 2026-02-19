import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Store, MapPin, Globe, Phone, Mail, Save, Loader2 } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
];

const VendorStoreSettings = () => {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoImages, setLogoImages] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    country_code: 'NG',
    country: 'Nigeria',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    cultural_story: '',
    shipping_policy: '',
    return_policy: '',
  });

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await api.get('/vendors/me');
        const vendor = response.data;
        setFormData({
          store_name: vendor.store_name || '',
          description: vendor.description || '',
          country_code: vendor.country_code || 'NG',
          country: vendor.country || 'Nigeria',
          city: vendor.city || '',
          address: vendor.address || '',
          phone: vendor.phone || '',
          email: vendor.email || user?.email || '',
          website: vendor.website || '',
          cultural_story: vendor.cultural_story || '',
          shipping_policy: vendor.shipping_policy || '',
          return_policy: vendor.return_policy || '',
        });
        if (vendor.logo_url) setLogoImages([vendor.logo_url]);
        if (vendor.banner_url) setBannerImages([vendor.banner_url]);
      } catch (error) {
        console.error('Error fetching vendor profile:', error);
        // Initialize with defaults if no profile exists
      } finally {
        setLoading(false);
      }
    };
    fetchVendorProfile();
  }, [api, user]);

  const handleCountryChange = (countryCode) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData({
      ...formData,
      country_code: countryCode,
      country: country?.name || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/vendors/me', {
        ...formData,
        logo_url: logoImages[0] || null,
        banner_url: bannerImages[0] || null,
      });
      toast.success('Store settings saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Store Settings</h1>
            <p className="text-red-100">Customize your store profile and policies</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-red-600" />
              Basic Information
            </CardTitle>
            <CardDescription>Tell customers about your store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store Name *</Label>
                <Input 
                  value={formData.store_name} 
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="Your Store Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="store@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Store Description *</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your store, products, and what makes you unique..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Your Story</Label>
              <Textarea 
                value={formData.cultural_story} 
                onChange={(e) => setFormData({ ...formData, cultural_story: e.target.value })}
                placeholder="Share your journey, heritage, and passion for African craftsmanship..."
                rows={4}
              />
              <p className="text-xs text-gray-500">This will be shown in the Vendor Spotlight section</p>
            </div>
          </CardContent>
        </Card>

        {/* Store Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Store Branding</CardTitle>
            <CardDescription>Upload your logo and banner images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <ImageUploader 
                  onImagesChange={setLogoImages}
                  initialImages={logoImages}
                  maxImages={1}
                  label="Store Logo"
                  folder="vendors/logos"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px, square format</p>
              </div>
              <div>
                <ImageUploader 
                  onImagesChange={setBannerImages}
                  initialImages={bannerImages}
                  maxImages={1}
                  label="Store Banner"
                  folder="vendors/banners"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400px, landscape format</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Location
            </CardTitle>
            <CardDescription>Where are you based?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={formData.country_code} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input 
                  value={formData.city} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Lagos, Accra, Nairobi..."
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 123 456 7890"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input 
                  value={formData.website} 
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Store Policies</CardTitle>
            <CardDescription>Set your shipping and return policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Shipping Policy</Label>
              <Textarea 
                value={formData.shipping_policy} 
                onChange={(e) => setFormData({ ...formData, shipping_policy: e.target.value })}
                placeholder="Describe your shipping times, carriers, and any restrictions..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Return Policy</Label>
              <Textarea 
                value={formData.return_policy} 
                onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                placeholder="Describe your return and refund policy..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-red-600 hover:bg-red-700 px-8"
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Settings</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VendorStoreSettings;
