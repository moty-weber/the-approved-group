import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { COUNTRIES, PROJECT_STATUSES, ACTIVE_STATUSES } from '../lib/rules.js';
import { rid, relationLabel } from '../lib/tree.js';
import { importGedcom } from '../lib/gedcom.js';

const FILTERS = [['active', 'In progress'], ['new', 'New'], ['approved', 'Approved'], ['archived', 'Archived / old'], ['all', 'All']];
const statusLabel = s => (PROJECT_STATUSES.find(x => x[0] === s) || [, s])[1];
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

/** Builds the skeleton claim line for a new family: applicant → … → chosen ancestor, with surnames carried down the male line. */
function skeleton(applicantName, steps) {
  const persons = [], families = [];
  const [given, ...rest] = applicantName.trim().split(/\s+/); const surname = rest.join(' ');
  const app = { id: rid(), given: given || '', surname, label: 'Applicant' };
  persons.push(app);
  let child = app; let ancestor = null; let sur = surname; let maleLine = true;
  steps.forEach((sex, i) => {
    maleLine = maleLine && sex === 'M';
    const p = { id: rid(), given: '', sex, surname: sex === 'M' && maleLine ? sur : '', label: relationLabel(i + 1, sex) };
    persons.push(p);
    families.push({ id: rid(), husb: sex === 'M' ? p.id : null, wife: sex === 'F' ? p.id : null, children: [child.id] });
    child = p; ancestor = p;
  });
  return { persons, families, applicant: app.id, ancestor: ancestor && ancestor.id };
}

function NewProject({ onClose, onCreated }) {
  const [f, setF] = useState({ applicant: '', client_email: '', client_phone: '', case_type: 'citizenship', country: '', depth: 2, steps: ['M', 'M', 'M', 'M', 'M'] });
  const [ged, setGed] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const steps = f.steps.slice(0, f.depth);
  const pathLabel = steps.map((s, i) => relationLabel(i + 1, s)).pop();
  const pathText = ['You', ...steps.map((s, i) => (i === 0 ? (s === 'M' ? 'father' : 'mother') : (s === 'M' ? 'his/her father' : 'his/her mother')))].join(' → ');
  const create = async e => {
    e.preventDefault(); if (!f.applicant.trim()) return; setBusy(true);
    let ops, data = { client_name: f.applicant.trim(), client_email: f.client_email, client_phone: f.client_phone, case_type: f.case_type, country: f.country || null };
    if (ged) { ops = { upsertPersons: ged.persons, upsertFamilies: ged.families, log: `GEDCOM import: ${ged.persons.length} people` }; }
    else if (f.case_type === 'residency') { const id = rid(); const [g, ...r] = f.applicant.trim().split(/\s+/); ops = { upsertPersons: [{ id, given: g, surname: r.join(' '), label: 'Applicant' }] }; data.applicant = id; }
    else { const sk = skeleton(f.applicant, steps); ops = { upsertPersons: sk.persons, upsertFamilies: sk.families }; data.applicant = sk.applicant; data.claim_ancestor = sk.ancestor; }
    try { const b = await api.post('/api/projects', { name: `${f.applicant.trim()}${f.country ? ' — ' + COUNTRIES[f.country].name : ''}`, data, ops }); onCreated(b.project.id); }
    catch (x) { alert(x.message); setBusy(false); }
  };
  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={create}>
        <div className="row"><h2 style={{ flex: 1 }}>New family project</h2><button type="button" className="btn ghost" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        <div className="field"><label htmlFor="n-a">Applicant full name</label><input id="n-a" value={f.applicant} onChange={e => set('applicant', e.target.value)} placeholder="e.g. Yaakov Weiss" required autoFocus /></div>
        <div className="grid2">
          <div className="field"><label htmlFor="n-e">Client email</label><input id="n-e" type="email" value={f.client_email} onChange={e => set('client_email', e.target.value)} /></div>
          <div className="field"><label htmlFor="n-p">Client phone</label><input id="n-p" type="tel" value={f.client_phone} onChange={e => set('client_phone', e.target.value)} /></div>
        </div>
        <div className="grid2">
          <div className="field"><label htmlFor="n-t">Case type</label><select id="n-t" value={f.case_type} onChange={e => set('case_type', e.target.value)}><option value="citizenship">Citizenship by descent</option><option value="residency">Belgian residency</option></select></div>
          {f.case_type === 'citizenship' && <div className="field"><label htmlFor="n-c">Target country</label><select id="n-c" value={f.country} onChange={e => set('country', e.target.value)}><option value="">Not sure yet</option>{Object.entries(COUNTRIES).filter(([k]) => k !== 'OTHER').map(([k, c]) => <option key={k} value={k}>{c.flag} {c.name}</option>)}</select></div>}
        </div>
        {f.case_type === 'citizenship' && !ged && <div className="card" style={{ padding: 14, boxShadow: 'none', marginBottom: 12 }}>
          <div className="lbl">Through which ancestor? (“which grandfather”)</div>
          <div className="row" style={{ margin: '8px 0' }}>{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} className={'btn sm' + (f.depth === n ? ' navy' : '')} onClick={() => set('depth', n)}>{n === 1 ? 'Parent' : n === 2 ? 'Grandparent' : n === 3 ? 'Great-gp' : `${n - 2}× great`}</button>)}</div>
          {steps.map((s, i) => <div key={i} className="row" style={{ marginBottom: 4 }}><span className="hint" style={{ width: 150 }}>{i === 0 ? 'Applicant’s' : 'whose'}</span>
            <button type="button" className={'btn sm' + (s === 'M' ? ' navy' : '')} onClick={() => { const st = [...f.steps]; st[i] = 'M'; set('steps', st); }}>father</button>
            <button type="button" className={'btn sm' + (s === 'F' ? ' navy' : '')} onClick={() => { const st = [...f.steps]; st[i] = 'F'; set('steps', st); }}>mother</button></div>)}
          <div className="notice" style={{ marginTop: 8 }}>The tree starts with this line ready to fill: {pathText}. Claim ancestor: <b>{pathLabel}</b>. Surnames are carried along the male line automatically.</div>
        </div>}
        <div className="field"><label>Or start from a GEDCOM file (MyHeritage, Geni, Ancestry…)</label><input type="file" accept=".ged,.gedcom,text/plain" onChange={async e => { const file = e.target.files[0]; if (!file) return setGed(null); const r = importGedcom(await file.text()); setGed(r); }} />{ged && <div className="hint ok">{ged.persons.length} people, {ged.families.length} families will be imported. Choose applicant & ancestor afterwards in Case & settings.</div>}</div>
        <button className="btn gold block" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</button>
      </form>
    </div>
  );
}

export default function Projects({ toast }) {
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState('active');
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const nav = useNavigate();
  useEffect(() => { api.get('/api/projects').then(setList).catch(e => toast(e.message)); document.title = 'Projects | Approved Case Manager'; }, []);
  const shown = useMemo(() => (list || []).filter(p => {
    if (filter === 'active' && !(ACTIVE_STATUSES.has(p.status) || p.status === 'new')) return false;
    if (filter === 'new' && p.status !== 'new') return false;
    if (filter === 'approved' && p.status !== 'approved') return false;
    if (filter === 'archived' && p.status !== 'archived') return false;
    if (q) { const s = (p.name + ' ' + JSON.stringify(p.data)).toLowerCase(); if (!s.includes(q.toLowerCase())) return false; }
    return true;
  }), [list, filter, q]);
  const count = k => (list || []).filter(p => k === 'all' || (k === 'active' ? ACTIVE_STATUSES.has(p.status) || p.status === 'new' : p.status === k)).length;
  return (
    <>
      <div className="row" style={{ marginBottom: 6 }}>
        <h1 style={{ flex: 1, fontSize: '1.6em', margin: 0 }}>Projects</h1>
        <button className="btn gold" onClick={() => setShowNew(true)}><Icon name="plus" /> New project</button>
      </div>
      <div className="row"><input className="input" style={{ flex: 1 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, client, email…" aria-label="Search projects" /></div>
      <div className="filters">{FILTERS.map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l} {list ? `(${count(k)})` : ''}</button>)}</div>
      {!list ? <div className="empty">Loading…</div> : !shown.length ? <div className="empty"><p>{list.length ? 'No projects match.' : 'No projects yet — create the first family.'}</p>{!list.length && <button className="btn gold" onClick={() => setShowNew(true)}><Icon name="plus" /> New project</button>}</div> :
        <div className="pcards">{shown.map(p => { const c = COUNTRIES[p.data.country]; const pr = p.data.progress; const done = pr ? pr.done : p.n_docs_done, total = pr ? pr.total : p.n_docs; const pct = total ? Math.round(done / total * 100) : 0; return (
          <Link key={p.id} to={`/app/p/${p.id}`} className="card pcard">
            <div className="row" style={{ marginBottom: 6 }}><span className="chip navy">{statusLabel(p.status)}</span>{p.data.case_type === 'residency' ? <span className="chip gold">🇧🇪 Residency</span> : c ? <span className="chip gold">{c.flag} {c.name}</span> : null}{p.client_enabled && <span className="chip">client link on</span>}</div>
            <h3>{p.name}</h3>
            <div className="meta">{p.n_persons} people · {p.n_files} files · updated {ago(p.updated)}{p.data.deadline ? ` · due ${p.data.deadline}` : ''}</div>
            <div className="bar" style={{ marginTop: 10 }}><i style={{ width: pct + '%' }} /></div>
            <div className="meta" style={{ marginTop: 4 }}>{total ? `${done}/${total} required documents done` : 'No checklist yet — set country & claim ancestor'}</div>
          </Link>); })}</div>}
      {showNew && <NewProject onClose={() => setShowNew(false)} onCreated={id => nav(`/app/p/${id}`)} />}
      <button className="btn gold fab no-print" onClick={() => setShowNew(true)} aria-label="New project"><Icon name="plus" /> New</button>
    </>
  );
}
