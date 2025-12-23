// OAuth Service for Browser-Based PKCE Flow
// Pure frontend implementation - no backend required

import { marketplaceConfig } from '../config/marketplace.config';

export interface OAuthCallbackResult {
  success: boolean;
  error?: string;
  errorDescription?: string;
}

export class OAuthService {
  private readonly STORAGE_KEYS = {
    TOKEN: 'marketplace_token',
    VERIFIER: 'oauth_verifier',
    STATE: 'oauth_state',
    TOKEN_EXPIRY: 'marketplace_token_expiry',
  } as const;

  /**
   * Generate PKCE challenge using Web Crypto API (browser-compatible)
   */
  async generatePKCEChallenge(): Promise<{ verifier: string; challenge: string }> {
    // Generate random verifier (43-128 characters)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = this.base64UrlEncode(array);

    // Generate SHA-256 challenge from verifier
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const challenge = this.base64UrlEncode(new Uint8Array(hash));

    return { verifier, challenge };
  }

  /**
   * Generate random state for CSRF protection
   */
  generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  /**
   * Base64 URL encode (RFC 4648 Section 5)
   */
  private base64UrlEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Start OAuth authorization flow - redirects browser to marketplace
   */
  async startAuthFlow(): Promise<void> {
    try {
      // Generate PKCE challenge
      const { verifier, challenge } = await this.generatePKCEChallenge();
      const state = this.generateState();

      // Store verifier and state in sessionStorage (survives redirect)
      sessionStorage.setItem(this.STORAGE_KEYS.VERIFIER, verifier);
      sessionStorage.setItem(this.STORAGE_KEYS.STATE, state);

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: marketplaceConfig.clientId,
        redirect_uri: marketplaceConfig.redirectUri,
        response_type: 'code',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        scope: marketplaceConfig.scope,
        state,
      });

      const authUrl = `${marketplaceConfig.authorizationEndpoint}?${params}`;

      console.log('[OAuth] Starting auth flow:', {
        authUrl,
        redirectUri: marketplaceConfig.redirectUri,
        clientId: marketplaceConfig.clientId,
        baseUrl: marketplaceConfig.baseUrl,
      });

      // Redirect to marketplace authorization page
      window.location.href = authUrl;
    } catch (error) {
      console.error('[OAuth] Failed to start auth flow:', error);
      throw new Error('Failed to initialize authentication');
    }
  }

  /**
   * Handle OAuth callback - call this on redirect back from marketplace
   */
  async handleCallback(): Promise<OAuthCallbackResult> {
    try {
      // Extract parameters from URL (supports both query and hash)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));

      // Check query params first, then hash params
      const code = urlParams.get('code') || hashParams.get('code');
      const state = urlParams.get('state') || hashParams.get('state');
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription =
        urlParams.get('error_description') || hashParams.get('error_description');

      // Handle authorization errors
      if (error) {
        console.error('[OAuth] Authorization error:', error, errorDescription);
        return {
          success: false,
          error,
          errorDescription: errorDescription || undefined,
        };
      }

      // Validate required parameters
      if (!code || !state) {
        console.error('[OAuth] Missing code or state in callback');
        return {
          success: false,
          error: 'invalid_request',
          errorDescription: 'Missing authorization code or state parameter',
        };
      }

      // Verify state (CSRF protection)
      const storedState = sessionStorage.getItem(this.STORAGE_KEYS.STATE);
      if (state !== storedState) {
        console.error('[OAuth] State mismatch - possible CSRF attack');
        return {
          success: false,
          error: 'invalid_state',
          errorDescription: 'State parameter mismatch',
        };
      }

      // Get stored verifier
      const verifier = sessionStorage.getItem(this.STORAGE_KEYS.VERIFIER);
      if (!verifier) {
        console.error('[OAuth] Missing PKCE verifier');
        return {
          success: false,
          error: 'invalid_request',
          errorDescription: 'Missing PKCE verifier',
        };
      }

      console.log('[OAuth] Exchanging authorization code for token...');

      // Exchange code for token
      const response = await fetch(marketplaceConfig.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: marketplaceConfig.redirectUri,
          client_id: marketplaceConfig.clientId,
          code_verifier: verifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OAuth] Token exchange failed:', response.status, errorData);
        return {
          success: false,
          error: errorData.error || 'token_exchange_failed',
          errorDescription: errorData.error_description || 'Failed to exchange authorization code',
        };
      }

      const data = await response.json();
      const accessToken = data.access_token;
      const expiresIn = data.expires_in || 3600; // Default 1 hour

      if (!accessToken) {
        console.error('[OAuth] No access token in response');
        return {
          success: false,
          error: 'invalid_response',
          errorDescription: 'No access token in response',
        };
      }

      // Store token in localStorage
      localStorage.setItem(this.STORAGE_KEYS.TOKEN, accessToken);

      // Store expiry time (current time + expires_in seconds)
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());

      // Clean up session storage
      sessionStorage.removeItem(this.STORAGE_KEYS.VERIFIER);
      sessionStorage.removeItem(this.STORAGE_KEYS.STATE);

      console.log('[OAuth] Successfully authenticated! Token expires in', expiresIn, 'seconds');

      return { success: true };
    } catch (error) {
      console.error('[OAuth] Callback handling error:', error);
      return {
        success: false,
        error: 'network_error',
        errorDescription: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    if (!token) return false;

    // Check if token is expired
    const expiryTime = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
    if (expiryTime) {
      const expiry = parseInt(expiryTime, 10);
      if (Date.now() >= expiry) {
        // Token expired, clear it
        this.clearTokens();
        return false;
      }
    }

    return true;
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    if (!this.isAuthenticated()) return null;
    return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
  }

  /**
   * Logout - revoke token and clear storage
   */
  async logout(): Promise<void> {
    const token = this.getToken();

    // Try to revoke token on server
    if (token) {
      try {
        console.log('[OAuth] Revoking token...');
        await fetch(marketplaceConfig.revokeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('[OAuth] Token revoked successfully');
      } catch (err) {
        console.error('[OAuth] Token revocation failed:', err);
        // Continue anyway - clear local storage
      }
    }

    // Clear local storage
    this.clearTokens();
    sessionStorage.removeItem(this.STORAGE_KEYS.VERIFIER);
    sessionStorage.removeItem(this.STORAGE_KEYS.STATE);

    console.log('[OAuth] Logged out');
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
