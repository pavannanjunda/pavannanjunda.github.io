import { expect, test } from 'vitest';
import { FIXTURE } from '../content/fixture';
import { complete } from './complete';

const c = (s: string) => complete(s, FIXTURE);

test('a unique command prefix completes with a trailing space', () => expect(c('pro')).toEqual({ value: 'projects ', options: [] }));
test('an ambiguous prefix completes to the common prefix and lists options', () =>
  expect(c('e')).toEqual({ value: 'e', options: ['experience', 'education'] }));
test('no match leaves the input alone', () => expect(c('zz')).toEqual({ value: 'zz', options: [] }));
test('completes a project slug', () => expect(c('projects al')).toEqual({ value: 'projects alpha-bot ', options: [] }));
test('lists all slugs after a bare "projects "', () => expect(c('projects ')).toEqual({ value: 'projects ', options: ['alpha-bot', 'beta-arm'] }));
test('commands without arguments complete nothing after the name', () => expect(c('about x')).toEqual({ value: 'about x', options: [] }));
test('is case-insensitive', () => expect(c('PRO').value).toBe('projects '));
test('completes a section after open', () => expect(c('open sk')).toEqual({ value: 'open skills ', options: [] }));
