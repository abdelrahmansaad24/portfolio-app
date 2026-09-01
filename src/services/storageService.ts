import type { PortfolioData } from '../types/portfolio';
import { initialPortfolioData } from '../data/initialData';
import { BoxJwtService } from './boxJwtService';

const STORAGE_KEY = 'abdelrahman_portfolio_data_v1';
const ADMIN_AUTH_KEY = 'abdelrahman_admin_session';

export const DEFAULT_BOX_USER_ID = '52559371009';
export const DEFAULT_BOX_FOLDER_ID = '414043598356';
export const DEFAULT_BOX_FILE_ID = '2440626249336';
export const DEFAULT_BOX_CV_FILE_ID = '2440627671737';
export const DEFAULT_BOX_FOLDER_URL = 'https://app.box.com/s/2uornst7s8djwchnahwvvenjueh43zta';

export const DEFAULT_STORAGE_BUCKET_URL =
  'https://app.box.com/shared/static/6bw5z2eva5bj1qb8405hmaed6npy5rmx.json';
export const DEFAULT_BOX_CV_DOWNLOAD_URL =
  'https://app.box.com/shared/static/kcl8o7o4u3ih99g6myiunj6i8824kz3m.pdf';
export const DEFAULT_STORAGE_BUCKET_UPLOAD_URL =
  'https://firebasestorage.googleapis.com/v0/b/portfolio-77dbd.appspot.com/o?name=data%2FportfolioData.json';
export const LOCAL_JSON_FALLBACK_URL = '/data/portfolioData.json';

export interface BucketPushResult {
  success: boolean;
  message: string;
  status?: number;
  fileId?: string;
  downloadUrl?: string;
  details?: unknown;
}

export class StorageService {
  /**
   * Helper to retrieve Box Token from override, profile data, or Box JWT Service
   */
  static async getBoxToken(overrideToken?: string, data?: PortfolioData): Promise<string> {
    if (overrideToken && overrideToken.trim() !== '') {
      return overrideToken.trim();
    }
    if (data?.profile?.boxStorageApiKey && data.profile.boxStorageApiKey.trim() !== '') {
      return data.profile.boxStorageApiKey.trim();
    }
    return await BoxJwtService.getAccessToken();
  }

  /**
   * Resilient Box API fetch: tries dev/Vercel proxy first to bypass CORS completely,
   * then falls back to direct Box endpoints.
   */
  static async fetchBox(
    endpoint: string,
    options: RequestInit = {},
    isUpload: boolean = false
  ): Promise<Response> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const proxyBase = isUpload ? '/box-upload/api/2.0' : '/box-api/2.0';
    const directBase = isUpload ? 'https://upload.box.com/api/2.0' : 'https://api.box.com/2.0';

    const headers = new Headers(options.headers || {});
    if (!headers.has('As-User')) {
      headers.set('As-User', DEFAULT_BOX_USER_ID);
    }
    const modifiedOptions: RequestInit = {
      ...options,
      headers,
    };

    // 1. Try local/Vercel proxy endpoint first (avoids browser CORS block)
    try {
      const proxyUrl = `${proxyBase}${cleanEndpoint}`;
      const res = await fetch(proxyUrl, modifiedOptions);
      if (res.status !== 404 && res.status !== 502) {
        return res;
      }
    } catch {
      // ignore and try direct
    }

    // 2. Direct Box endpoint fallback
    const directUrl = `${directBase}${cleanEndpoint}`;
    return fetch(directUrl, modifiedOptions);
  }

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
   * Check if user has saved data in localStorage
   */
  static hasLocalSavedData(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!(parsed && parsed.profile && parsed.projects);
      }
    } catch {
      // ignore
    }
    return false;
  }

  /**
   * Helper to search for a file by name inside a Box folder
   */
  static async findBoxFileByName(
    fileName: string,
    token: string,
    folderId: string = '0'
  ): Promise<{ id: string; name: string; shared_link?: { download_url?: string; url?: string } } | null> {
    if (!token) return null;
    try {
      const res = await this.fetchBox(`/folders/${folderId || '0'}/items?fields=id,name,type,shared_link`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const match = json.entries?.find(
          (e: { type: string; name: string; id: string }) =>
            e.type === 'file' && e.name.toLowerCase() === fileName.toLowerCase()
        );
        if (match) {
          return match;
        }
      }
    } catch (err) {
      console.warn(`Error querying Box folder for ${fileName}:`, err);
    }
    return null;
  }

  /**
   * Make a Box file public with open shared link and obtain direct download/view URL
   */
  static async makeBoxFilePublic(
    fileId: string,
    token: string
  ): Promise<{ downloadUrl?: string; sharedUrl?: string }> {
    if (!fileId || !token) return {};
    try {
      const res = await this.fetchBox(
        `/files/${fileId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shared_link: {
              access: 'open',
              permissions: {
                can_download: true,
                can_preview: true,
              },
            },
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        return {
          downloadUrl: json.shared_link?.download_url || json.shared_link?.url,
          sharedUrl: json.shared_link?.url,
        };
      }
    } catch (err) {
      console.warn(`Error setting Box shared link on file ${fileId}:`, err);
    }
    return {};
  }

  /**
   * Test Box API connectivity with JWT access token
   */
  static async testBoxConnection(
    boxToken?: string
  ): Promise<{ success: boolean; status: number; message: string; user?: unknown }> {
    const token = await this.getBoxToken(boxToken);
    if (!token) {
      return { success: false, status: 0, message: 'Box JWT access token is missing or could not be generated.' };
    }
    try {
      const res = await this.fetchBox('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = (await res.json()) as { name?: string; login?: string };
        return {
          success: true,
          status: res.status,
          message: `Connected to Box Enterprise Storage! Account: ${user.name || user.login} (${user.login || 'Active'})`,
          user,
        };
      }
      if (res.status === 401) {
        BoxJwtService.invalidateToken();
        const retryToken = await BoxJwtService.getAccessToken(true);
        const retryRes = await this.fetchBox('/users/me', {
          headers: { Authorization: `Bearer ${retryToken}` },
        });
        if (retryRes.ok) {
          const user = (await retryRes.json()) as { name?: string; login?: string };
          return {
            success: true,
            status: retryRes.status,
            message: `Connected to Box Enterprise Storage! Account: ${user.name || user.login}`,
            user,
          };
        }
        return {
          success: false,
          status: 401,
          message: 'Box JWT token authentication failed. Please verify 1536515809__config.json settings.',
        };
      }
      return {
        success: false,
        status: res.status,
        message: `Box API returned HTTP ${res.status}: ${res.statusText}`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        status: 0,
        message: `Box connection error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Push portfolio JSON data directly to Box Storage Account
   */
  static async pushPortfolioDataToBox(
    data: PortfolioData,
    boxToken?: string,
    boxFolderId: string = '0',
    knownFileId?: string
  ): Promise<BucketPushResult> {
    const token = await this.getBoxToken(boxToken, data);
    if (!token) {
      return {
        success: false,
        message: 'Box JWT access token is required to push to Box Storage.',
      };
    }

    const folderId = boxFolderId || data.profile.boxFolderId || DEFAULT_BOX_FOLDER_ID;
    let fileId = knownFileId || data.profile.boxFileId || DEFAULT_BOX_FILE_ID;

    // If fileId is not explicitly provided, try to find existing file in folder
    if (!fileId || fileId.trim() === '') {
      const found = await this.findBoxFileByName('portfolioData.json', token, folderId);
      if (found?.id) {
        fileId = found.id;
        data.profile.boxFileId = fileId;
      }
    }

    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    try {
      // 1. If fileId is known, update the file content directly
      if (fileId && fileId.trim() !== '') {
        const updateFormData = new FormData();
        updateFormData.append('file', jsonBlob, 'portfolioData.json');

        const updateRes = await this.fetchBox(
          `/files/${fileId.trim()}/content`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: updateFormData,
          },
          true
        );

        if (updateRes.ok) {
          const result = await updateRes.json();
          const publicLink = await this.makeBoxFilePublic(fileId.trim(), token);
          if (publicLink.downloadUrl) {
            data.profile.storageBucketDataUrl = publicLink.downloadUrl;
          }
          this.savePortfolioData(data);
          return {
            success: true,
            status: updateRes.status,
            fileId: fileId.trim(),
            downloadUrl: publicLink.downloadUrl,
            message: 'Portfolio dataset updated successfully on Box Storage bucket!',
            details: result,
          };
        }
      }

      // 2. Otherwise upload as new file or handle 409 conflict
      const formData = new FormData();
      const attributes = JSON.stringify({
        name: 'portfolioData.json',
        parent: { id: folderId },
      });
      formData.append('attributes', attributes);
      formData.append('file', jsonBlob, 'portfolioData.json');

      const uploadRes = await this.fetchBox(
        '/files/content',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
        true
      );

      if (uploadRes.ok) {
        const result = await uploadRes.json();
        const newFileId = result.entries?.[0]?.id;
        if (newFileId) {
          data.profile.boxFileId = newFileId;
          const publicLink = await this.makeBoxFilePublic(newFileId, token);
          if (publicLink.downloadUrl) {
            data.profile.storageBucketDataUrl = publicLink.downloadUrl;
          }
        }
        this.savePortfolioData(data);
        return {
          success: true,
          status: uploadRes.status,
          fileId: newFileId,
          downloadUrl: data.profile.storageBucketDataUrl,
          message: 'Portfolio dataset created and uploaded to Box Storage bucket successfully!',
          details: result,
        };
      }

      // 3. If file already exists (409 Conflict), update the existing file id
      if (uploadRes.status === 409) {
        const conflictData = await uploadRes.json().catch(() => null);
        const existingFileId = conflictData?.context_info?.conflicts?.id;
        if (existingFileId) {
          data.profile.boxFileId = existingFileId;
          const retryFormData = new FormData();
          retryFormData.append('file', jsonBlob, 'portfolioData.json');

          const retryRes = await this.fetchBox(
            `/files/${existingFileId}/content`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: retryFormData,
            },
            true
          );

          if (retryRes.ok) {
            const publicLink = await this.makeBoxFilePublic(existingFileId, token);
            if (publicLink.downloadUrl) {
              data.profile.storageBucketDataUrl = publicLink.downloadUrl;
            }
            this.savePortfolioData(data);
            return {
              success: true,
              status: retryRes.status,
              fileId: existingFileId,
              downloadUrl: data.profile.storageBucketDataUrl,
              message: 'Existing Box portfolio dataset updated with latest version!',
            };
          }
        }
      }

      if (uploadRes.status === 401) {
        BoxJwtService.invalidateToken();
        return {
          success: false,
          status: 401,
          message: 'Box JWT Token expired or invalid (HTTP 401). Retrying with fresh JWT token...',
        };
      }

      const errText = await uploadRes.text().catch(() => '');
      return {
        success: false,
        status: uploadRes.status,
        message: `Box upload returned HTTP ${uploadRes.status}: ${errText.slice(0, 150) || uploadRes.statusText}`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Box upload network error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Upload CV Document (PDF / DOCX) directly to Box Storage and return its public URL
   */
  static async uploadCvToBox(
    fileOrBlob: File | Blob,
    boxToken?: string,
    boxFolderId: string = DEFAULT_BOX_FOLDER_ID,
    fileName: string = 'Resume.pdf'
  ): Promise<BucketPushResult> {
    const token = await this.getBoxToken(boxToken);
    if (!token) {
      return { success: false, message: 'Box JWT access token is required to upload CV to Box.' };
    }

    const folderId = boxFolderId || DEFAULT_BOX_FOLDER_ID;

    try {
      // Check if CV file already exists on Box
      const existing = await this.findBoxFileByName(fileName, token, folderId);
      if (existing?.id) {
        const updateFormData = new FormData();
        updateFormData.append('file', fileOrBlob, fileName);

        const updateRes = await this.fetchBox(
          `/files/${existing.id}/content`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: updateFormData,
          },
          true
        );

        if (updateRes.ok) {
          const publicLink = await this.makeBoxFilePublic(existing.id, token);
          return {
            success: true,
            status: updateRes.status,
            fileId: existing.id,
            downloadUrl: publicLink.downloadUrl || publicLink.sharedUrl || `/cv/${fileName}`,
            message: `CV file (${fileName}) updated successfully on Box Storage!`,
          };
        }
      }

      // Create new CV file on Box
      const formData = new FormData();
      const attributes = JSON.stringify({
        name: fileName,
        parent: { id: folderId },
      });
      formData.append('attributes', attributes);
      formData.append('file', fileOrBlob, fileName);

      const uploadRes = await this.fetchBox(
        '/files/content',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
        true
      );

      if (uploadRes.ok) {
        const result = await uploadRes.json();
        const newFileId = result.entries?.[0]?.id;
        let downloadUrl = `/cv/${fileName}`;
        if (newFileId) {
          const publicLink = await this.makeBoxFilePublic(newFileId, token);
          if (publicLink.downloadUrl || publicLink.sharedUrl) {
            downloadUrl = publicLink.downloadUrl || publicLink.sharedUrl || downloadUrl;
          }
        }
        return {
          success: true,
          status: uploadRes.status,
          fileId: newFileId,
          downloadUrl,
          message: `CV (${fileName}) uploaded to Box Storage bucket successfully!`,
        };
      }

      // Handle 409 Conflict
      if (uploadRes.status === 409) {
        const conflictData = await uploadRes.json().catch(() => null);
        const conflictId = conflictData?.context_info?.conflicts?.id;
        if (conflictId) {
          const retryFormData = new FormData();
          retryFormData.append('file', fileOrBlob, fileName);

          const retryRes = await this.fetchBox(
            `/files/${conflictId}/content`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: retryFormData,
            },
            true
          );

          if (retryRes.ok) {
            const publicLink = await this.makeBoxFilePublic(conflictId, token);
            return {
              success: true,
              status: retryRes.status,
              fileId: conflictId,
              downloadUrl: publicLink.downloadUrl || publicLink.sharedUrl || `/cv/${fileName}`,
              message: `Existing CV (${fileName}) on Box updated with latest version!`,
            };
          }
        }
      }

      return {
        success: false,
        status: uploadRes.status,
        message: `Box CV upload returned HTTP ${uploadRes.status}`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Box CV upload error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Initialize Box Bucket: upload default portfolio data and default CV file to Box Storage
   */
  static async initializeBoxBucketWithDefaults(
    boxToken?: string,
    boxFolderId: string = '0'
  ): Promise<{ success: boolean; message: string; data: PortfolioData }> {
    const token = await this.getBoxToken(boxToken);
    if (!token) {
      return {
        success: false,
        message: 'Box JWT access token is required to initialize the bucket.',
        data: this.getPortfolioData(),
      };
    }

    const currentData = this.getPortfolioData();

    try {
      // 1. Upload default CV to Box Storage
      let cvBlob: Blob | null = null;
      try {
        const cvResponse = await fetch('/cv/CV.pdf');
        if (cvResponse.ok) {
          cvBlob = await cvResponse.blob();
        }
      } catch {
        // ignore
      }

      let cvUrl = currentData.profile.resumeUrl || DEFAULT_BOX_CV_DOWNLOAD_URL;
      let cvFileId = currentData.profile.boxCvFileId || DEFAULT_BOX_CV_FILE_ID;

      if (cvBlob) {
        const cvResult = await this.uploadCvToBox(cvBlob, token, boxFolderId, 'Resume.pdf');
        if (cvResult.success) {
          if (cvResult.fileId) {
            cvFileId = cvResult.fileId;
          }
          if (cvResult.downloadUrl) {
            cvUrl = cvResult.downloadUrl;
          }
        }
      }

      const updatedData: PortfolioData = {
        ...currentData,
        profile: {
          ...currentData.profile,
          resumeUrl: cvUrl,
          boxCvFileId: cvFileId,
          boxFolderId: boxFolderId || DEFAULT_BOX_FOLDER_ID,
          boxStorageApiKey: token,
        },
      };

      // 2. Upload default portfolioData.json to Box Storage
      const pushResult = await this.pushPortfolioDataToBox(
        updatedData,
        token,
        boxFolderId,
        updatedData.profile.boxFileId || DEFAULT_BOX_FILE_ID
      );

      if (pushResult.success) {
        if (pushResult.fileId) {
          updatedData.profile.boxFileId = pushResult.fileId;
        }
        if (pushResult.downloadUrl) {
          updatedData.profile.storageBucketDataUrl = pushResult.downloadUrl;
        }
        this.savePortfolioData(updatedData);
        return {
          success: true,
          message: 'Default portfolio dataset & CV initialized on Box Cloud Storage bucket!',
          data: updatedData,
        };
      } else {
        return {
          success: false,
          message: `Portfolio data push failed: ${pushResult.message}`,
          data: updatedData,
        };
      }
    } catch (err: unknown) {
      return {
        success: false,
        message: `Initialization error: ${err instanceof Error ? err.message : String(err)}`,
        data: currentData,
      };
    }
  }

  /**
   * Fetch portfolio data from storage bucket / remote JSON endpoint
   * Tries Box public URL, Box API directly, custom URL, remote Firebase bucket, or local JSON.
   */
  static async fetchRemotePortfolioData(customUrl?: string): Promise<PortfolioData | null> {
    const localData = this.getPortfolioData();

    // 0. Priority 0: /api/portfolio-data endpoint (reads from live Box file via serverless / dev server)
    try {
      const apiRes = await fetch(`/api/portfolio-data?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (apiRes.ok) {
        const fetchedData = await apiRes.json();
        if (fetchedData && fetchedData.profile && Array.isArray(fetchedData.projects)) {
          this.savePortfolioData(fetchedData);
          return fetchedData as PortfolioData;
        }
      }
    } catch (apiErr) {
      console.warn('Could not load from /api/portfolio-data endpoint:', apiErr);
    }

    // 1. First priority: Direct public static Box URL (Fast, CDN-cached, open access)
    const directBoxUrls: string[] = [
      customUrl?.trim() || '',
      localData?.profile?.storageBucketDataUrl?.trim() || '',
      DEFAULT_STORAGE_BUCKET_URL,
    ].filter((u) => u && u.includes('app.box.com/shared/static'));

    for (const url of directBoxUrls) {
      try {
        const cacheBuster = url.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
        const response = await fetch(`${url}${cacheBuster}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const fetchedData = await response.json();
          if (fetchedData && fetchedData.profile && Array.isArray(fetchedData.projects)) {
            this.savePortfolioData(fetchedData);
            return fetchedData as PortfolioData;
          }
        }
      } catch (err) {
        console.warn(`Could not load direct Box static URL ${url}:`, err);
      }
    }

    // 2. Second priority: Box API directly with JWT token
    try {
      const boxToken = await this.getBoxToken(undefined, localData);
      const boxFolderId = localData?.profile?.boxFolderId || '0';
      let targetFileId = localData?.profile?.boxFileId;

      if (boxToken) {
        if (!targetFileId || targetFileId.trim() === '') {
          const found = await this.findBoxFileByName('portfolioData.json', boxToken, boxFolderId);
          if (found?.id) {
            targetFileId = found.id;
          }
        }

        if (targetFileId) {
          const boxRes = await this.fetchBox(`/files/${targetFileId}/content`, {
            headers: { Authorization: `Bearer ${boxToken}` },
          });

          if (boxRes.ok) {
            const boxData = await boxRes.json();
            if (boxData && boxData.profile && Array.isArray(boxData.projects)) {
              boxData.profile.boxFileId = targetFileId;
              this.savePortfolioData(boxData);
              return boxData as PortfolioData;
            }
          }
        }
      }
    } catch (boxErr) {
      console.warn('Box API fetch encounter:', boxErr);
    }

    // 3. Third priority: Custom/Firebase/Cloud fallback URLs
    const urlsToTry: string[] = [];
    if (customUrl && customUrl.trim() !== '' && !directBoxUrls.includes(customUrl.trim())) {
      urlsToTry.push(customUrl.trim());
    }

    if (
      localData?.profile?.storageBucketDataUrl &&
      !urlsToTry.includes(localData.profile.storageBucketDataUrl) &&
      !directBoxUrls.includes(localData.profile.storageBucketDataUrl)
    ) {
      urlsToTry.push(localData.profile.storageBucketDataUrl.trim());
    }

    for (const url of urlsToTry) {
      if (!url || url.trim() === '') continue;

      try {
        const cacheBuster = url.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
        const response = await fetch(`${url}${cacheBuster}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const fetchedData = await response.json();
          if (fetchedData && fetchedData.profile && Array.isArray(fetchedData.projects)) {
            this.savePortfolioData(fetchedData);
            return fetchedData as PortfolioData;
          }
        }
      } catch (err) {
        console.warn(`Could not load portfolio data from ${url}:`, err);
      }
    }

    // 4. Fallback to static local JSON ONLY if localStorage is empty
    const hasLocalEdits = this.hasLocalSavedData();
    if (!hasLocalEdits) {
      try {
        const response = await fetch(`${LOCAL_JSON_FALLBACK_URL}?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const fetchedData = await response.json();
          if (fetchedData && fetchedData.profile && Array.isArray(fetchedData.projects)) {
            this.savePortfolioData(fetchedData);
            return fetchedData as PortfolioData;
          }
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

  /**
   * Direct push of portfolio JSON to generic bucket (Firebase, Custom API, etc.)
   */
  static async pushPortfolioDataToBucket(
    data: PortfolioData,
    options?: { uploadUrl?: string; apiKey?: string; method?: 'POST' | 'PUT' }
  ): Promise<BucketPushResult> {
    const rawUploadUrl =
      options?.uploadUrl?.trim() ||
      data.profile.storageBucketUploadUrl?.trim() ||
      DEFAULT_STORAGE_BUCKET_UPLOAD_URL;

    const apiKey = options?.apiKey?.trim() || data.profile.storageBucketApiKey?.trim();
    const method = options?.method || (rawUploadUrl.includes('firebasestorage.googleapis.com') ? 'POST' : 'PUT');

    let targetUrl = rawUploadUrl;
    if (apiKey && !targetUrl.includes('key=') && targetUrl.includes('googleapis.com')) {
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + `key=${encodeURIComponent(apiKey)}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey && !targetUrl.includes('googleapis.com')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    try {
      const response = await fetch(targetUrl, {
        method,
        headers,
        body: JSON.stringify(data, null, 2),
      });

      if (response.ok) {
        this.savePortfolioData(data);
        return {
          success: true,
          status: response.status,
          message: 'Data successfully pushed and published to Storage Bucket!',
        };
      }

      if (response.status === 402) {
        return {
          success: false,
          status: 402,
          message:
            'Firebase Storage quota/plan limit reached (HTTP 402 Payment Required). Changes were saved locally. Box Cloud Storage is recommended.',
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          status: response.status,
          message: `Storage Bucket access denied (HTTP ${response.status}). Check bucket security rules or API Token.`,
        };
      }

      const errText = await response.text().catch(() => '');
      return {
        success: false,
        status: response.status,
        message: `Bucket returned HTTP ${response.status}: ${errText.slice(0, 150) || response.statusText}`,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Network or CORS error connecting to bucket: ${errorMsg}`,
      };
    }
  }

  /**
   * Test generic bucket connectivity
   */
  static async testBucketConnection(url: string): Promise<{ success: boolean; status: number; message: string }> {
    if (!url || url.trim() === '') {
      return { success: false, status: 0, message: 'URL is empty' };
    }
    const testUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
    try {
      const res = await fetch(testUrl, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        return { success: true, status: res.status, message: `Connected (HTTP ${res.status} OK)` };
      }
      return { success: false, status: res.status, message: `HTTP ${res.status} ${res.statusText}` };
    } catch (e: unknown) {
      return { success: false, status: 0, message: e instanceof Error ? e.message : 'Connection failed' };
    }
  }

  /**
   * Admin Authentication Check
   */
  static verifyAdmin(user: string, pass: string): boolean {
    const trimmedUser = user.trim().toLowerCase();
    const trimmedPass = pass.trim();
    if (
      (trimmedUser === 'admin' && trimmedPass === 'password123') ||
      (trimmedUser === 'admin' && trimmedPass === 'admin123') ||
      (trimmedUser === 'abdelrahman' && trimmedPass === 'admin2025')
    ) {
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
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch && shortMatch[1]) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`;
      }
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch && watchMatch[1]) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`;
      }
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
    } catch {
      // ignore
    }
    return url;
  }

  /**
   * Upload image file to Box Storage (or fallback to base64 Data URL)
   */
  static async uploadImageFile(file: File, boxToken?: string, boxFolderId: string = '0'): Promise<string> {
    const token = await this.getBoxToken(boxToken);
    if (token) {
      try {
        const formData = new FormData();
        const attributes = JSON.stringify({
          name: `${Date.now()}_${file.name}`,
          parent: { id: boxFolderId || '0' },
        });
        formData.append('attributes', attributes);
        formData.append('file', file);

        const response = await this.fetchBox(
          '/files/content',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
          true
        );

        if (response.ok) {
          const result = await response.json();
          if (result.entries && result.entries.length > 0) {
            const fileId = result.entries[0].id;
            const publicLink = await this.makeBoxFilePublic(fileId, token);
            if (publicLink.downloadUrl) {
              return publicLink.downloadUrl;
            }
            return `https://app.box.com/embed/s/${fileId}`;
          }
        }
      } catch (err) {
        console.warn('Box upload failed, falling back to Data URL', err);
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
   * Upload Document / CV file to Box Storage (or fallback to base64 Data URL)
   */
  static async uploadDocumentFile(file: File, boxToken?: string, boxFolderId: string = '0'): Promise<string> {
    const token = await this.getBoxToken(boxToken);
    if (token) {
      try {
        const cvResult = await this.uploadCvToBox(file, token, boxFolderId, file.name);
        if (cvResult.success && cvResult.downloadUrl) {
          return cvResult.downloadUrl;
        }
      } catch (err) {
        console.warn('Box CV upload error, falling back to Data URL', err);
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
   * Export all portfolio data as a JSON file backup
   */
  static exportToJson(data: PortfolioData): void {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `abdelrahman_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
