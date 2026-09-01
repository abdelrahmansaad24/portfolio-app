import type { PortfolioData } from '../types/portfolio';
import { initialPortfolioData } from '../data/initialData';

const STORAGE_KEY = 'abdelrahman_portfolio_data_v1';
const ADMIN_AUTH_KEY = 'abdelrahman_admin_session';
export const DEFAULT_STORAGE_BUCKET_URL =
  'https://firebasestorage.googleapis.com/v0/b/portfolio-77dbd.appspot.com/o/data%2FportfolioData.json?alt=media';
export const LOCAL_JSON_FALLBACK_URL = '/data/portfolioData.json';

export class StorageService {
  /**
   * Load portfolio data from localStorage or fallback to initial data
   */
  static getPortfolioData(): PortfolioData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.profile && parsed.projects) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading portfolio data from localStorage', e);
    }
    return initialPortfolioData;
  }

  /**
   * Fetch portfolio data from storage bucket / remote JSON endpoint
   * Tries provided URL, localStorage configured URL, remote Firebase bucket, or local JSON.
   */
  static async fetchRemotePortfolioData(customUrl?: string): Promise<PortfolioData | null> {
    const urlsToTry: string[] = [];

    if (customUrl && customUrl.trim() !== '') {
      urlsToTry.push(customUrl.trim());
    }

    try {
      const localData = this.getPortfolioData();
      if (localData?.profile?.storageBucketDataUrl && !urlsToTry.includes(localData.profile.storageBucketDataUrl)) {
        urlsToTry.push(localData.profile.storageBucketDataUrl.trim());
      }
    } catch {
      // ignore
    }

    if (import.meta.env.VITE_STORAGE_DATA_URL && !urlsToTry.includes(import.meta.env.VITE_STORAGE_DATA_URL)) {
      urlsToTry.push(import.meta.env.VITE_STORAGE_DATA_URL);
    }

    if (!urlsToTry.includes(DEFAULT_STORAGE_BUCKET_URL)) {
      urlsToTry.push(DEFAULT_STORAGE_BUCKET_URL);
    }

    if (!urlsToTry.includes(LOCAL_JSON_FALLBACK_URL)) {
      urlsToTry.push(LOCAL_JSON_FALLBACK_URL);
    }

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (response.ok) {
          const fetchedData = await response.json();
          if (fetchedData && fetchedData.profile && Array.isArray(fetchedData.projects)) {
            // Save to localStorage for instant offline access & caching
            this.savePortfolioData(fetchedData);
            return fetchedData as PortfolioData;
          }
        }
      } catch (err) {
        console.warn(`Could not load portfolio data from ${url}:`, err);
      }
    }

    return null;
  }

  /**
   * Save portfolio data to localStorage
   */
  static savePortfolioData(data: PortfolioData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving portfolio data to localStorage', e);
    }
  }

  /**
   * Reset data to original defaults
   */
  static resetToDefault(): PortfolioData {
    localStorage.removeItem(STORAGE_KEY);
    return initialPortfolioData;
  }

  /**
   * Admin Authentication Check
   * Default hardcoded credentials:
   * Username: admin
   * Password: password123 (or admin123)
   */
  static verifyAdmin(user: string, pass: string): boolean {
    const trimmedUser = user.trim().toLowerCase();
    const trimmedPass = pass.trim();
    if ((trimmedUser === 'admin' && trimmedPass === 'password123') ||
        (trimmedUser === 'admin' && trimmedPass === 'admin123') ||
        (trimmedUser === 'abdelrahman' && trimmedPass === 'admin2025')) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ loggedIn: true, time: Date.now() }));
      return true;
    }
    return false;
  }

  static isAdminLoggedIn(): boolean {
    try {
      const session = sessionStorage.getItem(ADMIN_AUTH_KEY);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return parsed && parsed.loggedIn === true;
    } catch {
      return false;
    }
  }

  static logoutAdmin(): void {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  }

  /**
   * YouTube URL normalization to embed format
   */
  static getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    try {
      // Check for youtu.be/<id>
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch && shortMatch[1]) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`;
      }

      // Check for youtube.com/watch?v=<id>
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch && watchMatch[1]) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`;
      }

      // Check for youtube.com/embed/<id>
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
    } catch {
      // ignore
    }
    return url;
  }

  /**
   * Direct file upload:
   * 1. If Box API Token is provided in profile settings, uploads to Box Storage via Box Upload API
   * 2. Otherwise encodes as Base64 Data URL so images are stored instantly in browser storage
   */
  static async uploadImageFile(file: File, boxToken?: string, boxFolderId: string = '0'): Promise<string> {
    if (boxToken && boxToken.trim() !== '') {
      try {
        const formData = new FormData();
        const attributes = JSON.stringify({
          name: `${Date.now()}_${file.name}`,
          parent: { id: boxFolderId || '0' }
        });
        formData.append('attributes', attributes);
        formData.append('file', file);

        const response = await fetch('https://upload.box.com/api/2.0/files/content', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${boxToken.trim()}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.entries && result.entries.length > 0) {
            const fileId = result.entries[0].id;
            // Return direct Box shared or representation link
            return `https://app.box.com/embed/s/${fileId}`;
          }
        } else {
          console.warn('Box API upload returned status:', response.status);
        }
      } catch (err) {
        console.warn('Box upload failed, falling back to direct Data URL', err);
      }
    }

    // Fallback to Data URL (Base64)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload CV / Document (PDF or document file)
   */
  static async uploadDocumentFile(file: File, boxToken?: string, boxFolderId: string = '0'): Promise<string> {
    if (boxToken && boxToken.trim() !== '') {
      try {
        const formData = new FormData();
        const attributes = JSON.stringify({
          name: `${Date.now()}_${file.name}`,
          parent: { id: boxFolderId || '0' }
        });
        formData.append('attributes', attributes);
        formData.append('file', file);

        const response = await fetch('https://upload.box.com/api/2.0/files/content', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${boxToken.trim()}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.entries && result.entries.length > 0) {
            const fileId = result.entries[0].id;
            return `https://app.box.com/embed/s/${fileId}`;
          }
        }
      } catch (err) {
        console.warn('Box document upload failed, falling back to base64 Data URL', err);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Export all portfolio data as a JSON file
   */
  static exportToJson(data: PortfolioData): void {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `abdelrahman_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
