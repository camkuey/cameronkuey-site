/** Case studies shown on /case-studies. Add an entry here to list a new one. */
export type CaseCard = {
  slug: string; kind: 'Systems design' | 'Operations' | 'Automation'; org: string; title: string; summary: string;
  tags: string[]; image?: string; imageAlt?: string; motif?: 'circles' | 'contract';
};
export const CASES: CaseCard[] = [
  {
    slug: 'internal-dashboard', kind: 'Systems design', org: 'Doodle Pirates Foundation',
    title: 'An all-in-one Internal Dashboard, concept to production in under two weeks',
    summary: 'I designed one role-based platform for projects, onboarding, time clocking and the shop floor, on top of an Airtable ERP, and directed AI agents to build it fast.',
    tags: ['Airtable', 'Product design', 'AI-assisted build'],
    image: 'dash-hero-focus', imageAlt: 'The Internal Dashboard’s Today’s focus screen with a weekly progress meter',
  },
  {
    slug: 'circles-scheduling', kind: 'Operations', org: 'Modern Health',
    title: 'Scheduling group Circles end to end with Zapier and Airtable',
    summary: 'I turned a manual, many-tab setup into one automated workflow, from a Zendesk request to a Zoom event, then hardened it so bad data was caught before it caused a problem.',
    tags: ['Zapier', 'Airtable', 'Zendesk', 'Zoom', 'Google Slides'], motif: 'circles',
  },
  {
    slug: 'contract-automation', kind: 'Automation', org: 'Modern Health',
    title: 'A contract button that goes from Airtable to Ironclad',
    summary: 'I simplified the contracting process with legal first, then built a one-click flow that creates the contract, routes it for signature and writes the status back.',
    tags: ['Airtable', 'Ironclad', 'Apps Script', 'API'], motif: 'contract',
  },
];
