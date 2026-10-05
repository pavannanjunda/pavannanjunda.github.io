import type { Content } from '../content/types';
import { COMMANDS } from '../shell/commands';
import { complete } from '../shell/complete';
import { execute } from '../shell/execute';
import { History } from '../shell/history';
import type { Line } from '../shell/output';
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

export function mountTerminal(
  root: HTMLElement,
  content: Content,
  options?: { initialCommand?: string },
): { run(raw: string): void } {
  const promptText = `${content.handle}@portfolio:~$`;
  const history = new History();

  const output = document.createElement('div');
  output.className = 'output';
  output.setAttribute('role', 'log');
  output.setAttribute('aria-live', 'polite');

  const form = document.createElement('form');
  form.className = 'prompt-line';
  const label = document.createElement('label');
  label.className = 'prompt';
  label.htmlFor = 'cmd';
  label.textContent = promptText;
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

  const chips = document.createElement('nav');
  chips.className = 'chips';
  chips.setAttribute('aria-label', 'Commands');

  const print = (lines: Line[]) => output.append(...lines.map(line => renderLine(line, run)));

  const echo = (raw: string): HTMLElement => {
    const line = renderLine([{ text: promptText, style: 'accent' }, { text: ` ${raw}` }], run);
    line.classList.add('echo');
    output.append(line);
    return line;
  };

  // Scroll to the prompt at the bottom, but if the output is taller than the
  // viewport, show its start instead of its end. The command a deep link runs
  // at load is not scrolled to, so the banner stays on screen.
  let mounted = false;
  const reveal = (start: HTMLElement) => {
    if (!mounted) return;
    root.scrollIntoView?.({ block: 'end' });
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
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = command.name;
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

  root.replaceChildren(output, form, chips);
  print([
    [{ text: content.name, style: 'accent' }],
    [{ text: content.tagline }],
    [],
    [{ text: "Type 'help' or tap a command below.", style: 'dim' }],
  ]);
  if (options?.initialCommand !== undefined) run(options.initialCommand);
  mounted = true;

  return { run };
}
