/**
 * Case study: contract automation at Modern Health (Airtable to Ironclad).
 * Operations and automation work. Every statement here must be something Cameron
 * has stated. No figures, no names, no real contracts, providers or emails.
 * Only number on the page: "150+ automations" (résumé figure across many projects).
 */
export const meta = {
  title: 'Case study: Contract automation',
  description:
    'How I simplified, then automated, provider and freelancer contracts at Modern Health: one button in Airtable creates the contract in Ironclad, with the legal team’s system of record kept in the loop.',
};

export const stats = [
  { value: 'One click', label: 'Airtable record to Ironclad contract' },
  { value: 'Fewer steps', label: 'Removed with legal’s agreement' },
  { value: 'Ironclad', label: 'Stayed legal’s system of record' },
  { value: '150+', label: 'Automations across Modern Health projects' },
];

export const note =
  'Figures, names and internal details are left out, and I can’t show real contracts.';

export const platforms = ['Airtable', 'Airtable custom extension', 'Google Apps Script', 'Ironclad', 'Slack'];

export const problem = [
  'Leadership wanted payments automated for the providers we pay and for freelance audio and video teams. Each payment needed an order form and a contract: dozens created by hand every day, through many steps across multiple teams before one therapist could be paid.',
];

export const rethink = [
  'I first tried to automate the process as it stood, then found steps that didn’t need to exist. Legal, for example, reviewed the contract before it was sent and signed again after the person signed. I asked whether it could be signed once. Legal confirmed it could, and those steps went away before I automated anything.',
];

export const decision = [
  'One proposal was to build everything in Looker Studio. I pushed back: Ironclad is how legal tracked contracts and signatures, so the automation had to work with it, not around it. That’s the version we built.',
];

export const flows = {
  button: {
    title: 'The button',
    body: [
      'A button on each Airtable record runs a script (an Airtable custom extension or Google Apps Script). It copies the pre-filled contract template, starts an Ironclad workflow, uploads the file, tags the managers and one legal signer, places the signature boxes and writes the status back to Airtable.',
    ],
  },
  after: {
    title: 'After the person signs',
    body: [
      'Automations save the signed form and update statuses in Airtable. Depending on contract type, the record goes to billing so the person gets paid, and billing’s handoff feeds payment data back, keeping the whole trail in one place.',
    ],
  },
};

export const results = [
  'Creating a contract went from hand-built to one click.',
  'The extra review and sign-off steps were removed, with legal’s agreement.',
  'Everyone could see where a contract stood.',
];

export const learned = [
  'Simplify first, then automate. Otherwise you just make unnecessary steps faster.',
  'Keep legal’s system of record in the loop. It worked because it fed Ironclad instead of replacing it.',
  'Show more with screenshots. I used diagrams because the real contracts are private.',
];
