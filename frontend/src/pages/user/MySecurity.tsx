import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Monitor, Smartphone, LogOut, Shield, Loader } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

export default function MySecurity() {
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [sessions, setSessions] = useState([]);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (passwords.new.length < 8) {
      toast('La nueva contraseña debe tener mínimo 8 caracteres', 'error');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (passwords.new === passwords.current) {
      toast('La nueva contraseña debe ser diferente a la actual', 'error');
      return;
    }

    setLoading(true);
    try {
      // Primero, intentar loguear con la contraseña actual para verificarla
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user?.email) {
        toast('No se pudo obtener tu email', 'error');
        setLoading(false);
        return;
      }

      // Verificar contraseña actual intentando loguear
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.data.user.email,
        password: passwords.current,
      });

      if (signInError) {
        toast('Contraseña actual incorrecta', 'error');
        setLoading(false);
        return;
      }

      // Cambiar la contraseña
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) {
        toast('Error al cambiar contraseña: ' + error.message, 'error');
        setLoading(false);
        return;
      }

      toast('Contraseña actualizada correctamente');
      setPasswords({ current: '', new: '', confirm: '' });
      setShow({ current: false, new: false, confirm: false });
    } catch (err) {
      console.error('Error:', err);
      toast('Error al cambiar contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast('Sesión cerrada', 'info');
  };

  const toggle = (field: keyof typeof show) => setShow(p => ({ ...p, [field]: !p[field] }));

  return (
    <div className="space-y-5">
      {/* Change password */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-primary-600" />
          <h2 className="font-bold text-gray-900">Cambiar contraseña</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          {[
            { key: 'current', label: 'Contraseña actual', placeholder: '••••••••' },
            { key: 'new', label: 'Nueva contraseña', placeholder: 'Mínimo 8 caracteres' },
            { key: 'confirm', label: 'Confirmar nueva contraseña', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="relative">
                <input
                  type={show[f.key as keyof typeof show] ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder={f.placeholder}
                  value={passwords[f.key as keyof typeof passwords]}
                  onChange={(e) => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                  disabled={loading}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button type="button" onClick={() => toggle(f.key as keyof typeof show)} disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                  {show[f.key as keyof typeof show] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" /> Actualizando...
              </>
            ) : (
              'Actualizar contraseña'
            )}
          </button>
        </form>
      </div>

      {/* Sessions */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Sesiones activas</h2>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                {s.device.includes('iPhone') || s.device.includes('Android')
                  ? <Smartphone size={16} className="text-gray-600" />
                  : <Monitor size={16} className="text-gray-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{s.device}</p>
                <p className="text-xs text-gray-400">{s.location} · {s.lastActive}</p>
              </div>
              {s.current ? (
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Actual</span>
              ) : (
                <button onClick={() => revokeSession(s.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                  <LogOut size={13} /> Cerrar
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
