import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { PortfolioData, Project, Experience, SkillCategory, ProfileInfo } from '../types/portfolio';
import { StorageService, type BucketPushResult } from '../services/storageService';

interface PortfolioContextType {
  data: PortfolioData;
  isSyncing: boolean;
  isPushing: boolean;
  lastSyncStatus: string | null;
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
  syncWithStorageBucket: (customUrl?: string) => Promise<boolean>;
  pushToStorageBucket: (overrideData?: PortfolioData) => Promise<BucketPushResult>;
  pushToBoxStorage: (overrideData?: PortfolioData) => Promise<BucketPushResult>;
  initializeBoxBucket: () => Promise<BucketPushResult>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortfolioData>(() => StorageService.getPortfolioData());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // Background fetch from remote Box bucket / storage bucket on mount
  useEffect(() => {
    let isMounted = true;
    const loadRemote = async () => {
      try {
        const remoteData = await StorageService.fetchRemotePortfolioData();
        if (remoteData && isMounted) {
          setData(remoteData);
          setLastSyncStatus('Live data synced from Box Bucket');
        }
      } catch (e) {
        console.warn('Initial remote bucket sync failed, using cached data:', e);
      }
    };
    loadRemote();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to localStorage on any state change
  useEffect(() => {
    StorageService.savePortfolioData(data);
  }, [data]);

  // Push directly to Box Storage Account
  const pushToBoxStorage = useCallback(async (overrideData?: PortfolioData): Promise<BucketPushResult> => {
    const dataToPush = overrideData || data;
    setIsPushing(true);
    try {
      const boxToken = await StorageService.getBoxToken(undefined, dataToPush);
      const res = await StorageService.pushPortfolioDataToBox(
        dataToPush,
        boxToken,
        dataToPush.profile?.boxFolderId,
        dataToPush.profile?.boxFileId
      );
      if (res.success) {
        if (res.fileId) {
          dataToPush.profile.boxFileId = res.fileId;
        }
        if (res.downloadUrl) {
          dataToPush.profile.storageBucketDataUrl = res.downloadUrl;
        }
        setData({ ...dataToPush });
      }
      setLastSyncStatus(res.message);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error pushing to Box';
      setLastSyncStatus(msg);
      return { success: false, message: msg };
    } finally {
      setIsPushing(false);
    }
  }, [data]);

  // Initialize Box Bucket with default data and default CV
  const initializeBoxBucket = useCallback(async (): Promise<BucketPushResult> => {
    setIsPushing(true);
    try {
      const boxToken = await StorageService.getBoxToken(undefined, data);
      const res = await StorageService.initializeBoxBucketWithDefaults(
        boxToken,
        data.profile?.boxFolderId || '0'
      );
      if (res.success && res.data) {
        setData(res.data);
      }
      setLastSyncStatus(res.message);
      return {
        success: res.success,
        message: res.message,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error initializing Box bucket';
      setLastSyncStatus(msg);
      return { success: false, message: msg };
    } finally {
      setIsPushing(false);
    }
  }, [data]);

  // Push to all active storage backends (Box + Firebase / custom bucket)
  const pushToStorageBucket = useCallback(async (overrideData?: PortfolioData): Promise<BucketPushResult> => {
    const dataToPush = overrideData || data;
    setIsPushing(true);
    try {
      // 1. Push directly to Box Storage if Box token is available
      const boxToken = await StorageService.getBoxToken(undefined, dataToPush);
      let boxResult: BucketPushResult | null = null;
      if (boxToken && boxToken.trim() !== '') {
        try {
          boxResult = await StorageService.pushPortfolioDataToBox(
            dataToPush,
            boxToken,
            dataToPush.profile?.boxFolderId,
            dataToPush.profile?.boxFileId
          );
          if (boxResult.fileId) {
            dataToPush.profile.boxFileId = boxResult.fileId;
          }
          if (boxResult.downloadUrl) {
            dataToPush.profile.storageBucketDataUrl = boxResult.downloadUrl;
          }
        } catch {
          // ignore
        }
      }

      // 2. Also push to generic/Firebase bucket
      const result = await StorageService.pushPortfolioDataToBucket(dataToPush);
      const combinedMessage = boxResult?.success
        ? boxResult.message
        : result.message;

      setLastSyncStatus(combinedMessage);
      return {
        success: (boxResult?.success ?? false) || result.success,
        message: combinedMessage,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error pushing to bucket';
      setLastSyncStatus(msg);
      return { success: false, message: msg };
    } finally {
      setIsPushing(false);
    }
  }, [data]);

  // Handle auto-sync to bucket if enabled
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (data.profile?.autoSyncToBucket) {
      const timer = setTimeout(() => {
        pushToStorageBucket(data);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, pushToStorageBucket]);

  const syncWithStorageBucket = async (customUrl?: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const remoteData = await StorageService.fetchRemotePortfolioData(customUrl);
      if (remoteData) {
        setData(remoteData);
        setIsSyncing(false);
        setLastSyncStatus('Successfully refreshed from Box / Cloud Bucket');
        return true;
      }
    } catch (err) {
      console.error('Storage bucket sync error:', err);
      setLastSyncStatus('Failed to sync from bucket');
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  const updateProfile = (profile: ProfileInfo) => {
    setData((prev) => {
      const next = { ...prev, profile };
      return next;
    });
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
    setLastSyncStatus('Reset to default values');
  };

  const importPortfolioData = (imported: PortfolioData) => {
    if (imported && imported.profile && imported.projects) {
      setData(imported);
      StorageService.savePortfolioData(imported);
      setLastSyncStatus('Imported snapshot loaded');
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
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
        syncWithStorageBucket,
        pushToStorageBucket,
        pushToBoxStorage,
        initializeBoxBucket,
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
