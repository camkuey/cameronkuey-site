/**
 * Case study: Circles scheduling at Modern Health.
 * Operations and automation work (Zapier, Airtable and friends). Every statement
 * here must be something Cameron has stated. No figures, no client names, no real
 * Zoom IDs or links, no emails, no internal details.
 * Only number on the page: "150+ automations", Cameron's résumé figure, which
 * spans many projects at Modern Health, not just this workflow.
 */
export const meta = {
  title: 'Case study: Circles scheduling',
  description:
    'How I turned a manual, multi-tab setup for online workshops and webinars at Modern Health into a one-step workflow, built with Zapier, Airtable, Zendesk, Zoom, Google Calendar, Slides and Slack.',
};

export const stats = [
  { value: 'Seconds', label: 'Was hours of setup' },
  { value: 'Dozens', label: 'Zapier and Airtable automations here' },
  { value: '150+', label: 'Automations across Modern Health projects' },
  { value: 'Producer', label: 'Still sends every email' },
];

export const note =
  'Figures, client names and internal details are left out.';

export const platforms = ['Zendesk', 'Airtable', 'Zapier', 'Zoom', 'Google Calendar', 'Google Sheets', 'Google Slides', 'Google Apps Script', 'Slack'];

export const problem = [
  'I was a creative producer at Modern Health, running online workshops and webinars called Circles. Setup was manual: many tools, double-digit browser tabs for one step, and hours of producer time from Zendesk request to finished Zoom event. Early on, short staffing meant declining some Circles.',
];

export const built = [
  'I mapped the whole process into one giant flowchart, then built dozens of Zapier workflows and Airtable automations from it. The core is one long multi-step Zapier workflow; smaller automations around it update Airtable (or Google Sheets) and notify people in Slack.',
  'One large workflow was the most seamless way to pull from Airtable, create the Zoom event, write data back, create the Google Calendar events and generate custom Zendesk and email responses in one pass. In all, I built 150+ automations across projects at Modern Health.',
];

export const flows = {
  schedule: {
    title: 'Circles scheduling, end to end',
    body: [
      'A Zendesk request becomes an Airtable record, the source of truth. Zapier calls the Zoom API to create the event, writes the links back, builds the Calendar events and facilitator decks, and drafts the email. The producer sends it, so it still reads personal, and Slack notifies the team.',
    ],
  },
  harden: {
    title: 'What broke, and what I changed',
    body: [
      'Most breakage came from messy form entries: one trailing space could break the Zoom API request. A checker automation now trims spaces and flags anything else, like several emails in one field, in Airtable before the main workflow runs.',
      'When Zoom began censoring URLs in its API responses, a find-and-replace step put our own IDs back.',
    ],
  },
  deck: {
    title: 'The workshop catalogue deck',
    body: [
      'Airtable holds about a dozen details per workshop. An Airtable automation, Zapier connectors and a Google Apps Script turn them into a Google Slides catalogue deck. One click refreshes it, so sales has one always-current link. The refresh is a manual “Run script” step, so nothing changes by accident.',
    ],
    related:
      'A related workflow copies a master deck, fills in the date, speaker and company, and files it. Free text in a URL field once broke it, so that field is now URL-only.',
  },
};

export const results = [
  'Setup went from hours of manual work to one step that runs in seconds.',
  'Errors became rare. Each failure turned into a check or a fix.',
  'In my first year we declined some Circles for lack of people. By my last year the team was smaller and the business had grown substantially. I think this workflow helped make that possible.',
];

export const success = ['It works.', 'It saves clicks and time.', 'It’s documented, so someone else can fix it.'];

export const differently = [
  'Swap the find-and-replace step for a small custom script or proper security tokens.',
  'Add an approval screen for the deck refresh, in Airtable or Slack, that summarises what will change.',
  'Show more with screenshots. I used diagrams because the real records are internal.',
];
