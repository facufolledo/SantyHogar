import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="mb-4">
            <span className="text-white text-2xl font-black tracking-tight">SANTY</span>
            <span className="text-primary-400 text-2xl font-black tracking-tight"> HOGAR</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Tu tienda de electrodomésticos, mueblería y colchonería con los mejores precios y financiación.
          </p>
          <div className="flex gap-3">
            <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
              <Facebook size={15} />
            </a>
            <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors">
              <Instagram size={15} />
            </a>
            <a href="https://wa.me/5491140000000" className="w-8 h-8 bg-gray-700 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
              <MessageCircle size={15} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Categorías</h4>
          <ul className="space-y-2 text-sm">
            {['Electrodomésticos', 'Mueblería', 'Colchonería'].map(cat => (
              <li key={cat}>
                <Link to={`/tienda?cat=${cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}
                  className="hover:text-white transition-colors">
                  {cat}
                </Link>
              </li>
            ))}
            <li><Link to="/tienda" className="hover:text-white transition-colors">Ver todo</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Información</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Envíos y devoluciones</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Medios de pago</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Garantías</a></li>
            <li><Link to="/admin" className="hover:text-white transition-colors">Panel admin</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contacto</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Phone size={15} className="mt-0.5 text-primary-400 flex-shrink-0" />
              <span>(011) 4000-0000</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail size={15} className="mt-0.5 text-primary-400 flex-shrink-0" />
              <span>ventas@santyhogar.com.ar</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 text-primary-400 flex-shrink-0" />
              <span>Viamonte 1261, B° Pueyrredón, Córdoba</span>
            </li>
          </ul>
          <div className="mt-4 text-xs text-gray-500">
            <p>Lun–Vie: 9:00 – 18:00</p>
            <p>Sáb: 9:00 – 13:00</p>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <span>© 2025 Santy Hogar. Todos los derechos reservados.</span>
        <div className="flex items-center gap-4">
          <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png" alt="Mercado Pago" className="h-5 opacity-50" />
          <span className="opacity-50">Fiserv</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
