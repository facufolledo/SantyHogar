/**
 * Utilidades para trabajar con fechas
 * 
 * El backend devuelve fechas en horario de Argentina (UTC-3)
 * Este archivo centraliza la conversión de fechas para evitar diferencias horarias.
 */

/**
 * Parsea una fecha ISO del backend y la formatea para mostrar en Argentina
 * @param isoString - Fecha en formato ISO (ej: "2024-06-28T15:30:00-03:00")
 * @param format - 'date' (solo fecha), 'datetime' (fecha y hora), 'time' (solo hora)
 * @returns Fecha formateada en español argentino
 */
export function formatDateArg(
  isoString: string | Date,
  format: 'date' | 'datetime' | 'time' = 'date'
): string {
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;

    if (isNaN(date.getTime())) {
      return '-';
    }

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Argentina/Buenos_Aires',
    };

    switch (format) {
      case 'date':
        return date.toLocaleDateString('es-AR', {
          ...options,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      case 'datetime':
        return date.toLocaleDateString('es-AR', {
          ...options,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'time':
        return date.toLocaleTimeString('es-AR', {
          ...options,
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        return date.toLocaleDateString('es-AR', {
          ...options,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
    }
  } catch {
    return '-';
  }
}

/**
 * Obtiene la fecha actual en horario de Argentina
 * @returns Objeto Date con la hora actual de Argentina
 */
export function getArgentinaDateNow(): Date {
  return new Date();
}

/**
 * Convierte una fecha a ISO string en horario de Argentina
 * @param date - Objeto Date
 * @returns String ISO con zona horaria de Argentina
 */
export function toArgentinaISO(date: Date): string {
  return date.toISOString();
}
