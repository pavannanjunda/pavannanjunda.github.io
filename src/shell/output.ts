export type SpanStyle = 'accent' | 'dim' | 'error';
export interface Span { text: string; style?: SpanStyle; href?: string; command?: string }
export type Line = Span[];
export interface Result { lines: Line[]; clear?: boolean }

export function toText(result: Result): string {
  return result.lines.map(line => line.map(span => span.text).join('')).join('\n');
}
