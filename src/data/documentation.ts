/**
 * Documentation case study content (a feature of the Internal Dashboard, in beta).
 * Every statement must be something Cameron has stated or approved. No usage numbers,
 * no library page counts, no claims about live staff use, no shared cursors.
 * Screenshots: the dashboard's sample-data mode, "-clean" versions, cropped by
 * scripts/process-documentation-images.mjs into public/media/documentation.
 */
export const meta = {
  title: 'Case study: the Documentation library',
  description:
    'How Cameron Kuey built one documentation library inside Doodle Pirates Foundation’s Internal Dashboard: every process doc is a real Google Doc in the shared Drive, found, started and edited from one place.',
};

export const spec = [
  ['Org', 'Doodle Pirates Foundation'],
  ['Role', 'Director of Business Operations'],
  ['Stack', 'React + Vite, Hono, Cloudflare Worker, Airtable, Google Docs and Drive'],
  ['Status', 'Beta, under the Learn menu'],
];

/** Hero tiles. Counts come from the code repository; the first is the key tile. */
export const stats = [
  { value: 'Oct 14', label: 'First version shipped, 2026' },
  { value: 'Beta', label: 'Where it stands today' },
  { value: '~26', label: 'Merged PRs touching it' },
  { value: '79', label: 'Documentation tests' },
];
export const statsNote = 'Counts come from the private code repository: merged pull requests that touch documentation, and documentation test cases.';

export const problem = [
  'Process docs were saved in different drives and folders, often not on the shared drive.',
  'Each workflow had several versions of its doc, and nobody knew which one was official.',
];

export const approach = [
  'Every page is a real Google Doc in the shared drive. Each department has one Process Documentation folder, with a subfolder per business line.',
  'The dashboard is the single front door. Staff find, start or edit a page without leaving it.',
];

export const how = [
  'Start a page from scratch, or paste an anyone-with-link Google Doc link. It is copied in and tidied, and the original is never touched.',
  'Edit live in the dashboard. Changes save to Google Docs about 3 seconds after typing stops.',
];

export const decisions: { title: string; text: string }[] = [
  { title: 'Edits never overwrite each other', text: 'Dashboard and Google Docs edits are reconciled by revision checks, and the app looks for outside edits about every 60 seconds. If both sides changed, a banner offers See what changed, Load their version or Keep mine.' },
  { title: 'A wipe is refused', text: 'A save that would shrink or wipe a page by more than 80% is refused.' },
  { title: 'Folders are only ever added', text: 'A nightly job creates any missing folders and never deletes anything.' },
  { title: 'A fenced service account', text: 'One service account does all the reading and writing, and the app refuses anything outside the doc folders.' },
  { title: 'Interns see only what they are granted', text: 'Interns and contractors see only the pages granted to them: a business line, a single page, or a department’s General folder. They never see Google links or file names. Airtable stores only these grants.' },
  { title: 'File names keep the Drive searchable', text: 'Names follow a standard so the Drive stays searchable outside the app. The dashboard shows only the title.' },
];

/** The file-name standard, as parts of one example name. */
export const nameParts = [
  { part: 'DPF', label: 'Prefix' },
  { part: 'CSR', label: 'Initials' },
  { part: '261023-0940', label: 'Pacific date and time' },
  { part: 'Reordering shop supplies', label: 'Title' },
];

export const roles = [
  ['Directors and managers', 'Read, add, edit, delete'],
  ['Leads and individual contributors', 'Read, add, edit'],
  ['Interns and contractors', 'Read only the pages granted to them'],
];

export type DocShot = { id: string; label: string; text: string; alt: string; phone?: boolean };
export const shots = {
  library: { id: 'docs-library', label: 'The library', text: 'Search, and pages grouped by department and business line.',
    alt: 'The Documentation library for the Operations department, with a Beta label beside the title: a search box, an Intern access button, and page groups for Grants, Community Fundraising, Systems & Automation and General, each listing its pages with a New Page link.' },
  editor: { id: 'docs-editor', label: 'The editor', text: 'A formatting toolbar and a link to open the same page in Google Docs. Images go into the doc, and videos are links that play inline.',
    alt: 'The editor open on the page “How we apply for a grant”: a Google Doc label with its Operations Process Documentation folder path, an Open in Google Docs link, a Delete page button, a formatting toolbar, and the start of the page text with a Purpose heading and numbered steps.' },
  newPage: { id: 'docs-new-page', label: 'New page', text: 'Start writing, or paste an anyone-with-link Google Doc to bring it in.',
    alt: 'A new page in the Grants group: a box to paste a Google Doc link with a Bring it in button and a note that the original is not changed, an Untitled title field, and a Start writing button.' },
  newPageEditor: { id: 'docs-new-page-editor', label: 'A new page, named by the standard', text: 'The Drive file name carries the DPF standard. The page title is just the title.',
    alt: 'The page “Reordering shop supplies” right after creation: a Google Doc line showing the folder path and a file name that begins DPF, the page title, a formatting toolbar and one line of text.' },
  intern: { id: 'docs-intern-access', label: 'Intern access', text: 'Grant a whole business line, a single page, or a department’s General folder.',
    alt: 'The Intern access panel: four intern tabs and, for the selected intern, checkboxes for the Grants business line with its three pages, Community Fundraising, Systems & Automation and the General folder.' },
  internView: { id: 'docs-intern-view', label: 'What an intern sees', text: 'Only the granted pages, with no Google links and no file names.',
    alt: 'The Documentation library as an intern sees it: a shorter menu and one group, Grants, listing the three pages that were shared.' },
  phoneLibrary: { id: 'docs-phone-library', label: 'The library', text: '', phone: true,
    alt: 'Phone view of the Documentation library: a search box, an Intern access button, and the Grants group with its pages above Community Fundraising.' },
  phoneEditor: { id: 'docs-phone-editor', label: 'The editor', text: '', phone: true,
    alt: 'Phone view of the editor on the page “How we apply for a grant”, with the Google Doc label, a wrapped formatting toolbar and the start of the text.' },
} satisfies Record<string, DocShot>;

/** The large, stacked desktop screens (the library is the hero). */
export const stack: DocShot[] = [shots.editor, shots.newPage, shots.newPageEditor, shots.intern, shots.internView];
export const phones: DocShot[] = [shots.phoneLibrary, shots.phoneEditor];

export const timeline = [
  { when: 'Oct 14, 2026', text: 'First version shipped.' },
  { when: 'Oct 15', text: 'Safety fixes followed.' },
  { when: 'Oct 20 to 22', text: 'More safety fixes.' },
];

export const limits: { title: string; text: string }[] = [
  { title: 'Beta', text: 'It sits under the Learn menu with a Beta label.' },
  { title: 'No template system', text: 'Every page starts blank or from a pasted Google Doc.' },
  { title: 'No approval step', text: 'Google version history is the audit trail.' },
  { title: 'No task-to-doc links yet', text: 'Tasks and process docs are not connected in the dashboard.' },
];
