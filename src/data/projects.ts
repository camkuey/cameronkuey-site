/** Content for /projects. Case studies come from case-list.ts; the rest is the "More builds" list and the tools strip. */
export const spec: [string, string][] = [
  ['Builds', 'Internal tools, automations, Airtable bases'],
  ['At', 'Doodle Pirates Foundation, Modern Health'],
  ['Freelance', 'One client build, kept anonymous'],
  ['Case studies', '5'],
];

export const featured = {
  org: 'Doodle Pirates Foundation',
  desc: 'Designed by me and built fast with Cursor cloud agents on an Airtable ERP, including Ask Otis, a Claude-powered assistant with human-in-the-loop approval.',
  nums: [
    { value: '<2 wks', label: 'Concept to production' },
    { value: '152', label: 'Reviewed pull requests' },
    { value: '1,218', label: 'Automated tests' },
    { value: '~20', label: 'AI agents' },
  ],
};

export const more: { title: string; body: string; tag: string }[] = [
  { title: 'Ask Otis', body: 'A Claude-powered assistant in the Internal Dashboard. It creates and updates tasks, suggests milestones and catches duplicates. Nothing saves until a person approves.', tag: 'Claude · human-in-the-loop' },
  { title: 'Meeting-to-task pipeline', body: 'Turns meeting transcripts into approved tasks, which the dashboard’s AI then assigns as each person’s daily focus. Saves about 5 hours a week.', tag: 'Claude Code · Grok Bot' },
  { title: '~20 AI agents, mapped to the org chart', body: 'An agentic operating model that defines which work belongs to AI, people or both, with about 20 AI agents mapped to org-chart roles across all six departments.', tag: 'Operating model' },
  { title: 'Four connected Airtable bases', body: 'The data layer behind the Foundation, including a 30-table operations backbone and a 32-table manufacturing ERP.', tag: 'Airtable · schema design' },
];

/** The four parts of the old "How I build" strip, in its own words. */
export const steps = [
  { sub: 'Decide', title: 'The problem', text: 'I decide what gets built and how it works.' },
  { sub: 'Design', title: 'Workflow, data, approvals', text: 'The workflow, the data and the approvals.' },
  { sub: 'Direct', title: 'AI agents build it', text: 'Far faster than I could alone.' },
  { sub: 'Review', title: 'Every change', text: 'I review every change.' },
];

/** Only tools stated on the site or by Cameron. */
export const tools = ['Cursor cloud agents', 'Claude Code', 'Claude', 'Grok Bot', 'Airtable', 'Google Sheets', 'Zapier', 'Apps Script', 'Cloudflare Workers'];
