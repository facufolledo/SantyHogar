import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Trash2, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    master_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/admin/users`);
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error('Error loading admin users:', error);
      toast('Error al cargar usuarios admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name || !formData.master_password) {
      toast('Completa todos los campos', 'error');
      return;
    }

    if (formData.password.length < 6) {
      toast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear usuario');
      }

      toast('Usuario admin creado exitosamente', 'success');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', name: '', master_password: '' });
      loadAdminUsers();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast(error.message || 'Error al crear usuario admin', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async (userId: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar al admin ${email}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      toast('Usuario admin eliminado', 'success');
      loadAdminUsers();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast('Error al eliminar usuario admin', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Usuarios Admin</h2>
          <p className="text-sm text-gray-400 mt-1">Gestiona los usuarios con acceso al panel de administración</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <UserPlus size={18} />
          Crear Admin
        </button>
      </div>

      {/* Users List */}
      <div className="bg-gray-900 rounded-xl border border-gray-700/60 overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700/60">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Fecha de Creación
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60">
                {[1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-700 rounded" />
                          <div className="h-3 w-24 bg-gray-700 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-48 bg-gray-700 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-36 bg-gray-700 rounded" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 w-20 bg-gray-700 rounded ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Shield size={48} className="mx-auto mb-3 opacity-20" />
            <p>No hay usuarios admin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700/60">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Fecha de Creación
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Shield size={12} />
                            Administrador
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteAdmin(user.id, user.email)}
                        className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl border border-gray-700/60 w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-700/60">
              <h3 className="text-lg font-bold text-white">Crear Usuario Admin</h3>
              <p className="text-sm text-gray-400 mt-1">Este usuario tendrá acceso completo al panel de administración</p>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User size={14} className="inline mr-1" />
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail size={14} className="inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@santyhogar.com"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock size={14} className="inline mr-1" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
              </div>

              {/* Master Password */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  <Shield size={14} className="inline mr-1" />
                  Contraseña Maestra
                </label>
                <div className="relative">
                  <input
                    type={showMasterPassword ? 'text' : 'password'}
                    value={formData.master_password}
                    onChange={(e) => setFormData({ ...formData, master_password: e.target.value })}
                    placeholder="Contraseña maestra del sistema"
                    className="w-full px-4 py-2 bg-gray-800 border border-yellow-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showMasterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-yellow-500/70 mt-1">
                  Solo el dueño del sistema conoce esta contraseña
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ email: '', password: '', name: '', master_password: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {creating ? 'Creando...' : 'Crear Admin'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
