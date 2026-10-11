import React from 'react';
import { FolderOpen } from 'lucide-react';

export function EmptyState({ icon: Icon = FolderOpen, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}
