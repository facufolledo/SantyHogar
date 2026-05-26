/**
 * Datos de provincias y ciudades de Argentina
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

export const PROVINCES: Province[] = [
  { id: 'CABA', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'BA', name: 'Buenos Aires' },
  { id: 'CAT', name: 'Catamarca' },
  { id: 'CHA', name: 'Chaco' },
  { id: 'CHU', name: 'Chubut' },
  { id: 'COR', name: 'Córdoba' },
  { id: 'COR', name: 'Corrientes' },
  { id: 'ER', name: 'Entre Ríos' },
  { id: 'FOR', name: 'Formosa' },
  { id: 'JUJ', name: 'Jujuy' },
  { id: 'LP', name: 'La Pampa' },
  { id: 'LR', name: 'La Rioja' },
  { id: 'MZA', name: 'Mendoza' },
  { id: 'MIS', name: 'Misiones' },
  { id: 'NEU', name: 'Neuquén' },
  { id: 'RN', name: 'Río Negro' },
  { id: 'SAL', name: 'Salta' },
  { id: 'SJ', name: 'San Juan' },
  { id: 'SL', name: 'San Luis' },
  { id: 'SC', name: 'Santa Cruz' },
  { id: 'SF', name: 'Santa Fe' },
  { id: 'SE', name: 'Santiago del Estero' },
  { id: 'TF', name: 'Tierra del Fuego' },
  { id: 'TUC', name: 'Tucumán' },
];

export const CITIES: City[] = [
  // Ciudad Autónoma de Buenos Aires
  { id: 'CABA-1', name: 'Ciudad Autónoma de Buenos Aires', provinceId: 'CABA' },
  
  // Buenos Aires (principales)
  { id: 'BA-1', name: 'La Plata', provinceId: 'BA' },
  { id: 'BA-2', name: 'Mar del Plata', provinceId: 'BA' },
  { id: 'BA-3', name: 'Bahía Blanca', provinceId: 'BA' },
  { id: 'BA-4', name: 'Tandil', provinceId: 'BA' },
  { id: 'BA-5', name: 'Olavarría', provinceId: 'BA' },
  { id: 'BA-6', name: 'Junín', provinceId: 'BA' },
  { id: 'BA-7', name: 'Pergamino', provinceId: 'BA' },
  { id: 'BA-8', name: 'Azul', provinceId: 'BA' },
  { id: 'BA-9', name: 'Necochea', provinceId: 'BA' },
  { id: 'BA-10', name: 'Quilmes', provinceId: 'BA' },
  { id: 'BA-11', name: 'Avellaneda', provinceId: 'BA' },
  { id: 'BA-12', name: 'Lanús', provinceId: 'BA' },
  { id: 'BA-13', name: 'San Isidro', provinceId: 'BA' },
  { id: 'BA-14', name: 'Vicente López', provinceId: 'BA' },
  { id: 'BA-15', name: 'Morón', provinceId: 'BA' },
  { id: 'BA-16', name: 'San Martín', provinceId: 'BA' },
  { id: 'BA-17', name: 'Tres de Febrero', provinceId: 'BA' },
  { id: 'BA-18', name: 'La Matanza', provinceId: 'BA' },
  { id: 'BA-19', name: 'Lomas de Zamora', provinceId: 'BA' },
  { id: 'BA-20', name: 'Almirante Brown', provinceId: 'BA' },
  { id: 'BA-21', name: 'Esteban Echeverría', provinceId: 'BA' },
  { id: 'BA-22', name: 'Florencio Varela', provinceId: 'BA' },
  { id: 'BA-23', name: 'Berazategui', provinceId: 'BA' },
  { id: 'BA-24', name: 'San Fernando', provinceId: 'BA' },
  { id: 'BA-25', name: 'Tigre', provinceId: 'BA' },
  { id: 'BA-26', name: 'Pilar', provinceId: 'BA' },
  { id: 'BA-27', name: 'Escobar', provinceId: 'BA' },
  { id: 'BA-28', name: 'San Miguel', provinceId: 'BA' },
  { id: 'BA-29', name: 'Malvinas Argentinas', provinceId: 'BA' },
  { id: 'BA-30', name: 'José C. Paz', provinceId: 'BA' },
  { id: 'BA-31', name: 'Hurlingham', provinceId: 'BA' },
  { id: 'BA-32', name: 'Ituzaingó', provinceId: 'BA' },
  { id: 'BA-33', name: 'Merlo', provinceId: 'BA' },
  { id: 'BA-34', name: 'Moreno', provinceId: 'BA' },
  { id: 'BA-35', name: 'San Nicolás', provinceId: 'BA' },
  { id: 'BA-36', name: 'Campana', provinceId: 'BA' },
  { id: 'BA-37', name: 'Zárate', provinceId: 'BA' },
  { id: 'BA-38', name: 'Luján', provinceId: 'BA' },
  { id: 'BA-39', name: 'Mercedes', provinceId: 'BA' },
  { id: 'BA-40', name: 'Chivilcoy', provinceId: 'BA' },

  // Catamarca
  { id: 'CAT-1', name: 'San Fernando del Valle de Catamarca', provinceId: 'CAT' },
  { id: 'CAT-2', name: 'Andalgalá', provinceId: 'CAT' },
  { id: 'CAT-3', name: 'Belén', provinceId: 'CAT' },
  { id: 'CAT-4', name: 'Santa María', provinceId: 'CAT' },
  { id: 'CAT-5', name: 'Tinogasta', provinceId: 'CAT' },

  // Chaco
  { id: 'CHA-1', name: 'Resistencia', provinceId: 'CHA' },
  { id: 'CHA-2', name: 'Presidencia Roque Sáenz Peña', provinceId: 'CHA' },
  { id: 'CHA-3', name: 'Villa Ángela', provinceId: 'CHA' },
  { id: 'CHA-4', name: 'Charata', provinceId: 'CHA' },
  { id: 'CHA-5', name: 'General San Martín', provinceId: 'CHA' },

  // Chubut
  { id: 'CHU-1', name: 'Rawson', provinceId: 'CHU' },
  { id: 'CHU-2', name: 'Comodoro Rivadavia', provinceId: 'CHU' },
  { id: 'CHU-3', name: 'Puerto Madryn', provinceId: 'CHU' },
  { id: 'CHU-4', name: 'Trelew', provinceId: 'CHU' },
  { id: 'CHU-5', name: 'Esquel', provinceId: 'CHU' },

  // Córdoba
  { id: 'COR-1', name: 'Córdoba', provinceId: 'COR' },
  { id: 'COR-2', name: 'Río Cuarto', provinceId: 'COR' },
  { id: 'COR-3', name: 'Villa María', provinceId: 'COR' },
  { id: 'COR-4', name: 'San Francisco', provinceId: 'COR' },
  { id: 'COR-5', name: 'Villa Carlos Paz', provinceId: 'COR' },
  { id: 'COR-6', name: 'Alta Gracia', provinceId: 'COR' },
  { id: 'COR-7', name: 'Bell Ville', provinceId: 'COR' },
  { id: 'COR-8', name: 'Marcos Juárez', provinceId: 'COR' },
  { id: 'COR-9', name: 'Villa Dolores', provinceId: 'COR' },
  { id: 'COR-10', name: 'Jesús María', provinceId: 'COR' },

  // Corrientes
  { id: 'CORR-1', name: 'Corrientes', provinceId: 'COR' },
  { id: 'CORR-2', name: 'Goya', provinceId: 'COR' },
  { id: 'CORR-3', name: 'Paso de los Libres', provinceId: 'COR' },
  { id: 'CORR-4', name: 'Mercedes', provinceId: 'COR' },
  { id: 'CORR-5', name: 'Curuzú Cuatiá', provinceId: 'COR' },

  // Entre Ríos
  { id: 'ER-1', name: 'Paraná', provinceId: 'ER' },
  { id: 'ER-2', name: 'Concordia', provinceId: 'ER' },
  { id: 'ER-3', name: 'Gualeguaychú', provinceId: 'ER' },
  { id: 'ER-4', name: 'Concepción del Uruguay', provinceId: 'ER' },
  { id: 'ER-5', name: 'Victoria', provinceId: 'ER' },

  // Formosa
  { id: 'FOR-1', name: 'Formosa', provinceId: 'FOR' },
  { id: 'FOR-2', name: 'Clorinda', provinceId: 'FOR' },
  { id: 'FOR-3', name: 'Pirané', provinceId: 'FOR' },
  { id: 'FOR-4', name: 'El Colorado', provinceId: 'FOR' },

  // Jujuy
  { id: 'JUJ-1', name: 'San Salvador de Jujuy', provinceId: 'JUJ' },
  { id: 'JUJ-2', name: 'San Pedro', provinceId: 'JUJ' },
  { id: 'JUJ-3', name: 'Libertador General San Martín', provinceId: 'JUJ' },
  { id: 'JUJ-4', name: 'Palpalá', provinceId: 'JUJ' },
  { id: 'JUJ-5', name: 'La Quiaca', provinceId: 'JUJ' },

  // La Pampa
  { id: 'LP-1', name: 'Santa Rosa', provinceId: 'LP' },
  { id: 'LP-2', name: 'General Pico', provinceId: 'LP' },
  { id: 'LP-3', name: 'General Acha', provinceId: 'LP' },
  { id: 'LP-4', name: 'Eduardo Castex', provinceId: 'LP' },

  // La Rioja
  { id: 'LR-1', name: 'La Rioja', provinceId: 'LR' },
  { id: 'LR-2', name: 'Chilecito', provinceId: 'LR' },
  { id: 'LR-3', name: 'Aimogasta', provinceId: 'LR' },
  { id: 'LR-4', name: 'Chamical', provinceId: 'LR' },

  // Mendoza
  { id: 'MZA-1', name: 'Mendoza', provinceId: 'MZA' },
  { id: 'MZA-2', name: 'San Rafael', provinceId: 'MZA' },
  { id: 'MZA-3', name: 'Godoy Cruz', provinceId: 'MZA' },
  { id: 'MZA-4', name: 'Guaymallén', provinceId: 'MZA' },
  { id: 'MZA-5', name: 'Las Heras', provinceId: 'MZA' },
  { id: 'MZA-6', name: 'Maipú', provinceId: 'MZA' },
  { id: 'MZA-7', name: 'Luján de Cuyo', provinceId: 'MZA' },
  { id: 'MZA-8', name: 'San Martín', provinceId: 'MZA' },
  { id: 'MZA-9', name: 'Tunuyán', provinceId: 'MZA' },
  { id: 'MZA-10', name: 'Malargüe', provinceId: 'MZA' },

  // Misiones
  { id: 'MIS-1', name: 'Posadas', provinceId: 'MIS' },
  { id: 'MIS-2', name: 'Oberá', provinceId: 'MIS' },
  { id: 'MIS-3', name: 'Eldorado', provinceId: 'MIS' },
  { id: 'MIS-4', name: 'Puerto Iguazú', provinceId: 'MIS' },
  { id: 'MIS-5', name: 'Apóstoles', provinceId: 'MIS' },

  // Neuquén
  { id: 'NEU-1', name: 'Neuquén', provinceId: 'NEU' },
  { id: 'NEU-2', name: 'San Martín de los Andes', provinceId: 'NEU' },
  { id: 'NEU-3', name: 'Zapala', provinceId: 'NEU' },
  { id: 'NEU-4', name: 'Cutral Có', provinceId: 'NEU' },
  { id: 'NEU-5', name: 'Plottier', provinceId: 'NEU' },
  { id: 'NEU-6', name: 'Centenario', provinceId: 'NEU' },
  { id: 'NEU-7', name: 'Villa La Angostura', provinceId: 'NEU' },

  // Río Negro
  { id: 'RN-1', name: 'Viedma', provinceId: 'RN' },
  { id: 'RN-2', name: 'San Carlos de Bariloche', provinceId: 'RN' },
  { id: 'RN-3', name: 'General Roca', provinceId: 'RN' },
  { id: 'RN-4', name: 'Cipolletti', provinceId: 'RN' },
  { id: 'RN-5', name: 'Villa Regina', provinceId: 'RN' },
  { id: 'RN-6', name: 'Río Colorado', provinceId: 'RN' },
  { id: 'RN-7', name: 'El Bolsón', provinceId: 'RN' },

  // Salta
  { id: 'SAL-1', name: 'Salta', provinceId: 'SAL' },
  { id: 'SAL-2', name: 'San Ramón de la Nueva Orán', provinceId: 'SAL' },
  { id: 'SAL-3', name: 'Tartagal', provinceId: 'SAL' },
  { id: 'SAL-4', name: 'Metán', provinceId: 'SAL' },
  { id: 'SAL-5', name: 'Cafayate', provinceId: 'SAL' },

  // San Juan
  { id: 'SJ-1', name: 'San Juan', provinceId: 'SJ' },
  { id: 'SJ-2', name: 'Rawson', provinceId: 'SJ' },
  { id: 'SJ-3', name: 'Chimbas', provinceId: 'SJ' },
  { id: 'SJ-4', name: 'Rivadavia', provinceId: 'SJ' },
  { id: 'SJ-5', name: 'Caucete', provinceId: 'SJ' },

  // San Luis
  { id: 'SL-1', name: 'San Luis', provinceId: 'SL' },
  { id: 'SL-2', name: 'Villa Mercedes', provinceId: 'SL' },
  { id: 'SL-3', name: 'Merlo', provinceId: 'SL' },
  { id: 'SL-4', name: 'La Punta', provinceId: 'SL' },

  // Santa Cruz
  { id: 'SC-1', name: 'Río Gallegos', provinceId: 'SC' },
  { id: 'SC-2', name: 'Caleta Olivia', provinceId: 'SC' },
  { id: 'SC-3', name: 'Pico Truncado', provinceId: 'SC' },
  { id: 'SC-4', name: 'Puerto Deseado', provinceId: 'SC' },
  { id: 'SC-5', name: 'El Calafate', provinceId: 'SC' },

  // Santa Fe
  { id: 'SF-1', name: 'Santa Fe', provinceId: 'SF' },
  { id: 'SF-2', name: 'Rosario', provinceId: 'SF' },
  { id: 'SF-3', name: 'Rafaela', provinceId: 'SF' },
  { id: 'SF-4', name: 'Venado Tuerto', provinceId: 'SF' },
  { id: 'SF-5', name: 'Reconquista', provinceId: 'SF' },
  { id: 'SF-6', name: 'Villa Gobernador Gálvez', provinceId: 'SF' },
  { id: 'SF-7', name: 'Casilda', provinceId: 'SF' },
  { id: 'SF-8', name: 'Esperanza', provinceId: 'SF' },

  // Santiago del Estero
  { id: 'SE-1', name: 'Santiago del Estero', provinceId: 'SE' },
  { id: 'SE-2', name: 'La Banda', provinceId: 'SE' },
  { id: 'SE-3', name: 'Termas de Río Hondo', provinceId: 'SE' },
  { id: 'SE-4', name: 'Frías', provinceId: 'SE' },
  { id: 'SE-5', name: 'Añatuya', provinceId: 'SE' },

  // Tierra del Fuego
  { id: 'TF-1', name: 'Ushuaia', provinceId: 'TF' },
  { id: 'TF-2', name: 'Río Grande', provinceId: 'TF' },
  { id: 'TF-3', name: 'Tolhuin', provinceId: 'TF' },

  // Tucumán
  { id: 'TUC-1', name: 'San Miguel de Tucumán', provinceId: 'TUC' },
  { id: 'TUC-2', name: 'Yerba Buena', provinceId: 'TUC' },
  { id: 'TUC-3', name: 'Tafí Viejo', provinceId: 'TUC' },
  { id: 'TUC-4', name: 'Concepción', provinceId: 'TUC' },
  { id: 'TUC-5', name: 'Aguilares', provinceId: 'TUC' },
  { id: 'TUC-6', name: 'Monteros', provinceId: 'TUC' },
];

/**
 * Obtiene las ciudades de una provincia específica
 */
export function getCitiesByProvince(provinceId: string): City[] {
  return CITIES.filter(city => city.provinceId === provinceId).sort((a, b) => 
    a.name.localeCompare(b.name)
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
