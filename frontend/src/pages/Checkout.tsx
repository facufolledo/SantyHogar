import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, CreditCard, Smartphone, MapPin, Clock, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { formatPrice } from '../utils/format';
import type { CartItem } from '../context/CartContext';

type Step = 'form' | 'payment' | 'confirm';

// ─── Datos del depósito ───────────────────────────────────────────────────────
// Reemplazá con la dirección real cuando la tengas
const DEPOSITO = {
  address: 'Viamonte 1261, B° Pueyrredón',
  city: 'Córdoba, Argentina',
  hours: 'Lun–Vie 9:00–18:00 · Sáb 9:00–13:00',
  phone: '(011) 4000-0000',
  mapsUrl: 'https://www.google.com/maps/search/Viamonte+1261+Barrio+Pueyrredon+Cordoba+Argentina',
};

const STEPS = ['Datos', 'Pago', 'Confirmación'];

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void navigate;

  const [step, setStep] = useState<Step>('form');
  const [payMethod, setPayMethod] = useState<'mp' | 'fiserv'>('mp');
  const [confirmedOrder, setConfirmedOrder] = useState<{ orderNumber: string } | null>(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const grandTotal = total;
  const stepIndex = ['form', 'payment', 'confirm'].indexOf(step);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePay = () => {
    const order = createOrder({
      userId: user?.id || 'guest',
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      items: items as CartItem[],
      total: grandTotal,
      paymentMethod: payMethod,
    });
    clearCart();
    setConfirmedOrder({ orderNumber: order.orderNumber });
    setStep('confirm');
  };

  if (items.length === 0 && step !== 'confirm') return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <p className="text-gray-500 mb-4">No hay productos en el carrito</p>
      <Link to="/tienda" className="btn-primary inline-block">Ir a la tienda</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Steps */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 text-sm font-medium ${i === stepIndex ? 'text-primary-600' : i < stepIndex ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i === stepIndex ? 'bg-primary-600 text-white' : i < stepIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < 2 && <div className={`flex-1 max-w-16 h-0.5 transition-colors ${i < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Datos ── */}
        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleFormSubmit} className="lg:col-span-2 space-y-4">

                {/* Datos del comprador */}
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Datos del comprador</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                      <input type="text" required placeholder="Juan Pérez"
                        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" required placeholder="juan@email.com"
                        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input type="tel" required placeholder="011 1234-5678"
                        value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        className="input-field" />
                    </div>
                  </div>
                </div>

                {/* Retiro en depósito */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={18} className="text-primary-600" />
                    <h2 className="font-bold text-gray-900">Retiro en depósito</h2>
                  </div>
                  <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{DEPOSITO.address}</p>
                        <p className="text-sm text-gray-600">{DEPOSITO.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-primary-600 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{DEPOSITO.hours}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-primary-600 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{DEPOSITO.phone}</p>
                    </div>
                    <a href={DEPOSITO.mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium mt-1">
                      <MapPin size={14} /> Ver en Google Maps →
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Te avisaremos por email cuando tu pedido esté listo para retirar.
                  </p>
                </div>

                <button type="submit" className="w-full btn-primary">Continuar al pago</button>
              </form>

              <OrderSummary items={items} total={total} grandTotal={grandTotal} />
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Pago ── */}
        {step === 'payment' && (
          <motion.div key="payment" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Método de pago</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {[
                      { id: 'mp', icon: Smartphone, label: 'Mercado Pago', sub: 'Tarjeta, débito, MP', color: 'text-blue-500' },
                      { id: 'fiserv', icon: CreditCard, label: 'Fiserv', sub: 'Visa, Mastercard, Amex', color: 'text-green-500' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setPayMethod(opt.id as 'mp' | 'fiserv')}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${payMethod === opt.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <opt.icon size={22} className={opt.color} />
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-5">
                    <p className="font-medium text-gray-800 mb-1">
                      {payMethod === 'mp' ? '🔵 Mercado Pago' : '🟢 Fiserv'}
                    </p>
                    <p>Serás redirigido al portal de pago seguro para completar la transacción.</p>
                  </div>

                  {/* Recordatorio retiro */}
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                    <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-800">Retiro en depósito</p>
                      <p className="text-blue-600">{DEPOSITO.address} · {DEPOSITO.city}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('form')} className="btn-secondary flex-1">Volver</button>
                    <button onClick={handlePay} className="btn-primary flex-1">
                      Confirmar y pagar {formatPrice(grandTotal)}
                    </button>
                  </div>
                </div>
              </div>

              <OrderSummary items={items} total={total} grandTotal={grandTotal} />
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Confirmación ── */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
              <CheckCircle size={72} className="mx-auto text-green-500 mb-4" />
            </motion.div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Pedido confirmado!</h2>
            <p className="text-gray-500 mb-1">Te enviamos un email con los detalles.</p>
            <p className="text-sm text-gray-400 mb-6">
              Número de pedido: <span className="font-bold text-gray-700">#{confirmedOrder?.orderNumber}</span>
            </p>

            {/* Info retiro */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left mb-6 space-y-3">
              <p className="font-bold text-green-800 text-sm">📦 Próximo paso: retirá tu pedido</p>
              <div className="flex items-start gap-2 text-sm text-green-700">
                <MapPin size={15} className="mt-0.5 flex-shrink-0" />
                <span>{DEPOSITO.address}, {DEPOSITO.city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock size={15} className="flex-shrink-0" />
                <span>{DEPOSITO.hours}</span>
              </div>
              <p className="text-xs text-green-600">Te avisaremos por email cuando esté listo para retirar.</p>
            </div>

            <div className="flex gap-3 justify-center">
              <Link to="/cuenta/pedidos" className="btn-secondary text-sm px-6 py-2.5">Ver mis pedidos</Link>
              <Link to="/" className="btn-primary text-sm px-6 py-2.5">Volver al inicio</Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

const OrderSummary = ({ items, total, grandTotal }: { items: CartItem[]; total: number; grandTotal: number }) => (
  <div className="card p-5 h-fit sticky top-24">
    <h3 className="font-bold text-gray-900 mb-3 text-sm">Resumen ({items.length} {items.length === 1 ? 'producto' : 'productos'})</h3>
    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
      {items.map(({ product, quantity }) => (
        <div key={product.id} className="flex items-center gap-2 text-xs">
          <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
          <span className="flex-1 text-gray-600 line-clamp-1">{product.name}</span>
          <span className="font-medium text-gray-800">x{quantity}</span>
        </div>
      ))}
    </div>
    <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
      <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
      <div className="flex justify-between text-green-600 font-medium"><span>Envío</span><span>Retiro gratis</span></div>
      <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
        <span>Total</span><span>{formatPrice(grandTotal)}</span>
      </div>
    </div>
  </div>
);

export default Checkout;
