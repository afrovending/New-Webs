import React, { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { MapPin, Loader2 } from 'lucide-react';

const GOOGLE_PLACES_KEY = process.env.REACT_APP_GOOGLE_PLACES_KEY;

const GoogleAddressAutocomplete = ({ 
  value, 
  onChange, 
  onAddressSelect,
  placeholder = "Start typing your address...",
  className = "",
  disabled = false
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Google Places script
    if (!window.google && GOOGLE_PLACES_KEY) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoaded(true);
        setIsLoading(false);
      };
      script.onerror = () => {
        console.error('Failed to load Google Places API');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else if (window.google) {
      setIsLoaded(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            fields: ['address_components', 'formatted_address', 'geometry']
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place && place.address_components) {
            const addressData = parseAddressComponents(place.address_components);
            addressData.formatted_address = place.formatted_address;
            
            if (onAddressSelect) {
              onAddressSelect(addressData);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    }
  }, [isLoaded, onAddressSelect]);

  const parseAddressComponents = (components) => {
    const result = {
      street_number: '',
      route: '',
      city: '',
      state: '',
      country: '',
      country_code: '',
      postal_code: ''
    };

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        result.street_number = component.long_name;
      }
      if (types.includes('route')) {
        result.route = component.long_name;
      }
      if (types.includes('locality') || types.includes('postal_town')) {
        result.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        result.state = component.short_name;
      }
      if (types.includes('country')) {
        result.country = component.long_name;
        result.country_code = component.short_name;
      }
      if (types.includes('postal_code')) {
        result.postal_code = component.long_name;
      }
    });

    // Combine street number and route
    result.street1 = `${result.street_number} ${result.route}`.trim();

    return result;
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
        disabled={disabled || isLoading}
        data-testid="google-address-input"
      />
      {isLoaded && (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </span>
          Powered by Google
        </p>
      )}
    </div>
  );
};

export default GoogleAddressAutocomplete;
