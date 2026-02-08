import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
      {title && <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;