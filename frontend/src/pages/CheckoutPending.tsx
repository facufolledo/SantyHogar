import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, Package, AlertCircle } from 'lucide-react';

export default function CheckoutPending() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    // Opcional: Trackear pago pendiente en analytics
    console.log('⏳ Pago pendiente:', { paymentId, externalReference });
  }, [paymentId, externalReference]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Icono de pendiente */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Clock size={48} className="text-yellow-600" />
        </motion.div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Pago Pendiente
        </h1>
        
        <p className="text-lg text-gray-600 mb-2">
          Tu pago está siendo procesado
        </p>
        
        {externalReference && (
          <p className="text-sm text-gray-500 mb-8">
            Número de referencia: <span className="font-mono font-semibold">{externalReference}</span>
          </p>
        )}

        {/* Info del estado pendiente */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            ¿Qué significa esto?
          </h2>
          
          <div className="space-y-3 text-sm text-yellow-800">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Pago en proceso</p>
                <p className="text-yellow-700">Tu pago está siendo verificado por el medio de pago seleccionado</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Tiempo de espera</p>
                <p className="text-yellow-700">Puede demorar entre 2 y 3 días hábiles en confirmarse</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Te mantendremos informado</p>
                <p className="text-yellow-700">Recibirás un email cuando se confirme el pago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Medios de pago que pueden quedar pendientes */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Package size={18} />
            Medios de pago con confirmación diferida
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Rapipago / Pago Fácil:</strong> Confirmación en 1-2 días hábiles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Transferencia bancaria:</strong> Confirmación en 1-3 días hábiles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Débito automático:</strong> Confirmación en 2-3 días hábiles</span>
            </li>
          </ul>
        </div>

        {/* Notificaciones */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Mail size={18} />
            Te notificaremos por email
          </h3>
          <div className="space-y-2 text-sm text-green-800">
            <p className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Cuando se confirme el pago</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Cuando tu pedido esté listo para retirar</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Si hay algún problema con el pago</span>
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

        {/* Ayuda */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            ¿Tenés dudas sobre tu pago?
          </p>
          <Link
            to="/contacto"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
          >
            Contactanos y te ayudamos
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
