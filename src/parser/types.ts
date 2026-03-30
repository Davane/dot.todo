export type InlineSpanKind = 'text' | 'html' | 'time' | 'fileRef';

export interface InlineSpanText {
  kind: 'text';
  text: string;
}

/** Host-sanitized inline HTML (bold, italic, code, strikethrough, etc.) */
export interface InlineSpanHtml {
  kind: 'html';
  html: string;
}

export interface InlineSpanTime {
  kind: 'time';
  text: string;
}

export interface InlineSpanFileRef {
  kind: 'fileRef';
  /** Display text including @ */
  text: string;
  /** Path without @, after trim */
  rawPath: string;
  /** Resolved URI string when known */
  resolvedUri?: string;
  fileExists: boolean;
}

export type InlineSpan =
  | InlineSpanText
  | InlineSpanHtml
  | InlineSpanTime
  | InlineSpanFileRef;

export interface ParsedEmpty {
  type: 'empty';
  line: number;
}

export interface ParsedSection {
  type: 'section';
  line: number;
  title: string;
}

export interface ParsedTodoItem {
  type: 'todo';
  line: number;
  checked: boolean;
  bullet: string;
  spans: InlineSpan[];
}

/** Raw source line (for debugging); `html` is host-sanitized block markdown. */
export interface ParsedPlain {
  type: 'plain';
  line: number;
  text: string;
  html: string;
}

export interface ParsedCodeBlock {
  type: 'codeBlock';
  /** Opening fence line index */
  line: number;
  language: string;
  code: string;
}

export type ParsedLine =
  | ParsedEmpty
  | ParsedSection
  | ParsedTodoItem
  | ParsedPlain
  | ParsedCodeBlock;

export interface TodoDocumentModel {
  revision: number;
  lines: ParsedLine[];
}
