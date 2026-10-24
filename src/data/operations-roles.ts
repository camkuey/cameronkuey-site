/** Experience data for /operations. */
export type Tone = 'red' | 'blue' | 'gold' | 'ink';
export type Role = {
  /** Date text (used under the year on desktop and as the card label on mobile when `sub` is absent). */
  when: string; now?: boolean;
  /** Longer date text shown instead of `when` when present. */
  sub?: string;
  title: string; org: string; bullets: string[];
  more?: { href: string; text: string };
  /** Start/end as decimal years, for the ruler. `to: null` = now. */
  from: number; to: number | null;
  /** Colour per employer. */
  tone: Tone;
  /** Pull-quote shown in the card; the rest of the bullets sit behind "Details". */
  quote: string;
  /** "Hats I wore" chips. */
  hats: string[];
  /** Open the Details disclosure by default on desktop. */
  openDetails?: boolean;
};

export const roles: Role[] = [
  {
    when: 'Now', now: true, sub: 'June 2026 – now', title: 'Director of Business Operations', org: 'Doodle Pirates Foundation',
    bullets: [
      'Designed and launched the Internal Dashboard as product owner, taking it from concept to a live production site in under two weeks: one role-based platform for projects and tasks, onboarding, PTO, documentation, shift scheduling, time clocking, payroll preparation and a manufacturing shop-floor kiosk.',
      'Built Ask Otis, an embedded Claude-powered assistant with human-in-the-loop approval before any change is saved.',
      'Designed the organization-wide agentic operating model and deployed about 20 AI agents mapped to org-chart roles across all six departments.',
      'Architected four connected Airtable bases, including a 30-table operations backbone and a 32-table manufacturing ERP.',
      'Built an AI meeting-to-task pipeline that turns transcripts into approved tasks, saving about 5 hours a week.',
      'Set up Foundation operations and migrated the team from Microsoft 365 to Google Workspace and Slack.',
    ],
    more: { href: '/case-studies/internal-dashboard', text: 'Read the Internal Dashboard case study' },
    from: 2026.4, to: null, tone: 'red', quote: 'taking it from concept to a live production site in under two weeks',
    hats: ['Product owner', 'Systems architect', 'Automation builder', 'Revenue operations', 'Project manager', 'Strategy operations', 'Team trainer'],
  },
  {
    when: 'May 2024 – April 2026', title: 'Content Operations Manager', org: 'Modern Health',
    bullets: [
      'Built and maintained 150+ automations across Zapier, Airtable, Salesforce, Quickbase, Zoom and Google Apps Script.',
      'Partnered with Revenue, Business and Product Operations, Marketing, Clinical, Finance, Legal and Content Studio to turn ambiguous requirements into end-to-end system designs.',
      'Designed data pipelines and API integrations that unified revenue, operations and finance data.',
      'Automated provider contracting, order forms and invoicing across a multi-sided marketplace.',
    ],
    more: { href: '/case-studies/contract-automation', text: 'Read the contract automation case study' },
    from: 2024.4, to: 2026.3, tone: 'blue', quote: 'Built and maintained 150+ automations across Zapier, Airtable, Salesforce, Quickbase, Zoom and Google Apps Script.',
    hats: ['Automation builder', 'Systems designer', 'Integration engineer'],
  },
  {
    when: 'May 2022 – May 2024', title: 'Creative Producer', org: 'Modern Health',
    bullets: [
      'Owned scheduling, logistics and live production for provider-led group Circles at scale.',
      'Led continuous operational experimentation; iterations supported rapid year-over-year growth in a core product line.',
    ],
    more: { href: '/case-studies/circles-scheduling', text: 'Read the Circles scheduling case study' },
    from: 2022.4, to: 2024.4, tone: 'blue', quote: 'Owned scheduling, logistics and live production for provider-led group Circles at scale.',
    hats: ['Producer', 'Scheduler', 'Process improver'],
  },
  {
    when: '2015 – 2022', sub: 'March 2015 – April 2022', title: 'Founder & Executive Director', org: 'The Cultivation Project',
    bullets: [
      'Founded and scaled a nonprofit media organization from zero to sustainability, managing day-to-day operations, go-to-market strategy, financial systems, the creative team and the board of directors.',
      'Designed and managed the operating systems behind it: CRM, fundraising pipelines, marketing campaigns and finance, with automated reporting that tracked donor conversion, engagement and revenue across channels.',
      'Ran fundraising campaigns, events and partnerships, and grew donations 107% over three years through data-informed marketing, targeted outreach and donor meetings.',
      'Recruited and directed a 10+ person media team that produced 100+ documentaries, promotional videos and podcast episodes, including location shoots in East Asia and conference content for audiences of 5,000+.',
    ],
    more: { href: '/documentaries', text: 'See The Cultivation Project’s films' },
    from: 2015.2, to: 2022.3, tone: 'gold',
    quote: 'I ran the whole organization, from operations and strategy to finance, fundraising, marketing, the creative team and the board, and set up the process behind each one.',
    hats: ['Executive director', 'Fundraiser', 'Marketer', 'Finance lead', 'Producer & director', 'Recruiter & team lead', 'Board chairman'],
    openDetails: true,
  },
  {
    when: 'July 2012 – April 2022', title: 'Founder, Photographer & Videographer', org: 'Cosie Co. Productions',
    bullets: [
      'Founded a full-service media production company and grew it from solo freelance to a 10-year operation serving 200+ clients in wedding, family and corporate photography and videography, run alongside full-time roles throughout.',
      'Worked as the photographer, videographer, producer, director and editor on every project, and built a process for each of those roles.',
      'Built end-to-end client operations from scratch: lead intake, contracts, scheduling, project management, deliverables and invoicing, with no admin support.',
      'Designed production pipelines spanning shoot logistics, post-production and asset delivery, so quality and turnaround held up across dozens of concurrent projects.',
    ],
    more: { href: '/photography', text: 'See the photography' },
    from: 2012.5, to: 2022.3, tone: 'ink',
    quote: 'I shot, directed, produced and edited every project myself, with a repeatable process behind each of those roles.',
    hats: ['Photographer', 'Videographer', 'Producer', 'Director', 'Editor', 'Account manager', 'Bookkeeper'],
    openDetails: true,
  },
];

export const cases = [
  { href: '/case-studies/circles-scheduling', title: 'Turning a manual, multi-tab Circles setup into a one-step workflow', text: 'Zendesk to a finished Zoom event in one Zapier workflow, with Airtable as the source of truth and the producer still in the loop.', tools: 'Zapier · Airtable · Zoom · Zendesk' },
  { href: '/case-studies/contract-automation', title: 'One button from an Airtable record to a signed Ironclad contract', text: 'I simplified the process with legal first, then automated it, keeping Ironclad as the system of record.', tools: 'Airtable · Apps Script · Ironclad' },
];

/** Chart range (years) for the ruler. */
export const SPAN = { start: 2012, end: 2027 };
/** Pull-quote text: capitalised, ends with a full stop. */
export const quoteText = (r: Role) => {
  const q = r.quote.charAt(0).toUpperCase() + r.quote.slice(1);
  return /[.!?]$/.test(q) ? q : q + '.';
};
/** The year printed in the "when" string ("Now" for the current role). */
export const startYear = (r: Role) => (r.now ? 'Now' : (r.when.match(/\d{4}/)?.[0] ?? ''));
/** Bullets not already shown whole as the pull-quote. */
export const rest = (r: Role) => r.bullets.filter((b) => b.replace(/\.$/, '') !== r.quote.replace(/\.$/, ''));
