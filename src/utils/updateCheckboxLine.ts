const CHECKLIST_LINE = /^\s*([-+*])\s+\[([ xX])\]\s+(.*)$/;

/**
 * Toggle `[ ]` ↔ `[x]` on a single line. Returns null if the line is not a checklist item.
 */
export function updateCheckboxLine(lineText: string): string | null {
  if (!CHECKLIST_LINE.test(lineText)) {
    return null;
  }
  const open = lineText.indexOf('[');
  const close = lineText.indexOf(']', open + 1);
  if (open === -1 || close === -1) {
    return null;
  }
  const inner = lineText.slice(open + 1, close);
  const checked = inner === 'x' || inner === 'X';
  const newInner = checked ? ' ' : 'x';
  return lineText.slice(0, open + 1) + newInner + lineText.slice(close);
}
