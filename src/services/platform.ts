// M11: Web Application - Platform Service Interface
// Abstract platform-specific operations for web vs desktop

import type { Package } from '../models/package';

/**
 * Platform service interface - abstracts storage operations
 *
 * Desktop implementation: Uses Tauri commands (file system)
 * Web implementation: Uses localStorage or HTTP API
 */
export interface IPlatformService {
  /**
   * Load a package by ID
   */
  loadPackage(id: string): Promise<Package>;

  /**
   * Save a package
   */
  savePackage(pkg: Package): Promise<void>;

  /**
   * List all available packages
   */
  listPackages(): Promise<PackageInfo[]>;

  /**
   * Delete a package
   */
  deletePackage(id: string): Promise<void>;

  /**
   * Import package from YAML/JSON string
   */
  importPackage(content: string, format: 'yaml' | 'json'): Promise<Package>;

  /**
   * Export package to YAML/JSON string
   */
  exportPackage(pkg: Package, format: 'yaml' | 'json'): Promise<string>;
}

export interface PackageInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  source?: 'created' | 'imported' | 'marketplace';
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  level: 'error';
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  level: 'warning';
  message: string;
  location?: string;
  suggestion?: string;
}

/**
 * Validation service interface
 */
export interface IValidationService {
  /**
   * Validate a package
   */
  validatePackage(pkg: Package): Promise<ValidationResult>;

  /**
   * Validate a specific component
   */
  validateComponent(
    pkg: Package,
    namespace: string,
    componentType: string,
    componentName: string
  ): Promise<ValidationResult>;
}

/**
 * Rendering result
 */
export interface RenderResult {
  text: string;
  seed: number;
  metadata?: Record<string, unknown>;
}

/**
 * Rendering service interface
 */
export interface IRenderingService {
  /**
   * Render a promptsection with a seed
   */
  render(
    pkg: Package,
    namespace: string,
    promptSection: string,
    seed: number
  ): Promise<RenderResult>;

  /**
   * Render a rulebook entry point with a seed
   */
  renderRulebook(
    pkg: Package,
    namespace: string,
    rulebook: string,
    seed: number
  ): Promise<RenderResult>;
}
