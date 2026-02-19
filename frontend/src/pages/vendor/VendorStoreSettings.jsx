import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Store, MapPin, Globe, Phone, Mail, Save, Loader2, 
  CreditCard, Shield, FileText, Check, ExternalLink, AlertCircle,
  Building, User
} from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
];

const VendorStoreSettings = () => {
  const { api, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoImages, setLogoImages] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [stripeStatus, setStripeStatus] = useState(null);
  const [identityStatus, setIdentityStatus] = useState(null);
  
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
    // Tax fields
    tax_id_type: '',
    tax_id: '',
    business_name: '',
    business_type: 'individual',
    vat_number: '',
    tax_country: '',
  });

  useEffect(() => {
    fetchVendorProfile();
    fetchStripeStatus();
    fetchIdentityStatus();
    
    // Check for Stripe return params
    if (searchParams.get('stripe_complete')) {
      toast.success('Payment setup updated!');
      fetchStripeStatus();
    }
    if (searchParams.get('identity_complete')) {
      toast.success('Identity verification submitted!');
      fetchIdentityStatus();
    }
  }, [api, user, searchParams]);

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
        tax_id_type: vendor.tax_id_type || '',
        tax_id: '',
        business_name: vendor.business_name || '',
        business_type: vendor.business_type || 'individual',
        vat_number: vendor.vat_number || '',
        tax_country: vendor.tax_country || vendor.country_code || '',
      });
      if (vendor.logo_url) setLogoImages([vendor.logo_url]);
      if (vendor.banner_url) setBannerImages([vendor.banner_url]);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const response = await api.get('/stripe-connect/account-status');
      setStripeStatus(response.data);
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
    }
  };

  const fetchIdentityStatus = async () => {
    try {
      const response = await api.get('/stripe-connect/identity-status');
      setIdentityStatus(response.data);
    } catch (error) {
      console.error('Error fetching identity status:', error);
    }
  };

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

  const saveTaxInfo = async () => {
    setSaving(true);
    try {
      await api.put('/stripe-connect/tax-information', {
        tax_id_type: formData.tax_id_type,
        tax_id: formData.tax_id,
        business_name: formData.business_name,
        business_type: formData.business_type,
        vat_number: formData.vat_number,
        tax_country: formData.tax_country || formData.country_code,
      });
      toast.success('Tax information saved!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save tax info');
    } finally {
      setSaving(false);
    }
  };

  const initiateStripeConnect = async () => {
    setSaving(true);
    try {
      await api.post('/stripe-connect/create-account');
      const response = await api.post('/stripe-connect/onboarding-link', {
        origin_url: window.location.origin
      });
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start payment setup');
      setSaving(false);
    }
  };

  const initiateIdentityVerification = async () => {
    setSaving(true);
    try {
      const response = await api.post('/stripe-connect/identity-verification', {
        origin_url: window.location.origin
      });
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start identity verification');
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
            <p className="text-red-100">Manage your store profile, payments, and verification</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
            {stripeStatus?.payouts_enabled && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="identity" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Identity</span>
            {identityStatus?.verified && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Tax</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                      data-testid="store-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="store@example.com"
                      data-testid="email-input"
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
                    data-testid="description-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Your Story</Label>
                  <Textarea 
                    value={formData.cultural_story} 
                    onChange={(e) => setFormData({ ...formData, cultural_story: e.target.value })}
                    placeholder="Share your journey, heritage, and passion for African craftsmanship..."
                    rows={4}
                    data-testid="story-input"
                  />
                  <p className="text-xs text-gray-500">This will be shown in the Vendor Spotlight section</p>
                </div>
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Location & Contact
                </CardTitle>
                <CardDescription>Where are you based?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select value={formData.country_code} onValueChange={handleCountryChange}>
                      <SelectTrigger data-testid="country-select">
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
                      data-testid="city-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 123 456 7890"
                      data-testid="phone-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input 
                      value={formData.website} 
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      data-testid="website-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

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

            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700 px-8"
                disabled={saving}
                data-testid="save-profile-btn"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Settings</>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-600" />
                Payment Setup
              </CardTitle>
              <CardDescription>Connect your bank account to receive payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Stripe Connect</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      We use Stripe Connect to securely handle your payouts. You'll need to provide your bank account details and verify your identity through Stripe's secure process.
                    </p>
                  </div>
                </div>
              </div>
              
              {stripeStatus?.payouts_enabled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Payment setup complete!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Your bank account is connected and payouts are enabled.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Payouts Enabled
                    </Badge>
                    {stripeStatus?.charges_enabled && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Charges Enabled
                      </Badge>
                    )}
                  </div>
                </div>
              ) : stripeStatus?.has_account && !stripeStatus?.details_submitted ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Setup incomplete</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Please complete your Stripe onboarding to enable payouts.
                  </p>
                  {stripeStatus?.requirements?.currently_due?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-600">Requirements needed:</p>
                      <ul className="text-xs text-yellow-600 list-disc list-inside">
                        {stripeStatus.requirements.currently_due.slice(0, 3).map((req, i) => (
                          <li key={i}>{req.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button 
                    onClick={initiateStripeConnect}
                    className="mt-4 bg-[#635BFF] hover:bg-[#5851DB]"
                    disabled={saving}
                    data-testid="continue-stripe-btn"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                    Continue Setup
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">What you'll need:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Bank account number and routing number
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Internationally chargeable credit/debit card
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Business or personal information
                      </li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={initiateStripeConnect}
                    className="w-full bg-[#635BFF] hover:bg-[#5851DB]"
                    disabled={saving}
                    data-testid="setup-stripe-btn"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                    Set Up Payment with Stripe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Identity Tab */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Identity Verification
              </CardTitle>
              <CardDescription>Verify your identity to build trust with customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Stripe Identity</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      We use Stripe Identity to verify vendors. This helps build trust with customers and ensures a safe marketplace. Verified vendors get a special badge on their store.
                    </p>
                  </div>
                </div>
              </div>
              
              {identityStatus?.verified ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Identity verified!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Your identity has been successfully verified. You now have a verified badge on your store.
                  </p>
                  <Badge className="mt-3 bg-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Vendor
                  </Badge>
                </div>
              ) : identityStatus?.status === 'processing' || identityStatus?.status === 'requires_input' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Verification in progress</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    We're reviewing your documents. This usually takes a few minutes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Accepted documents:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Government-issued Passport
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Driver's License
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        National ID Card
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                      You'll also need to take a selfie for face matching verification.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={initiateIdentityVerification}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={saving}
                    data-testid="verify-identity-btn"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                    Verify Your Identity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Tab */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Tax Information
              </CardTitle>
              <CardDescription>Provide your tax details for compliance and reporting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Why we need this</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Tax information is required for compliance with local and international tax regulations. This information is kept secure and confidential.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Type *</Label>
                    <Select 
                      value={formData.business_type} 
                      onValueChange={(v) => setFormData({...formData, business_type: v})}
                    >
                      <SelectTrigger data-testid="business-type-select">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Individual / Sole Proprietor
                          </div>
                        </SelectItem>
                        <SelectItem value="company">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Company / Corporation
                          </div>
                        </SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="non_profit">Non-Profit Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID Type *</Label>
                    <Select 
                      value={formData.tax_id_type} 
                      onValueChange={(v) => setFormData({...formData, tax_id_type: v})}
                    >
                      <SelectTrigger data-testid="tax-id-type-select">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssn">SSN (US Individual)</SelectItem>
                        <SelectItem value="ein">EIN (US Business)</SelectItem>
                        <SelectItem value="vat">VAT Number (EU/International)</SelectItem>
                        <SelectItem value="business_registration">Business Registration Number</SelectItem>
                        <SelectItem value="other">Other Tax ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {formData.business_type !== 'individual' && (
                  <div className="space-y-2">
                    <Label>Legal Business Name</Label>
                    <Input 
                      value={formData.business_name}
                      onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      placeholder="Registered business name"
                      data-testid="business-name-input"
                    />
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax ID Number *</Label>
                    <Input 
                      value={formData.tax_id}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      placeholder="Enter your tax ID"
                      type="password"
                      data-testid="tax-id-input"
                    />
                    <p className="text-xs text-gray-500">Only the last 4 digits are stored for security</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Country</Label>
                    <Select 
                      value={formData.tax_country || formData.country_code} 
                      onValueChange={(v) => setFormData({...formData, tax_country: v})}
                    >
                      <SelectTrigger data-testid="tax-country-select">
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
                </div>
                
                {(formData.tax_id_type === 'vat' || ['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(formData.tax_country)) && (
                  <div className="space-y-2">
                    <Label>VAT Number</Label>
                    <Input 
                      value={formData.vat_number}
                      onChange={(e) => setFormData({...formData, vat_number: e.target.value})}
                      placeholder="e.g., GB123456789"
                      data-testid="vat-number-input"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={saveTaxInfo}
                  className="bg-red-600 hover:bg-red-700 px-8"
                  disabled={saving}
                  data-testid="save-tax-btn"
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save Tax Information</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorStoreSettings;
