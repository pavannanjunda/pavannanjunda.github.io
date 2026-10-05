import { expect, test } from 'vitest';
import { FIXTURE } from './fixture';
import { isSafeHref, validateContent } from './validate';

const has = (problems: string[], path: string) => problems.some(p => p.startsWith(path));

test('isSafeHref allows https, mailto and relative paths', () => {
  for (const ok of ['https://a.dev/x', 'mailto:a@b.c', 'resume.pdf', './files/cv.pdf']) expect(isSafeHref(ok)).toBe(true);
});
test('isSafeHref rejects everything else', () => {
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,x', 'http://a.dev', '//evil.dev/x', '']) expect(isSafeHref(bad)).toBe(false);
});
test('the fixture is valid', () => expect(validateContent(FIXTURE)).toEqual([]));
test('reports empty required text', () => {
  const p = validateContent({ ...FIXTURE, name: ' ', tagline: '' });
  expect(has(p, 'name')).toBe(true); expect(has(p, 'tagline')).toBe(true);
});
test('reports a bad handle', () => expect(has(validateContent({ ...FIXTURE, handle: 'Test User' }), 'handle')).toBe(true));
test('reports bad, numeric and duplicate slugs', () => {
  const [a, b] = FIXTURE.projects;
  expect(has(validateContent({ ...FIXTURE, projects: [{ ...a, slug: 'Alpha Bot' }, b] }), 'projects[0].slug')).toBe(true);
  expect(has(validateContent({ ...FIXTURE, projects: [{ ...a, slug: '2' }, b] }), 'projects[0].slug')).toBe(true);
  expect(has(validateContent({ ...FIXTURE, projects: [a, { ...b, slug: 'alpha-bot' }] }), 'projects[1].slug')).toBe(true);
});
test('reports unsafe links wherever they appear', () => {
  const bad = { label: 'x', href: 'javascript:alert(1)' };
  expect(has(validateContent({ ...FIXTURE, contact: [bad] }), 'contact[0].href')).toBe(true);
  expect(has(validateContent({ ...FIXTURE, projects: [{ ...FIXTURE.projects[0], links: [bad] }] }), 'projects[0].links[0].href')).toBe(true);
  expect(has(validateContent({ ...FIXTURE, resumeHref: 'http://a.dev/cv.pdf' }), 'resumeHref')).toBe(true);
});
