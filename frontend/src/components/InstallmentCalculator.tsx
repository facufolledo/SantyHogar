import React, { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface InstallmentCalculatorProps {
  price: number;
  showDetails?: boolean;
}

// Opciones de cuotas sin interés en Argentina - MercadoPago
const INSTALLMENT_OPTIONS = [1, 3, 6, 12];

export default function InstallmentCalculator({ price, showDetails = false }: InstallmentCalculatorProps) {
  const installments = useMemo(() => {
    return INSTALLMENT_OPTIONS.map(qty => ({
      quantity: qty,
      monthlyAmount: Math.round(price / qty),
      total: price,
    }));
  }, [price]);

  // Si no mostramos detalles, mostramos solo la opción de 12 cuotas
  if (!showDetails) {
    const main = installments.find(i => i.quantity === 12);
    if (!main) return null;
    
    return (
      <p className="text-sm text-green-600 font-medium">
        {main.quantity} cuotas de {formatPrice(main.monthlyAmount)} sin interés
      </p>
    );
  }

  // Mostrar todas las opciones
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <CreditCard size={18} className="text-primary-600" />
        Opciones de pago
      </h3>
      
      <div className="space-y-2">
        {installments.map((inst) => (
          <div
            key={inst.quantity}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-gray-700">
              {inst.quantity} {inst.quantity === 1 ? 'cuota' : 'cuotas'}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(inst.monthlyAmount)} {inst.quantity > 1 ? 'c/u' : ''}
            </span>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        ✨ Sin interés con Mercado Pago
      </p>
    </div>
  );
}
