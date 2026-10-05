import type { Content } from './types';

export const FIXTURE: Content = {
  name: 'Test User', handle: 'test', tagline: 'Robotics engineer',
  about: ['First paragraph.', 'Second paragraph.'],
  experience: [{ company: 'Acme Robotics', role: 'Engineer', start: '2026-04', end: 'present', highlights: ['Built a thing.'] }],
  education: [{ institution: 'Test University', degree: 'B.E. Mechanical', start: '2022', end: '2026' }],
  projects: [
    { slug: 'alpha-bot', name: 'Alpha Bot', summary: 'A line follower', details: ['Detail one.'], tech: ['C++', 'ROS 2'], links: [{ label: 'code', href: 'https://example.com/alpha' }] },
    { slug: 'beta-arm', name: 'Beta Arm', summary: 'A 3-DOF arm', details: [], tech: [], links: [] },
  ],
  skills: [{ group: 'Languages', items: ['C++', 'Python'] }],
  contact: [{ label: 'email', href: 'mailto:test@example.com' }, { label: 'github', href: 'https://github.com/test' }],
  resumeHref: 'resume.pdf',
};
