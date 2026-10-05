const SPOTLIT = '.hero, .panel, .tl-item, .contact-card, .repo';

const motionAllowed = (): boolean =>
  typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  && typeof requestAnimationFrame === 'function';

// Shows `target`, counting up from zero when the visitor allows motion.
export function countUp(node: HTMLElement, target: number, format: (value: number) => string, ms = 900): void {
  node.textContent = format(target);
  if (target === 0 || !motionAllowed()) return;

  node.textContent = format(0);
  let start: number | undefined;
  const step = (now: number) => {
    start ??= now;
    const progress = Math.min(1, (now - start) / ms);
    const eased = 1 - (1 - progress) ** 3;
    node.textContent = format(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Records where the pointer is inside the card under it, as --mx / --my, so
// CSS can draw a glow there.
export function trackSpotlight(area: HTMLElement): void {
  area.addEventListener('mousemove', event => {
    const card = (event.target as Element | null)?.closest<HTMLElement>(SPOTLIT);
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - box.left}px`);
    card.style.setProperty('--my', `${event.clientY - box.top}px`);
  });
}
