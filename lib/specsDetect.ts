// Finds where a copy-pasted "Дополнительные характеристики:"-style bullet
// list starts inside free-form text, so we can offer to split it out into
// the specs field instead of leaving it stuck in the description. Shared
// between the "add item" form and the item edit page.
export function findSpecsBlockStart(text: string): number | null {
  const lines = text.split("\n");
  // A "spec line" is a short label followed by a value after a colon —
  // with or without a leading bullet marker. Capped label length so an
  // ordinary sentence that happens to contain a colon doesn't match.
  const specLine = /^\s*(?:[*•\-]\s*)?[^\s:][^:]{1,45}:\s*\S.*/;
  const headingLine = /^\s*(дополнительные\s+)?характеристики:?\s*$/i;

  let offset = 0;
  let consecutiveSpecLines = 0;
  let blockStart: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (headingLine.test(line)) {
      return offset;
    }
    if (specLine.test(line)) {
      if (consecutiveSpecLines === 0) blockStart = offset;
      consecutiveSpecLines++;
      if (consecutiveSpecLines >= 3) return blockStart;
    } else if (line.trim() !== "") {
      consecutiveSpecLines = 0;
      blockStart = null;
    }
    offset += line.length + 1;
  }
  return null;
}
