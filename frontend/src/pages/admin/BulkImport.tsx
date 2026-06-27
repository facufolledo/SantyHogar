import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, CheckCircle, AlertCircle, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useProducts } from '../../context/ProductsContext';
import { bulkImportPreview, bulkImportConfirm, uploadProductImage, type BulkImportPreviewResponse, type BulkImportResponse } from '../../api/productsApi';

interface PreviewRow {
  row_number: number;
  valid: boolean;
  selected: boolean;
  nombre: string;
  categoria: string;
  subcategoria: string;
  precio: number;
  stock: number;
  marca: string;
  descripcion: string;
  imagen: string | null;
  errors: string[];
}

export default function BulkImport() {
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [summary, setSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refetch } = useProducts();

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast('Solo se aceptan archivos Excel (.xlsx)', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await bulkImportPreview(file);
      
      // Convertir validaciones a filas de preview
      const rows: PreviewRow[] = response.validations.map((v) => ({
        row_number: v.row_number,
        valid: v.valid,
        selected: v.valid, // Solo seleccionar las vÃ¡lidas por defecto
        nombre: v.data?.nombre || '',
        categoria: v.data?.categoria || 'electrodomesticos',
        subcategoria: v.data?.subcategoria || 'General',
        precio: v.data?.precio || 0,
        stock: v.data?.stock || 0,
        marca: v.data?.marca || 'Sin marca',
        descripcion: v.data?.descripcion || '',
        imagen: v.data?.imagen || null,
        errors: v.errors,
      }));

      setPreviewData(rows);
      setSummary({
        total: response.total_rows,
        valid: response.valid_rows,
        invalid: response.invalid_rows,
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
    const allValidSelected = previewData.filter(r => r.valid).every(r => r.selected);
    setPreviewData(prev => prev.map(row =>
      row.valid ? { ...row, selected: !allValidSelected } : row
    ));
  };

  const handleImageDrop = useCallback(async (e: React.DragEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast('Solo se aceptan archivos de imagen', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('La imagen no debe exceder 5 MB', 'error');
      return;
    }

    try {
      const result = await uploadProductImage(file);
      setPreviewData(prev => prev.map((row, i) =>
        i === rowIndex ? { ...row, imagen: result.url } : row
      ));
      toast('Imagen subida correctamente', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Error al subir imagen', 'error');
    }
  }, [toast]);

  const removeImage = (rowIndex: number) => {
    setPreviewData(prev => prev.map((row, i) =>
      i === rowIndex ? { ...row, imagen: null } : row
    ));
  };

  const handleConfirm = async () => {
    const selectedRows = previewData.filter(r => r.selected && r.valid);
    if (selectedRows.length === 0) {
      toast('SeleccionÃ¡ al menos una fila para importar', 'error');
      return;
    }

    setConfirming(true);
    try {
      const rows = selectedRows.map(r => ({
        nombre: r.nombre,
        precio: r.precio,
        stock: r.stock,
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        marca: r.marca,
        descripcion: r.descripcion,
        imagen: r.imagen,
      }));

      const result = await bulkImportConfirm(rows);
      setImportResult(result);
      setStep('done');
      toast(result.message, 'success');
      
      // Refrescar la lista de productos
      await refetch();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Error al importar productos', 'error');
    }
    setConfirming(false);
  };

  const reset = () => {
    setPreviewData([]);
    setImportResult(null);
    setSummary(null);
    setStep('upload');
  };

  const selectedCount = previewData.filter(r => r.selected && r.valid).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white">ImportaciÃ³n masiva de productos</h2>
          <p className="text-sm text-gray-500">SubÃ­ un archivo Excel (.xlsx) para importar productos</p>
        </div>
        {step !== 'upload' && (
          <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300">
            <X size={14} /> Nueva importaciÃ³n
          </button>
        )}
      </div>

      <div className="text-xs text-gray-600 rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-2">
        <p className="mb-1">ðŸ“‹ <strong>Formato esperado del Excel (.xlsx):</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Primera fila: encabezados (nombre, categorÃ­a, subcategorÃ­a, precio, stock, marca, descripciÃ³n)</li>
          <li>Filas siguientes: datos de productos</li>
          <li>Las columnas se detectan automÃ¡ticamente por nombre</li>
        </ul>
        <p className="mt-2 text-blue-400">ðŸ’¡ PodÃ©s arrastrar imÃ¡genes a cada fila en la vista previa antes de confirmar.</p>
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
            {loading ? 'Procesando archivo...' : 'ArrastrÃ¡ tu archivo Excel o hacÃ© click'}
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
                <CheckCircle size={15} /> {summary?.valid} vÃ¡lidas
              </div>
              {(summary?.invalid || 0) > 0 && (
                <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm font-medium">
                  <AlertCircle size={15} /> {summary?.invalid} con errores
                </div>
              )}
              <div className="flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-2 rounded-lg text-sm font-medium">
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
                          checked={previewData.filter(r => r.valid).every(r => r.selected)}
                          onChange={toggleAll}
                          className="rounded border-gray-600"
                        />
                      </th>
                      {['Fila', 'Nombre', 'CategorÃ­a', 'Precio', 'Stock', 'Marca', 'Imagen', 'Estado'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/40">
                    {previewData.map((row, i) => (
                      <tr key={i} className={`${row.valid ? 'hover:bg-gray-700/30' : 'bg-red-500/5'} ${row.selected ? '' : 'opacity-50'}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRow(i)}
                            disabled={!row.valid}
                            className="rounded border-gray-600"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500">#{row.row_number}</td>
                        <td className="px-4 py-3 font-medium text-gray-200 max-w-[200px] truncate">
                          {row.nombre || <span className="text-red-400 italic">sin nombre</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                            {row.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {row.precio > 0 ? `$${row.precio.toLocaleString()}` : <span className="text-gray-600">$0</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{row.stock}</td>
                        <td className="px-4 py-3 text-gray-300 max-w-[100px] truncate">{row.marca}</td>
                        <td className="px-4 py-3">
                          {row.imagen ? (
                            <div className="flex items-center gap-1">
                              <img src={row.imagen} alt="" className="w-8 h-8 rounded object-cover" />
                              <button
                                onClick={() => removeImage(i)}
                                className="text-red-400 hover:text-red-300 p-0.5"
                                title="Quitar imagen"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onDrop={(e) => handleImageDrop(e, i)}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              className="w-8 h-8 border border-dashed border-gray-600 rounded flex items-center justify-center hover:border-primary-500 cursor-pointer transition-colors"
                              title="ArrastrÃ¡ una imagen aquÃ­"
                            >
                              <ImageIcon size={12} className="text-gray-600" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.valid ? (
                            <span className="text-xs text-green-400">Ã”Â£Ã´ OK</span>
                          ) : (
                            <span className="text-xs text-red-400">{row.errors.join(', ')}</span>
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
                {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''} para importar
              </p>
              <button
                onClick={handleConfirm}
                disabled={confirming || selectedCount === 0}
                className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Confirmar importaciÃ³n ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && importResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12"
          >
            <CheckCircle size={56} className="mx-auto text-green-400 mb-3" />
            <h3 className="font-bold text-white text-lg mb-1">Â¡ImportaciÃ³n exitosa!</h3>
            <p className="text-gray-500 text-sm mb-2">
              {importResult.imported_count} productos fueron agregados al catÃ¡logo.
            </p>
            {importResult.invalid_rows > 0 && (
              <p className="text-yellow-500 text-sm mb-2">
                âš ï¸ {importResult.invalid_rows} fila{importResult.invalid_rows !== 1 ? 's' : ''} no se pudieron importar.
              </p>
            )}
            <p className="text-yellow-500 text-sm mb-5">
              âš ï¸ RecordÃ¡ asignar precios en "GestiÃ³n de Precios" si importaste con precio $0
            </p>
            <button onClick={reset} className="btn-primary text-sm px-6 py-2.5">
              Nueva importaciâ”œâ”‚n
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
