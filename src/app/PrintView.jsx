import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { layout, NODE_W, NODE_H, claimLine, requirements, progressOf, fullName, lifeSpan, relationLabel } from '../lib/tree.js';
import { COUNTRIES, DOC_TYPES, DOC_STATUSES, DISCLAIMER, RESIDENCY } from '../lib/rules.js';
import { placeInfo } from '../lib/places.js';
import { yearOf } from '../lib/dates.js';

/** Printable case file: summary, claim line, tree (vector), people, document checklist. Use the browser's "Save as PDF". */
export default function PrintView({ ctx }) {
  const { data, idx } = ctx; const p = data.project; const d = p.data || {};
  const line = claimLine(idx, d.applicant, d.claim_ancestor);
  const L = useMemo(() => layout(idx, d.applicant), [idx]);
  const reqs = requirements(p, idx, data.documents); const prog = progressOf(reqs);
  const C = COUNTRIES[d.country];
  const lineSet = new Set(line || []);
  useEffect(() => { document.title = `${p.name} — case file`; }, []);
  const st = s => (DOC_STATUSES.find(x => x[0] === s) || [, s])[1];
  const scale = Math.min(1, 1000 / (L.width || 1));
  return (
    <div style={{ background: '#fff', padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div className="row no-print" style={{ marginBottom: 14 }}><Link className="btn sm" to={`/app/p/${p.id}`}><Icon name="back" size={15} /> Back</Link><button className="btn gold sm" onClick={() => window.print()}><Icon name="print" size={15} /> Print / Save as PDF</button><span className="hint">Tip: choose “Save as PDF”, landscape for wide trees.</span></div>
      <div className="row" style={{ borderBottom: '3px solid var(--gold)', paddingBottom: 10, marginBottom: 14 }}>
        <img src="/logo.png" alt="" style={{ height: 54 }} />
        <div style={{ flex: 1 }}><h1 style={{ margin: 0, fontSize: '1.6em' }}>{p.name}</h1><div className="hint">The Approved Group · case file · printed {new Date().toLocaleDateString()}</div></div>
      </div>
      <div className="grid2" style={{ marginBottom: 12 }}>
        <div><b>Client:</b> {d.client_name || '—'} {d.client_email ? '· ' + d.client_email : ''} {d.client_phone ? '· ' + d.client_phone : ''}<br /><b>Route:</b> {d.case_type === 'residency' ? RESIDENCY.name : C ? `${C.name} — ${C.route}` : 'not chosen'}<br /><b>Documents:</b> {prog.done}/{prog.total} done ({prog.pct}%)</div>
        <div>{line ? <><b>Claim line</b><ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>{line.map((id, i) => { const x = idx.P.get(id); return <li key={id}>{i === 0 ? 'Applicant' : relationLabel(i, x.sex)}: <b>{fullName(x)}</b> {lifeSpan(x)} {x.birth_place ? '· ' + x.birth_place : ''}</li>; })}</ol></> : <span className="muted">No claim line set.</span>}</div>
      </div>
      <h2 style={{ fontSize: '1.2em' }}>Family tree</h2>
      <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <svg viewBox={`0 0 ${L.width} ${L.height}`} width={L.width * scale} height={L.height * scale} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
          {L.couples.map(c => <line key={c.fam} x1={c.x1} x2={c.x2} y1={c.y} y2={c.y} stroke="#a9a28f" strokeWidth="2" />)}
          {L.edges.map((e, i) => <path key={i} d={e.d} fill="none" stroke={e.kids.some(k => lineSet.has(k)) && e.parents.some(x => lineSet.has(x)) ? '#d4af37' : '#b3ad9c'} strokeWidth={e.kids.some(k => lineSet.has(k)) && e.parents.some(x => lineSet.has(x)) ? 3.5 : 1.6} />)}
          {[...L.pos.entries()].map(([id, pos]) => { const x = idx.P.get(id); const on = lineSet.has(id); return (
            <g key={id} transform={`translate(${pos.x},${pos.y})`}>
              <rect width={NODE_W} height={NODE_H} rx="10" fill="#fff" stroke={on ? '#d4af37' : '#cfc8b6'} strokeWidth={on ? 3 : 1.5} />
              <rect width="5" height={NODE_H} fill={x.sex === 'F' ? '#e3a6b8' : x.sex === 'M' ? '#7ea2d6' : '#b9c3d6'} />
              <text x="14" y="22" fontSize="13" fontWeight="600" fontFamily="Poppins, sans-serif">{(fullName(x)).slice(0, 26)}</text>
              {x.hebrew && <text x={NODE_W - 10} y="40" fontSize="12" textAnchor="end" fill="#6b5a1a">{x.hebrew.slice(0, 28)}</text>}
              <text x="14" y="58" fontSize="11" fill="#5b6475">{lifeSpan(x)}</text>
              <text x="14" y="76" fontSize="11" fill="#5b6475">{(x.birth_place || '').split(',')[0].slice(0, 28)}</text>
            </g>); })}
        </svg>
      </div>
      <div className="print-page" />
      <h2 style={{ fontSize: '1.2em' }}>Document checklist</h2>
      <table className="tbl" style={{ marginBottom: 16 }}><thead><tr><th>Person</th><th>Document</th><th>Why</th><th>Status</th><th>File</th></tr></thead>
        <tbody>{reqs.map((r, i) => { const x = idx.P.get(r.personId); return <tr key={i}><td>{fullName(x)}<div className="hint">{r.roleLabel}</div></td><td>{DOC_TYPES[r.type]}{r.optional ? ' (if applicable)' : ''}</td><td className="hint">{r.why}</td><td><b className={'st-' + r.status}>{st(r.status)}</b></td><td>{r.docs.filter(x => x.size).map(x => x.filename).join(', ') || '—'}</td></tr>; })}</tbody></table>
      <h2 style={{ fontSize: '1.2em' }}>People</h2>
      <table className="tbl"><thead><tr><th>Name</th><th>Hebrew</th><th>Born</th><th>Place (then → now)</th><th>Died</th><th>Citizenship</th></tr></thead>
        <tbody>{[...idx.P.values()].sort((a, b) => (yearOf(a.birth_date) || 9999) - (yearOf(b.birth_date) || 9999)).map(x => { const pi = placeInfo(x.birth_place, yearOf(x.birth_date)); return <tr key={x.id}><td><b>{fullName(x)}</b>{x.maiden ? ` (née ${x.maiden})` : ''}</td><td dir="rtl">{x.hebrew}</td><td>{x.birth_date}</td><td>{x.birth_place}{pi && pi.then ? <div className="hint">{pi.then} → {pi.now}</div> : ''}</td><td>{x.death_date}{x.death_place ? ', ' + x.death_place : ''}</td><td>{x.citizenship}</td></tr>; })}</tbody></table>
      <p className="hint" style={{ marginTop: 16 }}>{DISCLAIMER}</p>
    </div>
  );
}
