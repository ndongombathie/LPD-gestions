import React from 'react';

export const Card = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';

  return (
    <div
      className={`bg-white text-gray-900 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${paddingClasses[padding]} ${hoverClass} ${className}`}
      style={{ position: 'relative', visibility: 'visible', opacity: 1 }}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export default Card;
