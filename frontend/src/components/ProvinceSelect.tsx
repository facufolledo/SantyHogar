import { PROVINCES } from '../data/argentina';

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function ProvinceSelect({ 
  value, 
  onChange, 
  required = false, 
  disabled = false,
  className = '',
  placeholder = 'Seleccionar provincia'
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <option value="">{placeholder}</option>
      {PROVINCES.map((province) => (
        <option key={province.id} value={province.name}>
          {province.name}
        </option>
      ))}
    </select>
  );
}
