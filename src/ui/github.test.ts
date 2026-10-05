// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { loadRepos, renderRepos } from './github';

const api = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body })) as unknown as typeof fetch;
const repo = (name: string, extra: object = {}) => ({ name, description: `${name} desc`, language: 'Python', stargazers_count: 2, html_url: `https://github.com/test-user/${name}`, fork: false, ...extra });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('asks GitHub for the user\'s recently updated repositories', async () => {
  const fetchImpl = api([repo('a')]); const repos = await loadRepos('test-user', fetchImpl);
  expect(fetchImpl).toHaveBeenCalledWith('https://api.github.com/users/test-user/repos?sort=updated&per_page=30');
  expect(repos).toEqual([{ name: 'a', description: 'a desc', language: 'Python', stars: 2, url: 'https://github.com/test-user/a' }]);
});
test('drops forks and anything that is not a GitHub link, and caps the list', async () => {
  const many = [repo('fork', { fork: true }), repo('evil', { html_url: 'javascript:alert(1)' }), ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(n => repo(n))];
  expect((await loadRepos('test-user', api(many))).map(r => r.name)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
});
test('tolerates missing fields and a body that is not a list', async () => {
  expect(await loadRepos('u', api([repo('a', { description: null, language: null, stargazers_count: undefined })])))
    .toEqual([{ name: 'a', description: '', language: '', stars: 0, url: 'https://github.com/test-user/a' }]);
  expect(await loadRepos('u', api({ message: 'rate limited' }))).toEqual([]);
});
test('a failed request rejects', async () => { await expect(loadRepos('u', api([], false))).rejects.toThrow(); });

test('shows loading, then each repository as a link', async () => {
  const el = renderRepos('test-user', async () => [{ name: 'rig', description: 'A rig', language: 'C++', stars: 3, url: 'https://github.com/test-user/rig' }]);
  expect(el.textContent).toBe('Loading repositories…'); await flush();
  expect(el.querySelector('a[href="https://github.com/test-user/rig"]')!.textContent).toBe('rig');
  expect(el.textContent).toContain('A rig'); expect(el.textContent).toContain('C++'); expect(el.textContent).toContain('★ 3');
});
test('says so when there are none, or when loading fails, and links the profile', async () => {
  const none = renderRepos('test-user', async () => []); await flush(); expect(none.textContent).toContain('No public repositories yet.');
  const failed = renderRepos('test-user', async () => { throw new Error('offline'); }); await flush();
  expect(failed.textContent).toContain("Couldn't load repositories."); expect(failed.querySelector('a[href="https://github.com/test-user"]')).not.toBeNull();
});
