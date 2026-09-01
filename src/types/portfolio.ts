export type ProjectCategory = 'Full-Stack' | 'React' | 'Angular' | 'Mobile' | 'Backend / Cloud' | 'Other';

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  longDescription?: string;
  imgUrl: string;
  videoUrl?: string; // YouTube or direct video URL
  isVideo?: boolean;
  liveUrl?: string;
  githubUrl?: string;
  tags: string[];
  featured?: boolean;
  year?: string;
  role?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  type: string; // e.g. "Full-time", "Internship", "Part-time"
  period: string;
  location: string;
  description: string[];
  technologies: string[];
  current?: boolean;
}

export interface SkillCategory {
  category: string;
  skills: {
    name: string;
    level: number; // 0 to 100
    icon?: string;
  }[];
}

export interface ProfileInfo {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  yearsOfExperience: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  avatarUrl?: string;
  resumeUrl: string;
  storageBucketDataUrl?: string;
  storageBucketUploadUrl?: string;
  storageBucketApiKey?: string;
  autoSyncToBucket?: boolean;
  boxStorageApiKey?: string;
  boxClientId?: string;
  boxClientSecret?: string;
  boxFolderId?: string;
  boxFileId?: string;
  boxCvFileId?: string;
}

export interface PortfolioData {
  profile: ProfileInfo;
  experiences: Experience[];
  projects: Project[];
  skillCategories: SkillCategory[];
}
