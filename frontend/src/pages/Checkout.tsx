import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Smartphone, MapPin, Clock, Phone, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useToast } from '../context/ToastContext';
import { isApiConfigured, isMpCheckoutEnabled } from '../api/config';
import { fetchAddresses, type AddressResponse } from '../api/customersApi';
import ProvinceSelect from '../components/ProvinceSelect';
import CitySelect from '../components/CitySelect';
import SaveAddressModal from '../components/SaveAddressModal';

/** Sin MP online: pedido solo en el navegador (o API sin checkout MP). */
function isLocalCheckoutMode(): boolean {
  return !isMpCheckoutEnabled() || !isApiConfigured();
}
import { ApiError } from '../api/client';
import { createOrderApi } from '../api/ordersApi';
import { createCheckoutPreference } from '../api/checkoutApi';
import { formatPrice } from '../utils/format';
import type { CartItem } from '../context/CartContext';

type Step = 'form' | 'payment' | 'confirm';

// ─── Datos del depósito ───────────────────────────────────────────────────────
// Reemplazá con la dirección real cuando la tengas
const DEPOSITO = {
  address: 'Viamonte 1261, B° Pueyrredón',
  city: 'Córdoba, Argentina',
  hours: 'Lun–Vie 9:00–18:00 · Sáb 9:00–13:00',
  phone: '351 200-5937',
  mapsUrl: 'https://www.google.com/maps/search/Viamonte+1261+Barrio+Pueyrredon+Cordoba+Argentina',
};

const STEPS = ['Datos', 'Pago', 'Confirmación'];

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder, pushOrder } = useOrders();
  const { toast } = useToast();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void navigate;

  const [step, setStep] = useState<Step>('form');
  const [payMethod] = useState<'mp'>('mp'); // Solo MercadoPago
  const [confirmedOrder, setConfirmedOrder] = useState<{ orderNumber: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  // Direcciones guardadas
  const [savedAddresses, setSavedAddresses] = useState<AddressResponse[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    province: '',
    zip: '',
  });
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [showSaveAddressModal, setShowSaveAddressModal] = useState(false);

  // Cargar direcciones guardadas si el usuario está logueado
  useEffect(() => {
    if (user?.customerId) {
      setLoadingAddresses(true);
      fetchAddresses(user.customerId)
        .then((addresses) => {
          setSavedAddresses(addresses);
          // Seleccionar la dirección principal por defecto
          const primary = addresses.find(a => a.isPrimary);
          if (primary) {
            setSelectedAddressId(primary.id);
            setShippingAddress({
              street: primary.street,
              city: primary.city,
              province: primary.province,
              zip: primary.zip,
            });
          }
        })
        .catch((err) => {
          console.error('Error al cargar direcciones:', err);
        })
        .finally(() => setLoadingAddresses(false));
    }
  }, [user?.customerId]);

  const grandTotal = total;
  const stepIndex = ['form', 'payment', 'confirm'].indexOf(step);
  const localCheckout = isLocalCheckoutMode();
  const mercadoPagoOnline =
    isMpCheckoutEnabled() && isApiConfigured() && payMethod === 'mp';

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    
    if (addressId === 'new') {
      // Limpiar formulario para nueva dirección
      setShippingAddress({
        street: '',
        city: '',
        province: '',
        zip: '',
      });
    } else {
      // Cargar dirección seleccionada
      const address = savedAddresses.find(a => a.id === addressId);
      if (address) {
        setShippingAddress({
          street: address.street,
          city: address.city,
          province: address.province,
          zip: address.zip,
        });
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si el usuario está logueado y está usando una dirección nueva
    if (user?.customerId && selectedAddressId === 'new') {
      // Verificar si la dirección es diferente a las guardadas
      const isDifferent = !savedAddresses.some(addr => 
        addr.street.trim().toLowerCase() === shippingAddress.street.trim().toLowerCase() &&
        addr.city.trim().toLowerCase() === shippingAddress.city.trim().toLowerCase() &&
        addr.province.trim().toLowerCase() === shippingAddress.province.trim().toLowerCase() &&
        addr.zip.trim() === shippingAddress.zip.trim()
      );

      if (isDifferent && !saveNewAddress) {
        // Mostrar modal para preguntar si quiere guardar
        setShowSaveAddressModal(true);
        return; // No avanzar hasta que el usuario decida
      }
    }
    
    setStep('payment');
  };

  const handleSaveAddress = (label: string) => {
    setNewAddressLabel(label);
    setSaveNewAddress(true);
    setShowSaveAddressModal(false);
    setStep('payment');
  };

  const handleSkipSaveAddress = () => {
    setShowSaveAddressModal(false);
    setStep('payment');
  };

  const handlePay = async () => {
    const useMercadoPagoRedirect =
      isMpCheckoutEnabled() && isApiConfigured() && payMethod === 'mp';

    if (useMercadoPagoRedirect) {
      setSubmitting(true);
      try {
        // Usar el nuevo endpoint de Checkout Pro
        const response = await createCheckoutPreference({
          items: items.map(({ product, quantity }) => ({
            product_id: product.id,
            quantity,
          })),
          customer_email: form.email,
          customer_name: form.name,
          customer_phone: form.phone,
        });
        
        // Guardar dirección nueva si el usuario lo solicitó
        if (saveNewAddress && user?.customerId && newAddressLabel) {
          try {
            const { createAddress } = await import('../api/customersApi');
            await createAddress(user.customerId, {
              label: newAddressLabel,
              street: shippingAddress.street,
              city: shippingAddress.city,
              province: shippingAddress.province,
              zip: shippingAddress.zip,
              isPrimary: savedAddresses.length === 0,
            });
            console.log('✅ Dirección guardada correctamente');
          } catch (err) {
            console.error('Error al guardar dirección:', err);
          }
        }
        
        // NO limpiar carrito aquí - se limpiará cuando vuelva exitoso
        // clearCart(); ❌ REMOVIDO
        
        // Guardar items en sessionStorage para recuperar si vuelve atrás
        sessionStorage.setItem('pendingCheckout', JSON.stringify({
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity
          })),
          timestamp: Date.now()
        }));
        
        // Redirigir a MercadoPago Checkout Pro
        // En testing usa sandbox_init_point, en producción usa init_point
        const checkoutUrl = import.meta.env.MODE === 'production' 
          ? response.init_point 
          : response.sandbox_init_point;
        
        window.location.href = checkoutUrl;
        
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'No se pudo iniciar el pago. Intentá de nuevo.';
        toast(msg, 'error');
        setSubmitting(false);
      }
      return;
    }

    if (isMpCheckoutEnabled() && isApiConfigured() && payMethod === 'fiserv') {
      toast('Mercado Pago es el único método con cobro online por ahora. Elegí MP o desactivá VITE_ENABLE_MP_CHECKOUT para modo local.', 'error');
      return;
    }

    // Modo local: guardar orden en localStorage Y en el backend
    setSubmitting(true);
    try {
      // Intentar guardar en el backend si está configurado
      if (isApiConfigured()) {
        try {
          const res = await createOrderApi({
            userId: user?.id ?? null,
            customerName: form.name,
            customerEmail: form.email,
            customerPhone: form.phone,
            items: items.map(({ product, quantity }) => ({
              product_id: product.id,
              quantity,
            })),
            paymentMethod: payMethod,
          });
          
          // Guardar dirección nueva si el usuario lo solicitó
          if (saveNewAddress && user?.customerId && newAddressLabel) {
            try {
              const { createAddress } = await import('../api/customersApi');
              await createAddress(user.customerId, {
                label: newAddressLabel,
                street: shippingAddress.street,
                city: shippingAddress.city,
                province: shippingAddress.province,
                zip: shippingAddress.zip,
                isPrimary: savedAddresses.length === 0, // Primera dirección es principal
              });
              console.log('✅ Dirección guardada correctamente');
            } catch (err) {
              console.error('Error al guardar dirección:', err);
              // No bloqueamos el checkout si falla guardar la dirección
            }
          }
          
          // Orden guardada en backend exitosamente
          clearCart();
          setConfirmedOrder({ orderNumber: res.orderNumber });
          setStep('confirm');
          return;
        } catch (e) {
          // Si falla el backend, continuar con modo local
          console.warn('No se pudo guardar en el backend, usando modo local:', e);
        }
      }
      
      // Fallback: modo local (localStorage)
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
    } finally {
      setSubmitting(false);
    }
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

                {/* Dirección de envío */}
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Dirección de envío</h2>
                  
                  {/* Selector de direcciones guardadas */}
                  {user?.customerId && savedAddresses.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar dirección guardada
                      </label>
                      <select
                        value={selectedAddressId}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className="input-field"
                      >
                        {savedAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.label} - {addr.street}, {addr.city}
                          </option>
                        ))}
                        <option value="new">+ Nueva dirección</option>
                      </select>
                    </div>
                  )}

                  {/* Formulario de dirección */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Calle y número</label>
                      <input
                        type="text"
                        required
                        placeholder="Av. Corrientes 1234"
                        value={shippingAddress.street}
                        onChange={e => setShippingAddress(p => ({ ...p, street: e.target.value }))}
                        disabled={selectedAddressId !== 'new' && savedAddresses.length > 0}
                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                      <ProvinceSelect
                        value={shippingAddress.province}
                        onChange={(value) => setShippingAddress(p => ({ ...p, province: value, city: '' }))}
                        required
                        disabled={selectedAddressId !== 'new' && savedAddresses.length > 0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                      <CitySelect
                        province={shippingAddress.province}
                        value={shippingAddress.city}
                        onChange={(value) => setShippingAddress(p => ({ ...p, city: value }))}
                        required
                        disabled={selectedAddressId !== 'new' && savedAddresses.length > 0}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                      <input
                        type="text"
                        required
                        placeholder="1043"
                        value={shippingAddress.zip}
                        onChange={e => setShippingAddress(p => ({ ...p, zip: e.target.value }))}
                        disabled={selectedAddressId !== 'new' && savedAddresses.length > 0}
                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {user?.customerId && (
                    <p className="text-xs text-gray-500 mt-3">
                      💡 Podés gestionar tus direcciones desde <Link to="/cuenta/direcciones" className="text-primary-600 hover:underline">Mi cuenta</Link>
                    </p>
                  )}
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
                  {localCheckout && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-medium">Modo local</p>
                      <p className="text-amber-800/90 mt-0.5">
                        No hay cobro online: el pedido queda guardado en este navegador. Al publicar el sitio podrás activar el pago con Mercado Pago.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 mb-5">
                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary-600 bg-primary-50 text-left">
                      <Smartphone size={22} className="text-blue-500" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">Mercado Pago</p>
                        <p className="text-xs text-gray-500">Tarjeta, débito, transferencia, MP</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-5">
                    <p className="font-medium text-gray-800 mb-1">🔵 Mercado Pago</p>
                    {mercadoPagoOnline ? (
                      <p>Serás redirigido a Mercado Pago para completar el pago.</p>
                    ) : (
                      <p>
                        {localCheckout
                          ? 'Pago en efectivo al retirar en depósito.'
                          : 'Serás redirigido a Mercado Pago para completar el pago.'}
                      </p>
                    )}
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
                    <button type="button" onClick={() => setStep('form')} className="btn-secondary flex-1" disabled={submitting}>Volver</button>
                    <button type="button" onClick={() => void handlePay()} className="btn-primary flex-1 disabled:opacity-60" disabled={submitting}>
                      {submitting
                        ? mercadoPagoOnline
                          ? 'Redirigiendo…'
                          : 'Guardando…'
                        : mercadoPagoOnline
                          ? `Confirmar y pagar ${formatPrice(grandTotal)}`
                          : `Confirmar pedido · ${formatPrice(grandTotal)}`}
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

      {/* Modal para guardar dirección */}
      <SaveAddressModal
        isOpen={showSaveAddressModal}
        onClose={handleSkipSaveAddress}
        onSave={handleSaveAddress}
        address={shippingAddress}
      />
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
