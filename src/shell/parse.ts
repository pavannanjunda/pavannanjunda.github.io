export function parseInput(raw: string): { name: string; args: string[] } | null {
  const words = raw.trim().toLowerCase().split(/\s+/);
  if (words[0] === '') return null;
  return { name: words[0], args: words.slice(1) };
}
