/**
 * Flow graphics for the case studies (Modern Health, and the freelance Strategy Growth Roadmap build).
 * Every flow renders as one timeline card (CaseFlow.astro): numbered nodes on a hairline track, a
 * travelling dot, and an optional branch row. Nodes hold the content; routes give the order and the
 * dot colour (tone + swaps); `layout` says which nodes sit on the main track, which hang off it as a
 * branch, which links show as small "back to" chips, and which nodes are footer notes.
 * c/r/span are the old 3x4 grid positions, kept for reference only. No figures, client names or real IDs here.
 */
export type Tone = 'ink' | 'blue' | 'gold' | 'red';
/** Platform colours: solid for the main tools, -t for tinted ones. */
export type Col = 'red' | 'blue' | 'gold' | 'ink' | 'red-t' | 'blue-t' | 'gold-t' | 'sand' | 'white';
export type NodeTone = 'human' | 'person' | 'note' | 'next';
/** step: badge text. Defaults to the order the first route visits the nodes; false hides it. */
export type FNode = { id: string; c: number; r: number; span?: number; t: string; s?: string; col?: Col; tone?: NodeTone; step?: string | number | false };
export type FLink = { a: string; b: string; mode?: 'h' | 'v' | 'hv' | 'vh'; style?: 'red' | 'dash'; mark?: 'x' };
/** delay: seconds into the loop when this dot starts. sync: start when another route's dot reaches a stop. */
export type FBlob = { delay?: number; sync?: { route: number; hop: number }; tone: Tone; still?: number; swaps?: { at: number; tone: Tone }[] };
export type FRoute = { via: string[]; T: number; idle?: number; hold?: { before: string; sec: number }; blobs: FBlob[] };
/** How a legend tone is drawn: the page's one accent, near-black, or warm grey. */
export type Dot = 'accent' | 'ink' | 'grey';
export type FLayout = {
  /** main track, in order. Defaults to the first route. A node before step 1 with no number reads as the trigger. */
  main?: string[];
  /** a second row hanging off the main track: `from` is the main node it leaves, `lead` a word shown instead */
  branch?: { from?: string; lead?: string; via: string[]; route: number };
  /** links drawn as a small chip under a node: back to an earlier step (dash), on to a later one, or blocked (x) */
  chips?: { at: string; to: string; style?: 'dash' | 'x'; tone: Tone }[];
  /** nodes that share one number, shown as pills in one cell */
  group?: { at: string; ids: string[] };
  /** note / not-built-yet nodes, shown under the track */
  foot?: string[];
  dots: Partial<Record<Tone, Dot>>;
};
export type FDef = {
  /** section colour: panel stripe, step badges, pulse */
  accent: Tone;
  /** card header: mono eyebrow and light title, both taken from the page's own copy */
  eyebrow: string;
  title: string;
  layout: FLayout;
  label: string;
  nodes: FNode[];
  links: FLink[];
  routes: FRoute[];
  legend: [Tone, string][];
};

export const FLOWS: Record<string, FDef> = {
  /* ── Circles: scheduling, end to end ── */
  'circles-schedule': {
    accent: 'gold',
    eyebrow: 'Flow 01 / End to end',
    title: 'A Zendesk request becomes an Airtable record.',
    layout: {
      chips: [{ at: 'zoom', to: 'at', style: 'dash', tone: 'blue' }],
      foot: ['sec'],
      dots: { ink: 'ink', blue: 'grey', gold: 'accent' },
    },
    label:
      'Animated diagram of Circles scheduling. A new Circle request in Zendesk becomes an Airtable record, the source of truth. A Zapier workflow reads it and calls the Zoom API to create a templated event, and the Zoom links come back into Airtable. Google Calendar events and facilitator slide decks are generated and shared. A ready-to-send email with the links goes to the producer, who sends it personally, then Slack notifies the team. A note reads: runs in seconds, what took hours of manual setup.',
    nodes: [
      { id: 'zd', c: 0, r: 0, t: 'Zendesk', s: 'Circle request', col: 'red' },
      { id: 'at', c: 1, r: 0, t: 'Airtable', s: 'source of truth', col: 'ink' },
      { id: 'zap', c: 2, r: 0, t: 'Zapier', s: 'long workflow', col: 'blue' },
      { id: 'zoom', c: 2, r: 1, t: 'Zoom API', s: 'templated event', col: 'blue-t' },
      { id: 'cal', c: 0, r: 1, t: 'Calendar', s: 'Google events', col: 'gold' },
      { id: 'deck', c: 0, r: 2, t: 'Slide decks', s: 'for facilitators', col: 'gold-t' },
      { id: 'mail', c: 1, r: 2, t: 'Email draft', s: 'ready to send', col: 'white' },
      { id: 'prod', c: 2, r: 2, t: 'Producer', s: 'sends it', tone: 'human' },
      { id: 'slack', c: 2, r: 3, t: 'Slack', s: 'team notified', col: 'sand' },
      { id: 'sec', c: 0, r: 3, span: 2, t: 'Runs in seconds', s: 'what took hours of manual setup', col: 'gold', tone: 'note' },
    ],
    links: [
      { a: 'zd', b: 'at' }, { a: 'at', b: 'zap' }, { a: 'zap', b: 'zoom' },
      { a: 'zoom', b: 'at', mode: 'hv', style: 'dash' }, { a: 'zoom', b: 'cal' },
      { a: 'cal', b: 'deck' }, { a: 'deck', b: 'mail' }, { a: 'mail', b: 'prod', style: 'red' }, { a: 'prod', b: 'slack' },
    ],
    routes: [
      {
        via: ['zd', 'at', 'zap', 'zoom', 'cal', 'deck', 'mail', 'prod', 'slack'], T: 14, idle: 1.2,
        hold: { before: 'prod', sec: 1.8 },
        blobs: [{ tone: 'ink', still: 7.2, swaps: [{ at: 3, tone: 'blue' }, { at: 7, tone: 'gold' }] }],
      },
      { via: ['zoom', 'at:hv'], T: 14, idle: 9.5, blobs: [{ sync: { route: 0, hop: 3 }, tone: 'blue', still: 2.2 }] },
    ],
    legend: [['ink', 'request data'], ['blue', 'Zoom links'], ['gold', 'sent by a person']],
  },

  /* ── Circles: hardening ── */
  'circles-harden': {
    accent: 'red',
    eyebrow: 'Flow 02 / What broke',
    title: 'Clean rows only.',
    layout: {
      branch: { from: 'chk', via: ['flag', 'team'], route: 1 },
      chips: [{ at: 'flag', to: 'main', style: 'x', tone: 'red' }],
      dots: { red: 'accent', ink: 'ink', blue: 'grey' },
    },
    label:
      'Animated diagram of how the Circles workflow was hardened. A form entry reaches a separate checking automation before anything else. A stray trailing space is trimmed and the clean record goes on to Airtable, the main Zapier workflow and the Zoom API. A record with several emails in one field is flagged on the whole row flagged, so the team sees it, and is blocked from the main workflow. When Zoom began censoring URLs in API responses, a find-and-replace step puts the company IDs back before the links are saved in Airtable.',
    nodes: [
      { id: 'form', c: 0, r: 0, t: 'Form entry', s: 'a person types', tone: 'person' },
      { id: 'chk', c: 1, r: 0, t: 'Checker', s: 'every new record', col: 'blue-t' },
      { id: 'at', c: 2, r: 0, t: 'Airtable', s: 'clean record', col: 'ink' },
      { id: 'team', c: 0, r: 1, t: 'Team', s: 'sees it first', tone: 'person', step: false },
      { id: 'flag', c: 1, r: 1, t: 'Flagged row', s: 'in Airtable', tone: 'human', step: '!' },
      { id: 'main', c: 2, r: 1, t: 'Main workflow', s: 'clean rows only', col: 'blue' },
      { id: 'zoom', c: 2, r: 2, t: 'Zoom API', s: 'URLs censored', col: 'blue-t' },
      { id: 'rep', c: 1, r: 2, t: 'Find & replace', s: 'our IDs put back', col: 'blue-t' },
      { id: 'at2', c: 0, r: 2, t: 'Airtable', s: 'links saved', col: 'ink' },
    ],
    links: [
      { a: 'form', b: 'chk' }, { a: 'chk', b: 'at' }, { a: 'at', b: 'main' }, { a: 'main', b: 'zoom' },
      { a: 'chk', b: 'flag', style: 'red' }, { a: 'flag', b: 'team' },
      { a: 'flag', b: 'main', style: 'red', mark: 'x' },
      { a: 'zoom', b: 'rep' }, { a: 'rep', b: 'at2' },
    ],
    routes: [
      {
        via: ['form', 'chk', 'at', 'main', 'zoom', 'rep', 'at2'], T: 14, idle: 1.2,
        blobs: [{ tone: 'red', still: 3.4, swaps: [{ at: 1, tone: 'ink' }, { at: 4, tone: 'red' }, { at: 5, tone: 'blue' }] }],
      },
      { via: ['form', 'chk', 'flag', 'team'], T: 14, idle: 5, blobs: [{ delay: 7, tone: 'red', still: 3.2 }] },
    ],
    legend: [['red', 'needs fixing'], ['ink', 'clean data'], ['blue', 'fixed link']],
  },

  /* ── Circles: slide-deck catalogue ── */
  'circles-deck': {
    accent: 'blue',
    eyebrow: 'Flow 03 / The workshop catalogue deck',
    title: 'One always-current link.',
    layout: {
      main: ['day', 'at', 'auto', 'gas', 'deck', 'sales'],
      foot: ['next'],
      dots: { ink: 'ink', blue: 'grey', gold: 'accent' },
    },
    label:
      'Animated diagram of the Circles slide-deck catalogue. Airtable holds the details of each workshop. An Airtable automation and Zapier connectors, then a Google Apps Script run step, feed a Google Slides deck with templated tables, designs and fonts. A person starts the refresh by pressing Run script, and the sales team uses one shared link to the deck. A dashed box marks a next idea that is not built yet: summarise the changes in Airtable or Slack and ask the team to approve before the script runs.',
    nodes: [
      { id: 'at', c: 0, r: 0, t: 'Airtable', s: 'workshop details', col: 'ink' },
      { id: 'auto', c: 1, r: 0, t: 'Automations', s: 'Airtable, Zapier', col: 'blue' },
      { id: 'gas', c: 2, r: 0, t: 'Apps Script', s: 'Run script step', col: 'gold-t' },
      { id: 'day', c: 0, r: 1, t: 'Manual run', s: 'I press Run script', col: 'sand' },
      { id: 'deck', c: 2, r: 1, t: 'Google Slides', s: 'catalogue deck', col: 'gold' },
      { id: 'sales', c: 2, r: 2, t: 'Sales team', s: 'one shared link', tone: 'person' },
      { id: 'next', c: 0, r: 2, span: 2, t: 'Next: approve before it runs', s: 'Airtable or Slack · not built yet', tone: 'next' },
    ],
    links: [
      { a: 'at', b: 'auto' }, { a: 'auto', b: 'gas' }, { a: 'gas', b: 'deck' }, { a: 'deck', b: 'sales' },
      { a: 'day', b: 'at', style: 'dash' },
    ],
    routes: [
      { via: ['at', 'auto', 'gas', 'deck', 'sales'], T: 12, idle: 1.4, blobs: [{ delay: 3.6, tone: 'ink', still: 6.2, swaps: [{ at: 3, tone: 'blue' }] }] },
      { via: ['day', 'at'], T: 12, idle: 8.2, blobs: [{ tone: 'gold', still: 2.4 }] },
    ],
    legend: [['ink', 'workshop data'], ['blue', 'slides'], ['gold', 'manual trigger']],
  },

  /* ── Contract automation: the button ── */
  'contract-button': {
    accent: 'gold',
    eyebrow: 'Flow 01 / The button',
    title: 'Airtable record to Ironclad contract.',
    layout: { dots: { ink: 'ink', blue: 'grey', gold: 'accent' } },
    label:
      'Animated diagram of the contract button. A button on the provider or order-form record in Airtable runs a script, either an Airtable custom extension or a Google Apps Script. It sends an API request that makes a copy of the contract template, pre-filled from the Airtable database. A new Ironclad workflow is created and the file uploaded, the right managers and a single legal signer are tagged with signature boxes placed, and the status is updated back in Airtable.',
    nodes: [
      { id: 'at', c: 0, r: 0, t: 'Airtable', s: 'record + button', col: 'ink' },
      { id: 'scr', c: 1, r: 0, t: 'Script', s: 'runs on click', col: 'blue-t' },
      { id: 'tpl', c: 2, r: 0, t: 'Contract copy', s: 'pre-filled', col: 'gold-t' },
      { id: 'ic', c: 2, r: 1, t: 'Ironclad', s: 'workflow + file', col: 'red' },
      { id: 'sign', c: 1, r: 1, t: 'Signers tagged', s: 'managers + legal', tone: 'person' },
      { id: 'box', c: 0, r: 1, t: 'Boxes placed', s: 'for signatures', col: 'gold-t' },
      { id: 'st', c: 0, r: 2, t: 'Status', s: 'in Airtable', col: 'ink' },
    ],
    links: [
      { a: 'at', b: 'scr' }, { a: 'scr', b: 'tpl', style: 'dash' }, { a: 'tpl', b: 'ic' }, { a: 'ic', b: 'sign' },
      { a: 'sign', b: 'box' }, { a: 'box', b: 'st' },
    ],
    routes: [
      { via: ['at', 'scr', 'tpl', 'ic', 'sign', 'box', 'st'], T: 13, idle: 1.4, blobs: [{ tone: 'ink', still: 6.4, swaps: [{ at: 2, tone: 'blue' }, { at: 4, tone: 'gold' }] }] },
    ],
    legend: [['ink', 'record data'], ['blue', 'contract file'], ['gold', 'people to sign']],
  },

  /* ── Contract automation: after signing ── */
  'contract-after': {
    accent: 'ink',
    eyebrow: 'Flow 02 / After the person signs',
    title: 'Signed, filed and paid.',
    layout: {
      main: ['who', 'ic', 'auto', 'at', 'type', 'bill', 'pay'],
      chips: [{ at: 'pay', to: 'at', style: 'dash', tone: 'ink' }],
      dots: { gold: 'accent', blue: 'ink', ink: 'grey' },
    },
    label:
      'Animated diagram of what happens after signing. The person signs in Ironclad. Automations download the signed form to the database and update statuses in Airtable. Depending on the contract type, the record is handed to billing so the person gets paid. Billing hands payment data back, and it is written into Airtable so the whole trail is documented in one place.',
    nodes: [
      { id: 'who', c: 0, r: 0, t: 'Person signs', s: 'in Ironclad', tone: 'person' },
      { id: 'ic', c: 1, r: 0, t: 'Ironclad', s: 'signed form', col: 'red' },
      { id: 'auto', c: 2, r: 0, t: 'Automations', s: 'saves the file', col: 'blue' },
      { id: 'at', c: 2, r: 1, t: 'Airtable', s: 'file + status', col: 'ink' },
      { id: 'type', c: 1, r: 1, t: 'Contract type', s: 'decides the path', col: 'sand' },
      { id: 'bill', c: 0, r: 1, t: 'Billing', s: 'person gets paid', tone: 'person' },
      { id: 'pay', c: 0, r: 2, t: 'Payment data', s: 'handed back', col: 'gold-t' },
    ],
    links: [
      { a: 'who', b: 'ic' }, { a: 'ic', b: 'auto' }, { a: 'auto', b: 'at' }, { a: 'at', b: 'type' },
      { a: 'type', b: 'bill' }, { a: 'bill', b: 'pay' }, { a: 'pay', b: 'at', mode: 'hv', style: 'dash' },
    ],
    routes: [
      { via: ['who', 'ic', 'auto', 'at', 'type', 'bill', 'pay', 'at:hv'], T: 14, idle: 1.2, blobs: [{ tone: 'gold', still: 4.6, swaps: [{ at: 1, tone: 'blue' }, { at: 3, tone: 'ink' }] }] },
    ],
    legend: [['gold', 'the signature'], ['blue', 'signed form'], ['ink', 'status, payment']],
  },

  /* ── Strategy Growth Roadmap: Sheet, script and browser ── */
  'growth-sync': {
    accent: 'gold',
    eyebrow: 'Flow 01 / Sheet, script and browser',
    title: 'Edits are instant.',
    layout: {
      branch: { from: 'lock', via: ['conf', 'choice'], route: 1 },
      chips: [{ at: 'choice', to: 'gas', style: 'dash', tone: 'gold' }],
      foot: ['note'],
      dots: { ink: 'ink', gold: 'grey', red: 'accent' },
    },
    label:
      'Animated diagram of how the Strategy Growth Roadmap saves. You edit in the browser, which holds the whole roadmap in memory. About 0.4 seconds after the last edit, a batched autosave goes to a Google Apps Script function called saveChart. The script takes a script lock and checks the revision the save started from. If it is current, the five Google Sheet tabs are written and the status changes to Saved. If someone saved first, the script reports a conflict, and you choose Reload or Keep mine; Keep mine saves again over the newer version.',
    nodes: [
      { id: 'you', c: 0, r: 0, t: 'You edit', s: 'click or drag', tone: 'person' },
      { id: 'br', c: 1, r: 0, t: 'Browser', s: 'all in memory', col: 'blue' },
      { id: 'save', c: 2, r: 0, t: 'Autosave', s: '0.4 s, batched', col: 'sand' },
      { id: 'gas', c: 2, r: 1, t: 'Apps Script', s: 'saveChart', col: 'gold-t' },
      { id: 'lock', c: 1, r: 1, t: 'Lock + check', s: 'lock, revision', col: 'red-t' },
      { id: 'sheet', c: 0, r: 1, t: 'Google Sheet', s: 'five tabs', col: 'ink' },
      { id: 'ok', c: 0, r: 2, t: 'Saved', s: 'status updates', col: 'blue-t' },
      { id: 'conf', c: 1, r: 2, t: 'Conflict', s: 'stale revision', tone: 'human', step: '!' },
      { id: 'choice', c: 2, r: 2, t: 'Reload / Keep', s: 'you choose', tone: 'person', step: false },
      { id: 'note', c: 0, r: 3, span: 3, t: 'Edits show instantly, saves run behind', col: 'gold-t', tone: 'note' },
    ],
    links: [
      { a: 'you', b: 'br' }, { a: 'br', b: 'save' }, { a: 'save', b: 'gas' }, { a: 'gas', b: 'lock' },
      { a: 'lock', b: 'sheet' }, { a: 'sheet', b: 'ok' },
      { a: 'lock', b: 'conf', style: 'red' }, { a: 'conf', b: 'choice' }, { a: 'choice', b: 'gas', style: 'dash' },
    ],
    routes: [
      {
        via: ['you', 'br', 'save', 'gas', 'lock', 'sheet', 'ok'], T: 14, idle: 1.2,
        blobs: [{ tone: 'ink', still: 6.4, swaps: [{ at: 3, tone: 'gold' }, { at: 5, tone: 'blue' }] }],
      },
      { via: ['gas', 'lock', 'conf', 'choice'], T: 14, idle: 5, blobs: [{ delay: 7, tone: 'red', still: 3.6 }] },
    ],
    legend: [['ink', 'your edit'], ['gold', 'the save'], ['red', 'edited elsewhere']],
  },

  /* ── Documentation library: create a page, edit live, stored as a Google Doc ── */
  'docs-create': {
    accent: 'red',
    eyebrow: 'Flow 01 / How it works',
    title: 'Each page is a real Google Doc.',
    layout: {
      branch: { lead: 'or', via: ['paste', 'copy'], route: 1 },
      chips: [{ at: 'copy', to: 'edit', tone: 'ink' }],
      dots: { ink: 'ink', red: 'accent' },
    },
    label:
      'Animated diagram in three steps. Step 1, create a page: either start a new page, or paste an anyone-with-link Google Doc link, which is copied in and tidied while the original stays untouched. Step 2, edit live in the dashboard editor, which saves to Google Docs about 3 seconds after typing stops. Step 3, the page is stored as a Google Doc in the shared drive.',
    nodes: [
      { id: 'new', c: 0, r: 0, t: 'New page', s: 'start typing', col: 'white', step: 1 },
      { id: 'paste', c: 2, r: 0, t: 'Paste a Doc link', s: 'anyone-with-link', col: 'white', step: 1 },
      { id: 'copy', c: 2, r: 1, t: 'Copied, tidied', s: 'original kept', col: 'sand', step: false },
      { id: 'edit', c: 0, r: 2, span: 3, t: 'Edit live in the dashboard', s: 'saves ~3 seconds after typing stops', tone: 'human', step: 2 },
      { id: 'doc', c: 0, r: 3, span: 3, t: 'A Google Doc in the shared drive', s: 'in its department and business line folder', col: 'ink', step: 3 },
    ],
    links: [
      { a: 'new', b: 'edit' }, { a: 'paste', b: 'copy' }, { a: 'copy', b: 'edit' }, { a: 'edit', b: 'doc' },
    ],
    routes: [
      { via: ['new', 'edit', 'doc'], T: 10, idle: 1.6, blobs: [{ tone: 'ink', still: 6, swaps: [{ at: 2, tone: 'red' }] }] },
      { via: ['paste', 'copy', 'edit'], T: 10, idle: 1.6, blobs: [{ delay: 5, tone: 'ink', still: 4.6 }] },
    ],
    legend: [['ink', 'a page'], ['red', 'a Google Doc']],
  },

  /* ── Strategy Growth Roadmap: one master Sheet, a copy per client ── */
  'growth-copies': {
    accent: 'red',
    eyebrow: 'Flow 02 / One master Sheet',
    title: 'Nothing to install.',
    layout: {
      main: ['master', 'link', 'a'],
      group: { at: 'a', ids: ['a', 'b', 'c'] },
      foot: ['note'],
      dots: { ink: 'ink', blue: 'accent', gold: 'grey' },
    },
    label:
      'Animated diagram of one master Google Sheet being copied for each client. The master Sheet is shared as a view-only copy link. Each new client, shown generically as Client A, Client B and Client C, makes a copy of it and gets their own private Sheet with their own data, with nothing to install.',
    nodes: [
      { id: 'master', c: 1, r: 0, t: 'Master Sheet', s: 'one template', col: 'ink' },
      { id: 'link', c: 1, r: 1, t: 'Copy link', s: 'view-only', col: 'gold-t' },
      { id: 'a', c: 0, r: 2, t: 'Client A', s: 'private copy', col: 'blue', step: 3 },
      { id: 'b', c: 1, r: 2, t: 'Client B', s: 'private copy', col: 'gold', step: 3 },
      { id: 'c', c: 2, r: 2, t: 'Client C', s: 'private copy', col: 'red', step: 3 },
      { id: 'note', c: 0, r: 3, span: 3, t: 'Every new client is just a copy', col: 'gold-t', tone: 'note' },
    ],
    links: [
      { a: 'master', b: 'link' }, { a: 'link', b: 'a', mode: 'hv' }, { a: 'link', b: 'b' }, { a: 'link', b: 'c', mode: 'hv' },
    ],
    routes: [
      { via: ['master', 'link', 'a'], T: 12, idle: 1.4, blobs: [{ tone: 'ink', still: 10, swaps: [{ at: 2, tone: 'blue' }] }] },
      { via: ['master', 'link', 'b'], T: 12, idle: 1.4, blobs: [{ delay: 4, tone: 'ink', still: 10, swaps: [{ at: 2, tone: 'gold' }] }] },
      { via: ['master', 'link', 'c'], T: 12, idle: 1.4, blobs: [{ delay: 8, tone: 'ink', still: 10, swaps: [{ at: 2, tone: 'red' }] }] },
    ],
    legend: [['ink', 'the master'], ['blue', 'a copy per client'], ['gold', 'their own data']],
  },

  /* ── Strategy Growth Roadmap: rollout ── */
  'growth-rollout': {
    accent: 'red',
    eyebrow: 'Flow 03 / Setting it up',
    title: 'One setup, done once.',
    layout: {
      foot: ['note'],
      dots: { ink: 'ink', blue: 'accent', gold: 'grey' },
    },
    label:
      'Animated diagram of the rollout. I set up one master Google Sheet that holds the template and the Apps Script code, deploy one web app once, and paste its address into the code. I share the master with a copy link. A client makes their own copy, approves Google the first time, and uses the Open full screen menu item, which opens their own Sheet in the web app as them. Clients never deploy anything.',
    nodes: [
      { id: 'master', c: 0, r: 0, t: 'Master Sheet', s: 'template + code', col: 'ink' },
      { id: 'deploy', c: 1, r: 0, t: 'Deploy once', s: 'one web app', col: 'gold-t' },
      { id: 'url', c: 2, r: 0, t: 'Paste its URL', s: 'into the code', col: 'sand' },
      { id: 'share', c: 2, r: 1, t: 'Share link', s: 'view-only copy', col: 'red-t' },
      { id: 'copy', c: 1, r: 1, t: 'Client copy', s: 'their own Sheet', col: 'blue' },
      { id: 'appr', c: 0, r: 1, t: 'Approve', s: 'first time only', tone: 'person' },
      { id: 'full', c: 0, r: 2, t: 'Full screen', s: 'one menu click', col: 'gold' },
      { id: 'data', c: 1, r: 2, t: 'Their Sheet', s: 'opened as them', col: 'ink' },
      { id: 'note', c: 0, r: 3, span: 3, t: 'Clients never deploy anything', col: 'gold-t', tone: 'note' },
    ],
    links: [
      { a: 'master', b: 'deploy' }, { a: 'deploy', b: 'url' }, { a: 'url', b: 'share' }, { a: 'share', b: 'copy' },
      { a: 'copy', b: 'appr' }, { a: 'appr', b: 'full' }, { a: 'full', b: 'data' },
    ],
    routes: [
      {
        via: ['master', 'deploy', 'url', 'share', 'copy', 'appr', 'full', 'data'], T: 16, idle: 1.4,
        blobs: [{ tone: 'ink', still: 9, swaps: [{ at: 4, tone: 'blue' }, { at: 6, tone: 'gold' }] }],
      },
    ],
    legend: [['ink', 'me, once'], ['blue', 'each client'], ['gold', 'their roadmap']],
  },
};
