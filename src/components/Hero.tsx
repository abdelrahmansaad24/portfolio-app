import React from 'react';
import { FileDown, ArrowRight, Layers, Cpu, Database, Server, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePortfolio } from '../context/PortfolioContext';

export const Hero: React.FC = () => {
  const { data } = usePortfolio();

  const handleDownloadCV = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#8b5cf6', '#3b82f6', '#10b981'],
    });
  };

  return (
    <section
      id="about"
      style={{
        paddingTop: '9rem',
        paddingBottom: '5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '3.5rem',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left Column: Hero Text */}
          <div>
            {/* Status Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                }}
              />
              <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                Available for Full-Stack & Engineering Roles
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                lineHeight: 1.1,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              Hi, I'm{' '}
              <span className="gradient-text">{data.profile.name}</span>
            </h1>

            <h2
              style={{
                fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)',
                color: '#cbd5e1',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              {data.profile.title}{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 400 }}>| 2+ Years Exp</span>
            </h2>

            <p
              style={{
                fontSize: '1.05rem',
                color: 'var(--text-muted)',
                marginBottom: '2rem',
                lineHeight: 1.7,
                maxWidth: '620px',
              }}
            >
              {data.profile.bio}
            </p>

            {/* Quick Experience Badges */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '2.5rem',
              }}
            >
              <div className="badge badge-cyan">
                <Layers size={14} />
                <span>1.5 Yrs @ Obelion.ai (React & Node.js/CloudGate)</span>
              </div>
              <div className="badge badge-purple">
                <Server size={14} />
                <span>1 Yr @ Diagnosit (Laravel PHP Backend)</span>
              </div>
              <div className="badge badge-green">
                <CheckCircle2 size={14} />
                <span>Alexandria University (Eng)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <a
                href={data.profile.resumeUrl || '/cv/CV.pdf'}
                download="Abdelrahman_Saad_CV.pdf"
                onClick={handleDownloadCV}
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <FileDown size={18} />
                <span>Download CV</span>
              </a>

              <a href="#projects" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <span>View Projects</span>
                <ArrowRight size={16} />
              </a>

              <a href="#contact" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <span>Contact Me</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Profile Card / Visual Glow */}
          <div style={{ position: 'relative' }}>
            <div
              className="glass-card"
              style={{
                padding: '2.5rem 2rem',
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 50px rgba(6, 182, 212, 0.15)',
              }}
            >
              {/* Card Header with Glowing Orb */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid var(--border-glass)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)',
                  }}
                >
                  AS
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{data.profile.name}</h3>
                  <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                    {data.profile.location}
                  </p>
                </div>
              </div>

              {/* Dynamic Highlights List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <Cpu color="#38bdf8" size={22} />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Frontend Mastery</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>React • Next.js • Angular • Flutter</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <Server color="#a78bfa" size={22} />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Backend Architecture</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Node.js • Express • Laravel PHP • Microservices</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <Database color="#34d399" size={22} />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Databases & Cloud</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>PostgreSQL • MySQL • Mongo • Redis • Docker</div>
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: '0.5rem', background: 'rgba(6, 182, 212, 0.06)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>2+</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Years Exp</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.06)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa' }}>12+</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projects</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>100%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reliable</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
