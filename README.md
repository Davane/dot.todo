# .todo — VS Code extension

Interactive editor for plain-text `.todo` files. The file on disk is always the source of truth: no database or hidden storage.

## Features

- Opens `*.todo` in a custom todo view by default (use **Reopen Editor With… → Text Editor** for raw text).
- Checklist items: `- [ ]` / `- [x]` (also `*` / `+`).
- Section titles: `# Section name` (requires a space after `#`).
- Highlights time-like phrases (`3pm`, `10:30 am`, `tomorrow 9am`, `14:30`, etc.).
- `@path` references: click to open relative to the `.todo` file’s folder, then the first workspace folder root.
- **Hide completed** toggle (UI only; does not change the file).
- **Markdown (rendered in the UI only)** — processed with `markdown-it`, then sanitized (no raw HTML, links, or images).

### Markdown rules

- **`# Title` with a single `#` and a space** is the native **section** header (not ATX markdown). Use **`##`–`######`** on a **plain line** for markdown headings.
- **Checklist lines** support **inline** markdown only: **bold**, *italic*, `` `inline code` ``, ~~strikethrough~~, plus existing **@paths** and **time** highlights. Multiline fenced code inside one checklist line is not supported.
- **Plain lines** use block markdown per line: headings (`##` …), horizontal rules (`---`, `***`, or `___` alone on a line), and paragraphs.
- **Fenced code blocks** use consecutive lines: opening ` ``` ` (optional language id), body, closing ` ``` `.

## Format example

```text
# Today
- [ ] Review @src/extension.ts at 10:30am
- [x] Update README
- [ ] Check @docs/spec.md tomorrow 2pm

# Later
- [ ] Refactor @lib/parser.ts
```

Path references stop at whitespace; trailing `.,;:!?)]}` is trimmed from the path.

## Development

```bash
npm install
npm run compile
```

Press F5 in VS Code with this folder open to launch the **Extension Development Host**, then open a `.todo` file.

## Packaging

```bash
npx @vscode/vsce package
```

The published bundle includes compiled output under `out/` and web assets under `src/webview/media/`.
