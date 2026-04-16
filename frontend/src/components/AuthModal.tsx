import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { UserRole } from '../context/AuthContext';

interface Props {
  onClose: () => void;
  onSuccess?: (role: UserRole) => void;
}

type Mode = 'login' | 'register';

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { login, register } = useAuth();
  const { toast } = useToast();

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);

    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Error inesperado');
      return;
    }

    toast(mode === 'login' ? '¡Bienvenido de vuelta!' : '¡Cuenta creada con éxito!');
    // Pass the role so the caller can redirect accordingly
    onSuccess?.(result.role!);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gray-900 px-6 pt-8 pb-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-black">S</span>
          </div>
          <h2 className="text-white font-bold text-lg">
            {mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'login' ? 'Accedé a tu cuenta de Santy Hogar' : 'Registrate gratis en Santy Hogar'}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          {/* Hint for demo */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700">
            <p className="font-semibold mb-0.5">Cuentas de prueba:</p>
            <p>Admin: admin@santyhogar.com / admin123</p>
            <p>Cliente: maria@email.com / 123456</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
                  <input
                    type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Tu nombre"
                    className="input-field"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="tu@email.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••" minLength={6}
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-1">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-primary-600 font-semibold hover:underline">
              {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
