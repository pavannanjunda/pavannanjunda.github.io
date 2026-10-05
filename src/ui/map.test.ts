// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { FIXTURE } from '../content/fixture';
import type { Content } from '../content/types';
import { NODE_HEIGHT, NODE_WIDTH, buildGraph, renderMap } from './map';

const kinds = (content: Content) => buildGraph(content).nodes.reduce<Record<string, number>>(
  (count, node) => ({ ...count, [node.kind]: (count[node.kind] ?? 0) + 1 }), {});
const edge = (content: Content, from: string, to: string) => buildGraph(content).edges.some(e => e.from === from && e.to === to);

test('the graph has one node per person, school, role, project and technology', () => {
  expect(kinds(FIXTURE)).toEqual({ person: 1, education: 1, role: 1, project: 2, tech: 2 });
});
test('background leads to the person, the person to projects, projects to their stack', () => {
  expect(edge(FIXTURE, 'edu:0', 'person')).toBe(true); expect(edge(FIXTURE, 'role:0', 'person')).toBe(true);
  expect(edge(FIXTURE, 'person', 'project:alpha-bot')).toBe(true); expect(edge(FIXTURE, 'person', 'project:beta-arm')).toBe(true);
  expect(edge(FIXTURE, 'project:alpha-bot', 'tech:c++')).toBe(true); expect(edge(FIXTURE, 'project:beta-arm', 'tech:c++')).toBe(false);
});
test('a technology shared by two projects is one node with two edges', () => {
  const [a, b] = FIXTURE.projects;
  const shared = { ...FIXTURE, projects: [{ ...a, tech: ['OpenCV'] }, { ...b, tech: ['opencv', 'Arduino'] }] };
  expect(kinds(shared).tech).toBe(2);
  expect(edge(shared, 'project:alpha-bot', 'tech:opencv')).toBe(true); expect(edge(shared, 'project:beta-arm', 'tech:opencv')).toBe(true);
});
test('only the three most recent roles and the latest school are drawn', () => {
  const job = FIXTURE.experience[0]; const school = FIXTURE.education[0];
  const many = { ...FIXTURE, experience: [job, job, job, job, job], education: [school, school] };
  expect(kinds(many).role).toBe(3); expect(kinds(many).education).toBe(1);
});
test('nodes stay inside the canvas and never overlap', () => {
  const [a, b] = FIXTURE.projects;
  const busy = { ...FIXTURE, projects: [{ ...a, tech: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] }, b] };
  const { nodes, width, height } = buildGraph(busy);
  for (const n of nodes) {
    expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x + NODE_WIDTH).toBeLessThanOrEqual(width);
    expect(n.y).toBeGreaterThanOrEqual(0); expect(n.y + NODE_HEIGHT).toBeLessThanOrEqual(height);
    for (const m of nodes) if (m !== n && m.x === n.x) expect(Math.abs(m.y - n.y)).toBeGreaterThanOrEqual(NODE_HEIGHT);
  }
});
test('long labels are clipped so they fit their node', () => {
  const long = { ...FIXTURE, name: 'A'.repeat(80), tagline: 'B'.repeat(200) };
  const person = buildGraph(long).nodes.find(n => n.kind === 'person')!;
  expect(person.title.length).toBeLessThanOrEqual(22); expect(person.title.endsWith('…')).toBe(true);
  expect(person.subtitle.length).toBeLessThanOrEqual(28);
});
test('an empty portfolio is just the person', () => {
  const empty = { ...FIXTURE, experience: [], education: [], projects: [], skills: [] };
  expect(kinds(empty)).toEqual({ person: 1 }); expect(buildGraph(empty).edges).toEqual([]);
  expect(renderMap(empty, () => {}).querySelectorAll('.node').length).toBe(1);
});

const mount = () => {
  const nav = vi.fn(); const el = renderMap(FIXTURE, nav); document.body.replaceChildren(el);
  const node = (id: string) => el.querySelector<SVGGElement>(`.node[data-id="${id}"]`)!;
  return { el, nav, node, detail: () => el.querySelector('.map-detail')! };
};
test('draws every node and edge, and a legend with counts', () => {
  const { el } = mount();
  expect(el.querySelectorAll('.node').length).toBe(7); expect(el.querySelectorAll('.edge').length).toBe(6);
  expect([...el.querySelectorAll('.legend-item')].map(i => i.textContent)).toEqual(['Me1', 'Background2', 'Projects2', 'Stack2']);
});
test('starts with the person selected', () => {
  const { node, detail } = mount();
  expect(node('person').classList.contains('selected')).toBe(true); expect(node('person').getAttribute('aria-pressed')).toBe('true');
  expect(detail().textContent).toContain('Test User'); expect(detail().textContent).toContain('Robotics engineer');
});
test('clicking a node selects it and shows its details', () => {
  const { node, detail, nav } = mount();
  node('project:alpha-bot').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(node('project:alpha-bot').classList.contains('selected')).toBe(true); expect(node('person').classList.contains('selected')).toBe(false);
  expect(detail().textContent).toContain('Alpha Bot'); expect(detail().textContent).toContain('Detail one.');
  detail().querySelector('button')!.click(); expect(nav).toHaveBeenCalledWith('projects', 'alpha-bot');
});
test('Enter and Space select a focused node', () => {
  const { node, detail } = mount();
  node('role:0').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect(detail().textContent).toContain('Acme Robotics');
  const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
  node('tech:c++').dispatchEvent(space); expect(space.defaultPrevented).toBe(true);
  expect(detail().textContent).toContain('C++'); expect(detail().textContent).toContain('Alpha Bot');
});
test('the selected node traces its edges', () => {
  const { el, node } = mount();
  node('project:alpha-bot').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect([...el.querySelectorAll('.edge.trace')].map(e => `${e.getAttribute('data-from')}>${e.getAttribute('data-to')}`).sort())
    .toEqual(['person>project:alpha-bot', 'project:alpha-bot>tech:c++', 'project:alpha-bot>tech:ros 2']);
});
test('hovering a node lights it and its neighbours and dims the rest', () => {
  const { el, node } = mount();
  node('project:alpha-bot').dispatchEvent(new MouseEvent('mouseenter'));
  expect(el.querySelector('svg')!.classList.contains('lens')).toBe(true);
  const lit = [...el.querySelectorAll('.node.lit')].map(n => n.getAttribute('data-id')).sort();
  expect(lit).toEqual(['person', 'project:alpha-bot', 'tech:c++', 'tech:ros 2']);
  node('project:alpha-bot').dispatchEvent(new MouseEvent('mouseleave'));
  expect(el.querySelector('svg')!.classList.contains('lens')).toBe(false); expect(el.querySelector('.lit')).toBeNull();
});
test('hovering a legend item lights that kind', () => {
  const { el } = mount();
  el.querySelectorAll('.legend-item')[2].dispatchEvent(new MouseEvent('mouseenter'));
  expect([...el.querySelectorAll('.node.lit')].map(n => n.getAttribute('data-id')).sort()).toEqual(['project:alpha-bot', 'project:beta-arm']);
});
test('markup in content is drawn as text', () => {
  const evil = { ...FIXTURE, name: '<img src=x onerror=alert(1)>' };
  const el = renderMap(evil, () => {}); expect(el.querySelector('img')).toBeNull();
});
