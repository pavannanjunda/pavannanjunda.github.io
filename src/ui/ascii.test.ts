import { expect, test } from 'vitest';
import { asciiBanner } from './ascii';

test('draws five rows of equal width', () => {
  const rows = asciiBanner('AB');
  expect(rows.length).toBe(5);
  expect(new Set(rows.map(r => r.length)).size).toBe(1);
  expect(rows[0]).toBe(' ███  ████ ');
});
test('is case-insensitive and keeps word gaps', () => {
  expect(asciiBanner('a b')).toEqual(asciiBanner('A B'));
  expect(asciiBanner('A B')[0].length).toBeGreaterThan(asciiBanner('AB')[0].length);
});
test('skips characters it cannot draw', () => expect(asciiBanner('A-1é')).toEqual(asciiBanner('A')));
test('draws nothing for a name with no letters', () => expect(asciiBanner('123')).toEqual([]));
