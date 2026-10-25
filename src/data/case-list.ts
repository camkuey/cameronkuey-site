/** Case studies shown on /projects. Add an entry here to list a new one. */
export type CaseCard = {
  slug: string; kind: 'Systems design' | 'Operations' | 'Automation' | 'Freelance build'; org: string; title: string; summary: string;
  tags: string[]; image?: string; imageAlt?: string; motif?: 'circles' | 'contract' | 'roadmap';
};
export const CASES: CaseCard[] = [
  {
    slug: 'internal-dashboard', kind: 'Systems design', org: 'Doodle Pirates Foundation',
    title: 'An all-in-one Internal Dashboard, concept to production in under two weeks',
    summary: 'I designed one role-based platform for projects, onboarding, time clocking and the shop floor, and directed AI agents to build it fast.',
    tags: ['Airtable', 'Product design', 'Built with Cursor cloud agents'],
    image: 'dash-hero-focus', imageAlt: 'The Internal Dashboard’s Today’s focus screen with a weekly progress meter',
  },
  {
    slug: 'documentation', kind: 'Systems design', org: 'Doodle Pirates Foundation',
    title: 'One library for every process doc, synced to the shared Drive',
    summary: 'Process docs were scattered across drives, with several versions of each. I built one library in the Internal Dashboard where every page is a real Google Doc in the shared Drive.',
    tags: ['Google Docs', 'Google Drive', 'Product design', 'Beta'],
    image: 'docs-library', imageAlt: 'The Documentation library, with pages grouped by department and business line',
  },
  {
    slug: 'circles-scheduling', kind: 'Operations', org: 'Modern Health',
    title: 'Scheduling group Circles end to end with Zapier and Airtable',
    summary: 'I turned a manual, many-tab setup into one automated workflow, from a Zendesk request to a Zoom event, then hardened it against bad data.',
    tags: ['Zapier', 'Airtable', 'Zendesk', 'Zoom', 'Google Slides'], motif: 'circles',
  },
  {
    slug: 'contract-automation', kind: 'Automation', org: 'Modern Health',
    title: 'A contract button that goes from Airtable to Ironclad',
    summary: 'I simplified contracting with legal first, then built a one-click flow that creates the contract, routes it for signature and writes the status back.',
    tags: ['Airtable', 'Ironclad', 'Apps Script', 'API'], motif: 'contract',
  },
  {
    slug: 'growth-roadmap', kind: 'Freelance build', org: 'Anonymous client',
    title: 'A Strategy Growth Roadmap in a Google Sheet',
    summary: 'A client planned on sticky notes. I built a roadmap on Google Sheets and Apps Script: one master Sheet, copied for each client into their own private Sheet.',
    tags: ['Google Sheets', 'Apps Script', 'One copy per client'], motif: 'roadmap',
  },
];
