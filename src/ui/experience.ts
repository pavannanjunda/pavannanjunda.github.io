import type { Content, Job } from '../content/types';
import { dateRange } from '../shell/commands';
import { button, el, empty, panel } from './dom';

type Kind = NonNullable<Job['kind']>;

const KINDS: { kind: Kind; label: string }[] = [
  { kind: 'work', label: 'Work' },
  { kind: 'training', label: 'Training' },
  { kind: 'leadership', label: 'Leadership' },
];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const PRESENT = 'present';

// "Feb 2026" -> months since year 0, or undefined if it isn't in that form.
function monthIndex(text: string, now: Date): number | undefined {
  if (text.toLowerCase() === PRESENT) return now.getFullYear() * 12 + now.getMonth();
  const match = /^([A-Za-z]{3})[a-z]* (\d{4})$/.exec(text.trim());
  if (!match) return undefined;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  return month === -1 ? undefined : Number(match[2]) * 12 + month;
}

// How long a role lasted, counting both the first and the last month.
export function duration(start: string, end: string, now: Date = new Date()): string | undefined {
  const from = monthIndex(start, now);
  const to = monthIndex(end, now);
  if (from === undefined || to === undefined || to < from) return undefined;
  const months = to - from + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years > 0 ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : '',
    rest > 0 ? `${rest} ${rest === 1 ? 'mo' : 'mos'}` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

function timelineItem(job: Job, now: Date): HTMLElement {
  const kind: Kind = job.kind ?? 'work';
  const item = el('li', `tl-item tl-${kind}`);
  item.dataset.kind = kind;

  const details = el('details', 'entry');
  const summary = el('summary', '');
  const title = el('h3', '');
  title.append(el('span', 'tl-role', job.role), el('span', 'dim', ' @ '), el('span', 'tl-company', job.company));
  const meta = el('div', 'tl-meta');
  meta.append(el('span', 'tl-dates', dateRange(job.start, job.end)));
  const length = duration(job.start, job.end, now);
  if (length !== undefined) meta.append(el('span', 'tl-duration', length));
  meta.append(el('span', 'tl-kind', kind.toUpperCase()));
  if (job.end.toLowerCase() === PRESENT) meta.append(el('span', 'tl-current', 'CURRENT'));
  summary.append(title, meta);

  const body = el('div', 'entry-body');
  if (job.highlights.length > 0) {
    const list = el('ul', '');
    list.append(...job.highlights.map(point => el('li', '', point)));
    body.append(list);
  } else {
    body.append(el('p', 'dim', 'No details added yet.'));
  }
  details.append(summary, body);
  item.append(details);
  return item;
}

export function renderExperience(content: Content, now: Date = new Date()): HTMLElement[] {
  if (content.experience.length === 0) return [panel('EXPERIENCE_LOG', [empty()])];

  const items = content.experience.map(job => timelineItem(job, now));
  const timeline = el('ol', 'timeline');
  timeline.append(...items);

  const toolbar = el('div', 'tl-toolbar');
  const present = KINDS.filter(({ kind }) => items.some(item => item.dataset.kind === kind));
  if (present.length > 1) {
    const filters = el('div', 'tl-filters');
    const pills: HTMLButtonElement[] = [];
    const options = [{ kind: undefined, label: 'All' }, ...present];
    for (const option of options) {
      const count = option.kind ? items.filter(item => item.dataset.kind === option.kind).length : items.length;
      const pill = button('', () => {
        for (const item of items) item.hidden = option.kind !== undefined && item.dataset.kind !== option.kind;
        for (const other of pills) other.setAttribute('aria-pressed', String(other === pill));
      }, `tl-filter${option.kind ? ` tl-${option.kind}` : ''}`);
      pill.append(el('span', 'tl-filter-label', option.label), el('span', 'count', String(count)));
      pill.setAttribute('aria-pressed', String(option.kind === undefined));
      pills.push(pill);
    }
    filters.append(...pills);
    toolbar.append(filters);
  }

  const expand = button('EXPAND ALL', () => {
    const open = expand.textContent === 'EXPAND ALL';
    for (const item of items) item.querySelector('details')!.open = open;
    expand.textContent = open ? 'COLLAPSE ALL' : 'EXPAND ALL';
  }, 'btn tl-expand');
  toolbar.append(expand);

  return [toolbar, timeline];
}
