import React, { useState } from 'react';
import {
  FolderGit2,
  Briefcase,
  Wrench,
  UserCheck,
  Database,
  Plus,
  Trash2,
  Edit,
  Save,
  LogOut,
  ExternalLink,
  Upload,
  Video,
  Image as ImageIcon,
  CheckCircle,
  Download,
  RotateCcw,
  Layers,
  RefreshCw,
  FileText,
  Cloud,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { Project, Experience, ProfileInfo, ProjectCategory } from '../types/portfolio';
import { StorageService, DEFAULT_STORAGE_BUCKET_URL } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const {
    data,
    isSyncing,
    updateProfile,
    addProject,
    updateProject,
    deleteProject,
    addExperience,
    updateExperience,
    deleteExperience,
    updateSkillCategories,
    resetToDefaults,
    importPortfolioData,
    syncWithStorageBucket,
  } = usePortfolio();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'projects' | 'experience' | 'skills' | 'profile' | 'backup'>('projects');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<Omit<Project, 'id'>>({
    title: '',
    category: 'Full-Stack',
    description: '',
    longDescription: '',
    imgUrl: '',
    videoUrl: '',
    isVideo: false,
    liveUrl: '',
    githubUrl: '',
    tags: [],
    featured: true,
    year: '2025',
    role: 'Full-Stack Engineer',
  });
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Experience Modal State
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<Omit<Experience, 'id'>>({
    company: '',
    role: '',
    type: 'Full-time',
    period: '',
    location: 'Remote, Egypt',
    description: [''],
    technologies: [],
    current: false,
  });
  const [expTechInput, setExpTechInput] = useState('');

  // Profile Form State
  const [profileForm, setProfileForm] = useState<ProfileInfo>({ ...data.profile });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Project Handlers ---
  const handleOpenNewProject = () => {
    setEditingProjectId(null);
    setProjectForm({
      title: '',
      category: 'Full-Stack',
      description: '',
      longDescription: '',
      imgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      videoUrl: '',
      isVideo: false,
      liveUrl: '',
      githubUrl: '',
      tags: ['React', 'Node.js', 'TypeScript'],
      featured: true,
      year: new Date().getFullYear().toString(),
      role: 'Full-Stack Engineer',
    });
    setTagInput('React, Node.js, TypeScript');
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (p: Project) => {
    setEditingProjectId(p.id);
    setProjectForm({
      title: p.title,
      category: p.category,
      description: p.description,
      longDescription: p.longDescription || '',
      imgUrl: p.imgUrl,
      videoUrl: p.videoUrl || '',
      isVideo: !!p.isVideo,
      liveUrl: p.liveUrl || '',
      githubUrl: p.githubUrl || '',
      tags: p.tags,
      featured: !!p.featured,
      year: p.year || '2025',
      role: p.role || 'Full-Stack Engineer',
    });
    setTagInput(p.tags.join(', '));
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const projectDataToSave = {
      ...projectForm,
      tags: parsedTags.length > 0 ? parsedTags : ['Full-Stack'],
      isVideo: !!projectForm.videoUrl && projectForm.videoUrl.trim() !== '',
    };

    if (editingProjectId) {
      updateProject({
        ...projectDataToSave,
        id: editingProjectId,
      });
      showToast('Project updated successfully!');
    } else {
      addProject(projectDataToSave);
      showToast('New project created successfully!');
    }
    setIsProjectModalOpen(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await StorageService.uploadImageFile(
        file,
        data.profile.boxStorageApiKey,
        data.profile.boxFolderId
      );
      setProjectForm((prev) => ({ ...prev, imgUrl: url }));
      showToast('Image uploaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Experience Handlers ---
  const handleOpenNewExp = () => {
    setEditingExpId(null);
    setExpForm({
      company: '',
      role: '',
      type: 'Full-time',
      period: '',
      location: 'Remote, Egypt',
      description: [''],
      technologies: ['React', 'Node.js'],
      current: false,
    });
    setExpTechInput('React, Node.js');
    setIsExpModalOpen(true);
  };

  const handleEditExp = (exp: Experience) => {
    setEditingExpId(exp.id);
    setExpForm({
      company: exp.company,
      role: exp.role,
      type: exp.type,
      period: exp.period,
      location: exp.location,
      description: exp.description,
      technologies: exp.technologies,
      current: !!exp.current,
    });
    setExpTechInput(exp.technologies.join(', '));
    setIsExpModalOpen(true);
  };

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTechs = expTechInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const expToSave = {
      ...expForm,
      technologies: parsedTechs,
      description: expForm.description.filter((d) => d.trim() !== ''),
    };

    if (editingExpId) {
      updateExperience({ ...expToSave, id: editingExpId });
      showToast('Experience updated successfully!');
    } else {
      addExperience(expToSave);
      showToast('Experience added successfully!');
    }
    setIsExpModalOpen(false);
  };

  // --- Profile Handlers ---
  const handleCvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await StorageService.uploadDocumentFile(
        file,
        data.profile.boxStorageApiKey,
        data.profile.boxFolderId
      );
      setProfileForm((prev) => ({ ...prev, resumeUrl: url }));
      showToast('CV / Resume uploaded successfully!');
    } catch (err) {
      console.error('CV upload error:', err);
      showToast('Error uploading CV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyncStorageBucket = async () => {
    const targetUrl = profileForm.storageBucketDataUrl || DEFAULT_STORAGE_BUCKET_URL;
    const success = await syncWithStorageBucket(targetUrl);
    if (success) {
      setProfileForm({ ...data.profile });
      showToast('Synced latest data from Storage Bucket!');
    } else {
      showToast('Could not fetch data from storage bucket URL.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    showToast('Profile & storage configuration saved!');
  };

  // --- Backup Handlers ---
  const handleExportJson = () => {
    StorageService.exportToJson(data);
    showToast('Portfolio JSON backup downloaded!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        importPortfolioData(parsed);
        setProfileForm(parsed.profile);
        showToast('Portfolio data restored from backup!');
      } catch (err) {
        console.error('Import parse error:', err);
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all portfolio data to default?')) {
      resetToDefaults();
      showToast('Data reset to original initial state!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07090e', color: '#f8fafc' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#ffffff',
            padding: '0.85rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(6, 182, 212, 0.4)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '1rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
            }}
          >
            <Layers size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Admin <span className="gradient-text">Control Center</span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Dynamic Portfolio Management Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <ExternalLink size={14} />
            <span>View Live Site</span>
          </button>

          <button
            onClick={onLogout}
            className="btn btn-danger btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Layout */}
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '2.5rem',
            borderBottom: '1px solid var(--border-glass)',
            paddingBottom: '1rem',
          }}
        >
          <button
            onClick={() => setActiveTab('projects')}
            className={`btn btn-sm ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.5rem' }}
          >
            <FolderGit2 size={16} />
            <span>Projects ({data.projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`btn btn-sm ${activeTab === 'experience' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.5rem' }}
          >
            <Briefcase size={16} />
            <span>Experience ({data.experiences.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`btn btn-sm ${activeTab === 'skills' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.5rem' }}
          >
            <Wrench size={16} />
            <span>Skills Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.5rem' }}
          >
            <UserCheck size={16} />
            <span>Profile & Box API</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`btn btn-sm ${activeTab === 'backup' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.5rem' }}
          >
            <Database size={16} />
            <span>Backup & Reset</span>
          </button>
        </div>

        {/* TAB 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.5rem' }}>Dynamic Projects Showcase</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Manage portfolio projects, upload images directly or via Box API, and embed YouTube videos.
                </p>
              </div>
              <button onClick={handleOpenNewProject} className="btn btn-primary">
                <Plus size={16} />
                <span>Add Project</span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {data.projects.map((p) => (
                <div key={p.id} className="glass-card" style={{ padding: '1.25rem' }}>
                  <div
                    style={{
                      height: '140px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '1rem',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={p.imgUrl}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        display: 'flex',
                        gap: '0.4rem',
                      }}
                    >
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {p.category}
                      </span>
                      {p.isVideo && (
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          Video
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{p.title}</h4>
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.description}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleEditProject(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ flexGrow: 1 }}
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${p.title}"?`)) {
                          deleteProject(p.id);
                          showToast('Project removed');
                        }
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EXPERIENCE */}
        {activeTab === 'experience' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.5rem' }}>Experience & Career Timeline</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Highlight roles, key achievements at Obelion.ai and Diagnosit, and technologies.
                </p>
              </div>
              <button onClick={handleOpenNewExp} className="btn btn-primary">
                <Plus size={16} />
                <span>Add Experience</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {data.experiences.map((exp) => (
                <div key={exp.id} className="glass-card" style={{ padding: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: '#ffffff' }}>{exp.role}</h4>
                      <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                        {exp.company} • {exp.type} ({exp.period})
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditExp(exp)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete experience at "${exp.company}"?`)) {
                            deleteExperience(exp.id);
                            showToast('Experience deleted');
                          }
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {exp.description.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SKILLS MATRIX */}
        {activeTab === 'skills' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem' }}>Technical Skills Matrix</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Adjust proficiency ratings and skill groupings dynamically.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {data.skillCategories.map((cat, catIdx) => (
                <div key={catIdx} className="glass-card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                    {cat.category}
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {cat.skills.map((s, sIdx) => (
                      <div key={sIdx}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span>{s.name}</span>
                          <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                            {s.level}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={s.level}
                          onChange={(e) => {
                            const newCategories = [...data.skillCategories];
                            newCategories[catIdx].skills[sIdx].level = parseInt(e.target.value);
                            updateSkillCategories(newCategories);
                          }}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & BOX API */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem' }}>Profile & Box Storage Settings</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Customize your bio, job title, social profiles, and configure Box Storage APIs for direct image uploads.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Professional Title</label>
                  <input
                    type="text"
                    required
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bio / Summary</label>
                <textarea
                  rows={3}
                  required
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input
                    type="text"
                    value={profileForm.linkedin}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input
                    type="text"
                    value={profileForm.github}
                    onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              {/* CV / Resume & Document Management */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FileText size={18} color="#38bdf8" />
                  <h4 style={{ fontSize: '1rem' }}>CV / Resume Configuration</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  The CV is stored in the dedicated <code>/cv/CV.pdf</code> folder or can be pointed directly to any storage bucket URL.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }} className="form-row">
                  <div className="form-group">
                    <label className="form-label">CV / Resume URL or Path</label>
                    <input
                      type="text"
                      placeholder="/cv/CV.pdf"
                      value={profileForm.resumeUrl || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, resumeUrl: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Upload New CV File (.pdf)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvFileUpload}
                      className="form-control"
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Storage Bucket & Remote Data URL */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Cloud size={18} color="#818cf8" />
                  <h4 style={{ fontSize: '1rem' }}>Storage Bucket Data URL</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Link to your Firebase Storage Bucket, S3, or CDN JSON dataset. The app automatically fetches and caches this data on startup.
                </p>

                <div className="form-group">
                  <label className="form-label">Remote Storage Bucket JSON URL</label>
                  <input
                    type="text"
                    placeholder={DEFAULT_STORAGE_BUCKET_URL}
                    value={profileForm.storageBucketDataUrl || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, storageBucketDataUrl: e.target.value })}
                    className="form-control"
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    Default Bucket: <code>{DEFAULT_STORAGE_BUCKET_URL}</code> | Fallback: <code>/data/portfolioData.json</code>
                  </small>
                </div>
              </div>

              {/* Box Storage Configuration */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Upload size={18} color="var(--primary)" />
                  <h4 style={{ fontSize: '1rem' }}>Box Storage API Settings (Optional)</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  If you have a Box Developer Access Token, paste it below to push project image uploads directly to your Box account. (If left blank, images are instantly encoded and stored locally).
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }} className="form-row">
                  <div className="form-group">
                    <label className="form-label">Box Developer Access Token</label>
                    <input
                      type="password"
                      placeholder="e.g. 7q8k... (Box OAuth Token)"
                      value={profileForm.boxStorageApiKey || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, boxStorageApiKey: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Box Folder ID (Default: 0 for Root)</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={profileForm.boxFolderId || '0'}
                      onChange={(e) => setProfileForm({ ...profileForm, boxFolderId: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                <Save size={16} />
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div style={{ maxWidth: '750px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem' }}>Storage Bucket, Backup & Factory Reset</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sync live data with your remote Storage Bucket, export JSON backups, or import snapshots.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Storage Bucket Sync Card */}
              <div
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  background: 'rgba(99, 102, 241, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <Cloud size={20} color="#818cf8" />
                  <h4 style={{ fontSize: '1.15rem' }}>Live Storage Bucket Sync</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Fetch and reload the most up-to-date portfolio data directly from the configured Storage Bucket or static JSON endpoint.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSyncStorageBucket}
                    className="btn btn-primary btn-sm"
                    disabled={isSyncing}
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync from Storage Bucket Now'}</span>
                  </button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Export Portfolio (JSON)</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Download all your projects, experience logs, skills, and configuration as a single JSON backup. You can upload this JSON to your Firebase/Cloud Storage bucket anytime.
                </p>
                <button onClick={handleExportJson} className="btn btn-primary btn-sm">
                  <Download size={14} />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Import / Restore Portfolio (JSON)</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Select a valid portfolio JSON file to load into the system.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="form-control"
                  style={{ maxWidth: '350px' }}
                />
              </div>

              <div
                className="glass-card"
                style={{ padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#f87171' }}>
                  Reset to Initial Defaults
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Clear all customized edits and restore the pre-seeded dataset from your CV and JSON files.
                </p>
                <button onClick={handleResetDefaults} className="btn btn-danger btn-sm">
                  <RotateCcw size={14} />
                  <span>Reset All to Factory Defaults</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROJECT ADD / EDIT MODAL */}
      {isProjectModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProjectModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '750px', padding: '2rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h3 style={{ fontSize: '1.35rem' }}>
                {editingProjectId ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProject}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="form-control"
                    placeholder="e.g. CloudGate Multi-Cloud Portal"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={projectForm.category}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, category: e.target.value as ProjectCategory })
                    }
                    className="form-control"
                  >
                    <option value="Full-Stack">Full-Stack</option>
                    <option value="React">React</option>
                    <option value="Angular">Angular</option>
                    <option value="Mobile">Mobile (Flutter / Native)</option>
                    <option value="Backend / Cloud">Backend / Cloud</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Role in Project</label>
                  <input
                    type="text"
                    value={projectForm.role || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Lead Frontend / API Architect"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year / Period</label>
                  <input
                    type="text"
                    value={projectForm.year || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, year: e.target.value })}
                    className="form-control"
                    placeholder="2025"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <textarea
                  rows={2}
                  required
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="form-control"
                  placeholder="Key summary of what the project does and its core value."
                />
              </div>

              {/* Image Uploader & Box Storage Integration */}
              <div
                style={{
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ImageIcon size={15} color="var(--primary)" />
                  <span>Project Image / Thumbnail</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }} className="form-row">
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Option A: Upload Image File (Direct / Box API)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="form-control"
                      disabled={isUploading}
                    />
                    {isUploading && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Uploading...</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Option B: Image URL (Direct / Firebase / CDN)
                    </label>
                    <input
                      type="text"
                      value={projectForm.imgUrl}
                      onChange={(e) => setProjectForm({ ...projectForm, imgUrl: e.target.value })}
                      className="form-control"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {projectForm.imgUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview:</span>
                    <img
                      src={projectForm.imgUrl}
                      alt="Thumbnail Preview"
                      style={{ height: '60px', borderRadius: '6px', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* YouTube Video Link */}
              <div
                style={{
                  padding: '1.25rem',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171' }}>
                  <Video size={16} />
                  <span>YouTube Demo / Video URL (Optional)</span>
                </label>
                <input
                  type="text"
                  value={projectForm.videoUrl || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, videoUrl: e.target.value })}
                  className="form-control"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                />
              </div>

              {/* Links & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Live App / Site URL</label>
                  <input
                    type="text"
                    value={projectForm.liveUrl || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                    className="form-control"
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GitHub Repository URL</label>
                  <input
                    type="text"
                    value={projectForm.githubUrl || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                    className="form-control"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tech Stack Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="form-control"
                  placeholder="React, Next.js, Node.js, RabbitMQ, Docker"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                <Save size={16} />
                <span>{editingProjectId ? 'Save Project Changes' : 'Create Project'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXPERIENCE ADD / EDIT MODAL */}
      {isExpModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsExpModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '650px', padding: '2rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h3 style={{ fontSize: '1.35rem' }}>
                {editingExpId ? 'Edit Experience' : 'Add Experience'}
              </h3>
              <button onClick={() => setIsExpModalOpen(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveExp}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    required
                    value={expForm.company}
                    onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Obelion.ai / Diagnosit"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role Title</label>
                  <input
                    type="text"
                    required
                    value={expForm.role}
                    onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Full-Stack Software Engineer"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration / Period</label>
                  <input
                    type="text"
                    required
                    value={expForm.period}
                    onChange={(e) => setExpForm({ ...expForm, period: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Nov 2024 – Present (1.5 Years)"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Mode</label>
                  <input
                    type="text"
                    required
                    value={expForm.location}
                    onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
                    className="form-control"
                    placeholder="Remote, Egypt"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsibilities & Achievements (One per line)</label>
                <textarea
                  rows={4}
                  required
                  value={expForm.description.join('\n')}
                  onChange={(e) =>
                    setExpForm({ ...expForm, description: e.target.value.split('\n') })
                  }
                  className="form-control"
                  placeholder="Developed Attend app with React&#10;Architected CloudGate backend with Express & RabbitMQ"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technologies (Comma separated)</label>
                <input
                  type="text"
                  value={expTechInput}
                  onChange={(e) => setExpTechInput(e.target.value)}
                  className="form-control"
                  placeholder="React, Next.js, Node.js, Express, Docker, AWS"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="currentRole"
                  checked={expForm.current}
                  onChange={(e) => setExpForm({ ...expForm, current: e.target.checked })}
                />
                <label htmlFor="currentRole" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                  Current Position
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                <Save size={16} />
                <span>Save Experience</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
