import { el, linkEl } from './dom';

export interface Repo { name: string; description: string; language: string; stars: number; url: string }

const MAX_REPOS = 6;
const text = (value: unknown): string => (typeof value === 'string' ? value : '');

// The user's own public repositories, most recently updated first.
export async function loadRepos(user: string, fetchImpl: typeof fetch = fetch): Promise<Repo[]> {
  const response = await fetchImpl(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=30`);
  if (!response.ok) throw new Error('GitHub request failed');
  const body: unknown = await response.json();
  if (!Array.isArray(body)) return [];
  return body
    .filter(raw => raw && raw.fork !== true && text(raw.html_url).startsWith('https://github.com/') && text(raw.name) !== '')
    .slice(0, MAX_REPOS)
    .map(raw => ({
      name: text(raw.name),
      description: text(raw.description),
      language: text(raw.language),
      stars: typeof raw.stargazers_count === 'number' ? raw.stargazers_count : 0,
      url: text(raw.html_url),
    }));
}

// A list that fills in once the repositories arrive.
export function renderRepos(user: string, load: (user: string) => Promise<Repo[]> = loadRepos): HTMLElement {
  const node = el('div', 'repos');
  node.setAttribute('aria-live', 'polite');
  node.append(el('p', 'dim', 'Loading repositories…'));
  const profile = () => linkEl({ label: `github.com/${user}`, href: `https://github.com/${user}` });

  load(user).then(repos => {
    if (repos.length === 0) {
      const none = el('p', 'dim', 'No public repositories yet. ');
      none.append(profile());
      node.replaceChildren(none);
      return;
    }
    node.replaceChildren(...repos.map(repo => {
      const card = el('article', 'repo');
      const meta = [repo.language, `★ ${repo.stars}`].filter(Boolean).join(' · ');
      card.append(linkEl({ label: repo.name, href: repo.url }, 'repo-name'), el('p', '', repo.description), el('div', 'dim small', meta));
      return card;
    }));
  }).catch(() => {
    const failed = el('p', 'dim', "Couldn't load repositories. ");
    failed.append(profile());
    node.replaceChildren(failed);
  });
  return node;
}
