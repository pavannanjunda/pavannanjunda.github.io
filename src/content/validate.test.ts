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

test('reports unsafe or undescribed project media', () => {
  const [a] = FIXTURE.projects;
  const p = validateContent({ ...FIXTURE, projects: [{ ...a, media: [{ src: 'javascript:alert(1)', alt: 'x' }, { src: 'projects/a.png', alt: ' ' }] }] });
  expect(has(p, 'projects[0].media[0].src')).toBe(true); expect(has(p, 'projects[0].media[1].alt')).toBe(true);
  expect(validateContent({ ...FIXTURE, projects: [{ ...a, media: [{ src: 'projects/a.png', alt: 'The rig' }] }] })).toEqual([]);
});
test('reports an unsafe certificate link and a bad GitHub user', () => {
  const cert = { name: 'ML', issuer: 'Udemy', year: '2025' };
  expect(validateContent({ ...FIXTURE, certifications: [cert], githubUser: 'test-user' })).toEqual([]);
  expect(has(validateContent({ ...FIXTURE, certifications: [{ ...cert, href: 'http://a.dev' }] }), 'certifications[0].href')).toBe(true);
  expect(has(validateContent({ ...FIXTURE, githubUser: 'a/b?x' }), 'githubUser')).toBe(true);
});
test('reports an unsafe site repository link', () => {
  expect(has(validateContent({ ...FIXTURE, site: { repo: 'http://a.dev', points: [] } }), 'site.repo')).toBe(true);
});
