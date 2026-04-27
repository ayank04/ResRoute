import { useUIStore } from '../../stores/uiStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const colors = { success: 'toast-success', error: 'toast-error', warning: 'toast-warning', info: 'toast-info' };

export default function Toast() {
  const { toast, hideToast } = useUIStore();
  if (!toast.visible) return null;
  const Icon = icons[toast.type];
  return (
    <div className={`toast ${colors[toast.type]}`}>
      <Icon size={18} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={hideToast} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}>
        <X size={16} />
      </button>
    </div>
  );
}
