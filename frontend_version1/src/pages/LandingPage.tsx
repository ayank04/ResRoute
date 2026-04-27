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
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Intersection Observer for scroll reveals and scroll-to-top visibility
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="landing-page" style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      color: '#f8fafc',
      fontFamily: "'Outfit', sans-serif",
      overflowX: 'hidden',
      scrollBehavior: 'smooth'
    }}>
      {/* Google Fonts & Global Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
        
        html { scroll-behavior: smooth; }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }

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
          cursor: pointer;
        }

        .nav-link:hover {
          color: #fff;
        }

        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 100px;
          color: #60a5fa;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .scroll-top-btn {
          position: fixed;
          bottom: 32px;
          right: 32px;
          width: 48px;
          height: 48px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
          z-index: 1000;
          transition: all 0.3s;
          opacity: 0;
          pointer-events: none;
          transform: translateY(20px);
        }

        .scroll-top-btn.visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .scroll-top-btn:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        .btn-launch {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #fff;
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
        }

        .btn-launch:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border-color: rgba(59, 130, 246, 0.6);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
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
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
          <a onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-link">Home</a>
          <a onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="nav-link">Features</a>
          <a onClick={() => document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' })} className="nav-link">Vision</a>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-launch"
          >
            Launch Command Center
          </button>
        </div>
      </nav>

      {/* Back to Top Button */}
      <button 
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <Zap size={20} style={{ transform: 'rotate(-90deg)' }} />
      </button>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: '200px 40px 100px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center',
        zIndex: 1
      }}>
        <div className="hero-gradient" />
        <div className="hero-gradient-2" />
        
        <div className="reveal section-tag">
          <Zap size={14} /> Production-Ready Logistics Intelligence
        </div>

        <h1 className="reveal" style={{ 
          fontSize: 'clamp(40px, 8vw, 72px)', 
          fontWeight: 800, 
          lineHeight: 1.1, 
          letterSpacing: '-0.03em',
          marginBottom: 24,
          background: 'linear-gradient(to bottom, #fff 40%, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          transitionDelay: '0.1s'
        }}>
          Resilient Routing for the <br />
          <span style={{ color: '#3b82f6', WebkitTextFillColor: 'initial' }} className="glow-text">Unpredictable</span> World.
        </h1>

        <p className="reveal" style={{ 
          fontSize: 18, 
          color: '#94a3b8', 
          maxWidth: 600, 
          margin: '0 auto 40px',
          lineHeight: 1.6,
          transitionDelay: '0.2s'
        }}>
          Last-mile delivery failure costs billions. ResRoute eliminates the chaos by 
          continuously re-evaluating risk every 60 seconds with AI-driven self-healing.
        </p>

        <div className="reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, transitionDelay: '0.3s' }}>
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
            Start Dispatching <ArrowRight size={18} />
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
      <section className="reveal" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 100px', transitionDelay: '0.4s' }}>
        <div className="glass-card" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          padding: '40px',
          textAlign: 'center',
          gap: 40
        }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>28%</div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cost Reduction</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>60s</div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sync Frequency</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>47%</div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risk Mitigation</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 40px' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="section-tag">Powerful Features</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>The Future of Logistics</h2>
          <p style={{ color: '#94a3b8', fontSize: 16 }}>Intelligent tools designed for real-time disruption management.</p>
        </div>

        <div className="usp-grid">
          {USP_CARDS.map((card, idx) => (
            <div key={idx} className="reveal glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20, transitionDelay: `${0.1 * idx}s` }}>
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
        padding: '150px 40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 80,
        alignItems: 'center'
      }}>
        <div className="reveal glass-card" style={{ height: 460, position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'url(https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2800&auto=format&fit=crop)',
            backgroundSize: 'cover',
            opacity: 0.15
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #020617)' }} />
          <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40 }}>
            <div style={{ color: '#3b82f6', fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>THE CORE ENGINE</div>
            <h3 style={{ fontSize: 28, fontWeight: 700 }}>Spatial Intelligence at Scale</h3>
            <p style={{ fontSize: 15, color: '#94a3b8', marginTop: 12, lineHeight: 1.6 }}>Our backend architecture handles thousands of concurrent data points across traffic, weather, and incidents to keep your fleet safe.</p>
          </div>
        </div>

        <div className="reveal" style={{ transitionDelay: '0.2s' }}>
          <div className="section-tag">The Vision</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 32 }}>Beyond Pathfinding</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {[
              { t: 'Unified Risk Dashboard', d: 'Stop reacting to driver calls. See every threat on a single operational map before the driver even knows it exists.' },
              { t: 'Gemini Disruption Parsing', d: 'Turn unstructured free-text news into actionable spatial data. Our AI understands "accident on 4th" and maps it in ms.' },
              { t: 'Production Resilience', d: 'Built with circuit breakers and fallback caching to ensure your dispatchers never lose visibility, even during API outages.' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 24 }}>
                <div style={{ 
                  width: 48, height: 48, 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: 12, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#3b82f6', flexShrink: 0
                }}><Zap size={20} /></div>
                <div>
                  <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{item.t}</h4>
                  <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="reveal" style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 40px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '80px 40px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24 }}>Ready to Secure Your Fleet?</h2>
          <p style={{ color: '#94a3b8', maxWidth: 500, margin: '0 auto 40px' }}>Join the next generation of resilient logistics. One-click deployment for any city in the world.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn" 
            style={{ 
              background: '#fff', 
              color: '#020617',
              padding: '16px 40px',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            Open Dispatch Console <ArrowRight size={18} />
          </button>
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
          <a onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-link">Back to Top</a>
          <a href="#" className="nav-link">Documentation</a>
          <a href="#" className="nav-link">System Status</a>
        </div>
        <div style={{ color: '#334155', fontSize: 12 }}>
          &copy; 2026 ResilientRoute Logistics. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

