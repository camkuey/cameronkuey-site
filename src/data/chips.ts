/** Platform colours, shared by the flow graphics, the chips and the case cards. */
export type ChipCol = 'red' | 'blue' | 'gold' | 'ink' | 'red-t' | 'blue-t' | 'gold-t' | 'sand';
export const CHIP: Record<string, ChipCol> = {
  Zendesk: 'red',
  Airtable: 'ink',
  Zapier: 'blue',
  Zoom: 'blue-t',
  'Google Calendar': 'gold',
  'Google Sheets': 'gold-t',
  'Google Slides': 'gold',
  'Google Apps Script': 'gold-t',
  'Apps Script': 'gold-t',
  'Airtable custom extension': 'blue-t',
  Ironclad: 'red',
  Slack: 'sand',
  API: 'sand',
};
export const chipClass = (name: string) => `chip ch-${CHIP[name] ?? 'sand'}`;
