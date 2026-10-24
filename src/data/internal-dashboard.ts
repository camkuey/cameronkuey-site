/**
 * Internal Dashboard case study content.
 * Every statement here must be something Cameron has stated or approved.
 * Do not add metrics that are not confirmed. Screenshots: use the dashboard's
 * sample-data mode only (the repo and real data are private to DPF).
 */
export const stats = [
  { value: '<2 wks', label: 'Concept to production' },
  { value: '152', label: 'Reviewed pull requests' },
  { value: '1,218', label: 'Automated tests' },
  { value: '~5 hrs', label: 'Saved per week by the meeting-to-task pipeline' },
];

export const modules = [
  'Project & task management',
  'Onboarding (28-step program, intern and volunteer tracks)',
  'PTO',
  'Documentation',
  'Shift scheduling',
  'Time clocking',
  'Payroll preparation',
  'Manufacturing shop-floor kiosk',
];

export const stack = [
  ['Front end', 'React + Vite'],
  ['API', 'Hono on Cloudflare Workers'],
  ['Access', 'Cloudflare Access single sign-on'],
  ['System of record', 'Airtable'],
  ['Docs & calendar', 'Google Docs, Google Calendar sync'],
  ['Built with', 'Claude Code, Claude Design, Cursor cloud agents directed through Grok Bot'],
];

/**
 * "What broke & how I fixed it" (4 items) and "What I'd do differently" (3 items).
 * Paste Cameron's approved wording here. Each section stays hidden until it has items,
 * so the live page never shows invented content.
 */
export const broke: { title: string; fix: string }[] = [];
export const differently: string[] = [];

export const screenshots = [
  { label: 'Daily focus view', note: 'Each person’s tasks for the day' },
  { label: 'Ask Otis approval', note: 'Proposed change waiting for a human' },
  { label: 'Shop-floor kiosk', note: 'Manufacturing time clock & tasks' },
];
