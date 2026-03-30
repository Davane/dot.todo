import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
});

const SANITIZE_OPTIONS: Parameters<typeof sanitizeHtml>[1] = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'code',
    'pre',
    'del',
    's',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
  ],
  allowedAttributes: {
    code: ['class'],
    pre: ['class'],
  },
  allowedClasses: {
    code: [/^language-[\w-]+$/],
    pre: [/^language-[\w-]+$/],
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeFragment(html: string, fallbackPlain: string): string {
  const cleaned = sanitizeHtml(html.trim(), SANITIZE_OPTIONS);
  if (!cleaned) {
    return `<span>${escapeHtml(fallbackPlain)}</span>`;
  }
  return cleaned;
}

/** Inline-only: bold, italic, code, strikethrough (`~~`). Host-sanitized HTML. */
export function renderInlineSafe(text: string): string {
  if (!text) {
    return '';
  }
  try {
    const raw = md.renderInline(text);
    return sanitizeFragment(raw, text);
  } catch {
    return `<span>${escapeHtml(text)}</span>`;
  }
}

/** One logical line as a block: headings, `hr`, paragraph wrapper, etc. Host-sanitized HTML. */
export function renderBlockSafe(line: string): string {
  try {
    const raw = md.render(`${line}\n`);
    return sanitizeFragment(raw, line);
  } catch {
    return `<p>${escapeHtml(line)}</p>`;
  }
}
