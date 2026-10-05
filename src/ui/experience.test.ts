// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { FIXTURE } from '../content/fixture';
import type { Content, Job } from '../content/types';
import { duration, renderExperience } from './experience';

const NOW = new Date(2026, 9, 5); // 5 Oct 2026
const job = (extra: Partial<Job>): Job => ({ company: 'Acme', role: 'Engineer', start: 'Feb 2026', end: 'present', highlights: [], ...extra });
const MIXED: Content = { ...FIXTURE, experience: [
  job({ kind: 'work', highlights: ['Built a thing.'] }),
  job({ company: 'Camp', role: 'Trainee', kind: 'training', start: 'Jan 2026', end: 'Mar 2026' }),
  job({ company: 'Club', role: 'Lead', kind: 'leadership', start: 'Oct 2023', end: 'Oct 2024' }),
  job({ company: 'School', role: 'Trainee', kind: 'training', start: 'Mar 2025', end: 'Sep 2025' }),
] };
const mount = (content: Content = MIXED) => {
  const root = document.createElement('div'); root.append(...renderExperience(content, NOW)); document.body.replaceChildren(root);
  const items = () => [...root.querySelectorAll<HTMLElement>('.tl-item')];
  const shown = () => items().filter(i => !i.hidden).map(i => i.querySelector('.tl-company')!.textContent);
  const pill = (label: string) => [...root.querySelectorAll<HTMLButtonElement>('.tl-filter')].find(b => b.querySelector('.tl-filter-label')!.textContent === label)!;
  return { root, items, shown, pill };
};

test('duration counts months inclusively, in years and months', () => {
  expect(duration('Jan 2026', 'Mar 2026', NOW)).toBe('3 mos'); expect(duration('Oct 2023', 'Oct 2024', NOW)).toBe('1 yr 1 mo');
  expect(duration('Feb 2026', 'present', NOW)).toBe('9 mos'); expect(duration('Jan 2025', 'Dec 2025', NOW)).toBe('1 yr');
  expect(duration('Mar 2026', 'Mar 2026', NOW)).toBe('1 mo');
});
test('duration is unknown for dates it cannot read or that run backwards', () => {
  expect(duration('2026-04', 'present', NOW)).toBeUndefined(); expect(duration('Mar 2026', 'Jan 2026', NOW)).toBeUndefined();
  expect(duration('Foo 2026', 'Mar 2026', NOW)).toBeUndefined();
});
test('draws a timeline entry per role, coloured by kind, with its duration', () => {
  const { items } = mount();
  expect(items().map(i => i.dataset.kind)).toEqual(['work', 'training', 'leadership', 'training']);
  expect(items()[0].querySelector('.tl-role')!.textContent).toBe('Engineer'); expect(items()[0].querySelector('.tl-company')!.textContent).toBe('Acme');
  expect(items()[0].querySelector('.tl-dates')!.textContent).toBe('Feb 2026 – present'); expect(items()[0].querySelector('.tl-duration')!.textContent).toBe('9 mos');
  expect(items()[0].querySelector('.tl-kind')!.textContent).toBe('WORK');
});
test('only a role that is still running is marked current', () => {
  const { items } = mount(); expect(items().map(i => i.querySelector('.tl-current') !== null)).toEqual([true, false, false, false]);
});
test('entries are closed dropdowns; details hold highlights or say there are none', () => {
  const { items } = mount(); const details = items().map(i => i.querySelector<HTMLDetailsElement>('details.entry')!);
  expect(details.every(d => !d.open)).toBe(true);
  expect(details[0].querySelector('.entry-body')!.textContent).toBe('Built a thing.'); expect(details[0].querySelector('summary')!.textContent).not.toContain('Built a thing.');
  expect(details[1].querySelector('.entry-body')!.textContent).toBe('No details added yet.');
});
test('filter pills count each kind and show only that kind', () => {
  const { root, pill, shown } = mount();
  expect([...root.querySelectorAll('.tl-filter')].map(b => b.textContent)).toEqual(['All4', 'Work1', 'Training2', 'Leadership1']);
  pill('Training').click(); expect(shown()).toEqual(['Camp', 'School']); expect(pill('Training').getAttribute('aria-pressed')).toBe('true');
  pill('All').click(); expect(shown().length).toBe(4);
});
test('expand all opens every entry and then offers to collapse them', () => {
  const { root, items } = mount(); const toggle = root.querySelector<HTMLButtonElement>('.tl-expand')!;
  toggle.click(); expect(items().every(i => i.querySelector('details')!.open)).toBe(true); expect(toggle.textContent).toBe('COLLAPSE ALL');
  toggle.click(); expect(items().every(i => !i.querySelector('details')!.open)).toBe(true); expect(toggle.textContent).toBe('EXPAND ALL');
});
test('roles without a kind count as work, and one kind needs no filter', () => {
  const { root, items } = mount(); expect(root.querySelector('.tl-filters')).not.toBeNull();
  const plain = mount(FIXTURE); expect(plain.items()[0].dataset.kind).toBe('work'); expect(plain.root.querySelector('.tl-filters')).toBeNull();
  expect(items().length).toBe(4);
});
test('an empty history says so', () => expect(mount({ ...FIXTURE, experience: [] }).root.textContent).toContain('Nothing here yet.'));
