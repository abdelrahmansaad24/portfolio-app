/**
 * Box JWT Token Service
 * Manages Server Authentication (JWT) access tokens for Box Storage.
 */

let memoryToken: string | null = null;
let memoryExpiresAt: number = 0;
const SESSION_TOKEN_KEY = 'box_jwt_access_token';
const SESSION_EXPIRES_KEY = 'box_jwt_token_expires_at';

export class BoxJwtService {
  /**
   * Get a valid Box access token using Server Authentication (JWT)
   * Automatically auto-refreshes before expiry.
   */
  static async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // 1. Check memory cache (valid if > 60s remaining)
    if (!forceRefresh && memoryToken && memoryExpiresAt > now + 60) {
      return memoryToken;
    }

    // 2. Check sessionStorage cache
    if (!forceRefresh) {
      try {
        const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
        const storedExpires = parseInt(sessionStorage.getItem(SESSION_EXPIRES_KEY) || '0', 10);
        if (storedToken && storedExpires > now + 60) {
          memoryToken = storedToken;
          memoryExpiresAt = storedExpires;
          return storedToken;
        }
      } catch {
        // ignore sessionStorage errors
      }
    }

    // 3. Fetch fresh token from /api/box-token
    try {
      const response = await fetch('/api/box-token', {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.access_token) {
          memoryToken = data.access_token;
          const lifetime = typeof data.expires_in === 'number' ? data.expires_in : 3600;
          memoryExpiresAt = now + lifetime;

          try {
            sessionStorage.setItem(SESSION_TOKEN_KEY, data.access_token);
            sessionStorage.setItem(SESSION_EXPIRES_KEY, memoryExpiresAt.toString());
          } catch {
            // ignore
          }

          return data.access_token;
        }
      }
    } catch (err) {
      console.warn('Could not fetch token from /api/box-token endpoint:', err);
    }

    // 4. Fallback to developer token in env or localStorage
    const envToken =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOX_DEVELOPER_TOKEN) ||
      'LR7KUd1r9GY3xTO8oSHNG3aEO8Xy5jVJ';

    return envToken;
  }

  /**
   * Clear cached token if it expired or returned 401
   */
  static invalidateToken(): void {
    memoryToken = null;
    memoryExpiresAt = 0;
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_EXPIRES_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Test connection using Box JWT
   */
  static async testConnection(): Promise<{ success: boolean; message: string; user?: unknown }> {
    try {
      const token = await this.getAccessToken(true);
      if (!token) {
        return { success: false, message: 'Could not obtain Box JWT access token.' };
      }

      const res = await fetch('/box-api/2.0/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        return {
          success: true,
          message: `Connected to Box Enterprise Storage! Service Account: ${user.name || user.login}`,
          user,
        };
      }

      return {
        success: false,
        message: `Box API returned HTTP ${res.status}: ${res.statusText}`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Connection error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
