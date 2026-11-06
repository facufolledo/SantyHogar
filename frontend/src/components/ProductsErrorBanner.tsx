import { AlertCircle, RefreshCw } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';

/** Muestra error de carga del catálogo y botón reintentar. */
export default function ProductsErrorBanner() {
  const { error, loading, refetch } = useProducts();
  if (loading || !error) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <AlertCircle className="flex-shrink-0 text-red-600" size={20} aria-hidden />
        <p className="flex-1">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-red-800 font-medium hover:bg-red-100 transition-colors"
        >
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    </div>
  );
}
