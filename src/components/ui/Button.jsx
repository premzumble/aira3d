import { forwardRef } from 'react';

const variants = {
  primary: 'btn-primary', // Tailwind base class from index.css
  secondary: 'btn-secondary',
  outline: 'border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 bg-transparent',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-4 text-lg'
};

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  disabled = false,
  ...props 
}, ref) => {
  
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Use btn-primary/btn-secondary if standard, else build from classes
  const isStandardBtn = variant === 'primary' || variant === 'secondary';
  
  const finalClassName = isStandardBtn 
    ? `${variants[variant]} ${sizes[size]} ${className}`
    : `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button 
      ref={ref}
      disabled={disabled || isLoading}
      className={finalClassName}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
