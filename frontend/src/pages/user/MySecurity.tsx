import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Monitor, Smartphone, LogOut, Shield } from 'lucide-react';
import { mockSessions } from '../../data/user';
import { useToast } from '../../context/ToastContext';

export default function MySecurity() {
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [sessions, setSessions] = useState(mockSessions);
  const { toast } = useToast();

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Contraseña actualizada correctamente');
    (e.target as HTMLFormElement).reset();
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
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="button" onClick={() => toggle(f.key as keyof typeof show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show[f.key as keyof typeof show] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" className="btn-primary text-sm py-2.5 px-6">Actualizar contraseña</button>
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
