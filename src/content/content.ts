import type { Content } from './types';

// The one file to edit when the portfolio changes. Everything here comes from
// the resume; `npm test` checks it with validateContent.
export const CONTENT: Content = {
  name: 'Pavan N',
  handle: 'pavan',
  tagline: 'AI & ML trainee at XP Robotics · B.E. in AI & ML',

  about: [
    "I'm an AI & ML engineering graduate from Cambridge Institute of Technology, based in Bengaluru, and I work as an AI & ML trainee at XP Robotics.",
    'My projects span computer vision, natural language processing and IoT, built with Python, TensorFlow and OpenCV on hardware such as the Raspberry Pi and Arduino.',
    'At college I was Secretary of the Cambridge IEEE Student Chapter and led operations for AdAstra, the college drone club.',
  ],

  experience: [
    { role: 'AI & ML Trainee', kind: 'work', company: 'XP Robotics', start: 'Feb 2026', end: 'present', highlights: [] },
    { role: 'Data Science (AI) Trainee', kind: 'training', company: 'Nasscom Foundation & Capgemini', start: 'Jan 2026', end: 'Mar 2026', highlights: [] },
    {
      role: 'Engineering Trainee', kind: 'training', company: 'Board Infinity', start: 'Mar 2025', end: 'Sep 2025',
      highlights: ['Trained in data structures (arrays, linked lists, trees) and algorithmic analysis.'],
    },
    {
      role: 'Secretary', kind: 'leadership', company: 'Cambridge IEEE Student Chapter', start: 'Dec 2024', end: 'Dec 2025',
      highlights: ['Organised 12 technical events and workshops across the Secretary and Webmaster roles.'],
    },
    {
      role: 'IoT Trainee', kind: 'training', company: 'Samsung Innovation Campus', start: 'Oct 2024', end: 'Mar 2025',
      highlights: [
        'Trained on Raspberry Pi and Arduino hardware and IoT applications.',
        'Designed and built the Automated Water Irrigation System capstone.',
      ],
    },
    { role: 'Webmaster', kind: 'leadership', company: 'Cambridge IEEE RAS Student Chapter', start: 'Jun 2024', end: 'Dec 2024', highlights: [] },
    {
      role: 'Operations Team Lead', kind: 'leadership', company: 'AdAstra CIT', start: 'Oct 2023', end: 'Oct 2024',
      highlights: ['Coordinated team activities and operations for the college drone club.'],
    },
  ],

  education: [
    { degree: 'B.E. in AI & ML', institution: 'Cambridge Institute of Technology', start: '2026', end: '2026' },
    { degree: 'Pre-University (PCMB)', institution: 'Christ Junior College', start: '2022', end: '2022', notes: ['94%'] },
    { degree: 'SSLC / Class 10', institution: 'St Francis High School', start: '2020', end: '2020', notes: ['95%'] },
  ],

  projects: [
    {
      slug: 'defect-detection',
      name: 'Defect Detection and Diameter Measurement',
      summary: 'Real-time vision inspection of industrial parts',
      details: [
        'Detects metal defects and measures the inner and outer diameters of industrial components in real time.',
        'Runs on a Raspberry Pi 5 with a dual-camera setup (5MP and 12MP).',
        'Raises alerts through a monitoring dashboard.',
      ],
      tech: ['Faster R-CNN', 'OpenCV', 'Raspberry Pi 5'],
      links: [{ label: 'Source code on GitHub', href: 'https://github.com/pavannanjunda/Metal-Defect-Detection-System' }],
    },
    {
      slug: 'irrigation',
      name: 'Automated Water Irrigation System',
      summary: 'Arduino irrigation system with a web dashboard',
      details: [
        'Capstone project of the Samsung Innovation Campus IoT training.',
        'Arduino-powered automated irrigation for farm fields, built from IoT components.',
        'Includes a web application for monitoring and control.',
      ],
      tech: ['Arduino', 'IoT'],
      links: [],
    },
    {
      slug: 'hand-gesture',
      name: 'Hand Gesture Detection',
      summary: 'Detects and recognises predefined hand gestures',
      details: ['A mini project that detects predefined hand gestures and recognises them.'],
      tech: ['TensorFlow', 'OpenCV'],
      links: [{ label: 'Source code on GitHub', href: 'https://github.com/pavannanjunda/Hand-Guesture-Detection' }],
    },
    // The resume gives only the titles of the next three. Add `details`,
    // `problem`, `result` and `media` here when there is more to say.
    {
      slug: 'word-explorer',
      name: 'Word Explorer Interface using WordNet',
      summary: 'An interface for exploring words with WordNet',
      details: [],
      tech: ['WordNet', 'NLP'],
      links: [{ label: 'Source code on GitHub', href: 'https://github.com/pavannanjunda/Natural-Language-Processing' }],
    },
    {
      slug: 'jargon-simplifier',
      name: 'Jargon Simplification Interface',
      summary: 'An interface that simplifies jargon',
      details: [],
      tech: ['NLP'],
      links: [],
    },
    {
      slug: 'synthetic-image-eval',
      name: 'Automated Evaluation of Synthetically Generated Images',
      summary: 'Automated evaluation of generated images',
      details: [],
      tech: ['Generative AI'],
      links: [],
    },
  ],

  skills: [
    { group: 'Languages', items: ['Python'] },
    { group: 'ML & vision', items: ['TensorFlow', 'OpenCV', 'Faster R-CNN'] },
    { group: 'Hardware', items: ['Raspberry Pi', 'Arduino'] },
    { group: 'Areas', items: ['Machine Learning', 'Computer Vision', 'NLP', 'Generative AI', 'IoT', 'Data Analytics', 'Cloud Computing'] },
    { group: 'Leadership', items: ['Team Management', 'Event Management', 'Project Management'] },
  ],

  contact: [
    { label: 'pavannanjunda333@gmail.com', href: 'mailto:pavannanjunda333@gmail.com' },
    { label: 'linkedin.com/in/pavan-nanjunda', href: 'https://www.linkedin.com/in/pavan-nanjunda' },
    { label: 'github.com/pavannanjunda', href: 'https://github.com/pavannanjunda' },
  ],

  certifications: [
    { name: 'Cloud Computing', issuer: 'NPTEL', year: '2025', credential: 'NPTEL25CS11S942201852' },
    { name: 'Introduction to GenAI', issuer: 'Google Cloud', year: '2025' },
    { name: 'Machine Learning', issuer: 'Udemy', year: '2025' },
  ],

  githubUser: 'pavannanjunda',

  site: {
    repo: 'https://github.com/pavannanjunda/pavannanjunda.github.io',
    points: [
      'Written in TypeScript with no framework and no runtime dependencies; about 12 KB of JavaScript after compression.',
      'Three layers: one typed content file, a command shell that never touches the page, and the UI. The terminal and the panels render from the same content.',
      'Unit and UI tests run on every push, and a failing test blocks the deploy.',
      'Content is checked before it ships: an unsafe link or a duplicate project name fails the build.',
      'Usable by keyboard, follows the system light or dark theme, and turns motion off for visitors who ask for that.',
    ],
  },
};
