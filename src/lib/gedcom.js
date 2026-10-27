// GEDCOM 5.5.1 import / export — the exchange format of MyHeritage, Geni, Ancestry, FamilySearch, Gramps, etc.
import { toGedcomDate, normalizeDate } from './dates.js';
import { rid } from './tree.js';

const HEB = /[\u0590-\u05FF]/;
function lines(text) {
  const out = [];
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    const m = /^\s*(\d+)\s+(@[^@]+@\s+)?([A-Za-z0-9_]+)(?:\s(.*))?$/.exec(raw);
    if (!m) continue;
    out.push({ lvl: +m[1], xref: m[2] ? m[2].trim() : null, tag: m[3].toUpperCase(), val: m[4] ?? '' });
  }
  return out;
}
function tree(ls) {
  const root = { children: [] }; const stack = [root];
  for (const l of ls) {
    const node = { ...l, children: [] };
    while (stack.length > l.lvl + 1) stack.pop();
    const parent = stack[stack.length - 1];
    if (node.tag === 'CONC' && parent.tag) { parent.val += node.val; continue; }
    if (node.tag === 'CONT' && parent.tag) { parent.val += '\n' + node.val; continue; }
    parent.children.push(node); stack.push(node);
  }
  return root.children;
}
const kid = (n, tag) => n.children.find(c => c.tag === tag);
const kids = (n, tag) => n.children.filter(c => c.tag === tag);
const v = (n, tag) => { const k = n && kid(n, tag); return k ? k.val.trim() : ''; };

function parseName(val) {
  const m = /^(.*?)\/(.*?)\/(.*)$/.exec(val || '');
  if (m) return { given: (m[1] + ' ' + m[3]).trim().replace(/\s+/g, ' '), surname: m[2].trim() };
  return { given: (val || '').trim(), surname: '' };
}

/** Parse GEDCOM text → { persons, families, warnings } with fresh ids. */
export function importGedcom(text) {
  const recs = tree(lines(text));
  const pmap = new Map(), fmap = new Map(); const persons = [], families = []; const warnings = [];
  const head = recs.find(r => r.tag === 'HEAD');
  const charset = head ? v(head, 'CHAR') : '';
  if (/ansel/i.test(charset)) warnings.push('File is in ANSEL encoding — accented letters may look wrong. Re-export as UTF-8 if possible.');
  for (const r of recs) if (r.tag === 'INDI') pmap.set(r.xref, rid());
  for (const r of recs) if (r.tag === 'FAM') fmap.set(r.xref, rid());
  for (const r of recs.filter(r => r.tag === 'INDI')) {
    const p = { id: pmap.get(r.xref), source: 'GEDCOM' };
    const names = kids(r, 'NAME'); const variants = [];
    names.forEach((n, i) => {
      const nm = parseName(n.val);
      const given = v(n, 'GIVN') || nm.given, surname = v(n, 'SURN') || nm.surname;
      const type = v(n, 'TYPE').toLowerCase();
      const full = [given, surname].filter(Boolean).join(' ');
      if (HEB.test(full) && !p.hebrew) { p.hebrew = full; return; }
      if (i === 0 || (!p.given && !p.surname)) { p.given = given; p.surname = surname; const mar = v(n, '_MARNM'); if (mar) { p.maiden = surname; p.surname = mar; } }
      else if (type === 'married' || type === 'marriedname') { if (!p.maiden) { p.maiden = p.surname; p.surname = surname; } }
      else if (type === 'birth' || type === 'maiden') { p.maiden = surname; }
      else if (full) variants.push(full);
      for (const rom of kids(n, 'ROMN').concat(kids(n, 'FONE'))) if (rom.val) variants.push(rom.val.replace(/\//g, '').trim());
    });
    const marnm = v(r, '_MARNM'); if (marnm && !p.maiden) { p.maiden = p.surname; p.surname = marnm; }
    if (variants.length) p.variants = [...new Set(variants)].join('; ');
    const sex = v(r, 'SEX').toUpperCase(); p.sex = sex === 'M' || sex === 'F' ? sex : '';
    const ev = (tag) => kid(r, tag);
    const b = ev('BIRT') || ev('CHR') || ev('BAPM'); if (b) { p.birth_date = normalizeDate(v(b, 'DATE')); p.birth_place = v(b, 'PLAC'); }
    const d = ev('DEAT') || ev('BURI'); if (d) { p.death_date = normalizeDate(v(d, 'DATE')); p.death_place = v(d, 'PLAC'); p.living = false; if (!p.death_date && /^y/i.test(d.val)) p.living = false; }
    const occ = v(r, 'OCCU'); if (occ) p.occupation = occ;
    const reli = v(r, 'RELI'); if (reli) p.religion = reli;
    const nati = v(r, 'NATI'); if (nati) p.citizenship = nati;
    const resi = kid(r, 'RESI'); if (resi) p.residence = v(resi, 'PLAC') || resi.val;
    const emig = kid(r, 'EMIG'); if (emig) p.emigration = [v(emig, 'DATE'), v(emig, 'PLAC')].filter(Boolean).join(', ');
    const natu = kid(r, 'NATU'); if (natu) p.naturalization = [v(natu, 'DATE'), v(natu, 'PLAC')].filter(Boolean).join(', ');
    const notes = kids(r, 'NOTE').map(n => n.val).filter(x => x && !/^@/.test(x));
    if (notes.length) p.notes = notes.join('\n');
    persons.push(p);
  }
  for (const r of recs.filter(r => r.tag === 'FAM')) {
    const f = { id: fmap.get(r.xref), husb: pmap.get(v(r, 'HUSB')) || null, wife: pmap.get(v(r, 'WIFE')) || null, children: kids(r, 'CHIL').map(c => pmap.get(c.val.trim())).filter(Boolean) };
    const m = kid(r, 'MARR'); if (m) { f.marr_date = normalizeDate(v(m, 'DATE')); f.marr_place = v(m, 'PLAC'); }
    if (kid(r, 'DIV')) f.divorced = true;
    families.push(f);
  }
  if (!persons.length) warnings.push('No people found — is this a GEDCOM (.ged) file?');
  return { persons, families, warnings };
}

const esc = s => String(s || '').replace(/\r?\n/g, ' ').replace(/\//g, ' ').trim();
function longVal(lvl, tag, text) {
  const out = []; const parts = String(text).split(/\r?\n/);
  parts.forEach((p, i) => {
    const chunks = p.match(/.{1,200}/gu) || [''];
    chunks.forEach((c, j) => out.push(`${i === 0 && j === 0 ? lvl : lvl + 1} ${i === 0 && j === 0 ? tag : j === 0 ? 'CONT' : 'CONC'} ${c}`));
  });
  return out;
}
/** Export → GEDCOM 5.5.1 UTF-8 text. */
export function exportGedcom(project, persons, families) {
  const pid = new Map(persons.map((p, i) => [p.id, `@I${i + 1}@`]));
  const fid = new Map(families.map((f, i) => [f.id, `@F${i + 1}@`]));
  const d = new Date();
  const L = ['0 HEAD', '1 SOUR APPROVED_GROUP', '2 NAME The Approved Group Case Manager', '2 VERS 2.0', '1 DEST ANY', `1 DATE ${d.getUTCDate()} ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8', `1 NOTE ${esc(project.name)}`, '1 SUBM @SUB1@', '0 @SUB1@ SUBM', '1 NAME The Approved Group'];
  const childOf = new Map(); const spouseOf = new Map();
  for (const f of families) { for (const c of f.children || []) if (!childOf.has(c)) childOf.set(c, f.id); for (const s of [f.husb, f.wife]) if (s) { if (!spouseOf.has(s)) spouseOf.set(s, []); spouseOf.get(s).push(f.id); } }
  for (const p of persons) {
    L.push(`0 ${pid.get(p.id)} INDI`);
    const birthSurname = p.maiden || p.surname;
    L.push(`1 NAME ${esc(p.given)} /${esc(birthSurname)}/`);
    if (p.given) L.push(`2 GIVN ${esc(p.given)}`);
    if (birthSurname) L.push(`2 SURN ${esc(birthSurname)}`);
    if (p.maiden && p.surname && p.surname !== p.maiden) { L.push(`2 _MARNM ${esc(p.surname)}`); L.push(`1 NAME ${esc(p.given)} /${esc(p.surname)}/`, '2 TYPE married'); }
    if (p.hebrew) { const parts = p.hebrew.trim().split(/\s+/); const sur = parts.length > 1 ? parts.pop() : ''; L.push(`1 NAME ${parts.join(' ')} /${sur}/`, '2 TYPE aka'); }
    for (const vname of String(p.variants || '').split(/[;,]/).map(s => s.trim()).filter(Boolean)) { const parts = vname.split(/\s+/); const sur = parts.length > 1 ? parts.pop() : ''; L.push(`1 NAME ${parts.join(' ')} /${sur}/`, '2 TYPE aka'); }
    if (p.sex) L.push(`1 SEX ${p.sex}`);
    if (p.birth_date || p.birth_place) { L.push('1 BIRT'); if (p.birth_date) L.push(`2 DATE ${toGedcomDate(p.birth_date)}`); if (p.birth_place) L.push(`2 PLAC ${esc(p.birth_place)}`); }
    if (p.death_date || p.death_place || p.living === false) { L.push(p.death_date || p.death_place ? '1 DEAT' : '1 DEAT Y'); if (p.death_date) L.push(`2 DATE ${toGedcomDate(p.death_date)}`); if (p.death_place) L.push(`2 PLAC ${esc(p.death_place)}`); }
    if (p.occupation) L.push(`1 OCCU ${esc(p.occupation)}`);
    if (p.religion) L.push(`1 RELI ${esc(p.religion)}`);
    if (p.citizenship) L.push(`1 NATI ${esc(p.citizenship)}`);
    if (p.residence) L.push('1 RESI', `2 PLAC ${esc(p.residence)}`);
    if (p.emigration) L.push('1 EMIG', `2 NOTE ${esc(p.emigration)}`);
    if (p.naturalization) L.push('1 NATU', `2 NOTE ${esc(p.naturalization)}`);
    if (p.notes) L.push(...longVal(1, 'NOTE', p.notes));
    if (childOf.has(p.id)) L.push(`1 FAMC ${fid.get(childOf.get(p.id))}`);
    for (const f of spouseOf.get(p.id) || []) L.push(`1 FAMS ${fid.get(f)}`);
  }
  for (const f of families) {
    L.push(`0 ${fid.get(f.id)} FAM`);
    if (f.husb && pid.has(f.husb)) L.push(`1 HUSB ${pid.get(f.husb)}`);
    if (f.wife && pid.has(f.wife)) L.push(`1 WIFE ${pid.get(f.wife)}`);
    for (const c of f.children || []) if (pid.has(c)) L.push(`1 CHIL ${pid.get(c)}`);
    if (f.marr_date || f.marr_place) { L.push('1 MARR'); if (f.marr_date) L.push(`2 DATE ${toGedcomDate(f.marr_date)}`); if (f.marr_place) L.push(`2 PLAC ${esc(f.marr_place)}`); }
    if (f.divorced) L.push('1 DIV Y');
  }
  L.push('0 TRLR');
  return L.join('\r\n') + '\r\n';
}
