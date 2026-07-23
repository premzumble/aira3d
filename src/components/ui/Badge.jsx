const variantStyles = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  secondary: 'bg-gray-100 text-gray-800 border-gray-200',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function Badge({ 
  children, 
  variant = 'secondary', 
  size = 'sm',
  className = '' 
}) {
  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
