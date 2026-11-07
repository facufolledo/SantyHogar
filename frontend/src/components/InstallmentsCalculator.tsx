import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Loader } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface InstallmentOption {
  installments: number;
  installment_amount: number;
  total_amount: number;
  interest_rate: number;
  discount: number;
  labels: string[];
}

interface InstallmentsCalculatorProps {
  amount: number;
  binNumber?: string;
  onInstallmentSelected?: (option: InstallmentOption) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const InstallmentsCalculator: React.FC<InstallmentsCalculatorProps> = ({
  amount,
  binNumber,
  onInstallmentSelected,
}) => {
  const [installments, setInstallments] = useState<InstallmentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Cargar opciones de cuotas cuando el BIN cambia
  useEffect(() => {
    if (!binNumber || binNumber.length < 6) {
      setInstallments([]);
      setError(null);
      return;
    }

    fetchInstallments();
  }, [amount, binNumber]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        amount: String(amount),
        ...(binNumber && { bin_number: binNumber }),
      });

      const response = await fetch(
        `${API_URL}/api/installments/calculate?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const options = data.options || [];

      setInstallments(options);

      if (options.length === 0) {
        setError('No hay opciones de cuotas disponibles para esta tarjeta');
      }
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al obtener opciones de cuotas'
      );
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: InstallmentOption) => {
    setSelectedOption(option.installments);
    if (onInstallmentSelected) {
      onInstallmentSelected(option);
    }
  };

  if (!binNumber || binNumber.length < 6) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <CreditCard size={18} className="text-primary-600" />
        <h3 className="font-semibold text-gray-900 text-sm">
          Opciones de pago en cuotas
        </h3>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader size={20} className="animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-gray-600">Cargando opciones...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {!loading && installments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {installments.map((option) => (
            <motion.button
              key={option.installments}
              onClick={() => handleSelectOption(option)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-lg border-2 transition-all text-left text-xs sm:text-sm ${
                selectedOption === option.installments
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900">
                {option.installments}x
              </div>
              <div className="text-gray-600 mt-0.5">
                {formatPrice(option.installment_amount)}
              </div>
              {option.interest_rate > 0 && (
                <div className="text-amber-600 text-xs mt-0.5">
                  +{option.interest_rate.toFixed(1)}% interés
                </div>
              )}
              {option.discount > 0 && (
                <div className="text-green-600 text-xs font-medium mt-0.5">
                  Descuento {formatPrice(option.discount)}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {!loading && installments.length > 0 && selectedOption && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-3"
        >
          {installments
            .filter((o) => o.installments === selectedOption)
            .map((option) => (
              <div key={option.installments} className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cuotas:</span>
                  <span className="font-semibold text-gray-900">
                    {option.installments}x {formatPrice(option.installment_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="font-bold text-green-700">
                    {formatPrice(option.total_amount)}
                  </span>
                </div>
                {option.interest_rate > 0 && (
                  <div className="flex justify-between pt-1 border-t border-green-200">
                    <span className="text-gray-600 text-xs">Interés aplicado:</span>
                    <span className="text-amber-600 text-xs font-medium">
                      {option.interest_rate.toFixed(2)}%
                    </span>
                  </div>
                )}
                {option.labels && option.labels.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {option.labels.map((label) => (
                      <span
                        key={label}
                        className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default InstallmentsCalculator;
