import './style.css';
import { CONTENT } from './content/content';
import { mountDashboard } from './ui/dashboard';
import { readHashCommand } from './ui/terminal';

const root = document.querySelector<HTMLElement>('#app')!;
const route = () => readHashCommand(location.hash) ?? 'terminal';

// The hash is the route, so sections can be linked to and Back works.
const dashboard = mountDashboard(root, CONTENT, {
  initialRoute: route(),
  onNavigate: next => {
    if (route() !== next) location.hash = next;
  },
});
window.addEventListener('hashchange', () => dashboard.show(route()));

// Ready to type on load; on a touch device this would pop the keyboard up.
if (window.matchMedia('(pointer: fine)').matches) {
  root.querySelector<HTMLInputElement>('#cmd')?.focus();
}
