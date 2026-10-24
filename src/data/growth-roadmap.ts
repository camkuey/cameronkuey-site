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
    'A freelance build: a roadmap that lives in a Google Sheet. One master Sheet, and each new client makes a copy for their own private Sheet. Built with Google Apps Script: yearly numbers on top, milestone swimlanes below.',
};

export const stats = [
  { title: 'Copy, don’t install', text: 'One master Sheet. Each new client makes a copy and gets their own private Sheet.' },
  { title: 'Ready in three steps', text: 'Make a copy, open full screen, approve Google. No code and no setup for the client.' },
  { title: 'Only two permissions', text: 'It asks for access to the Sheet and its menu, and nothing else.' },
  { title: 'Tested end to end', text: 'Automated checks on both the script and the interface, including dark mode and undo.' },
];

export const problem = [
  'The plan lived on hand-drawn sketches and sticky notes: great for brainstorming, hard to keep current or share. The users weren’t technical, so it had to edit like a sketch and set up without me. Google Sheets was already trusted, and the data stays in a Sheet the client owns.',
];

export const design = [
  { title: 'One board', text: 'Yearly numbers (revenue, gross margin, net profit, FTE) sit above the milestone swimlanes, on shared year columns.' },
  { title: 'Milestones are pills', text: 'A pill in its lane’s color. Add a number and its dot grows. Same-quarter milestones stack, and notes show as a tooltip on hover.' },
  { title: 'Years you control', text: '2025 to 2031 by default. Insert, remove and renumber years.' },
];

export const copies = {
  title: 'Every new client is just a copy',
  body: [
    'I keep one master Google Sheet. Each new client makes a copy and gets their own private Sheet with nothing to install. Only they and the people they share it with see their numbers.',
    'The full-screen page runs as whoever opens it, so nothing is stored in my project and I can’t see client data. The first time takes about three minutes, per my setup guide, then it’s one click.',
  ],
};

export const flows = {
  sync: {
    title: 'Sheet, script and browser',
    body: [
      'Edits are instant: the editor keeps the roadmap in browser memory, and about 0.4 seconds after the last edit one batched save goes to Apps Script, which writes it to the Sheet.',
      'Each save takes a script lock (waiting up to 8 seconds) and carries its starting revision. If someone saved first, the script refuses it and the editor offers Reload or Keep mine. A failed save shows “Not saved · retrying” and retries after 1.5, 4, 10 and 20 seconds.',
    ],
  },
  rollout: {
    title: 'Setting it up',
    body: [
      'One setup, done once: the master Sheet and one deployed web app. Clients never touch code. They click Open full screen and approve Google, which asks twice and shows an “unverified app” screen the client guide walks through.',
    ],
  },
};

export const owner = [
  { title: 'Paste six files', text: 'The code, page and manifest go into the master Sheet’s Apps Script project.' },
  { title: 'Deploy the web app once', text: 'It runs as whoever opens it.' },
  { title: 'Paste its URL into the code', text: 'The only value I fill in. No Sheet or script IDs in the code.' },
  { title: 'Test with a second Google account', text: 'Then share the master and send the copy link with the client guide.' },
];

export const clientSteps = [
  { title: 'Make a copy', text: 'From the copy link.' },
  { title: 'Click Growth Roadmap › Open full screen', text: 'In the Sheet’s menu bar.' },
  { title: 'Approve Google', text: 'Once for the Sheet, once for the full-screen page.' },
];

export const friendly = {
  title: 'Built for non-technical users',
  body: [
    'The client guide assumes someone who has never opened Apps Script. In the tool, everything is click-to-edit, saving is automatic and says what it’s doing, and the empty board explains itself.',
  ],
  chips: [
    ['Click to edit', 'red'], ['Drag to move', 'blue'], ['Undo and redo', 'gold'], ['Autosave status', 'ink'],
    ['Resizable names column', 'red-t'], ['Full screen', 'blue-t'], ['Light and dark', 'gold-t'],
  ] as [string, string][],
};

export const screens = [
  { id: 'growth-overview-light', label: 'Overview, light', note: '', alt: 'The roadmap board in light mode: a yearly table of revenue, gross margin, net profit and FTE from 2025 to 2031 above five colored milestone lanes, filled with invented example data.' },
  { id: 'growth-overview-dark', label: 'Overview, dark', note: '', alt: 'The same roadmap board in dark mode, with the yearly table and five milestone lanes on a dark background.' },
  { id: 'growth-notes-tooltip', label: 'Notes on hover', note: '', alt: 'A milestone pill with its note shown in a small tooltip above it.' },
  { id: 'growth-edit-milestone', label: 'Edit a milestone', note: '', alt: 'The Edit milestone panel open over the board, with fields for name, year and quarter, lane, an optional value and notes.' },
  { id: 'growth-edit-year-header', label: 'Edit a year', note: '', alt: 'The year column panel open over the 2027 column, with a header label field, the year, insert before and after buttons and a remove year button.' },
  { id: 'growth-empty-state', label: 'Empty state', note: '', alt: 'The empty state: a small rising bar graphic, the headline Plan the next seven years, and buttons for a new roadmap or example data.' },
  { id: 'growth-label-resized', label: 'Resizable names column', note: '', alt: 'The board with the left names column dragged wider so long lane and metric names fit.' },
  { id: 'growth-menu-launcher', label: 'The menu fallback', note: 'A big button if a menu click can’t open a pop-up.', alt: 'A large blue Open full screen button with the line It opens in a new browser tab.' },
];

export const results = [
  { title: '63 checks on the script', text: 'Code.gs run against a mock Sheet: permissions, the script lock, save and conflict handling, and escaping of anything typed into an error page.' },
  { title: '143 checks on the interface', text: 'A headless-Chrome test drives the preview: editing, undo, drag, resizing, dark mode, the empty state and console errors.' },
];

export const limits = [
  'Google’s “unverified app” warning appears the first time. The guide explains it, but it’s still a bump.',
  'An unverified app with this kind of permission is capped at roughly 100 users. Beyond that, it needs Google’s verification.',
  'A Google Workspace admin can block it, and a browser signed in to several Google accounts can fail to open the file.',
  'The full-screen page updates for everyone when I publish. The menu in a client’s copy doesn’t until the code is pasted in again.',
  'I designed the tool and how it behaves. I built it fast with AI coding help.',
];
