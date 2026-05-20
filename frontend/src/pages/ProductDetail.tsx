import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChevronRight, Star, Truck, Shield, RefreshCw, Minus, Plus, Lock, Heart, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import ProductsErrorBanner from '../components/ProductsErrorBanner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';
import { ProductDetailSkeleton } from '../components/SkeletonLoader';
import Breadcrumbs from '../components/Breadcrumbs';

// Cálculo de impuestos argentinos
const IVA_RATE = 0.21; // 21% IVA en Argentina

// Configuración de cuotas (simulación - en producción vendría de MercadoPago API)
const INSTALLMENT_CONFIG = [
  { installments: 1, interestRate: 0, label: 'Pago único' },
  { installments: 2, interestRate: 0, label: '2 cuotas sin interés' },
  { installments: 3, interestRate: 0, label: '3 cuotas sin interés' },
  { installments: 6, interestRate: 0.15, label: '6 cuotas' },
  { installments: 12, interestRate: 0.30, label: '12 cuotas' },
];

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading, error } = useProducts();
  const product = products.find(p => p.slug === slug);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [showAllInstallments, setShowAllInstallments] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { isLogged } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  if (loading && !product) {
    return <ProductDetailSkeleton />;
  }

  if (error && !loading && products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <ProductsErrorBanner />
      </div>
    );
  }

  if (!product) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h2 className="text-xl font-bold mb-2">Producto no encontrado</h2>
      <Link to="/tienda" className="text-primary-600 hover:underline">Volver a la tienda</Link>
    </div>
  );

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  // Cálculos de precio
  const priceWithoutTax = Math.round(product.price / (1 + IVA_RATE));
  const taxAmount = product.price - priceWithoutTax;

  // Calcular cuotas
  const calculateInstallment = (installments: number, interestRate: number) => {
    const totalWithInterest = product.price * (1 + interestRate);
    return Math.round(totalWithInterest / installments);
  };

  // Compartir en redes sociales
  const shareUrl = window.location.href;
  const shareText = `${product.name} - ${formatPrice(product.price)}`;

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  // Zoom en imagen
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleAdd = () => {
    if (!isLogged) { setShowAuth(true); return; }
    for (let i = 0; i < qty; i++) addItem(product);
    // El sidebar se abre automáticamente, no necesitamos toast
  };

  const handleBuyNow = () => {
    if (!isLogged) { setShowAuth(true); return; }
    for (let i = 0; i < qty; i++) addItem(product);
    navigate('/checkout');
  };

  const handleToggleFavorite = async () => {
    if (!isLogged) {
      setShowAuth(true);
      return;
    }

    setTogglingFav(true);
    try {
      await toggleFavorite(product.id);
      toast(isFavorite(product.id) ? 'Eliminado de favoritos' : 'Agregado a favoritos');
    } catch (error: any) {
      toast(error?.message || 'Error al actualizar favoritos', 'error');
    } finally {
      setTogglingFav(false);
    }
  };

  const isFav = isFavorite(product.id);

  const catLabels: Record<string, string> = {
    electrodomesticos: 'Electrodomésticos',
    muebleria: 'Mueblería',
    colchoneria: 'Colchonería',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <Breadcrumbs items={[
        { label: 'Tienda', path: '/tienda' },
        { label: catLabels[product.category] || product.category, path: `/tienda?cat=${product.category}` },
        { label: product.name },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Gallery with Zoom */}
        <div>
          <motion.div
            ref={imgRef}
            key={activeImg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3 relative cursor-crosshair"
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
          >
            <img 
              src={product.images[activeImg]} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-200"
              style={isZooming ? {
                transform: 'scale(2)',
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`
              } : {}}
            />
            {isZooming && (
              <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
                Zoom activo
              </div>
            )}
          </motion.div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-400 mb-1">{product.brand} · {product.subcategory}</p>
          
          {/* Title with Favorite and Share Buttons */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">{product.name}</h1>
            <div className="flex items-center gap-2">
              {/* Share Button */}
              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex-shrink-0 w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                  title="Compartir producto"
                >
                  <Share2 size={20} className="text-gray-600" />
                </button>
                
                {/* Share Menu */}
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-14 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 z-50 w-56"
                  >
                    <p className="text-xs font-semibold text-gray-500 mb-2 px-2">Compartir en:</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleShare('facebook')}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
                      >
                        <Facebook size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sky-50 rounded-lg transition-colors text-left"
                      >
                        <Twitter size={18} className="text-sky-500" />
                        <span className="text-sm font-medium text-gray-700">Twitter</span>
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-green-50 rounded-lg transition-colors text-left"
                      >
                        <svg className="w-[18px] h-[18px] text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
                      >
                        <Linkedin size={18} className="text-blue-700" />
                        <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                      </button>
                      <div className="border-t border-gray-100 my-2" />
                      <button
                        onClick={copyLink}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        {copied ? (
                          <>
                            <Check size={18} className="text-green-600" />
                            <span className="text-sm font-medium text-green-600">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon size={18} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Copiar link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                disabled={togglingFav}
                className="flex-shrink-0 w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50"
                title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Heart 
                  size={20} 
                  className={`transition-all duration-200 ${
                    isFav 
                      ? 'text-red-500 fill-red-500' 
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16} className={s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-sm text-gray-500">{product.rating} ({product.reviews} reseñas)</span>
          </div>

          {/* Price with Tax Breakdown */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-5 mb-5 border border-primary-100">
            {product.originalPrice && (
              <p className="text-sm text-gray-500 line-through mb-1">{formatPrice(product.originalPrice)}</p>
            )}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">Precio final</span>
              <p className="text-4xl font-black text-gray-900">{formatPrice(product.price)}</p>
            </div>
            
            {/* Precio sin impuestos */}
            <div className="bg-white/60 rounded-lg p-3 mb-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Precio sin impuestos nacionales:</span>
                <span className="font-semibold text-gray-900">{formatPrice(priceWithoutTax)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">IVA (21%):</span>
                <span className="text-gray-700">{formatPrice(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Precio por unidad:</span>
                <span className="text-gray-700">{formatPrice(product.price)}</span>
              </div>
            </div>

            {/* Cuotas destacadas (solo 3 cuotas sin interés) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cuotas disponibles</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">3 Cuotas sin interés de</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatPrice(calculateInstallment(3, 0))}
                </span>
              </div>
              
              {/* Botón para ver todas las cuotas */}
              <button 
                onClick={() => setShowAllInstallments(!showAllInstallments)}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2 hover:bg-white/50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                {showAllInstallments ? 'Ocultar' : 'Ver todas las'} cuotas y medios de pago
                <motion.svg 
                  animate={{ rotate: showAllInstallments ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              {/* Sección expandible de cuotas */}
              {showAllInstallments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-4 mt-4 border-t border-gray-200 space-y-4"
                >
                  {/* Cuotas sin interés */}
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Cuotas sin interés
                    </h3>
                    <div className="space-y-2">
                      {INSTALLMENT_CONFIG.filter(c => c.interestRate === 0 && c.installments > 1).map(({ installments }) => {
                        const amount = calculateInstallment(installments, 0);
                        return (
                          <div key={installments} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{installments} cuotas de</span>
                            <span className="font-bold text-green-700">{formatPrice(amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cuotas con interés */}
                  <div>
                    <h3 className="font-semibold text-blue-700 mb-2 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      Más cuotas
                    </h3>
                    <div className="space-y-2">
                      {INSTALLMENT_CONFIG.filter(c => c.interestRate > 0).map(({ installments, interestRate }) => {
                        const amount = calculateInstallment(installments, interestRate);
                        const total = amount * installments;
                        const interestPercent = Math.round(interestRate * 100);
                        return (
                          <div key={installments} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">{installments} cuotas de</span>
                              <span className="font-bold text-blue-700">{formatPrice(amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                              <span>Total: {formatPrice(total)}</span>
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                +{interestPercent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    * Valores simulados. Las cuotas reales se calculan con MercadoPago al momento del pago.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2 h-2 rounded-full ${product.stock > 3 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {product.stock > 3 ? 'En stock' : product.stock > 0 ? `Solo ${product.stock} disponibles` : 'Sin stock'}
            </span>
          </div>

          {/* Qty */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-gray-600 font-medium">Cantidad:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="px-4 py-2 text-sm font-semibold border-x border-gray-200">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button onClick={handleAdd} disabled={product.stock === 0} className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 disabled:opacity-40 font-semibold py-3 rounded-xl transition-all">
              {!isLogged ? <Lock size={18} /> : <ShoppingCart size={18} />}
              {!isLogged ? 'Iniciá sesión para comprar' : 'Agregar al carrito'}
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all active:scale-95">
              {!isLogged ? 'Registrate' : 'Comprar ahora'}
            </button>
          </div>

          {/* Trust */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            {[
              { icon: Truck, text: 'Envío gratis en compras mayores a $200.000' },
              { icon: Shield, text: 'Garantía oficial del fabricante' },
              { icon: RefreshCw, text: 'Devolución sin cargo en 30 días' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
                <Icon size={15} className="text-primary-600 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description + Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-3">Descripción</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-3">Especificaciones</h2>
          <dl className="space-y-2">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Productos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Auth modal */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default ProductDetail;

