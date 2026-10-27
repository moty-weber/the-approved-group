import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, formatDate, toHebrew, fromHebrew, parseHebrewDate, gematria } from '../src/lib/dates.js';
import { placeInfo, lookupPlace } from '../src/lib/places.js';
import { buildIndex, opsAddParent, opsAddChild, opsAddSpouse, opsAddSibling, claimLine, validate, requirements, layout, opsDeletePerson } from '../src/lib/tree.js';
import { importGedcom, exportGedcom } from '../src/lib/gedcom.js';

test('dates parse day-first and fuzzy', () => {
  assert.deepEqual(parseDate('12/03/1921'), { y: 1921, m: 3, d: 12, q: '' });
  assert.equal(formatDate(parseDate('abt 1890')), 'abt. 1890');
  assert.equal(formatDate(parseDate('12 MAR 1921')), '12 Mar 1921');
  assert.equal(formatDate(parseDate('1921-03-12')), '12 Mar 1921');
  assert.equal(formatDate(parseDate('March 12, 1921')), '12 Mar 1921');
  assert.equal(parseDate('31/02/1900'), null);
});
test('hebrew dates', () => {
  const h = toHebrew('1 Jan 2000');
  assert.match(h.en, /23 Tevet 5760/);
  assert.equal(fromHebrew('23 Tevet 5760'), '1 Jan 2000');
  assert.equal(fromHebrew('כ״ג טבת תש״ס'), '1 Jan 2000');
  assert.equal(gematria(15), 'ט״ו');
  assert.ok(parseHebrewDate('15 Adar II 5784'));
  assert.equal(fromHebrew('15 Adar II 5784'), '25 Mar 2024');
  assert.equal(fromHebrew('14 Adar I 5784'), '23 Feb 2024');
});
test('places', () => {
  const m = placeInfo('Munkacs, Hungary', 1925);
  assert.equal(m.now, 'Ukraine'); assert.equal(m.then, 'Czechoslovakia');
  assert.equal(placeInfo('Mukachevo', 1910).then, 'Kingdom of Hungary (Austria-Hungary)');
  assert.equal(placeInfo('Sighet', 1942).then, 'Hungary');
  assert.equal(placeInfo('Lemberg', 1930).then, 'Poland');
  assert.equal(lookupPlace('Budapest').now, 'Hungary');
  assert.equal(lookupPlace('nowhere-town'), null);
});
function sample() {
  let persons = [{ id: 'a', given: 'Moshe', surname: 'Weiss', sex: 'M', birth_date: '1990' }], families = [];
  const apply = ops => {
    for (const p of ops.upsertPersons || []) { persons = persons.filter(x => x.id !== p.id).concat(p); }
    for (const f of ops.upsertFamilies || []) { families = families.filter(x => x.id !== f.id).concat(f); }
    persons = persons.filter(p => !(ops.deletePersons || []).includes(p.id));
    families = families.filter(f => !(ops.deleteFamilies || []).includes(f.id));
    return buildIndex(persons, families);
  };
  let idx = buildIndex(persons, families);
  const f1 = opsAddParent(idx, 'a', 'M', { given: 'Yaakov', birth_date: '1960' }); idx = apply(f1);
  const m1 = opsAddParent(idx, 'a', 'F', { given: 'Sara', maiden: 'Klein', birth_date: '1962' }); idx = apply(m1);
  const g1 = opsAddParent(idx, f1.newId, 'M', { given: 'Avraham', birth_date: '1930', birth_place: 'Munkács' }); idx = apply(g1);
  const gg = opsAddParent(idx, g1.newId, 'M', { given: 'Yitzchak', birth_date: '1900', birth_place: 'Munkacs' }); idx = apply(gg);
  const sib = opsAddSibling(idx, 'a', { given: 'Rivka', sex: 'F' }); idx = apply(sib);
  const sp = opsAddSpouse(idx, 'a', { given: 'Chana' }); idx = apply(sp);
  const ch = opsAddChild(idx, 'a', { given: 'Dovid' }); idx = apply(ch);
  return { idx, persons: () => persons, families: () => families, ids: { f1: f1.newId, m1: m1.newId, g1: g1.newId, gg: gg.newId, sib: sib.newId, sp: sp.newId, ch: ch.newId }, apply };
}
test('tree operations + smart prefill', () => {
  const { idx, ids } = sample();
  assert.equal(idx.P.get(ids.f1).surname, 'Weiss');
  assert.equal(idx.P.get(ids.gg).surname, 'Weiss');
  assert.equal(idx.P.get(ids.m1).surname, 'Weiss');
  assert.equal(idx.P.get(ids.sp).sex, 'F');
  assert.equal(idx.P.get(ids.ch).surname, 'Weiss');
  assert.deepEqual(idx.siblings('a'), [ids.sib]);
  assert.deepEqual(claimLine(idx, 'a', ids.gg), ['a', ids.f1, ids.g1, ids.gg]);
  const L = layout(idx, 'a');
  assert.equal(L.pos.size, idx.P.size);
  const ys = new Set([...L.pos.values()].map(p => p.y)); assert.equal(ys.size, 5);
  // no overlaps in a row
  const byRow = {}; for (const p of L.pos.values()) (byRow[p.y] ||= []).push(p.x);
  for (const xs of Object.values(byRow)) { xs.sort((a, b) => a - b); for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 188); }
});
test('validation warnings', () => {
  const { idx, ids, apply } = sample();
  idx.P.get(ids.ch).birth_date = '1950';
  const W = validate(idx);
  assert.ok((W.get(ids.ch) || []).some(w => /before parent/.test(w.msg)));
});
test('requirements follow country + claim line', () => {
  const { idx, ids } = sample();
  const reqs = requirements({ data: { country: 'HU', applicant: 'a', claim_ancestor: ids.gg } }, idx, [{ person_id: ids.gg, doc_type: 'birth_cert', status: 'received' }]);
  assert.ok(reqs.length > 8);
  assert.ok(reqs.find(r => r.personId === ids.gg && r.type === 'birth_cert').done);
});
test('gedcom round trip', () => {
  const { idx, persons, families } = sample();
  persons().find(p => p.id === 'a').hebrew = 'משה ווייס';
  const ged = exportGedcom({ name: 'Test' }, persons(), families());
  assert.match(ged, /0 HEAD/); assert.match(ged, /1 CHAR UTF-8/);
  const back = importGedcom(ged);
  assert.equal(back.persons.length, persons().length);
  assert.equal(back.families.length, families().length);
  const m = back.persons.find(p => p.given === 'Moshe');
  assert.equal(m.hebrew, 'משה ווייס');
  const sara = back.persons.find(p => p.given === 'Sara');
  assert.equal(sara.maiden, 'Klein'); assert.equal(sara.surname, 'Weiss');
  const idx2 = buildIndex(back.persons, back.families);
  assert.equal(idx2.parents(m.id).length, 2);
});
test('delete person cleans families', () => {
  const { idx, ids, apply } = sample();
  const ops = opsDeletePerson(idx, ids.ch);
  const idx2 = apply(ops);
  assert.equal(idx2.children('a').length, 0);
});
