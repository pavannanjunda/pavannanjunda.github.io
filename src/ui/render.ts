import { isSafeHref } from '../content/validate';
import type { Line, Span } from '../shell/output';

const NBSP = ' ';

function renderSpan(span: Span, onCommand: (command: string) => void): HTMLElement {
  let el: HTMLElement;
  if (span.href !== undefined && isSafeHref(span.href)) {
    const a = document.createElement('a');
    a.href = span.href;
    if (span.href.startsWith('https://')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    el = a;
  } else if (span.command !== undefined) {
    const command = span.command;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cmd-link';
    button.addEventListener('click', () => onCommand(command));
    el = button;
  } else {
    el = document.createElement('span');
  }
  if (span.style) el.classList.add(span.style);
  el.textContent = span.text;
  return el;
}

export function renderLine(line: Line, onCommand: (command: string) => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'line';
  if (line.length === 0) el.textContent = NBSP;
  else el.append(...line.map(span => renderSpan(span, onCommand)));
  return el;
}
