import { useEffect, useState } from 'react';
import { X, Loader, CreditCard, ChevronDown, LayoutGrid } from 'lucide-react';
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

// Tarjetas más usadas - EXACTAS según requerimiento (14 total)
const POPULAR_METHODS = [
  'visa',
  'mastercard',
  'amex',
  'american express',
  'cabal',
  'naranja',
  'shopping',
  'cencosud',
  'cordobesa',
  'nativa',
  'patagonia 365',
  'patagonia',
  'hsbc',
  'santander',
  'icbc',
  'galicia'
];

// Función mejorada para identificar si es una tarjeta popular
const isPopularMethod = (name: string): boolean => {
  if (!name) return false;
  const normalized = name.toLowerCase().trim();
  
  // Búsqueda exacta primero
  if (POPULAR_METHODS.includes(normalized)) return true;
  
  // Búsqueda por contención (en ambas direcciones)
  return POPULAR_METHODS.some(method => 
    normalized.includes(method) || method.includes(normalized)
  );
};

// Mapeo de nombres a display names más legibles
const getDisplayName = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  const mapping: Record<string, string> = {
    'visa': 'Visa',
    'master': 'Mastercard',
    'mastercard': 'Mastercard',
    'amex': 'American Express',
    'american express': 'American Express',
    'cabal': 'Cabal',
    'naranja': 'Naranja',
    'shopping': 'Tarjeta Shopping',
    'cencosud': 'Cencosud',
    'cordobesa': 'Cordobesa',
    'nativa': 'Nativa',
    'patagonia': 'Patagonia',
    'patagonia 365': 'Patagonia 365',
    'hsbc': 'HSBC',
    'santander': 'Santander',
    'icbc': 'ICBC',
    'galicia': 'Galicia',
  };
  
  return mapping[normalized] || name;
};

export default function PaymentMethodsModal({ amount, isOpen, onClose }: Props) {
  const [methods, setMethods] = useState<PaymentMethodInstallments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [showAllMethods, setShowAllMethods] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInstallments();
    }
  }, [isOpen, amount]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      setError(null);
      setExpandedMethod(null);
      
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
      
      let methods_data: PaymentMethodInstallments[] = [];
      
      if (Array.isArray(data)) {
        methods_data = data;
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        console.warn('Respuesta no es un array:', data);
        if ('detail' in data) {
          setError(data.detail);
        } else {
          setError('Formato de respuesta inesperado');
        }
        setLoading(false);
        return;
      }
      
      setMethods(methods_data);
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar métodos
  const popularMethods = methods.filter(m => isPopularMethod(m.name));
  const otherMethods = methods.filter(m => !isPopularMethod(m.name));

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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
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
              <div className="space-y-6">
                {/* Métodos populares - Plegables */}
                {popularMethods.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <CreditCard className="text-primary-600" size={18} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Tarjetas más usadas</h3>
                    </div>
                    <div className="space-y-3">
                      {popularMethods.map((method) => (
                        <MethodCard
                          key={method.payment_method_id}
                          method={method}
                          amount={amount}
                          isExpanded={expandedMethod === method.payment_method_id}
                          onToggle={() =>
                            setExpandedMethod(
                              expandedMethod === method.payment_method_id ? null : method.payment_method_id
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {otherMethods.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                  </div>
                )}

                {/* Botón para más métodos o Grid de otros métodos */}
                {otherMethods.length > 0 && !showAllMethods && (
                  <button
                    onClick={() => setShowAllMethods(true)}
                    className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-gray-700 hover:text-primary-600 cursor-pointer"
                  >
                    <LayoutGrid size={18} />
                    Más medios de pago
                  </button>
                )}

                {/* Grid de otros métodos (cuando se expande) */}
                {showAllMethods && otherMethods.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <LayoutGrid className="text-gray-600" size={18} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Todos los medios</h3>
                      </div>
                      <button
                        onClick={() => setShowAllMethods(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Menos
                      </button>
                    </div>

                    {/* Grid de métodos con imágenes y nombres */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {otherMethods.map((method) => (
                        <motion.button
                          key={method.payment_method_id}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setExpandedMethod(method.payment_method_id)}
                          className="group border border-gray-200 rounded-xl p-3 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 cursor-pointer flex flex-col items-center gap-2"
                        >
                          <img
                            src={method.secure_thumbnail || method.thumbnail}
                            alt={method.name}
                            className="w-full h-8 object-contain group-hover:scale-110 transition-transform duration-200"
                          />
                          <p className="text-xs font-medium text-gray-700 text-center line-clamp-2 group-hover:text-primary-600 transition-colors">
                            {method.name}
                          </p>
                        </motion.button>
                      ))}
                    </div>

                    {/* Panel expandible para método seleccionado en grid */}
                    <AnimatePresence>
                      {expandedMethod && otherMethods.some(m => m.payment_method_id === expandedMethod) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border border-primary-200 shadow-sm"
                        >
                          <MethodDetailsExpanded
                            method={otherMethods.find(m => m.payment_method_id === expandedMethod)!}
                            amount={amount}
                            onClose={() => setExpandedMethod(null)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Componente para mostrar imagen o fallback con nombre
function PaymentMethodImage({ 
  src, 
  alt, 
  displayName 
}: { 
  src?: string; 
  alt: string; 
  displayName: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="w-full h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700 text-center px-1 line-clamp-2">
          {displayName}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImageError(true)}
      className="w-full h-10 object-contain"
    />
  );
}

// Componente para tarjeta de método expandible (métodos populares)
function MethodCard({
  method,
  amount,
  isExpanded,
  onToggle,
}: {
  method: PaymentMethodInstallments;
  amount: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const bestOption = method.payer_costs?.[0];

  return (
    <motion.div
      layout
      className="border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-200"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-8">
            <PaymentMethodImage 
              src={method.secure_thumbnail || method.thumbnail}
              alt={method.name}
              displayName={getDisplayName(method.name)}
            />
          </div>
          
          <div className="text-left">
            <p className="font-bold text-gray-900">{getDisplayName(method.name)}</p>
            {bestOption && (
              <p className="text-xs text-gray-500 mt-0.5">
                Desde ${bestOption.installment_amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                {(bestOption.interest_rate ?? 0) === 0 ? ' sin interés' : ` +${((bestOption.interest_rate ?? 0) * 100).toFixed(1)}%`}
              </p>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="text-gray-400" size={20} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="px-5 py-4 space-y-2">
              {method.payer_costs && method.payer_costs.length > 0 ? (
                method.payer_costs.map((cost) => {
                  const hasInterest = cost.interest_rate > 0;
                  const totalAmount =
                    cost.total_amount ?? cost.installment_amount * cost.installments;
                  const extraInterest = Math.max(0, totalAmount - amount);

                  return (
                    <motion.div
                      key={`${method.payment_method_id}-${cost.installments}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg bg-white border border-gray-100 hover:border-primary-200 transition-all duration-200 cursor-pointer hover:shadow-sm"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-semibold text-gray-900">
                          {cost.installments === 1 ? '1 cuota' : `${cost.installments} cuotas`}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          hasInterest ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {hasInterest ? `+${(cost.interest_rate * 100).toFixed(1)}%` : 'Sin interés'}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Cuota:</p>
                          <p className="text-lg font-bold text-gray-900">
                            ${cost.installment_amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total a pagar:</p>
                          <p className={`font-semibold ${extraInterest > 0 ? 'text-red-700' : 'text-gray-800'}`}>
                            ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      
                      {extraInterest > 0.01 && (
                        <p className="text-xs text-red-600 mt-2 pt-2 border-t border-gray-100">
                          Interés: ${extraInterest.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-3">
                  Sin opciones disponibles
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Componente para mostrar detalles del método en grid
function MethodDetailsExpanded({
  method,
  amount,
  onClose,
}: {
  method: PaymentMethodInstallments;
  amount: number;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between pb-3 border-b border-primary-200">
        <div className="flex items-center gap-3">
          <img
            src={method.secure_thumbnail || method.thumbnail}
            alt={method.name}
            className="w-14 h-10 object-contain"
          />
          <div>
            <p className="font-bold text-gray-900">{method.name}</p>
            <p className="text-xs text-gray-600">Todas las cuotas disponibles</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-primary-200 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} className="text-gray-500 hover:text-gray-700" />
        </button>
      </div>

      {method.payer_costs && method.payer_costs.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {method.payer_costs.map((cost) => {
            const hasInterest = cost.interest_rate > 0;
            const totalAmount =
              cost.total_amount ?? cost.installment_amount * cost.installments;
            const extraInterest = Math.max(0, totalAmount - amount);

            return (
              <motion.div
                key={`${method.payment_method_id}-${cost.installments}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-primary-100 hover:border-primary-300 hover:bg-white transition-all duration-200"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {cost.installments === 1 ? '1 cuota' : `${cost.installments} cuotas`}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    hasInterest ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {hasInterest ? `+${(cost.interest_rate * 100).toFixed(1)}%` : 'Sin interés'}
                  </span>
                </div>
                
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cuota:</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${cost.installment_amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total:</p>
                    <p className={`font-semibold text-sm ${extraInterest > 0 ? 'text-red-700' : 'text-gray-800'}`}>
                      ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {extraInterest > 0.01 && (
                  <p className="text-xs text-red-600 mt-2 pt-2 border-t border-primary-100">
                    Interés: ${extraInterest.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-6">
          Sin opciones disponibles
        </p>
      )}
    </div>
  );
}