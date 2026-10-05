import type { Content, Project } from '../content/types';
import { button, el, empty, panel } from './dom';

type Navigate = (section: string, arg?: string) => void;

const usersOf = (skill: string, projects: Project[]): Project[] =>
  projects.filter(project => project.tech.some(tech => tech.toLowerCase() === skill.toLowerCase()));

// Projects down the side, every skill a project used across the top.
function matrix(projects: Project[], nav: Navigate): HTMLElement | undefined {
  const rows = projects.filter(project => project.tech.length > 0);
  const columns = [...new Map(rows.flatMap(project => project.tech).map(tech => [tech.toLowerCase(), tech])).values()];
  if (columns.length === 0) return undefined;

  const table = el('table', 'matrix');
  const head = el('tr', '');
  head.append(el('th', ''), ...columns.map(column => el('th', '', column)));
  const thead = el('thead', '');
  thead.append(head);
  const tbody = el('tbody', '');
  for (const project of rows) {
    const row = el('tr', '');
    const name = el('th', '');
    name.append(button(project.slug, () => nav('projects', project.slug), 'link-btn'));
    row.append(name, ...columns.map(column => {
      const used = usersOf(column, [project]).length > 0;
      const cell = el('td', used ? 'on' : '');
      cell.append(el('span', 'sr-only', used ? 'used' : 'not used'));
      return cell;
    }));
    tbody.append(row);
  }
  table.append(thead, tbody);
  const scroller = el('div', 'matrix-scroll');
  scroller.append(table);
  return panel('USED_IN_PROJECTS', [scroller]);
}

export function renderSkills(content: Content, nav: Navigate): HTMLElement[] {
  if (content.skills.length === 0) return [panel('SKILLS', [empty()])];

  const search = el('input', 'skill-search');
  search.type = 'search';
  search.placeholder = 'Filter skills…';
  search.autocomplete = 'off';
  search.setAttribute('aria-label', 'Filter skills');
  const pills = el('div', 'skill-filters');
  const toolbar = el('div', 'skill-toolbar');
  toolbar.append(search, pills);

  let group = 'All';
  const cards = content.skills.map(skillGroup => {
    const tags = el('div', 'tags');
    const card = panel(skillGroup.group, [tags], 'skill-card');
    card.querySelector('.panel-head')!.append(el('span', 'panel-count', String(skillGroup.items.length)));
    const body = card.querySelector('.panel-body')!;

    tags.append(...skillGroup.items.map(item => {
      const users = usersOf(item, content.projects);
      if (users.length === 0) return el('span', 'tag', item);

      // A skill some project used: click to list those projects.
      const tag = button(item, () => {
        const wasOpen = tag.getAttribute('aria-expanded') === 'true';
        body.querySelector('.used-in')?.remove();
        for (const other of tags.querySelectorAll('[aria-expanded]')) other.setAttribute('aria-expanded', 'false');
        if (wasOpen) return;
        tag.setAttribute('aria-expanded', 'true');
        const usedIn = el('div', 'used-in');
        usedIn.append(el('span', 'dim', `${item} used in:`), ...users.map(project => button(project.name, () => nav('projects', project.slug), 'link-btn')));
        body.append(usedIn);
      }, 'tag tag-btn');
      tag.setAttribute('aria-expanded', 'false');
      tag.dataset.count = String(users.length);
      tag.title = users.length === 1 ? 'Used in 1 project' : `Used in ${users.length} projects`;
      return tag;
    }));
    return { name: skillGroup.group, card, tags: [...tags.children] as HTMLElement[] };
  });

  const none = el('p', 'skill-empty dim', 'No skills match.');
  none.hidden = true;
  const grid = el('div', 'cards');
  grid.append(...cards.map(({ card }) => card));

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const { name, card, tags } of cards) {
      let visible = 0;
      for (const tag of tags) {
        tag.hidden = !(tag.textContent ?? '').toLowerCase().includes(query);
        if (!tag.hidden) visible += 1;
      }
      card.hidden = visible === 0 || (group !== 'All' && group !== name);
      if (!card.hidden) shown += visible;
    }
    none.hidden = shown > 0;
    for (const pill of pills.children) pill.setAttribute('aria-pressed', String(pill.textContent === group));
  };

  for (const name of ['All', ...content.skills.map(skillGroup => skillGroup.group)]) {
    pills.append(button(name, () => {
      group = name;
      apply();
    }, 'skill-filter'));
  }
  search.addEventListener('input', apply);
  apply();

  const usage = matrix(content.projects, nav);
  return [toolbar, grid, none, ...(usage ? [usage] : [])];
}
