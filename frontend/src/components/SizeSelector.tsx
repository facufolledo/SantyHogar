import React from 'react';
import { motion } from 'framer-motion';
import type { ProductVariant } from '../data/products';

interface SizeSelectorProps {
  variants?: ProductVariant[];
  selectedSize?: string;
  onSizeChange: (size: string) => void;
  disabled?: boolean;
}

/**
 * SizeSelector Component
 * Displays available product sizes/variants as a grid of selectable buttons
 * Used in ProductDetail and product cards for size selection
 */
const SizeSelector: React.FC<SizeSelectorProps> = ({ 
  variants = [], 
  selectedSize, 
  onSizeChange,
  disabled = false 
}) => {
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-600">Seleccionar tamaño:</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {variants.map((variant) => (
          <motion.button
            key={variant.size}
            onClick={() => onSizeChange(variant.size)}
            disabled={variant.stock === 0 || disabled}
            whileHover={variant.stock > 0 && !disabled ? { scale: 1.05 } : {}}
            whileTap={variant.stock > 0 && !disabled ? { scale: 0.95 } : {}}
            className={`py-2.5 px-3 rounded-lg border-2 font-semibold text-sm transition-all duration-200 cursor-pointer ${
              selectedSize === variant.size
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : variant.stock > 0 && !disabled
                  ? 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
            }`}
            title={variant.stock === 0 ? 'Sin stock' : `${variant.stock} disponibles`}
          >
            <div className="flex flex-col items-center">
              <span>{variant.size}</span>
              {variant.stock === 0 && (
                <span className="text-xs text-gray-400">Sin stock</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelector;
