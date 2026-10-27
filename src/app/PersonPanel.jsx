import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { normalizeDate, toHebrew, fromHebrew, yearOf, parseDate } from '../lib/dates.js';
import { placeInfo, placeSuggestions } from '../lib/places.js';
import { fullName, lifeSpan, suggestionsFor, personCompleteness } from '../lib/tree.js';
import { searchLinks, placeLinks } from '../lib/search.js';
import { DocRow, AddDoc, ReqRow } from './Docs.jsx';

function PlaceInput({ id, value, onChange, year, label }) {
  const [open, setOpen] = useState(false);
  const sugg = useMemo(() => open ? placeSuggestions(value) : [], [value, open]);
  const info = placeInfo(value, year);
  return (
    <div className="field ac">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value || ''} onChange={e => { onChange(e.target.value); setOpen(true); }} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Town, country" autoComplete="off" />
      {open && sugg.length > 0 && <div className="ac-list">{sugg.map(s => <button type="button" key={s.value} onMouseDown={e => { e.preventDefault(); onChange(s.value); setOpen(false); }}>{s.label}</button>)}</div>}
      {info && <div className="hint ok" title={info.timeline.join('\n')}>📍 {info.label}{info.region ? ` · ${info.region}` : ''}{info.then ? <> · <b>in {info.year}: {info.then}</b></> : ''}</div>}
      {info && value.trim() !== info.label && <div className="sugg"><button type="button" className="chip btnlike" onClick={() => onChange(info.label)}>Use standard form: {info.label}</button></div>}
    </div>
  );
}
function DateInput({ id, value, onChange, label, showHebrew }) {
  const [heb, setHeb] = useState('');
  const p = value ? parseDate(value) : null;
  const h = showHebrew && toHebrew(value);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value || ''} onChange={e => onChange(e.target.value)} onBlur={() => value && onChange(normalizeDate(value))} placeholder="DD/MM/YYYY, 1921, abt 1890…" />
      {value && !p && <div className="hint warn">Not a recognised date — try DD/MM/YYYY</div>}
      {h && <div className="hint" dir="auto">✡ {h.en} · <span dir="rtl">{h.he}</span> <span className="muted">(if born after sunset: next day)</span></div>}
      {showHebrew && <div className="row" style={{ marginTop: 4 }}>
        <input className="input" style={{ minHeight: 34, padding: '4px 8px', fontSize: '.85em', flex: 1 }} placeholder="…or Hebrew date: 12 Adar 5681 / י״ב אדר תרפ״א" value={heb} onChange={e => setHeb(e.target.value)} dir="auto" aria-label={label + ' as Hebrew date'} />
        <button type="button" className="btn sm" onClick={() => { const g = fromHebrew(heb); if (g) { onChange(g); setHeb(''); } else alert('Could not read that Hebrew date'); }}>Convert</button>
      </div>}
    </div>
  );
}

export default function PersonPanel({ ctx, personId, onClose, onSelect, onQuick, reqs, warnings, readOnly }) {
  const { idx, data, apply } = ctx;
  const person = idx.P.get(personId);
  const [tab, setTab] = useState('details');
  const [draft, setDraft] = useState(person);
  const [famDrafts, setFamDrafts] = useState(() => Object.fromEntries(idx.fams(personId).map(f => [f.id, f])));
  const dirty = useRef(false); const famDirty = useRef(new Set());
  useEffect(() => { setDraft(idx.P.get(personId)); setFamDrafts(Object.fromEntries(idx.fams(personId).map(f => [f.id, f]))); dirty.current = false; famDirty.current = new Set(); }, [personId]);
  // pick up structural changes (new spouse family) without losing edits
  useEffect(() => { setFamDrafts(fd => { const o = { ...fd }; for (const f of idx.fams(personId)) if (!o[f.id] || !famDirty.current.has(f.id)) o[f.id] = f; return o; }); }, [idx]);
  const flush = () => {
    const ops = {};
    if (dirty.current && draft) { ops.upsertPersons = [draft]; dirty.current = false; }
    if (famDirty.current.size) { ops.upsertFamilies = [...famDirty.current].map(id => famDrafts[id]).filter(Boolean); famDirty.current = new Set(); }
    if (ops.upsertPersons || ops.upsertFamilies) apply(ops);
  };
  const flushRef = useRef(flush); flushRef.current = flush;
  useEffect(() => { const t = setTimeout(() => flushRef.current(), 700); return () => clearTimeout(t); }, [draft, famDrafts]);
  useEffect(() => () => flushRef.current(), [personId]);
  if (!person || !draft) return null;
  const set = (k, v) => { dirty.current = true; setDraft(d => ({ ...d, [k]: v })); };
  const setFam = (fid, k, v) => { famDirty.current.add(fid); setFamDrafts(d => ({ ...d, [fid]: { ...d[fid], [k]: v } })); };
  const by = yearOf(draft.birth_date);
  const w = warnings.get(personId) || [];
  const myReqs = reqs.filter(r => r.personId === personId);
  const myDocs = data.documents.filter(d => d.person_id === personId && !myReqs.some(r => r.docs.includes(d)));
  const parentSugg = (() => {
    // smart suggestions from relatives for empty fields
    const out = [];
    const par = idx.parents(personId).map(id => idx.P.get(id));
    const kids = idx.children(personId).map(id => idx.P.get(id));
    const f = idx.parentsFam(personId);
    if (!draft.surname && par.find(p => p.sex === 'M')?.surname) out.push(['surname', par.find(p => p.sex === 'M').surname, 'Surname from father']);
    if (!draft.birth_place && f && f.marr_place) out.push(['birth_place', f.marr_place, 'Where the parents married']);
    if (!draft.birth_place && par[0]?.residence) out.push(['birth_place', par[0].residence, 'Parent\u2019s residence']);
    if (!draft.birth_place && !par.length && kids[0]?.birth_place) out.push(['birth_place', kids[0].birth_place, 'Child\u2019s birthplace (often same town)']);
    if (!draft.sex && /^(mrs|miss|ms)\b/i.test(draft.given || '')) out.push(['sex', 'F', 'Female']);
    if (!draft.birth_date && kids.length) { const ky = kids.map(k => yearOf(k.birth_date)).filter(Boolean); if (ky.length) out.push(['birth_date', `abt ${Math.min(...ky) - 27}`, 'Estimated from children']); }
    if (!draft.birth_date && par.length) { const py = par.map(p => yearOf(p.birth_date)).filter(Boolean); if (py.length) out.push(['birth_date', `abt ${Math.max(...py) + 27}`, 'Estimated from parents']); }
    if (!draft.citizenship && draft.birth_place) { const i = placeInfo(draft.birth_place, by); if (i && i.then) out.push(['citizenship', i.then.replace(/ \(.*\)$/, ''), `State at birth (${by})`]); }
    if (draft.living !== false && by && new Date().getFullYear() - by > 105) out.push(['living', false, 'Mark as deceased']);
    return out;
  })();
  const pct = personCompleteness(idx, draft);
  const T = (k, l) => <button className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>;
  const rel = (ids, label) => ids.length ? <div style={{ marginBottom: 12 }}><div className="lbl">{label}</div>{ids.map(id => { const p = idx.P.get(id); return <button key={id} className="btn sm" style={{ margin: '4px 6px 0 0' }} onClick={() => { flush(); onSelect(id); }}>{fullName(p)} <span className="muted">{lifeSpan(p)}</span></button>; })}</div> : null;
  return (
    <div className="panel" role="dialog" aria-label={`Person: ${fullName(draft)}`}>
      <div className="panel-head">
        <div className="row">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2>{fullName(draft)}</h2>
            {draft.hebrew && <div dir="rtl" style={{ textAlign: 'left', color: '#6b5a1a', fontSize: '.9em' }}>{draft.hebrew}</div>}
            <div className="hint">{lifeSpan(draft) || 'New person'} · {pct}% complete</div>
          </div>
          <button className="btn ghost" aria-label="Close" onClick={() => { flush(); onClose(); }}><Icon name="x" /></button>
        </div>
        <div className="bar" style={{ margin: '8px 0 0' }}><i style={{ width: pct + '%' }} /></div>
        <div className="tabs" style={{ padding: 0, borderBottom: 0 }}>{T('details', 'Details')}{T('docs', `Documents${myReqs.length || myDocs.length ? ` (${myReqs.filter(r => r.done).length + myDocs.length}/${myReqs.length + myDocs.length})` : ''}`)}{T('family', 'Family')}{T('research', 'Research')}</div>
      </div>
      <div className="panel-body">
        {w.length > 0 && <ul className="warn-list">{w.map((x, i) => <li key={i} className={x.level}>{x.level === 'error' ? '⚠ ' : ''}{x.msg}</li>)}</ul>}
        {tab === 'details' && <>
          {parentSugg.length > 0 && <div style={{ marginBottom: 12 }}><div className="lbl">Smart suggestions</div><div className="sugg">{parentSugg.map(([k, v, why], i) => <button key={i} className="chip btnlike" onClick={() => set(k, v)} title={why}>{k === 'living' ? 'Deceased' : `${v}`} <span className="muted" style={{ fontWeight: 400 }}>· {why}</span></button>)}</div></div>}
          <div className="grid2">
            <div className="field"><label htmlFor="p-given">Given name(s)</label><input id="p-given" value={draft.given || ''} onChange={e => set('given', e.target.value)} placeholder={draft.label || ''} autoFocus={!draft.given} /></div>
            <div className="field"><label htmlFor="p-sur">Surname</label><input id="p-sur" value={draft.surname || ''} onChange={e => set('surname', e.target.value)} /></div>
          </div>
          <div className="grid2">
            <div className="field"><label htmlFor="p-sex">Sex</label><select id="p-sex" value={draft.sex || ''} onChange={e => set('sex', e.target.value)}><option value="">Unknown</option><option value="M">Male</option><option value="F">Female</option></select></div>
            <div className="field"><label htmlFor="p-maiden">Maiden / birth surname</label><input id="p-maiden" value={draft.maiden || ''} onChange={e => set('maiden', e.target.value)} placeholder={draft.sex === 'F' ? 'Important for records' : ''} /></div>
          </div>
          <div className="field"><label htmlFor="p-heb">Hebrew / Yiddish name</label><input id="p-heb" dir="rtl" value={draft.hebrew || ''} onChange={e => set('hebrew', e.target.value)} placeholder="e.g. יעקב בן אברהם" /></div>
          <div className="field"><label htmlFor="p-var">Name variants / spellings in records</label><input id="p-var" value={draft.variants || ''} onChange={e => set('variants', e.target.value)} placeholder="e.g. Jakob Weisz; Jacob Weiss" /></div>
          <DateInput id="p-bd" label="Birth date" value={draft.birth_date} onChange={v => set('birth_date', v)} showHebrew />
          <PlaceInput id="p-bp" label="Birth place" value={draft.birth_place} onChange={v => set('birth_place', v)} year={by} />
          <div className="field"><label className="row" style={{ textTransform: 'none', fontSize: '.9em', letterSpacing: 0, color: 'var(--ink)', fontWeight: 500 }}><input type="checkbox" checked={draft.living === false || !!draft.death_date} onChange={e => set('living', e.target.checked ? false : true)} style={{ width: 18, height: 18, minHeight: 0 }} /> Deceased</label></div>
          {(draft.living === false || draft.death_date) && <>
            <DateInput id="p-dd" label="Death date" value={draft.death_date} onChange={v => set('death_date', v)} showHebrew />
            <PlaceInput id="p-dp" label="Death place" value={draft.death_place} onChange={v => set('death_place', v)} year={yearOf(draft.death_date)} />
          </>}
          <div className="grid2">
            <div className="field"><label htmlFor="p-cit">Citizenship(s)</label><input id="p-cit" value={draft.citizenship || ''} onChange={e => set('citizenship', e.target.value)} placeholder="e.g. Hungarian, then US (1923)" /></div>
            <div className="field"><label htmlFor="p-rel">Religion (in records)</label><input id="p-rel" value={draft.religion || ''} onChange={e => set('religion', e.target.value)} placeholder="e.g. Israelite / mosaisch" /></div>
          </div>
          <div className="grid2">
            <div className="field"><label htmlFor="p-res">Residence</label><input id="p-res" value={draft.residence || ''} onChange={e => set('residence', e.target.value)} /></div>
            <div className="field"><label htmlFor="p-occ">Occupation</label><input id="p-occ" value={draft.occupation || ''} onChange={e => set('occupation', e.target.value)} /></div>
          </div>
          <div className="grid2">
            <div className="field"><label htmlFor="p-emi">Emigration (when / where to)</label><input id="p-emi" value={draft.emigration || ''} onChange={e => set('emigration', e.target.value)} placeholder="1938, to New York" /></div>
            <div className="field"><label htmlFor="p-nat">Naturalization (date / country)</label><input id="p-nat" value={draft.naturalization || ''} onChange={e => set('naturalization', e.target.value)} placeholder="1944, USA" /></div>
          </div>
          {idx.fams(personId).map(f => { const fd = famDrafts[f.id] || f; const sp = idx.P.get(f.husb === personId ? f.wife : f.husb); return (
            <div key={f.id} className="card" style={{ padding: 12, marginBottom: 12, boxShadow: 'none' }}>
              <div className="lbl" style={{ marginBottom: 6 }}>Marriage{sp ? ` — ${fullName(sp)}` : ''}</div>
              <DateInput id={'m-d-' + f.id} label="Marriage date" value={fd.marr_date} onChange={v => setFam(f.id, 'marr_date', v)} />
              <PlaceInput id={'m-p-' + f.id} label="Marriage place" value={fd.marr_place} onChange={v => setFam(f.id, 'marr_place', v)} year={yearOf(fd.marr_date)} />
              <label className="row" style={{ fontSize: '.85em' }}><input type="checkbox" checked={!!fd.divorced} onChange={e => setFam(f.id, 'divorced', e.target.checked)} /> Divorced</label>
            </div>); })}
          <div className="field"><label htmlFor="p-notes">Notes</label><textarea id="p-notes" value={draft.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Sources, archive references, open questions…" /></div>
        </>}
        {tab === 'docs' && <>
          {myReqs.length > 0 && <><div className="lbl">Required for this case</div>{myReqs.map((r, i) => <ReqRow key={r.type + i} r={r} onCreate={ctx.createDoc} onUpdate={ctx.updateDoc} onUpload={ctx.uploadFile} fileUrl={ctx.fileUrl} />)}</>}
          {myReqs.length === 0 && <div className="hint" style={{ marginBottom: 8 }}>This person is not on the claim line, so no documents are required by the rules. You can still attach any document.</div>}
          {myDocs.length > 0 && <><div className="lbl" style={{ marginTop: 16 }}>Other documents</div>{myDocs.map(d => <DocRow key={d.id} doc={d} P={idx.P} onUpdate={ctx.updateDoc} onUpload={ctx.uploadFile} onDelete={readOnly ? null : ctx.deleteDoc} fileUrl={ctx.fileUrl} readOnly={readOnly} />)}</>}
          <div className="lbl" style={{ marginTop: 16 }}>Attach a document</div>
          <AddDoc personId={personId} onCreate={ctx.createDoc} onUpload={ctx.uploadFile} />
          <p className="hint">PDF or photos, up to 25 MB each. Phone camera works too.</p>
        </>}
        {tab === 'family' && <>
          {rel(idx.parents(personId), 'Parents')}
          {rel(idx.spouses(personId), 'Spouses')}
          {rel(idx.children(personId), 'Children')}
          {rel(idx.siblings(personId), 'Siblings')}
          {!readOnly && <><div className="lbl">Add a relative</div>
            <div className="row" style={{ marginTop: 6 }}>
              {[['father', 'Father'], ['mother', 'Mother'], ['spouse', 'Spouse'], ['child', 'Child'], ['sibling', 'Sibling']].map(([k, l]) => <button key={k} className="btn sm" onClick={() => { flush(); onQuick(k, personId); }}><Icon name="plus" size={14} /> {l}</button>)}
            </div>
            <div className="lbl" style={{ marginTop: 22 }}>Danger zone</div>
            <button className="btn sm danger" style={{ marginTop: 6 }} onClick={() => { if (confirm(`Delete ${fullName(draft)} from this tree? Documents stay in the project.`)) { dirty.current = false; ctx.removePerson(personId); onClose(); } }}><Icon name="trash" size={14} /> Delete person</button>
          </>}
        </>}
        {tab === 'research' && <>
          <p className="hint" style={{ marginTop: 0 }}>Opens each site’s own search, pre-filled with this person. MyHeritage, Ancestry and Geni show full results only with your login there. Found something? Export a GEDCOM from that site and import it in the Case tab.</p>
          <div className="links">{searchLinks(draft).map(l => <a key={l.site} className="btn sm" href={l.url} target="_blank" rel="noopener" title={l.note || ''}><Icon name="search" size={14} /> {l.site}</a>)}</div>
          {draft.birth_place && <><div className="lbl" style={{ marginTop: 16 }}>Birth place</div><div className="links" style={{ marginTop: 6 }}>{placeLinks(draft.birth_place).map(l => <a key={l.site} className="btn sm" href={l.url} target="_blank" rel="noopener"><Icon name="globe" size={14} /> {l.site}</a>)}</div>
            {placeInfo(draft.birth_place) && <div className="card" style={{ padding: 12, marginTop: 12, boxShadow: 'none' }}><div className="lbl">Which state was it in?</div><ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '.86em' }}>{placeInfo(draft.birth_place).timeline.map(t => <li key={t}>{t}</li>)}</ul><div className="hint">General guidance; borders moved within these years.</div></div>}</>}
        </>}
      </div>
    </div>
  );
}
