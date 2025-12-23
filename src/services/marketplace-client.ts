// Marketplace API Client
// Handles all API requests to the marketplace with authentication

import { oauthService } from './oauth.service';
import { marketplaceConfig } from '../config/marketplace.config';

export interface Package {
  id: string;
  namespace: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  created_at: string;
  updated_at: string;
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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Marketplace] API error ${response.status}:`, errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
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

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    console.log(`[Marketplace] Downloaded ${content.length} bytes`);
    return content;
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
