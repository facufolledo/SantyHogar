import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, MapPin, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
  const { clearCart } = useCart();

  useEffect(() => {
    // Limpiar carrito cuando el pago es exitoso
    clearCart();
    
    // Limpiar sessionStorage
    sessionStorage.removeItem('pendingCheckout');
    
    // Opcional: Trackear conversión en analytics
    console.log('✅ Pago exitoso:', { paymentId, externalReference });
  }, [paymentId, externalReference, clearCart]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Icono de éxito */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={48} className="text-green-600" />
        </motion.div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Pago Exitoso!
        </h1>
        
        <p className="text-lg text-gray-600 mb-2">
          Tu pedido ha sido procesado correctamente
        </p>
        
        {externalReference && (
          <p className="text-sm text-gray-500 mb-8">
            Número de referencia: <span className="font-mono font-semibold">{externalReference}</span>
          </p>
        )}

        {/* Info del pedido */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <Package size={20} />
            Próximos pasos
          </h2>
          
          <div className="space-y-3 text-sm text-green-800">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Confirmación por email</p>
                <p className="text-green-700">Recibirás un email con los detalles de tu pedido</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Preparación del pedido</p>
                <p className="text-green-700">Prepararemos tu pedido para el retiro</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Notificación de retiro</p>
                <p className="text-green-700">Te avisaremos cuando esté listo para retirar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info de retiro */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <MapPin size={18} />
            Retiro en depósito
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="flex-shrink-0" />
              Viamonte 1261, B° Pueyrredón, Córdoba
            </p>
            <p className="flex items-center gap-2">
              <Clock size={14} className="flex-shrink-0" />
              Lun–Vie 9:00–18:00 · Sáb 9:00–13:00
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/cuenta/pedidos"
            className="btn-secondary px-6 py-3"
          >
            Ver mis pedidos
          </Link>
          <Link
            to="/"
            className="btn-primary px-6 py-3"
          >
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
