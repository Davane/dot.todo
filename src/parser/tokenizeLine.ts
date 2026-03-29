import type { InlineSpan, InlineSpanFileRef } from './types';

const TRAIL_PUNCT = /[.,;:!?)\]}]+$/;
const FILE_REF = /@([^\s@]+)/g;

const TIME_PATTERNS: RegExp[] = [
  /\btomorrow\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi,
  /\btoday\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi,
  /\b\d{1,2}:\d{2}\s*(?:am|pm)\b/gi,
  /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi,
  /\b\d{1,2}:\d{2}\b/g,
];

function normalizeFilePath(raw: string): string {
  return raw.replace(TRAIL_PUNCT, '');
}

interface HighlightRange {
  start: number;
  end: number;
  kind: 'time' | 'fileRef';
  path?: string;
  display?: string;
}

export interface TokenizeOptions {
  resolveFileRef?: (
    rawPath: string
  ) =>
    | Pick<InlineSpanFileRef, 'resolvedUri' | 'fileExists'>
    | Promise<Pick<InlineSpanFileRef, 'resolvedUri' | 'fileExists'>>;
}

function fileRefRanges(body: string): HighlightRange[] {
  const ranges: HighlightRange[] = [];
  FILE_REF.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FILE_REF.exec(body)) !== null) {
    ranges.push({
      start: m.index,
      end: m.index + m[0].length,
      kind: 'fileRef',
      path: normalizeFilePath(m[1]),
      display: m[0],
    });
  }
  return ranges;
}

function occupiedByFiles(len: number, files: HighlightRange[]): boolean[] {
  const occ = new Array(len).fill(false);
  for (const f of files) {
    for (let i = f.start; i < f.end; i++) {
      occ[i] = true;
    }
  }
  return occ;
}

function timeRanges(body: string, occupied: boolean[]): HighlightRange[] {
  const raw: HighlightRange[] = [];
  for (const re of TIME_PATTERNS) {
    const r = new RegExp(re.source, re.flags);
    r.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.exec(body)) !== null) {
      let clear = true;
      for (let i = m.index; i < m.index + m[0].length; i++) {
        if (occupied[i]) {
          clear = false;
          break;
        }
      }
      if (clear) {
        raw.push({
          start: m.index,
          end: m.index + m[0].length,
          kind: 'time',
        });
      }
    }
  }
  raw.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: HighlightRange[] = [];
  for (const t of raw) {
    if (merged.length === 0) {
      merged.push(t);
      continue;
    }
    const prev = merged[merged.length - 1];
    if (t.start < prev.end) {
      continue;
    }
    merged.push(t);
  }
  return merged;
}

function combineRanges(
  files: HighlightRange[],
  times: HighlightRange[]
): HighlightRange[] {
  return [...files, ...times].sort((a, b) => a.start - b.start);
}

export async function tokenizeLine(
  body: string,
  options?: TokenizeOptions
): Promise<InlineSpan[]> {
  if (!body) {
    return [];
  }
  const files = fileRefRanges(body);
  const occ = occupiedByFiles(body.length, files);
  const times = timeRanges(body, occ);
  const ranges = combineRanges(files, times);
  const spans: InlineSpan[] = [];
  let cursor = 0;

  for (const r of ranges) {
    if (r.start > cursor) {
      spans.push({ kind: 'text', text: body.slice(cursor, r.start) });
    }
    if (r.kind === 'time') {
      spans.push({ kind: 'time', text: body.slice(r.start, r.end) });
    } else if (r.kind === 'fileRef' && r.path !== undefined && r.display) {
      const resolved = await Promise.resolve(
        options?.resolveFileRef?.(r.path) ?? {
          resolvedUri: undefined,
          fileExists: false,
        }
      );
      spans.push({
        kind: 'fileRef',
        text: r.display,
        rawPath: r.path,
        resolvedUri: resolved.resolvedUri,
        fileExists: resolved.fileExists,
      });
    }
    cursor = r.end;
  }
  if (cursor < body.length) {
    spans.push({ kind: 'text', text: body.slice(cursor) });
  }

  return spans.length ? spans : [{ kind: 'text', text: body }];
}
