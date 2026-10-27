import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import TreeView from './TreeView.jsx';
import PersonPanel from './PersonPanel.jsx';
import CaseTab from './CaseTab.jsx';
import { DocRow, ReqRow, AddDoc } from './Docs.jsx';
import { claimLine, validate, requirements, progressOf, opsAddParent, opsAddChild, opsAddSpouse, opsAddSibling, opsDeletePerson, fullName, lifeSpan, relationLabel, personCompleteness, rid } from '../lib/tree.js';
import { COUNTRIES, PROJECT_STATUSES, DONE, DOC_STATUSES, DISCLAIMER, RESIDENCY } from '../lib/rules.js';
import { placeInfo } from '../lib/places.js';
import { yearOf } from '../lib/dates.js';

export default function ProjectView({ ctx, toast, mode = 'staff' }) {
  const { data, idx } = ctx;
  const [tab, setTab] = useState('tree');
  const [sel, setSel] = useState(null);
  const [panel, setPanel] = useState(null);
  const [focusLine, setFocusLine] = useState(false);
  const [q, setQ] = useState('');
  const [docFilter, setDocFilter] = useState('all');
  const pdata = data.project.data || {};
  const line = useMemo(() => claimLine(idx, pdata.applicant, pdata.claim_ancestor), [idx, pdata.applicant, pdata.claim_ancestor]);
  const warnings = useMemo(() => validate(idx), [idx]);
  const reqs = useMemo(() => requirements(data.project, idx, data.documents), [data.project, idx, data.documents]);
  const prog = progressOf(reqs);
  const docStats = useMemo(() => {
    const m = new Map();
    for (const r of reqs) { const s = m.get(r.personId) || { need: 0, files: 0 }; if (!r.done && !r.optional) s.need++; m.set(r.personId, s); }
    for (const d of data.documents) if (d.person_id && d.size) { const s = m.get(d.person_id) || { need: 0, files: 0 }; s.files++; m.set(d.person_id, s); }
    return m;
  }, [reqs, data.documents]);
  const roleOf = id => id === pdata.applicant ? 'Applicant' : id === pdata.claim_ancestor ? 'Ancestor' : '';
  const readOnly = mode === 'client' ? false : false;
  const fullCtx = { ...ctx, removePerson: id => ctx.apply(opsDeletePerson(idx, id), `Deleted ${fullName(idx.P.get(id))}`) };

  const quick = (kind, anchor) => {
    try {
      let ops;
      if (kind === 'father') ops = opsAddParent(idx, anchor, 'M');
      else if (kind === 'mother') ops = opsAddParent(idx, anchor, 'F');
      else if (kind === 'spouse') ops = opsAddSpouse(idx, anchor);
      else if (kind === 'child') ops = opsAddChild(idx, anchor);
      else if (kind === 'sibling') ops = opsAddSibling(idx, anchor);
      const a = idx.P.get(anchor);
      const labels = { father: 'Father of', mother: 'Mother of', spouse: 'Spouse of', child: 'Child of', sibling: 'Sibling of' };
      ops.upsertPersons[0].label = `${labels[kind]} ${a.given || fullName(a)}`;
      ctx.apply(ops, `Added ${kind} of ${fullName(a)}`);
      setSel(ops.newId); setPanel(ops.newId);
    } catch (e) { toast(e.message); }
  };
  const addFirst = () => { const id = rid(); ctx.apply({ upsertPersons: [{ id, given: '', surname: '', label: 'Applicant' }] }, 'Added first person'); if (!pdata.applicant && mode !== 'client') ctx.updateProject({ data: { ...pdata, applicant: id } }); setSel(id); setPanel(id); };

  const country = COUNTRIES[pdata.country];
  const errCount = [...warnings.values()].flat().filter(w => w.level === 'error').length;
  const people = [...idx.P.values()].filter(p => !q || (fullName(p) + ' ' + (p.hebrew || '') + ' ' + (p.maiden || '') + ' ' + (p.birth_place || '')).toLowerCase().includes(q.toLowerCase()));
  const T = (k, l) => <button className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>;

  return (
    <>
      <div className="proj-head">
        {mode !== 'client' && <Link to="/app" className="btn ghost sm" aria-label="All projects"><Icon name="back" /></Link>}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1>{data.project.name}</h1>
          <div className="row" style={{ gap: 6, marginTop: 2 }}>
            {mode !== 'client' && <span className="chip navy">{(PROJECT_STATUSES.find(s => s[0] === data.project.status) || [, data.project.status])[1]}</span>}
            {pdata.case_type === 'residency' ? <span className="chip gold">🇧🇪 Residency</span> : country ? <span className="chip gold">{country.flag} {country.name}</span> : <span className="chip">No country yet</span>}
            <span className="chip">{idx.P.size} people</span>
            {errCount > 0 && <span className="chip err">{errCount} issue{errCount > 1 ? 's' : ''}</span>}
            {ctx.saving > 0 && <span className="chip">Saving…</span>}
          </div>
        </div>
        <div style={{ minWidth: 150 }} title="Required documents done">
          <div className="hint" style={{ margin: 0 }}>Documents {prog.done}/{prog.total}</div>
          <div className="bar"><i style={{ width: prog.pct + '%' }} /></div>
        </div>
      </div>
      <div className="tabs">
        {T('tree', 'Tree')}{T('people', 'People')}{T('checklist', `Checklist ${prog.total ? prog.pct + '%' : ''}`)}{T('docs', `Documents (${data.documents.filter(d => d.size).length})`)}{mode !== 'client' && T('case', 'Case & settings')}{mode !== 'client' && T('activity', 'Activity')}
      </div>

      {tab === 'tree' && (idx.P.size ? <>
        <div className="row no-print" style={{ padding: '8px 12px', background: '#fff', borderBottom: '1px solid var(--line)', fontSize: '.85em' }}>
          {line ? <>
            <span className="chip gold">Claim line: {line.length} generations</span>
            <label className="row" style={{ gap: 4 }}><input type="checkbox" checked={focusLine} onChange={e => setFocusLine(e.target.checked)} /> Focus on claim line</label>
          </> : <span className="muted">{mode === 'client' ? 'Tap a person to fill in details. Use + buttons to add relatives.' : <>Set the applicant and the claim ancestor in <a href="#" onClick={e => { e.preventDefault(); setTab('case'); }}>Case & settings</a> to highlight the line and get the document list.</>}</span>}
        </div>
        <TreeView idx={idx} rootId={pdata.applicant} line={line} selected={sel} onSelect={id => { setSel(id); if (id) setPanel(id); }} onQuick={quick} warnings={warnings} docStats={docStats} roleOf={roleOf} highlightOnly={focusLine} />
      </> : <div className="empty"><p>No people yet.</p><button className="btn gold" onClick={addFirst}><Icon name="plus" /> Add the applicant</button>{mode !== 'client' && <p className="hint">…or import a GEDCOM file from MyHeritage / Geni in <a href="#" onClick={e => { e.preventDefault(); setTab('case'); }}>Case & settings</a>.</p>}</div>)}

      {tab === 'people' && <div className="app-main">
        <div className="row" style={{ marginBottom: 10 }}><input className="input" style={{ flex: 1 }} placeholder="Search people, Hebrew names, places…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search people" /><button className="btn gold" onClick={idx.P.size ? () => setTab('tree') : addFirst}><Icon name="tree" /> Tree</button></div>
        <div className="card scroll-x"><table className="tbl">
          <thead><tr><th>Name</th><th>Born</th><th>Place (then → now)</th><th>Died</th><th>Done</th><th></th></tr></thead>
          <tbody>{people.sort((a, b) => (yearOf(a.birth_date) || 9999) - (yearOf(b.birth_date) || 9999)).map(p => { const w = warnings.get(p.id) || []; const pi = placeInfo(p.birth_place, yearOf(p.birth_date)); return (
            <tr key={p.id} className="click" onClick={() => { setSel(p.id); setPanel(p.id); }}>
              <td><b>{fullName(p)}</b>{p.maiden ? <span className="muted"> née {p.maiden}</span> : ''}{p.hebrew ? <div dir="rtl" className="muted" style={{ textAlign: 'left' }}>{p.hebrew}</div> : ''}{roleOf(p.id) && <span className="chip gold" style={{ marginLeft: 6 }}>{roleOf(p.id)}</span>}{line && line.includes(p.id) && !roleOf(p.id) && <span className="chip gold" style={{ marginLeft: 6 }}>line</span>}</td>
              <td>{p.birth_date || '—'}</td>
              <td>{p.birth_place || '—'}{pi && pi.then ? <div className="hint">{pi.then} → {pi.now}</div> : ''}</td>
              <td>{p.death_date || (p.living === false ? 'yes' : '')}</td>
              <td>{personCompleteness(idx, p)}%</td>
              <td>{w.some(x => x.level === 'error') ? <span className="chip err">!</span> : w.length ? <span className="chip warn">!</span> : ''}</td>
            </tr>); })}</tbody>
        </table></div>
      </div>}

      {tab === 'checklist' && <div className="app-main">
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div className="row"><div style={{ flex: 1 }}><b>{pdata.case_type === 'residency' ? RESIDENCY.name : country ? `${country.flag} ${country.name} — ${country.route}` : 'No target country chosen'}</b><div className="hint">{prog.done} of {prog.total} required documents done</div></div>{mode !== 'client' && <Link className="btn sm" to={`/app/p/${data.project.id}/print`}><Icon name="print" size={15} /> Print / PDF</Link>}</div>
          <div className="bar" style={{ marginTop: 8 }}><i style={{ width: prog.pct + '%' }} /></div>
          {country && pdata.case_type !== 'residency' && <><p style={{ fontSize: '.9em', marginBottom: 6 }}>{country.summary}</p>{country.notes.map(n => <div key={n} className="hint">• {n}</div>)}</>}
          <div className="notice" style={{ marginTop: 10 }}>{DISCLAIMER}</div>
        </div>
        {!line && pdata.case_type !== 'residency' && <div className="notice err" style={{ marginBottom: 12 }}>{pdata.applicant ? 'Choose the claim ancestor (Case & settings) — the checklist then covers every generation on the line.' : 'Choose the applicant and claim ancestor first.'}</div>}
        {groupBy(reqs, r => r.personId).map(([pid, rs]) => { const p = idx.P.get(pid); return (
          <div key={pid} className="card" style={{ padding: '10px 14px', marginBottom: 10 }}>
            <div className="row"><b style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setSel(pid); setPanel(pid); }}>{fullName(p)} <span className="muted" style={{ fontWeight: 400 }}>· {rs[0].roleLabel} · {lifeSpan(p)}</span></b><span className="chip">{rs.filter(r => r.done).length}/{rs.length}</span></div>
            {rs.map((r, i) => <ReqRow key={i} r={r} onCreate={ctx.createDoc} onUpdate={ctx.updateDoc} onUpload={ctx.uploadFile} fileUrl={ctx.fileUrl} />)}
          </div>); })}
      </div>}

      {tab === 'docs' && <div className="app-main">
        <div className="filters">{[['all', 'All'], ['files', 'With file'], ...DOC_STATUSES].map(([k, l]) => <button key={k} className={docFilter === k ? 'on' : ''} onClick={() => setDocFilter(k)}>{l}</button>)}</div>
        <div className="card" style={{ padding: '6px 14px' }}>
          {data.documents.filter(d => docFilter === 'all' || (docFilter === 'files' ? d.size > 0 : d.status === docFilter)).map(d => <DocRow key={d.id} doc={d} P={idx.P} showPerson onUpdate={ctx.updateDoc} onUpload={ctx.uploadFile} onDelete={mode === 'client' ? null : ctx.deleteDoc} fileUrl={ctx.fileUrl} />)}
          {!data.documents.length && <div className="empty">No documents yet. Open a person to upload, or tick items in the checklist.</div>}
        </div>
        <div className="card" style={{ padding: 14, marginTop: 12 }}><div className="lbl">Project document (not linked to a person)</div><AddDoc personId={null} onCreate={ctx.createDoc} onUpload={ctx.uploadFile} defaultType="other" /></div>
      </div>}

      {tab === 'case' && mode !== 'client' && <CaseTab ctx={fullCtx} toast={toast} line={line} warnings={warnings} onSelect={id => { setSel(id); setPanel(id); setTab('tree'); }} />}

      {tab === 'activity' && <div className="app-main"><div className="card" style={{ padding: '6px 14px' }}>
        {data.activity.map((a, i) => <div key={i} className="doc-row"><div className="t"><b style={{ fontWeight: 500 }}>{a.text}</b><small>{new Date(a.ts).toLocaleString()} · {a.who}</small></div></div>)}
        {!data.activity.length && <div className="empty">Nothing yet.</div>}
      </div></div>}

      {panel && idx.P.get(panel) && <PersonPanel key={panel} ctx={fullCtx} personId={panel} onClose={() => setPanel(null)} onSelect={id => { setSel(id); setPanel(id); }} onQuick={quick} reqs={reqs} warnings={warnings} readOnly={readOnly} />}
    </>
  );
}
function groupBy(arr, f) { const m = new Map(); for (const x of arr) { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return [...m.entries()]; }
