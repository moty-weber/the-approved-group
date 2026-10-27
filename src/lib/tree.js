import { parseDate, dayNum, yearOf, formatDate } from './dates.js';
import { COUNTRIES, RESIDENCY, DONE } from './rules.js';
import { lookupPlace } from './places.js';

export const rid = (n = 12) => { const a = crypto.getRandomValues(new Uint8Array(n)); const c = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (const b of a) s += c[b % c.length]; return s; };
export const fullName = p => !p ? '' : [p.given, p.surname].filter(Boolean).join(' ') || 'Unnamed';
export const lifeSpan = p => { const b = yearOf(p.birth_date), d = yearOf(p.death_date); const dead = p.living === false || !!p.death_date; if (!b && !d) return dead ? '†' : ''; if (!dead) return `b. ${b}`; return `${b || '?'}–${d || '?'}`; };

export function buildIndex(persons, families) {
  const P = new Map(persons.map(p => [p.id, p]));
  const F = new Map(families.map(f => [f.id, f]));
  const childFam = new Map(), spouseFams = new Map();
  for (const f of families) {
    for (const c of f.children || []) if (P.has(c) && !childFam.has(c)) childFam.set(c, f);
    for (const s of [f.husb, f.wife]) if (s) { if (!spouseFams.has(s)) spouseFams.set(s, []); spouseFams.get(s).push(f); }
  }
  const idx = {
    P, F, childFam, spouseFams,
    parentsFam: id => childFam.get(id) || null,
    parents: id => { const f = childFam.get(id); return f ? [f.husb, f.wife].filter(x => x && P.has(x)) : []; },
    father: id => { const f = childFam.get(id); return f && f.husb ? P.get(f.husb) : null; },
    mother: id => { const f = childFam.get(id); return f && f.wife ? P.get(f.wife) : null; },
    fams: id => spouseFams.get(id) || [],
    spouses: id => (spouseFams.get(id) || []).map(f => f.husb === id ? f.wife : f.husb).filter(x => x && P.has(x)),
    children: id => (spouseFams.get(id) || []).flatMap(f => (f.children || []).filter(c => P.has(c))),
    siblings: id => { const f = childFam.get(id); return f ? (f.children || []).filter(c => c !== id && P.has(c)) : []; },
  };
  return idx;
}

// ---------- editing operations (each returns { upsertPersons, upsertFamilies, deleteFamilies?, deletePersons? }) ----------
const slotFor = sex => sex === 'F' ? 'wife' : 'husb';
const birthSurname = p => (p && (p.maiden || p.surname)) || '';

export function suggestionsFor(idx, kind, anchorId) {
  const a = idx.P.get(anchorId); if (!a) return {};
  const by = yearOf(a.birth_date);
  if (kind === 'parent') return { birth_year: by ? by - 28 : null, place: a.birth_place || '' };
  if (kind === 'child') {
    const f = idx.fams(anchorId)[0];
    return { birth_year: by ? by + 28 : null, place: (f && f.marr_place) || a.residence || a.birth_place || '' };
  }
  if (kind === 'sibling') return { birth_year: by, place: a.birth_place || '' };
  if (kind === 'spouse') return { birth_year: by, place: a.residence || a.birth_place || '' };
  return {};
}

export function opsAddParent(idx, childId, sex, data = {}) {
  const child = idx.P.get(childId);
  const np = { id: rid(), sex, given: '', surname: sex === 'M' ? birthSurname(child) : '', ...data };
  let fam = idx.parentsFam(childId);
  const famOut = fam ? { ...fam, children: [...(fam.children || [])] } : { id: rid(), husb: null, wife: null, children: [childId] };
  let slot = slotFor(sex);
  if (famOut[slot]) { const other = slot === 'husb' ? 'wife' : 'husb'; if (famOut[other]) throw new Error('This person already has two parents'); slot = other; }
  famOut[slot] = np.id;
  if (sex === 'F' && famOut.husb && !np.surname) { const h = idx.P.get(famOut.husb); if (h) np.surname = h.surname || ''; }
  return { upsertPersons: [np], upsertFamilies: [famOut], newId: np.id };
}

export function opsAddChild(idx, parentId, data = {}, famId = null) {
  const parent = idx.P.get(parentId);
  let fam = famId ? idx.F.get(famId) : idx.fams(parentId)[0];
  let famOut;
  if (fam) famOut = { ...fam, children: [...(fam.children || [])] };
  else famOut = { id: rid(), husb: null, wife: null, children: [], [slotFor(parent.sex)]: parentId };
  const father = famOut.husb ? idx.P.get(famOut.husb) : null;
  const np = { id: rid(), given: '', sex: '', surname: father ? (father.surname || '') : (parent.sex === 'M' ? parent.surname || '' : ''), ...data };
  famOut.children.push(np.id);
  return { upsertPersons: [np], upsertFamilies: [famOut], newId: np.id };
}

export function opsAddSpouse(idx, personId, data = {}) {
  const p = idx.P.get(personId);
  const sex = data.sex || (p.sex === 'F' ? 'M' : p.sex === 'M' ? 'F' : '');
  const np = { id: rid(), given: '', sex, surname: '', ...data };
  if (sex === 'F' && !np.surname) np.surname = p.surname || '';
  if (sex === 'M' && !np.surname && p.maiden) np.surname = p.surname || '';
  const slotP = p.sex === 'F' ? 'wife' : p.sex === 'M' ? 'husb' : (sex === 'F' ? 'husb' : 'wife');
  const fam = { id: rid(), husb: null, wife: null, children: [] };
  fam[slotP] = personId; fam[slotP === 'husb' ? 'wife' : 'husb'] = np.id;
  return { upsertPersons: [np], upsertFamilies: [fam], newId: np.id };
}

export function opsAddSibling(idx, personId, data = {}) {
  const p = idx.P.get(personId);
  let fam = idx.parentsFam(personId);
  const famOut = fam ? { ...fam, children: [...(fam.children || [])] } : { id: rid(), husb: null, wife: null, children: [personId] };
  const np = { id: rid(), given: '', sex: '', surname: birthSurname(p), ...data };
  const i = famOut.children.indexOf(personId);
  famOut.children.splice(i >= 0 ? i + 1 : famOut.children.length, 0, np.id);
  return { upsertPersons: [np], upsertFamilies: [famOut], newId: np.id };
}

export function opsDeletePerson(idx, personId) {
  const upsertFamilies = [], deleteFamilies = [];
  const touched = new Set([...(idx.fams(personId)), idx.parentsFam(personId)].filter(Boolean));
  for (const f of touched) {
    const g = { ...f, children: (f.children || []).filter(c => c !== personId) };
    if (g.husb === personId) g.husb = null;
    if (g.wife === personId) g.wife = null;
    const partners = [g.husb, g.wife].filter(Boolean).length;
    if (partners === 0 && g.children.length <= 1) deleteFamilies.push(g.id);
    else if (partners === 1 && g.children.length === 0) deleteFamilies.push(g.id);
    else upsertFamilies.push(g);
  }
  return { deletePersons: [personId], upsertFamilies, deleteFamilies };
}

/** Link two existing people as parent→child (used to fix a tree after GEDCOM import or duplicates). */
export function opsLinkParent(idx, childId, parentId) {
  const parent = idx.P.get(parentId);
  const fam = idx.parentsFam(childId);
  if (fam) {
    const slot = slotFor(parent.sex); const g = { ...fam };
    if (!g[slot]) g[slot] = parentId; else if (!g[slot === 'husb' ? 'wife' : 'husb']) g[slot === 'husb' ? 'wife' : 'husb'] = parentId; else throw new Error('Already has two parents');
    return { upsertFamilies: [g] };
  }
  const pf = idx.fams(parentId)[0];
  if (pf) return { upsertFamilies: [{ ...pf, children: [...(pf.children || []), childId] }] };
  return { upsertFamilies: [{ id: rid(), husb: parent.sex === 'F' ? null : parentId, wife: parent.sex === 'F' ? parentId : null, children: [childId] }] };
}

// ---------- claim line ----------
export function claimLine(idx, applicantId, ancestorId) {
  if (!applicantId || !ancestorId || !idx.P.has(applicantId) || !idx.P.has(ancestorId)) return null;
  const prev = new Map([[applicantId, null]]); const q = [applicantId];
  while (q.length) {
    const x = q.shift(); if (x === ancestorId) break;
    for (const p of idx.parents(x)) if (!prev.has(p)) { prev.set(p, x); q.push(p); }
  }
  if (!prev.has(ancestorId)) return null;
  const path = []; let c = ancestorId; while (c) { path.push(c); c = prev.get(c); }
  return path.reverse(); // applicant … ancestor
}
export function ancestorsOf(idx, id) {
  const out = []; const seen = new Set([id]); const q = [[id, 0]];
  while (q.length) { const [x, d] = q.shift(); for (const p of idx.parents(x)) if (!seen.has(p)) { seen.add(p); out.push({ id: p, depth: d + 1 }); q.push([p, d + 1]); } }
  return out;
}
export function relationLabel(depth, sex) {
  const base = depth === 1 ? (sex === 'F' ? 'Mother' : sex === 'M' ? 'Father' : 'Parent') : depth === 2 ? (sex === 'F' ? 'Grandmother' : sex === 'M' ? 'Grandfather' : 'Grandparent') : null;
  if (base) return base;
  const greats = depth - 2;
  return `${greats > 1 ? greats + '× ' : ''}Great-${sex === 'F' ? 'grandmother' : sex === 'M' ? 'grandfather' : 'grandparent'}`;
}

// ---------- validation & smart checks ----------
const normName = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z\u0590-\u05ff]/g, '');
export function validate(idx) {
  const W = new Map(); const add = (id, level, msg) => { if (!W.has(id)) W.set(id, []); W.get(id).push({ level, msg }); };
  const nowY = new Date().getFullYear();
  for (const p of idx.P.values()) {
    const b = parseDate(p.birth_date), d = parseDate(p.death_date);
    if (p.birth_date && !b) add(p.id, 'info', `Birth date “${p.birth_date}” is not a recognised date format`);
    if (p.death_date && !d) add(p.id, 'info', `Death date “${p.death_date}” is not a recognised date format`);
    if (b && b.y > nowY) add(p.id, 'error', 'Birth date is in the future');
    if (b && d && dayNum(d) < dayNum(b)) add(p.id, 'error', 'Death date is before birth date');
    if (b && !d && p.living !== false && nowY - b.y > 110) add(p.id, 'info', `Born ${b.y} — mark as deceased and add death details`);
    for (const par of idx.parents(p.id)) {
      const pp = idx.P.get(par); const pb = parseDate(pp.birth_date), pd = parseDate(pp.death_date);
      if (b && pb) {
        const age = b.y - pb.y;
        if (dayNum(b) <= dayNum(pb)) add(p.id, 'error', `Born before parent ${pp.given || ''} was born`);
        else if (age < 13) add(p.id, 'error', `Parent ${pp.given || ''} would have been only ${age} at this birth`);
        else if ((pp.sex === 'F' && age > 52) || age > 75) add(p.id, 'warn', `Parent ${pp.given || ''} would have been ${age} at this birth — check`);
      }
      if (b && pd) {
        const gap = dayNum(b) - dayNum(pd);
        if (pp.sex === 'F' && gap > 0 && !b.q && !pd.q) add(p.id, 'error', `Born after mother’s death`);
        else if (gap > 372) add(p.id, 'warn', `Born more than a year after parent ${pp.given || ''} died`);
      }
    }
    for (const f of idx.fams(p.id)) {
      const m = parseDate(f.marr_date);
      if (m && b && m.y - b.y < 13) add(p.id, 'warn', `Married at about ${m.y - b.y}`);
      if (m && d && dayNum(m) > dayNum(d)) add(p.id, 'error', 'Marriage date is after death');
      for (const c of f.children || []) { const cb = parseDate(idx.P.get(c)?.birth_date); if (m && cb && cb.y < m.y - 1) add(c, 'info', `Born before the parents’ recorded marriage (${m.y}) — civil marriage may have been registered later`); }
    }
  }
  // duplicates
  const groups = new Map();
  for (const p of idx.P.values()) {
    const g = normName(p.given); const s = normName(p.maiden || p.surname);
    if (!g || !s) continue;
    const k = g + '|' + s; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p);
  }
  for (const arr of groups.values()) if (arr.length > 1) for (const a of arr) for (const b of arr) {
    if (a.id >= b.id) continue;
    const ya = yearOf(a.birth_date), yb = yearOf(b.birth_date);
    if ((ya && yb && Math.abs(ya - yb) <= 2) || (!ya || !yb)) {
      if (idx.siblings(a.id).includes(b.id) && ya && yb && ya !== yb) continue; // siblings named after each other
      add(a.id, 'warn', `Possible duplicate: ${fullName(b)}${yb ? ' (b. ' + yb + ')' : ''}`); add(b.id, 'warn', `Possible duplicate: ${fullName(a)}${ya ? ' (b. ' + ya + ')' : ''}`);
    }
  }
  return W;
}

export function personCompleteness(idx, p) {
  let s = 0, t = 0; const f = (ok, w) => { t += w; if (ok) s += w; };
  f(p.given, 15); f(p.surname || p.maiden, 15); f(p.sex, 5);
  const b = parseDate(p.birth_date); t += 15; if (b) s += b.d ? 15 : b.m ? 11 : 8;
  f(p.birth_place, 15); f(p.hebrew, 5);
  if (p.living === false || p.death_date) { f(p.death_date, 8); f(p.death_place, 4); }
  if (idx.fams(p.id).length) { const fm = idx.fams(p.id)[0]; f(fm.marr_date, 8); f(fm.marr_place, 5); }
  if (p.sex === 'F' && idx.fams(p.id).length) f(p.maiden, 5);
  return Math.round((s / t) * 100);
}

// ---------- requirements / checklist ----------
export function requirements(project, idx, docs) {
  const data = project.data || {};
  const out = [];
  const docsBy = new Map();
  for (const d of docs) { const k = (d.person_id || '') + '|' + d.doc_type; if (!docsBy.has(k)) docsBy.set(k, []); docsBy.get(k).push(d); }
  const push = (personId, role, roleLabel, req) => {
    const ds = docsBy.get(personId + '|' + req.type) || [];
    const order = ['submitted', 'translated', 'apostilled', 'received', 'not_needed', 'requested', 'needed'];
    const best = ds.slice().sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))[0];
    out.push({ personId, role, roleLabel, ...req, docs: ds, status: best ? best.status : 'needed', done: best ? DONE.has(best.status) : false });
  };
  if (data.case_type === 'residency') {
    if (data.applicant && idx.P.has(data.applicant)) for (const r of RESIDENCY.applicant) push(data.applicant, 'applicant', 'Applicant', r);
    return out;
  }
  const C = COUNTRIES[data.country] || COUNTRIES.OTHER;
  const line = claimLine(idx, data.applicant, data.claim_ancestor);
  if (!line) { if (data.applicant && idx.P.has(data.applicant)) for (const r of C.applicant) if (!r.when || idx.fams(data.applicant).length) push(data.applicant, 'applicant', 'Applicant', r); return out; }
  line.forEach((id, i) => {
    const role = i === 0 ? 'applicant' : i === line.length - 1 ? 'ancestor' : 'link';
    const p = idx.P.get(id);
    const label = i === 0 ? 'Applicant' : relationLabel(i, p.sex) + (role === 'ancestor' ? ' (claim ancestor)' : '');
    const reqs = role === 'applicant' ? C.applicant : role === 'ancestor' ? C.ancestor : C.link;
    for (const r of reqs) {
      if (r.when === 'married' && !idx.fams(id).length && role === 'applicant') continue;
      if (r.type === 'name_change') { const child = line[i - 1] ? idx.P.get(line[i - 1]) : null; const differs = child && p.surname && child.surname && normName(child.maiden || child.surname) !== normName(p.surname) && p.sex === 'M'; if (!differs && !(docsBy.get(id + '|name_change') || []).length) continue; }
      push(id, role, label, r);
    }
  });
  return out;
}
export function progressOf(reqs) {
  const counted = reqs.filter(r => !r.optional || r.docs.length);
  const done = counted.filter(r => r.done).length;
  return { done, total: counted.length, pct: counted.length ? Math.round(done / counted.length * 100) : 0 };
}

/** Suggest claim ancestors: applicant's ancestors whose birth place belonged to a state matching the target country. */
export function suggestAncestors(idx, applicantId, countryCode, statesBetween) {
  const C = COUNTRIES[countryCode]; if (!C || !applicantId) return [];
  return ancestorsOf(idx, applicantId).map(({ id, depth }) => {
    const p = idx.P.get(id); const by = yearOf(p.birth_date);
    const states = statesBetween(p.birth_place, by, by ? by + 40 : null);
    const fit = C.matches.some(m => states.some(s => s.includes(m)));
    return { id, depth, fit, states };
  }).filter(x => x.fit);
}

// ---------- layout (generation rows, couples side by side, children under parents) ----------
export const NODE_W = 188, NODE_H = 92, GAP_X = 22, GAP_Y = 74;
export function layout(idx, rootId) {
  const gen = new Map(); const order = [];
  const ids = [...idx.P.keys()];
  if (!ids.length) return { pos: new Map(), width: 0, height: 0, edges: [], couples: [] };
  const start = rootId && idx.P.has(rootId) ? [rootId, ...ids] : ids;
  let compOffset = 0;
  for (const s of start) {
    if (gen.has(s)) continue;
    gen.set(s, 0); const q = [s];
    while (q.length) {
      const x = q.shift(); order.push(x); const g = gen.get(x);
      for (const p of idx.parents(x)) if (!gen.has(p)) { gen.set(p, g - 1); q.push(p); }
      for (const sp of idx.spouses(x)) if (!gen.has(sp)) { gen.set(sp, g); q.push(sp); }
      for (const c of idx.children(x)) if (!gen.has(c)) { gen.set(c, g + 1); q.push(c); }
      for (const sb of idx.siblings(x)) if (!gen.has(sb)) { gen.set(sb, g); q.push(sb); }
    }
    compOffset++;
  }
  // units: couples chains within a generation
  const unitOf = new Map(); const units = [];
  for (const id of order) {
    if (unitOf.has(id)) continue;
    const g = gen.get(id);
    const chain = [id]; unitOf.set(id, units.length);
    // extend chain with spouses of the same generation (handles multiple marriages)
    let grew = true;
    while (grew) {
      grew = false;
      for (const end of [chain[0], chain[chain.length - 1]]) {
        for (const sp of idx.spouses(end)) {
          if (unitOf.has(sp) || gen.get(sp) !== g) continue;
          if (end === chain[0] && chain.length > 1) chain.unshift(sp); else chain.push(sp);
          unitOf.set(sp, units.length); grew = true;
        }
      }
    }
    // husband left of wife for a simple couple
    if (chain.length === 2) { const a = idx.P.get(chain[0]), b = idx.P.get(chain[1]); if (a.sex === 'F' && b.sex === 'M') chain.reverse(); }
    units.push({ ids: chain, g, x: 0 });
  }
  const gens = [...new Set(units.map(u => u.g))].sort((a, b) => a - b);
  const rows = new Map(gens.map(g => [g, units.filter(u => u.g === g)]));
  const uw = u => u.ids.length * NODE_W + (u.ids.length - 1) * GAP_X;
  const pos = new Map();
  const setPos = () => { for (const u of units) u.ids.forEach((id, i) => pos.set(id, { x: u.x + i * (NODE_W + GAP_X), y: 0 })); };
  // initial packing
  for (const g of gens) { let x = 0; for (const u of rows.get(g)) { u.x = x; x += uw(u) + GAP_X * 2; } }
  setPos();
  const center = id => pos.get(id).x + NODE_W / 2;
  const place = (g, targetOf) => {
    const row = rows.get(g);
    const withT = row.map((u, i) => ({ u, i, t: targetOf(u) }));
    withT.forEach(o => { if (o.t == null) o.t = o.u.x + uw(o.u) / 2; });
    withT.sort((a, b) => a.t - b.t || a.i - b.i);
    let minX = -Infinity;
    for (const o of withT) { const x = Math.max(o.t - uw(o.u) / 2, minX); o.u.x = x; minX = x + uw(o.u) + GAP_X * 2; }
    // shift back left to balance (centre of mass)
    const shift = withT.reduce((s, o) => s + (o.t - (o.u.x + uw(o.u) / 2)), 0) / withT.length;
    if (shift < 0) { /* only move left if it does not create overlap: overlap impossible as all shift equally */ for (const o of withT) o.u.x += shift; }
    rows.set(g, withT.map(o => o.u));
    setPos();
  };
  const parentTarget = u => { const xs = []; for (const id of u.ids) { const ps = idx.parents(id).filter(p => pos.has(p)); if (ps.length) xs.push(ps.reduce((s, p) => s + center(p), 0) / ps.length); } return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
  const childTarget = u => { const xs = []; for (const id of u.ids) for (const c of idx.children(id)) if (pos.has(c) && gen.get(c) === u.g + 1) xs.push(center(c)); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
  for (let it = 0; it < 4; it++) {
    for (const g of gens.slice(1)) place(g, parentTarget);
    for (const g of gens.slice(0, -1).reverse()) place(g, childTarget);
  }
  for (const g of gens.slice(1)) place(g, parentTarget);
  // normalise coordinates
  let minX = Infinity; for (const p of pos.values()) minX = Math.min(minX, p.x);
  const gi = new Map(gens.map((g, i) => [g, i]));
  for (const [id, p] of pos) { p.x -= minX - 20; p.y = gi.get(gen.get(id)) * (NODE_H + GAP_Y) + 20; }
  let width = 0, height = 0; for (const p of pos.values()) { width = Math.max(width, p.x + NODE_W + 20); height = Math.max(height, p.y + NODE_H + 20); }
  // edges
  const edges = [], couples = [];
  for (const f of idx.F.values()) {
    const ps = [f.husb, f.wife].filter(x => x && pos.has(x));
    if (ps.length === 2 && pos.get(ps[0]).y === pos.get(ps[1]).y) {
      const a = pos.get(ps[0]), b = pos.get(ps[1]); const [l, r] = a.x < b.x ? [a, b] : [b, a];
      couples.push({ fam: f.id, x1: l.x + NODE_W, x2: r.x, y: l.y + NODE_H / 2, ids: ps });
    }
    const kids = (f.children || []).filter(c => pos.has(c));
    if (!kids.length) continue;
    let ax, ay;
    if (ps.length === 2 && pos.get(ps[0]).y === pos.get(ps[1]).y) { const a = pos.get(ps[0]), b = pos.get(ps[1]); ax = (Math.min(a.x, b.x) + NODE_W + Math.max(a.x, b.x)) / 2; ay = a.y + NODE_H / 2; }
    else if (ps.length) { const a = pos.get(ps[0]); ax = a.x + NODE_W / 2; ay = a.y + NODE_H; }
    else { // unknown parents: sibling bar
      const xs = kids.map(c => pos.get(c).x + NODE_W / 2); const y = pos.get(kids[0]).y - GAP_Y / 2;
      edges.push({ fam: f.id, d: `M${Math.min(...xs)},${y} H${Math.max(...xs)}`, parents: [], kids });
      for (const c of kids) { const p = pos.get(c); edges.push({ fam: f.id, d: `M${p.x + NODE_W / 2},${y} V${p.y}`, parents: [], kids: [c] }); }
      continue;
    }
    for (const c of kids) {
      const p = pos.get(c); const cx = p.x + NODE_W / 2; const midY = p.y - GAP_Y / 2;
      edges.push({ fam: f.id, d: `M${ax},${ay} V${midY} H${cx} V${p.y}`, parents: ps, kids: [c] });
    }
  }
  return { pos, width, height, edges, couples, gen };
}

export function placeHint(text) { const e = lookupPlace(text); return e ? e.now : ''; }
export { formatDate };
