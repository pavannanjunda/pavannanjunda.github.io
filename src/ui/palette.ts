import { el } from './dom';

export interface PaletteItem { label: string; hint: string; route: string }

// A search box over a list of places to go. Arrow keys move, Enter picks,
// Escape or a click outside closes.
export function mountPalette(
  host: HTMLElement,
  items: PaletteItem[],
  onPick: (route: string) => void,
): { open(): void; close(): void } {
  const overlay = el('div', 'palette');
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Go to');
  const box = el('div', 'palette-box');
  const input = el('input', 'palette-input');
  input.type = 'text';
  input.placeholder = 'Jump to a section or project…';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Search sections and projects');
  const list = el('div', 'palette-list');
  list.setAttribute('role', 'listbox');
  box.append(input, list);
  overlay.append(box);
  host.append(overlay);

  let matches: PaletteItem[] = [];
  let active = 0;
  let opener: Element | null = null;

  const close = (restoreFocus: boolean) => {
    overlay.hidden = true;
    if (restoreFocus && opener instanceof HTMLElement) opener.focus();
  };

  const pick = (item: PaletteItem) => {
    close(false);
    onPick(item.route);
  };

  const render = () => {
    const query = input.value.trim().toLowerCase();
    matches = items.filter(item => `${item.label} ${item.hint}`.toLowerCase().includes(query));
    active = Math.min(active, Math.max(0, matches.length - 1));
    if (matches.length === 0) {
      list.replaceChildren(el('div', 'palette-empty', 'No matches'));
      return;
    }
    list.replaceChildren(...matches.map((item, i) => {
      const option = el('button', 'palette-item');
      option.type = 'button';
      option.tabIndex = -1;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(i === active));
      option.append(el('span', 'palette-label', item.label), el('span', 'palette-hint', item.hint));
      option.addEventListener('click', () => pick(item));
      return option;
    }));
    list.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  };

  input.addEventListener('input', () => {
    active = 0;
    render();
  });

  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (matches.length === 0) return;
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      render();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (matches[active]) pick(matches[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
  });

  overlay.addEventListener('click', event => {
    if (event.target === overlay) close(true);
  });

  return {
    open() {
      opener = host.ownerDocument.activeElement;
      input.value = '';
      active = 0;
      overlay.hidden = false;
      render();
      input.focus();
    },
    close: () => close(true),
  };
}
