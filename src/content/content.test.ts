import { expect, test } from 'vitest';
import html from '../../index.html?raw';
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

// index.html repeats a little content for crawlers, link previews and
// visitors without JavaScript; this keeps it from going stale.
test('index.html agrees with the content', () => {
  const escaped = (text: string) => text.replaceAll('&', '&amp;');
  expect(html).toContain(`<title>${escaped(CONTENT.name)}`); expect(html).toContain(escaped(CONTENT.tagline));
  for (const link of CONTENT.contact) expect(html).toContain(`href="${link.href}"`);
});
test('index.html has a favicon and a link preview', () => {
  for (const needle of ['rel="icon"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'property="og:url"', 'name="twitter:card"']) expect(html).toContain(needle);
  expect(html).toMatch(/property="og:image" content="https:\/\//);
});
