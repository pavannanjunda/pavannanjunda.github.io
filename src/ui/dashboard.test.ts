// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
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
  ['terminal', 'dashboard', 'about', 'experience', 'education', 'certifications', 'projects', 'skills', 'contact']));
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
  expect(view().querySelector('.hero')).toBeNull();
  expect(view().querySelector('#cmd')).not.toBeNull();
});
test('the dashboard overview introduces the owner', () => {
  const { root, view, current } = setup('dashboard');
  expect(current()).toBe('dashboard');
  expect(root.querySelector('.crumbs')!.textContent).toBe('ROOT / PORTFOLIO / OVERVIEW');
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
  expect(view().querySelector('.hero .index')!.textContent).toBe('08');
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
  for (const section of SECTIONS) { dash.show(section.id); expect(view().querySelector('.panel, .hero')).not.toBeNull(); }
});

const press = (target: EventTarget, key: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }); target.dispatchEvent(e); return e;
};
test('typing open in the terminal switches section', () => {
  const { view, current, routes } = setup();
  view().querySelector<HTMLInputElement>('#cmd')!.value = 'open projects';
  view().querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  expect(current()).toBe('projects'); expect(routes).toEqual(['projects']);
});
test('number keys switch sections', () => {
  const { current, navButton } = setup();
  expect(navButton('about').dataset.key).toBe('3');
  press(document.body, '3'); expect(current()).toBe('about');
  press(document.body, '0'); expect(current()).toBe('about');
  press(document.body, '2', { ctrlKey: true }); expect(current()).toBe('about');
});
test('number keys are left alone while typing', () => {
  const { view, current } = setup();
  press(view().querySelector('#cmd')!, '2'); expect(current()).toBe('terminal');
});
test('slash jumps to the terminal prompt', () => {
  const { view, current } = setup('about');
  expect(press(document.body, '/').defaultPrevented).toBe(true);
  expect(current()).toBe('terminal'); expect(document.activeElement).toBe(view().querySelector('#cmd'));
});
test('a dashboard that has left the page ignores keys', () => {
  const old = setup('about'); const oldRoot = old.root; setup();
  press(document.body, '4'); expect(oldRoot.querySelector('.sidebar [aria-current="page"]')!.getAttribute('data-section')).toBe('about');
});
test('the top bar shows a clock', () => {
  expect(setup().root.querySelector('.clock')!.textContent).toMatch(/^\d\d:\d\d:\d\d$/);
});

test('the overview has no map', () => {
  const { view } = setup('dashboard'); expect(view().querySelector('.map, svg')).toBeNull();
});
test('the theme toggle switches between light and dark and says which', () => {
  const { root } = setup(); const html = document.documentElement; const toggle = root.querySelector<HTMLButtonElement>('.theme-toggle')!;
  const before = html.dataset.theme!; expect(['light', 'dark']).toContain(before);
  toggle.click(); expect(html.dataset.theme).toBe(before === 'dark' ? 'light' : 'dark');
  expect(toggle.getAttribute('aria-pressed')).toBe(String(html.dataset.theme === 'dark'));
  toggle.click(); expect(html.dataset.theme).toBe(before);
});

test('each experience is a closed dropdown that holds its details', () => {
  const extra = { company: 'Beta Labs', role: 'Intern', start: '2025', end: '2025', highlights: [] };
  const { view } = setup('experience', { ...FIXTURE, experience: [...FIXTURE.experience, extra] });
  const items = [...view().querySelectorAll<HTMLDetailsElement>('details.entry')];
  expect(items.length).toBe(2); expect(items.every(d => !d.open)).toBe(true);
  const summary = items[0].querySelector('summary')!;
  expect(summary.textContent).toContain('Engineer'); expect(summary.textContent).toContain('Acme Robotics'); expect(summary.textContent).toContain('2026-04 – present');
  expect(summary.textContent).not.toContain('Built a thing.');
  expect(items[0].querySelector('.entry-body')!.textContent).toContain('Built a thing.');
  expect(items[1].querySelector('.entry-body')!.textContent).toBe('No details added yet.');
});

test('Ctrl+K opens the palette, even while typing, and picking navigates', () => {
  const { root, view, current } = setup(); const box = root.querySelector<HTMLElement>('.palette')!;
  expect(box.hidden).toBe(true);
  expect(press(view().querySelector('#cmd')!, 'k', { ctrlKey: true }).defaultPrevented).toBe(true); expect(box.hidden).toBe(false);
  const input = box.querySelector<HTMLInputElement>('.palette-input')!; input.value = 'beta'; input.dispatchEvent(new Event('input', { bubbles: true }));
  press(input, 'Enter'); expect(box.hidden).toBe(true);
  expect(current()).toBe('projects'); expect(view().querySelector('.project-detail')!.textContent).toContain('Beta Arm');
});
test('the search button opens the palette, which lists sections and projects', () => {
  const { root } = setup(); root.querySelector<HTMLButtonElement>('.palette-open')!.click();
  const labels = [...root.querySelectorAll('.palette-item .palette-label')].map(l => l.textContent);
  expect(labels).toEqual([...SECTIONS.map(s => s.label), 'Alpha Bot', 'Beta Arm']);
});
test('typing in the palette does not trigger section shortcuts', () => {
  const { root, current } = setup(); root.querySelector<HTMLButtonElement>('.palette-open')!.click();
  press(root.querySelector('.palette-input')!, '3'); expect(current()).toBe('terminal');
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
test('certifications lists each certificate with its credential and link', () => {
  const certifications = [{ name: 'Machine Learning', issuer: 'Udemy', year: '2025', credential: 'ABC123', href: 'https://example.com/cert' }, { name: 'Cloud', issuer: 'NPTEL', year: '2025' }];
  const { view } = setup('certifications', { ...FIXTURE, certifications }); const text = view().textContent!;
  expect(text).toContain('Machine Learning'); expect(text).toContain('Udemy'); expect(text).toContain('Credential ID: ABC123');
  expect(view().querySelectorAll('a[href="https://example.com/cert"]').length).toBe(1); expect(view().querySelectorAll('.entry').length).toBe(2);
  expect(setup('certifications').view().textContent).toContain('Nothing here yet.');
});
test('a skill used by a project opens the list of those projects', () => {
  const { view, current } = setup('skills');
  const [cpp, python] = [...view().querySelectorAll<HTMLElement>('.tag')];
  expect(cpp.tagName).toBe('BUTTON'); expect(python.tagName).toBe('SPAN'); expect(cpp.getAttribute('aria-expanded')).toBe('false');
  cpp.click(); expect(cpp.getAttribute('aria-expanded')).toBe('true'); expect(view().querySelector('.used-in')!.textContent).toContain('Alpha Bot');
  cpp.click(); expect(view().querySelector('.used-in')).toBeNull(); expect(cpp.getAttribute('aria-expanded')).toBe('false');
  cpp.click(); view().querySelector<HTMLButtonElement>('.used-in button')!.click();
  expect(current()).toBe('projects'); expect(view().querySelector('.project-detail')!.textContent).toContain('Alpha Bot');
});
test('an email link gets a copy button when the clipboard is available', async () => {
  expect(setup('contact').view().querySelector('.copy')).toBeNull();
  const writeText = vi.fn(async () => {}); Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  try {
    const { view } = setup('contact'); const copy = view().querySelectorAll<HTMLButtonElement>('.copy');
    expect(copy.length).toBe(3); copy[0].click(); await flush();
    expect(writeText).toHaveBeenCalledWith('test@example.com'); expect(copy[0].textContent).toBe('COPIED');
  } finally { delete (navigator as { clipboard?: unknown }).clipboard; }
});
test('a project with a problem, result and media reads as a case study', () => {
  const [a, b] = FIXTURE.projects;
  const study = { ...a, problem: 'Parts were checked by eye.', result: 'Checks now take seconds.', media: [{ src: 'projects/rig.png', alt: 'The camera rig' }, { src: 'javascript:alert(1)', alt: 'bad' }] };
  const { view } = setup('projects', { ...FIXTURE, projects: [study, b] }); const detail = view().querySelector('.project-detail')!;
  expect([...detail.querySelectorAll('h4')].map(h => h.textContent)).toEqual(['PROBLEM', 'WHAT I DID', 'RESULT']);
  expect(detail.textContent).toContain('Parts were checked by eye.'); expect(detail.textContent).toContain('Checks now take seconds.');
  const images = detail.querySelectorAll('img'); expect(images.length).toBe(1);
  expect(images[0].getAttribute('src')).toBe('projects/rig.png'); expect(images[0].alt).toBe('The camera rig'); expect(images[0].getAttribute('loading')).toBe('lazy');
  expect(setup('projects').view().querySelector('.project-detail h4')).toBeNull();
});
test('the overview lists GitHub repositories once, when a user is set', async () => {
  const loadRepos = vi.fn(async () => [{ name: 'rig', description: 'A rig', language: 'C++', stars: 1, url: 'https://github.com/test-user/rig' }]);
  const root = document.createElement('div');
  const dash = mountDashboard(root, { ...FIXTURE, githubUser: 'test-user' }, { initialRoute: 'dashboard', loadRepos });
  await flush(); expect(root.querySelector('.repos a[href="https://github.com/test-user/rig"]')).not.toBeNull();
  dash.show('about'); dash.show('dashboard'); await flush();
  expect(loadRepos).toHaveBeenCalledTimes(1); expect(loadRepos).toHaveBeenCalledWith('test-user'); expect(root.querySelector('.repos a')).not.toBeNull();
  expect(setup('dashboard').view().querySelector('.repos')).toBeNull();
});

test('the top bar links to GitHub and the resume instead of decorative status', () => {
  const { root } = setup(); const bar = root.querySelector('.badges')!;
  expect(bar.querySelector<HTMLAnchorElement>('a.badge[href="https://github.com/test"]')!.textContent).toBe('GITHUB');
  expect(bar.querySelector<HTMLAnchorElement>('a.badge[href="resume.pdf"]')!.textContent).toBe('RESUME');
  expect(bar.textContent).not.toContain('SYS: OK');
  const bare = setup(undefined, { ...FIXTURE, contact: [FIXTURE.contact[0]], resumeHref: undefined });
  expect(bare.root.querySelector('.badges a')).toBeNull();
});
test('about describes how the site is built when the content says so', () => {
  const site = { repo: 'https://github.com/test/site', points: ['No framework.', 'Tests gate every deploy.'] };
  const { view } = setup('about', { ...FIXTURE, site });
  const panel = [...view().querySelectorAll('.panel')].find(p => p.querySelector('.panel-title')!.textContent === 'ABOUT_THIS_SITE')!;
  expect([...panel.querySelectorAll('li')].map(l => l.textContent)).toEqual(site.points);
  expect(panel.querySelector('a[href="https://github.com/test/site"]')).not.toBeNull();
  expect(setup('about').view().textContent).not.toContain('ABOUT_THIS_SITE');
});
