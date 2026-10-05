import { expect, test } from 'vitest';
import { CONTENT } from './content';
import { validateContent } from './validate';

test('the real content is valid', () => expect(validateContent(CONTENT)).toEqual([]));
test('the real content is not the fixture', () => { expect(CONTENT.name).not.toBe('Test User'); expect(JSON.stringify(CONTENT)).not.toContain('example.com'); });
test('there is something to show', () => {
  expect(CONTENT.about.length).toBeGreaterThan(0); expect(CONTENT.projects.length).toBeGreaterThan(0);
  expect(CONTENT.contact.length).toBeGreaterThan(0); expect(CONTENT.tagline.length).toBeLessThanOrEqual(80);
});
test('project summaries fit on one line', () => {
  for (const project of CONTENT.projects) expect(project.summary.length).toBeLessThan(60);
});
