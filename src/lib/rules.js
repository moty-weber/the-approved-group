// Per-country document rules for citizenship-by-descent files.
// GENERAL GUIDANCE ONLY — laws, forms and consular practice change; every file must be checked against the current law and the competent authority.
export const DOC_TYPES = {
  birth_cert: 'Birth certificate', marriage_cert: 'Marriage certificate', death_cert: 'Death certificate', passport: 'Passport', id_card: 'ID card',
  citizenship_proof: 'Proof of citizenship', residence_reg: 'Residence / address registration', naturalization: 'Naturalization record',
  emigration: 'Emigration / travel record', military: 'Military record', persecution: 'Proof of persecution', name_change: 'Name-change document',
  divorce: 'Divorce decree', criminal_record: 'Criminal-record certificate', census: 'Census / voter list', application_form: 'Application form',
  cv: 'CV / life history', photo: 'Passport photo', translation: 'Translation', apostille: 'Apostille', other: 'Other',
};
export const DOC_STATUSES = [
  ['needed', 'Needed'], ['requested', 'Requested'], ['received', 'Received'], ['apostilled', 'Apostilled'], ['translated', 'Translated'], ['submitted', 'Submitted'], ['not_needed', 'Not needed'],
];
export const DONE = new Set(['received', 'apostilled', 'translated', 'submitted', 'not_needed']);
export const PROJECT_STATUSES = [
  ['new', 'New'], ['research', 'Research'], ['documents', 'Collecting documents'], ['ready', 'Ready to file'], ['submitted', 'Submitted'], ['approved', 'Approved'], ['on_hold', 'On hold'], ['archived', 'Archived'],
];
export const ACTIVE_STATUSES = new Set(['research', 'documents', 'ready', 'submitted', 'on_hold']);

// Common sets
const LINK = [
  { type: 'birth_cert', why: 'Proves the parent–child link in the chain' },
  { type: 'marriage_cert', why: 'Shows the parents\u2019 marriage / name continuity', when: 'married' },
  { type: 'name_change', why: 'Only if the name differs between documents', optional: true },
];
const APPLICANT = [
  { type: 'birth_cert', why: 'Full (long-form) birth certificate of the applicant' },
  { type: 'passport', why: 'Copy of current passport' },
  { type: 'marriage_cert', why: 'If married or the name changed', when: 'married', optional: true },
];

export const COUNTRIES = {
  HU: {
    name: 'Hungary', flag: '🇭🇺', route: 'Simplified naturalization (Act LV of 1993, §4(3))',
    summary: 'For descendants of a person who was a Hungarian citizen — typically born in the Kingdom of Hungary before 1920, or in territories re-annexed 1938–1945. Hungarian language is generally assessed at an interview.',
    matches: ['Kingdom of Hungary', 'Hungary'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record from a place that was in the Kingdom of Hungary (often a Jewish birth register extract)' },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
      { type: 'citizenship_proof', why: 'Any proof of Hungarian citizenship if born outside Hungary (e.g. registration, documents)', optional: true },
    ],
    link: LINK,
    applicant: [...APPLICANT, { type: 'cv', why: 'Handwritten CV in Hungarian' }, { type: 'application_form', why: 'Application form (signed in person)' }, { type: 'photo', why: 'Recent photo' }],
    notes: ['Language: basic Hungarian is usually required (interview).', 'Foreign documents normally need an apostille and a certified Hungarian translation.'],
    apostille: true, translation: 'Hungarian',
  },
  AT: {
    name: 'Austria', flag: '🇦🇹', route: 'Persecuted persons & descendants (§58c Citizenship Act)',
    summary: 'For persecuted persons who lived in Austria (as Austrian citizens or citizens of a successor state of the Habsburg monarchy) and left before 15 May 1955 — and their direct descendants. Dual citizenship is allowed on this route.',
    matches: ['Austria'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof of Austrian citizenship (e.g. Heimatschein / certificate of citizenship) or of residence in Austria' },
      { type: 'residence_reg', why: 'Registration record (Meldezettel) showing residence in Austria' },
      { type: 'emigration', why: 'Proof of leaving Austria before 15 May 1955' },
      { type: 'persecution', why: 'Evidence of persecution or fear of persecution', optional: true },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
    ],
    link: LINK,
    applicant: [...APPLICANT, { type: 'application_form', why: 'Notification form under §58c' }],
    notes: ['No German-language or residence requirement on this route.', 'Documents not in German usually need translation; foreign public documents usually need an apostille.'],
    apostille: true, translation: 'German',
  },
  DE: {
    name: 'Germany', flag: '🇩🇪', route: 'Restoration (Art. 116(2) Basic Law) / declaration (§15 StAG)',
    summary: 'For former German citizens deprived of citizenship on political, racial or religious grounds 1933–1945 and their descendants (Art. 116(2)); §15 StAG covers descendants excluded by older gender-discriminatory rules or persecution-related losses.',
    matches: ['German Empire', 'Germany'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof of German citizenship (old German passport, Heimatschein, naturalization certificate, registration)' },
      { type: 'residence_reg', why: 'Address registration in Germany', optional: true },
      { type: 'emigration', why: 'Emigration record / ship manifest / exit documents' },
      { type: 'naturalization', why: 'Foreign naturalization record (date matters for the claim)' },
      { type: 'persecution', why: 'Evidence of persecution 1933–1945 (or presumed for Jewish ancestors)', optional: true },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
    ],
    link: LINK,
    applicant: [...APPLICANT, { type: 'application_form', why: 'Antrag F (Art. 116) or form for §15 — one per applicant' }],
    notes: ['Germany allows dual citizenship.', 'Documents often accepted in English; check whether certified translations are requested.'],
    apostille: true, translation: 'German (if requested)',
  },
  PL: {
    name: 'Poland', flag: '🇵🇱', route: 'Confirmation of Polish citizenship by descent',
    summary: 'For descendants of a person who held Polish citizenship after 1920 and did not lose it (loss was possible e.g. through foreign military service or naturalization before 1951). Citizenship is confirmed, not granted.',
    matches: ['Poland'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof of Polish citizenship after 1920 (Polish passport, ID, military book, voter / population register)' },
      { type: 'naturalization', why: 'Foreign naturalization record — shows whether and when citizenship could have been lost' },
      { type: 'military', why: 'Military service records (foreign service could cause loss)', optional: true },
      { type: 'emigration', why: 'Emigration / travel record', optional: true },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
    ],
    link: LINK,
    applicant: [...APPLICANT, { type: 'application_form', why: 'Application to the Voivode (confirmation of citizenship)' }],
    notes: ['Foreign documents need an apostille and a sworn Polish translation.', 'After confirmation: transcription of the birth certificate, PESEL number, then passport.'],
    apostille: true, translation: 'Polish (sworn translator)',
  },
  RO: {
    name: 'Romania', flag: '🇷🇴', route: 'Repatriation / re-acquisition (Law 21/1991, Art. 11)',
    summary: 'For former Romanian citizens who lost citizenship (often for reasons not attributable to them) and their descendants up to the third degree (great-grandchildren).',
    matches: ['Romania'],
    ancestor: [
      { type: 'birth_cert', why: 'Romanian birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof the ancestor held Romanian citizenship', optional: true },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
    ],
    link: LINK,
    applicant: [...APPLICANT, { type: 'criminal_record', why: 'Criminal-record certificate from the country of residence' }, { type: 'application_form', why: 'Application to the National Citizenship Authority' }],
    notes: ['Only up to great-grandchildren of the former citizen.', 'Oath of allegiance at the end of the procedure.'],
    apostille: true, translation: 'Romanian',
  },
  CZ: {
    name: 'Czech Republic', flag: '🇨🇿', route: 'Declaration (§31 Act 186/2013)',
    summary: 'For former Czechoslovak / Czech citizens and their children and grandchildren, by declaration.',
    matches: ['Czechoslovakia', 'Czech Republic', 'Protectorate'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof of Czechoslovak citizenship (e.g. domovský list / certificate of citizenship)' },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
    ],
    link: LINK,
    applicant: [...APPLICANT, { type: 'criminal_record', why: 'Criminal-record certificates' }, { type: 'application_form', why: 'Declaration form' }],
    notes: ['Check generation limits for the specific declaration route.'],
    apostille: true, translation: 'Czech',
  },
  SK: {
    name: 'Slovakia', flag: '🇸🇰', route: 'Re-acquisition (case-by-case)',
    summary: 'Slovakia mainly allows former citizens to regain citizenship; descent routes are limited. Treat every file as an individual assessment.',
    matches: ['Czechoslovakia', 'Slovakia', 'Slovak Republic'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof of Czechoslovak / Slovak citizenship' },
    ],
    link: LINK, applicant: APPLICANT,
    notes: ['Limited route — confirm eligibility before collecting documents.'], apostille: true, translation: 'Slovak',
  },
  LT: {
    name: 'Lithuania', flag: '🇱🇹', route: 'Restoration of citizenship',
    summary: 'For persons who held Lithuanian citizenship before 15 June 1940 and their descendants; those who left before 11 March 1990 may generally keep their other citizenship.',
    matches: ['Lithuania'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof of Lithuanian citizenship before 1940 (internal passport, archive records)' },
      { type: 'emigration', why: 'Proof of leaving Lithuania (date matters)' },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
    ],
    link: LINK, applicant: [...APPLICANT, { type: 'application_form', why: 'Application to the Migration Department' }],
    notes: ['Interwar Vilnius region was Poland — check which state the ancestor was a citizen of.'], apostille: true, translation: 'Lithuanian',
  },
  LV: {
    name: 'Latvia', flag: '🇱🇻', route: 'Registration as a citizen (descendants of pre-1940 citizens)',
    summary: 'For descendants of persons who were Latvian citizens on 17 June 1940.',
    matches: ['Latvia'],
    ancestor: [
      { type: 'birth_cert', why: 'Birth record of the ancestor' },
      { type: 'citizenship_proof', why: 'Proof of Latvian citizenship on 17 June 1940' },
      { type: 'marriage_cert', why: 'Marriage record of the ancestor', when: 'married' },
    ],
    link: LINK, applicant: APPLICANT, notes: [], apostille: true, translation: 'Latvian',
  },
  OTHER: {
    name: 'Other / not decided', flag: '🇪🇺', route: 'To be assessed', summary: 'Choose a country once the research shows which route fits.',
    matches: [], ancestor: [{ type: 'birth_cert', why: 'Birth record of the ancestor' }, { type: 'citizenship_proof', why: 'Any proof of the ancestor\u2019s citizenship' }],
    link: LINK, applicant: APPLICANT, notes: [], apostille: true, translation: '',
  },
};
export const RESIDENCY = {
  name: 'Belgian residency / family reunification', flag: '🇧🇪', route: 'Residency file',
  applicant: [
    { type: 'passport', why: 'Valid passport' }, { type: 'birth_cert', why: 'Birth certificate' },
    { type: 'marriage_cert', why: 'Marriage certificate (family reunification)' }, { type: 'application_form', why: 'Annex 3bis / application forms as required' },
  ],
};
export const DISCLAIMER = 'General guidance only — not legal advice. Requirements change; confirm every file with the current law and the competent authority.';

/** Which countries fit the ancestor's birth place in the years he lived there. */
export function suggestCountries(states) {
  const out = [];
  for (const [code, c] of Object.entries(COUNTRIES)) if (c.matches.some(m => states.some(s => s.startsWith(m) || s.includes(m)))) out.push(code);
  return out;
}
