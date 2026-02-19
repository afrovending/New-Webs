import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from './ui/button';

const COOKIE_CONSENT_KEY = 'afrovending_cookie_consent';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always enabled
    analytics: true,
    marketing: true,
    personalization: true,
  });

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!storedConsent) {
      // Delay showing banner for smoother UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);
    setShowPreferences(false);
  };

  const togglePreference = (key) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500"
      data-testid="cookie-consent-banner"
    >
      <div className="bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {!showPreferences ? (
            // Main Banner View
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                  <Cookie className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">We Value Your Privacy</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                    By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                    <Link to="/legal/privacy" className="text-red-600 hover:underline font-medium">
                      Privacy Policy
                    </Link>{' '}
                    to learn more.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center gap-1"
                  data-testid="cookie-preferences-btn"
                >
                  <Settings className="h-4 w-4" />
                  Preferences
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  data-testid="cookie-reject-btn"
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="cookie-accept-btn"
                >
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            // Preferences View
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
                <button 
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="close-preferences-btn"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid gap-3">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Necessary Cookies</p>
                    <p className="text-sm text-gray-500">Required for the website to function properly</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    Always Active
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Analytics Cookies</p>
                    <p className="text-sm text-gray-500">Help us understand how visitors interact with our site</p>
                  </div>
                  <button
                    onClick={() => togglePreference('analytics')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.analytics ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                    data-testid="toggle-analytics"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Cookies</p>
                    <p className="text-sm text-gray-500">Used to deliver relevant advertisements</p>
                  </div>
                  <button
                    onClick={() => togglePreference('marketing')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.marketing ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                    data-testid="toggle-marketing"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Personalization Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Personalization Cookies</p>
                    <p className="text-sm text-gray-500">Remember your preferences and customize your experience</p>
                  </div>
                  <button
                    onClick={() => togglePreference('personalization')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.personalization ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                    data-testid="toggle-personalization"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.personalization ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePreferences}
                  className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
                  data-testid="save-preferences-btn"
                >
                  <Check className="h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
