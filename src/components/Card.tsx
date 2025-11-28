import { CSSProperties } from 'react';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  highlight?: boolean;
  style?: CSSProperties;
}

export default function Card({ children, onClick, className = '', highlight = false, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-white border-2 ${highlight ? 'border-black' : 'border-gray-300'} rounded-xl p-6 smooth-transition ${
        onClick ? 'cursor-pointer card-hover' : 'shadow-sm'
      } ${highlight ? 'shadow-lg' : 'hover:shadow-md'} ${className}`}
    >
      {children}
    </div>
  );
}
