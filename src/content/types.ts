export interface Link { label: string; href: string }
export interface Job { company: string; role: string; start: string; end: string; highlights: string[] }
export interface School { institution: string; degree: string; start: string; end: string; notes?: string[] }
export interface Project { slug: string; name: string; summary: string; details: string[]; tech: string[]; links: Link[] }
export interface SkillGroup { group: string; items: string[] }
export interface Content {
  name: string; handle: string; tagline: string;
  about: string[]; experience: Job[]; education: School[];
  projects: Project[]; skills: SkillGroup[]; contact: Link[];
  resumeHref?: string;
}
