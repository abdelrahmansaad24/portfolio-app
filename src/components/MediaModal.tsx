import React from 'react';
import { X, Play } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mediaUrl: string;
  isVideo?: boolean;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  title,
  mediaUrl,
  isVideo = false,
}) => {
  if (!isOpen) return null;

  const embedUrl = isVideo ? StorageService.getYouTubeEmbedUrl(mediaUrl) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '850px', background: '#0a0f1d' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isVideo && <Play size={18} color="var(--primary)" />}
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {isVideo && embedUrl ? (
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '12px',
              }}
            >
              <iframe
                src={embedUrl}
                title={title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                maxHeight: '70vh',
                overflow: 'hidden',
                borderRadius: '12px',
              }}
            >
              <img
                src={mediaUrl}
                alt={title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
