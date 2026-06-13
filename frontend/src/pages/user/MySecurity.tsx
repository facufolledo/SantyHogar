import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, CheckCircle, AlertCircle, Chrome } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function MySecurity() {
  const { user } = useAuth();
  const [show, setShow] = useState({ new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isGoogleUser = user?.provider === 'google';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);
    const newPass = formData.get('new') as string;
    const confirmPass = formData.get('confirm') as string;

    if (newPass !== confirmPass) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPass.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateError) {
        setError(updateError.message || 'Error al cambiar la contraseña');
        setSaving(false);
        return;
      }

      setSuccess(true);
      formEl.reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setError('Error inesperado. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (field: keyof typeof show) => setShow(p => ({ ...p, [field]: !p[field] }));

  return (
    <div className="space-y-5">

      {/* Si el usuario se autenticó con Google, mostrar aviso en lugar del formulario */}
      {isGoogleUser ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Shield size={18} className="text-primary-600" />
            <h2 className="font-bold text-gray-900">Seguridad</h2>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-10 h-10 bg-white border border-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Chrome size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Tu cuenta usa Google para iniciar sesión
              </p>
              <p className="text-sm text-blue-700 leading-relaxed">
                No tenés una contraseña configurada en SantyHogar. El acceso a tu cuenta
                está gestionado por Google. Para cambiar tu contraseña, hacelo desde
                tu configuración de cuenta Google.
              </p>
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
              >
                <Chrome size={14} />
                Ir a seguridad de Google →
              </a>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium">¡Contraseña actualizada!</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Tu contraseña se cambió correctamente. Usá la nueva contraseña en tu próximo inicio de sesión.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Change password form */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={18} className="text-primary-600" />
              <h2 className="font-bold text-gray-900">Cambiar contraseña</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              {[
                { key: 'new', label: 'Nueva contraseña', placeholder: 'Mínimo 8 caracteres' },
                { key: 'confirm', label: 'Confirmar nueva contraseña', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <div className="relative">
                    <input
                      name={f.key}
                      type={show[f.key as keyof typeof show] ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder={f.placeholder}
                      disabled={saving}
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50"
                    />
                    <button type="button" onClick={() => toggle(f.key as keyof typeof show)}
                      disabled={saving}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                      {show[f.key as keyof typeof show] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Password requirements */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">Requisitos de la contraseña:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Mínimo 8 caracteres</li>
                </ul>
                <p className="mt-2 text-gray-500">
                  💡 Como estás autenticado, podés cambiar tu contraseña sin necesidad de ingresar la actual.
                </p>
              </div>

              <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50">
                {saving ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
