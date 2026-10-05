export type SpanStyle = 'accent' | 'dim' | 'error';
export interface Span { text: string; style?: SpanStyle; href?: string; command?: string }
export type Line = Span[];
// `navigate` names a dashboard section the UI should switch to.
export interface Result { lines: Line[]; clear?: boolean; navigate?: string }

export function toText(result: Result): string {
  return result.lines.map(line => line.map(span => span.text).join('')).join('\n');
}
