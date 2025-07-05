import DOMPurify from 'dompurify';

export interface ContentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
}

export interface EditorLimits {
  maxContentLength: number;
  maxWordCount: number;
  maxCharactersPerLine: number;
  allowedTags: string[];
  allowedAttributes: string[];
}

const DEFAULT_LIMITS: EditorLimits = {
  maxContentLength: 5000000, // 5MB
  maxWordCount: 100000,
  maxCharactersPerLine: 1000,
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
  ],
  allowedAttributes: ['class', 'style', 'data-*']
};

/**
 * Validates and sanitizes editor content according to security standards
 */
export function validateEditorContent(
  content: string,
  limits: EditorLimits = DEFAULT_LIMITS
): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Content length validation
  if (content.length > limits.maxContentLength) {
    errors.push(`Content exceeds maximum length of ${limits.maxContentLength} characters`);
  }

  // Word count validation
  const wordCount = content.trim() ? content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  if (wordCount > limits.maxWordCount) {
    errors.push(`Content exceeds maximum word count of ${limits.maxWordCount} words`);
  }

  // Line length validation
  const lines = content.split('\n');
  const longLines = lines.filter(line => line.length > limits.maxCharactersPerLine);
  if (longLines.length > 0) {
    warnings.push(`${longLines.length} lines exceed recommended length of ${limits.maxCharactersPerLine} characters`);
  }

  // HTML structure validation
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    if (doc.querySelector('parsererror')) {
      errors.push('Invalid HTML structure detected');
    }
  } catch (error) {
    errors.push('Failed to parse HTML content');
  }

  // Sanitize content - removed REMOVE_EMPTY_ELEMENTS which doesn't exist in DOMPurify config
  let sanitizedContent: string;
  try {
    sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: limits.allowedTags,
      ALLOWED_ATTR: limits.allowedAttributes,
      ALLOW_DATA_ATTR: true,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
  } catch (error) {
    errors.push('Content sanitization failed');
    sanitizedContent = '';
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedContent
  };
}

/**
 * Validates content structure and format
 */
export function validateContentStructure(content: string): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for nested elements depth (prevent deeply nested structures)
  const maxDepth = 10;
  const depth = getElementDepth(content);
  if (depth > maxDepth) {
    errors.push(`Content structure too deeply nested (${depth} levels, max ${maxDepth})`);
  }

  // Check for excessive formatting
  const formattingRatio = getFormattingRatio(content);
  if (formattingRatio > 0.5) {
    warnings.push('Content contains excessive formatting which may impact performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function getElementDepth(html: string): number {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    function calculateDepth(element: Element, currentDepth = 0): number {
      let maxDepth = currentDepth;
      for (const child of element.children) {
        maxDepth = Math.max(maxDepth, calculateDepth(child, currentDepth + 1));
      }
      return maxDepth;
    }
    
    return calculateDepth(doc.body);
  } catch {
    return 0;
  }
}

function getFormattingRatio(html: string): number {
  const totalLength = html.length;
  const plainText = html.replace(/<[^>]*>/g, '');
  const formattingLength = totalLength - plainText.length;
  return totalLength > 0 ? formattingLength / totalLength : 0;
}
