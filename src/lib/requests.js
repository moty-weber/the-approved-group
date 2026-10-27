import { rid } from './tree.js';

// The public request form keeps the original family-tree.html layout: a full pedigree.
// L1 = applicant; L2_1 + L2_2 = the applicant's two parents; L3_1+L3_2 = parents of L2_1, L3_3+L3_4 = parents of L2_2;
// L4_1+2 → L3_1, L4_3+4 → L3_2, L4_5+6 → L3_3, L4_7+8 → L3_4.
export const REQUEST_BOXES = [
  ['L1', 'Applicant'],
  ['L2_1', 'Parent (EU side)'], ['L2_2', 'Other parent'],
  ['L3_1', 'Grandparent'], ['L3_2', 'Grandparent'], ['L3_3', 'Grandparent'], ['L3_4', 'Grandparent'],
  ['L4_1', 'Great-grandparent'], ['L4_2', 'Great-grandparent'], ['L4_3', 'Great-grandparent'], ['L4_4', 'Great-grandparent'],
  ['L4_5', 'Great-grandparent'], ['L4_6', 'Great-grandparent'], ['L4_7', 'Great-grandparent'], ['L4_8', 'Great-grandparent'],
];
const CHILD_OF = { L2_1: 'L1', L2_2: 'L1', L3_1: 'L2_1', L3_2: 'L2_1', L3_3: 'L2_2', L3_4: 'L2_2', L4_1: 'L3_1', L4_2: 'L3_1', L4_3: 'L3_2', L4_4: 'L3_2', L4_5: 'L3_3', L4_6: 'L3_3', L4_7: 'L3_4', L4_8: 'L3_4' };
const COUPLES = [['L2_1', 'L2_2'], ['L3_1', 'L3_2'], ['L3_3', 'L3_4'], ['L4_1', 'L4_2'], ['L4_3', 'L4_4'], ['L4_5', 'L4_6'], ['L4_7', 'L4_8']];

export const boxFilled = (tree, k) => ['name', 'dob', 'pob', 'dom'].some(f => tree[`${k}_${f}`]);
export const filledCount = tree => REQUEST_BOXES.filter(([k]) => boxFilled(tree, k)).length;

function splitName(full) {
  const w = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (w.length <= 1) return { given: w[0] || '', surname: '' };
  return { given: w.slice(0, -1).join(' '), surname: w[w.length - 1] };
}

/** Turns a website request into tree ops for a new project (persons + families, with dates/places/marriages pre-filled). */
export function buildFromRequest(r) {
  const tree = (r.data && r.data.tree) || {};
  const ids = {}; const persons = []; const families = [];
  const include = k => k === 'L1' || boxFilled(tree, k);
  for (const [k] of REQUEST_BOXES) {
    if (!include(k)) continue;
    const nm = splitName(tree[`${k}_name`] || (k === 'L1' ? r.name : ''));
    const p = { id: rid(), ...nm };
    const sx = tree[`${k}_sex`]; if (sx === 'M' || sx === 'F') p.sex = sx;
    if (tree[`${k}_dob`]) p.birth_date = tree[`${k}_dob`];
    if (tree[`${k}_pob`]) p.birth_place = tree[`${k}_pob`];
    if (k === 'L1') { p.label = 'Applicant'; if (tree.L1_dom) p.notes = `Date of marriage (from the website request): ${tree.L1_dom}`; }
    ids[k] = p.id; persons.push(p);
  }
  const byId = Object.fromEntries(persons.map(p => [p.id, p]));
  for (const [a, b] of COUPLES) {
    if (!ids[a] && !ids[b]) continue;
    let h = ids[a] || null, w = ids[b] || null;
    const pa = byId[h], pb = byId[w];
    if ((pa && pa.sex === 'F') || (pb && pb.sex === 'M')) [h, w] = [w, h];
    const f = { id: rid(), husb: h, wife: w, children: [] };
    const dom = tree[`${a}_dom`] || tree[`${b}_dom`]; if (dom) f.marr_date = dom;
    const child = ids[CHILD_OF[a]];
    if (child) { f.children.push(child); byId[child].famc = f.id; }
    if (byId[h] && !byId[h].sex && byId[w]) byId[h].sex = 'M';
    if (byId[w] && !byId[w].sex && byId[h]) byId[w].sex = 'F';
    families.push(f);
  }
  return { persons, families, applicant: ids.L1 };
}
