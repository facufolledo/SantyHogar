import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { formatDateArg } from '../../utils/dateUtils';
import ProvinceSelect from '../../components/ProvinceSelect';
import CitySelect from '../../components/CitySelect';
import {
  createCustomer,
  updateCustomer,
  fetchCustomerDetail,
  fetchCustomerOrders,
  type CustomerDetail,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
} from '../../api/customersApi';
import { ApiError } from '../../api/client';
import { formatPrice } from '../../utils/format';

type Mode = 'create' | 'edit' | 'view';

interface Props {
  customer: { id: string; name: string; email: string } | null;
  mode: Mode;
  onSave: (saved: CustomerDetail) => void;
  onClose: () => void;
}

const di =
  'w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

const diReadOnly =
  'w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 cursor-default';

interface OrderRow {
  id_orden?: string;
  numero_orden?: string;
  fecha_creacion?: string;
  total?: number;
  estado?: string;
}

export default function CustomerFormModal({ customer, mode, onSave, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  // View mode: order history
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load customer detail for edit/view modes
  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && customer?.id) {
      setLoadingDetail(true);
      fetchCustomerDetail(customer.id)
        .then((detail) => {
          setName(detail.name);
          setEmail(detail.email);
          setPhone(detail.phone || '');
          setAddress(detail.address || '');
          setCity(detail.city || '');
          setProvince(detail.province || '');
          setPostalCode(detail.postalCode || '');
          setNotes(detail.notes || '');
        })
        .catch((err) => {
          console.error('Error al cargar detalle del cliente:', err);
          setGeneralError('No se pudo cargar el detalle del cliente');
        })
        .finally(() => setLoadingDetail(false));
    }
  }, [mode, customer?.id]);

  // Load orders for view mode
  useEffect(() => {
    if (mode === 'view' && customer?.id) {
      setLoadingOrders(true);
      fetchCustomerOrders(customer.id)
        .then((data) => setOrders(data))
        .catch((err) => {
          console.error('Error al cargar pedidos:', err);
        })
        .finally(() => setLoadingOrders(false));
    }
  }, [mode, customer?.id]);

  const isView = mode === 'view';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;

    setEmailError('');
    setGeneralError('');
    setSaving(true);

    try {
      let saved: CustomerDetail;

      if (mode === 'create') {
        const data: CreateCustomerRequest = {
          name,
          email,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          province: province || undefined,
          postalCode: postalCode || undefined,
          notes: notes || undefined,
        };
        saved = await createCustomer(data);
      } else {
        const data: UpdateCustomerRequest = {
          name,
          email,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          province: province || undefined,
          postalCode: postalCode || undefined,
          notes: notes || undefined,
        };
        saved = await updateCustomer(customer!.id, data);
      }

      onSave(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('ya existe')) {
          setEmailError('Ya existe un cliente con ese email');
        } else {
          setGeneralError(msg);
        }
      } else {
        setGeneralError(
          error instanceof Error ? error.message : 'Error al guardar el cliente'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === 'create'
      ? 'Nuevo cliente'
      : mode === 'edit'
        ? 'Editar cliente'
        : 'Detalle del cliente';

  const formatDate = (dateString: string) => formatDateArg(dateString, 'date');

  const statusLabel = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      paid: { label: 'Pagado', cls: 'bg-green-500/20 text-green-400' },
      pending: { label: 'Pendiente', cls: 'bg-yellow-500/20 text-yellow-400' },
      cancelled: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400' },
      shipped: { label: 'Enviado', cls: 'bg-blue-500/20 text-blue-400' },
      delivered: { label: 'Entregado', cls: 'bg-emerald-500/20 text-emerald-400' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {loadingDetail ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500 text-sm">Cargando datos...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
              {/* General error */}
              {generalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {generalError}
                </div>
              )}

              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre *">
                  {isView ? (
                    <div className={diReadOnly}>{name || '-'}</div>
                  ) : (
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre completo"
                      className={di}
                    />
                  )}
                </Field>
                <Field label="Email *">
                  {isView ? (
                    <div className={diReadOnly}>{email || '-'}</div>
                  ) : (
                    <>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError('');
                        }}
                        placeholder="cliente@ejemplo.com"
                        className={`${di} ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {emailError && (
                        <p className="text-xs text-red-400 mt-1">{emailError}</p>
                      )}
                    </>
                  )}
                </Field>
              </div>

              {/* Phone */}
              <Field label="Teléfono">
                {isView ? (
                  <div className={diReadOnly}>{phone || '-'}</div>
                ) : (
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +54 11 1234-5678"
                    className={di}
                  />
                )}
              </Field>

              {/* Address */}
              <Field label="Dirección">
                {isView ? (
                  <div className={diReadOnly}>{address || '-'}</div>
                ) : (
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle y número"
                    className={di}
                  />
                )}
              </Field>

              {/* City, Province, Postal Code */}
              <div className="grid grid-cols-3 gap-4">
                <Field label="Provincia">
                  {isView ? (
                    <div className={diReadOnly}>{province || '-'}</div>
                  ) : (
                    <ProvinceSelect
                      value={province}
                      onChange={(value) => {
                        setProvince(value);
                        setCity(''); // Reset city when province changes
                      }}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  )}
                </Field>
                <Field label="Ciudad">
                  {isView ? (
                    <div className={diReadOnly}>{city || '-'}</div>
                  ) : (
                    <CitySelect
                      province={province}
                      value={city}
                      onChange={setCity}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  )}
                </Field>
                <Field label="Código postal">
                  {isView ? (
                    <div className={diReadOnly}>{postalCode || '-'}</div>
                  ) : (
                    <input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="CP"
                      className={di}
                    />
                  )}
                </Field>
              </div>

              {/* Notes */}
              <Field label="Notas">
                {isView ? (
                  <div className={`${diReadOnly} min-h-[60px]`}>{notes || '-'}</div>
                ) : (
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas internas sobre el cliente..."
                    className={`${di} resize-none`}
                  />
                )}
              </Field>

              {/* Order history (view mode only) */}
              {isView && (
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">
                    Historial de pedidos
                  </h4>
                  {loadingOrders ? (
                    <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      Cargando pedidos...
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">
                      Este cliente no tiene pedidos registrados.
                    </p>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-700/60">
                          <tr>
                            {['N° Orden', 'Fecha', 'Total', 'Estado'].map((h) => (
                              <th
                                key={h}
                                className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/40">
                          {orders.map((o, i) => (
                            <tr key={o.id_orden || i} className="hover:bg-gray-700/30 transition-colors">
                              <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">
                                {o.numero_orden || '-'}
                              </td>
                              <td className="px-4 py-2.5 text-gray-400">
                                {o.fecha_creacion ? formatDate(o.fecha_creacion) : '-'}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-white">
                                {o.total != null ? formatPrice(o.total) : '-'}
                              </td>
                              <td className="px-4 py-2.5">
                                {o.estado ? statusLabel(o.estado) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0">
              {isView ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 text-sm py-2.5 rounded-lg btn-primary"
                >
                  Cerrar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1 text-sm py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving
                      ? 'Guardando...'
                      : mode === 'create'
                        ? 'Crear cliente'
                        : 'Guardar cambios'}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);
