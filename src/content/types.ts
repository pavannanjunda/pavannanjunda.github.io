export interface Link { label: string; href: string }
export interface Job { company: string; role: string; start: string; end: string; highlights: string[] }
export interface School { institution: string; degree: string; start: string; end: string; notes?: string[] }
export interface Media { src: string; alt: string }
// `problem`, `result` and `media` turn a project into a case study; all optional.
export interface Project {
  slug: string; name: string; summary: string; details: string[]; tech: string[]; links: Link[];
  problem?: string; result?: string; media?: Media[];
}
export interface Certification { name: string; issuer: string; year: string; credential?: string; href?: string }
export interface SkillGroup { group: string; items: string[] }
export interface Content {
  name: string; handle: string; tagline: string;
  about: string[]; experience: Job[]; education: School[];
  projects: Project[]; skills: SkillGroup[]; contact: Link[];
  resumeHref?: string;
  certifications?: Certification[];
  githubUser?: string;   // public repositories are listed on the overview
  site?: { repo?: string; points: string[] };   // how this site is built, shown under About
}
