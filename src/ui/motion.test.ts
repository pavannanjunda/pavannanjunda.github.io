// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { countUp, trackSpotlight } from './motion';

const pad = (n: number) => String(n).padStart(2, '0');
afterEach(() => { vi.unstubAllGlobals(); });
const motionAllowed = (allowed: boolean) => vi.stubGlobal('matchMedia', (query: string) => ({ matches: allowed && query.includes('no-preference') }));

test('without motion support the number is simply shown', () => {
  const node = document.createElement('span'); countUp(node, 7, pad); expect(node.textContent).toBe('07');
});
test('a visitor who asked for reduced motion gets the number at once', () => {
  motionAllowed(false); const frame = vi.fn(); vi.stubGlobal('requestAnimationFrame', frame);
  const node = document.createElement('span'); countUp(node, 7, pad); expect(node.textContent).toBe('07'); expect(frame).not.toHaveBeenCalled();
});
test('otherwise it counts from zero up to the number and stops there', () => {
  motionAllowed(true); const frames: FrameRequestCallback[] = []; vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  const node = document.createElement('span'); countUp(node, 20, pad, 1000);
  expect(node.textContent).toBe('00');
  frames.shift()!(0); frames.shift()!(500); const midway = Number(node.textContent); expect(midway).toBeGreaterThan(0); expect(midway).toBeLessThan(20);
  frames.shift()!(1000); expect(node.textContent).toBe('20'); expect(frames.length).toBe(0);
});
test('zero has nothing to count', () => {
  motionAllowed(true); const frame = vi.fn(); vi.stubGlobal('requestAnimationFrame', frame);
  const node = document.createElement('span'); countUp(node, 0, pad); expect(node.textContent).toBe('00'); expect(frame).not.toHaveBeenCalled();
});
test('the spotlight follows the pointer over a card, relative to that card', () => {
  const area = document.createElement('div'); const card = document.createElement('section'); card.className = 'panel'; const inner = document.createElement('p');
  card.append(inner); area.append(card); document.body.replaceChildren(area);
  card.getBoundingClientRect = () => ({ left: 100, top: 40, right: 300, bottom: 240, width: 200, height: 200, x: 100, y: 40, toJSON: () => ({}) });
  trackSpotlight(area);
  inner.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 150, clientY: 60 }));
  expect(card.style.getPropertyValue('--mx')).toBe('50px'); expect(card.style.getPropertyValue('--my')).toBe('20px');
  area.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 5, clientY: 5 })); expect(area.style.getPropertyValue('--mx')).toBe('');
});
