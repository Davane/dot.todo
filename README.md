# .todo — VS Code extension

Interactive editor for plain-text `.todo` files. The file on disk is always the source of truth: no database or hidden storage.

## Features

- Opens `*.todo` in a custom todo view by default (use **Reopen Editor With… → Text Editor** for raw text).
- Checklist items: `- [ ]` / `- [x]` (also `*` / `+`).
- Section titles: `# Section name` (requires a space after `#`).
- Highlights time-like phrases (`3pm`, `10:30 am`, `tomorrow 9am`, `14:30`, etc.).
- `@path` references: click to open relative to the `.todo` file’s folder, then the first workspace folder root.
- **Hide completed** toggle (UI only; does not change the file).

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
