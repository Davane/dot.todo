import { tokenizeLine, type TokenizeOptions } from './tokenizeLine';
import type { ParsedLine, TodoDocumentModel } from './types';

const SECTION = /^\s*#\s+(.+)$/;
const CHECKLIST_ITEM = /^\s*([-+*])\s+\[([ xX])\]\s+(.*)$/;

function isEmptyLine(line: string): boolean {
  return /^\s*$/.test(line);
}

export async function parseTodoDocument(
  text: string,
  revision: number,
  tokenizeOpts?: TokenizeOptions
): Promise<TodoDocumentModel> {
  const rawLines = text.split(/\r?\n/);
  const lines: ParsedLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const lineText = rawLines[i];
    const lineNo = i;

    if (isEmptyLine(lineText)) {
      lines.push({ type: 'empty', line: lineNo });
      continue;
    }

    const sec = SECTION.exec(lineText);
    if (sec) {
      lines.push({
        type: 'section',
        line: lineNo,
        title: sec[1].trim(),
      });
      continue;
    }

    const todo = CHECKLIST_ITEM.exec(lineText);
    if (todo) {
      const body = todo[3] ?? '';
      lines.push({
        type: 'todo',
        line: lineNo,
        checked: todo[2] === 'x' || todo[2] === 'X',
        bullet: todo[1],
        spans: await tokenizeLine(body, tokenizeOpts),
      });
      continue;
    }

    lines.push({ type: 'plain', line: lineNo, text: lineText });
  }

  return { revision, lines };
}
