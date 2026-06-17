import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, CheckCircle, AlertCircle, X, Upload } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { bulkImportProducts, type BulkImportResponse } from '../../api/productsApi';

export default function BulkImport() {
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(doc|docx)$/)) {
      toast('Solo se aceptan archivos Word (.doc, .docx)', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await bulkImportProducts(file);
      setResult(response);
      
      if (response.imported_count > 0) {
        setImported(true);
        toast(response.message, 'success');
      } else {
        toast('No se pudo importar ningún producto', 'error');
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Error al importar productos', 'error');
    }
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const validCount = result?.valid_rows || 0;
  const errorCount = result?.invalid_rows || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white">Importación masiva de stock</h2>
          <p className="text-sm text-gray-500">Subí un archivo Word (.doc) para importar productos con stock</p>
        </div>
      </div>

      <div className="text-xs text-gray-600 rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-2">
        <p className="mb-1">📄 <strong>Formato esperado del documento:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Línea 1: Código del producto</li>
          <li>Línea 2: Nombre/Descripción</li>
          <li>Línea 3: Categoría</li>
          <li>Derecha: Stock disponible</li>
        </ul>
        <p className="mt-2 text-yellow-500">⚠️ Los productos se crearán con precio $0. Usá "Gestión de Precios" para asignarlos después.</p>
      </div>

      {!result && (
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
            accept=".doc,.docx"
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
            {loading ? 'Procesando archivo...' : 'Arrastrá tu archivo Word o hacé click'}
          </p>
          <p className="text-sm text-gray-600">Formatos: .doc, .docx</p>
        </motion.div>
      )}

      <AnimatePresence>
        {result && !imported && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-sm font-medium">
                <CheckCircle size={15} /> {validCount} válidos
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm font-medium">
                  <AlertCircle size={15} /> {errorCount} con errores
                </div>
              )}
              <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium">
                <Upload size={15} /> {result.imported_count} importados
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setImported(false);
                }}
                className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300"
              >
                <X size={14} /> Limpiar
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700/60">
                    <tr>
                      {['', 'Fila', 'Nombre', 'Categoría', 'Stock', 'Estado'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/40">
                    {result.validations.map((validation, i) => (
                      <tr key={i} className={validation.valid ? 'hover:bg-gray-700/30' : 'bg-red-500/5'}>
                        <td className="px-4 py-3">
                          {validation.valid ? (
                            <CheckCircle size={15} className="text-green-400" />
                          ) : (
                            <AlertCircle size={15} className="text-red-400" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">#{validation.row_number}</td>
                        <td className="px-4 py-3 font-medium text-gray-200">
                          {validation.data?.nombre || (
                            <span className="text-red-400 italic">sin nombre</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {validation.data ? (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                              {validation.data.categoria}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {validation.data?.stock ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          {validation.valid ? (
                            <span className="text-xs text-green-400">✓ OK</span>
                          ) : (
                            <span className="text-xs text-red-400">{validation.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              {result.message}
            </p>
          </motion.div>
        )}

        {imported && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12"
          >
            <CheckCircle size={56} className="mx-auto text-green-400 mb-3" />
            <h3 className="font-bold text-white text-lg mb-1">¡Importación exitosa!</h3>
            <p className="text-gray-500 text-sm mb-2">
              {result?.imported_count} productos fueron agregados al catálogo.
            </p>
            <p className="text-yellow-500 text-sm mb-5">
              ⚠️ Recordá asignar precios en "Gestión de Precios"
            </p>
            <button
              onClick={() => {
                setResult(null);
                setImported(false);
              }}
              className="btn-primary text-sm px-6 py-2.5"
            >
              Nueva importación
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
