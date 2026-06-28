import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Star, X, Check, Loader } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type AddressResponse,
  type CreateAddressRequest,
  type UpdateAddressRequest,
} from '../../api/customersApi';

export default function MyAddresses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AddressResponse | null>(null);

  const emptyForm = { label: '', street: '', city: '', province: '', zip: '' };
  const [form, setForm] = useState(emptyForm);

  // Cargar direcciones cuando el usuario está listo
  useEffect(() => {
    if (!user?.customerId) {
      setLoading(false);
      return;
    }
    
    loadAddresses();
  }, [user?.customerId]);

  // Recargar direcciones cuando volvemos a esta página
  useEffect(() => {
    if (location.pathname === '/cuenta/direcciones' && user?.customerId) {
      loadAddresses();
    }
  }, [location.pathname, user?.customerId]);

  const loadAddresses = async () => {
    if (!user?.customerId) return;
    
    try {
      setLoading(true);
      const data = await fetchAddresses(user.customerId);
      setAddresses(data);
      setLoading(false);
    } catch (err) {
      console.error('Error cargando direcciones:', err);
      setLoading(false);
      toast('Error cargando direcciones', 'error');
    }
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (a: AddressResponse) => { setEditing(a); setForm({ label: a.label, street: a.street, city: a.city, province: a.province, zip: a.zip }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.customerId) {
      toast('Usuario no autenticado', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        // Actualizar dirección existente
        const updateData: UpdateAddressRequest = { ...form };
        await updateAddress(user.customerId, editing.id, updateData);
        setAddresses(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a));
        toast('Dirección actualizada');
      } else {
        // Crear nueva dirección
        const createData: CreateAddressRequest = { ...form, isPrimary: addresses.length === 0 };
        const newAddr = await createAddress(user.customerId, createData);
        setAddresses(prev => [...prev, newAddr]);
        toast('Dirección agregada');
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Error guardando dirección:', err);
      toast((err as any).message || 'Error al guardar dirección', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.customerId) return;

    try {
      await deleteAddress(user.customerId, id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast('Dirección eliminada', 'error');
    } catch (err) {
      console.error('Error eliminando dirección:', err);
      toast('Error al eliminar dirección', 'error');
    }
  };

  const setPrimary = async (id: string) => {
    if (!user?.customerId) return;

    try {
      await updateAddress(user.customerId, id, { isPrimary: true });
      setAddresses(prev => prev.map(a => ({ ...a, isPrimary: a.id === id })));
      toast('Dirección principal actualizada');
    } catch (err) {
      console.error('Error actualizando dirección principal:', err);
      toast('Error al actualizar dirección principal', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Mis direcciones</h2>
        <button 
          onClick={openNew} 
          disabled={loading}
          className="flex items-center gap-1.5 text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={15} /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader size={20} className="animate-spin mr-2" />
          Cargando direcciones...
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {addresses.map((addr, i) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className={`card p-4 flex items-start gap-4 ${addr.isPrimary ? 'ring-2 ring-primary-200' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{addr.label}</span>
                    {addr.isPrimary && (
                      <span className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        <Star size={10} className="fill-primary-600" /> Principal
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{addr.street}</p>
                  <p className="text-sm text-gray-500">{addr.city}, {addr.province} {addr.zip}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!addr.isPrimary && (
                    <button onClick={() => setPrimary(addr.id)} title="Marcar como principal" className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors">
                      <Star size={15} />
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {addresses.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📍</p>
              <p className="text-sm">No tenés direcciones guardadas</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">{editing ? 'Editar dirección' : 'Nueva dirección'}</h3>
                <button onClick={() => setModalOpen(false)} disabled={submitting}><X size={20} className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-3">
                {[
                  { key: 'label', label: 'Etiqueta', placeholder: 'Casa, Trabajo...' },
                  { key: 'street', label: 'Calle y número', placeholder: 'Av. Corrientes 1234' },
                  { key: 'city', label: 'Ciudad', placeholder: 'Buenos Aires' },
                  { key: 'province', label: 'Provincia', placeholder: 'Buenos Aires' },
                  { key: 'zip', label: 'Código postal', placeholder: '1043' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input required placeholder={f.placeholder} 
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      disabled={submitting}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="btn-secondary flex-1 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1">
                    {submitting ? (
                      <>
                        <Loader size={14} className="animate-spin" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Guardar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
