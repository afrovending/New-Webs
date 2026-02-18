import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Globe } from 'lucide-react';

const CurrencySelector = ({ className = '' }) => {
  const { currency, setCurrency, currencies, currencyData } = useCurrency();

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className={`w-24 h-8 text-xs ${className}`} data-testid="currency-selector">
        <Globe className="h-3 w-3 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((code) => (
          <SelectItem key={code} value={code}>
            <span className="font-medium">{currencyData[code]?.symbol}</span>
            <span className="ml-1 text-gray-500">{code}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
