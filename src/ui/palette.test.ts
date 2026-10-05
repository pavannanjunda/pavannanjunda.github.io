// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { mountPalette } from './palette';

const ITEMS = [
  { label: 'Projects', hint: 'section', route: 'projects' },
  { label: 'Beta Arm', hint: 'project', route: 'projects/beta-arm' },
  { label: 'Skills', hint: 'section', route: 'skills' },
];
const setup = (items = ITEMS) => {
  document.body.replaceChildren(); const host = document.createElement('div'); const opener = document.createElement('button');
  document.body.append(opener, host); const onPick = vi.fn();
  const palette = mountPalette(host, items, onPick);
  const box = host.querySelector<HTMLElement>('.palette')!; const input = host.querySelector<HTMLInputElement>('.palette-input')!;
  const options = () => [...host.querySelectorAll<HTMLElement>('.palette-item')];
  const type = (text: string) => { input.value = text; input.dispatchEvent(new Event('input', { bubbles: true })); };
  const key = (k: string) => { const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); input.dispatchEvent(e); return e; };
  const active = () => options().findIndex(o => o.getAttribute('aria-selected') === 'true');
  return { palette, box, input, options, type, key, active, onPick, opener };
};

test('is closed until opened, then lists everything with the first item active', () => {
  const { palette, box, input, options, active } = setup();
  expect(box.hidden).toBe(true); palette.open();
  expect(box.hidden).toBe(false); expect(document.activeElement).toBe(input);
  expect(options().map(o => o.textContent)).toEqual(['Projectssection', 'Beta Armproject', 'Skillssection']); expect(active()).toBe(0);
});
test('typing filters by label or hint, ignoring case', () => {
  const { palette, options, type } = setup(); palette.open();
  type('AR'); expect(options().length).toBe(1); type('project'); expect(options().length).toBe(2);
});
test('Enter picks the active item and closes', () => {
  const { palette, box, type, key, onPick } = setup(); palette.open(); type('arm');
  expect(key('Enter').defaultPrevented).toBe(true); expect(onPick).toHaveBeenCalledWith('projects/beta-arm'); expect(box.hidden).toBe(true);
});
test('arrow keys move the active item and wrap', () => {
  const { palette, key, active, onPick } = setup(); palette.open();
  key('ArrowUp'); expect(active()).toBe(2); key('ArrowDown'); expect(active()).toBe(0); key('ArrowDown'); key('ArrowDown');
  key('Enter'); expect(onPick).toHaveBeenCalledWith('skills');
});
test('clicking an item picks it', () => {
  const { palette, options, onPick } = setup(); palette.open(); options()[1].click(); expect(onPick).toHaveBeenCalledWith('projects/beta-arm');
});
test('Escape closes without picking and returns focus', () => {
  const { palette, box, key, onPick, opener } = setup(); opener.focus(); palette.open();
  key('Escape'); expect(box.hidden).toBe(true); expect(onPick).not.toHaveBeenCalled(); expect(document.activeElement).toBe(opener);
});
test('clicking the backdrop closes, clicking inside does not', () => {
  const { palette, box, input } = setup(); palette.open();
  input.dispatchEvent(new MouseEvent('click', { bubbles: true })); expect(box.hidden).toBe(false);
  box.dispatchEvent(new MouseEvent('click', { bubbles: true })); expect(box.hidden).toBe(true);
});
test('no match says so, and Enter does nothing', () => {
  const { palette, box, type, key, onPick } = setup(); palette.open(); type('zzz');
  expect(box.querySelector('.palette-empty')!.textContent).toBe('No matches'); key('Enter');
  expect(onPick).not.toHaveBeenCalled(); expect(box.hidden).toBe(false);
});
test('reopening starts from an empty search', () => {
  const { palette, input, options, type, key } = setup(); palette.open(); type('arm'); key('Escape'); palette.open();
  expect(input.value).toBe(''); expect(options().length).toBe(3);
});
test('labels are text, never markup', () => {
  const { palette, box } = setup([{ label: '<img src=x onerror=alert(1)>', hint: 'x', route: 'a' }]); palette.open();
  expect(box.querySelector('img')).toBeNull();
});
