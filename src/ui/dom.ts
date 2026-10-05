import type { Link } from '../content/types';
import { isSafeHref } from '../content/validate';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('');

// An anchor for a safe href, plain text for anything else.
export function linkEl(link: Link, className = ''): HTMLElement {
  if (!isSafeHref(link.href)) return el('span', className, link.label);
  const a = el('a', className, link.label);
  a.href = link.href;
  if (link.href.startsWith('https://')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

export function button(label: string, onClick: () => void, className = 'btn'): HTMLButtonElement {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

export function panel(title: string, body: Node[], className = ''): HTMLElement {
  const node = el('section', `panel ${className}`.trim());
  const content = el('div', 'panel-body');
  content.append(...body);
  const head = el('h2', 'panel-head');
  head.append(el('span', 'panel-title', title));
  node.append(head, content);
  return node;
}

export const empty = (): HTMLElement => el('p', 'dim', 'Nothing here yet.');
