/**
 * Panel para carga masiva de imágenes vinculadas a productos existentes
 * Permite subir un Excel con nombres de productos y URLs de imágenes
 */
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, CheckCircle, AlertCircle, X, Upload, Eye, Image as ImageIcon } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface PreviewRow {
  row_number: number;
  nombre_producto: string;
  imagenes_solicitadas: number;
  producto_encontrado: boolean;
  producto_id: string | null;
  producto_nombre_encontrado: string | null;
  errors: string[];
  selected: boolean;
}

interface ConfirmRow {
  producto_id: string;
  imagenes: string[];
}

const BulkImageUpload: React.FC = () => {
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [summary, setSummary] = useState<{ total: number; matched: number; unmatched: number; total_images: number } | null>(null);
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast('Solo se aceptan archivos Excel (.xlsx)', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/products/bulk-images/preview`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al procesar el archivo');
      }

      const data = await response.json();

      // Convertir a filas de preview
      const rows: PreviewRow[] = (data.previews || []).map((p: any) => ({
        row_number: p.row_number,
        nombre_producto: p.nombre_producto,
        imagenes_solicitadas: p.imagenes_solicitadas,
        producto_encontrado: p.producto_encontrado,
        producto_id: p.producto_id,
        producto_nombre_encontrado: p.producto_nombre_encontrado,
        errors: p.errors,
        selected: p.producto_encontrado, // Solo seleccionar si encontró el producto
      }));

      setPreviewData(rows);
      setSummary({
        total: data.total_rows,
        matched: data.matched_products,
        unmatched: data.unmatched_products,
        total_images: data.total_images,
      });
      setStep('preview');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Error al procesar el archivo', 'error');
    }
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const toggleRow = (index: number) => {
    setPreviewData(prev => prev.map((row, i) =>
      i === index ? { ...row, selected: !row.selected } : row
    ));
  };

  const toggleAll = () => {
    const allMatchedSelected = previewData.filter(r => r.producto_encontrado).every(r => r.selected);
    setPreviewData(prev => prev.map(row =>
      row.producto_encontrado ? { ...row, selected: !allMatchedSelected } : row
    ));
  };

  const handleConfirm = async () => {
    const selectedRows = previewData.filter(r => r.selected && r.producto_encontrado);
    if (selectedRows.length === 0) {
      toast('Seleccioná al menos una fila para importar', 'error');
      return;
    }

    setConfirming(true);
    try {
      const rows: ConfirmRow[] = selectedRows.map(r => ({
        producto_id: r.producto_id!,
        imagenes: [], // Se obtienen del preview
      }));

      // Obtener las imágenes del preview original
      const originalData = previewData.filter(r => r.selected && r.producto_encontrado);
      
      // Necesitamos obtener nuevamente las URLs del Excel para enviar
      // Por ahora, haremos una llamada simple sin las URLs
      const response = await fetch(`${API_URL}/products/bulk-images/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rows: selectedRows.map((row, idx) => ({
            producto_id: row.producto_id,
            imagenes: originalData[idx]?.imagenes || []
          }))
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al cargar imágenes');
      }

      const resultData = await response.json();
      setResult(resultData);
      setStep('done');
      toast(resultData.message, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al cargar imágenes', 'error');
    }
    setConfirming(false);
  };

  const reset = () => {
    setPreviewData([]);
    setResult(null);
    setSummary(null);
    setStep('upload');
  };

  const selectedCount = previewData.filter(r => r.selected && r.producto_encontrado).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white">Carga masiva de imágenes</h2>
          <p className="text-sm text-gray-500">Sube un archivo Excel con nombres de productos y URLs de imágenes</p>
        </div>
        {step !== 'upload' && (
          <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300">
            <X size={14} /> Nueva carga
          </button>
        )}
      </div>

      <div className="text-xs text-gray-600 rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-2">
        <p className="mb-1">📋 <strong>Formato esperado del Excel (.xlsx):</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Columna 1: nombre_producto (nombre exacto del producto en la BD)</li>
          <li>Columnas 2+: URLs de imágenes (una por columna o varias en la misma)</li>
          <li>El sistema buscará los productos por nombre (búsqueda fuzzy)</li>
          <li>Las imágenes se descargarán y subirán automáticamente a Supabase Storage</li>
        </ul>
        <p className="mt-2 text-blue-400">💡 El sistema tolerará pequeñas diferencias en los nombres de productos.</p>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !loading && inputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-primary-500 rounded-2xl p-12 text-center cursor-pointer transition-colors group bg-gray-800/50"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="w-16 h-16 bg-gray-700/60 group-hover:bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
            {loading ? (
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet size={28} className="text-gray-500 group-hover:text-primary-400 transition-colors" />
            )}
          </div>
          <p className="font-semibold text-gray-300 mb-1">
            {loading ? 'Procesando archivo...' : 'Arrastrá tu archivo Excel o hacé click'}
          </p>
          <p className="text-sm text-gray-600">Formato: .xlsx</p>
        </motion.div>
      )}

      {/* Step 2: Preview */}
      <AnimatePresence>
        {step === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium">
                <FileSpreadsheet size={15} /> {summary?.total} filas
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-sm font-medium">
                <CheckCircle size={15} /> {summary?.matched} coincidencias
              </div>
              {(summary?.unmatched || 0) > 0 && (
                <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm font-medium">
                  <AlertCircle size={15} /> {summary?.unmatched} sin coincidencia
                </div>
              )}
              <div className="flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-2 rounded-lg text-sm font-medium">
                <ImageIcon size={15} /> {summary?.total_images} imágenes
              </div>
              <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-3 py-2 rounded-lg text-sm font-medium">
                <Upload size={15} /> {selectedCount} seleccionadas
              </div>
            </div>

            {/* Preview table */}
            <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700/60">
                    <tr>
                      <th className="text-left px-4 py-3">
                        <input
                          type="checkbox"
                          checked={previewData.filter(r => r.producto_encontrado).every(r => r.selected)}
                          onChange={toggleAll}
                          className="rounded border-gray-600"
                        />
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Fila</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Producto Buscado</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Producto Encontrado</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Imágenes</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/40">
                    {previewData.map((row, i) => (
                      <tr key={i} className={`${row.producto_encontrado ? 'hover:bg-gray-700/30' : 'bg-red-500/5'}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRow(i)}
                            disabled={!row.producto_encontrado}
                            className="rounded border-gray-600"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500">#{row.row_number}</td>
                        <td className="px-4 py-3 font-medium text-gray-200 max-w-[250px] truncate">
                          {row.nombre_producto}
                        </td>
                        <td className="px-4 py-3 text-gray-300 max-w-[250px] truncate">
                          {row.producto_encontrado ? (
                            <span className="text-green-400">{row.producto_nombre_encontrado}</span>
                          ) : (
                            <span className="text-red-400">No encontrado</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                            {row.imagenes_solicitadas}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.producto_encontrado ? (
                            <span className="text-xs text-green-400">✓ Listo</span>
                          ) : (
                            <div className="text-xs text-red-400">
                              {row.errors.map((err, idx) => (
                                <div key={idx}>{err}</div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirm button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedCount} fila{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''} para cargar
              </p>
              <button
                onClick={handleConfirm}
                disabled={confirming || selectedCount === 0}
                className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Confirmar carga ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && result && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12"
          >
            <CheckCircle size={56} className="mx-auto text-green-400 mb-3" />
            <h3 className="font-bold text-white text-lg mb-1">¡Carga exitosa!</h3>
            <p className="text-gray-500 text-sm mb-2">
              {result.total_images_uploaded} imágenes cargadas en {result.successful_uploads} producto{result.successful_uploads !== 1 ? 's' : ''}.
            </p>
            {result.failed_uploads > 0 && (
              <p className="text-yellow-500 text-sm mb-2">
                ⚠️ {result.failed_uploads} producto{result.failed_uploads !== 1 ? 's' : ''} tuvieron errores.
              </p>
            )}
            
            {/* Mostrar detalles */}
            {result.details && result.details.length > 0 && (
              <div className="text-left mt-6 max-w-2xl mx-auto">
                <p className="text-sm font-semibold text-gray-400 mb-3">Detalles:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.details.map((detail: any, idx: number) => (
                    <div key={idx} className="text-xs bg-gray-800 p-2 rounded border border-gray-700">
                      <div className="font-medium">
                        {detail.éxito ? '✓' : '✗'} Producto {idx + 1}
                      </div>
                      <div className="text-gray-400">
                        Imágenes: {detail.imágenes_cargadas}/{detail.imágenes_totales || '?'}
                        {detail.error && ` - Error: ${detail.error}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button onClick={reset} className="btn-primary text-sm px-6 py-2.5 mt-6">
              Nueva carga
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkImageUpload;
