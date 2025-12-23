// Three-Phase Rendering Engine (Ported from Rust implementation)
// Based on: prompt-gen-desktop/src-tauri/src/renderer/engine.rs

import type { Package, Namespace, PromptSection, Reference } from '../models/package';
import type { RenderResult } from './platform';
import { SeededRandom } from '../utils/seededRandom';
import { parseTemplate, type TemplateToken } from '../utils/templateParser';

/** Maximum nesting depth for promptsections (prevent infinite recursion) */
const MAX_RECURSION_DEPTH = 10;

/** Selected value with metadata */
export interface SelectedValue {
  text: string;
  tags: Record<string, unknown>;
  namespace: string;
  datatype: string;
}

/** Selection context for cross-reference filtering */
export type SelectionContext = Map<string, { text: string; tags: Record<string, unknown> }>;

/**
 * Three-Phase Rendering Engine
 *
 * PHASE 1: SELECTION
 * - Parse template
 * - Compute selection order (topological sort based on dependencies)
 * - Select values in dependency order
 * - Build selection context for cross-reference filtering
 *
 * PHASE 2: ENRICHMENT
 * - Execute rules from all namespaces
 * - Rules read selected values' tags and write to context
 *
 * PHASE 3: RENDERING
 * - Replace template tokens with selected values
 * - Handle separators for multi-values
 * - Handle context references
 */
export class RenderingEngineV2 {
  private pkg: Package;
  private dependencies: Map<string, Package>;
  private seed: number;
  private rng: SeededRandom;

  constructor(pkg: Package, seed: number, dependencies?: Package[]) {
    this.pkg = pkg;
    this.seed = seed;
    this.rng = new SeededRandom(seed);

    // Build dependencies map by package ID
    this.dependencies = new Map();
    if (dependencies) {
      for (const dep of dependencies) {
        this.dependencies.set(dep.id, dep);
      }
    }
  }

  /**
   * Render a promptsection by reference
   * Format: "namespace:section" or just "section" (uses first namespace)
   */
  async render(promptsectionRef: string): Promise<RenderResult> {
    return this.renderWithDepthAndContext(promptsectionRef, 0, null);
  }

  /**
   * Render from a rulebook entry point
   */
  async renderRulebook(namespaceName: string, rulebookName: string): Promise<RenderResult> {
    const namespace = this.pkg.namespaces[namespaceName];
    if (!namespace) {
      throw new Error(`Namespace not found: ${namespaceName}`);
    }

    const rulebook = namespace.rulebooks[rulebookName];
    if (!rulebook) {
      throw new Error(`Rulebook not found: ${namespaceName}:${rulebookName}`);
    }

    if (!rulebook.entry_points || rulebook.entry_points.length === 0) {
      throw new Error(`Rulebook ${namespaceName}:${rulebookName} has no entry points`);
    }

    // Select random entry point (weighted)
    const weights = rulebook.entry_points.map(ep => ep.weight || 1.0);
    const index = this.rng.weightedChoice(weights);
    const entryPoint = rulebook.entry_points[index];

    if (!entryPoint) {
      throw new Error(
        `No entry point found at index ${index} in rulebook ${namespaceName}:${rulebookName}`
      );
    }

    // Handle both 'target' and 'prompt_section' field names
    const target = entryPoint.target || (entryPoint as any).prompt_section;
    if (!target) {
      throw new Error(
        `Entry point in rulebook ${namespaceName}:${rulebookName} has no target or prompt_section field`
      );
    }

    // Parse target
    const parts = target.includes(':') ? target.split(':') : [namespaceName, target];
    const targetNs = parts[0];
    const targetPs = parts[1];

    if (!targetNs || !targetPs) {
      throw new Error(`Invalid entry point target: ${target}`);
    }

    // Initialize context from rulebook if provided
    const initialContext = rulebook.context
      ? new Map(Object.entries(rulebook.context as Record<string, string>))
      : null;

    // Render the entry point
    return this.renderWithDepthAndContext(`${targetNs}:${targetPs}`, 0, initialContext);
  }

  /**
   * Internal render with recursion depth tracking and initial context
   */
  private async renderWithDepthAndContext(
    promptsectionRef: string,
    depth: number,
    initialContext: Map<string, string> | null
  ): Promise<RenderResult> {
    // Check recursion depth
    if (depth > MAX_RECURSION_DEPTH) {
      throw new Error(
        `Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded for: ${promptsectionRef}`
      );
    }

    // Find promptsection
    const { namespace, promptSection } = this.findPromptSection(promptsectionRef);

    // Create context
    const context = new Context();
    if (initialContext) {
      for (const [key, value] of initialContext) {
        context.set(key, value);
      }
    }

    // Three phases
    const selected = await this.phase1Selection(promptSection, namespace, depth);
    await this.phase2Enrichment(context, selected, namespace);
    const output = await this.phase3Rendering(promptSection, selected, context, namespace);

    return {
      text: output.trim(),
      seed: this.seed,
    };
  }

  /**
   * PHASE 1: SELECTION
   * Parse template and select values in dependency order
   */
  private async phase1Selection(
    promptSection: PromptSection,
    _namespace: Namespace,
    depth: number
  ): Promise<Map<string, SelectedValue[]>> {
    // Parse template
    const template = parseTemplate(promptSection.template);
    const tokens = template.tokens;

    // Compute selection order based on filter dependencies
    const selectionOrder = this.computeSelectionOrder(promptSection, tokens);

    // Build selection context for cross-reference filtering
    const selectionContext: SelectionContext = new Map();
    const selected = new Map<string, SelectedValue[]>();

    // Select values in dependency order
    for (const refName of selectionOrder) {
      const reference = promptSection.references[refName];
      if (!reference) {
        throw new Error(`Reference '${refName}' not defined in promptsection`);
      }

      // Skip context references - they'll be populated by rules in Phase 2
      if (reference.target.startsWith('context:')) {
        continue;
      }

      // Check if this is a nested promptsection
      if (this.isPromptSectionReference(reference.target)) {
        // Render recursively
        const nestedResult = await this.renderWithDepthAndContext(
          reference.target,
          depth + 1,
          null
        );
        const selectedVal: SelectedValue = {
          text: nestedResult.text,
          tags: {},
          namespace: '',
          datatype: '',
        };
        if (selectedVal && selectedVal.text) {
          selected.set(refName, [selectedVal]);
          selectionContext.set(refName, { text: nestedResult.text, tags: {} });
        }
      } else {
        // Select from datatype
        const values = await this.selectValues(reference, selectionContext);
        selected.set(refName, values);

        // Add first value to selection context
        if (values.length > 0 && values[0]) {
          selectionContext.set(refName, {
            text: values[0].text,
            tags: values[0].tags,
          });
        }
      }
    }

    return selected;
  }

  /**
   * PHASE 2: ENRICHMENT
   * Execute rules to compute derived values
   */
  private async phase2Enrichment(
    context: Context,
    selected: Map<string, SelectedValue[]>,
    _namespace: Namespace
  ): Promise<void> {
    // TODO: Implement rule execution
    // For now, just apply basic article logic if we have tags
    for (const [_refName, values] of selected) {
      if (values && values.length > 0 && values[0]) {
        const firstValue = values[0];
        if (
          firstValue.tags &&
          typeof firstValue.tags === 'object' &&
          'article' in firstValue.tags
        ) {
          const article = firstValue.tags.article;
          if (article && (typeof article === 'string' || typeof article === 'number')) {
            context.set('article', String(article));
          }
        }
      }
    }
  }

  /**
   * PHASE 3: RENDERING
   * Replace tokens with selected values
   */
  private async phase3Rendering(
    promptSection: PromptSection,
    selected: Map<string, SelectedValue[]>,
    context: Context,
    namespace: Namespace
  ): Promise<string> {
    const template = parseTemplate(promptSection.template);
    const tokens = template.tokens;
    const parts: string[] = [];

    for (const token of tokens) {
      if (token.type === 'text') {
        parts.push(token.text || '');
      } else if (token.type === 'reference') {
        const refName = token.name;
        if (!refName) continue;

        const reference = promptSection.references[refName];

        // Handle context references
        if (reference?.target.startsWith('context:')) {
          const contextKey = reference.target.substring(8); // Remove 'context:'
          const value = context.get(contextKey);
          parts.push(value ? String(value) : '');
        } else {
          // Handle normal references
          const values = selected.get(refName);
          if (values && values.length > 0 && values[0]) {
            if (values.length === 1) {
              parts.push(values[0].text);
            } else {
              // Multiple values - use separator
              const separator = reference?.separator || 'default';
              const separatorSet = namespace.separator_sets?.[separator] || {
                name: 'default',
                primary: ', ',
                secondary: ' and ',
              };
              parts.push(this.joinWithSeparator(values, separatorSet));
            }
          }
        }
      }
    }

    return parts.join('');
  }

  /**
   * Compute selection order using topological sort
   */
  private computeSelectionOrder(_promptSection: PromptSection, tokens: TemplateToken[]): string[] {
    // Get all reference names from template (in template order)
    const refNames: string[] = [];
    for (const token of tokens) {
      if (token.type === 'reference' && token.name && !refNames.includes(token.name)) {
        refNames.push(token.name);
      }
    }

    // TODO: Implement proper dependency graph analysis
    // For now, just return template order
    return refNames;
  }

  /**
   * Select value(s) for a reference
   */
  private async selectValues(
    reference: Reference,
    _selectionContext: SelectionContext
  ): Promise<SelectedValue[]> {
    const { namespace, datatype } = this.findDatatype(reference.target);

    if (!datatype.values || datatype.values.length === 0) {
      return [];
    }

    // Determine count
    const min = reference.min ?? 1;
    const max = reference.max ?? 1;
    const count = min === max ? min : this.rng.genRange(min, max);

    if (count === 0) {
      return [];
    }

    // TODO: Apply filter using selectionContext
    // For now, just select random values
    const filtered = datatype.values;

    if (count === 1) {
      const index = this.rng.genRange(0, filtered.length - 1);
      const value = filtered[index];
      return [
        {
          text: value.text,
          tags: value.tags,
          namespace: namespace.id,
          datatype: datatype.name,
        },
      ];
    } else {
      // Multi-select
      const unique = reference.unique ?? false;
      const selected: SelectedValue[] = [];
      const used = new Set<number>();

      for (let i = 0; i < count; i++) {
        if (unique && used.size >= filtered.length) break;

        let index: number;
        do {
          index = this.rng.genRange(0, filtered.length - 1);
        } while (unique && used.has(index));

        used.add(index);
        const value = filtered[index];
        selected.push({
          text: value.text,
          tags: value.tags,
          namespace: namespace.id,
          datatype: datatype.name,
        });
      }

      return selected;
    }
  }

  /**
   * Find promptsection by reference
   * Searches in current package and dependencies
   */
  private findPromptSection(ref: string): {
    namespace: Namespace;
    promptSection: PromptSection;
  } {
    const namespaceKeys = Object.keys(this.pkg.namespaces);
    const defaultNs = namespaceKeys.length > 0 ? namespaceKeys[0] : '';
    const parts = ref.includes(':') ? ref.split(':') : [defaultNs, ref];
    const [nsName, psName] = parts;

    if (!nsName || !psName) {
      throw new Error(`Invalid reference format: ${ref}`);
    }

    console.log(`[findPromptSection] Looking for ${nsName}:${psName}`);
    console.log(`[findPromptSection] Main package namespaces:`, Object.keys(this.pkg.namespaces));
    console.log(`[findPromptSection] Dependencies count:`, this.dependencies.size);

    // Try current package first
    let namespace = this.pkg.namespaces[nsName];

    // If not found, search dependencies
    if (!namespace) {
      console.log(
        `[findPromptSection] Not in main package, searching ${this.dependencies.size} dependencies`
      );
      for (const [depId, dep] of this.dependencies.entries()) {
        if (dep && dep.namespaces) {
          console.log(
            `[findPromptSection] Checking dependency ${depId}, namespaces:`,
            Object.keys(dep.namespaces)
          );
          namespace = dep.namespaces[nsName];
          if (namespace) {
            console.log(`[findPromptSection] Found in dependency ${depId}`);
            break;
          }
        }
      }
    }

    if (!namespace) {
      console.error(
        `[findPromptSection] Namespace '${nsName}' not found in main package or any dependency`
      );
      throw new Error(`Namespace not found: ${nsName}`);
    }

    const promptSection = namespace.prompt_sections[psName];
    if (!promptSection) {
      throw new Error(`PromptSection not found: ${ref}`);
    }

    return { namespace, promptSection };
  }

  /**
   * Find datatype by reference
   * Searches in current package and dependencies
   */
  private findDatatype(ref: string): { namespace: Namespace; datatype: any } {
    const namespaceKeys = Object.keys(this.pkg.namespaces);
    const defaultNs = namespaceKeys.length > 0 ? namespaceKeys[0] : '';
    const parts = ref.includes(':') ? ref.split(':') : [defaultNs, ref];
    const [nsName, dtName] = parts;

    if (!nsName || !dtName) {
      throw new Error(`Invalid reference format: ${ref}`);
    }

    console.log(`[findDatatype] Looking for ${nsName}:${dtName}`);
    console.log(`[findDatatype] Main package namespaces:`, Object.keys(this.pkg.namespaces));
    console.log(`[findDatatype] Dependencies count:`, this.dependencies.size);

    // Try current package first
    let namespace = this.pkg.namespaces[nsName];

    // If not found, search dependencies
    if (!namespace) {
      console.log(
        `[findDatatype] Not in main package, searching ${this.dependencies.size} dependencies`
      );
      for (const [depId, dep] of this.dependencies.entries()) {
        if (dep && dep.namespaces) {
          console.log(
            `[findDatatype] Checking dependency ${depId}, namespaces:`,
            Object.keys(dep.namespaces)
          );
          namespace = dep.namespaces[nsName];
          if (namespace) {
            console.log(`[findDatatype] Found in dependency ${depId}`);
            break;
          }
        }
      }
    }

    if (!namespace) {
      console.error(
        `[findDatatype] Namespace '${nsName}' not found in main package or any dependency`
      );
      throw new Error(`Namespace not found: ${nsName}`);
    }

    const datatype = namespace.datatypes[dtName];
    if (!datatype) {
      throw new Error(`Datatype not found: ${ref}`);
    }

    return { namespace, datatype };
  }

  /**
   * Check if a reference points to a promptsection (vs datatype)
   */
  private isPromptSectionReference(target: string): boolean {
    try {
      const { promptSection } = this.findPromptSection(target);
      return !!promptSection;
    } catch {
      return false;
    }
  }

  /**
   * Join multiple values with separator set
   */
  private joinWithSeparator(
    values: SelectedValue[],
    separatorSet: { primary: string; secondary: string; tertiary?: string }
  ): string {
    if (values.length === 0) return '';
    if (values.length === 1 && values[0]) return values[0].text;
    if (values.length === 2 && values[0] && values[1]) {
      return `${values[0].text}${separatorSet.secondary}${values[1].text}`;
    }

    // 3+ values
    const texts = values.map(v => v?.text || '').filter(t => t);
    if (texts.length === 0) return '';
    const last = texts.pop()!;
    return `${texts.join(separatorSet.primary)}${separatorSet.secondary}${last}`;
  }
}

/**
 * Simple context store
 */
class Context {
  private data = new Map<string, unknown>();

  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }

  get(key: string): unknown {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }
}
