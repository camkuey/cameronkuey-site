/**
 * Case study: Strategy Growth Roadmap, a freelance build for an anonymous client.
 * Every statement here comes from the project's own setup docs, the Apps Script
 * code, or the automated checks I ran (63 checks on the script against a mock Sheet,
 * 143 checks on the interface in headless Chrome). No client name, no Sheet, script or
 * deployment IDs, no URLs, no emails, no outcome claims and no build-time claim:
 * none of those are documented. The screenshots are renders of the standalone
 * preview with invented example data, not of a live Google deployment.
 */
export const meta = {
  title: 'Case study: Strategy Growth Roadmap',
  description:
    'A freelance build: a Strategy Growth Roadmap that lives in a Google Sheet. One master Sheet, and each new client just makes a copy for their own private Sheet. Built with Google Apps Script: yearly numbers on top, milestone swimlanes below.',
};

export const stats = [
  { value: '1', label: 'Master Sheet, copied for each client' },
  { value: '3', label: 'Steps for a client to get started' },
  { value: '2', label: 'Google permissions requested' },
  { value: '63', label: 'Automated checks on the script' },
];

export const note =
  'This was a freelance project for a client I’m keeping anonymous. The screens are a preview render of the same interface, filled with invented example data. I’ve left out the client’s name, links and IDs.';

export const problem = [
  'The plan lived on hand-drawn sketches and sticky notes. They’re great for brainstorming, but a plan like that is hard to keep current and hard to share.',
  'The people using it weren’t technical, so the tool had to feel as easy to edit as a sketch, and be simple enough to set up without me.',
  'It also had to live somewhere they already trusted. I chose Google Sheets, so the data stays in a Sheet the client owns.',
];

export const design = [
  { title: 'One board', text: 'A band of yearly numbers (revenue, gross margin, net profit and FTE by default) sits above the milestone swimlanes, on the same year columns.' },
  { title: 'Milestones are pills', text: 'Each one is a pill in its lane’s color. Give it a number and its dot grows. Milestones in the same quarter stack, and the lane grows taller so labels never overlap.' },
  { title: 'Notes on hover', text: 'Details live in a note that shows as a tooltip on hover or focus, so the board stays clean.' },
  { title: 'Years you control', text: 'The range defaults to 2025 to 2031 and is configurable. Years can be inserted, removed and renumbered.' },
];

export const copies = {
  title: 'Every new client is just a copy',
  body: [
    'I keep one master Google Sheet. Each new client makes a copy of it, so they get their own private Sheet with their own data, and nothing to install.',
    'Only they and the people they share it with see their numbers. The full-screen page runs as whoever opens it, so nothing is stored in my project and I can’t see client data.',
    'The first time takes about three minutes, per my setup guide. After that it’s one click.',
  ],
};

export const flows = {
  sync: {
    title: 'Sheet, script and browser',
    body: [
      'The editor runs in the browser and holds the whole roadmap in memory, so every edit is instant. About 0.4 seconds after the last edit, one batched save goes to Apps Script, which writes it to the Sheet.',
      'A save takes a script lock, held only while writing and waiting up to 8 seconds. Each save carries the revision it started from. If someone else saved first, the script refuses it, and the editor offers Reload or Keep mine instead of overwriting anyone.',
      'If a save fails, the status reads “Not saved · retrying”. It tries again after 1.5, 4, 10 and then 20 seconds, and there’s a Retry button.',
    ],
  },
  rollout: {
    title: 'Setting it up',
    body: [
      'Behind the copy link is one setup, done once: the master Sheet and one deployed web app. A client never touches code.',
      'They click Open full screen from the new menu and approve Google. Google asks twice and shows an “unverified app” screen, so the client guide walks through it click by click.',
    ],
  },
};

export const owner = [
  { title: 'Paste six files', text: 'The master Sheet’s Apps Script project gets the code, the page and its manifest.' },
  { title: 'Deploy the web app once', text: 'It runs as the person opening it, so nothing is stored in my project and I can’t see client data.' },
  { title: 'Paste its URL into the code', text: 'Before any client copies the master. That’s the only value I fill in; there are no Sheet or script IDs in the code.' },
  { title: 'Test with a second Google account', text: 'Then share the master and send the copy link with the client guide.' },
];

export const clientSteps = [
  { title: 'Make a copy', text: 'From the copy link.' },
  { title: 'Click Growth Roadmap › Open full screen', text: 'It’s in the Sheet’s menu bar.' },
  { title: 'Approve Google', text: 'Once for the Sheet and once for the full-screen page.' },
];

export const friendly = {
  title: 'Built for non-technical users',
  body: [
    'It was built for people who aren’t technical, so the client guide is written for someone who has never opened Apps Script. In the tool, everything is click-to-edit, saving is automatic and says what it’s doing, and the board explains itself when it’s empty.',
    'Screens are a preview render with invented example data. Tap one to enlarge it.',
  ],
  chips: [
    ['Click to edit', 'red'], ['Drag to move', 'blue'], ['Undo and redo', 'gold'], ['Autosave status', 'ink'],
    ['Resizable names column', 'red-t'], ['Full screen', 'blue-t'], ['Light and dark', 'gold-t'],
  ] as [string, string][],
};

export const screens = [
  { id: 'growth-overview-light', label: 'Overview, light', note: 'Numbers on top, swimlanes below.', alt: 'The roadmap board in light mode: a yearly table of revenue, gross margin, net profit and FTE from 2025 to 2031 above five colored milestone lanes, filled with invented example data.' },
  { id: 'growth-overview-dark', label: 'Overview, dark', note: 'The same board in dark mode.', alt: 'The same roadmap board in dark mode, with the yearly table and five milestone lanes on a dark background.' },
  { id: 'growth-notes-tooltip', label: 'Notes on hover', note: 'A milestone’s note appears as a tooltip.', alt: 'A milestone pill with its note shown in a small tooltip above it.' },
  { id: 'growth-edit-milestone', label: 'Edit a milestone', note: 'Name, quarter, lane, value and notes.', alt: 'The Edit milestone panel open over the board, with fields for name, year and quarter, lane, an optional value and notes.' },
  { id: 'growth-edit-year-header', label: 'Edit a year', note: 'Header label, year, and insert or remove a column.', alt: 'The year column panel open over the 2027 column, with a header label field, the year, insert before and after buttons and a remove year button.' },
  { id: 'growth-empty-state', label: 'Empty state', note: 'A new roadmap explains itself.', alt: 'The empty state: a small rising bar graphic, the headline Plan the next seven years, and buttons for a new roadmap or example data.' },
  { id: 'growth-label-resized', label: 'Resizable names column', note: 'Drag the edge, or double-click it to fit.', alt: 'The board with the left names column dragged wider so long lane and metric names fit.' },
  { id: 'growth-menu-launcher', label: 'The menu fallback', note: 'If a menu click can’t open a pop-up, a big button does.', alt: 'A large blue Open full screen button with the line It opens in a new browser tab.' },
];

export const results = [
  { title: '63 checks on the script', text: 'A test runs Code.gs against a mock Sheet: permissions, the script lock, tabs created on first use, save and conflict handling, and escaping of anything typed into an error page.' },
  { title: '143 checks on the interface', text: 'A headless-Chrome test drives the preview: editing, undo, drag, resizing, dark mode and the empty state, plus a check for console errors.' },
  { title: 'Nothing hard-coded', text: 'The checks confirm the code contains no Sheet IDs, and that it asks only for the Sheets and menu permissions.' },
];

export const limits = [
  'Google shows an “unverified app” warning the first time. The guide explains it, but it’s a real bump for a non-technical person.',
  'An unverified app with this kind of permission is capped at roughly 100 users. Beyond that, the app needs Google’s verification.',
  'A Google Workspace admin can block it, and a browser signed in to several Google accounts can fail to open the file.',
  'The full-screen page updates for everyone when I publish a new version. The menu inside a client’s copy doesn’t, until the code is pasted into it again.',
  'The screens are a preview render with example data, not a live deployment, and there are no speed measurements to quote.',
  'I designed the tool and how it behaves. I built it fast with AI coding help.',
];
