// M11: Web Application - LocalStorage Platform Implementation
// Uses browser localStorage for package persistence (MVP, no cloud sync)

import type { IPlatformService, PackageInfo } from './platform';
import type { Package } from '../models/package';
import * as yaml from 'js-yaml';
import { normalizePackageReferences } from './packageNormalizer';

const STORAGE_KEY = 'rpg-packages';
const STORAGE_VERSION = '1.0.0';

interface StorageData {
  version: string;
  packages: Record<string, Package>;
}

/**
 * Web platform implementation using localStorage
 */
export class LocalStoragePlatformService implements IPlatformService {
  private getStorage(): StorageData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        version: STORAGE_VERSION,
        packages: {},
      };
    }

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse storage:', error);
      return {
        version: STORAGE_VERSION,
        packages: {},
      };
    }
  }

  private setStorage(data: StorageData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async loadPackage(id: string): Promise<Package> {
    const storage = this.getStorage();
    const pkg = storage.packages[id];

    if (!pkg) {
      throw new Error(`Package not found: ${id}`);
    }

    // Normalize references (convert relative to absolute)
    // This is critical for packages loaded as dependencies
    normalizePackageReferences(pkg);

    return pkg;
  }

  async savePackage(pkg: Package): Promise<void> {
    const storage = this.getStorage();
    storage.packages[pkg.id] = pkg;
    this.setStorage(storage);
  }

  async listPackages(): Promise<PackageInfo[]> {
    const storage = this.getStorage();
    return Object.values(storage.packages).map(pkg => ({
      id: pkg.id,
      name: pkg.metadata.name,
      version: pkg.version,
      description: pkg.metadata.description,
      source: (pkg as any).source || 'created', // Default to 'created' if not set
    }));
  }

  async deletePackage(id: string): Promise<void> {
    const storage = this.getStorage();
    delete storage.packages[id];
    this.setStorage(storage);
  }

  async importPackage(content: string, format: 'yaml' | 'json'): Promise<Package> {
    try {
      let pkg: Package;

      if (format === 'yaml') {
        pkg = yaml.load(content) as Package;
      } else {
        pkg = JSON.parse(content);
      }

      // Validate basic structure
      if (!pkg.id || !pkg.version || !pkg.metadata) {
        throw new Error('Invalid package structure');
      }

      // Normalize references (convert relative to absolute)
      normalizePackageReferences(pkg);

      return pkg;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to import package: ${error.message}`);
      }
      throw new Error('Failed to import package: Unknown error');
    }
  }

  async exportPackage(pkg: Package, format: 'yaml' | 'json'): Promise<string> {
    try {
      if (format === 'yaml') {
        return yaml.dump(pkg, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        });
      } else {
        return JSON.stringify(pkg, null, 2);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export package: ${error.message}`);
      }
      throw new Error('Failed to export package: Unknown error');
    }
  }
}

/**
 * Singleton instance
 */
export const platformService = new LocalStoragePlatformService();
