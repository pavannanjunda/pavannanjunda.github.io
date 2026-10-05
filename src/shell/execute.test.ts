import { expect, test } from 'vitest';
import { FIXTURE } from '../content/fixture';
import { COMMANDS } from './commands';
import { execute } from './execute';
import { toText } from './output';

const run = (s: string) => toText(execute(s, FIXTURE));

test('command order is fixed', () => expect(COMMANDS.map(c => c.name)).toEqual(
  ['help', 'about', 'experience', 'education', 'projects', 'skills', 'contact', 'resume', 'open', 'whoami', 'ls', 'cat', 'clear', 'sudo']));
test('blank input yields no lines', () => expect(execute('  ', FIXTURE)).toEqual({ lines: [] }));
test('help lists every command as a tappable name', () => {
  const r = execute('help', FIXTURE);
  for (const c of COMMANDS.filter(c => !c.hidden)) expect(r.lines.some(l => l.some(s => s.command === c.name))).toBe(true);
  expect(toText(r)).not.toContain('sudo');
  expect(toText(r)).toContain('things I\'ve built');
});
test('about prints each paragraph', () => { expect(run('about')).toContain('First paragraph.'); expect(run('about')).toContain('Second paragraph.'); });
test('experience and education print their entries', () => {
  expect(run('experience')).toContain('Engineer'); expect(run('experience')).toContain('Acme Robotics'); expect(run('experience')).toContain('Built a thing.');
  expect(run('education')).toContain('B.E. Mechanical'); expect(run('education')).toContain('Test University');
});
test('education prints one year when start and end are the same', () => {
  const school = { institution: 'Test School', degree: 'Class 10', start: '2020', end: '2020' };
  const r = toText(execute('education', { ...FIXTURE, education: [school] }));
  expect(r).toContain('Test School, 2020'); expect(r).not.toContain('–');
});
test('projects lists numbered tappable slugs', () => {
  const r = execute('projects', FIXTURE);
  expect(toText(r)).toContain('[1] alpha-bot'); expect(toText(r)).toContain('[2] beta-arm');
  expect(r.lines.some(l => l.some(s => s.command === 'projects alpha-bot'))).toBe(true);
  expect(toText(r)).toContain("Run 'projects <name>' or 'projects <number>' for details.");
});
test('projects accepts a slug or a number', () => {
  for (const arg of ['alpha-bot', '1']) {
    const r = execute(`projects ${arg}`, FIXTURE);
    expect(toText(r)).toContain('Alpha Bot'); expect(toText(r)).toContain('Detail one.'); expect(toText(r)).toContain('C++, ROS 2');
    expect(r.lines.some(l => l.some(s => s.href === 'https://example.com/alpha'))).toBe(true);
  }
});
test('a project with no details, tech or links prints no empty rows', () => {
  const r = execute('projects beta-arm', FIXTURE);
  expect(toText(r)).toContain('Beta Arm'); expect(toText(r)).not.toContain('tech:');
  expect(r.lines.every(l => l.length > 0)).toBe(true);
});
test('rejects an unknown project', () => {
  for (const arg of ['99', '0', 'nope']) {
    const r = execute(`projects ${arg}`, FIXTURE);
    expect(r.lines[0]).toEqual([{ text: `no such project: ${arg}`, style: 'error' }]);
    expect(toText(r)).toContain('Available: alpha-bot, beta-arm');
  }
});
test('skills and contact print their entries', () => {
  expect(run('skills')).toContain('Languages'); expect(run('skills')).toContain('C++, Python');
  expect(execute('contact', FIXTURE).lines.some(l => l.some(s => s.href === 'mailto:test@example.com'))).toBe(true);
});
test('resume links the file, or says there is none', () => {
  expect(execute('resume', FIXTURE).lines.some(l => l.some(s => s.href === 'resume.pdf'))).toBe(true);
  expect(toText(execute('resume', { ...FIXTURE, resumeHref: undefined }))).toBe('No resume file published yet.');
});
test('clear asks the UI to clear', () => expect(execute('clear', FIXTURE)).toEqual({ lines: [], clear: true }));
test('unknown command with a near match', () => {
  const r = execute('projcts', FIXTURE);
  expect(r.lines[0]).toEqual([{ text: 'command not found: projcts', style: 'error' }]);
  expect(toText(r)).toContain("Did you mean 'projects'?");
});
test('unknown command with no near match', () => expect(run('xyzzy')).toContain("Type 'help' to see available commands."));
test('ignores case and extra whitespace', () => expect(run('  PROJECTS   Alpha-Bot ')).toContain('Alpha Bot'));

test('open asks the UI to navigate to a section', () => {
  const r = execute('open Skills', FIXTURE); expect(r.navigate).toBe('skills'); expect(toText(r)).toContain('Opening skills');
});
test('open without a section, or with an unknown one, explains itself', () => {
  const bare = execute('open', FIXTURE); expect(bare.navigate).toBeUndefined(); expect(toText(bare)).toContain('Usage: open <section>');
  const bad = execute('open nope', FIXTURE); expect(bad.navigate).toBeUndefined();
  expect(bad.lines[0]).toEqual([{ text: 'no such section: nope', style: 'error' }]); expect(toText(bad)).toContain('Available: dashboard, about');
});

test('whoami prints the name and tagline', () => expect(run('whoami')).toBe('Test User\nRobotics engineer'));
test('ls lists files that cat can read', () => {
  const r = execute('ls', FIXTURE);
  expect(toText(r)).toBe('about.txt  experience.txt  education.txt  skills.txt  contact.txt  projects/');
  expect(r.lines[0].some(s => s.command === 'cat about.txt')).toBe(true); expect(r.lines[0].some(s => s.command === 'projects')).toBe(true);
});
test('cat reads a section file or a project', () => {
  expect(run('cat about.txt')).toBe(run('about')); expect(run('cat SKILLS')).toBe(run('skills'));
  expect(run('cat alpha-bot')).toContain('Alpha Bot');
});
test('cat without a file, or with an unknown one, explains itself', () => {
  expect(run('cat')).toContain('Usage: cat <file>');
  expect(execute('cat nope.txt', FIXTURE).lines[0]).toEqual([{ text: 'cat: nope.txt: No such file', style: 'error' }]);
});
test('sudo is a hidden joke that ends with the contact links', () => {
  const r = execute('sudo hire-me', FIXTURE);
  expect(toText(r)).toContain('No password needed'); expect(r.lines.some(l => l.some(s => s.href === 'mailto:test@example.com'))).toBe(true);
});
test('education lists certifications after schools', () => {
  const certifications = [{ name: 'Machine Learning', issuer: 'Udemy', year: '2025' }];
  const text = toText(execute('education', { ...FIXTURE, certifications }));
  expect(text).toContain('Certifications'); expect(text).toContain('- Machine Learning — Udemy, 2025');
  expect(run('education')).not.toContain('Certifications');
});
test('open can reach certifications', () => expect(execute('open certifications', FIXTURE).navigate).toBe('certifications'));
