import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { 
  Store, MapPin, CreditCard, Shield, FileText, Package, 
  Check, ChevronRight, ChevronLeft, Loader2, ExternalLink,
  User, Building, Globe, Phone, AlertCircle
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

const STEPS = [
  { id: 'profile', title: 'Store Profile', icon: Store, description: 'Basic store information' },
  { id: 'contact', title: 'Contact & Location', icon: MapPin, description: 'Where are you based?' },
  { id: 'branding', title: 'Branding', icon: User, description: 'Logo and banner images' },
  { id: 'payment', title: 'Payment Setup', icon: CreditCard, description: 'Bank account for payouts' },
  { id: 'identity', title: 'Identity Verification', icon: Shield, description: 'Government ID verification' },
  { id: 'tax', title: 'Tax Information', icon: FileText, description: 'Business and tax details' },
];

const VendorOnboardingWizard = ({ onComplete, initialStep = 0 }) => {
  const { api, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [logoImages, setLogoImages] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  
  const [formData, setFormData] = useState({
    // Profile
    store_name: '',
    description: '',
    cultural_story: '',
    // Contact
    country_code: 'NG',
    country: 'Nigeria',
    city: '',
    address: '',
    phone: '',
    email: user?.email || '',
    website: '',
    // Tax
    tax_id_type: '',
    tax_id: '',
    business_name: '',
    business_type: 'individual',
    vat_number: '',
    tax_country: '',
  });

  useEffect(() => {
    fetchOnboardingStatus();
    fetchVendorProfile();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await api.get('/stripe-connect/onboarding-status');
      setOnboardingStatus(response.data);
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    }
  };

  const fetchVendorProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendors/me');
      const vendor = response.data;
      setFormData(prev => ({
        ...prev,
        store_name: vendor.store_name || '',
        description: vendor.description || '',
        cultural_story: vendor.cultural_story || '',
        country_code: vendor.country_code || 'NG',
        country: vendor.country || 'Nigeria',
        city: vendor.city || '',
        address: vendor.address || '',
        phone: vendor.phone || '',
        email: vendor.email || user?.email || '',
        website: vendor.website || '',
        business_name: vendor.business_name || '',
        business_type: vendor.business_type || 'individual',
        vat_number: vendor.vat_number || '',
        tax_country: vendor.tax_country || vendor.country_code || '',
      }));
      if (vendor.logo_url) setLogoImages([vendor.logo_url]);
      if (vendor.banner_url) setBannerImages([vendor.banner_url]);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryCode) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData(prev => ({
      ...prev,
      country_code: countryCode,
      country: country?.name || ''
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/vendors/me', {
        store_name: formData.store_name,
        description: formData.description,
        cultural_story: formData.cultural_story,
        country_code: formData.country_code,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logo_url: logoImages[0] || null,
        banner_url: bannerImages[0] || null,
      });
      toast.success('Profile saved!');
      fetchOnboardingStatus();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
      return false;
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
      fetchOnboardingStatus();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save tax info');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const initiateStripeConnect = async () => {
    setSaving(true);
    try {
      // First create account if needed
      await api.post('/stripe-connect/create-account');
      
      // Then get onboarding link
      const response = await api.post('/stripe-connect/onboarding-link', {
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start payment setup');
    } finally {
      setSaving(false);
    }
  };

  const initiateIdentityVerification = async () => {
    setSaving(true);
    try {
      const response = await api.post('/stripe-connect/identity-verification', {
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe Identity
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start identity verification');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const step = STEPS[currentStep];
    
    // Save data based on current step
    if (step.id === 'profile' || step.id === 'contact' || step.id === 'branding') {
      const saved = await saveProfile();
      if (!saved) return;
    } else if (step.id === 'tax') {
      const saved = await saveTaxInfo();
      if (!saved) return;
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepCompleted = (stepId) => {
    if (!onboardingStatus?.steps) return false;
    return onboardingStatus.steps[stepId]?.completed;
  };

  const completionPercentage = onboardingStatus?.completion_percentage || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input 
                value={formData.store_name}
                onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                placeholder="Your Store Name"
                data-testid="store-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Store Description *</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell customers about your store and what you sell..."
                rows={3}
                data-testid="store-description-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Your Story</Label>
              <Textarea 
                value={formData.cultural_story}
                onChange={(e) => setFormData({...formData, cultural_story: e.target.value})}
                placeholder="Share your journey, heritage, and passion for African craftsmanship..."
                rows={4}
                data-testid="vendor-story-input"
              />
              <p className="text-xs text-gray-500">This will be featured in the Vendor Spotlight section</p>
            </div>
          </div>
        );
        
      case 'contact':
        return (
          <div className="space-y-4">
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
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Lagos, Accra, Nairobi..."
                  data-testid="city-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Street address"
                data-testid="address-input"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+234 123 456 7890"
                  data-testid="phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="store@example.com"
                  data-testid="email-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website (optional)</Label>
              <Input 
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://yourwebsite.com"
                data-testid="website-input"
              />
            </div>
          </div>
        );
        
      case 'branding':
        return (
          <div className="space-y-6">
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
        );
        
      case 'payment':
        const paymentStatus = onboardingStatus?.steps?.payment;
        return (
          <div className="space-y-6">
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
            
            {paymentStatus?.completed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Payment setup complete!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Your bank account is connected and payouts are {paymentStatus.payouts_enabled ? 'enabled' : 'pending verification'}.
                </p>
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
                      Business or personal information
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Government-issued ID (for verification)
                    </li>
                  </ul>
                </div>
                
                <Button 
                  onClick={initiateStripeConnect}
                  className="w-full bg-[#635BFF] hover:bg-[#5851DB]"
                  disabled={saving}
                  data-testid="setup-stripe-btn"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Set Up Payment with Stripe
                </Button>
              </div>
            )}
          </div>
        );
        
      case 'identity':
        const identityStatus = onboardingStatus?.steps?.identity;
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Identity Verification</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    To ensure a safe marketplace, we verify all vendors using Stripe Identity. This helps build trust with customers.
                  </p>
                </div>
              </div>
            </div>
            
            {identityStatus?.completed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Identity verified!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Your identity has been successfully verified. You'll see a verified badge on your store.
                </p>
              </div>
            ) : identityStatus?.status === 'pending' ? (
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
                      Passport
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
                    You'll also need to take a selfie for face matching.
                  </p>
                </div>
                
                <Button 
                  onClick={initiateIdentityVerification}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={saving}
                  data-testid="verify-identity-btn"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Verify Your Identity
                </Button>
              </div>
            )}
          </div>
        );
        
      case 'tax':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Tax Information</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Provide your tax details for compliance and reporting purposes. This information is kept secure and confidential.
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
                      <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                      <SelectItem value="company">Company / Corporation</SelectItem>
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
              
              {(formData.tax_id_type === 'vat' || formData.tax_country === 'GB' || formData.tax_country === 'DE') && (
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
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Vendor Onboarding</h2>
          <span className="text-sm text-gray-500">{completionPercentage}% complete</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
      
      {/* Step Indicators */}
      <div className="flex justify-between mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = isStepCompleted(step.id);
          
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex flex-col items-center min-w-[80px] transition-colors ${
                isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
              data-testid={`step-${step.id}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                isActive ? 'bg-red-100 ring-2 ring-red-600' : 
                isCompleted ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium text-center">{step.title}</span>
            </button>
          );
        })}
      </div>
      
      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(STEPS[currentStep].icon, { className: "h-5 w-5 text-red-600" })}
            {STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          data-testid="wizard-back-btn"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700"
          data-testid="wizard-next-btn"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {currentStep === STEPS.length - 1 ? 'Complete Setup' : 'Save & Continue'}
          {currentStep < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
};

export default VendorOnboardingWizard;
