/** Content for /projects. Case studies come from case-list.ts; the rest is the "More builds" list and the tools strip. */
export const featured = {
  org: 'Doodle Pirates Foundation',
  desc: 'One place for projects, onboarding, time clocking, PTO and the shop floor. I designed it and directed AI agents to build it on Airtable, including Ask Otis, a Claude-powered assistant that needs a person’s approval before it saves anything.',
  nums: [
    { value: '<2 wks', label: 'Concept to production' },
    { value: '152', label: 'Reviewed pull requests' },
    { value: '1,218', label: 'Automated tests' },
    { value: '~20', label: 'AI agents' },
  ],
};

export const more: { title: string; body: string; tag: string }[] = [
  { title: 'Meeting-to-task pipeline', body: 'Meeting transcripts become approved tasks, and the dashboard turns them into each person’s daily focus. Saves about 5 hours a week.', tag: 'Claude Code · Grok Bot' },
  { title: '~20 AI agents, mapped to the org chart', body: 'I decided which work belongs to AI, to people or to both, then deployed about 20 agents across all six departments.', tag: 'Operating model' },
  { title: 'Four connected Airtable bases', body: 'The data layer behind everything above, including a 30-table operations backbone and a 32-table manufacturing ERP.', tag: 'Airtable · schema design' },
];

/** "How I work": six steps, shown with a looping highlight on /projects. */
export const steps = [
  { sub: 'Define', title: 'Find the real problem', text: 'I talk to the people doing the work and decide what’s worth building.' },
  { sub: 'Design', title: 'Map the workflow', text: 'The steps, the data and who approves what, before anything gets built.' },
  { sub: 'Direct', title: 'I direct AI agents to build it', text: 'I set the plan and run the agents, so it ships in days instead of months.' },
  { sub: 'Review', title: 'Check every change', text: 'Nothing goes live until I’ve reviewed it and the team has tried it.' },
  { sub: 'Document', title: 'Write it all down', text: 'Process docs, the data schema and how-tos, so anyone can run it without me.' },
  { sub: 'Train', title: 'Train the team and roll it out', text: 'I teach the people who use it and stay close until it sticks.' },
];

/** Only tools stated on the site or by Cameron. */
export const tools = ['Cursor cloud agents', 'Claude Code', 'Claude', 'Grok Bot', 'Airtable', 'Google Sheets', 'Zapier', 'Apps Script', 'Cloudflare Workers'];
