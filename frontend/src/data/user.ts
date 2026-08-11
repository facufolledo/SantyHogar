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
