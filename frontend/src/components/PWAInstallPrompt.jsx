import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Check } from 'lucide-react';
import { Button } from './ui/button';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay if user hasn't seen it
      const hasSeenPrompt = localStorage.getItem('pwa_prompt_seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_seen', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_seen', 'true');
  };

  // Don't show if installed or no prompt available
  if (isInstalled || !showPrompt) return null;

  // iOS specific instructions
  if (platform === 'ios') {
    return (
      <div 
        className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500"
        data-testid="pwa-install-prompt"
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
              <Smartphone className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Install AfroVending</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add to your home screen for the best experience:
              </p>
              <ol className="text-sm text-gray-600 mt-2 space-y-1">
                <li>1. Tap the <strong>Share</strong> button</li>
                <li>2. Select <strong>"Add to Home Screen"</strong></li>
              </ol>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android and Desktop prompt
  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500"
      data-testid="pwa-install-prompt"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
            {platform === 'android' ? (
              <Smartphone className="h-6 w-6 text-red-600" />
            ) : (
              <Monitor className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Install AfroVending App</h3>
            <p className="text-sm text-gray-600 mt-1">
              Get quick access, offline support, and push notifications
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
                data-testid="pwa-install-btn"
              >
                <Download className="h-4 w-4" />
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
