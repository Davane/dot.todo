export type InlineSpanKind = 'text' | 'time' | 'fileRef';

export interface InlineSpanText {
  kind: 'text';
  text: string;
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

export type InlineSpan = InlineSpanText | InlineSpanTime | InlineSpanFileRef;

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

export interface ParsedPlain {
  type: 'plain';
  line: number;
  text: string;
}

export type ParsedLine =
  | ParsedEmpty
  | ParsedSection
  | ParsedTodoItem
  | ParsedPlain;

export interface TodoDocumentModel {
  revision: number;
  lines: ParsedLine[];
}
