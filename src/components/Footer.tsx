import React from 'react';
import { Code2, ArrowUp } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

export const Footer: React.FC = () => {
  const { data } = usePortfolio();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-glass)',
        background: '#06080d',
        padding: '3.5rem 0 2rem 0',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.2rem',
                marginBottom: '0.4rem',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Code2 size={18} color="#ffffff" />
              </div>
              <span>{data.profile.name}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Full-Stack Software Engineer • Alexandria, Egypt
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a
              href="#about"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              About
            </a>
            <a
              href="#experience"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Experience
            </a>
            <a
              href="#projects"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Projects
            </a>
            <a
              href="#skills"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Skills
            </a>
            <a
              href="#contact"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Contact
            </a>

            <button
              onClick={scrollToTop}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              title="Scroll to Top"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>

        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
          }}
        >
          <div>© {new Date().getFullYear()} {data.profile.name}. All rights reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Crafted with precision & passion
          </div>
        </div>
      </div>
    </footer>
  );
};
