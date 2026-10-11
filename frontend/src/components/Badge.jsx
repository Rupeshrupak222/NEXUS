import React from 'react';

export function Badge({ variant = 'neutral', pulse = false, children, className = '' }) {
  const variantClass = `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {pulse && <span className="pulse-dot" />}
      {children}
    </span>
  );
}
