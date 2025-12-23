/**
 * Validation Error Types
 * Ported from rpg-desktop/src-tauri/src/validator/mod.rs
 */

export const ValidationErrorType = {
  REFERENCE_NOT_FOUND: 'REFERENCE_NOT_FOUND',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  INVALID_TAG_FILTER: 'INVALID_TAG_FILTER',
  SEPARATOR_NOT_FOUND: 'SEPARATOR_NOT_FOUND',
  MIN_MAX_INVALID: 'MIN_MAX_INVALID',
  UNIQUE_CONSTRAINT_INFEASIBLE: 'UNIQUE_CONSTRAINT_INFEASIBLE',
  INVALID_RULE: 'INVALID_RULE',
  DUPLICATE_ID: 'DUPLICATE_ID',
  INVALID_NAMING: 'INVALID_NAMING',
  INVALID_DEPENDENCY: 'INVALID_DEPENDENCY',
  INVALID_DEPENDENCY_VERSION: 'INVALID_DEPENDENCY_VERSION',
} as const;

export type ValidationErrorType = (typeof ValidationErrorType)[keyof typeof ValidationErrorType];

export const ValidationWarningType = {
  UNUSED_DATATYPE: 'UNUSED_DATATYPE',
  UNUSED_PROMPT_SECTION: 'UNUSED_PROMPT_SECTION',
  UNUSED_SEPARATOR_SET: 'UNUSED_SEPARATOR_SET',
  UNUSED_REFERENCE: 'UNUSED_REFERENCE',
  LARGE_WEIGHT_SUM: 'LARGE_WEIGHT_SUM',
  MISSING_DESCRIPTION: 'MISSING_DESCRIPTION',
  MAJOR_VERSION_RANGE: 'MAJOR_VERSION_RANGE',
  FLEXIBLE_DEPENDENCY: 'FLEXIBLE_DEPENDENCY',
} as const;

export type ValidationWarningType =
  (typeof ValidationWarningType)[keyof typeof ValidationWarningType];

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  location?: string; // e.g., "namespace:entity_id"
  suggestion?: string;
}

export interface ValidationWarning {
  type: ValidationWarningType;
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export function createValidationResult(): ValidationResult {
  return {
    errors: [],
    warnings: [],
  };
}

export function isValid(result: ValidationResult): boolean {
  return result.errors.length === 0;
}

export function hasWarnings(result: ValidationResult): boolean {
  return result.warnings.length > 0;
}

export function addError(result: ValidationResult, error: ValidationError): void {
  result.errors.push(error);
}

export function addWarning(result: ValidationResult, warning: ValidationWarning): void {
  result.warnings.push(warning);
}

export function mergeResults(target: ValidationResult, source: ValidationResult): void {
  target.errors.push(...source.errors);
  target.warnings.push(...source.warnings);
}

/**
 * Helper functions to create specific error types
 */

export function createReferenceNotFoundError(
  reference: string,
  definedIn: string,
  suggestion?: string
): ValidationError {
  return {
    type: ValidationErrorType.REFERENCE_NOT_FOUND,
    message: `Reference not found: '${reference}' in ${definedIn}`,
    location: definedIn,
    suggestion,
  };
}

export function createCircularReferenceError(chain: string[]): ValidationError {
  return {
    type: ValidationErrorType.CIRCULAR_REFERENCE,
    message: `Circular reference detected: ${chain.join(' → ')}`,
  };
}

export function createSeparatorNotFoundError(
  separator: string,
  definedIn: string
): ValidationError {
  return {
    type: ValidationErrorType.SEPARATOR_NOT_FOUND,
    message: `Separator set not found: '${separator}' referenced in ${definedIn}`,
    location: definedIn,
  };
}

export function createMinMaxInvalidError(
  min: number,
  max: number,
  definedIn: string
): ValidationError {
  return {
    type: ValidationErrorType.MIN_MAX_INVALID,
    message: `Min must be <= Max: min=${min}, max=${max} in ${definedIn}`,
    location: definedIn,
  };
}

export function createUniqueConstraintInfeasibleError(
  requested: number,
  available: number,
  datatype: string
): ValidationError {
  return {
    type: ValidationErrorType.UNIQUE_CONSTRAINT_INFEASIBLE,
    message: `Unique constraint infeasible: requested ${requested} unique values but only ${available} values available in ${datatype}`,
    location: datatype,
  };
}

export function createInvalidDependencyError(packageId: string, reason: string): ValidationError {
  return {
    type: ValidationErrorType.INVALID_DEPENDENCY,
    message: `Invalid dependency: package '${packageId}' - ${reason}`,
  };
}

/**
 * Helper functions to create specific warning types
 */

export function createUnusedDatatypeWarning(
  datatype: string,
  namespace: string
): ValidationWarning {
  return {
    type: ValidationWarningType.UNUSED_DATATYPE,
    message: `Unused datatype: '${namespace}:${datatype}' is defined but never referenced`,
    location: `${namespace}:${datatype}`,
  };
}

export function createUnusedSeparatorSetWarning(
  separator: string,
  namespace: string
): ValidationWarning {
  return {
    type: ValidationWarningType.UNUSED_SEPARATOR_SET,
    message: `Unused separator set: '${namespace}:${separator}' is defined but never referenced`,
    location: `${namespace}:${separator}`,
  };
}

export function createUnusedReferenceWarning(
  reference: string,
  promptSection: string
): ValidationWarning {
  return {
    type: ValidationWarningType.UNUSED_REFERENCE,
    message: `Unused reference '${reference}' in ${promptSection}: defined but not used in template (consider adding {${reference}} or removing the definition)`,
    location: promptSection,
    suggestion: `Add {${reference}} to template or remove reference definition`,
  };
}

export function createLargeWeightSumWarning(datatype: string, sum: number): ValidationWarning {
  return {
    type: ValidationWarningType.LARGE_WEIGHT_SUM,
    message: `Large weight sum in datatype '${datatype}': ${sum.toFixed(2)} (consider normalizing)`,
    location: datatype,
  };
}
