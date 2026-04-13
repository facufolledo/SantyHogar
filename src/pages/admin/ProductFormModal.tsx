import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, ImageIcon } from 'lucide-react';
import type { Product } from '../../data/products';

type Tab = 'general' | 'precios' | 'stock' | 'imagenes' | 'envio';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: '🧾 General' },
  { id: 'precios', label: '💰 Precios' },
  { id: 'stock', label: '📦 Stock' },
  { id: 'imagenes', label: '🖼️ Imágenes' },
  { id: 'envio', label: '🚚 Envío' },
];

interface Props {
  product: Product | null;
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
}

// Dark input class used throughout this modal
const di = 'w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

export default function ProductFormModal({ product, onSave, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('general');
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'electrodomesticos',
    brand: product?.brand || '',
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    cost: Math.round((product?.price || 0) * 0.6),
    stock: product?.stock || 0,
    sku: `SKU-${product?.id?.padStart(4, '0') || '0000'}`,
    trackStock: true,
    status: 'active',
    weight: '',
    dimensions: '',
  });

  const set = (key: string, val: unknown) => setForm(p => ({ ...p, [key]: val }));

  const margin = form.cost > 0 ? Math.round(((form.price - form.cost) / form.cost) * 100) : 0;
  const marginColor = margin >= 30 ? 'text-green-400' : margin >= 10 ? 'text-yellow-400' : 'text-red-400';
  const marginBg = margin >= 30 ? 'bg-green-500/10 border-green-500/30' : margin >= 10 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';
  const marginBar = margin >= 30 ? 'bg-green-500' : margin >= 10 ? 'bg-yellow-500' : 'bg-red-500';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      description: form.description,
      category: form.category as Product['category'],
      brand: form.brand,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      stock: Number(form.stock),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="font-bold text-white">{product ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* GENERAL */}
            {tab === 'general' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Field label="Nombre del producto">
                  <input required value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Ej: Lavarropas Automático 8kg" className={di} />
                </Field>
                <Field label="Descripción">
                  <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Descripción detallada del producto..." className={`${di} resize-none`} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Categoría">
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={di}>
                      <option value="electrodomesticos">Electrodomésticos</option>
                      <option value="muebleria">Mueblería</option>
                      <option value="colchoneria">Colchonería</option>
                    </select>
                  </Field>
                  <Field label="Marca">
                    <input value={form.brand} onChange={e => set('brand', e.target.value)}
                      placeholder="Ej: Samsung" className={di} />
                  </Field>
                </div>
              </motion.div>
            )}

            {/* PRECIOS */}
            {tab === 'precios' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Precio de venta">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input type="number" required value={form.price || ''} onChange={e => set('price', Number(e.target.value))}
                        placeholder="0" className={`${di} pl-7`} />
                    </div>
                  </Field>
                  <Field label="Precio promocional">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input type="number" value={form.originalPrice || ''} onChange={e => set('originalPrice', Number(e.target.value))}
                        placeholder="0 (opcional)" className={`${di} pl-7`} />
                    </div>
                  </Field>
                </div>
                <Field label="Precio de costo">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input type="number" value={form.cost || ''} onChange={e => set('cost', Number(e.target.value))}
                      placeholder="0" className={`${di} pl-7`} />
                  </div>
                </Field>

                {/* Margin */}
                <div className={`rounded-xl p-4 border ${marginBg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-300">Margen de ganancia</p>
                      <p className="text-xs text-gray-600 mt-0.5">((precio - costo) / costo) × 100</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-black ${marginColor}`}>{margin}%</p>
                      <p className="text-xs text-gray-500">
                        Ganancia: {form.cost > 0 ? `$${(form.price - form.cost).toLocaleString('es-AR')}` : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${marginBar}`}
                      style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STOCK */}
            {tab === 'stock' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Stock actual">
                    <input type="number" value={form.stock} onChange={e => set('stock', Number(e.target.value))}
                      placeholder="0" className={di} />
                  </Field>
                  <Field label="SKU">
                    <input value={form.sku} onChange={e => set('sku', e.target.value)}
                      placeholder="SKU-0001" className={di} />
                  </Field>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Control de stock</p>
                    <p className="text-xs text-gray-600">Desactivar para productos sin límite</p>
                  </div>
                  <button type="button" onClick={() => set('trackStock', !form.trackStock)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${form.trackStock ? 'bg-primary-600' : 'bg-gray-700'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.trackStock ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Estado</p>
                    <p className="text-xs text-gray-600">Activo o borrador</p>
                  </div>
                  <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="active">Activo</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* IMÁGENES */}
            {tab === 'imagenes' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="border-2 border-dashed border-gray-700 hover:border-primary-500 rounded-xl p-8 text-center transition-colors cursor-pointer group">
                  <Upload size={32} className="mx-auto text-gray-600 group-hover:text-primary-400 mb-3 transition-colors" />
                  <p className="text-sm font-medium text-gray-400">Arrastrá imágenes o hacé click</p>
                  <p className="text-xs text-gray-600 mt-1">PNG, JPG hasta 5MB · Máximo 8 imágenes</p>
                  <button type="button" className="mt-3 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors">
                    Seleccionar archivos
                  </button>
                </div>
                {product?.images ? (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">Principal</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ImageIcon size={14} /> <span>No hay imágenes cargadas</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ENVÍO */}
            {tab === 'envio' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Field label="Peso (kg)">
                  <input type="number" step="0.1" value={form.weight} onChange={e => set('weight', e.target.value)}
                    placeholder="Ej: 2.5" className={di} />
                </Field>
                <Field label="Dimensiones (cm)">
                  <input value={form.dimensions} onChange={e => set('dimensions', e.target.value)}
                    placeholder="Largo x Ancho x Alto · Ej: 60x40x30" className={di} />
                </Field>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-400">
                  💡 Estos datos se usan para calcular el costo de envío automáticamente.
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 text-sm py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 text-sm py-2.5">
              {product ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
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
