import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, X, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateCustomer, fetchCustomerDetail } from '../../api/customersApi';

export default function MyAccount() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Load profile data from backend on mount
  useEffect(() => {
    if (!user?.customerId) return;
    setLoadingProfile(true);
    fetchCustomerDetail(user.customerId)
      .then((data) => {
        setForm({
          name: data.name || user.name || '',
          email: data.email || user.email || '',
          phone: data.phone || user.phone || '',
        });
      })
      .catch(() => {
        // Fallback to context data if backend fails
      })
      .finally(() => setLoadingProfile(false));
  }, [user?.customerId]);

  const handleSave = async () => {
    if (!user?.customerId) {
      // No customerId, just update context locally
      updateUser({ name: form.name, email: form.email, phone: form.phone });
      setEditing(false);
      toast('Datos actualizados correctamente');
      return;
    }

    setSaving(true);
    try {
      await updateCustomer(user.customerId, {
        name: form.name,
        email: form.email,
        phone: form.phone,
      });
      updateUser({ name: form.name, email: form.email, phone: form.phone });
      setEditing(false);
      toast('Datos actualizados correctamente');
    } catch (err: any) {
      const message = err?.message || 'Error al guardar los datos';
      toast(message, 'error');
      // Keep form in edit mode on error
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Nombre completo', icon: 'fi-rr-user', type: 'text' },
    { key: 'email', label: 'Email', icon: 'fi-rr-envelope', type: 'email' },
    { key: 'phone', label: 'Teléfono', icon: 'fi-rr-phone-call', type: 'tel' },
  ] as const;

  const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-black">
              {initials}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{form.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                <Calendar size={12} />
                <span>
                  Cliente desde {user?.joinedAt
                    ? new Date(user.joinedAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                    : 'hoy'}
                </span>
              </div>
            </div>
          </div>

          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
              <Edit2 size={14} /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex items-center gap-1 text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <X size={14} /> Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {fields.map(({ key, label, icon, type }) => (
            <motion.div key={key} layout className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <i className={`fi ${icon} text-primary-600 text-base leading-none`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                {editing ? (
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    disabled={saving}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800">{form[key] || <span className="text-gray-400 italic">No especificado</span>}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
