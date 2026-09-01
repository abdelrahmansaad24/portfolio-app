import React from 'react';
import { Code, Server, Database, Terminal } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

export const Skills: React.FC = () => {
  const { data } = usePortfolio();

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('front')) return <Code color="#38bdf8" size={22} />;
    if (category.toLowerCase().includes('back')) return <Server color="#a78bfa" size={22} />;
    if (category.toLowerCase().includes('data')) return <Database color="#34d399" size={22} />;
    return <Terminal color="#fbbf24" size={22} />;
  };

  return (
    <section id="skills" className="section" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
            Technical Arsenal
          </div>
          <h2 className="section-title">
            Skills & <span className="gradient-text">Competencies</span>
          </h2>
          <p className="section-subtitle">
            A comprehensive spectrum of full-stack development, modern frameworks, scalable databases, and cloud infrastructure.
          </p>
        </div>

        {/* Skills Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}
        >
          {data.skillCategories.map((cat, idx) => (
            <div
              key={cat.category || idx}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Category Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-glass)',
                }}
              >
                <div
                  style={{
                    padding: '0.5rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getCategoryIcon(cat.category)}
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>{cat.category}</h3>
              </div>

              {/* Skills List with Proficiency Meters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {cat.skills.map((skill) => (
                  <div key={skill.name}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.35rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{skill.name}</span>
                      <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {skill.level}%
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${skill.level}%`,
                          height: '100%',
                          borderRadius: '3px',
                          background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                          transition: 'width 1s ease-in-out',
                          boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
