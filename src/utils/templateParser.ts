// M11: Web Application - Template Parser
// TypeScript simplified port from Rust implementation

export type TemplateToken =
  | { type: 'text'; text: string }
  | {
      type: 'reference';
      name: string;
      filter?: string;
      min: number;
      max: number;
      separator?: string;
      unique: boolean;
    };

export interface Template {
  tokens: TemplateToken[];
  original: string;
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Parse a template string
 *
 * Supports:
 * - Static text: "Hello world"
 * - References: "{color}", "{namespace:datatype}"
 * - Tag filters: "{color#{tags.bright}}"
 * - Parameters: "{color?min=1,max=3&sep=comma_and&unique=true}"
 * - Escaped braces: "{{" becomes "{", "}}" becomes "}"
 */
export function parseTemplate(template: string): Template {
  const tokens: TemplateToken[] = [];
  let currentText = '';
  let i = 0;

  while (i < template.length) {
    const ch = template[i];

    if (ch === '{') {
      // Check for escaped brace {{
      if (template[i + 1] === '{') {
        currentText += '{';
        i += 2;
        continue;
      }

      // Save accumulated text
      if (currentText) {
        tokens.push({ type: 'text', text: currentText });
        currentText = '';
      }

      // Find the closing }
      const refStart = i + 1;
      let refEnd = refStart;
      let braceDepth = 0;
      let inFilter = false;

      while (refEnd < template.length) {
        const c = template[refEnd];

        if (c === '{') {
          braceDepth++;
        } else if (c === '}') {
          if (braceDepth > 0) {
            braceDepth--;
          } else if (inFilter) {
            inFilter = false;
          } else {
            // Found the closing brace
            break;
          }
        } else if (c === '#' && template[refEnd + 1] === '{' && !inFilter) {
          inFilter = true;
          refEnd++; // Skip the '{'
        }

        refEnd++;
      }

      if (refEnd >= template.length) {
        throw new ParseError(`Unclosed reference at position ${i}`);
      }

      const refText = template.slice(refStart, refEnd).trim();
      if (!refText) {
        throw new ParseError(`Empty reference at position ${i}`);
      }

      // Parse the reference
      const token = parseReference(refText);
      tokens.push(token);

      i = refEnd + 1;
    } else if (ch === '}') {
      // Check for escaped brace }}
      if (template[i + 1] === '}') {
        currentText += '}';
        i += 2;
        continue;
      }

      // Unmatched closing brace
      currentText += ch;
      i++;
    } else {
      currentText += ch;
      i++;
    }
  }

  // Save remaining text
  if (currentText) {
    tokens.push({ type: 'text', text: currentText });
  }

  return { tokens, original: template };
}

/**
 * Parse a reference string
 *
 * Format: name#{filter}?min=1,max=3&sep=comma_and&unique=true
 */
function parseReference(refText: string): TemplateToken {
  // Split by # to separate name and filter
  const filterMatch = refText.match(/^([^#]+)#\{(.+)\}(.*)$/);
  let name: string;
  let filter: string | undefined;
  let paramsText: string;

  if (filterMatch && filterMatch[1] && filterMatch[2] && filterMatch[3] !== undefined) {
    name = filterMatch[1].trim();
    filter = filterMatch[2].trim();
    paramsText = filterMatch[3].trim();
  } else {
    // Split by ? to separate name and parameters
    const parts = refText.split('?');
    const part0 = parts[0];
    if (!part0) {
      throw new ParseError('Invalid reference format');
    }
    name = part0.trim();
    paramsText = parts.length > 1 && parts[1] ? parts[1] : '';
  }

  // Parse parameters
  let min = 1;
  let max = 1;
  let separator: string | undefined;
  let unique = false;

  if (paramsText) {
    // Parse key=value pairs separated by , or &
    const params = paramsText.split(/[,&]/);
    for (const param of params) {
      const [key, value] = param.split('=').map((s) => s.trim());
      if (!key || !value) continue;

      if (key === 'min') {
        min = parseInt(value, 10);
      } else if (key === 'max') {
        max = parseInt(value, 10);
      } else if (key === 'sep' || key === 'separator') {
        separator = value;
      } else if (key === 'unique') {
        unique = value === 'true';
      }
    }
  }

  return {
    type: 'reference',
    name,
    filter,
    min,
    max,
    separator,
    unique,
  };
}

