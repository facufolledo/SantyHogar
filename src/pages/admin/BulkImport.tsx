import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { useToast } from '../../context/ToastContext';

interface ImportRow {
  nombre: string;
  precio: number;
  precio_costo: number;
  stock: number;
  categoria: string;
  descripcion: string;
  valid: boolean;
  errors: string[];
}

export default function BulkImport() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) { toast('Solo se aceptan archivos Excel (.xlsx, .xls)', 'error'); return; }
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const ws = wb.worksheets[0];
      const parsed: ImportRow[] = [];
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const vals = row.values as unknown[];
        const nombre = String(vals[1] || '').trim();
        const precio = Number(vals[2]) || 0;
        const precio_costo = Number(vals[3]) || 0;
        const stock = Number(vals[4]) || 0;
        const categoria = String(vals[5] || '').trim().toLowerCase();
        const descripcion = String(vals[6] || '').trim();
        const errors: string[] = [];
        if (!nombre) errors.push('Nombre requerido');
        if (precio <= 0) errors.push('Precio inválido');
        if (!['electrodomesticos', 'muebleria', 'colchoneria'].includes(categoria)) errors.push('Categoría inválida');
        parsed.push({ nombre, precio, precio_costo, stock, categoria, descripcion, valid: errors.length === 0, errors });
      });
      setRows(parsed);
    } catch { toast('Error al leer el archivo', 'error'); }
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleImport = () => { setImported(true); toast(`${rows.filter(r => r.valid).length} productos importados`); };

  const downloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Productos');
    ws.addRow(['nombre', 'precio', 'precio_costo', 'stock', 'categoria', 'descripcion']);
    ws.addRow(['Lavarropas 8kg', 289999, 180000, 10, 'electrodomesticos', 'Descripción del producto']);
    ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla_productos.xlsx'; a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter(r => r.valid).length;
  const errorCount = rows.filter(r => !r.valid).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white">Importación masiva</h2>
          <p className="text-sm text-gray-500">Subí un Excel para importar múltiples productos</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 text-sm border border-gray-700 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-700/60 hover:text-white transition-colors">
          <Download size={15} /> Descargar plantilla
        </button>
      </div>

      {rows.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-primary-500 rounded-2xl p-12 text-center cursor-pointer transition-colors group bg-gray-800/50">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="w-16 h-16 bg-gray-700/60 group-hover:bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
            {loading
              ? <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              : <FileSpreadsheet size={28} className="text-gray-500 group-hover:text-primary-400 transition-colors" />
            }
          </div>
          <p className="font-semibold text-gray-300 mb-1">Arrastrá tu archivo Excel o hacé click</p>
          <p className="text-sm text-gray-600">Formatos: .xlsx, .xls</p>
        </motion.div>
      )}

      <AnimatePresence>
        {rows.length > 0 && !imported && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-sm font-medium">
                <CheckCircle size={15} /> {validCount} válidos
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm font-medium">
                  <AlertCircle size={15} /> {errorCount} con errores
                </div>
              )}
              <button onClick={() => setRows([])} className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300">
                <X size={14} /> Limpiar
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700/60">
                    <tr>
                      {['', 'Nombre', 'Precio', 'Costo', 'Margen', 'Stock', 'Categoría'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/40">
                    {rows.map((row, i) => {
                      const margin = row.precio_costo > 0 ? Math.round(((row.precio - row.precio_costo) / row.precio_costo) * 100) : 0;
                      return (
                        <tr key={i} className={row.valid ? 'hover:bg-gray-700/30' : 'bg-red-500/5'}>
                          <td className="px-4 py-3">
                            {row.valid ? <CheckCircle size={15} className="text-green-400" /> : <AlertCircle size={15} className="text-red-400" />}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-200">{row.nombre || <span className="text-red-400 italic">vacío</span>}</td>
                          <td className="px-4 py-3 text-gray-300">${row.precio.toLocaleString('es-AR')}</td>
                          <td className="px-4 py-3 text-gray-500">${row.precio_costo.toLocaleString('es-AR')}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold text-xs ${margin >= 30 ? 'text-green-400' : margin >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {margin}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{row.stock}</td>
                          <td className="px-4 py-3 text-gray-400">{row.categoria}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRows([])} className="border border-gray-700 text-gray-400 hover:bg-gray-700/60 hover:text-white text-sm py-2.5 px-6 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleImport} disabled={validCount === 0} className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50">
                Importar {validCount} productos
              </button>
            </div>
          </motion.div>
        )}

        {imported && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
            <CheckCircle size={56} className="mx-auto text-green-400 mb-3" />
            <h3 className="font-bold text-white text-lg mb-1">¡Importación exitosa!</h3>
            <p className="text-gray-500 text-sm mb-5">{validCount} productos fueron agregados al catálogo.</p>
            <button onClick={() => { setRows([]); setImported(false); }} className="btn-primary text-sm px-6 py-2.5">
              Nueva importación
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
