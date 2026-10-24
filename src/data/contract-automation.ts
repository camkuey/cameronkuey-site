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
  { value: 'One click', label: 'From an Airtable record to an Ironclad contract' },
  { value: 'Fewer steps', label: 'Removed with legal’s agreement' },
  { value: 'Ironclad', label: 'Stayed legal’s system of record' },
  { value: '150+', label: 'Automations I built across projects at Modern Health' },
];

export const note =
  'This is operations and automation work, built with Airtable, Google Apps Script and Ironclad. I’ve left out figures, names and internal details, and I can’t show real contracts.';

export const platforms = ['Airtable', 'Airtable custom extension', 'Google Apps Script', 'Ironclad', 'Slack'];

export const problem = [
  'Leadership at Modern Health wanted payments automated for the mental health providers we pay, and for freelance audio and video teams. Providers are paid for every webinar they lead, content they help develop, podcasts and slides.',
  'Every one of those needed an order form and a contract. Dozens of new ones had to be created by hand every day, and each went through many steps across multiple teams before one therapist could be paid.',
];

export const rethink = [
  'My first stab was to automate the process as it stood. Then I learned how it really worked, and found steps that didn’t need to exist and teams reviewing things other teams had already reviewed.',
  'For example, legal reviewed the contract before it was sent, then signed it again after the person signed. I asked whether it could be signed once. Legal confirmed it could, and those steps went away. Only then did I automate it.',
];

export const decision = [
  'One proposal was to build everything in Looker Studio and generate the contracts from there. I pushed back. Ironclad is how our legal team tracked contracts and signatures, so the automation had to work with Ironclad, not around it. That’s the version we built.',
];

export const flows = {
  button: {
    title: 'The button',
    body: [
      'Each provider or order-form record in Airtable has a button. Clicking it runs a script, either an Airtable custom extension or a Google Apps Script.',
      'The script sends an API request that makes a copy of the contract template, pre-filled with the person’s details from our Airtable database. It starts a new workflow in Ironclad and uploads the file, then tags the right managers and a single legal signer and places the signature boxes. Last, it updates the status back in Airtable.',
    ],
  },
  after: {
    title: 'After the person signs',
    body: [
      'Once the person signs, automations download the signed form into the database and update the statuses in Airtable.',
      'Depending on the contract type, the record is then handed to billing so the person gets paid. Billing’s handoff feeds payment data back into the database, so the whole trail is documented in one place.',
    ],
  },
};

export const results = [
  'Creating a contract went from hand-built to one click.',
  'The extra review and sign-off steps were removed, with legal’s agreement.',
  'Everyone could see where a contract stood, in one place.',
];

export const learned = [
  'Simplify the process first, then automate it. Automating the old process would have just made the unnecessary steps faster.',
  'Keep the legal team’s system of record in the loop. The automation worked because it fed Ironclad instead of replacing it.',
  'Show more of this with screenshots. I’ve used diagrams here because the real contracts and records are private.',
];
