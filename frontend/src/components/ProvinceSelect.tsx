interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Selector de provincia — solo opera en Córdoba.
 * Se muestra como campo de texto fijo (no editable) para informar al usuario
 * que los envíos están limitados a Córdoba.
 */
export default function ProvinceSelect({
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
}: Props) {
  // Si aún no está seteado, auto-seleccionamos Córdoba
  if (!value) {
    onChange('Córdoba');
  }

  return (
    <div className="relative">
      <input
        type="text"
        value="Córdoba"
        readOnly
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-not-allowed ${className}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-600 font-medium bg-primary-50 px-1.5 py-0.5 rounded">
        Solo Cba
      </span>
    </div>
  );
}
