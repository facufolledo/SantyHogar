import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';

interface CardBINInputProps {
  onBINChange?: (bin: string) => void;
  onCardTypeDetected?: (type: string) => void;
}

// Patrones BIN para detectar tipo de tarjeta
const CARD_PATTERNS = {
  visa: /^4/,
  mastercard: /^(5[1-5]|2[2-7])/,
  amex: /^3[47]/,
  diners: /^3(0[0-5]|[68])/,
  discover: /^6(?:011|5)/,
};

const CARD_BRANDS: Record<string, { name: string; color: string; logo: string }> = {
  visa: { name: 'Visa', color: 'text-blue-600', logo: '💳' },
  mastercard: {
    name: 'Mastercard',
    color: 'text-orange-600',
    logo: '💳',
  },
  amex: { name: 'American Express', color: 'text-blue-700', logo: '💳' },
  diners: { name: 'Diners Club', color: 'text-blue-800', logo: '💳' },
  discover: { name: 'Discover', color: 'text-orange-500', logo: '💳' },
};

export const CardBINInput: React.FC<CardBINInputProps> = ({
  onBINChange,
  onCardTypeDetected,
}) => {
  const [bin, setBin] = useState('');
  const [cardType, setCardType] = useState<string | null>(null);

  const detectCardType = (value: string): string | null => {
    for (const [type, pattern] of Object.entries(CARD_PATTERNS)) {
      if (pattern.test(value)) {
        return type;
      }
    }
    return null;
  };

  const handleBinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setBin(value);

    if (value.length === 6) {
      const detected = detectCardType(value);
      setCardType(detected);
      if (onCardTypeDetected && detected) {
        onCardTypeDetected(detected);
      }
    } else {
      setCardType(null);
    }

    if (onBINChange) {
      onBINChange(value);
    }
  };

  const brand = cardType ? CARD_BRANDS[cardType] : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Primeros 6 dígitos de la tarjeta
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <CreditCard size={18} />
        </div>
        <input
          type="text"
          inputMode="numeric"
          placeholder="453036"
          maxLength="6"
          value={bin}
          onChange={handleBinChange}
          className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-center text-lg tracking-widest"
        />
        {brand && (
          <div
            className={`absolute right-3 top-1/2 -translate-y-1/2 font-bold ${brand.color}`}
          >
            {brand.logo}
          </div>
        )}
      </div>

      {brand && (
        <div
          className={`text-sm font-medium ${brand.color} flex items-center gap-1`}
        >
          ✓ {brand.name} detectada
        </div>
      )}

      {bin.length > 0 && bin.length < 6 && (
        <div className="text-xs text-gray-500">
          {6 - bin.length} dígitos faltantes
        </div>
      )}
    </div>
  );
};

export default CardBINInput;
