import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, ImageIcon, AlertCircle, GripVertical } from 'lucide-react';
import type { Product } from '../../data/products';
import { createProduct, updateProduct, uploadProductImage, type CreateProductRequest, type UpdateProductRequest } from '../../api/productsApi';

type Tab = 'general' | 'precios' | 'stock' | 'imagenes' | 'envio';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: '📋 General' },
  { id: 'precios', label: '💰 Precios' },
  { id: 'stock', label: '📦 Stock' },
  { id: 'imagenes', label: '🖼️ Imágenes' },
  { id: 'envio', label: '🚚 Envío' },
];

interface Props {
  product: Product | null;
  onSave: () => void;
  onClose: () => void;
  readOnly?: boolean;
}

// Dark input class used throughout this modal
const di = 'w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

export default function ProductFormModal({ product, onSave, onClose, readOnly = false }: Props) {
  const [tab, setTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'electrodomesticos',
    subcategory: product?.subcategory || '',
    brand: product?.brand || '',
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    cost: Math.round((product?.price || 0) * 0.6),
    stock: product?.stock || 0,
    trackStock: true,
    status: 'active',
    weight: '',
    dimensions: '',
    images: product?.images || [],
  });

  const set = (key: string, val: unknown) => setForm(p => ({ ...p, [key]: val }));

  const margin = form.cost > 0 ? Math.round(((form.price - form.cost) / form.cost) * 100) : 0;
  const marginColor = margin >= 30 ? 'text-green-400' : margin >= 10 ? 'text-yellow-400' : 'text-red-400';
  const marginBg = margin >= 30 ? 'bg-green-500/10 border-green-500/30' : margin >= 10 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';
  const marginBar = margin >= 30 ? 'bg-green-500' : margin >= 10 ? 'bg-yellow-500' : 'bg-red-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    setSaving(true);
    try {
      if (product) {
        // Edit mode
        const updateData: UpdateProductRequest = {
          name: form.name,
          description: form.description || undefined,
          category: form.category as Product['category'],
          subcategory: form.subcategory || undefined,
          brand: form.brand,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
          stock: Number(form.stock),
          images: form.images.length > 0 ? form.images : undefined,
        };
        await updateProduct(product.id, updateData);
        alert('✅ Producto actualizado correctamente');
      } else {
        // Create mode
        const createData: CreateProductRequest = {
          name: form.name,
          category: form.category as Product['category'],
          subcategory: form.subcategory || 'general',
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
          stock: Number(form.stock),
          brand: form.brand,
          description: form.description || undefined,
          images: form.images.length > 0 ? form.images : undefined,
        };
        await createProduct(createData);
        alert('✅ Producto creado correctamente');
      }
      onSave();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error al guardar el producto'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
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
          <h3 className="font-bold text-white">
            {readOnly ? 'Ver producto' : product ? 'Editar producto' : 'Nuevo producto'}
          </h3>
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <fieldset
            disabled={readOnly}
            className="flex-1 min-h-0 overflow-y-auto border-0 px-6 py-5 mx-0 flex flex-col [&:disabled]:opacity-90"
          >

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
                <Field label="Stock actual">
                  <input type="number" value={form.stock} onChange={e => set('stock', Number(e.target.value))}
                    placeholder="0" className={di} />
                </Field>
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
              <ImagenesTab
                images={form.images}
                setImages={(imgs) => set('images', imgs)}
                readOnly={readOnly}
                di={di}
              />
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
                    placeholder="Largo x Ancho x Alto • Ej: 60x40x30" className={di} />
                </Field>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-400">
                  ℹ️ Estos datos se usan para calcular el costo de envío automáticamente.
                </div>
              </motion.div>
            )}
          </fieldset>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0">
            {readOnly ? (
              <button type="button" onClick={onClose} className="flex-1 text-sm py-2.5 rounded-lg btn-primary">
                Cerrar
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} disabled={saving}
                  className="flex-1 text-sm py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface ImagenesTabProps {
  images: string[];
  setImages: (imgs: string[]) => void;
  readOnly: boolean;
  di: string;
}

function ImagenesTab({ images, setImages, readOnly, di }: ImagenesTabProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; progress: number }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" no es una imagen válida. Solo se aceptan JPEG, PNG y WebP.`;
    }
    if (file.size > MAX_SIZE) {
      return `"${file.name}" excede 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
    }
    return null;
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (readOnly) return;
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    setErrors(newErrors);
    if (validFiles.length === 0) return;

    // Start uploading valid files
    const uploadEntries = validFiles.map(f => ({ name: f.name, progress: 0 }));
    setUploading(prev => [...prev, ...uploadEntries]);

    const newUrls: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        // Simulate progress (actual upload doesn't provide progress events with fetch)
        setUploading(prev =>
          prev.map(u => u.name === file.name ? { ...u, progress: 50 } : u)
        );

        const result = await uploadProductImage(file);
        newUrls.push(result.url);

        setUploading(prev =>
          prev.map(u => u.name === file.name ? { ...u, progress: 100 } : u)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setErrors(prev => [...prev, `Error al subir "${file.name}": ${msg}`]);
      }
    }

    // Remove completed uploads after a short delay
    setTimeout(() => {
      setUploading(prev => prev.filter(u => u.progress < 100));
    }, 800);

    if (newUrls.length > 0) {
      setImages([...images, ...newUrls]);
    }
  }, [images, setImages, readOnly]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (readOnly) return;
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles, readOnly]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setDragOver(true);
  }, [readOnly]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // Reorder drag handlers
  const handleReorderDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleReorderDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleReorderDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setImages(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleReorderDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* URL input - preserved */}
      <Field label="URL de imagen">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            className={di}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget;
                if (input.value.trim()) {
                  setImages([...images, input.value.trim()]);
                  input.value = '';
                }
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                setImages([...images, input.value.trim()]);
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors"
          >
            Agregar
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">Presioná Enter o click en Agregar para añadir la URL</p>
      </Field>

      {/* Drag & Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !readOnly && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-gray-700 hover:border-gray-500'
        } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-primary-400' : 'text-gray-600'}`} />
        <p className={`text-sm ${dragOver ? 'text-primary-400' : 'text-gray-400'}`}>
          Arrastrá imágenes aquí o hacé click para seleccionar
        </p>
        <p className="text-xs text-gray-600 mt-1">JPEG, PNG o WebP • Máximo 5 MB por archivo</p>
      </div>

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{u.name}</p>
                <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500">{u.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-400">{err}</p>
            </div>
          ))}
        </div>
      )}

      {/* Image grid with reorder */}
      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div
              key={`${img}-${i}`}
              draggable={!readOnly}
              onDragStart={() => handleReorderDragStart(i)}
              onDragOver={(e) => handleReorderDragOver(e, i)}
              onDrop={(e) => handleReorderDrop(e, i)}
              onDragEnd={handleReorderDragEnd}
              className={`relative aspect-square rounded-lg overflow-hidden bg-gray-800 group transition-all ${
                dragIdx === i ? 'opacity-40 scale-95' : ''
              } ${dragOverIdx === i && dragIdx !== null && dragIdx !== i ? 'ring-2 ring-primary-500' : ''}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
              {!readOnly && (
                <>
                  <div className="absolute top-1 left-1 p-1 bg-black/50 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                    <GripVertical size={12} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-600 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <ImageIcon size={14} /> <span>No hay imágenes cargadas</span>
        </div>
      )}

      {images.length > 1 && !readOnly && (
        <p className="text-xs text-gray-600">ℹ️ Arrastrá las imágenes para reordenarlas. La primera es la imagen principal.</p>
      )}
    </motion.div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);
