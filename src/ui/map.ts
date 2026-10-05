import type { Content } from '../content/types';
import { dateRange } from '../shell/commands';
import { el } from './dom';

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 56;
const ROW_GAP = 22;
const COLUMN_GAP = 70;
const MARGIN = 24;
const MAX_ROLES = 3;
const TITLE_CHARS = 22;
const SUBTITLE_CHARS = 26;
const SVG_NS = 'http://www.w3.org/2000/svg';

export type NodeKind = 'person' | 'education' | 'role' | 'project' | 'tech';

export interface NodeDetail {
  heading: string;
  lines: string[];
  bullets: string[];
  action: { label: string; section: string; arg?: string };
}
export interface MapNode { id: string; kind: NodeKind; title: string; subtitle: string; x: number; y: number; detail: NodeDetail }
export interface MapEdge { from: string; to: string }
export interface Graph { nodes: MapNode[]; edges: MapEdge[]; width: number; height: number }

// Legend groups, in column order.
const GROUPS: { label: string; kinds: NodeKind[] }[] = [
  { label: 'Me', kinds: ['person'] },
  { label: 'Background', kinds: ['education', 'role'] },
  { label: 'Projects', kinds: ['project'] },
  { label: 'Stack', kinds: ['tech'] },
];

const clip = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

type Draft = Omit<MapNode, 'x' | 'y' | 'title' | 'subtitle'> & { title: string; subtitle: string };

// Background -> person -> projects -> the stack each project uses.
export function buildGraph(content: Content): Graph {
  const edges: MapEdge[] = [];

  const person: Draft = {
    id: 'person', kind: 'person', title: content.name, subtitle: content.tagline,
    detail: {
      heading: content.name, lines: [content.tagline, ...content.about.slice(0, 1)], bullets: [],
      action: { label: 'ABOUT', section: 'about' },
    },
  };

  const background: Draft[] = [
    ...content.education.slice(0, 1).map((school, i): Draft => ({
      id: `edu:${i}`, kind: 'education', title: school.degree, subtitle: school.institution,
      detail: {
        heading: school.degree, lines: [school.institution, dateRange(school.start, school.end)], bullets: school.notes ?? [],
        action: { label: 'EDUCATION', section: 'education' },
      },
    })),
    ...content.experience.slice(0, MAX_ROLES).map((job, i): Draft => ({
      id: `role:${i}`, kind: 'role', title: job.company, subtitle: job.role,
      detail: {
        heading: `${job.role} @ ${job.company}`, lines: [dateRange(job.start, job.end)], bullets: job.highlights,
        action: { label: 'EXPERIENCE', section: 'experience' },
      },
    })),
  ];
  for (const node of background) edges.push({ from: node.id, to: person.id });

  const tech = new Map<string, { name: string; users: string[] }>();
  const projects = content.projects.map((project): Draft => {
    const id = `project:${project.slug}`;
    edges.push({ from: person.id, to: id });
    for (const name of project.tech) {
      const key = name.toLowerCase();
      const entry = tech.get(key) ?? { name, users: [] };
      if (!entry.users.includes(project.name)) entry.users.push(project.name);
      tech.set(key, entry);
      const edge = { from: id, to: `tech:${key}` };
      if (!edges.some(e => e.from === edge.from && e.to === edge.to)) edges.push(edge);
    }
    return {
      id, kind: 'project', title: project.slug, subtitle: project.summary,
      detail: {
        heading: project.name, lines: [project.summary], bullets: project.details,
        action: { label: 'OPEN PROJECT', section: 'projects', arg: project.slug },
      },
    };
  });

  const stack = [...tech].map(([key, { name, users }]): Draft => ({
    id: `tech:${key}`, kind: 'tech', title: name, subtitle: users.length === 1 ? '1 project' : `${users.length} projects`,
    detail: { heading: name, lines: ['Used in:'], bullets: users, action: { label: 'SKILLS', section: 'skills' } },
  }));

  const columns = [background, [person], projects, stack].filter(column => column.length > 0);
  const rows = Math.max(...columns.map(column => column.length));
  const height = MARGIN * 2 + rows * NODE_HEIGHT + (rows - 1) * ROW_GAP;
  const width = MARGIN * 2 + columns.length * NODE_WIDTH + (columns.length - 1) * COLUMN_GAP;

  const nodes = columns.flatMap((column, c) => {
    const columnHeight = column.length * NODE_HEIGHT + (column.length - 1) * ROW_GAP;
    const top = (height - columnHeight) / 2;
    return column.map((draft, r): MapNode => ({
      ...draft,
      title: clip(draft.title, TITLE_CHARS),
      subtitle: clip(draft.subtitle, SUBTITLE_CHARS),
      x: MARGIN + c * (NODE_WIDTH + COLUMN_GAP),
      y: top + r * (NODE_HEIGHT + ROW_GAP),
    }));
  });
  return { nodes, edges, width, height };
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  return node;
}

function arrowMarker(id: string): SVGMarkerElement {
  const marker = svg('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' });
  marker.append(svg('path', { d: 'M0 0 L10 5 L0 10 z' }));
  return marker;
}

export function renderMap(content: Content, nav: (section: string, arg?: string) => void): HTMLElement {
  const graph = buildGraph(content);
  const byId = new Map(graph.nodes.map(node => [node.id, node]));
  const neighbours = (id: string): Set<string> => new Set([
    id,
    ...graph.edges.filter(edge => edge.from === id).map(edge => edge.to),
    ...graph.edges.filter(edge => edge.to === id).map(edge => edge.from),
  ]);

  const canvas = svg('svg', { viewBox: `0 0 ${graph.width} ${graph.height}`, width: graph.width, height: graph.height, role: 'group' });
  canvas.setAttribute('aria-label', 'Map of background, projects and stack');
  const defs = svg('defs');
  defs.append(arrowMarker('map-arrow'), arrowMarker('map-arrow-on'));
  canvas.append(defs);

  const edgeEls = graph.edges.map(edge => {
    const from = byId.get(edge.from)!;
    const to = byId.get(edge.to)!;
    const x1 = from.x + NODE_WIDTH;
    const y1 = from.y + NODE_HEIGHT / 2;
    const x2 = to.x - 4;
    const y2 = to.y + NODE_HEIGHT / 2;
    const mid = (x1 + x2) / 2;
    const path = svg('path', { class: 'edge', d: `M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}` });
    path.dataset.from = edge.from;
    path.dataset.to = edge.to;
    return path;
  });
  canvas.append(...edgeEls);

  const detail = el('aside', 'map-detail');
  detail.setAttribute('aria-live', 'polite');
  const nodeEls = new Map<string, SVGGElement>();

  const light = (ids: Set<string> | undefined) => {
    canvas.classList.toggle('lens', ids !== undefined);
    for (const [id, node] of nodeEls) node.classList.toggle('lit', ids?.has(id) ?? false);
    for (const edge of edgeEls) {
      edge.classList.toggle('lit', ids !== undefined && ids.has(edge.dataset.from!) && ids.has(edge.dataset.to!));
    }
  };

  const select = (id: string) => {
    const node = byId.get(id)!;
    for (const [nodeId, nodeEl] of nodeEls) {
      nodeEl.classList.toggle('selected', nodeId === id);
      nodeEl.setAttribute('aria-pressed', String(nodeId === id));
    }
    for (const edge of edgeEls) edge.classList.toggle('trace', edge.dataset.from === id || edge.dataset.to === id);

    const { heading, lines, bullets, action } = node.detail;
    const open = el('button', 'btn primary', action.label);
    open.type = 'button';
    open.addEventListener('click', () => nav(action.section, action.arg));
    const body: Node[] = [el('div', `kind-label kind-${node.kind}`, node.kind.toUpperCase()), el('h3', '', heading)];
    body.push(...lines.map(line => el('p', '', line)));
    if (bullets.length > 0) {
      const list = el('ul', '');
      list.append(...bullets.map(bullet => el('li', '', bullet)));
      body.push(list);
    }
    detail.replaceChildren(...body, open);
  };

  for (const node of graph.nodes) {
    const group = svg('g', { class: `node kind-${node.kind}`, transform: `translate(${node.x} ${node.y})`, tabindex: 0, role: 'button' });
    group.dataset.id = node.id;
    group.setAttribute('aria-label', `${node.title}: ${node.subtitle}`);
    const title = svg('text', { class: 'node-title', x: NODE_WIDTH / 2, y: 24, 'text-anchor': 'middle' });
    title.textContent = node.title;
    const subtitle = svg('text', { class: 'node-subtitle', x: NODE_WIDTH / 2, y: 42, 'text-anchor': 'middle' });
    subtitle.textContent = node.subtitle;
    group.append(svg('rect', { width: NODE_WIDTH, height: NODE_HEIGHT, rx: 8 }), title, subtitle);

    group.addEventListener('click', () => select(node.id));
    group.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      select(node.id);
    });
    group.addEventListener('mouseenter', () => light(neighbours(node.id)));
    group.addEventListener('mouseleave', () => light(undefined));
    group.addEventListener('focus', () => light(neighbours(node.id)));
    group.addEventListener('blur', () => light(undefined));
    nodeEls.set(node.id, group);
    canvas.append(group);
  }

  const legend = el('div', 'legend');
  for (const group of GROUPS) {
    const members = graph.nodes.filter(node => group.kinds.includes(node.kind));
    if (members.length === 0) continue;
    const item = el('button', 'legend-item');
    item.type = 'button';
    item.append(el('span', `swatch kind-${group.kinds[group.kinds.length - 1]}`), el('span', '', group.label), el('span', 'count', String(members.length)));
    const ids = new Set(members.map(node => node.id));
    item.addEventListener('mouseenter', () => light(ids));
    item.addEventListener('mouseleave', () => light(undefined));
    item.addEventListener('focus', () => light(ids));
    item.addEventListener('blur', () => light(undefined));
    legend.append(item);
  }

  const scroller = el('div', 'canvas');
  scroller.append(canvas);
  const stage = el('div', 'map-stage');
  stage.append(scroller, legend);
  const map = el('section', 'map');
  map.append(stage, detail);
  select('person');
  return map;
}
