import type { PortfolioData } from '../types/portfolio';
import { initialPortfolioData } from '../data/initialData';

const STORAGE_KEY = 'abdelrahman_portfolio_data_v1';
const ADMIN_AUTH_KEY = 'abdelrahman_admin_session';

export class StorageService {
  /**
   * Load portfolio data from localStorage or fallback to initial data
   */
  static getPortfolioData(): PortfolioData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading portfolio data from localStorage', e);
    }
    return initialPortfolioData;
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
