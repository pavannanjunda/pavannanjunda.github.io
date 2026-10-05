// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { FIXTURE } from '../content/fixture';
import { mountTerminal, readHashCommand } from './terminal';

const setup = (options?: { initialCommand?: string }) => {
  document.body.replaceChildren(); const root = document.createElement('div'); document.body.append(root);
  const term = mountTerminal(root, FIXTURE, options);
  const input = root.querySelector<HTMLInputElement>('#cmd')!;
  const out = () => root.querySelector('.output')!.textContent!;
  const submit = (s: string) => { input.value = s; root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); };
  const key = (k: string, init: KeyboardEventInit = {}) => { const e = new KeyboardEvent('keydown', { key: k, cancelable: true, bubbles: true, ...init }); input.dispatchEvent(e); return e; };
  return { root, term, input, out, submit, key };
};

test('shows the banner, prompt and chips', () => {
  const { root, out } = setup();
  expect(out()).toContain('Test User'); expect(out()).toContain('Robotics engineer'); expect(out()).toContain("Type 'help' or tap a command below.");
  expect(root.querySelector('.prompt')!.textContent).toBe('test@portfolio:~$');
  expect([...root.querySelectorAll('.chip')].map(b => b.textContent)).toEqual(['help', 'about', 'experience', 'education', 'projects', 'skills', 'contact', 'resume']);
  expect(root.querySelector('.output')!.getAttribute('role')).toBe('log');
});
test('submitting echoes the input, prints output and empties the field', () => {
  const { root, input, out, submit } = setup(); submit('about');
  expect(root.querySelector('.echo')!.textContent).toBe('test@portfolio:~$ about'); expect(out()).toContain('First paragraph.'); expect(input.value).toBe('');
});
test('empty Enter prints a bare prompt and records no history', () => {
  const { root, input, submit, key } = setup(); submit('   ');
  expect(root.querySelectorAll('.echo').length).toBe(1); expect(root.querySelector('.error')).toBeNull();
  key('ArrowUp'); expect(input.value).toBe('');
});
test('echoes markup as text', () => {
  const { root, out, submit } = setup(); submit('<img src=x onerror=alert(1)>');
  expect(root.querySelector('img')).toBeNull(); expect(out()).toContain('<img src=x onerror=alert(1)>');
});
test('a chip runs its command', () => {
  const { root, out } = setup(); [...root.querySelectorAll<HTMLButtonElement>('.chip')].find(b => b.textContent === 'skills')!.click();
  expect(out()).toContain('Languages');
});
test('a tappable name in the output runs its command', () => {
  const { root, out, submit } = setup(); submit('projects');
  root.querySelector<HTMLButtonElement>('.output button')!.click(); expect(out()).toContain('Alpha Bot');
});
test('clear and Ctrl+L empty the output', () => {
  const { root, submit, key } = setup(); submit('about'); submit('clear'); expect(root.querySelector('.output')!.children.length).toBe(0);
  submit('about'); expect(key('l', { ctrlKey: true }).defaultPrevented).toBe(true); expect(root.querySelector('.output')!.children.length).toBe(0);
});
test('arrow keys walk history', () => {
  const { input, submit, key } = setup(); submit('about'); submit('skills');
  key('ArrowUp'); expect(input.value).toBe('skills'); key('ArrowUp'); expect(input.value).toBe('about'); key('ArrowDown'); key('ArrowDown'); expect(input.value).toBe('');
});
test('Tab completes, and lists options when ambiguous', () => {
  const { input, out, key } = setup(); input.value = 'pro';
  expect(key('Tab').defaultPrevented).toBe(true); expect(input.value).toBe('projects ');
  input.value = 'e'; key('Tab'); expect(out()).toContain('experience  education');
});
test('Tab on an empty input is left to the browser', () => expect(setup().key('Tab').defaultPrevented).toBe(false));
test('an initial command runs after the banner', () => { const { out } = setup({ initialCommand: 'projects 1' }); expect(out()).toContain('Alpha Bot'); });
test('readHashCommand decodes a hash', () => {
  expect(readHashCommand('#projects%20alpha-bot')).toBe('projects alpha-bot'); expect(readHashCommand('')).toBeUndefined(); expect(readHashCommand('#')).toBeUndefined();
});
test('survives a malformed hash', () => {
  expect(readHashCommand('#%E0%A4%A')).toBeUndefined();
  const { out } = setup({ initialCommand: 'nonsense' }); expect(out()).toContain('Test User'); expect(out()).toContain('command not found: nonsense');
});

test('an initial command leaves the banner on screen, later commands scroll', () => {
  const scroll = vi.fn(); HTMLElement.prototype.scrollIntoView = scroll;
  try {
    const { submit } = setup({ initialCommand: 'experience' }); expect(scroll).not.toHaveBeenCalled();
    submit('about'); expect(scroll).toHaveBeenCalled();
  } finally { delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView; }
});
test('readHashCommand flattens whitespace and caps the length', () => {
  expect(readHashCommand('#x%0AURGENT%20%20moved%09here')).toBe('x URGENT moved here');
  expect(readHashCommand('#' + 'a'.repeat(300))!.length).toBe(100);
  expect(readHashCommand('#%20%0A')).toBeUndefined();
});
test('Shift+Tab is left to the browser', () => {
  const { input, key } = setup(); input.value = 'pro';
  expect(key('Tab', { shiftKey: true }).defaultPrevented).toBe(false); expect(input.value).toBe('pro');
});
test('Tab that completes nothing is left to the browser', () => {
  const { input, key } = setup(); input.value = 'about x y';
  expect(key('Tab').defaultPrevented).toBe(false);
});
test('keys pressed during IME composition are ignored', () => {
  const { input, submit, key } = setup(); submit('about'); input.value = 'draft';
  expect(key('ArrowUp', { isComposing: true }).defaultPrevented).toBe(false); expect(input.value).toBe('draft');
});
test('a keydown without a key does not throw', () => {
  const { input } = setup(); const errors: unknown[] = [];
  const onError = (e: ErrorEvent) => { errors.push(e.error); e.preventDefault(); };
  window.addEventListener('error', onError);
  input.dispatchEvent(new Event('keydown', { bubbles: true }));
  window.removeEventListener('error', onError);
  expect(errors).toEqual([]);
});
