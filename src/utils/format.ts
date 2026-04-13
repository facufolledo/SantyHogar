export const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

export const discountPercent = (original: number, current: number) =>
  Math.round(((original - current) / original) * 100);
