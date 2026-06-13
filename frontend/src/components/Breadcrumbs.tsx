import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const location = useLocation();

  // Si no se pasan items, generar automáticamente desde la ruta
  const breadcrumbs = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-600 mb-6">
      <Link 
        to="/" 
        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
        aria-label="Inicio"
      >
        <Home size={16} />
      </Link>
      
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight size={16} className="text-gray-400" />
            {isLast || !item.path ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.path} 
                className="hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

// Función para generar breadcrumbs automáticamente desde la ruta
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Mapeo de rutas a nombres legibles
  const routeNames: Record<string, string> = {
    'tienda': 'Tienda',
    'producto': 'Producto',
    'carrito': 'Carrito',
    'checkout': 'Checkout',
    'cuenta': 'Mi Cuenta',
    'pedidos': 'Mis Pedidos',
    'favoritos': 'Mis Favoritos',
    'direcciones': 'Mis Direcciones',
    'seguridad': 'Seguridad',
    'admin': 'Admin',
    'productos': 'Productos',
    'clientes': 'Clientes',
    'ordenes': 'Órdenes',
    'importar': 'Importar',
    'usuarios': 'Usuarios',
  };

  let currentPath = '';
  
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // No agregar el último segmento si es un ID (UUID o slug)
    const isId = segment.match(/^[a-f0-9-]{36}$/) || (index === paths.length - 1 && paths.length > 1);
    
    if (!isId) {
      breadcrumbs.push({
        label: routeNames[segment] || capitalize(segment),
        path: index < paths.length - 1 ? currentPath : undefined,
      });
    }
  });

  return breadcrumbs;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default Breadcrumbs;
