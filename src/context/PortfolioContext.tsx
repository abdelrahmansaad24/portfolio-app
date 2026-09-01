import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PortfolioData, Project, Experience, SkillCategory, ProfileInfo } from '../types/portfolio';
import { StorageService } from '../services/storageService';

interface PortfolioContextType {
  data: PortfolioData;
  updateProfile: (profile: ProfileInfo) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addExperience: (exp: Omit<Experience, 'id'>) => void;
  updateExperience: (exp: Experience) => void;
  deleteExperience: (id: string) => void;
  updateSkillCategories: (categories: SkillCategory[]) => void;
  resetToDefaults: () => void;
  importPortfolioData: (imported: PortfolioData) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortfolioData>(() => StorageService.getPortfolioData());

  useEffect(() => {
    StorageService.savePortfolioData(data);
  }, [data]);

  const updateProfile = (profile: ProfileInfo) => {
    setData((prev) => ({ ...prev, profile }));
  };

  const addProject = (newProj: Omit<Project, 'id'>) => {
    const project: Project = {
      ...newProj,
      id: `proj-${Date.now()}`
    };
    setData((prev) => ({
      ...prev,
      projects: [project, ...prev.projects]
    }));
  };

  const updateProject = (updated: Project) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === updated.id ? updated : p))
    }));
  };

  const deleteProject = (id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id)
    }));
  };

  const addExperience = (newExp: Omit<Experience, 'id'>) => {
    const experience: Experience = {
      ...newExp,
      id: `exp-${Date.now()}`
    };
    setData((prev) => ({
      ...prev,
      experiences: [experience, ...prev.experiences]
    }));
  };

  const updateExperience = (updated: Experience) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) => (e.id === updated.id ? updated : e))
    }));
  };

  const deleteExperience = (id: string) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id)
    }));
  };

  const updateSkillCategories = (categories: SkillCategory[]) => {
    setData((prev) => ({ ...prev, skillCategories: categories }));
  };

  const resetToDefaults = () => {
    const defaults = StorageService.resetToDefault();
    setData(defaults);
  };

  const importPortfolioData = (imported: PortfolioData) => {
    if (imported && imported.profile && imported.projects) {
      setData(imported);
      StorageService.savePortfolioData(imported);
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        data,
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
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
