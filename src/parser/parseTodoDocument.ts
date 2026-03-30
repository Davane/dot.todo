import { tokenizeLine, type TokenizeOptions } from './tokenizeLine';
import type { InlineSpan, ParsedLine, TodoDocumentModel } from './types';
import { renderBlockSafe, renderInlineSafe } from '../utils/renderMarkdown';

const SECTION = /^\s*#\s+(.+)$/;
const CHECKLIST_ITEM = /^\s*([-+*])\s+\[([ xX])\]\s+(.*)$/;
const FENCE_OPEN = /^\s*```([\w-]*)\s*$/;
const FENCE_CLOSE = /^\s*```\s*$/;

function isEmptyLine(line: string): boolean {
  return /^\s*$/.test(line);
}

function applyInlineMarkdownToSpans(spans: InlineSpan[]): InlineSpan[] {
  const out: InlineSpan[] = [];
  for (const s of spans) {
    if (s.kind === 'text') {
      const html = renderInlineSafe(s.text);
      if (html) {
        out.push({ kind: 'html', html });
      }
    } else {
      out.push(s);
    }
  }
  return out;
}

export async function parseTodoDocument(
  text: string,
  revision: number,
  tokenizeOpts?: TokenizeOptions
): Promise<TodoDocumentModel> {
  const rawLines = text.split(/\r?\n/);
  const lines: ParsedLine[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const lineText = rawLines[i];
    const lineNo = i;

    if (isEmptyLine(lineText)) {
      lines.push({ type: 'empty', line: lineNo });
      i++;
      continue;
    }

    const fenceOpen = FENCE_OPEN.exec(lineText);
    if (fenceOpen) {
      const language = fenceOpen[1] ?? '';
      const startLine = lineNo;
      i++;
      const parts: string[] = [];
      while (i < rawLines.length) {
        const L = rawLines[i];
        if (FENCE_CLOSE.test(L)) {
          i++;
          break;
        }
        parts.push(L);
        i++;
      }
      lines.push({
        type: 'codeBlock',
        line: startLine,
        language,
        code: parts.join('\n'),
      });
      continue;
    }

    const sec = SECTION.exec(lineText);
    if (sec) {
      lines.push({
        type: 'section',
        line: lineNo,
        title: sec[1].trim(),
      });
      i++;
      continue;
    }

    const todo = CHECKLIST_ITEM.exec(lineText);
    if (todo) {
      const body = todo[3] ?? '';
      const spans = await tokenizeLine(body, tokenizeOpts);
      lines.push({
        type: 'todo',
        line: lineNo,
        checked: todo[2] === 'x' || todo[2] === 'X',
        bullet: todo[1],
        spans: applyInlineMarkdownToSpans(spans),
      });
      i++;
      continue;
    }

    lines.push({
      type: 'plain',
      line: lineNo,
      text: lineText,
      html: renderBlockSafe(lineText),
    });
    i++;
  }

  return { revision, lines };
}
