// Marketplace API Client
// Handles all API requests to the marketplace with authentication

import { oauthService } from './oauth.service';
import { marketplaceConfig } from '../config/marketplace.config';

export interface PublicPersonaInfo {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
}

export interface Package {
  id: string;
  namespace: string;
  name: string;
  display_name?: string; // NEW: Human-readable display name from API
  version: string;
  description?: string;
  author?: string; // Kept for backward compatibility, use author_persona.name
  author_persona_id?: string;
  author_persona?: PublicPersonaInfo; // NEW: Enriched author info from API
  version_count?: number; // NEW: Total number of versions
  latest_version?: string; // NEW: Latest version string
  created_at: string;
  updated_at: string;
  // Content counts for package cards display (M12 spec) - from marketplace API
  content_counts?: {
    rulebooks: number;
    rules: number;
    prompt_sections: number;
    datatypes: number;
  };
}

export interface PackageVersion {
  version: string;
  created_at: string;
  download_count: number;
}

export interface PackageDetails extends Package {
  versions: PackageVersion[];
  dependencies?: Record<string, string>;
  tags?: string[];
}

export interface SearchResult {
  packages: Package[];
  total: number;
  page: number;
  per_page: number;
}

export class MarketplaceClient {
  private baseUrl = marketplaceConfig.baseUrl;

  /**
   * Make authenticated API request
   */
  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = oauthService.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const url = `${this.baseUrl}${path}`;
    console.log(`[Marketplace] ${options.method || 'GET'} ${url}`);
    console.log(`[Marketplace] Has auth token:`, !!token);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[Marketplace] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Marketplace] Response content-type:`, response.headers.get('content-type'));

    // Success responses (200-299)
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Marketplace] API error ${response.status}:`, errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      console.warn('[Marketplace] Received 204 No Content - returning empty result');
      console.warn(
        '[Marketplace] This might indicate: authentication required, no data, or API issue'
      );
      return { packages: [], total: 0 } as T;
    }

    // Handle empty responses or non-JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('[Marketplace] Non-JSON response, content-type:', contentType);
      return { packages: [], total: 0 } as T;
    }

    return response.json();
  }

  /**
   * Search/browse packages
   */
  async searchPackages(query?: string, page = 1, perPage = 20): Promise<SearchResult> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(query && { search: query }),
    });
    return this.fetch<SearchResult>(`/api/v1/packages?${params}`);
  }

  /**
   * Get package details
   */
  async getPackage(namespace: string, name: string): Promise<PackageDetails> {
    return this.fetch<PackageDetails>(`/api/v1/packages/${namespace}/${name}`);
  }

  /**
   * Get specific package version details
   */
  async getPackageVersion(
    namespace: string,
    name: string,
    version: string
  ): Promise<PackageDetails> {
    return this.fetch<PackageDetails>(`/api/v1/packages/${namespace}/${name}/${version}`);
  }

  /**
   * Download package YAML content
   */
  async downloadPackage(namespace: string, name: string, version: string): Promise<string> {
    const token = oauthService.getToken();
    const url = `${this.baseUrl}/api/v1/packages/${namespace}/${name}/${version}/download`;

    console.log(`[Marketplace] Downloading package: ${namespace}/${name}@${version}`);
    console.log(`[Marketplace] Download URL: ${url}`);
    console.log(`[Marketplace] Token present: ${!!token}`);

    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails: string;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorBody = await response.json();
            errorDetails = errorBody.message || errorBody.error || JSON.stringify(errorBody);
          } else {
            errorDetails = await response.text();
          }
        } catch (e) {
          errorDetails = 'Unable to read error details';
        }

        console.error(`[Marketplace] Download failed:`, {
          status: response.status,
          statusText: response.statusText,
          url,
          errorDetails,
        });

        throw new Error(
          `Download failed: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`
        );
      }

      const content = await response.text();
      console.log(`[Marketplace] Downloaded ${content.length} bytes`);
      return content;
    } catch (error) {
      // Re-throw with additional context if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Network error downloading package. Please check:\n` +
            `1. Internet connection\n` +
            `2. Marketplace server is running (${this.baseUrl})\n` +
            `3. CORS configuration\n\n` +
            `Original error: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Publish package (requires authentication)
   */
  async publishPackage(formData: FormData): Promise<Package> {
    const token = oauthService.getToken();
    if (!token) {
      throw new Error('Authentication required to publish packages');
    }

    console.log('[Marketplace] Publishing package...');

    const response = await fetch(`${this.baseUrl}/api/v1/packages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Marketplace] Publish failed:', errorText);
      throw new Error(`Publish failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[Marketplace] Package published successfully');
    return result;
  }

  /**
   * Get current user's packages (requires authentication)
   */
  async getMyPackages(): Promise<Package[]> {
    const token = oauthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return this.fetch<Package[]>('/api/v1/packages/me');
  }

  /**
   * Get current user's personas (requires authentication)
   */
  async getMyPersonas(): Promise<any[]> {
    const token = oauthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return this.fetch<any[]>('/api/v1/personas');
  }

  /**
   * Get current user's namespaces (requires authentication)
   */
  async getMyNamespaces(): Promise<any[]> {
    const token = oauthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return this.fetch<any[]>('/api/v1/namespaces');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.fetch<{ status: string }>('/health');
  }
}

// Export singleton instance
export const marketplaceClient = new MarketplaceClient();
