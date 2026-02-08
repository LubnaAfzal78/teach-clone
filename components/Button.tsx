import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'teacher' | 'student' | 'admin';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  let baseStyles = "w-full py-3 px-6 rounded-lg font-semibold shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2";
  
  let colorStyles = "";
  switch (variant) {
    case 'teacher':
      colorStyles = "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30";
      break;
    case 'student':
      colorStyles = "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30";
      break;
    case 'admin':
      colorStyles = "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30";
      break;
    case 'secondary':
      colorStyles = "bg-gray-200 hover:bg-gray-300 text-gray-800";
      break;
    default:
      colorStyles = "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30";
  }

  return (
    <button 
      className={`${baseStyles} ${colorStyles} ${className} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};

export default Button;