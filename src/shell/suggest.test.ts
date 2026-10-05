import { expect, test } from 'vitest';
import { suggest } from './suggest';

const names = ['help', 'about', 'projects', 'skills'];
test('suggests the nearest command', () => { expect(suggest('projcts', names)).toBe('projects'); expect(suggest('abuot', names)).toBe('about'); });
test('gives nothing when nothing is close', () => expect(suggest('xyzzy', names)).toBeUndefined());
test('first candidate wins a tie', () => expect(suggest('ab', ['abc', 'abd'])).toBe('abc'));
