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
  syncWithDatabase: () => Promise<boolean>;
  saveToMongoDB: (overrideData?: PortfolioData) => Promise<BucketPushResult>;
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
  const isInitialFetchDone = useRef(false);

  // Background fetch from live MongoDB database on mount
  useEffect(() => {
    let isMounted = true;
    const loadRemote = async () => {
      try {
        setIsSyncing(true);
        const remoteData = await StorageService.fetchRemotePortfolioData();
        if (remoteData && isMounted) {
          setData(remoteData);
          setLastSyncStatus('Live data loaded from MongoDB Atlas');
        }
      } catch (e) {
        console.warn('Initial MongoDB sync failed, using cached data:', e);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
          isInitialFetchDone.current = true;
        }
      }
    };
    loadRemote();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to localStorage immediately on any state change
  useEffect(() => {
    StorageService.savePortfolioData(data);
  }, [data]);

  // Save directly to MongoDB Atlas
  const saveToMongoDB = useCallback(
    async (overrideData?: PortfolioData): Promise<BucketPushResult> => {
      const dataToSave = overrideData || data;
      setIsPushing(true);
      try {
        const res = await StorageService.savePortfolioDataToMongo(dataToSave);
        setLastSyncStatus(res.message);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error saving to MongoDB';
        setLastSyncStatus(msg);
        return { success: false, message: msg };
      } finally {
        setIsPushing(false);
      }
    },
    [data]
  );

  // Auto-Save: Whenever data is modified after initial mount/fetch, automatically persist to MongoDB Atlas
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isInitialFetchDone.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsPushing(true);
        const res = await StorageService.savePortfolioDataToMongo(data);
        if (res.success) {
          setLastSyncStatus('Auto-saved to MongoDB Atlas');
        } else {
          setLastSyncStatus(`Auto-save: ${res.message}`);
        }
      } catch (err) {
        console.warn('MongoDB auto-save error:', err);
      } finally {
        setIsPushing(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [data]);

  // Manual Sync / Pull from MongoDB Atlas
  const syncWithDatabase = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const remoteData = await StorageService.fetchRemotePortfolioData();
      if (remoteData) {
        setData(remoteData);
        setLastSyncStatus('Successfully refreshed from MongoDB Atlas');
        return true;
      }
    } catch (err) {
      console.error('Database sync error:', err);
      setLastSyncStatus('Failed to sync from database');
    } finally {
      setIsSyncing(false);
    }
    return false;
  }, []);

  // Push directly to Box Storage Account
  const pushToBoxStorage = useCallback(
    async (overrideData?: PortfolioData): Promise<BucketPushResult> => {
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
    },
    [data]
  );

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

  // Push to all active storage backends
  const pushToStorageBucket = useCallback(
    async (overrideData?: PortfolioData): Promise<BucketPushResult> => {
      const dataToPush = overrideData || data;
      setIsPushing(true);
      try {
        // Persist to MongoDB
        const mongoRes = await StorageService.savePortfolioDataToMongo(dataToPush);

        // Optional push to Box if configured
        const boxToken = await StorageService.getBoxToken(undefined, dataToPush);
        if (boxToken && boxToken.trim() !== '') {
          try {
            await StorageService.pushPortfolioDataToBox(
              dataToPush,
              boxToken,
              dataToPush.profile?.boxFolderId,
              dataToPush.profile?.boxFileId
            );
          } catch {
            // ignore
          }
        }

        const combinedMessage = mongoRes.success
          ? 'Saved directly to MongoDB Atlas!'
          : mongoRes.message;

        setLastSyncStatus(combinedMessage);
        return {
          success: true,
          message: combinedMessage,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error saving data';
        setLastSyncStatus(msg);
        return { success: false, message: msg };
      } finally {
        setIsPushing(false);
      }
    },
    [data]
  );

  const syncWithStorageBucket = async (_customUrl?: string): Promise<boolean> => {
    return await syncWithDatabase();
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
      id: `proj-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      projects: [project, ...prev.projects],
    }));
  };

  const updateProject = (updated: Project) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const deleteProject = (id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const addExperience = (newExp: Omit<Experience, 'id'>) => {
    const experience: Experience = {
      ...newExp,
      id: `exp-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      experiences: [experience, ...prev.experiences],
    }));
  };

  const updateExperience = (updated: Experience) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) => (e.id === updated.id ? updated : e)),
    }));
  };

  const deleteExperience = (id: string) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
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
      StorageService.savePortfolioDataToMongo(imported);
      setLastSyncStatus('Imported snapshot loaded & saved to MongoDB Atlas');
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
        syncWithDatabase,
        saveToMongoDB,
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
