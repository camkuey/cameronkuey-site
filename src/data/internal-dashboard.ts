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
export const broke: { title: string; fix: string }[] = [
  { title: 'Autosave could wipe a real document', fix: 'Opening a page in the collaborative editor could save an empty page over a real Google Doc. I added guards that refuse empty or near-empty saves.' },
  { title: 'Saving one department erased the others', fix: 'Updating one department\u2019s intern access deleted every other department\u2019s permissions. I scoped deletes to only the department being edited.' },
  { title: 'Airtable quirks caused silent failures', fix: 'Linked-record filters returned nothing and attachment uploads appended instead of replacing, so actions like \u201cMark done\u201d looked successful but didn\u2019t stick. I fixed the reads and writes and added tests for both.' },
  { title: 'A duplicate constant stopped deploys', fix: 'Two features merged the same day both defined the same constant, which broke the build and paused production deploys until I fixed it.' },
];
export const differently: string[] = [
  'Build write-safety rules and contract tests against live data from day one, instead of relying on sample data that hides real-world quirks.',
  'Require a passing build before anything merges.',
  'Ship fewer modules at first and get the core task flows adopted before adding the next one.',
];

export const screenshots = [
  { label: 'Daily focus view', note: 'Each person’s tasks for the day' },
  { label: 'Ask Otis approval', note: 'Proposed change waiting for a human' },
  { label: 'Shop-floor kiosk', note: 'Manufacturing time clock & tasks' },
];

/**
 * "How data flows" diagram: the text version of what the animated SVG shows.
 * Only flows Cameron has described. Keep in sync with DataFlowDiagram.astro.
 */
export const dataFlows: { from: string; to: string; carries: string }[] = [
  { from: 'Team member (browser, phone or shop-floor kiosk)', to: 'Cloudflare Access', carries: 'Sign-in, before anything else loads' },
  { from: 'Cloudflare Access', to: 'Dashboard (React + Vite)', carries: 'Signed-in requests' },
  { from: 'Dashboard', to: 'API (Hono on Cloudflare Workers)', carries: 'Requests such as a task, a shift or a PTO request' },
  { from: 'API', to: 'Airtable (system of record)', carries: 'Reads and writes for tasks, shifts and PTO requests' },
  { from: 'API', to: 'Google Docs', carries: 'Documentation saved as docs' },
  { from: 'API', to: 'Google Calendar', carries: 'Schedules synced as calendar events' },
  { from: 'Ask Otis (Claude-powered assistant)', to: 'A person, for approval', carries: 'Suggestions: new or updated tasks, milestones, possible duplicates' },
  { from: 'Approved change', to: 'API, then Airtable', carries: 'Only what a person approved is written' },
];

/**
 * "A day in the dashboard" sequence. Each step shows an illustration until a
 * real screenshot exists. To swap one in, add its path (under /public) to
 * `daySequence.screenshots`, keyed by step id, e.g.
 *   screenshots: { today: '/images/dashboard/today.png' }
 * Use the dashboard's sample-data mode only. Empty by default.
 */
export type DayStepId = 'meeting' | 'focus' | 'today' | 'work' | 'otis';
export const daySequence: {
  steps: { id: DayStepId; title: string; body: string }[];
  screenshots: Partial<Record<DayStepId, string>>;
} = {
  steps: [
    { id: 'meeting', title: 'Meeting becomes tasks', body: 'A meeting transcript goes into the meeting-to-task pipeline and comes out as proposed tasks. A person approves them before they’re saved.' },
    { id: 'focus', title: 'Everyone gets a focus', body: 'Once tasks are approved, the dashboard’s AI assigns each person their daily focus.' },
    { id: 'today', title: 'Open Today', body: 'Each person opens their Today view on a browser, a phone or the shop-floor kiosk and sees what to focus on.' },
    { id: 'work', title: 'Clock in, work, mark done', body: 'They clock in, work through their tasks and mark them done. Each update writes back to Airtable.' },
    { id: 'otis', title: 'Otis suggests, a person decides', body: 'Ask Otis suggests a milestone or catches a duplicate. Nothing is saved until a person approves it.' },
  ],
  screenshots: {},
};
