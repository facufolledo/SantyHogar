import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonLoader = ({ 
  variant = 'rectangle', 
  width = '100%', 
  height = '20px',
  className = '' 
}: SkeletonLoaderProps) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    card: 'rounded-lg',
    text: 'rounded',
    circle: 'rounded-full',
    rectangle: 'rounded'
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
};

// Skeleton para ProductCard
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <SkeletonLoader variant="rectangle" height="200px" className="rounded-none" />
      <div className="p-4 space-y-3">
        <SkeletonLoader variant="text" height="16px" width="60%" />
        <SkeletonLoader variant="text" height="24px" width="40%" />
        <SkeletonLoader variant="text" height="14px" width="80%" />
        <div className="flex gap-2 mt-4">
          <SkeletonLoader variant="rectangle" height="36px" width="100%" />
          <SkeletonLoader variant="rectangle" height="36px" width="36px" />
        </div>
      </div>
    </div>
  );
};

// Skeleton para tabla de productos (admin)
export const TableRowSkeleton = () => {
  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <SkeletonLoader variant="rectangle" height="20px" width="20px" />
      </td>
      <td className="px-4 py-3">
        <SkeletonLoader variant="rectangle" height="50px" width="50px" />
      </td>
      <td className="px-4 py-3">
        <SkeletonLoader variant="text" height="16px" width="80%" />
      </td>
      <td className="px-4 py-3">
        <SkeletonLoader variant="text" height="16px" width="60%" />
      </td>
      <td className="px-4 py-3">
        <SkeletonLoader variant="text" height="16px" width="40%" />
      </td>
      <td className="px-4 py-3">
        <SkeletonLoader variant="text" height="16px" width="50%" />
      </td>
      <td className="px-4 py-3">
        <SkeletonLoader variant="text" height="16px" width="30%" />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <SkeletonLoader variant="rectangle" height="32px" width="32px" />
          <SkeletonLoader variant="rectangle" height="32px" width="32px" />
        </div>
      </td>
    </tr>
  );
};

// Skeleton para detalle de producto
export const ProductDetailSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Imagen */}
        <div>
          <SkeletonLoader variant="card" height="400px" />
        </div>
        
        {/* Información */}
        <div className="space-y-4">
          <SkeletonLoader variant="text" height="32px" width="80%" />
          <SkeletonLoader variant="text" height="24px" width="40%" />
          <SkeletonLoader variant="text" height="16px" width="60%" />
          <div className="space-y-2 mt-6">
            <SkeletonLoader variant="text" height="16px" width="100%" />
            <SkeletonLoader variant="text" height="16px" width="90%" />
            <SkeletonLoader variant="text" height="16px" width="95%" />
          </div>
          <div className="flex gap-4 mt-8">
            <SkeletonLoader variant="rectangle" height="48px" width="200px" />
            <SkeletonLoader variant="rectangle" height="48px" width="48px" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton para lista de órdenes
export const OrderCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <SkeletonLoader variant="text" height="20px" width="40%" />
          <SkeletonLoader variant="text" height="16px" width="30%" />
        </div>
        <SkeletonLoader variant="rectangle" height="28px" width="100px" />
      </div>
      <div className="space-y-2">
        <SkeletonLoader variant="text" height="16px" width="60%" />
        <SkeletonLoader variant="text" height="16px" width="50%" />
      </div>
      <div className="flex justify-between items-center pt-4 border-t">
        <SkeletonLoader variant="text" height="24px" width="30%" />
        <SkeletonLoader variant="rectangle" height="36px" width="120px" />
      </div>
    </div>
  );
};
