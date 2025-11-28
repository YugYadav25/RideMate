interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  title?: string;
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  size = 'md',
  disabled = false,
  className = '',
  title,
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantStyles = {
    primary: 'bg-black text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50 hover:-translate-y-0.5 active:scale-95',
    outline: 'bg-transparent text-black border-2 border-black hover:bg-gray-50 hover:-translate-y-0.5 active:scale-95',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none' : '';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${disabledStyles} inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black ${className}`}
    >
      {children}
    </button>
  );
}
