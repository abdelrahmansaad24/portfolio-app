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
  UploadCloud,
  Check,
  AlertCircle,
  Zap,
  Radio,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { Project, Experience, ProfileInfo, ProjectCategory } from '../types/portfolio';
import {
  StorageService,
  DEFAULT_STORAGE_BUCKET_URL,
  DEFAULT_STORAGE_BUCKET_UPLOAD_URL,
} from '../services/storageService';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const {
    data,
    isSyncing,
    isPushing,
    lastSyncStatus,
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
    saveToMongoDB,
    syncWithDatabase,
    pushToBoxStorage,
    initializeBoxBucket,
  } = usePortfolio();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'projects' | 'experience' | 'skills' | 'profile' | 'backup'>('projects');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bucketTestState, setBucketTestState] = useState<{ testing: boolean; message: string | null; isSuccess?: boolean }>({
    testing: false,
    message: null,
  });
  const [mongoTestState, setMongoTestState] = useState<{ testing: boolean; message: string | null; isSuccess?: boolean }>({
    testing: false,
    message: null,
  });

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
      const boxToken = profileForm.boxStorageApiKey || data.profile.boxStorageApiKey;
      const url = await StorageService.uploadDocumentFile(
        file,
        boxToken,
        profileForm.boxFolderId || data.profile.boxFolderId
      );
      setProfileForm((prev) => ({ ...prev, resumeUrl: url }));
      updateProfile({ ...data.profile, ...profileForm, resumeUrl: url });
      showToast('CV / Resume uploaded successfully to Storage Bucket / Box!');
    } catch (err) {
      console.error('CV upload error:', err);
      showToast('Error uploading CV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToMongo = async () => {
    showToast('Saving portfolio data to MongoDB Atlas...');
    const res = await saveToMongoDB({ ...data, profile: profileForm });
    showToast(res.message);
  };

  const handleSyncFromMongo = async () => {
    const success = await syncWithDatabase();
    if (success) {
      setProfileForm({ ...data.profile });
      showToast('Synced latest data from MongoDB Atlas!');
    } else {
      showToast('Could not fetch data from MongoDB Atlas.');
    }
  };

  const handleTestMongo = async () => {
    setMongoTestState({ testing: true, message: null });
    const res = await StorageService.testMongoConnection();
    setMongoTestState({
      testing: false,
      message: res.message,
      isSuccess: res.success,
    });
  };


  const handlePushToBucket = () => {
    const currentEditedData = {
      ...data,
      profile: {
        ...data.profile,
        ...profileForm,
      },
    };

    const blob = new Blob([JSON.stringify(currentEditedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolioData.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Downloaded current edited portfolioData.json successfully!');
  };

  const handleTestBucket = async (urlToTest?: string) => {
    const url = urlToTest || profileForm.storageBucketDataUrl || DEFAULT_STORAGE_BUCKET_URL;
    setBucketTestState({ testing: true, message: null });
    const res = await StorageService.testBucketConnection(url);
    setBucketTestState({
      testing: false,
      message: res.message,
      isSuccess: res.success,
    });
  };

  const handleTestBox = async () => {
    setBucketTestState({ testing: true, message: null });
    const res = await StorageService.testBoxConnection(profileForm.boxStorageApiKey);
    setBucketTestState({
      testing: false,
      message: res.message,
      isSuccess: res.success,
    });
  };

  const handlePushToBox = async () => {
    showToast('Pushing portfolio data directly to Box Cloud Storage...');
    const res = await pushToBoxStorage({ ...data, profile: profileForm });
    if (res.success) {
      if (res.fileId) {
        setProfileForm((prev) => ({ ...prev, boxFileId: res.fileId }));
      }
      if (res.downloadUrl) {
        setProfileForm((prev) => ({ ...prev, storageBucketDataUrl: res.downloadUrl }));
      }
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleInitializeBoxBucket = async () => {
    showToast('Initializing Box Bucket: creating default dataset & uploading CV...');
    const res = await initializeBoxBucket();
    if (res.success) {
      setProfileForm({ ...data.profile });
      showToast('Box Bucket initialized successfully with default portfolio data & CV!');
    } else {
      showToast(`Box Initialization: ${res.message}`);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    showToast('Saving profile changes directly to MongoDB Atlas...');
    const res = await saveToMongoDB({ ...data, profile: profileForm });
    if (res.success) {
      showToast('Profile saved directly to MongoDB Atlas!');
    } else {
      showToast(`Saved locally: ${res.message}`);
    }
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
        showToast('Portfolio data restored & synced to MongoDB!');
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
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
            }}
          >
            <Database size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Admin <span className="gradient-text">Control Center</span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Powered directly by MongoDB Atlas (Auto-Save Active)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Live Sync Status */}
          <div
            style={{
              fontSize: '0.75rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Radio size={12} color="#10b981" />
            <span>{isPushing ? 'Saving to MongoDB...' : (lastSyncStatus || 'MongoDB Atlas Connected')}</span>
          </div>

          <button
            onClick={handleSaveToMongo}
            disabled={isPushing}
            className="btn btn-primary btn-sm"
            style={{
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
            title="Save changes immediately to MongoDB Atlas"
          >
            <Save size={14} />
            <span>{isPushing ? 'Saving...' : 'Save to MongoDB'}</span>
          </button>

          <button
            onClick={handleSyncFromMongo}
            disabled={isSyncing}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
            title="Fetch latest data directly from MongoDB Atlas"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Pull MongoDB'}</span>
          </button>

          <button
            onClick={handlePushToBucket}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
            title="Download current edited version as portfolioData.json"
          >
            <Download size={14} />
            <span>Download JSON</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <ExternalLink size={14} />
            <span>Live Site</span>
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
            <span>Profile & CV</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`btn btn-sm ${activeTab === 'backup' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.5rem' }}
          >
            <Database size={16} />
            <span>MongoDB & Backups</span>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cloud size={18} color="#818cf8" />
                    <h4 style={{ fontSize: '1rem' }}>Storage Bucket & Live Data Sync</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestBucket(profileForm.storageBucketDataUrl)}
                    disabled={bucketTestState.testing}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    <Zap size={12} />
                    <span>{bucketTestState.testing ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  When someone opens your portfolio, it automatically reads the latest data directly from this bucket URL so you never need to redeploy or fix defaults manually.
                </p>

                {bucketTestState.message && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: bucketTestState.isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${bucketTestState.isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: bucketTestState.isSuccess ? '#34d399' : '#f87171',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {bucketTestState.isSuccess ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{bucketTestState.message}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Storage Bucket Read URL (GET JSON data)</label>
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

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Storage Bucket Upload Endpoint (POST/PUT JSON)</label>
                  <input
                    type="text"
                    placeholder={DEFAULT_STORAGE_BUCKET_UPLOAD_URL}
                    value={profileForm.storageBucketUploadUrl || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, storageBucketUploadUrl: e.target.value })}
                    className="form-control"
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    Endpoint used by "Push to Bucket" to save changes directly to Firebase Storage, Box, Cloudflare R2, or custom API.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Storage Bucket API Key / Token (Optional)</label>
                  <input
                    type="password"
                    placeholder="Firebase API Key or Bearer Token (if bucket requires authentication)"
                    value={profileForm.storageBucketApiKey || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, storageBucketApiKey: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={!!profileForm.autoSyncToBucket}
                      onChange={(e) => setProfileForm({ ...profileForm, autoSyncToBucket: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    <span>Automatically Push & Publish changes to Storage Bucket on save</span>
                  </label>
                </div>
              </div>

              {/* Box Enterprise JWT Storage Hub */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={18} color="var(--primary)" />
                    <h4 style={{ fontSize: '1rem' }}>Box Enterprise Storage Hub (JWT Authenticated)</h4>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      Active
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleTestBox}
                      disabled={bucketTestState.testing}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      <Zap size={12} />
                      <span>{bucketTestState.testing ? 'Testing...' : 'Test Box JWT Token'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInitializeBoxBucket}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                      title="Upload default portfolio JSON and default CV directly to Box bucket"
                    >
                      <Layers size={12} />
                      <span>Re-seed Defaults & CV on Box</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePushToBox}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      <UploadCloud size={12} />
                      <span>Push to Box Bucket</span>
                    </button>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Your portfolio is connected to Box Cloud Storage using <strong>Server Authentication (JWT)</strong> via <code>1536515809__config.json</code>. Changes and CV uploads are saved directly to Box.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
                  <div className="form-group">
                    <label className="form-label">Box Enterprise ID</label>
                    <input
                      type="text"
                      readOnly
                      value="1536515809"
                      className="form-control"
                      style={{ opacity: 0.85, background: 'rgba(0,0,0,0.2)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Box Client ID</label>
                    <input
                      type="text"
                      readOnly
                      value={profileForm.boxClientId || 'lsdrk5clh21oyydo23bnb9x48958ooqz'}
                      className="form-control"
                      style={{ opacity: 0.85, background: 'rgba(0,0,0,0.2)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.75rem' }} className="form-row">
                  <div className="form-group">
                    <label className="form-label">Box Folder ID</label>
                    <input
                      type="text"
                      placeholder="414043598356"
                      value={profileForm.boxFolderId || '414043598356'}
                      onChange={(e) => setProfileForm({ ...profileForm, boxFolderId: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Box File ID (portfolioData.json)</label>
                    <input
                      type="text"
                      placeholder="2440626249336"
                      value={profileForm.boxFileId || '2440626249336'}
                      onChange={(e) => setProfileForm({ ...profileForm, boxFileId: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Box CV File ID (Resume.pdf)</label>
                    <input
                      type="text"
                      placeholder="2440627671737"
                      value={profileForm.boxCvFileId || '2440627671737'}
                      onChange={(e) => setProfileForm({ ...profileForm, boxCvFileId: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <a
                    href="https://app.box.com/s/2uornst7s8djwchnahwvvenjueh43zta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    <span>Open Live Box Folder (2 Files: Resume.pdf & portfolioData.json) ↗</span>
                  </a>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                <Save size={16} />
                <span>Save Profile & Storage Settings</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: MONGODB & BACKUPS */}
        {activeTab === 'backup' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem' }}>MongoDB Atlas Direct Database</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Your portfolio data reads and writes directly to MongoDB Atlas in real-time. Any changes you make are auto-saved automatically to your database.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* MongoDB Atlas Direct Live Card */}
              <div
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Database size={22} color="#34d399" />
                    <div>
                      <h4 style={{ fontSize: '1.15rem', color: '#ffffff' }}>MongoDB Atlas Cluster0 (Direct Read/Write)</h4>
                      <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>Database: <code>portfolio</code> • Collection: <code>portfolio_data</code></div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.2)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    <Radio size={10} color="#34d399" />
                    Auto-Save Active
                  </span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Every project edit, new experience, skills update, or profile modification is instantly persisted into MongoDB Atlas with automatic debouncing. No manual bucket uploads required!
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <button
                    onClick={handleTestMongo}
                    className="btn btn-primary btn-sm"
                    disabled={mongoTestState.testing}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      gap: '0.4rem',
                    }}
                  >
                    <Zap size={14} />
                    <span>{mongoTestState.testing ? 'Testing...' : 'Test MongoDB Atlas Connection'}</span>
                  </button>

                  <button
                    onClick={handleSaveToMongo}
                    className="btn btn-secondary btn-sm"
                    disabled={isPushing}
                    style={{ gap: '0.4rem' }}
                  >
                    <Save size={14} />
                    <span>{isPushing ? 'Saving...' : 'Save to MongoDB Now'}</span>
                  </button>

                  <button
                    onClick={handleSyncFromMongo}
                    className="btn btn-secondary btn-sm"
                    disabled={isSyncing}
                    style={{ gap: '0.4rem' }}
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Pulling...' : 'Pull / Fetch from MongoDB'}</span>
                  </button>

                  <button
                    onClick={handlePushToBucket}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.4rem' }}
                    title="Download current edited version as portfolioData.json"
                  >
                    <Download size={14} />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {mongoTestState.message && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: mongoTestState.isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${mongoTestState.isSuccess ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      color: mongoTestState.isSuccess ? '#34d399' : '#f87171',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {mongoTestState.isSuccess ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{mongoTestState.message}</span>
                  </div>
                )}

                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Cluster: <code>cluster0.gemj4ss.mongodb.net</code> • Auth: <code>Abdelrahman</code> • Protocol: <code>mongodb+srv</code>
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
