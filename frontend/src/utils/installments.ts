/**
 * Calcula cuotas sin interés basado en MercadoPago
 * MercadoPago ofrece hasta 12 cuotas sin interés en Argentina
 */

export interface Installment {
  quantity: number;
  amount: number;
  hasInterest: boolean;
}

const MAX_INSTALLMENTS_NO_INTEREST = 12;
const MIN_AMOUNT_FOR_INSTALLMENTS = 3000; // Monto mínimo para ofrecer cuotas

export function calculateInstallments(totalAmount: number): Installment[] {
  // Si el monto es muy bajo, no ofrecer cuotas
  if (totalAmount < MIN_AMOUNT_FOR_INSTALLMENTS) {
    return [];
  }

  const installments: Installment[] = [];

  // Agregar cuotas sin interés (1 a 12)
  for (let i = 1; i <= MAX_INSTALLMENTS_NO_INTEREST; i++) {
    const amount = Math.round((totalAmount / i) * 100) / 100; // Redondear a 2 decimales
    installments.push({
      quantity: i,
      amount,
      hasInterest: false,
    });
  }

  return installments;
}

/**
 * Obtiene las opciones principales de cuotas a mostrar
 * Retorna: 1, 3, 6, 12 cuotas
 */
export function getMainInstallmentOptions(totalAmount: number): Installment[] {
  const allInstallments = calculateInstallments(totalAmount);
  const mainQuantities = [1, 3, 6, 12];

  return allInstallments.filter(inst => mainQuantities.includes(inst.quantity));
}
