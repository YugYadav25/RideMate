import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export default function Input({
  label,
  icon,
  error,
  required,
  className = '',
  ...rest
}: InputProps) {
  return (
    <div className="mb-5">
      {label && (
        <label className="block text-sm font-semibold mb-2.5 text-black">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">{icon}</div>}
        <input
          {...rest}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 border-2 ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg smooth-transition focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white ${className}`}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1.5 font-medium">{error}</p>}
    </div>
  );
}
