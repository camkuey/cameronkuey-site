/** Case studies shown on /projects. Add an entry here to list a new one. */
export type CaseCard = {
  slug: string; kind: 'Systems design' | 'Operations' | 'Automation' | 'Freelance build'; org: string; title: string; summary: string;
  tags: string[]; image?: string; imageAlt?: string; motif?: 'circles' | 'contract' | 'roadmap';
};
export const CASES: CaseCard[] = [
  {
    slug: 'internal-dashboard', kind: 'Systems design', org: 'Doodle Pirates Foundation',
    title: 'An all-in-one Internal Dashboard, concept to production in under two weeks',
    summary: 'One role-based platform for the whole team, from onboarding to the shop floor. I designed it and directed AI agents to build it.',
    tags: ['Airtable', 'Product design', 'Built with Cursor cloud agents'],
    image: 'dash-hero-focus', imageAlt: 'The Internal Dashboard’s Today’s focus screen with a weekly progress meter',
  },
  {
    slug: 'documentation', kind: 'Systems design', org: 'Doodle Pirates Foundation',
    title: 'One library for every process doc, synced to the shared Drive',
    summary: 'Process docs were scattered across drives in several versions. I built one library where every page is a real Google Doc in the shared Drive.',
    tags: ['Google Docs', 'Google Drive', 'Product design', 'Beta'],
    image: 'docs-library', imageAlt: 'The Documentation library, with pages grouped by department and business line',
  },
  {
    slug: 'circles-scheduling', kind: 'Operations', org: 'Modern Health',
    title: 'Scheduling group Circles end to end with Zapier and Airtable',
    summary: 'I replaced a manual, many-tab setup with one automated flow, from Zendesk request to Zoom event, then made it hold up against bad data.',
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
    summary: 'A client planned growth on sticky notes. I built a master roadmap in Google Sheets and Apps Script that copies into a private Sheet for each of their clients.',
    tags: ['Google Sheets', 'Apps Script', 'One copy per client'], motif: 'roadmap',
  },
];
