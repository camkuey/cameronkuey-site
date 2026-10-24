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
  { value: '~5 hrs', label: 'Saved per week, by my estimate' },
];

export const modules = [
  'Project & task management',
  'Daily focus',
  'Onboarding (28-step program, intern and volunteer tracks)',
  'PTO',
  'Documentation',
  'Shift scheduling',
  'Time clocking',
  'Hours export for payroll (beta)',
  'Manufacturing shop-floor kiosk',
];

export const stack = [
  ['App', 'React + Vite front end and a Hono API, together on one Cloudflare Worker'],
  ['Sign-in', 'Cloudflare Access with work Google accounts. Each person\u2019s Employee Level decides what they can see and do'],
  ['Source of truth', 'Airtable. Every write goes through the server with a permission check'],
  ['Docs', 'Real Google Docs in a shared Drive, edited live by several people at once'],
  ['Calendar', 'One-way sync of shifts, PTO and sick days to Google Calendar'],
  ['Caching', 'Cloudflare KV, edge cache and Durable Objects, kept inside the free tier'],
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

/**
 * Real screenshots (sample data only), processed by scripts/process-dashboard-images.mjs
 * into public/media/dashboard. `id` is the key in src/data/dashboard-images.json.
 */
export type Shot = { id: string; label: string; note: string; alt: string; phone?: boolean };
export const shot = {
  focusDeck: { id: 'dash-today-focus-deck', label: 'Daily focus', note: 'One card at a time: Done, Continue tomorrow or Skip today', alt: 'Today\u2019s focus card for Friday: “Write the Task Manager walkthrough for the team”, due today, with a one-line reason and Done, Continue tomorrow and Skip today buttons. A week meter above shows 2 of 5 done.' },
  myWork: { id: 'dash-today-focus', label: 'My Work', note: 'Today\u2019s meetings, shop work to check and the focus list', alt: 'My Work page: a strip of today\u2019s meetings with Join buttons, a “Check today\u2019s shop work” card with Verify, Correct and Reject, and the start of Today\u2019s focus with a week meter.' },
  tasks: { id: 'dash-tasks-open-list', label: 'Open tasks', note: 'Grouped by project, with status, estimate and due date', alt: 'Your open tasks, grouped by project: Giving Tuesday, Ops Portal launch and Winter grant cycle, each row with status, business line, estimated hours, due date and a Done button.' },
  otisCard: { id: 'dash-ask-otis-confirm-card', label: 'Ask Otis', note: 'An editable card. Nothing is saved until Approve', alt: 'The Ask Otis panel beside the Task Manager, showing an editable “Update task” card with title, due date, status, project and milestone fields. A task name is blurred.' },
  otisSaved: { id: 'dash-ask-otis-approved', label: 'Ask Otis, approved', note: 'Saved only after the person approved it', alt: 'After approval: a green notice says Otis saved the task update, and the panel reads “Saved 1 of 1.” A task name is blurred.' },
  kiosk: { id: 'dash-kiosk-clocked-in', label: 'Shop-floor kiosk', note: 'Clocked in, with the task\u2019s step checklist', alt: 'Kiosk screen for a woodworking station: a large 9:41 AM clock, “On the clock”, and a task card “Sew 10 pieces of fabric” with a four-step checklist and I finished it, I need help and Not today buttons.' },
  pto: { id: 'dash-work-schedule-pto-saved', label: 'Work Schedule', note: 'PTO saves right away', alt: 'Work Schedule week of Oct 26: blue 9 to 5:30 shifts Monday to Wednesday, and PTO tags on Thursday and Friday with those shifts shown in red.' },
  review: { id: 'dash-time-review-week', label: 'Review your week', note: 'Confirm hours or ask for a correction', alt: 'A “Review your week” card listing four days of clock-in and clock-out times with meal and rest breaks, and Confirm this week and Request a correction buttons.' },
  projects: { id: 'dash-projects-milestones', label: 'Milestones & projects', note: 'Timeline, next milestone and what\u2019s blocked', alt: 'Operations Milestones & Projects: counts for open projects, open milestones, next milestone and blocked, above a timeline of projects and milestones with a Today line.' },
  docs: { id: 'dash-documentation-editor', label: 'Documentation', note: 'Each page is a real Google Doc', alt: 'Documentation page “How we apply for a grant”, labelled as a Google Doc with an Open in Google Docs link, a formatting toolbar and the page text.' },
  onboarding: { id: 'dash-onboarding', label: 'Onboarding', note: 'A personal checklist, with progress for managers', alt: 'Welcome aboard page: “7 / 23 done” progress, the About you section with contact info, emergency contact and shirt size marked Done, and side panels for team onboarding, your people and key dates.' },
  finishing: { id: 'dash-poster-finishing-a-task', label: 'Finishing a task', note: 'A frame from the screen recording', alt: 'My Work after a focus card is marked Done: the week meter reads 4 of 5 done and the focus header shows 3 of 4 done. The current card, “Send the Giving Tuesday plan to Drew”, has Done, Continue tomorrow and Skip today buttons.' },
  phoneFocus: { id: 'dash-phone-today-focus', label: 'Daily focus on a phone', note: '', phone: true, alt: 'Phone view of the daily focus card with the week meter, the task, its reason and the Done, Continue tomorrow and Skip today buttons.' },
  phoneOtis: { id: 'dash-phone-ask-otis-card', label: 'Ask Otis on a phone', note: '', phone: true, alt: 'Phone view of an Ask Otis “New task” card: “Order more sanding pads for the wood shop”, with assignee, due date, status and department fields.' },
} satisfies Record<string, Shot>;

/** The "Screens" gallery. */
export const screenshots: Shot[] = [shot.phoneFocus, shot.projects, shot.phoneOtis, shot.docs, shot.onboarding, shot.otisSaved];

/** "See it in motion" clips (re-encoded into public/media/dashboard/video). */
export const videos = [
  { file: 'opening-the-day', poster: 'dash-poster-opening-the-day', title: 'Opening the day', note: 'Clock in, then scroll through meetings, focus, open tasks and team pulse.', label: 'Screen recording: opening My Work, clocking in, and scrolling through today\u2019s meetings, the focus list, open tasks and team pulse. Sample data; one task name is blurred.' },
  { file: 'finishing-a-task', poster: 'dash-poster-finishing-a-task', title: 'Finishing a task', note: 'Marking a focus card Done also closes the task.', label: 'Screen recording: marking a focus card Done and the week meter moving up. Sample data; one task name is blurred.' },
  { file: 'ask-otis-approve-suggestion', poster: 'dash-poster-ask-otis-approve-suggestion', title: 'Ask Otis, then Approve', note: 'Otis drafts a card. It\u2019s saved only after Approve.', label: 'Screen recording: typing a request to Ask Otis, an editable new-task card appearing, and the task saving only after Approve is pressed. Sample data.' },
  { file: 'kiosk-clock-in', poster: 'dash-poster-kiosk-clock-in', title: 'Kiosk clock-in', note: 'Badge, PIN, clock in, then the step checklist.', label: 'Screen recording at the shop-floor kiosk: badge sign-in, PIN, clocking in at a station, checking off the task\u2019s setup steps and tapping +1 for a finished piece. Sample data.' },
];

/**
 * "How data flows" diagram: the text version of what the animated SVG shows.
 * Only flows Cameron has described. Keep in sync with DataFlowDiagram.astro.
 */
export const dataFlows: { from: string; to: string; carries: string }[] = [
  { from: 'Team member (browser, phone or shop-floor kiosk)', to: 'Cloudflare Access', carries: 'Sign-in with a work Google account, before anything else loads' },
  { from: 'Cloudflare Access', to: 'Dashboard (React + Vite)', carries: 'Signed-in requests. Each person\u2019s Employee Level decides what they can see and do' },
  { from: 'Dashboard', to: 'API (Hono, on the same Cloudflare Worker)', carries: 'Requests such as a task, a shift or a PTO day' },
  { from: 'API', to: 'Airtable (source of truth)', carries: 'Reads, and writes after a permission check on the server' },
  { from: 'API', to: 'Google Docs', carries: 'Documentation pages, which are real Google Docs. The live editor saves a few seconds after typing stops' },
  { from: 'API', to: 'Google Calendar (one way)', carries: 'Shifts, PTO and sick days, pushed after a schedule save, a \u201cResync this week\u201d press or a shop job assignment. Out-of-office days and holidays stay off the calendar, and nothing is read back' },
  { from: 'Ask Otis (Claude-powered assistant)', to: 'A person, for approval', carries: 'Editable cards: a new task, a task update, or a project or milestone update' },
  { from: 'Approve', to: 'API, then Airtable', carries: 'Only what the person approved is written, after another permission check on the server' },
  { from: 'Separately, each person\u2019s own Google Calendar', to: 'My Work', carries: 'Today\u2019s meetings, read-only and private to that person. This is not part of the schedule sync and isn\u2019t drawn above' },
];

/**
 * "A day in the dashboard" sequence, following dataflow.md's typical day.
 * Each step shows a real screenshot (sample data) from `shot`, keyed by step id
 * in `daySequence.screenshots`. A step without one falls back to an illustration.
 */
export type DayStepId = 'tasks' | 'focus' | 'work' | 'otis' | 'shop' | 'schedule' | 'week';
export const daySequence: {
  steps: { id: DayStepId; title: string; body: string }[];
  screenshots: Partial<Record<DayStepId, Shot>>;
} = {
  steps: [
    { id: 'tasks', title: 'Action items land in the task list', body: 'Meeting action items become tasks in Airtable. People add them, and so do AI assistants the team runs outside the dashboard. The dashboard itself doesn\u2019t read meeting notes.' },
    { id: 'focus', title: 'Focus is picked at 6:30 AM', body: 'Every weekday at 6:30 AM, the dashboard uses AI to pick 3 to 5 open tasks for each person, with a short reason for each. If the AI is slow or down, a rule-based picker fills in.' },
    { id: 'work', title: 'Work the list', body: 'On My Work, each person sees today\u2019s meetings and their focus cards. They mark each card Done, Continue tomorrow or Skip today. Done also closes the task.' },
    { id: 'otis', title: 'Ask Otis, then Approve', body: 'Ask Otis turns a request like \u201cadd a task: order more sanding pads\u201d into an editable card. Nothing changes until the person presses Approve.' },
    { id: 'shop', title: 'Clock in on the shop floor', body: 'At the kiosk, shop staff scan a badge, enter a PIN and clock in at a station. They work through the task\u2019s steps and tap \u201cI need help\u201d if they\u2019re stuck.' },
    { id: 'schedule', title: 'Check the schedule, add PTO', body: 'PTO saves right away and shows up as a read-only event on the person\u2019s Google Calendar.' },
    { id: 'week', title: 'Confirm the week', body: 'At the end of the week, each person confirms their hours or asks for a correction. Their manager approves the week.' },
  ],
  screenshots: {
    tasks: shot.tasks, focus: shot.focusDeck, work: shot.finishing, otis: shot.otisCard,
    shop: shot.kiosk, schedule: shot.pto, week: shot.review,
  },
};
