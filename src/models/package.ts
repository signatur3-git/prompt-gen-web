// M11: Web Application - Core Data Models
// Ported from Rust implementation (rpg-desktop/src-tauri/src/core/models.rs)

/**
 * Package - Root container for RPG content
 */
export interface Package {
  /** Unique package identifier */
  id: string;

  /** Semantic version */
  version: string;

  /** Package metadata */
  metadata: PackageMetadata;

  /** Namespaces defined in this package */
  namespaces: Record<string, Namespace>;

  /** Package dependencies */
  dependencies?: Dependency[];
}

export interface PackageMetadata {
  name: string;
  description?: string;
  authors: string[];

  /** Optional: Bypass all tag filtering in this package (for absurdist packages) */
  bypass_filters?: boolean;
}

/**
 * Dependency - Package dependency with exact version matching
 *
 * We enforce exact version matching (not semver ranges) to guarantee deterministic rendering.
 */
export interface Dependency {
  /** Package ID to depend on (e.g., "prompt-gen.common") */
  package: string;

  /** Package to depend on (e.g., "prompt-gen.common") - DEC-0012 canonical */
  package?: string;

  /** Exact version required (e.g., "1.0.0") */
  version: string;

  /** Optional path to local package file */
  path?: string;
}

/**
 * Namespace - Organizational unit within a package
 */
export interface Namespace {
  /** Namespace identifier (e.g., "featured.common") */
  id: string;

  /** Datatypes defined in this namespace */
  datatypes: Record<string, Datatype>;

  /** Prompt sections (templates) */
  prompt_sections: Record<string, PromptSection>;

  /** Separator sets for list formatting */
  separator_sets: Record<string, SeparatorSet>;

  /** Rules for coordination */
  rules: Record<string, Rule>;

  /** Decisions for complex logic */
  decisions: Decision[];

  /** Rulebooks - Entry point wrappers for rendering */
  rulebooks: Record<string, Rulebook>;
}

/**
 * Datatype - Collection of selectable values with tags
 */
export interface Datatype {
  name: string;
  values: DatatypeValue[];

  /** Optional: Extends another datatype */
  extends?: string;

  /** Optional: Override tags when extending */
  override_tags?: Record<string, unknown>;
}

export interface DatatypeValue {
  /** The actual text value */
  text: string;

  /** Tags for coordination (article, plural, gender, etc.) */
  tags: Record<string, unknown>;

  /** Optional weight for selection probability */
  weight?: number;
}

/**
 * PromptSection - Template with references
 */
export interface PromptSection {
  name: string;

  /** Template string with {references} */
  template: string;

  /** Reference definitions */
  references: Record<string, Reference>;
}

/**
 * Reference - How to select values in a template
 */
export interface Reference {
  /** Target datatype or promptsection (namespace:name format) */
  target: string;

  /** Optional tag filter */
  filter?: string;

  /** Repetition parameters */
  min?: number;
  max?: number;

  /** Separator set for lists */
  separator?: string;

  /** Whether to enforce uniqueness in multi-selection */
  unique?: boolean;
}

/**
 * SeparatorSet - List formatting rules
 */
export interface SeparatorSet {
  name: string;
  primary: string;      // ", "
  secondary: string;    // " and "
  tertiary?: string;
}

/**
 * Rule - Simple coordination logic
 */
export interface Rule {
  /** Field to check (triggers the rule) */
  when: string;

  /** Optional logic expression (empty = field exists) */
  logic?: string;

  /** Context field to write to */
  set: string;

  /** Value to write (literal or expression) */
  value: string;
}

/**
 * Decision - Complex reusable logic
 */
export interface Decision {
  /** Unique name (qualified with namespace) */
  name: string;

  /** Input parameters */
  inputs: Record<string, string>;

  /** Output parameters */
  outputs: Record<string, string>;

  /** Processor type and implementation */
  processor: Processor;
}

export type Processor =
  | { type: 'expression'; formula: string }
  | { type: 'rule_set'; rules: ConditionalRule[] }
  | { type: 'script'; language: string; code: string };

export interface ConditionalRule {
  condition: string;
  output: Record<string, unknown>;
}

/**
 * Rulebook - Entry point for prompt generation
 */
export interface Rulebook {
  name: string;

  /** Entry points with optional weights */
  entry_points: EntryPoint[];

  /** Optional context initialization */
  context?: Record<string, unknown>;
}

export interface EntryPoint {
  /** Target promptsection (namespace:name format). Also accepts 'prompt_section' for backwards compatibility. */
  target?: string;

  /** Package to depend on (e.g., "prompt-gen.common") - DEC-0012 canonical */
  prompt_section?: string;

  /** Optional weight for selection probability */
  weight?: number;
}

/**
 * Default values
 */
export const DEFAULT_WEIGHT = 1.0;
export const DEFAULT_MIN = 1;
export const DEFAULT_MAX = 1;

/**
 * Helper to create a new empty package
 */
export function createEmptyPackage(): Package {
  return {
    id: '',
    version: '1.0.0',
    metadata: {
      name: '',
      description: '',
      authors: [],
    },
    namespaces: {},
    dependencies: [],
  };
}

/**
 * Helper to create a new empty namespace
 */
export function createEmptyNamespace(id: string): Namespace {
  return {
    id,
    datatypes: {},
    prompt_sections: {},
    separator_sets: {},
    rules: {},
    decisions: [],
    rulebooks: {},
  };
}

