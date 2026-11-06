export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  zip: string;
  isPrimary: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedAt: string;
  addresses: Address[];
  favorites: string[]; // product ids
}

export const mockUser: UserProfile = {
  id: 'u1',
  name: 'María González',
  email: 'maria@email.com',
  phone: '011 1234-5678',
  avatar: '',
  joinedAt: '2023-06-10',
  addresses: [
    { id: 'a1', label: 'Casa', street: 'Av. Corrientes 1234, Piso 3', city: 'Buenos Aires', province: 'Buenos Aires', zip: '1043', isPrimary: true },
    { id: 'a2', label: 'Trabajo', street: 'Av. Santa Fe 890', city: 'Buenos Aires', province: 'Buenos Aires', zip: '1059', isPrimary: false },
  ],
  /** Slugs estables (coinciden con API y catálogo estático). */
  favorites: ['lavarropas-automatico-8kg', 'smart-tv-55-4k', 'colchon-resortes-2-plazas'],
};

export const mockSessions = [
  { id: 's1', device: 'Chrome · Windows', location: 'Buenos Aires, AR', lastActive: 'Ahora', current: true },
  { id: 's2', device: 'Safari · iPhone', location: 'Buenos Aires, AR', lastActive: 'Hace 2 días', current: false },
];
