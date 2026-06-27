import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';

const LowStockBanner = () => {
  const { products, loading } = useProducts();

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock < 5);
  }, [products]);

  if (loading || lowStockProducts.length === 0) return null;

  return (
    <div className="bg-orange-500 text-white px-4 py-2 text-sm text-center flex flex-wrap items-center justify-center gap-2 relative z-50">
      <AlertCircle size={16} />
      <span className="font-medium">
        ¡Atención! Tenemos {lowStockProducts.length} {lowStockProducts.length === 1 ? 'producto' : 'productos'} con stock muy bajo (últimas unidades).
      </span>
      <Link to="/tienda" className="underline font-bold hover:text-orange-100 ml-2">
        Ver tienda
      </Link>
    </div>
  );
};

export default LowStockBanner;
