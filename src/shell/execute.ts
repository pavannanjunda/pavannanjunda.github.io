import type { Content } from '../content/types';
import { COMMANDS, findCommand } from './commands';
import type { Result } from './output';
import { parseInput } from './parse';
import { suggest } from './suggest';

export function execute(raw: string, content: Content): Result {
  const parsed = parseInput(raw);
  if (parsed === null) return { lines: [] };

  const command = findCommand(parsed.name);
  if (command) return command.run(parsed.args, content);

  const suggestion = suggest(parsed.name, COMMANDS.map(c => c.name));
  return {
    lines: [
      [{ text: `command not found: ${parsed.name}`, style: 'error' }],
      [{ text: suggestion ? `Did you mean '${suggestion}'?` : "Type 'help' to see available commands." }],
    ],
  };
}
