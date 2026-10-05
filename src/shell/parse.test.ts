import { expect, test } from 'vitest';
import { parseInput } from './parse';

test('blank input is null', () => { expect(parseInput('')).toBeNull(); expect(parseInput('   \t ')).toBeNull(); });
test('splits name and args', () => expect(parseInput('projects alpha-bot')).toEqual({ name: 'projects', args: ['alpha-bot'] }));
test('ignores case and extra whitespace', () => expect(parseInput('  Projects  Alpha-Bot ')).toEqual({ name: 'projects', args: ['alpha-bot'] }));
