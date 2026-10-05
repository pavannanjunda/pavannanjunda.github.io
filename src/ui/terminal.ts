import type { Content } from '../content/types';
import { isSafeHref } from '../content/validate';
import { COMMANDS } from '../shell/commands';
import { complete } from '../shell/complete';
import { execute } from '../shell/execute';
import { History } from '../shell/history';
import type { Line } from '../shell/output';
import { asciiBanner } from './ascii';
import { el, initials } from './dom';
import { renderLine } from './render';

const MAX_HASH_COMMAND = 100;

// A deep link is untrusted text that ends up on the page, so it is kept to
// one short line.
export function readHashCommand(hash: string): string | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return undefined;
  }
  const command = decoded.replace(/[\s\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, MAX_HASH_COMMAND);
  return command === '' ? undefined : command;
}

function buildTitlebar(title: string): HTMLElement {
  const bar = el('div', 'titlebar');
  const dots = el('span', 'dots');
  dots.setAttribute('aria-hidden', 'true');
  dots.append(el('i', 'dot'), el('i', 'dot'), el('i', 'dot'));
  bar.append(dots, el('span', 'title', title));
  return bar;
}

function buildIdentity(content: Content, run: (raw: string) => void): HTMLElement {
  const header = el('header', 'identity');
  const avatar = el('div', 'avatar', initials(content.name));
  avatar.setAttribute('aria-hidden', 'true');
  const who = el('div', 'who');
  who.append(el('div', 'name', content.name), el('div', 'tagline', content.tagline));

  const actions = el('div', 'actions');
  const contact = el('button', 'header-btn', 'contact');
  contact.type = 'button';
  contact.addEventListener('click', () => run('contact'));
  actions.append(contact);
  if (content.resumeHref !== undefined && isSafeHref(content.resumeHref)) {
    const resume = el('a', 'header-btn resume', 'resume');
    resume.href = content.resumeHref;
    actions.append(resume);
  }

  header.append(avatar, who, actions);
  return header;
}

export function mountTerminal(
  root: HTMLElement,
  content: Content,
  options?: { initialCommand?: string; bare?: boolean },
): { run(raw: string): void } {
  const promptText = `${content.handle}@portfolio:~$`;
  const history = new History();

  const output = el('div', 'output');
  output.setAttribute('role', 'log');
  output.setAttribute('aria-live', 'polite');

  const form = el('form', 'prompt-line');
  const label = el('label', 'prompt', promptText);
  label.htmlFor = 'cmd';
  const input = document.createElement('input');
  input.id = 'cmd';
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('aria-label', 'Terminal command');
  input.setAttribute('enterkeyhint', 'go');
  form.append(label, input);

  // The output and prompt scroll together inside the window; the chips stay
  // put beneath them.
  const screen = el('div', 'screen');
  screen.append(output, form);

  const chips = el('nav', 'chips');
  chips.setAttribute('aria-label', 'Commands');

  const print = (lines: Line[]) => output.append(...lines.map(line => renderLine(line, run)));

  const echo = (raw: string): HTMLElement => {
    const line = renderLine([{ text: promptText, style: 'accent' }, { text: ` ${raw}` }], run);
    line.classList.add('echo');
    output.append(line);
    return line;
  };

  // Scroll to the prompt, but if the output is taller than the screen, show
  // its start instead of its end.
  const reveal = (start: HTMLElement) => {
    form.scrollIntoView?.({ block: 'nearest' });
    if (start.isConnected) start.scrollIntoView?.({ block: 'nearest' });
  };

  function run(raw: string): void {
    const echoed = echo(raw);
    const result = execute(raw, content);
    if (result.clear) output.replaceChildren();
    else print(result.lines);
    history.push(raw);
    input.value = '';
    reveal(echoed);
  }

  for (const command of COMMANDS) {
    if (command.name === 'clear') continue;
    const chip = el('button', 'chip', command.name);
    chip.type = 'button';
    chip.addEventListener('click', () => run(command.name));
    chips.append(chip);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    run(input.value);
  });

  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    const key = event.key ?? '';
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      const entry = key === 'ArrowUp' ? history.prev() : history.next();
      if (entry !== undefined) input.value = entry;
    } else if (key === 'Tab' && !event.shiftKey && input.value.trim() !== '') {
      const typed = input.value;
      const { value, options: matches } = complete(typed, content);
      // Nothing to complete: let Tab move focus as usual.
      if (value === typed && matches.length === 0) return;
      event.preventDefault();
      input.value = value;
      if (matches.length > 0) {
        const echoed = echo(typed);
        print([[{ text: matches.join('  ') }]]);
        reveal(echoed);
      }
    } else if (key.toLowerCase() === 'l' && event.ctrlKey) {
      event.preventDefault();
      output.replaceChildren();
    }
  });

  root.addEventListener('click', event => {
    const target = event.target as Element | null;
    if (target?.closest('a, button')) return;
    if (window.getSelection()?.toString()) return;
    input.focus();
  });

  // Bare: just the screen and chips, for embedding in another layout.
  if (options?.bare) {
    root.classList.add('term');
    root.replaceChildren(screen, chips);
  } else {
    root.classList.add('window');
    root.replaceChildren(
      buildTitlebar(`${content.handle}@portfolio:~`),
      buildIdentity(content, run),
      screen,
      chips,
    );
  }

  const art = asciiBanner(content.name);
  if (art.length > 0) {
    const pre = el('pre', 'ascii', art.join('\n'));
    pre.setAttribute('aria-hidden', 'true');
    output.append(pre);
  }
  print([
    [{ text: 'Welcome to my interactive portfolio.' }],
    [{ text: 'Here are the available commands to explore:', style: 'dim' }],
    [],
    ...execute('help', content).lines,
    [],
    [{ text: "Type 'help' or tap a command below.", style: 'dim' }],
  ]);
  if (options?.initialCommand !== undefined) run(options.initialCommand);

  return { run };
}
