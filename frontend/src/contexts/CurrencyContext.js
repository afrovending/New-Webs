import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

const CURRENCY_DATA = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound' },
  MAD: { symbol: 'MAD', name: 'Moroccan Dirham' },
  XOF: { symbol: 'CFA', name: 'West African CFA' },
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('preferred_currency') || 'USD';
  });
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/currency/rates`);
        setRates(response.data.rates);
      } catch (error) {
        console.error('Failed to fetch currency rates:', error);
        // Fallback rates
        setRates({
          USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1550, KES: 153,
          ZAR: 18.5, GHS: 15.8, EGP: 30.9, MAD: 10, XOF: 605
        });
      } finally {
        setLoading(false);
      }
    };

    const detectCurrency = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/currency/detect`);
        const detected = response.data.currency;
        if (!localStorage.getItem('preferred_currency')) {
          setCurrency(detected);
        }
      } catch (error) {
        console.error('Failed to detect currency:', error);
      }
    };

    fetchRates();
    detectCurrency();
  }, []);

  useEffect(() => {
    localStorage.setItem('preferred_currency', currency);
  }, [currency]);

  const convertPrice = (priceUSD, toCurrency = currency) => {
    if (!rates[toCurrency]) return priceUSD;
    return priceUSD * rates[toCurrency];
  };

  const formatPrice = (priceUSD, showCurrency = true) => {
    const converted = convertPrice(priceUSD);
    const currencyInfo = CURRENCY_DATA[currency] || CURRENCY_DATA.USD;
    
    // Format based on currency
    let formatted;
    if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
      formatted = converted.toFixed(2);
    } else {
      // For currencies with high conversion rates, show fewer decimals
      formatted = converted >= 100 ? Math.round(converted).toLocaleString() : converted.toFixed(2);
    }
    
    if (showCurrency) {
      return `${currencyInfo.symbol}${formatted}`;
    }
    return formatted;
  };

  const value = {
    currency,
    setCurrency,
    rates,
    loading,
    convertPrice,
    formatPrice,
    currencies: Object.keys(CURRENCY_DATA),
    currencyData: CURRENCY_DATA,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
