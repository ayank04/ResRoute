import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  History, 
  Settings, 
  Shield, 
  Truck, 
  FileText, 
  Activity
} from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Live Dashboard' },
  { to: '/routes', icon: Activity, label: 'Active Routes' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/vehicles', icon: Truck, label: 'Fleet' },
  { to: '/decisions', icon: FileText, label: 'AI Decisions' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            background: 'var(--primary)', 
            padding: 8, 
            borderRadius: 10, 
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-gradient">ResRoute</h1>
            <p>Resilient Logistics</p>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div className="status-dot" style={{ background: 'var(--success)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>System Online</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
          v1.0.0 · BENGALURU OPS
        </div>
      </div>
    </aside>
  );
}
