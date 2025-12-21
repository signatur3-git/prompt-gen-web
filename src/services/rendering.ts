// M11: Web Application - Rendering Service (Simplified MVP)
// TypeScript implementation for browser-based rendering

import type { Package, Namespace, PromptSection, Reference, DatatypeValue } from '../models/package';
import type { IRenderingService, RenderResult } from './platform';
import { SeededRandom } from '../utils/seededRandom';
import { parseTemplate } from '../utils/templateParser';

/**
 * Context store for cross-reference coordination
 */
class Context {
  private data: Map<string, unknown> = new Map();

  set(key: string, value: unknown): void {
    // Allow overwriting - last write wins (important for rule-computed values)
    this.data.set(key, value);
  }

  get(key: string): unknown {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  getOrThrow(key: string, context: string): unknown {
    if (!this.data.has(key)) {
      throw new Error(`Context variable '${key}' not found. ${context}`);
    }
    return this.data.get(key);
  }
}

/**
 * Selected value with metadata
 */
interface SelectedValue {
  text: string;
  tags: Record<string, unknown>;
  namespace: string;
  datatype: string;
}

/**
 * Intermediate rendering state across phases
 */
interface RenderState {
  tokens: Array<{
    type: 'text' | 'reference' | 'context';
    text?: string;
    name?: string;
    filter?: string;
    min?: number;
    max?: number;
    separator?: string;
    unique?: boolean;
  }>;
  selectedValues: Map<string, SelectedValue[]>;
  contextRefs: string[];
}

/**
 * Simplified rendering service for MVP
 *
 * Note: This is a basic implementation. For production, port the full Rust renderer
 * or compile to WebAssembly.
 */
export class RenderingService implements IRenderingService {
  async render(
    pkg: Package,
    namespaceName: string,
    promptSectionName: string,
    seed: number
  ): Promise<RenderResult> {
    const rng = new SeededRandom(seed);
    const context = new Context();
    const namespace = pkg.namespaces[namespaceName];

    if (!namespace) {
      throw new Error(`Namespace not found: ${namespaceName}`);
    }

    const promptSection = namespace.prompt_sections[promptSectionName];
    if (!promptSection) {
      throw new Error(`PromptSection not found: ${namespaceName}:${promptSectionName}`);
    }

    // Render the template
    const text = await this.renderTemplate(pkg, namespace, promptSection, rng, context);

    return {
      text: text.trim(),
      seed,
    };
  }

  async renderRulebook(
    pkg: Package,
    namespaceName: string,
    rulebookName: string,
    seed: number
  ): Promise<RenderResult> {
    const namespace = pkg.namespaces[namespaceName];
    if (!namespace) {
      throw new Error(`Namespace not found: ${namespaceName}`);
    }

    const rulebook = namespace.rulebooks[rulebookName];
    if (!rulebook) {
      throw new Error(`Rulebook not found: ${namespaceName}:${rulebookName}`);
    }

    // Log rulebook structure for debugging
    console.log(`Rendering rulebook ${namespaceName}:${rulebookName}`);
    console.log(`Entry points:`, rulebook.entry_points);
    console.log(`Entry point count:`, rulebook.entry_points?.length);

    if (!rulebook.entry_points || rulebook.entry_points.length === 0) {
      throw new Error(
        `Rulebook ${namespaceName}:${rulebookName} has no entry points defined. ` +
        `Please add at least one entry point in the editor.`
      );
    }

    // Select random entry point (weighted if specified)
    const rng = new SeededRandom(seed);
    const weights = rulebook.entry_points.map((ep) => ep.weight || 1.0);
    const index = rng.weightedChoice(weights);
    const entryPoint = rulebook.entry_points[index];

    console.log(`Selected entry point index ${index}:`, entryPoint);

    if (!entryPoint) {
      throw new Error(
        `No entry point found at index ${index} in rulebook: ${namespaceName}:${rulebookName}. ` +
        `Total entry points: ${rulebook.entry_points.length}`
      );
    }

    // Handle both 'target' and 'prompt_section' field names (backwards compatibility with desktop app)
    const target = entryPoint.target || (entryPoint as any).prompt_section;

    if (!target) {
      throw new Error(
        `Entry point in rulebook ${namespaceName}:${rulebookName} has no target defined. ` +
        `Entry point data: ${JSON.stringify(entryPoint)}. ` +
        `Please edit the rulebook and ensure all entry points have a valid target or prompt_section field.`
      );
    }

    // Parse target (format: namespace:promptsection or just promptsection)
    const parts = target.includes(':')
      ? target.split(':')
      : [namespaceName, target];

    const targetNs = parts[0];
    const targetPs = parts[1];

    if (!targetNs || !targetPs) {
      throw new Error(`Invalid entry point target: ${target}`);
    }

    // Initialize context from rulebook if provided
    const context = new Context();
    if (rulebook.context) {
      for (const [key, value] of Object.entries(rulebook.context)) {
        context.set(key, value);
      }
    }

    // Render the selected entry point with initialized context
    const targetNamespace = pkg.namespaces[targetNs];
    if (!targetNamespace) {
      throw new Error(`Namespace not found: ${targetNs}`);
    }

    const promptSection = targetNamespace.prompt_sections[targetPs];
    if (!promptSection) {
      throw new Error(`PromptSection not found: ${targetNs}:${targetPs}`);
    }

    // Render the template with the initialized context
    const text = await this.renderTemplate(pkg, targetNamespace, promptSection, rng, context);

    return {
      text: text.trim(),
      seed,
    };
  }

  private async renderTemplate(
    pkg: Package,
    namespace: Namespace,
    promptSection: PromptSection,
    rng: SeededRandom,
    context: Context
  ): Promise<string> {
    // PHASE 1: Parse template and classify tokens
    const template = parseTemplate(promptSection.template);
    const state: RenderState = {
      tokens: [],
      selectedValues: new Map(),
      contextRefs: [],
    };

    for (const token of template.tokens) {
      if (token.type === 'text') {
        state.tokens.push({ type: 'text', text: token.text });
      } else if (token.type === 'reference') {
        // Check if this is a context reference
        const ref = promptSection.references[token.name];
        const isContextRef = ref?.target?.startsWith('context:');

        state.tokens.push({
          type: isContextRef ? 'context' : 'reference',
          name: token.name,
          filter: token.filter,
          min: token.min,
          max: token.max,
          separator: token.separator,
          unique: token.unique,
        });

        if (isContextRef) {
          state.contextRefs.push(token.name);
        }
      }
    }

    // PHASE 2: Select values for all non-context references
    for (const token of state.tokens) {
      if (token.type === 'reference' && token.name) {
        const ref = promptSection.references[token.name];
        if (!ref) {
          throw new Error(`Reference not found: ${token.name} in ${namespace.id}:${promptSection.name}`);
        }

        const count = rng.genRange(token.min || ref.min || 1, token.max || ref.max || 1);
        const values: SelectedValue[] = [];
        const excludeTexts = token.unique ? [] : undefined;

        for (let i = 0; i < count; i++) {
          const value = await this.selectValue(pkg, namespace, ref, rng, context, excludeTexts);
          values.push(value);
          if (excludeTexts) {
            excludeTexts.push(value.text);
          }
        }

        state.selectedValues.set(token.name, values);
      }
    }

    // PHASE 3: Store all selected values in context
    for (const [name, values] of state.selectedValues.entries()) {
      // Store the last value (or all if needed for rules)
      if (values.length > 0) {
        context.set(name, values[values.length - 1]);
      }
    }

    // PHASE 4: Apply all rules to compute derived context values
    this.applyRules(namespace, context);

    // PHASE 5: Resolve all tokens (including context references)
    const parts: string[] = [];
    for (const token of state.tokens) {
      if (token.type === 'text') {
        parts.push(token.text || '');
      } else if (token.type === 'reference' && token.name) {
        // Get pre-selected values
        const values = state.selectedValues.get(token.name);
        if (!values || values.length === 0) {
          throw new Error(`No values found for reference: ${token.name}`);
        }

        const ref = promptSection.references[token.name];
        const formatted = this.formatList(
          values.map(v => v.text),
          token.separator || ref?.separator,
          namespace
        );
        parts.push(formatted);
      } else if (token.type === 'context' && token.name) {
        // Resolve context reference
        const ref = promptSection.references[token.name];
        if (!ref || !ref.target) {
          throw new Error(`Reference not found: ${token.name}`);
        }

        const contextKey = ref.target.substring(8); // Remove "context:" prefix
        const value = context.getOrThrow(
          contextKey,
          `Make sure it's set by a rule that triggers before this reference is used.`
        );

        // If it's a SelectedValue, use its text
        if (typeof value === 'object' && value !== null && 'text' in value) {
          parts.push((value as SelectedValue).text);
        } else {
          parts.push(String(value));
        }
      }
    }

    // PHASE 6: Format and return output
    return parts.join('');
  }

  private async selectValue(
    pkg: Package,
    namespace: Namespace,
    ref: Reference,
    rng: SeededRandom,
    context: Context,
    excludeTexts?: string[]
  ): Promise<SelectedValue> {
    if (!ref.target) {
      throw new Error(`Reference has no target defined in namespace ${namespace.id}`);
    }

    // Check for context: target (reads from context variables)
    if (ref.target.startsWith('context:')) {
      const contextKey = ref.target.substring(8); // Remove "context:" prefix
      const value = context.get(contextKey);

      if (value === undefined) {
        throw new Error(`Context variable not found: ${contextKey}. Make sure it's set by a previous reference or rule.`);
      }

      // If it's a SelectedValue, return it
      if (typeof value === 'object' && value !== null && 'text' in value) {
        return value as SelectedValue;
      }

      // Otherwise, convert to string
      return {
        text: String(value),
        tags: {},
        namespace: namespace.id,
        datatype: contextKey,
      };
    }

    // Parse target (format: namespace:name or just name)
    const parts = ref.target.includes(':')
      ? ref.target.split(':')
      : [namespace.id, ref.target];

    const targetNs = parts[0];
    const targetName = parts[1];

    if (!targetNs || !targetName) {
      throw new Error(`Invalid target format: ${ref.target}`);
    }

    const targetNamespace = pkg.namespaces[targetNs];
    if (!targetNamespace) {
      throw new Error(`Namespace not found: ${targetNs}`);
    }

    // Check if it's a datatype or promptsection
    if (targetNamespace.datatypes[targetName]) {
      return this.selectFromDatatype(
        targetNamespace,
        targetName,
        ref.filter,
        rng,
        context,
        excludeTexts
      );
    } else if (targetNamespace.prompt_sections[targetName]) {
      // Nested promptsection
      const ps = targetNamespace.prompt_sections[targetName];
      const text = await this.renderTemplate(pkg, targetNamespace, ps, rng, context);
      return {
        text,
        tags: {},
        namespace: targetNs,
        datatype: targetName,
      };
    } else {
      throw new Error(`Target not found: ${ref.target}`);
    }
  }

  private selectFromDatatype(
    namespace: Namespace,
    datatypeName: string,
    filter: string | undefined,
    rng: SeededRandom,
    context: Context,
    excludeTexts?: string[]
  ): SelectedValue {
    const datatype = namespace.datatypes[datatypeName];
    if (!datatype) {
      throw new Error(`Datatype not found: ${datatypeName}`);
    }

    // Filter values
    let values = datatype.values;

    // Apply exclusion filter
    if (excludeTexts) {
      values = values.filter((v) => !excludeTexts.includes(v.text));
    }

    // Apply tag filter (simplified - just check tag existence for MVP)
    if (filter) {
      values = this.applyFilter(values, filter, context);
    }

    if (values.length === 0) {
      throw new Error(`No values available after filtering in ${datatypeName}`);
    }

    // Weighted selection
    const weights = values.map((v) => v.weight || 1.0);
    const index = rng.weightedChoice(weights);
    const selected = values[index];

    if (!selected) {
      throw new Error(`Failed to select value from ${datatypeName}`);
    }

    return {
      text: selected.text,
      tags: selected.tags,
      namespace: namespace.id,
      datatype: datatypeName,
    };
  }

  private applyFilter(
    values: DatatypeValue[],
    filter: string,
    _context: Context
  ): DatatypeValue[] {
    // Simplified filter implementation for MVP
    // TODO: Full tag expression evaluation

    // Simple tag check: tags.key
    const tagMatch = filter.match(/tags\.(\w+)/);
    if (tagMatch && tagMatch[1]) {
      const tagKey = tagMatch[1];
      return values.filter((v) => tagKey in v.tags);
    }

    // For now, return all values if filter is not recognized
    return values;
  }

  private applyRules(namespace: Namespace, context: Context): void {
    // Apply simple rules (article coordination, etc.)
    for (const rule of Object.values(namespace.rules)) {
      // Check if trigger field exists in context
      if (context.has(rule.when)) {
        // Evaluate rule value
        let ruleValue = rule.value;

        // Simple expression evaluation: ref:field.tags.key
        const refMatch = ruleValue.match(/ref:(\w+)\.tags\.(\w+)/);
        if (refMatch && refMatch[1] && refMatch[2]) {
          const refName = refMatch[1];
          const tagKey = refMatch[2];
          const refValue = context.get(refName) as SelectedValue | undefined;
          if (refValue && refValue.tags && tagKey in refValue.tags) {
            ruleValue = String(refValue.tags[tagKey]);
          }
        }

        // Set context value
        context.set(rule.set, ruleValue);
      }
    }
  }

  private formatList(values: string[], separatorName: string | undefined, namespace: Namespace): string {
    if (values.length === 0) return '';
    if (values.length === 1) return values[0] || '';

    // Get separator set
    const separator = separatorName ? namespace.separator_sets[separatorName] : null;

    if (!separator) {
      // Default: comma + "and"
      const last = values[values.length - 1];
      const rest = values.slice(0, -1);
      return rest.join(', ') + ' and ' + last;
    }

    // Apply separator set
    if (values.length === 2) {
      return values[0] + separator.secondary + values[1];
    } else {
      const last = values[values.length - 1];
      const rest = values.slice(0, -1);
      return rest.join(separator.primary) + separator.secondary + last;
    }
  }
}

export const renderingService = new RenderingService();

