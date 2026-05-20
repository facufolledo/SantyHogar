import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, CreditCard, HelpCircle } from 'lucide-react';

export default function CheckoutFailure() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    // Opcional: Trackear fallo en analytics
    console.log('❌ Pago fallido:', { paymentId, externalReference });
  }, [paymentId, externalReference]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Icono de error */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle size={48} className="text-red-600" />
        </motion.div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Pago Rechazado
        </h1>
        
        <p className="text-lg text-gray-600 mb-2">
          No se pudo procesar tu pago
        </p>
        
        {externalReference && (
          <p className="text-sm text-gray-500 mb-8">
            Referencia: <span className="font-mono font-semibold">{externalReference}</span>
          </p>
        )}

        {/* Razones comunes */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <HelpCircle size={20} />
            Razones comunes de rechazo
          </h2>
          
          <div className="space-y-3 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Fondos insuficientes</p>
                <p className="text-red-700">Verificá que tu tarjeta tenga saldo disponible</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Datos incorrectos</p>
                <p className="text-red-700">Revisá el número de tarjeta, CVV y fecha de vencimiento</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Límite de compra excedido</p>
                <p className="text-red-700">Contactá a tu banco para aumentar el límite</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">4</span>
              </div>
              <div>
                <p className="font-medium">Tarjeta vencida o bloqueada</p>
                <p className="text-red-700">Verificá el estado de tu tarjeta con tu banco</p>
              </div>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <CreditCard size={18} />
            ¿Qué podés hacer?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Intentá nuevamente con otra tarjeta o medio de pago</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Verificá los datos de tu tarjeta y volvé a intentar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Contactá a tu banco para verificar el estado de tu tarjeta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Si el problema persiste, contactanos para ayudarte</span>
            </li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/checkout"
            className="btn-primary px-6 py-3 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Intentar nuevamente
          </Link>
          <Link
            to="/contacto"
            className="btn-secondary px-6 py-3"
          >
            Contactar soporte
          </Link>
        </div>

        {/* Link al carrito */}
        <div className="mt-6">
          <Link
            to="/carrito"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Volver al carrito
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
