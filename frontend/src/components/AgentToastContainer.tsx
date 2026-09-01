import React from 'react';
import { AgentToast, ToastPosition } from '../types';
import { Check, Activity, Info, AlertTriangle } from 'lucide-react';

interface AgentToastContainerProps {
  toasts: AgentToast[];
  position?: ToastPosition;
  onDismiss: (id: string) => void;
}

export const AgentToastContainer: React.FC<AgentToastContainerProps> = ({ 
  toasts, 
  position = 'bottom-right', 
  onDismiss 
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className={`toast-container position-${position}`}>
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item" onClick={() => onDismiss(toast.id)}>
          {toast.status === 'active' && <Activity size={13} className="pulse-status" />}
          {toast.status === 'success' && <Check size={13} />}
          {toast.status === 'info' && <Info size={13} />}
          {toast.status === 'failed' && <AlertTriangle size={13} />}
          
          <div>
            <span style={{ fontWeight: 600, marginRight: '6px' }}>[{toast.agentName}]</span>
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

