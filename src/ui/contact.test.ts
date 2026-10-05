// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { FIXTURE } from '../content/fixture';
import type { Content } from '../content/types';
import { renderContact } from './contact';

const mount = (content: Content = FIXTURE) => {
  const root = document.createElement('div'); root.append(...renderContact(content)); document.body.replaceChildren(root);
  const cards = () => [...root.querySelectorAll<HTMLElement>('.contact-card')];
  return { root, cards };
};
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('each way to reach me is a card named for what it is', () => {
  const { cards } = mount();
  expect(cards().map(c => c.querySelector('.contact-kind')!.textContent)).toEqual(['EMAIL', 'GITHUB', 'RESUME']);
  expect(cards()[0].querySelector('.contact-value')!.textContent).toBe('email');
  expect(cards()[1].querySelector<HTMLAnchorElement>('a.contact-open')!.getAttribute('href')).toBe('https://github.com/test');
  expect(cards()[1].querySelector<HTMLAnchorElement>('a.contact-open')!.rel).toBe('noopener noreferrer');
});
test('recognises LinkedIn and falls back to LINK', () => {
  const contact = [{ label: 'in', href: 'https://www.linkedin.com/in/x' }, { label: 'site', href: 'https://example.com' }];
  expect(mount({ ...FIXTURE, contact, resumeHref: undefined }).cards().map(c => c.querySelector('.contact-kind')!.textContent)).toEqual(['LINKEDIN', 'LINK']);
});
test('an unsafe link is shown as text with nothing to click', () => {
  const { root, cards } = mount({ ...FIXTURE, contact: [{ label: 'x', href: 'javascript:alert(1)' }], resumeHref: undefined });
  expect(root.querySelector('a')).toBeNull(); expect(cards()[0].querySelector('button')).toBeNull(); expect(cards()[0].textContent).toContain('x');
});
test('copy buttons appear only with a clipboard, and copy the address or URL', async () => {
  expect(mount().root.querySelector('.copy')).toBeNull();
  const writeText = vi.fn(async () => {}); Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  try {
    const { root } = mount(); const copies = [...root.querySelectorAll<HTMLButtonElement>('.copy')]; expect(copies.length).toBe(3);
    copies[0].click(); copies[1].click(); await flush();
    expect(writeText).toHaveBeenNthCalledWith(1, 'test@example.com'); expect(writeText).toHaveBeenNthCalledWith(2, 'https://github.com/test');
    expect(copies[0].textContent).toBe('COPIED');
  } finally { delete (navigator as { clipboard?: unknown }).clipboard; }
});
test('the message composer builds an email link as you type', () => {
  const { root } = mount(); const send = root.querySelector<HTMLAnchorElement>('a.compose-send')!;
  expect(send.getAttribute('href')).toBe('mailto:test@example.com?subject=Hello%20from%20your%20portfolio');
  const name = root.querySelector<HTMLInputElement>('.compose-name')!; const message = root.querySelector<HTMLTextAreaElement>('.compose-message')!;
  name.value = 'Asha & Co'; name.dispatchEvent(new Event('input', { bubbles: true }));
  message.value = 'Hi Pavan,\nLet\'s talk?'; message.dispatchEvent(new Event('input', { bubbles: true }));
  expect(send.getAttribute('href')).toBe("mailto:test@example.com?subject=Hello%20from%20Asha%20%26%20Co&body=Hi%20Pavan%2C%0ALet's%20talk%3F");
  expect(root.querySelector('.compose-count')!.textContent).toBe('21 characters');
});
test('there is no composer without an email address, and an empty list says so', () => {
  expect(mount({ ...FIXTURE, contact: [FIXTURE.contact[1]] }).root.querySelector('.compose')).toBeNull();
  expect(mount({ ...FIXTURE, contact: [], resumeHref: undefined }).root.textContent).toContain('Nothing here yet.');
});
