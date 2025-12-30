import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border border-gray-300',
    primary: 'bg-[#F7F5FF] text-[#472EAD] border border-[#E4E0FF] font-semibold',
    success: 'bg-green-100 text-green-800 border border-green-300 font-semibold',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold',
    danger: 'bg-red-100 text-red-800 border border-red-300 font-semibold',
    info: 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold',
    accent: 'bg-[#FFF7ED] text-[#F58020] border border-[#FED7AA] font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

