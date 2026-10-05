// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { FIXTURE } from '../content/fixture';
import type { Content } from '../content/types';
import { SECTIONS, mountDashboard } from './dashboard';

const setup = (route?: string, content: Content = FIXTURE) => {
  document.body.replaceChildren(); const root = document.createElement('div'); document.body.append(root);
  const routes: string[] = [];
  const dash = mountDashboard(root, content, { initialRoute: route, onNavigate: r => routes.push(r) });
  const view = () => root.querySelector('.view')!;
  const navButton = (id: string) => root.querySelector<HTMLButtonElement>(`.sidebar [data-section="${id}"]`)!;
  const current = () => root.querySelector('.sidebar [aria-current="page"]')!.getAttribute('data-section');
  return { root, dash, routes, view, navButton, current };
};

test('sections are in a fixed order', () => expect(SECTIONS.map(s => s.id)).toEqual(
  ['terminal', 'dashboard', 'about', 'experience', 'education', 'projects', 'skills', 'contact']));
test('the sidebar shows the brand, every section and who is online', () => {
  const { root } = setup();
  expect(root.classList.contains('dash')).toBe(true);
  expect(root.querySelector('.brand')!.textContent).toBe('TEST_USER');
  expect([...root.querySelectorAll('.sidebar [data-section]')].map(b => b.textContent)).toEqual(SECTIONS.map(s => s.label));
  expect(root.querySelector('.operator .avatar')!.textContent).toBe('TU');
  expect(root.querySelector('.operator')!.textContent).toContain('TEST');
});
test('opens on the terminal, which is first in the sidebar', () => {
  const { root, view, current, routes } = setup();
  expect(current()).toBe('terminal'); expect(routes).toEqual([]);
  expect(root.querySelector('.sidebar [data-section]')!.getAttribute('data-section')).toBe('terminal');
  expect(root.querySelector('.nav-group')).toBeNull();
  expect(root.querySelector('.crumbs')!.textContent).toBe('ROOT / PORTFOLIO / TERMINAL');
  expect(view().querySelector('.hero .index')!.textContent).toBe('01');
  expect(view().querySelector('#cmd')).not.toBeNull();
});
test('the dashboard overview introduces the owner', () => {
  const { root, view, current } = setup('dashboard');
  expect(current()).toBe('dashboard');
  expect(root.querySelector('.crumbs')!.textContent).toBe('ROOT / PORTFOLIO / DASHBOARD');
  expect(view().querySelector('.hero h1')!.textContent).toBe('TEST USER');
  expect(view().querySelector('.hero')!.textContent).toContain('Robotics engineer');
  expect(view().querySelector('.hero .index')!.textContent).toBe('02');
});
test('the overview summarises the content without inventing numbers', () => {
  const { view } = setup('dashboard'); const text = view().textContent!;
  const stat = (label: string) => [...view().querySelectorAll('.stat')].find(s => s.querySelector('.stat-label')!.textContent === label)!.querySelector('.stat-value')!.textContent;
  expect(stat('PROJECTS')).toBe('02'); expect(stat('ROLES')).toBe('01'); expect(stat('SKILLS')).toBe('02');
  expect(text).toContain('Engineer'); expect(text).toContain('Acme Robotics');
  expect(text).toContain('alpha-bot'); expect(text).toContain('C++, ROS 2');
  expect(view().querySelector('a[href="mailto:test@example.com"]')).not.toBeNull();
});
test('a sidebar button switches section and reports the route', () => {
  const { root, view, navButton, current, routes } = setup(); navButton('skills').click();
  expect(current()).toBe('skills'); expect(routes).toEqual(['skills']);
  expect(root.querySelector('.crumbs')!.textContent).toBe('ROOT / PORTFOLIO / SKILLS');
  expect(view().querySelector('.hero .index')!.textContent).toBe('07');
  expect(view().textContent).toContain('Languages'); expect([...view().querySelectorAll('.tag')].map(t => t.textContent)).toEqual(['C++', 'Python']);
});
test('showing the current route again does nothing', () => {
  const { dash, routes } = setup(); dash.show('about'); dash.show('about'); expect(routes).toEqual(['about']);
});
test('about, experience and education show their entries', () => {
  const { dash, view } = setup();
  dash.show('about'); expect([...view().querySelectorAll('.panel p')].map(p => p.textContent)).toEqual(['First paragraph.', 'Second paragraph.']);
  dash.show('experience'); expect(view().textContent).toContain('Engineer'); expect(view().textContent).toContain('Acme Robotics'); expect(view().textContent).toContain('Built a thing.');
  dash.show('education'); expect(view().textContent).toContain('B.E. Mechanical'); expect(view().textContent).toContain('Test University'); expect(view().textContent).toContain('2022 – 2026');
});
test('an entry without highlights has no empty list', () => {
  const job = { ...FIXTURE.experience[0], highlights: [] };
  const { view } = setup('experience', { ...FIXTURE, experience: [job] });
  expect(view().querySelector('ul')).toBeNull();
});
test('projects lists every project and shows the first one', () => {
  const { view } = setup('projects');
  expect([...view().querySelectorAll('.project-row')].map(r => r.getAttribute('data-slug'))).toEqual(['alpha-bot', 'beta-arm']);
  const detail = view().querySelector('.project-detail')!;
  expect(detail.textContent).toContain('Alpha Bot'); expect(detail.textContent).toContain('Detail one.');
  expect(detail.querySelector('a[href="https://example.com/alpha"]')).not.toBeNull();
  expect(view().querySelector('.project-row[aria-selected="true"]')!.getAttribute('data-slug')).toBe('alpha-bot');
});
test('choosing a project shows it and reports its route', () => {
  const { view, routes } = setup('projects');
  view().querySelector<HTMLButtonElement>('.project-row[data-slug="beta-arm"] button')!.click();
  expect(view().querySelector('.project-detail')!.textContent).toContain('Beta Arm'); expect(routes).toEqual(['projects/beta-arm']);
  expect(view().querySelector('.project-detail')!.textContent).not.toContain('STACK');
});
test('a route can name a project, and an unknown one falls back to the first', () => {
  expect(setup('projects/beta-arm').view().querySelector('.project-detail')!.textContent).toContain('Beta Arm');
  expect(setup('projects/nope').view().querySelector('.project-detail')!.textContent).toContain('Alpha Bot');
});
test('a project on the overview opens that project', () => {
  const { view, current } = setup('dashboard');
  view().querySelector<HTMLButtonElement>('.project-row[data-slug="beta-arm"] button')!.click();
  expect(current()).toBe('projects'); expect(view().querySelector('.project-detail')!.textContent).toContain('Beta Arm');
});
test('contact lists safe links and a resume only when one is published', () => {
  const { view } = setup('contact');
  expect(view().querySelector('a[href="https://github.com/test"]')!.getAttribute('rel')).toBe('noopener noreferrer');
  expect(view().querySelector('a[href="resume.pdf"]')).not.toBeNull();
  const bad = setup('contact', { ...FIXTURE, resumeHref: undefined, contact: [{ label: 'x', href: 'javascript:alert(1)' }] });
  expect(bad.view().querySelector('a')).toBeNull(); expect(bad.view().textContent).toContain('x');
});
test('an unknown or malformed route opens the terminal', () => {
  for (const route of ['nonsense', '<img src=x onerror=alert(1)>', '']) {
    const { root, current } = setup(route); expect(current()).toBe('terminal'); expect(root.querySelector('img')).toBeNull();
  }
});
test('the terminal section runs commands and keeps its history between visits', () => {
  const { dash, view } = setup('terminal');
  expect(view().querySelector('.titlebar')).toBeNull();
  const input = view().querySelector<HTMLInputElement>('#cmd')!; input.value = 'about';
  view().querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  expect(view().querySelector('.output')!.textContent).toContain('First paragraph.');
  dash.show('about'); dash.show('terminal'); expect(view().querySelector('.output')!.textContent).toContain('First paragraph.');
});
test('an empty portfolio still renders every section', () => {
  const empty: Content = { ...FIXTURE, about: [], experience: [], education: [], projects: [], skills: [], contact: [], resumeHref: undefined };
  const { dash, view } = setup(undefined, empty);
  for (const section of SECTIONS) { dash.show(section.id); expect(view().querySelector('.hero')).not.toBeNull(); }
});
