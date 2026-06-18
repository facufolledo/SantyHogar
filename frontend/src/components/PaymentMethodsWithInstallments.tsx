import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
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
  onInstallmentSelected?: (option: {
    paymentMethodId: string;
    installments: number;
    amount: number;
  }) => void;
}

const BANK_LOGOS: Record<string, string> = {
  visa: '🔵',
  mastercard: '🔴',
  amex: '💳',
  naranja: '🟠',
  cordial: '📘',
  bbva: '🟦',
  santander: '🟥',
  itau: '🟩',
};

const BANK_COLORS: Record<string, string> = {
  visa: 'from-blue-50 to-blue-50 border-blue-200',
  mastercard: 'from-red-50 to-red-50 border-red-200',
  amex: 'from-blue-50 to-blue-50 border-blue-200',
  naranja: 'from-orange-50 to-orange-50 border-orange-200',
  cordial: 'from-blue-50 to-blue-50 border-blue-200',
  bbva: 'from-blue-50 to-blue-50 border-blue-200',
  santander: 'from-red-50 to-red-50 border-red-200',
  itau: 'from-green-50 to-green-50 border-green-200',
};

export default function PaymentMethodsWithInstallments({
  amount,
  onInstallmentSelected,
}: Props) {
  const [methods, setMethods] = useState<PaymentMethodInstallments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<string | null>(null);

  useEffect(() => {
    fetchInstallments();
  }, [amount]);

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
      
      // MP devuelve un array de objetos con los métodos de pago
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin text-primary-600" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle size={18} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!methods || methods.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No hay opciones de cuotas disponibles
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-900 mb-3">Opciones de pago y cuotas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {methods.map((method) => {
          const methodKey = method.payment_method_id.toLowerCase();
          const bgColor = BANK_COLORS[methodKey] || 'from-gray-50 to-gray-50 border-gray-200';
          
          return (
            <div
              key={method.payment_method_id}
              className={`border rounded-xl p-4 bg-gradient-to-br ${bgColor}`}
            >
              {/* Header con logo y nombre */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <span className="text-2xl">{BANK_LOGOS[methodKey] || '💳'}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{method.name}</p>
                  <p className="text-xs text-gray-500">{method.payment_type_id}</p>
                </div>
              </div>

              {/* Opciones de cuotas */}
              <div className="space-y-2">
                {method.payer_costs && method.payer_costs.length > 0 ? (
                  method.payer_costs.map((cost) => {
                    const id = `${method.payment_method_id}-${cost.installments}`;
                    const hasInterest = cost.interest_rate > 0;
                    const isSelected = selectedInstallment === id;
                    const totalAmount =
                      cost.total_amount ?? cost.installment_amount * cost.installments;
                    const extraInterest = Math.max(0, totalAmount - amount);

                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedInstallment(id);
                          onInstallmentSelected?.({
                            paymentMethodId: method.payment_method_id,
                            installments: cost.installments,
                            amount: cost.installment_amount,
                          });
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary-600 bg-white ring-2 ring-primary-300 shadow-sm'
                            : 'border-gray-200 bg-white/60 hover:border-primary-300 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {cost.installments === 1 ? '1 cuota' : `${cost.installments} cuotas`}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            hasInterest ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {hasInterest ? `+${(cost.interest_rate * 100).toFixed(1)}%` : 'Sin interés'}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            ${cost.installment_amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </span>
                          {cost.installments > 1 && (
                            <span className="text-xs text-gray-500">
                              c/u
                            </span>
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
                        {cost.labels && cost.labels.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {cost.labels.join(' · ')}
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 text-center py-3">
                    Sin opciones disponibles
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info sobre el monto total */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 text-center">
        Monto a financiar: <span className="font-bold text-gray-900">${amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      </div>
    </div>
  );
}
