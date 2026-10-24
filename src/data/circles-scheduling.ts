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
  { value: 'Seconds', label: 'What took hours of manual setup' },
  { value: 'Dozens', label: 'Zapier workflows and Airtable automations in this project' },
  { value: '150+', label: 'Automations I built across projects at Modern Health' },
  { value: 'Producer', label: 'Still sends every email, so it reads personal' },
];

export const note =
  'This is operations and automation work, built with Zapier, Airtable and the tools my team already used. I’ve left out figures, client names and internal details.';

export const platforms = ['Zendesk', 'Airtable', 'Zapier', 'Zoom', 'Google Calendar', 'Google Sheets', 'Google Slides', 'Google Apps Script', 'Slack'];

export const problem = [
  'I was a creative producer at Modern Health. I worked with clinical strategists, mental health providers and clients to produce online workshops and webinars called Circles.',
  'Setting each one up was very manual. We tracked everything across many tools and databases, and I’d have double-digit browser tabs open for a single step. Getting from a new Circle request in Zendesk to a finished Zoom event took hours of producer time.',
  'Early on we were short on people, so we had to decline some Circles for clients.',
];

export const built = [
  'I’d set Circles up many times by then. I mapped every part of the process into one giant flowchart, then built dozens and dozens of Zapier workflows and Airtable automations from it.',
  'The main one is a long multi-step Zapier workflow with API requests, formatting steps and actions. Around it sit many smaller automations that update Airtable (or Google Sheets) and notify people in Slack when a step finishes.',
  'I chose one large workflow because it was the most seamless way to take data from Airtable, create the Zoom event, write fresh data back to Airtable, create the Google Calendar events and generate custom Zendesk and email responses, all in one pass.',
  'I built 150+ automations across many workflows and projects at Modern Health. This was one of those projects.',
];

export const flows = {
  schedule: {
    title: 'Circles scheduling, end to end',
    body: [
      'A request comes in through Zendesk and becomes a record in Airtable, the source of truth. The Zapier workflow reads it and calls the Zoom API to create an event from a template, and the Zoom links come back into Airtable.',
      'It then creates the Google Calendar events and the slide decks for the facilitators, and shares them ahead of time. Last, it writes a clean, ready-to-send email for the producer, with hyperlinks to the specific Zoom links and slide decks.',
      'I kept the producer in the loop on purpose. They send the email themselves, so it still reads like a person wrote it. A Slack notification lets the team know.',
    ],
  },
  harden: {
    title: 'What broke, and what I changed',
    body: [
      'Most of what broke came from messy form entries. The emails from the form are plugged into JSON in the Zoom API request, so a stray trailing space in one field was enough to break that step.',
      'I added a separate automation that checks every record as forms come in. It trims the spaces, and if it finds something else, such as several emails in one field, it flags the whole row in Airtable. The team sees it before the main automation is triggered.',
      'A second fix came when Zoom tightened its security and started censoring the URLs its API returned. I added a find-and-replace step after the API request that puts our own IDs back.',
    ],
  },
  deck: {
    title: 'The workshop catalogue deck',
    body: [
      'Airtable holds the details of every workshop we offer: languages, length, course types, seasonal availability and about a dozen details in all.',
      'An Airtable automation, Zapier connectors and a Google Apps Script turn that into a Google Slides deck with templated tables, designs and fonts. Refreshing it is one click, so the sales team has one shared link that works as an up-to-date catalogue of our workshops and webinars. I built several automations like this one that keep decks fresh.',
      'The refresh is a manual “Run script” step, so nothing in the deck can change by accident.',
    ],
    related:
      'A related workflow duplicates a master workshop deck, fills in the date, speaker and company, and files it in the right folder. One failure came from free text typed into a URL field, so I made that field URL-only.',
  },
};

export const results = [
  'Setup went from hours of manual work to one step that runs in seconds.',
  'Errors became rare over time. Each failure I found turned into a check or a fix.',
  'It’s documented, so other people can maintain it.',
  'In my first year we had to decline some Circles because we were short on people. By my last year, the team had shrunk while the business had grown substantially. I think this workflow was part of how that worked.',
];

export const success = ['It works.', 'It saves clicks and time.', 'It’s documented, so someone else can fix it.'];

export const differently = [
  'Replace the find-and-replace step with a small custom script, or use the proper security tokens, instead of patching the URLs after the fact.',
  'Build an approval screen for the deck refresh, in Airtable or Slack. It would summarise what’s about to change and ask the team to approve before the script runs.',
  'Show more of this with screenshots. I’ve used diagrams here because the real records and links are internal.',
];
