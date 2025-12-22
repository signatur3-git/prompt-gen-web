// M11: Dependency Resolver Service
// Automatically resolves and fetches package dependencies from multiple sources

import type { Package } from '../models/package';
import type { IPlatformService } from './platform';

export interface DependencySource {
  name: string;
  priority: number; // Lower = higher priority
  checkAvailable(packageId: string, version?: string): Promise<boolean>;
  fetchPackage(packageId: string, version?: string): Promise<Package>;
}

export interface ResolutionResult {
  package: Package;
  source: string;
  isNew: boolean; // false if already in storage
}

export interface ResolutionPlan {
  toInstall: Array<{
    packageId: string;
    version: string;
    source: string;
  }>;
  alreadyInstalled: string[];
  missing: Array<{
    packageId: string;
    version: string;
    requiredBy: string;
  }>;
}

/**
 * Dependency Resolver
 *
 * Resolves package dependencies from multiple sources:
 * 1. Local storage (already imported)
 * 2. Same directory as selected file
 * 3. Marketplace (future)
 * 4. User-provided URLs (future)
 */
export class DependencyResolver {
  private sources: DependencySource[] = [];
  private platformService: IPlatformService;

  constructor(platformService: IPlatformService) {
    this.platformService = platformService;
  }

  /**
   * Register a dependency source
   */
  registerSource(source: DependencySource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Analyze dependencies and create resolution plan
   */
  async analyzeDependencies(
    rootPackage: Package,
    // availableFiles reserved for future file-system scanning
    _availableFiles?: File[]
  ): Promise<ResolutionPlan> {
    const toInstall: ResolutionPlan['toInstall'] = [];
    const alreadyInstalled: string[] = [];
    const missing: ResolutionPlan['missing'] = [];
    const visited = new Set<string>();

    // Get already installed packages
    const installed = await this.platformService.listPackages();
    const installedMap = new Map(installed.map(p => [p.id, p.version]));

    // Recursive dependency resolution
    const resolveDeps = async (pkg: Package, requiredBy: string) => {
      if (!pkg.dependencies) return;

      for (const dep of pkg.dependencies) {
                const pkgId = dep.package;
        if (!pkgId) continue; // Skip if no package ID

        const depKey = `${pkgId}@${dep.version}`;
        if (visited.has(depKey)) continue;
        visited.add(depKey);

        // Check if already installed
        if (installedMap.has(pkgId)) {
          alreadyInstalled.push(pkgId);

          // Load and check transitive dependencies
          try {
            const installedPkg = await this.platformService.loadPackage(pkgId);
            await resolveDeps(installedPkg, pkgId);
          } catch (e) {
            // Package in list but can't load - treat as missing
            missing.push({
              packageId: pkgId,
              version: dep.version,
              requiredBy,
            });
          }
          continue;
        }

        // Try to find in sources
        let found = false;
        for (const source of this.sources) {
          try {
            const available = await source.checkAvailable(pkgId, dep.version);
            if (available) {
              toInstall.push({
                packageId: pkgId,
                version: dep.version,
                source: source.name,
              });

              // Fetch and check transitive dependencies
              const depPkg = await source.fetchPackage(pkgId, dep.version);
              await resolveDeps(depPkg, pkgId);

              found = true;
              break;
            }
          } catch (e) {
            // Source failed, try next
          }
        }

        if (!found) {
          missing.push({
            packageId: pkgId,
            version: dep.version,
            requiredBy,
          });
        }
      }
    };

    await resolveDeps(rootPackage, rootPackage.id);

    return { toInstall, alreadyInstalled, missing };
  }

  /**
   * Resolve and install all dependencies
   */
  async resolveDependencies(
    rootPackage: Package,
    _availableFiles?: File[]
  ): Promise<{
    installed: ResolutionResult[];
    alreadyPresent: string[];
    missing: ResolutionPlan['missing'];
  }> {
    const plan = await this.analyzeDependencies(rootPackage, _availableFiles);
    const installed: ResolutionResult[] = [];

    // Install missing dependencies
    for (const dep of plan.toInstall) {
      const source = this.sources.find(s => s.name === dep.source);
      if (!source) continue;

      try {
        const pkg = await source.fetchPackage(dep.packageId, dep.version);
        await this.platformService.savePackage(pkg);

        installed.push({
          package: pkg,
          source: dep.source,
          isNew: true,
        });
      } catch (e) {
        console.error(`Failed to install ${dep.packageId} from ${dep.source}:`, e);
        plan.missing.push({
          packageId: dep.packageId,
          version: dep.version,
          requiredBy: rootPackage.id,
        });
      }
    }

    return {
      installed,
      alreadyPresent: plan.alreadyInstalled,
      missing: plan.missing,
    };
  }
}

/**
 * File System Source
 * Attempts to resolve dependencies from files in the same directory
 */
export class FileSystemSource implements DependencySource {
  name = 'filesystem';
  priority = 1; // High priority - check local files first

  private packageMap = new Map<string, { file: File; parsed: Package }>();

  constructor() {}

  /**
   * Register a parsed package with its file
   */
  registerPackage(packageId: string, file: File, parsedPackage: Package): void {
    this.packageMap.set(packageId, { file, parsed: parsedPackage });
    console.log('FileSystemSource: Registered package', packageId, 'from file', file.name);
  }

  async checkAvailable(packageId: string): Promise<boolean> {
    const available = this.packageMap.has(packageId);
    console.log('FileSystemSource: Check available', packageId, '=', available);
    return available;
  }

  async fetchPackage(packageId: string): Promise<Package> {
    const entry = this.packageMap.get(packageId);
    if (!entry) {
      throw new Error(`Package ${packageId} not found in available files`);
    }

    console.log('FileSystemSource: Fetching package', packageId, 'from file', entry.file.name);
    return entry.parsed; // Return already-parsed package
  }
}

/**
 * Marketplace Source (Future)
 */
export class MarketplaceSource implements DependencySource {
  name = 'marketplace';
  priority = 10; // Lower priority - try local first

  constructor(_baseUrl: string) {
    // reserved for future marketplace implementation
  }

  async checkAvailable(_packageId: string, _version?: string): Promise<boolean> {
    // TODO: Check marketplace API
    return false;
  }

  async fetchPackage(_packageId: string, _version?: string): Promise<Package> {
    // TODO: Fetch from marketplace
    throw new Error('Marketplace not implemented yet');
  }
}
