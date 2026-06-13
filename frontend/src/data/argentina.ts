/**
 * Datos de provincias y ciudades de Córdoba, Argentina
 * Solo se opera en la provincia de Córdoba.
 * Fuente: INDEC y datos oficiales
 */

export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  provinceId: string;
}

// Solo Córdoba — el negocio opera únicamente en esta provincia
export const PROVINCES: Province[] = [
  { id: 'COR', name: 'Córdoba' },
];

export const CITIES: City[] = [
  // Córdoba Capital y GBA cordobés
  { id: 'COR-1',  name: 'Córdoba Capital',         provinceId: 'COR' },
  { id: 'COR-2',  name: 'Alta Gracia',              provinceId: 'COR' },
  { id: 'COR-3',  name: 'Anisacate',                provinceId: 'COR' },
  { id: 'COR-4',  name: 'Bouwer',                   provinceId: 'COR' },
  { id: 'COR-5',  name: 'Colonia Caroya',           provinceId: 'COR' },
  { id: 'COR-6',  name: 'Cosquín',                  provinceId: 'COR' },
  { id: 'COR-7',  name: 'Jesús María',              provinceId: 'COR' },
  { id: 'COR-8',  name: 'La Calera',                provinceId: 'COR' },
  { id: 'COR-9',  name: 'La Falda',                 provinceId: 'COR' },
  { id: 'COR-10', name: 'Malvinas Argentinas',      provinceId: 'COR' },
  { id: 'COR-11', name: 'Mendiolaza',               provinceId: 'COR' },
  { id: 'COR-12', name: 'Mina Clavero',             provinceId: 'COR' },
  { id: 'COR-13', name: 'Río Ceballos',             provinceId: 'COR' },
  { id: 'COR-14', name: 'Saldán',                   provinceId: 'COR' },
  { id: 'COR-15', name: 'Salsipuedes',              provinceId: 'COR' },
  { id: 'COR-16', name: 'Unquillo',                 provinceId: 'COR' },
  { id: 'COR-17', name: 'Valle Hermoso',            provinceId: 'COR' },
  { id: 'COR-18', name: 'Villa Allende',            provinceId: 'COR' },
  { id: 'COR-19', name: 'Villa Carlos Paz',         provinceId: 'COR' },
  { id: 'COR-20', name: 'Villa Dolores',            provinceId: 'COR' },

  // Sur de Córdoba
  { id: 'COR-21', name: 'Río Cuarto',               provinceId: 'COR' },
  { id: 'COR-22', name: 'Villa María',              provinceId: 'COR' },
  { id: 'COR-23', name: 'Bell Ville',               provinceId: 'COR' },
  { id: 'COR-24', name: 'Berrotarán',               provinceId: 'COR' },
  { id: 'COR-25', name: 'Huinca Renancó',           provinceId: 'COR' },
  { id: 'COR-26', name: 'La Carlota',               provinceId: 'COR' },
  { id: 'COR-27', name: 'Monte Maíz',               provinceId: 'COR' },
  { id: 'COR-28', name: 'Laboulaye',                provinceId: 'COR' },
  { id: 'COR-29', name: 'Villa Nueva',              provinceId: 'COR' },

  // Este de Córdoba
  { id: 'COR-30', name: 'San Francisco',            provinceId: 'COR' },
  { id: 'COR-31', name: 'Marcos Juárez',            provinceId: 'COR' },
  { id: 'COR-32', name: 'Arroyito',                 provinceId: 'COR' },
  { id: 'COR-33', name: 'Brinkmann',                provinceId: 'COR' },
  { id: 'COR-34', name: 'Las Varillas',             provinceId: 'COR' },
  { id: 'COR-35', name: 'Morteros',                 provinceId: 'COR' },
  { id: 'COR-36', name: 'Oliva',                    provinceId: 'COR' },
  { id: 'COR-37', name: 'Río Tercero',              provinceId: 'COR' },
  { id: 'COR-38', name: 'Villa del Rosario',        provinceId: 'COR' },

  // Norte de Córdoba
  { id: 'COR-39', name: 'Cruz del Eje',             provinceId: 'COR' },
  { id: 'COR-40', name: 'Dean Funes',               provinceId: 'COR' },
  { id: 'COR-41', name: 'Deán Funes',               provinceId: 'COR' },
  { id: 'COR-42', name: 'Quilino',                  provinceId: 'COR' },
  { id: 'COR-43', name: 'Villa de María',           provinceId: 'COR' },

  // Noroeste (Traslasierra)
  { id: 'COR-44', name: 'Nono',                     provinceId: 'COR' },
  { id: 'COR-45', name: 'San Javier',               provinceId: 'COR' },
  { id: 'COR-46', name: 'Villa Cura Brochero',      provinceId: 'COR' },
  { id: 'COR-47', name: 'Los Hornillos',            provinceId: 'COR' },
  { id: 'COR-48', name: 'Salsacate',                provinceId: 'COR' },
];

/**
 * Obtiene las ciudades de una provincia específica (ordenadas alfabéticamente)
 */
export function getCitiesByProvince(provinceId: string): City[] {
  return CITIES.filter(city => city.provinceId === provinceId).sort((a, b) =>
    a.name.localeCompare(b.name, 'es')
  );
}

/**
 * Busca una provincia por su nombre
 */
export function getProvinceByName(name: string): Province | undefined {
  return PROVINCES.find(p => p.name === name);
}

/**
 * Busca una ciudad por su nombre y provincia
 */
export function getCityByName(name: string, provinceId: string): City | undefined {
  return CITIES.find(c => c.name === name && c.provinceId === provinceId);
}
