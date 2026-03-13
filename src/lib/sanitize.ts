import DOMPurify from "dompurify";

/**
 * Sanitize HTML content for safe rendering via dangerouslySetInnerHTML.
 * Strips script tags, event handlers, and dangerous attributes.
 * Allows safe tags for rich text content (headings, lists, images, links, etc.)
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "b", "em", "i", "u", "s", "strike", "del",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "figure", "figcaption",
      "sub", "sup", "mark",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title", "width", "height",
      "class", "id", "style",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
};

/**
 * Escape HTML entities for plain text display.
 * Use when rendering user-provided text that should NOT contain any HTML.
 */
export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

/**
 * Strip all HTML tags, returning plain text only.
 */
export const stripHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
};

/**
 * Validate text input: check length limits and reject dangerous patterns.
 * Returns null if valid, or an error message string.
 */
export const validateTextInput = (
  value: string,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}
): string | null => {
  const { required = false, minLength, maxLength, pattern, patternMessage } = options;
  const trimmed = value.trim();

  if (required && !trimmed) {
    return `${fieldName} is required.`;
  }

  if (trimmed && minLength && trimmed.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters.`;
  }

  if (maxLength && trimmed.length > maxLength) {
    return `${fieldName} must be at most ${maxLength} characters.`;
  }

  // Block script injection patterns in plain text fields
  if (trimmed && /<script[\s>]/i.test(trimmed)) {
    return `${fieldName} contains disallowed content.`;
  }

  if (pattern && trimmed && !pattern.test(trimmed)) {
    return patternMessage || `${fieldName} contains invalid characters.`;
  }

  return null;
};

/**
 * Validate email format.
 */
export const validateEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if (trimmed.length > 255) return "Email must be under 255 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Invalid email format.";
  return null;
};
