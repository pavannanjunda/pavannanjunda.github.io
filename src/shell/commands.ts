import type { Content, Link, Project } from '../content/types';
import type { Line, Result } from './output';

export interface Command {
  name: string; summary: string;
  args?: (content: Content) => string[];           // completable arguments
  run: (args: string[], content: Content) => Result;
}

const NAME_WIDTH = 12;

const text = (value: string): Line => [{ text: value }];
const accent = (value: string): Line => [{ text: value, style: 'accent' }];
const dim = (value: string): Line => [{ text: value, style: 'dim' }];
const linkLine = (link: Link): Line => [{ text: link.label, href: link.href }];
const dateRange = (start: string, end: string): string => (start === end ? end : `${start} – ${end}`);

// Blank line between entries, none after the last.
const joinEntries = (entries: Line[][]): Line[] =>
  entries.flatMap((entry, i) => (i === 0 ? entry : [[], ...entry]));

function findProject(arg: string, projects: Project[]): Project | undefined {
  if (/^\d+$/.test(arg)) return projects[Number(arg) - 1];
  return projects.find(project => project.slug === arg);
}

function projectList(projects: Project[]): Line[] {
  return [
    ...projects.map((project, i): Line => [
      { text: `[${i + 1}] ` },
      { text: project.slug, style: 'accent', command: `projects ${project.slug}` },
      { text: ` — ${project.summary}` },
    ]),
    dim("Run 'projects <name>' or 'projects <number>' for details."),
  ];
}

function projectDetail(project: Project): Line[] {
  return [
    accent(project.name),
    text(project.summary),
    ...project.details.map(detail => text(`- ${detail}`)),
    ...(project.tech.length > 0 ? [dim(`tech: ${project.tech.join(', ')}`)] : []),
    ...project.links.map(linkLine),
  ];
}

export const COMMANDS: Command[] = [
  {
    name: 'help', summary: 'list commands',
    run: () => ({
      lines: COMMANDS.map((command): Line => [
        { text: command.name.padEnd(NAME_WIDTH), style: 'accent', command: command.name },
        { text: command.summary },
      ]),
    }),
  },
  {
    name: 'about', summary: 'who I am',
    run: (_args, content) => ({ lines: joinEntries(content.about.map(paragraph => [text(paragraph)])) }),
  },
  {
    name: 'experience', summary: "where I've worked",
    run: (_args, content) => ({
      lines: joinEntries(content.experience.map(job => [
        accent(`${job.role} @ ${job.company}`),
        dim(dateRange(job.start, job.end)),
        ...job.highlights.map(highlight => text(`- ${highlight}`)),
      ])),
    }),
  },
  {
    name: 'education', summary: 'where I studied',
    run: (_args, content) => ({
      lines: joinEntries(content.education.map(school => [
        accent(school.degree),
        dim(`${school.institution}, ${dateRange(school.start, school.end)}`),
        ...(school.notes ?? []).map(note => text(`- ${note}`)),
      ])),
    }),
  },
  {
    name: 'projects', summary: "things I've built",
    args: content => content.projects.map(project => project.slug),
    run: (args, content) => {
      if (args.length === 0) return { lines: projectList(content.projects) };
      const project = findProject(args[0], content.projects);
      if (project) return { lines: projectDetail(project) };
      return {
        lines: [
          [{ text: `no such project: ${args[0]}`, style: 'error' }],
          dim(`Available: ${content.projects.map(p => p.slug).join(', ')}`),
        ],
      };
    },
  },
  {
    name: 'skills', summary: 'tools I use',
    run: (_args, content) => ({
      lines: content.skills.map((group): Line => [
        { text: `${group.group}: `, style: 'accent' },
        { text: group.items.join(', ') },
      ]),
    }),
  },
  {
    name: 'contact', summary: 'how to reach me',
    run: (_args, content) => ({ lines: content.contact.map(linkLine) }),
  },
  {
    name: 'resume', summary: 'get my resume',
    run: (_args, content) => ({
      lines: [content.resumeHref === undefined
        ? text('No resume file published yet.')
        : linkLine({ label: 'resume.pdf', href: content.resumeHref })],
    }),
  },
  { name: 'clear', summary: 'clear the screen', run: () => ({ lines: [], clear: true }) },
];

export function findCommand(name: string): Command | undefined {
  return COMMANDS.find(command => command.name === name);
}
