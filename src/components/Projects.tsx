import React, { useState, useMemo } from 'react';
import { ExternalLink, Play, Search, Eye, Filter } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { Project } from '../types/portfolio';
import { MediaModal } from './MediaModal';

export const Projects: React.FC = () => {
  const { data } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Media Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    mediaUrl: string;
    isVideo?: boolean;
  }>({
    isOpen: false,
    title: '',
    mediaUrl: '',
    isVideo: false,
  });

  const categories: string[] = ['All', 'Full-Stack', 'React', 'Angular', 'Mobile', 'Backend / Cloud'];

  const filteredProjects = useMemo(() => {
    return data.projects.filter((p) => {
      const matchCategory =
        selectedCategory === 'All' ||
        p.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Mobile' && (p.category === 'Mobile' || p.tags.includes('Flutter')));

      const matchQuery =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchQuery;
    });
  }, [data.projects, selectedCategory, searchQuery]);

  const handleOpenMedia = (p: Project, isVideo: boolean) => {
    setModalState({
      isOpen: true,
      title: p.title,
      mediaUrl: isVideo ? p.videoUrl || p.liveUrl || '' : p.imgUrl,
      isVideo,
    });
  };

  return (
    <section id="projects" className="section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>
            Featured Engineering Work
          </div>
          <h2 className="section-title">
            Featured <span className="gradient-text">Projects</span>
          </h2>
          <p className="section-subtitle">
            Enterprise platforms, microservices architecture, interactive web apps, and mobile solutions.
          </p>
        </div>

        {/* Filter Controls & Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background:
                    selectedCategory === cat
                      ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      : 'transparent',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search
              size={18}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by tech or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{
                paddingLeft: '2.4rem',
                fontSize: '0.85rem',
                paddingTop: '0.55rem',
                paddingBottom: '0.55rem',
              }}
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div
            className="glass-card"
            style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}
          >
            <Filter size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3>No projects found</h3>
            <p>Try modifying your search or selecting a different category filter.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '2rem',
            }}
          >
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Image / Thumbnail Container */}
                <div
                  style={{
                    position: 'relative',
                    height: '210px',
                    width: '100%',
                    background: '#090d16',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={p.imgUrl}
                    alt={p.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  {/* Top Badges */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'flex',
                      gap: '0.5rem',
                      zIndex: 2,
                    }}
                  >
                    <span className="badge badge-cyan">{p.category}</span>
                    {p.year && <span className="badge badge-purple">{p.year}</span>}
                  </div>

                  {/* Quick Action Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      display: 'flex',
                      gap: '0.5rem',
                      zIndex: 2,
                    }}
                  >
                    {(p.isVideo || p.videoUrl) && (
                      <button
                        onClick={() => handleOpenMedia(p, true)}
                        className="btn btn-primary btn-sm"
                        style={{
                          padding: '0.4rem 0.75rem',
                          background: 'rgba(239, 68, 68, 0.9)',
                          border: 'none',
                        }}
                        title="Watch Video Demo"
                      >
                        <Play size={14} fill="#ffffff" />
                        <span>Demo</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenMedia(p, false)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(0, 0, 0, 0.75)',
                      }}
                      title="View Full Image"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      marginBottom: '0.5rem',
                      lineHeight: 1.3,
                      color: '#ffffff',
                    }}
                  >
                    {p.title}
                  </h3>

                  {p.role && (
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                      }}
                    >
                      Role: {p.role}
                    </div>
                  )}

                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      marginBottom: '1.25rem',
                      flexGrow: 1,
                    }}
                  >
                    {p.description}
                  </p>

                  {/* Tags */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {p.tags.map((t) => (
                      <span key={t} className="tech-pill">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Card Action Links */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--border-glass)',
                      paddingTop: '1rem',
                    }}
                  >
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ flexGrow: 1, textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} />
                        <span>Live / View</span>
                      </a>
                    )}

                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none', padding: '0.4rem 0.6rem' }}
                        title="GitHub Repository"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Modal */}
      <MediaModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        mediaUrl={modalState.mediaUrl}
        isVideo={modalState.isVideo}
      />
    </section>
  );
};
