import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, Save, AlertCircle, Filter, TrendingUp } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { formatPrice } from '../../utils/format';
import ProductsErrorBanner from '../../components/ProductsErrorBanner';
import { updateProductPrice } from '../../api/productsApi';

const catColors: Record<string, string> = {
  electrodomesticos: 'bg-blue-500/20 text-blue-400',
  muebleria: 'bg-purple-500/20 text-purple-400',
  colchoneria: 'bg-green-500/20 text-green-400',
};

export default function PriceManagement() {
  const { products, loading, error, refetch } = useProducts();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterNoPriceOnly, setFilterNoPriceOnly] = useState(true);
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = products;

    // Filtrar por búsqueda
    if (search) {
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }

    // Filtrar solo sin precio
    if (filterNoPriceOnly) {
      result = result.filter(p => p.price === 0 || p.price === null);
    }

    return result;
  }, [products, search, filterCategory, filterNoPriceOnly]);

  const handlePriceChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingPrices(prev => ({ ...prev, [productId]: numValue }));
  };

  const handleSavePrice = async (productId: string) => {
    const newPrice = editingPrices[productId];
    if (!newPrice || newPrice <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    setSavingIds(prev => new Set(prev).add(productId));

    try {
      await updateProductPrice(productId, { price: newPrice });
      
      // Actualizar la lista de productos
      refetch();
      
      // Limpiar el estado de edición
      setEditingPrices(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      
      alert('✅ Precio actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      alert(
        `❌ Error: ${error instanceof Error ? error.message : 'Error al actualizar el precio'}`
      );
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const noPriceCount = products.filter(p => p.price === 0 || p.price === null).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">🏷️ Gestión de Precios</h2>
          <p className="text-sm text-gray-500">
            {loading
              ? 'Cargando…'
              : `${products.length} productos · ${noPriceCount} sin precio asignado`}
          </p>
        </div>
      </div>

      <ProductsErrorBanner />

      {noPriceCount > 0 && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">
              Hay {noPriceCount} productos sin precio
            </p>
            <p className="text-xs text-yellow-500/80 mt-1">
              Estos productos no se mostrarán correctamente en la tienda hasta que les asignes un precio.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={loading || Boolean(error)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          disabled={loading || Boolean(error)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="all">Todas las categorías</option>
          <option value="electrodomesticos">Electrodomésticos</option>
          <option value="muebleria">Mueblería</option>
          <option value="colchoneria">Colchonería</option>
        </select>

        <button
          onClick={() => setFilterNoPriceOnly(!filterNoPriceOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            filterNoPriceOnly
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 border border-gray-700/60 text-gray-400 hover:text-white'
          }`}
        >
          <Filter size={15} />
          Solo sin precio
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading && (
            <div className="text-center py-16 text-gray-500">
              <p>Cargando productos…</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {filterNoPriceOnly
                  ? '¡Todos los productos tienen precio asignado! 🎉'
                  : 'No hay productos que coincidan con los filtros.'}
              </p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700/60">
                <tr>
                  {['Producto', 'Categoría', 'Stock', 'Precio Actual', 'Nuevo Precio', 'Acciones'].map(h => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/40">
                {filtered.map((product, i) => {
                  const isEditing = editingPrices[product.id] !== undefined;
                  const isSaving = savingIds.has(product.id);
                  const newPrice = editingPrices[product.id] || product.price;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-200 line-clamp-1 max-w-[200px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            catColors[product.category]
                          }`}
                        >
                          {product.category}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`font-medium text-sm ${
                            product.stock === 0
                              ? 'text-red-400'
                              : product.stock <= 3
                              ? 'text-orange-400'
                              : 'text-gray-300'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {product.price > 0 ? (
                          <p className="font-semibold text-white">{formatPrice(product.price)}</p>
                        ) : (
                          <span className="text-red-400 text-xs font-medium">Sin precio</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={isEditing ? newPrice : ''}
                            onChange={e => handlePriceChange(product.id, e.target.value)}
                            placeholder={product.price > 0 ? String(product.price) : '0'}
                            className="w-32 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSavePrice(product.id)}
                          disabled={!isEditing || isSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={13} />
                              Guardar
                            </>
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info adicional */}
      {!loading && filtered.length > 0 && (
        <div className="text-xs text-gray-600 rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-2">
          <p>
            💡 <strong>Tip:</strong> Escribí el nuevo precio y hacé click en "Guardar" para cada producto.
            Los cambios se aplicarán inmediatamente.
          </p>
        </div>
      )}
    </div>
  );
}
