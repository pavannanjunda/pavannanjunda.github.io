import type { Content, Link } from './types';

// Links are rendered only for https:, mailto: and relative paths.
export function isSafeHref(href: string): boolean {
  if (href === '') return false;
  if (href.startsWith('https://') || href.startsWith('mailto:')) return true;
  if (href.startsWith('/')) return false;
  return !href.split('/')[0].includes(':');
}

export function validateContent(content: Content): string[] {
  const problems: string[] = [];
  const checkLinks = (links: Link[], path: string) =>
    links.forEach((link, i) => {
      if (!isSafeHref(link.href)) problems.push(`${path}[${i}].href: unsafe link "${link.href}"`);
    });

  for (const field of ['name', 'handle', 'tagline'] as const) {
    if (content[field].trim() === '') problems.push(`${field}: must not be blank`);
  }
  if (content.handle.trim() !== '' && !/^[a-z0-9_-]+$/.test(content.handle)) {
    problems.push(`handle: must match [a-z0-9_-]+, got "${content.handle}"`);
  }

  const seen = new Set<string>();
  content.projects.forEach((project, i) => {
    const path = `projects[${i}]`;
    if (!/^[a-z0-9-]+$/.test(project.slug)) problems.push(`${path}.slug: must match [a-z0-9-]+, got "${project.slug}"`);
    else if (/^\d+$/.test(project.slug)) problems.push(`${path}.slug: must not be all digits, got "${project.slug}"`);
    else if (seen.has(project.slug)) problems.push(`${path}.slug: duplicate "${project.slug}"`);
    seen.add(project.slug);
    checkLinks(project.links, `${path}.links`);
  });

  checkLinks(content.contact, 'contact');
  if (content.resumeHref !== undefined && !isSafeHref(content.resumeHref)) {
    problems.push(`resumeHref: unsafe link "${content.resumeHref}"`);
  }
  return problems;
}
