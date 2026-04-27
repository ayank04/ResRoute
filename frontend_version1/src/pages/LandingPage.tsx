import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Globe, 
  ArrowRight, 
  Truck, 
  CloudLightning,
  Map as MapIcon,
  Cpu
} from 'lucide-react';

const USP_CARDS = [
  {
    title: 'Dynamic Risk-First Routing',
    description: 'Routes are no longer just about the shortest path. We prioritize risk mitigation over pure ETA using real-time telemetry.',
    icon: <ShieldCheck size={24} className="text-blue-400" />,
    color: '#3b82f6'
  },
  {
    title: 'AI Self-Healing Engine',
    description: 'Automatically detects disruptions and recomputes optimal bypasses without human intervention using Gemini Flash.',
    icon: <Cpu size={24} className="text-purple-400" />,
    color: '#8b5cf6'
  },
  {
    title: 'Predictive Heatmaps',
    description: 'Visualize tomorrow\'s risks today. Our spatial engine forecasts disruptions before they impact your fleet.',
    icon: <CloudLightning size={24} className="text-amber-400" />,
    color: '#f59e0b'
  },
  {
    title: 'Global Fleet Optimization',
    description: 'One-click global optimization to re-balance your entire logistics network based on emerging regional threats.',
    icon: <Globe size={24} className="text-emerald-400" />,
    color: '#10b981'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page" style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      color: '#f8fafc',
      fontFamily: "'Outfit', sans-serif",
      overflowX: 'hidden'
    }}>
      {/* Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .hero-gradient {
          position: absolute;
          top: -20%;
          left: -10%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }

        .hero-gradient-2 {
          position: absolute;
          bottom: -10%;
          right: -10%;
          width: 50%;
          height: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .glow-text {
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .usp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          padding: 40px 0;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #fff;
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: 80, 
        zIndex: 100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, height: 40, 
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
          }}>
            <ShieldCheck color="#fff" size={24} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>ResRoute</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#vision" className="nav-link">Vision</a>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '10px 20px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go to Console
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: '180px 40px 100px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center',
        zIndex: 1
      }}>
        <div className="hero-gradient" />
        <div className="hero-gradient-2" />
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          padding: '8px 16px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 100,
          color: '#60a5fa',
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 32,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <Zap size={14} /> Production-Ready Logistics Intelligence
        </div>

        <h1 style={{ 
          fontSize: 'clamp(40px, 8vw, 72px)', 
          fontWeight: 800, 
          lineHeight: 1.1, 
          letterSpacing: '-0.03em',
          marginBottom: 24,
          background: 'linear-gradient(to bottom, #fff 40%, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Resilient Routing for the <br />
          <span style={{ color: '#3b82f6', WebkitTextFillColor: 'initial' }} className="glow-text">Unpredictable</span> World.
        </h1>

        <p style={{ 
          fontSize: 18, 
          color: '#94a3b8', 
          maxWidth: 600, 
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          Last-mile delivery failure costs billions. ResRoute eliminates the chaos by 
          continuously re-evaluating risk every 60 seconds with AI-driven self-healing.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn" 
            style={{ 
              background: '#3b82f6', 
              color: '#fff',
              padding: '16px 32px',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
            }}
          >
            Launch Command Center <ArrowRight size={18} />
          </button>
        </div>

        {/* Floating elements for visual flair */}
        <div className="animate-float" style={{ position: 'absolute', top: 100, left: -40, opacity: 0.4 }}>
          <Truck size={48} color="#3b82f6" />
        </div>
        <div className="animate-float" style={{ position: 'absolute', bottom: 100, right: -40, opacity: 0.3, animationDelay: '2s' }}>
          <MapIcon size={64} color="#8b5cf6" />
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 100px' }}>
        <div className="glass-card" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          padding: '40px',
          textAlign: 'center',
          gap: 40
        }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>28%</div>
            <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost Reduction</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>60s</div>
            <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sync Frequency</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>47%</div>
            <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Mitigation</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>The Future of Logistics</h2>
          <p style={{ color: '#94a3b8', fontSize: 16 }}>Powerful tools designed for real-time disruption management.</p>
        </div>

        <div className="usp-grid">
          {USP_CARDS.map((card, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ 
                width: 56, height: 56, 
                background: `${card.color}15`, 
                border: `1px solid ${card.color}30`,
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {card.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '100px 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'center'
      }}>
        <div className="glass-card" style={{ height: 400, position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'url(https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2800&auto=format&fit=crop)',
            backgroundSize: 'cover',
            opacity: 0.2
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #020617)' }} />
          <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40 }}>
            <div style={{ color: '#3b82f6', fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: 'uppercase' }}>THE CORE ENGINE</div>
            <h3 style={{ fontSize: 24, fontWeight: 700 }}>Spatial Intelligence at Scale</h3>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 12 }}>Our backend architecture handles thousands of concurrent data points across traffic, weather, and incidents.</p>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 24 }}>Beyond Pathfinding</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[
              { t: 'Unified Risk Dashboard', d: 'Eliminate reacting to driver reports manually. See every threat on a single, consolidated operational map.' },
              { t: 'Gemini Disruption Parsing', d: 'Transform unstructured free-text news and alerts into actionable spatial data within milliseconds.' },
              { t: 'Production-Grade Resilience', d: 'Built with circuit breakers and high-availability polling to ensure your fleet never goes blind.' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 20 }}>
                <div style={{ color: '#3b82f6', marginTop: 4 }}><Zap size={20} /></div>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.t}</h4>
                  <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.5 }}>{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '100px 40px 60px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>ResRoute</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 40 }}>
          The resilient route for the unpredictable world.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 40 }}>
          <a href="#" className="nav-link">Documentation</a>
          <a href="#" className="nav-link">API Reference</a>
          <a href="#" className="nav-link">System Status</a>
        </div>
        <div style={{ color: '#334155', fontSize: 12 }}>
          &copy; 2026 ResilientRoute Logistics. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
