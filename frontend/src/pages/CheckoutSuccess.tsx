import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, MapPin, Clock, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

// Datos del depósito (mismo que en Checkout.tsx)
const DEPOSITO = {
  address: 'Viamonte 1261, B° Pueyrredón',
  city: 'Córdoba, Argentina',
  hours: 'Lun–Vie 9:00–18:00 · Sáb 9:00–13:00',
  mapsUrl: 'https://www.google.com/maps/search/Viamonte+1261+Barrio+Pueyrredon+Cordoba+Argentina',
};

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
  const { clearCart } = useCart();
  const { refetch } = useProducts();

  // Ref para asegurarnos de ejecutar solo una vez (StrictMode doble render)
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;

    // Siempre limpiar el carrito al llegar a la página de éxito
    clearCart();

    // Limpiar sessionStorage del checkout pendiente
    sessionStorage.removeItem('pendingCheckout');

    // Refrescar productos para reflejar stock actualizado
    refetch();

    console.log('✅ Pago exitoso:', { paymentId, externalReference });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    {
      icon: '📧',
      title: 'Confirmación por email',
      desc: 'Recibirás un email con los detalles de tu pedido',
    },
    {
      icon: '📦',
      title: 'Preparación del pedido',
      desc: 'Prepararemos tu pedido para el retiro en depósito',
    },
    {
      icon: '🔔',
      title: 'Te avisamos cuando esté listo',
      desc: 'Te notificaremos por email cuando puedas pasar a retirarlo',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        {/* Icono animado */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }}
          className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100"
        >
          <CheckCircle size={56} className="text-green-500" />
        </motion.div>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            ¡Pago exitoso! 🎉
          </h1>
          <p className="text-lg text-gray-500 mb-1">
            Tu pedido fue procesado correctamente.
          </p>
          {externalReference && (
            <p className="text-sm text-gray-400 mb-1">
              Pedido: <span className="font-mono font-semibold text-gray-600">#{externalReference}</span>
            </p>
          )}
          {paymentId && (
            <p className="text-xs text-gray-400 mb-6">
              ID de pago MercadoPago: <span className="font-mono">{paymentId}</span>
            </p>
          )}
          {!externalReference && !paymentId && (
            <p className="text-sm text-gray-400 mb-6">
              Recibirás un email de confirmación a la brevedad.
            </p>
          )}
        </motion.div>

        {/* Próximos pasos */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-left"
        >
          <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
            <Package size={20} />
            Próximos pasos
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 text-base">
                  {step.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-green-900">{step.title}</p>
                  <p className="text-sm text-green-700">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info de retiro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 text-left"
        >
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <MapPin size={18} />
            Dónde retirar tu pedido
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="flex-shrink-0 text-blue-500" />
              <span className="font-medium">{DEPOSITO.address}</span>
              <span className="text-blue-600">{DEPOSITO.city}</span>
            </p>
            <p className="flex items-center gap-2">
              <Clock size={14} className="flex-shrink-0 text-blue-500" />
              {DEPOSITO.hours}
            </p>
            <a
              href={DEPOSITO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs mt-1 underline underline-offset-2"
            >
              Ver en Google Maps →
            </a>
          </div>
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            to="/carrito"
            state={{ tab: 'pedidos' }}
            className="btn-secondary px-6 py-3 flex items-center justify-center gap-2"
          >
            <Package size={16} />
            Ver mis pedidos
          </Link>
          <Link
            to="/tienda"
            className="btn-primary px-6 py-3 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Seguir comprando
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
