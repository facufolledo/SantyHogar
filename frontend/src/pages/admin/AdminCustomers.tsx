import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { fetchCustomers, deleteCustomer, type CustomerList } from '../../api/customersApi';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${customerName}?`)) {
      return;
    }

    setDeleting(customerId);
    try {
      await deleteCustomer(customerId);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      alert('✅ Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error al eliminar el cliente'}`);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-AR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">Clientes</h2>
          <p className="text-sm text-gray-500">{customers.length} clientes registrados</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nuevo Cliente
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          placeholder="Buscar cliente..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" 
        />
      </div>

      <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700/60">
              <tr>
                {['Cliente', 'Teléfono', 'Pedidos', 'Total gastado', 'Miembro desde', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600/20 text-primary-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-200">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{c.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{c.orderCount} pedidos</td>
                    <td className="px-4 py-3 font-semibold text-white">{formatPrice(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.registeredAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deleting === c.id}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
