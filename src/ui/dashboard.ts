import type { Content, Project } from '../content/types';
import { isSafeHref } from '../content/validate';
import { dateRange } from '../shell/commands';
import { button, el, empty, initials, linkEl, panel } from './dom';
import { copyButton, renderContact } from './contact';
import { renderExperience } from './experience';
import { type Repo, renderRepos } from './github';
import { mountPalette } from './palette';
import { renderSkills } from './skills';
import { mountTerminal } from './terminal';

export interface Section { id: string; label: string; summary: string }

// The first section is the one the site opens on.
export const SECTIONS: Section[] = [
  { id: 'terminal', label: 'TERMINAL', summary: 'Type a command, or pick a section from the menu.' },
  { id: 'dashboard', label: 'OVERVIEW', summary: '' },
  { id: 'about', label: 'ABOUT', summary: 'Who I am.' },
  { id: 'experience', label: 'EXPERIENCE', summary: 'Work, training and leadership, newest first. Select one for details.' },
  { id: 'education', label: 'EDUCATION', summary: 'Where I studied.' },
  { id: 'certifications', label: 'CERTIFICATIONS', summary: 'Courses I have completed.' },
  { id: 'projects', label: 'PROJECTS', summary: "Things I've built. Select one for details." },
  { id: 'skills', label: 'SKILLS', summary: 'Tools I use. Highlighted ones open the projects that used them.' },
  { id: 'contact', label: 'CONTACT', summary: 'How to reach me.' },
];

type Navigate = (id: string, arg?: string) => void;

const THEME_KEY = 'theme';

// The saved choice, else the system preference, else dark.
function initialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage unavailable: fall through to the system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

const pad = (n: number): string => String(n).padStart(2, '0');

function hero(title: string, lines: string[], index: number, actions: HTMLElement[] = []): HTMLElement {
  const node = el('section', 'hero');
  const number = el('div', 'index', pad(index));
  number.setAttribute('aria-hidden', 'true');
  node.append(number, el('h1', '', title), ...lines.map(line => el('p', '', line)));
  if (actions.length > 0) {
    const row = el('div', 'hero-actions');
    row.append(...actions);
    node.append(row);
  }
  return node;
}

function projectTable(projects: Project[], nav: Navigate, selected?: string): HTMLElement {
  if (projects.length === 0) return empty();
  const table = el('table', 'table');
  const head = el('tr', '');
  head.append(el('th', '', '#'), el('th', '', 'NAME'), el('th', '', 'STACK'));
  table.append(head);
  projects.forEach((project, i) => {
    const row = el('tr', 'project-row');
    row.dataset.slug = project.slug;
    if (selected !== undefined) row.setAttribute('aria-selected', String(project.slug === selected));
    const name = el('td', '');
    name.append(button(project.slug, () => nav('projects', project.slug), 'link-btn'));
    row.append(el('td', 'dim', pad(i + 1)), name, el('td', 'dim', project.tech.join(', ')));
    table.append(row);
  });
  return table;
}

function projectDetail(project: Project): HTMLElement {
  const body: Node[] = [el('h3', '', project.name), el('p', '', project.summary)];
  const isCaseStudy = project.problem !== undefined || project.result !== undefined;
  if (project.problem !== undefined) body.push(el('h4', '', 'PROBLEM'), el('p', '', project.problem));
  if (project.details.length > 0) {
    if (isCaseStudy) body.push(el('h4', '', 'WHAT I DID'));
    const list = el('ul', '');
    list.append(...project.details.map(detail => el('li', '', detail)));
    body.push(list);
  }
  if (project.result !== undefined) body.push(el('h4', '', 'RESULT'), el('p', '', project.result));
  const media = (project.media ?? []).filter(item => isSafeHref(item.src));
  if (media.length > 0) {
    const gallery = el('div', 'gallery');
    gallery.append(...media.map(item => {
      const figure = el('figure', '');
      const image = el('img', '');
      image.src = item.src;
      image.alt = item.alt;
      image.setAttribute('loading', 'lazy');
      figure.append(image, el('figcaption', 'dim small', item.alt));
      return figure;
    }));
    body.push(gallery);
  }
  if (project.tech.length > 0) {
    const stack = el('div', 'tags');
    stack.append(el('span', 'dim', 'STACK'), ...project.tech.map(tech => el('span', 'tag', tech)));
    body.push(stack);
  }
  if (project.links.length > 0) {
    const links = el('div', 'links');
    links.append(...project.links.map(link => linkEl(link)));
    body.push(links);
  }
  return panel('PROJECT_DETAIL', body, 'project-detail');
}

function contactRows(content: Content): Node[] {
  const links = [...content.contact];
  if (content.resumeHref !== undefined) links.push({ label: 'resume.pdf', href: content.resumeHref });
  if (links.length === 0) return [empty()];
  return links.map(link => {
    const row = el('div', 'row');
    row.append(el('span', 'dim', '>'), linkEl(link));
    if (link.href.startsWith('mailto:') && navigator.clipboard) row.append(copyButton(link.href.slice('mailto:'.length).split('?')[0]));
    return row;
  });
}

function entry(title: string, at: string, dates: string, points: string[]): HTMLElement {
  const node = el('article', 'entry');
  const head = el('h3', '');
  head.append(el('span', 'accent', title), el('span', '', ` @ ${at}`));
  node.append(head, el('div', 'dim', dates));
  if (points.length > 0) {
    const list = el('ul', '');
    list.append(...points.map(point => el('li', '', point)));
    node.append(list);
  }
  return node;
}

const DASHBOARD_INDEX = SECTIONS.findIndex(section => section.id === 'dashboard') + 1;

const VIEWS: Record<string, (content: Content, nav: Navigate, arg?: string) => HTMLElement[]> = {
  dashboard: (content, nav) => {
    const stats = el('div', 'stats');
    const counts: [string, number][] = [
      ['PROJECTS', content.projects.length],
      ['ROLES', content.experience.length],
      ['SKILLS', content.skills.reduce((sum, group) => sum + group.items.length, 0)],
    ];
    for (const [label, value] of counts) {
      const stat = el('div', 'stat');
      stat.append(el('span', 'stat-label', label), el('span', 'stat-value', pad(value)));
      stats.append(stat);
    }

    const current = content.experience[0];
    const log = content.experience.map(job => {
      const line = el('div', 'log-line');
      line.append(el('span', 'dim', job.start), el('span', 'log-tag', '[ROLE]'), el('span', '', `${job.role} @ ${job.company}`));
      return line;
    });
    const actions = el('div', 'actions-grid');
    actions.append(
      ...['about', 'experience', 'skills', 'terminal'].map(id => button(id.toUpperCase(), () => nav(id), 'btn')),
    );

    const grid = el('div', 'grid');
    grid.append(
      panel('SYSTEM_STATS', [stats], 'area-stats'),
      panel('PROJECTS', [projectTable(content.projects, nav)], 'area-projects'),
      panel('CURRENT_ROLE', current
        ? [entry(current.role, current.company, dateRange(current.start, current.end), [])]
        : [empty()], 'area-role'),
      panel('QUICK_ACTIONS', [actions], 'area-actions'),
      panel('ACTIVITY_LOG', log.length > 0 ? log : [empty()], 'area-log'),
      panel('CONTACT', contactRows(content), 'area-contact'),
    );
    return [
      hero(content.name.toUpperCase(), [content.tagline, ...content.about.slice(0, 1)], DASHBOARD_INDEX, [
        button('VIEW PROJECTS', () => nav('projects'), 'btn primary'),
        button('CONTACT', () => nav('contact'), 'btn'),
      ]),
      grid,
    ];
  },

  about: content => {
    const panels = [panel('ABOUT.TXT', content.about.length > 0 ? content.about.map(paragraph => el('p', '', paragraph)) : [empty()])];
    if (content.site) {
      const list = el('ul', '');
      list.append(...content.site.points.map(point => el('li', '', point)));
      const body: Node[] = [list];
      if (content.site.repo !== undefined) body.push(linkEl({ label: 'View the source', href: content.site.repo }));
      panels.push(panel('ABOUT_THIS_SITE', body));
    }
    return panels;
  },

  experience: content => renderExperience(content),

  education: content => [
    panel('EDUCATION', content.education.length > 0
      ? content.education.map(school =>
        entry(school.degree, school.institution, dateRange(school.start, school.end), school.notes ?? []))
      : [empty()]),
  ],

  certifications: content => {
    const certifications = content.certifications ?? [];
    return [panel('CERTIFICATIONS', certifications.length > 0
      ? certifications.map(cert => {
        const node = entry(cert.name, cert.issuer, cert.year, cert.credential ? [`Credential ID: ${cert.credential}`] : []);
        if (cert.href !== undefined) node.append(linkEl({ label: 'View certificate', href: cert.href }));
        return node;
      })
      : [empty()])];
  },

  projects: (content, nav, arg) => {
    const selected = content.projects.find(project => project.slug === arg) ?? content.projects[0];
    const split = el('div', 'split');
    split.append(panel('PROJECT_INDEX', [projectTable(content.projects, nav, selected?.slug)]));
    if (selected) split.append(projectDetail(selected));
    return [split];
  },

  skills: (content, nav) => renderSkills(content, nav),

  contact: content => renderContact(content),
};

export function mountDashboard(
  root: HTMLElement,
  content: Content,
  options?: { initialRoute?: string; onNavigate?: (route: string) => void; loadRepos?: (user: string) => Promise<Repo[]> },
): { show(route: string): void } {
  const html = root.ownerDocument.documentElement;
  const applyTheme = (theme: 'light' | 'dark', remember: boolean) => {
    html.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? 'DARK' : 'LIGHT';
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute('aria-label', 'Dark theme');
    if (!remember) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Private mode or blocked storage: the choice lasts for this visit only.
    }
  };

  const sidebar = el('aside', 'sidebar');
  const brandBox = el('div', 'brand-box');
  brandBox.append(
    el('div', 'brand', content.name.trim().toUpperCase().replace(/\s+/g, '_')),
    el('div', 'dim small', 'portfolio // online'),
  );
  const nav = el('nav', 'nav');
  nav.setAttribute('aria-label', 'Sections');
  const buttons = new Map<string, HTMLButtonElement>();
  for (const section of SECTIONS) {
    const item = button(section.label, () => navigate(section.id), 'nav-item');
    item.dataset.section = section.id;
    item.dataset.key = String(SECTIONS.indexOf(section) + 1);
    item.setAttribute('aria-keyshortcuts', item.dataset.key);
    buttons.set(section.id, item);
    nav.append(item);
  }
  const operator = el('div', 'operator');
  const avatar = el('div', 'avatar', initials(content.name));
  avatar.setAttribute('aria-hidden', 'true');
  const who = el('div', '');
  who.append(el('div', '', content.handle.toUpperCase()), el('div', 'ok small', 'ONLINE'));
  operator.append(avatar, who);
  sidebar.append(brandBox, nav, operator);

  const crumbs = el('div', 'crumbs');
  const badges = el('div', 'badges');
  const clock = el('span', 'badge clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB'); };
  tick();
  setInterval(tick, 1000);
  const paletteOpen = button('SEARCH', () => palette.open(), 'badge palette-open');
  paletteOpen.setAttribute('aria-keyshortcuts', 'Control+K');
  const themeToggle = button('', () => applyTheme(html.dataset.theme === 'dark' ? 'light' : 'dark', true), 'badge theme-toggle');
  const github = content.contact.find(link => link.href.startsWith('https://github.com/'));
  if (github) badges.append(linkEl({ label: 'GITHUB', href: github.href }, 'badge badge-link'));
  if (content.resumeHref !== undefined && isSafeHref(content.resumeHref)) {
    badges.append(linkEl({ label: 'RESUME', href: content.resumeHref }, 'badge badge-link'));
  }
  badges.append(clock, paletteOpen, themeToggle);
  const topbar = el('header', 'topbar');
  topbar.append(crumbs, badges);
  const view = el('main', 'view');
  view.tabIndex = -1;
  const main = el('div', 'main');
  main.append(topbar, view);

  // Built once, so its output and history survive leaving the section.
  let terminal: HTMLElement | undefined;
  const terminalPanel = (): HTMLElement => {
    if (!terminal) {
      const host = el('div', '');
      mountTerminal(host, content, { bare: true, onNavigate: section => navigate(section) });
      terminal = panel('TERMINAL', [host], 'terminal-panel');
    }
    return terminal;
  };

  // Fetched once, the first time the overview is shown.
  let repos: HTMLElement | undefined;
  const reposPanel = (): HTMLElement[] => {
    if (content.githubUser === undefined) return [];
    repos ??= panel('GITHUB', [renderRepos(content.githubUser, options?.loadRepos)]);
    return [repos];
  };

  let currentRoute: string | undefined;

  function render(route: string): string {
    const [id, arg] = route.toLowerCase().split('/');
    const section = SECTIONS.find(s => s.id === id) ?? SECTIONS[0];
    const resolved = section.id === 'projects' && arg ? `projects/${arg}` : section.id;
    if (resolved === currentRoute) return resolved;
    currentRoute = resolved;

    for (const [sectionId, item] of buttons) {
      if (sectionId === section.id) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
    crumbs.textContent = `ROOT / PORTFOLIO / ${section.label}`;

    const index = SECTIONS.indexOf(section) + 1;
    if (section.id === 'dashboard') {
      view.replaceChildren(...VIEWS.dashboard(content, navigate), ...reposPanel());
    } else if (section.id === 'terminal') {
      view.replaceChildren(terminalPanel());
    } else {
      view.replaceChildren(hero(section.label, [section.summary], index), ...VIEWS[section.id](content, navigate, arg));
    }
    view.scrollTop = 0;
    return resolved;
  }

  function navigate(id: string, arg?: string): void {
    show(arg ? `${id}/${arg}` : id);
  }

  function show(route: string): void {
    const before = currentRoute;
    const resolved = render(route);
    if (resolved === before) return;
    view.focus({ preventScroll: true });
    options?.onNavigate?.(resolved);
  }

  // 1-8 switch sections and / jumps to the prompt, unless the visitor is typing.
  root.ownerDocument.addEventListener('keydown', event => {
    if (!root.isConnected) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      palette.open();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if ((event.target as Element | null)?.closest?.('input, textarea, select')) return;
    const section = SECTIONS[Number(event.key) - 1];
    if (/^[1-9]$/.test(event.key) && section) {
      show(section.id);
    } else if (event.key === '/') {
      event.preventDefault();
      show('terminal');
      view.querySelector<HTMLInputElement>('#cmd')?.focus();
    }
  });

  applyTheme(initialTheme(), false);
  root.classList.add('dash');
  root.replaceChildren(sidebar, main);
  const palette = mountPalette(root, [
    ...SECTIONS.map(section => ({ label: section.label, hint: 'section', route: section.id })),
    ...content.projects.map(project => ({ label: project.name, hint: 'project', route: `projects/${project.slug}` })),
  ], route => show(route));
  render(options?.initialRoute ?? SECTIONS[0].id);

  return { show };
}
