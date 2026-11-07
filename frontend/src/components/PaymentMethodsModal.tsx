import React, { useEffect, useState } from 'react';
import { X, Loader, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBase } from '../api/config';

interface InstallmentOption {
  installments: number;
  installment_amount: number;
  total_amount: number;
  interest_rate: number;
  labels: string[];
}

interface PaymentMethodInstallments {
  payment_method_id: string;
  payment_type_id: string;
  name: string;
  secure_thumbnail: string;
  thumbnail: string;
  payer_costs: InstallmentOption[];
}

interface Props {
  amount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentMethodsModal({ amount, isOpen, onClose }: Props) {
  const [methods, setMethods] = useState<PaymentMethodInstallments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchInstallments();
    }
  }, [isOpen, amount]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiBase = getApiBase();
      if (!apiBase) {
        setError('API no configurada');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${apiBase}/api/installments/calculate?amount=${amount}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setMethods(data);
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <CreditCard className="text-primary-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Medios de pago</h2>
                <p className="text-sm text-gray-500">
                  Monto: ${amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="animate-spin text-primary-600 mb-3" size={32} />
                <p className="text-gray-500">Cargando opciones de pago...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <X className="text-red-600" size={24} />
                </div>
                <p className="text-red-600 font-medium">Error al cargar</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay opciones de pago disponibles
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {methods.map((method) => (
                  <div
                    key={method.payment_method_id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all bg-white"
                  >
                    {/* Logo y nombre */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                      <img
                        src={method.secure_thumbnail || method.thumbnail}
                        alt={method.name}
                        className="w-12 h-8 object-contain"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{method.name}</p>
                      </div>
                    </div>

                    {/* Opciones de cuotas */}
                    <div className="space-y-2">
                      {method.payer_costs && method.payer_costs.length > 0 ? (
                        method.payer_costs.map((cost) => {
                          const hasInterest = cost.interest_rate > 0;
                          const totalAmount =
                            cost.total_amount ?? cost.installment_amount * cost.installments;
                          const extraInterest = Math.max(0, totalAmount - amount);

                          return (
                            <div
                              key={`${method.payment_method_id}-${cost.installments}`}
                              className="px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="font-semibold text-sm text-gray-900">
                                  {cost.installments === 1 ? '1 cuota' : `${cost.installments} cuotas`}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  hasInterest ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {hasInterest ? `+${(cost.interest_rate * 100).toFixed(1)}%` : 'Sin interés'}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-base font-bold text-gray-900">
                                  ${cost.installment_amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                                {cost.installments > 1 && (
                                  <span className="text-xs text-gray-500">c/u</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1.5 pt-1.5 border-t border-gray-200/80">
                                Total a pagar:{' '}
                                <span className={`font-semibold ${extraInterest > 0 ? 'text-red-700' : 'text-gray-800'}`}>
                                  ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {extraInterest > 0.01 && (
                                  <span className="text-red-600 ml-1">
                                    (+${extraInterest.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} interés)
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-3">
                          Sin opciones disponibles
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
