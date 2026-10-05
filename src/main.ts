import './style.css';
import { CONTENT } from './content/content';
import { mountTerminal, readHashCommand } from './ui/terminal';

const root = document.querySelector<HTMLElement>('#app')!;
mountTerminal(root, CONTENT, { initialCommand: readHashCommand(location.hash) });

// Focusing on a touch device would pop the keyboard up over the chips.
if (window.matchMedia('(pointer: fine)').matches) {
  root.querySelector<HTMLInputElement>('#cmd')?.focus();
}
