// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { renderLine } from './render';

test('plain and styled spans', () => {
  const el = renderLine([{ text: 'a' }, { text: 'b', style: 'error' }], () => {});
  expect(el.className).toBe('line'); expect(el.textContent).toBe('ab'); expect(el.querySelector('.error')!.textContent).toBe('b');
});
test('safe links open in a new tab', () => {
  const a = renderLine([{ text: 'code', href: 'https://example.com' }], () => {}).querySelector('a')!;
  expect(a.getAttribute('href')).toBe('https://example.com'); expect(a.target).toBe('_blank'); expect(a.rel).toBe('noopener noreferrer');
});
test('mailto and relative links stay in the same tab', () => {
  expect(renderLine([{ text: 'x', href: 'mailto:a@b.c' }], () => {}).querySelector('a')!.hasAttribute('target')).toBe(false);
});
test('unsafe links render as text', () => {
  const el = renderLine([{ text: 'x', href: 'javascript:alert(1)' }], () => {});
  expect(el.querySelector('a')).toBeNull(); expect(el.textContent).toBe('x');
});
test('command spans are buttons that run the command', () => {
  const seen: string[] = [];
  const b = renderLine([{ text: 'about', command: 'about' }], c => seen.push(c)).querySelector('button')!;
  expect(b.type).toBe('button'); b.click(); expect(seen).toEqual(['about']);
});
test('an empty line still takes up a row', () => expect(renderLine([], () => {}).textContent).toBe(' '));
