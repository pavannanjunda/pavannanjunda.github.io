import type { Content, Link } from '../content/types';
import { isSafeHref } from '../content/validate';
import { button, el, empty, linkEl, panel } from './dom';

const DEFAULT_SENDER = 'your portfolio';

function kindOf(link: Link): string {
  if (link.href.startsWith('mailto:')) return 'EMAIL';
  if (/^https:\/\/([a-z]+\.)?linkedin\.com\//.test(link.href)) return 'LINKEDIN';
  if (link.href.startsWith('https://github.com/')) return 'GITHUB';
  return 'LINK';
}

const addressOf = (href: string): string => href.slice('mailto:'.length).split('?')[0];

export function copyButton(text: string): HTMLButtonElement {
  const copy = button('COPY', () => {
    navigator.clipboard.writeText(text).then(
      () => { copy.textContent = 'COPIED'; },
      () => { copy.textContent = 'COPY FAILED'; },
    );
  }, 'copy');
  copy.setAttribute('aria-label', `Copy ${text}`);
  return copy;
}

function card(kind: string, link: Link): HTMLElement {
  const node = el('article', `contact-card contact-${kind.toLowerCase()}`);
  node.append(el('div', 'contact-kind', kind), el('div', 'contact-value', link.label));
  if (!isSafeHref(link.href)) return node;

  const actions = el('div', 'contact-actions');
  actions.append(linkEl({ label: kind === 'EMAIL' ? 'WRITE' : 'OPEN', href: link.href }, 'btn contact-open'));
  if (navigator.clipboard) actions.append(copyButton(kind === 'EMAIL' ? addressOf(link.href) : link.href));
  node.append(actions);
  return node;
}

// Name and message become the subject and body of an email link; nothing is
// sent from the page itself.
function composer(address: string): HTMLElement {
  const name = el('input', 'compose-name');
  name.type = 'text';
  name.placeholder = 'Your name';
  name.autocomplete = 'name';
  name.setAttribute('aria-label', 'Your name');
  const message = el('textarea', 'compose-message');
  message.rows = 5;
  message.placeholder = 'Your message';
  message.setAttribute('aria-label', 'Your message');
  const count = el('span', 'compose-count dim small');
  const send = el('a', 'btn primary compose-send', 'OPEN IN EMAIL APP');

  const update = () => {
    const subject = `Hello from ${name.value.trim() || DEFAULT_SENDER}`;
    const body = message.value.trim();
    send.href = `mailto:${address}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
    count.textContent = `${body.length} characters`;
  };
  name.addEventListener('input', update);
  message.addEventListener('input', update);
  update();

  const footer = el('div', 'compose-footer');
  footer.append(count, send);
  const form = el('div', 'compose');
  form.append(name, message, footer);
  return panel('SEND_A_MESSAGE', [el('p', 'dim', 'Write it here and it opens in your email app, addressed to me.'), form]);
}

export function renderContact(content: Content): HTMLElement[] {
  const links = content.contact.map(link => ({ kind: kindOf(link), link }));
  if (content.resumeHref !== undefined) links.push({ kind: 'RESUME', link: { label: 'resume.pdf', href: content.resumeHref } });
  if (links.length === 0) return [panel('CONTACT', [empty()])];

  const cards = el('div', 'contact-cards');
  cards.append(...links.map(({ kind, link }) => card(kind, link)));
  const email = content.contact.find(link => link.href.startsWith('mailto:') && isSafeHref(link.href));
  return [cards, ...(email ? [composer(addressOf(email.href))] : [])];
}
