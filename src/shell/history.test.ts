import { expect, test } from 'vitest';
import { History } from './history';

test('prev on empty history is undefined', () => expect(new History().prev()).toBeUndefined());
test('walks back and stops at the oldest', () => {
  const h = new History(); h.push('a'); h.push('b');
  expect(h.prev()).toBe('b'); expect(h.prev()).toBe('a'); expect(h.prev()).toBe('a');
});
test('walks forward to an empty line', () => {
  const h = new History(); h.push('a'); h.push('b'); h.prev(); h.prev();
  expect(h.next()).toBe('b'); expect(h.next()).toBe(''); expect(h.next()).toBe('');
});
test('skips blanks and consecutive duplicates', () => {
  const h = new History(); h.push('a'); h.push('  '); h.push('a');
  expect(h.prev()).toBe('a'); expect(h.prev()).toBe('a'); h.push('b'); h.push('a');
  expect(h.prev()).toBe('a'); expect(h.prev()).toBe('b');
});
test('push resets the cursor', () => { const h = new History(); h.push('a'); h.push('b'); h.prev(); h.prev(); h.push('c'); expect(h.prev()).toBe('c'); });
test('keeps only the newest entries', () => {
  const h = new History(2); h.push('a'); h.push('b'); h.push('c');
  expect(h.prev()).toBe('c'); expect(h.prev()).toBe('b'); expect(h.prev()).toBe('b');
});
