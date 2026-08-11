import { useMemo } from 'react';
import { getCitiesByProvince, getProvinceByName } from '../data/argentina';

interface Props {
  province: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function CitySelect({ 
  province,
  value, 
  onChange, 
  required = false, 
  disabled = false,
  className = '',
  placeholder = 'Seleccionar ciudad'
}: Props) {
  const cities = useMemo(() => {
    if (!province) return [];
    const prov = getProvinceByName(province);
    if (!prov) return [];
    return getCitiesByProvince(prov.id);
  }, [province]);

  const isDisabled = disabled || !province || cities.length === 0;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={isDisabled}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <option value="">
        {!province ? 'Primero seleccione una provincia' : placeholder}
      </option>
      {cities.map((city) => (
        <option key={city.id} value={city.name}>
          {city.name}
        </option>
      ))}
    </select>
  );
}
