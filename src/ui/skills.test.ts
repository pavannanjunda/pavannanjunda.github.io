// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { FIXTURE } from '../content/fixture';
import type { Content } from '../content/types';
import { renderSkills } from './skills';

const TWO: Content = { ...FIXTURE, skills: [{ group: 'Languages', items: ['C++', 'Python'] }, { group: 'Hardware', items: ['Arduino'] }] };
const mount = (content: Content = TWO) => {
  const nav = vi.fn(); const root = document.createElement('div'); root.append(...renderSkills(content, nav)); document.body.replaceChildren(root);
  const search = root.querySelector<HTMLInputElement>('.skill-search')!;
  const type = (text: string) => { search.value = text; search.dispatchEvent(new Event('input', { bubbles: true })); };
  const visibleTags = () => [...root.querySelectorAll<HTMLElement>('.skill-card:not([hidden]) .tag:not([hidden])')].map(t => t.textContent);
  const cards = () => [...root.querySelectorAll<HTMLElement>('.skill-card:not([hidden])')].map(c => c.querySelector('.panel-title')!.textContent);
  const pill = (label: string) => [...root.querySelectorAll<HTMLButtonElement>('.skill-filter')].find(b => b.textContent === label)!;
  return { root, nav, type, visibleTags, cards, pill };
};

test('shows a card per group with its size, and a filter pill per group', () => {
  const { root, cards } = mount();
  expect(cards()).toEqual(['Languages', 'Hardware']);
  expect([...root.querySelectorAll('.skill-card .panel-count')].map(c => c.textContent)).toEqual(['2', '1']);
  expect([...root.querySelectorAll('.skill-filter')].map(b => b.textContent)).toEqual(['All', 'Languages', 'Hardware']);
  expect(root.querySelector('.skill-filter[aria-pressed="true"]')!.textContent).toBe('All');
});
test('skills a project used carry how many, others do not', () => {
  const { root } = mount(); const [cpp, python] = [...root.querySelectorAll<HTMLElement>('.tag')];
  expect(cpp.dataset.count).toBe('1'); expect(cpp.textContent).toBe('C++'); expect(python.dataset.count).toBeUndefined();
});
test('typing filters skills and hides emptied groups', () => {
  const { type, visibleTags, cards, root } = mount();
  type('PY'); expect(visibleTags()).toEqual(['Python']); expect(cards()).toEqual(['Languages']);
  type('zzz'); expect(visibleTags()).toEqual([]); expect(root.querySelector<HTMLElement>('.skill-empty')!.hidden).toBe(false);
  type(''); expect(visibleTags()).toEqual(['C++', 'Python', 'Arduino']); expect(root.querySelector<HTMLElement>('.skill-empty')!.hidden).toBe(true);
});
test('a group pill shows only that group, and combines with the search', () => {
  const { pill, cards, type, visibleTags } = mount();
  pill('Hardware').click(); expect(cards()).toEqual(['Hardware']); expect(pill('Hardware').getAttribute('aria-pressed')).toBe('true'); expect(pill('All').getAttribute('aria-pressed')).toBe('false');
  type('py'); expect(visibleTags()).toEqual([]);
  pill('All').click(); expect(visibleTags()).toEqual(['Python']);
});
test('the matrix marks which project used which skill', () => {
  const { root, nav } = mount(); const matrix = root.querySelector('.matrix')!;
  expect([...matrix.querySelectorAll('thead th')].map(h => h.textContent)).toEqual(['', 'C++', 'ROS 2']);
  const rows = [...matrix.querySelectorAll('tbody tr')]; expect(rows.length).toBe(1);
  expect(rows[0].querySelectorAll('td.on').length).toBe(2);
  rows[0].querySelector('button')!.click(); expect(nav).toHaveBeenCalledWith('projects', 'alpha-bot');
});
test('matrix cells say what they mean to a screen reader', () => {
  const [a, b] = FIXTURE.projects; const { root } = mount({ ...TWO, projects: [a, { ...b, tech: ['C++'] }] });
  const cells = [...root.querySelectorAll('.matrix tbody tr')[1].querySelectorAll('td')].map(c => c.textContent);
  expect(cells).toEqual(['used', 'not used']);
});
test('there is no matrix when no project lists a stack, and no crash with no skills', () => {
  const noTech = { ...TWO, projects: FIXTURE.projects.map(p => ({ ...p, tech: [] })) };
  expect(mount(noTech).root.querySelector('.matrix')).toBeNull();
  expect(mount({ ...TWO, skills: [] }).root.textContent).toContain('Nothing here yet.');
});
