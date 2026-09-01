import React, { useState, useEffect } from 'react';
import { FileDown, Menu, X, Code2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

export const Navbar: React.FC = () => {
  const { data } = usePortfolio();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Experience', href: '#experience' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(7, 9, 14, 0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px',
        }}
      >
        {/* Brand Logo */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: 'var(--font-heading)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Code2 size={22} color="#ffffff" />
          </div>
          <span>
            {data.profile.name.split(' ')[0]}
            <span style={{ color: 'var(--primary)' }}>.{data.profile.name.split(' ')[1] || 'dev'}</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {link.name}
            </a>
          ))}

          <a
            href={data.profile.resumeUrl || '/cv/CV.pdf'}
            download="Abdelrahman_Saad_CV.pdf"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <FileDown size={15} />
            <span>CV / Resume</span>
          </a>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
          className="mobile-toggle"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            background: '#090d16',
            borderBottom: '1px solid var(--border-glass)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: '#f8fafc',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {link.name}
            </a>
          ))}
          <a
            href={data.profile.resumeUrl || '/cv/CV.pdf'}
            download="Abdelrahman_Saad_CV.pdf"
            className="btn btn-primary"
            style={{ marginTop: '0.5rem' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileDown size={18} />
            <span>Download CV</span>
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};
