import React from 'react';

export function LoadingSkeleton({ count = 3, height = '48px', style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: '100%', height }} />
      ))}
    </div>
  );
}
