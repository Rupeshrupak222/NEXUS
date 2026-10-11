import React from 'react';

export function StatCard({ title, value, icon: Icon, changeText, color = 'primary' }) {
  const iconBg = color === 'mint' ? 'var(--mint-light)' : 'var(--primary-light)';
  const iconColor = color === 'mint' ? 'var(--mint)' : 'var(--primary)';

  return (
    <div className="card" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        {value}
      </div>
      {changeText && (
        <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          {changeText}
        </div>
      )}
    </div>
  );
}
