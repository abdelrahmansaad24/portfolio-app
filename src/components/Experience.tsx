import React from 'react';
import { Briefcase, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

export const Experience: React.FC = () => {
  const { data } = usePortfolio();

  return (
    <section id="experience" className="section" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
            Proven Track Record
          </div>
          <h2 className="section-title">
            Professional <span className="gradient-text">Experience</span>
          </h2>
          <p className="section-subtitle">
            Specialized engineering experience spanning fast-paced AI/Cloud startups and healthcare backend ecosystems.
          </p>
        </div>

        {/* Timeline Container */}
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            position: 'relative',
          }}
        >
          {data.experiences.map((exp, idx) => (
            <div
              key={exp.id || idx}
              className="glass-card"
              style={{
                borderLeft: exp.current ? '4px solid var(--primary)' : '4px solid var(--secondary)',
                padding: '2rem',
              }}
            >
              {/* Header Info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.4rem', color: '#ffffff' }}>{exp.role}</h3>
                    {exp.current && <span className="badge badge-cyan">Current Role</span>}
                  </div>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      marginTop: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Briefcase size={16} />
                    <span>{exp.company}</span>
                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>
                      {exp.type}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.25rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                  className="exp-meta"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>{exp.period}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} />
                    <span>{exp.location}</span>
                  </div>
                </div>
              </div>

              {/* Bullet Points */}
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  marginBottom: '1.5rem',
                }}
              >
                {exp.description.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      color: '#cbd5e1',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                    }}
                  >
                    <CheckCircle size={16} color="#06b6d4" style={{ marginTop: '0.25rem', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Technologies Tag Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {exp.technologies.map((tech) => (
                  <span key={tech} className="tech-pill">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .exp-meta {
            align-items: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
};
