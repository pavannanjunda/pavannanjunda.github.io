import type { Content } from '../content/types';
import { COMMANDS, findCommand } from './commands';

function commonPrefix(words: string[]): string {
  let prefix = words[0];
  for (const word of words) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export function complete(raw: string, content: Content): { value: string; options: string[] } {
  const words = raw.trimStart().toLowerCase().split(/\s+/);
  if (words.length > 2) return { value: raw, options: [] };

  const completingName = words.length === 1;
  const word = words[words.length - 1];
  const head = completingName ? '' : `${words[0]} `;
  const candidates = completingName
    ? COMMANDS.map(command => command.name)
    : findCommand(words[0])?.args?.(content) ?? [];

  const matches = candidates.filter(candidate => candidate.startsWith(word));
  if (matches.length === 0) return { value: raw, options: [] };
  if (matches.length === 1) return { value: `${head}${matches[0]} `, options: [] };
  return { value: head + commonPrefix(matches), options: matches };
}
