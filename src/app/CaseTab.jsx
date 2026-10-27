import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { COUNTRIES, PROJECT_STATUSES, DISCLAIMER } from '../lib/rules.js';
import { fullName, lifeSpan, ancestorsOf, relationLabel, suggestAncestors, buildIndex } from '../lib/tree.js';
import { statesBetween } from '../lib/places.js';
import { importGedcom, exportGedcom } from '../lib/gedcom.js';

export function download(name, text, type = 'text/plain') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
export const safeName = s => String(s || 'project').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'project';

export default function CaseTab({ ctx, toast, line, onSelect }) {
  const { data, idx } = ctx;
  const p = data.project; const d = p.data || {};
  const nav = useNavigate();
  const [name, setName] = useState(p.name);
  const [info, setInfo] = useState({ client_name: d.client_name || '', client_email: d.client_email || '', client_phone: d.client_phone || '', internal_notes: d.internal_notes || '', deadline: d.deadline || '' });
  const fileRef = useRef(null);
  const [imp, setImp] = useState(null);
  const setData = (patch, log) => ctx.updateProject({ data: { ...d, ...patch } }, log);
  const people = [...idx.P.values()].sort((a, b) => fullName(a).localeCompare(fullName(b)));
  const ancestors = useMemo(() => d.applicant ? ancestorsOf(idx, d.applicant) : [], [idx, d.applicant]);
  const sugg = useMemo(() => suggestAncestors(idx, d.applicant, d.country, statesBetween), [idx, d.applicant, d.country]);
  const clientUrl = p.client_token ? `${location.origin}/c/${p.client_token}` : '';

  const onImport = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const text = await f.text();
    const res = importGedcom(text);
    setImp({ name: f.name, ...res });
  };
  const doImport = async (replace) => {
    const ops = { upsertPersons: imp.persons, upsertFamilies: imp.families };
    if (replace) { ops.deletePersons = [...idx.P.keys()]; ops.deleteFamilies = [...idx.F.keys()]; }
    await ctx.apply(ops, `GEDCOM import: ${imp.persons.length} people from ${imp.name}${replace ? ' (replaced tree)' : ''}`);
    if (replace) await setData({ applicant: null, claim_ancestor: null });
    toast(`Imported ${imp.persons.length} people`); setImp(null);
  };
  const exportIt = () => download(`${safeName(p.name)}.ged`, exportGedcom(p, data.persons, data.families), 'text/plain;charset=utf-8');
  const dup = async () => { const r = await api.post(`/api/projects/${p.id}/duplicate`); toast('Duplicated'); nav(`/app/p/${r.id}`); };
  const del = async () => { if (!confirm('Delete this project with all its people and documents? This cannot be undone.')) return; try { await api.del(`/api/projects/${p.id}`); nav('/app'); } catch (e) { toast(e.message); } };
  const setClient = async (enabled, regenerate) => { const r = await api.post(`/api/projects/${p.id}/client-link`, { enabled, regenerate }); await ctx.load(); toast(enabled ? 'Client link is on' : 'Client link is off'); return r; };

  return (
    <div className="app-main" style={{ maxWidth: 860 }}>
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Case</h3>
        <div className="grid2">
          <div className="field"><label htmlFor="c-name">Project name</label><input id="c-name" value={name} onChange={e => setName(e.target.value)} onBlur={() => name !== p.name && ctx.updateProject({ name }, 'Renamed project')} /></div>
          <div className="field"><label htmlFor="c-status">Status</label><select id="c-status" value={p.status} onChange={e => ctx.updateProject({ status: e.target.value })}>{PROJECT_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        </div>
        <div className="grid3">
          <div className="field"><label htmlFor="c-cn">Client name</label><input id="c-cn" value={info.client_name} onChange={e => setInfo({ ...info, client_name: e.target.value })} onBlur={() => setData(info)} /></div>
          <div className="field"><label htmlFor="c-ce">Client email</label><input id="c-ce" type="email" value={info.client_email} onChange={e => setInfo({ ...info, client_email: e.target.value })} onBlur={() => setData(info)} /></div>
          <div className="field"><label htmlFor="c-cp">Client phone</label><input id="c-cp" type="tel" value={info.client_phone} onChange={e => setInfo({ ...info, client_phone: e.target.value })} onBlur={() => setData(info)} /></div>
        </div>
        <div className="grid2">
          <div className="field"><label htmlFor="c-type">Case type</label><select id="c-type" value={d.case_type || 'citizenship'} onChange={e => setData({ case_type: e.target.value })}><option value="citizenship">Citizenship by descent</option><option value="residency">Belgian residency / family reunification</option></select></div>
          <div className="field"><label htmlFor="c-dl">Deadline / next step date</label><input id="c-dl" type="date" value={info.deadline} onChange={e => { const v = { ...info, deadline: e.target.value }; setInfo(v); setData(v); }} /></div>
        </div>
        <div className="field"><label htmlFor="c-notes">Internal notes (staff only)</label><textarea id="c-notes" value={info.internal_notes} onChange={e => setInfo({ ...info, internal_notes: e.target.value })} onBlur={() => setData(info)} /></div>
      </div>

      {d.case_type !== 'residency' && <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Claim — who, through whom, which country</h3>
        <div className="field"><label htmlFor="c-app">Applicant</label><select id="c-app" value={d.applicant || ''} onChange={e => setData({ applicant: e.target.value || null }, 'Applicant set')}><option value="">— choose —</option>{people.map(x => <option key={x.id} value={x.id}>{fullName(x)} {lifeSpan(x)}</option>)}</select></div>
        <div className="field"><label htmlFor="c-cty">Target country</label><select id="c-cty" value={d.country || ''} onChange={e => setData({ country: e.target.value || null }, `Country → ${e.target.value}`)}><option value="">— choose —</option>{Object.entries(COUNTRIES).map(([k, c]) => <option key={k} value={k}>{c.flag} {c.name} — {c.route}</option>)}</select></div>
        <div className="field"><label htmlFor="c-anc">Claim ancestor (“which grandfather”)</label>
          <select id="c-anc" value={d.claim_ancestor || ''} onChange={e => setData({ claim_ancestor: e.target.value || null }, 'Claim ancestor set')} disabled={!d.applicant}>
            <option value="">— choose —</option>
            {ancestors.map(a => { const x = idx.P.get(a.id); return <option key={a.id} value={a.id}>{relationLabel(a.depth, x.sex)}: {fullName(x)} {lifeSpan(x)}{x.birth_place ? ' · ' + x.birth_place.split(',')[0] : ''}</option>; })}
          </select>
          {!d.applicant && <div className="hint">Choose the applicant first.</div>}
          {d.applicant && !ancestors.length && <div className="hint">Add the applicant’s parents and grandparents in the tree first.</div>}
        </div>
        {sugg.length > 0 && <div className="notice" style={{ marginBottom: 10 }}><b>Smart match:</b> born where {COUNTRIES[d.country].name} applies — {sugg.map(s => { const x = idx.P.get(s.id); return <button key={s.id} className="chip btnlike" style={{ margin: '4px 4px 0 0' }} onClick={() => setData({ claim_ancestor: s.id }, 'Claim ancestor set (suggested)')}>{relationLabel(s.depth, x.sex)}: {fullName(x)}</button>; })}</div>}
        {d.country && !sugg.length && d.applicant && ancestors.length > 0 && <div className="hint" style={{ marginBottom: 10 }}>No ancestor’s birthplace is recognised as matching {COUNTRIES[d.country].name} yet — add birth places (e.g. “Munkács”) and the system will suggest the claim ancestor.</div>}
        {line && <div style={{ marginTop: 6 }}><div className="lbl">Claim line</div><div className="linechain">{line.map((id, i) => { const x = idx.P.get(id); return <div className="lc" key={id}><span className="dot" /><button className="btn sm ghost" onClick={() => onSelect(id)} style={{ textAlign: 'left' }}><b>{i === 0 ? 'Applicant' : relationLabel(i, x.sex)}</b>&nbsp;· {fullName(x)} <span className="muted">{lifeSpan(x)}</span></button></div>; })}</div></div>}
        <p className="hint">{DISCLAIMER}</p>
      </div>}
      {d.case_type === 'residency' && <div className="card" style={{ padding: 16, marginBottom: 14 }}><div className="field"><label htmlFor="c-app2">Applicant</label><select id="c-app2" value={d.applicant || ''} onChange={e => setData({ applicant: e.target.value || null })}><option value="">— choose —</option>{people.map(x => <option key={x.id} value={x.id}>{fullName(x)}</option>)}</select></div></div>}

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Client link</h3>
        <p className="hint" style={{ marginTop: 0 }}>Send the family a private link: they can fill in their own branch and upload documents — no login. They cannot see internal notes, activity or other projects, and cannot delete anything.</p>
        {p.client_enabled ? <>
          <div className="row"><input className="input" readOnly value={clientUrl} style={{ flex: 1 }} onFocus={e => e.target.select()} aria-label="Client link" /><button className="btn sm" onClick={() => { navigator.clipboard?.writeText(clientUrl); toast('Link copied'); }}><Icon name="copy" size={15} /> Copy</button>
            <a className="btn sm" href={`https://wa.me/?text=${encodeURIComponent('Your family tree for The Approved Group: ' + clientUrl)}`} target="_blank" rel="noopener"><Icon name="chat" size={15} /> WhatsApp</a></div>
          <div className="row" style={{ marginTop: 8 }}><button className="btn sm" onClick={() => setClient(false)}>Switch off</button><button className="btn sm ghost" onClick={() => confirm('Make a new link? The old one stops working.') && setClient(true, true)}>New link</button></div>
        </> : <button className="btn gold sm" onClick={() => setClient(true)}><Icon name="link" size={15} /> Switch on client link</button>}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>MyHeritage · Geni · Ancestry · FamilySearch</h3>
        <p className="hint" style={{ marginTop: 0 }}>These sites exchange trees as GEDCOM (.ged) files. In MyHeritage: Family tree → Manage trees → Export to GEDCOM. In Geni: Share → Export GEDCOM. Import the file here, or export this tree and upload it there. Each person also has prefilled search buttons (Research tab).</p>
        <div className="row">
          <button className="btn gold sm" onClick={() => fileRef.current.click()}><Icon name="upload" size={15} /> Import GEDCOM</button>
          <button className="btn sm" onClick={exportIt} disabled={!idx.P.size}><Icon name="download" size={15} /> Export GEDCOM</button>
          <input ref={fileRef} type="file" accept=".ged,.gedcom,text/plain" hidden onChange={onImport} />
        </div>
        {imp && <div className="notice" style={{ marginTop: 10 }}>
          <b>{imp.name}</b>: {imp.persons.length} people, {imp.families.length} families.{imp.warnings.map(w => <div key={w}>⚠ {w}</div>)}
          {imp.persons.length > 0 && <div className="row" style={{ marginTop: 8 }}>
            <button className="btn gold sm" onClick={() => doImport(false)}>Add to this tree</button>
            {idx.P.size > 0 && <button className="btn sm danger" onClick={() => confirm('Replace the whole tree with the file? People here will be removed (documents stay).') && doImport(true)}>Replace tree</button>}
            <button className="btn sm ghost" onClick={() => setImp(null)}>Cancel</button></div>}
        </div>}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Project</h3>
        <div className="row">
          <Link className="btn sm" to={`/app/p/${p.id}/print`}><Icon name="print" size={15} /> Print tree & checklist (PDF)</Link>
          <button className="btn sm" onClick={dup}><Icon name="copy" size={15} /> Duplicate (for a sibling / cousin)</button>
          {p.status !== 'archived' ? <button className="btn sm" onClick={() => ctx.updateProject({ status: 'archived' })}><Icon name="archive" size={15} /> Archive</button> : <button className="btn sm" onClick={() => ctx.updateProject({ status: 'research' })}>Restore from archive</button>}
          <button className="btn sm danger" onClick={del}><Icon name="trash" size={15} /> Delete</button>
        </div>
      </div>
    </div>
  );
}
