import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { COUNTRIES } from '../lib/rules.js';
import { REQUEST_BOXES, boxFilled, filledCount, buildFromRequest } from '../lib/requests.js';

const FILTERS = [['open', 'Open'], ['converted', 'Made into project'], ['closed', 'Handled'], ['all', 'All']];
const when = t => new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const STATUS = { new: ['New', 'gold'], seen: ['Seen', ''], converted: ['Project', 'ok'], closed: ['Handled', ''] };

function Req({ r, onChange, toast }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const d = r.data || {}; const tree = d.tree || {};
  const country = d.country && COUNTRIES[d.country] ? COUNTRIES[d.country] : null;
  const toggle = async () => { setOpen(!open); if (!open && r.status === 'new') { await api.put('/api/requests/' + r.id, { status: 'seen' }); onChange(); } };
  const convert = async () => {
    setBusy(true);
    try {
      const sk = buildFromRequest(r);
      const data = { client_name: r.name, client_email: r.email || '', client_phone: r.phone || '', case_type: d.objective === 'residency' ? 'residency' : 'citizenship', country: country ? d.country : null, applicant: sk.applicant, request_id: r.id };
      if (d.message) data.internal_notes = `Message from the website request: ${d.message}`;
      const b = await api.post('/api/projects', { name: `${r.name}${country ? ' — ' + country.name : ''}`, data, ops: { upsertPersons: sk.persons, upsertFamilies: sk.families, log: `Tree pre-filled from the website request (${sk.persons.length} people)` }, from_request: r.id });
      toast('Project created from the request'); nav('/app/p/' + b.project.id);
    } catch (x) { toast(x.message); setBusy(false); }
  };
  const setStatus = async s => { await api.put('/api/requests/' + r.id, { status: s }); onChange(); };
  const del = async () => { if (!confirm(`Delete the request from ${r.name}? This cannot be undone.`)) return; await api.del('/api/requests/' + r.id); toast('Request deleted'); onChange(); };
  const [label, cls] = STATUS[r.status] || [r.status, ''];
  return (
    <div className={'card req' + (r.status === 'new' ? ' new' : '')}>
      <div className="top" onClick={toggle} role="button" aria-expanded={open}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 6, marginBottom: 4 }}><span className={'chip ' + cls}>{label}</span><span className="chip">{d.kind === 'inquiry' ? 'Inquiry' : 'Family tree'}</span>{country && <span className="chip">{country.flag} {country.name}</span>}{d.emailed && <span className="chip" title="The original email to the team also went out">emailed</span>}</div>
          <h3>{r.name}</h3>
          <div className="who">{r.email}{r.phone ? ' · ' + r.phone : ''}</div>
          <div className="hint">{when(r.created)}{d.kind !== 'inquiry' ? ` · ${filledCount(tree)} people filled in` : ''}</div>
        </div>
        <Icon name={open ? 'x' : 'plus'} size={18} />
      </div>
      {open && <div>
        {d.objective && <p style={{ margin: '10px 0 0' }}><b>Objective:</b> {d.objective}</p>}
        {d.message && <p style={{ whiteSpace: 'pre-wrap', margin: '10px 0 0' }}><b>Message:</b> {d.message}</p>}
        {d.kind !== 'inquiry' && <div className="req-tree">{REQUEST_BOXES.filter(([k]) => boxFilled(tree, k)).map(([k, l]) => (
          <div key={k} className="b"><div className="l">{l} <span style={{ opacity: .6 }}>{k}</span></div>
            <b>{tree[k + '_name'] || '—'}</b>{tree[k + '_sex'] ? ` (${tree[k + '_sex']})` : ''}
            {tree[k + '_dob'] && <div>Born {tree[k + '_dob']}{tree[k + '_pob'] ? ', ' + tree[k + '_pob'] : ''}</div>}
            {!tree[k + '_dob'] && tree[k + '_pob'] && <div>Born in {tree[k + '_pob']}</div>}
            {tree[k + '_dom'] && <div>Married {tree[k + '_dom']}</div>}
          </div>))}</div>}
        <div className="row" style={{ marginTop: 10, gap: 8 }}>
          {r.project_id ? <Link className="btn gold sm" to={'/app/p/' + r.project_id}><Icon name="tree" size={15} /> Open project</Link>
            : <button className="btn gold sm" onClick={convert} disabled={busy}><Icon name="tree" size={15} /> {busy ? 'Creating…' : 'Create project from this'}</button>}
          {r.email && <a className="btn sm" href={'mailto:' + r.email}><Icon name="mail" size={15} /> Email</a>}
          {r.phone && <a className="btn sm" href={'https://wa.me/' + r.phone.replace(/[^0-9]/g, '')} target="_blank" rel="noopener"><Icon name="chat" size={15} /> WhatsApp</a>}
          {r.status !== 'closed' && r.status !== 'converted' && <button className="btn sm ghost" onClick={() => setStatus('closed')}><Icon name="check" size={15} /> Mark handled</button>}
          {r.status === 'closed' && <button className="btn sm ghost" onClick={() => setStatus('seen')}>Reopen</button>}
          <span className="spacer" />
          <button className="btn sm ghost danger" onClick={del} aria-label="Delete request"><Icon name="trash" size={15} /></button>
        </div>
      </div>}
    </div>
  );
}

export default function Requests({ toast, onCount }) {
  const [rows, setRows] = useState(null); const [f, setF] = useState('open'); const [q, setQ] = useState('');
  const load = () => api.get('/api/requests').then(x => { setRows(x); onCount && onCount(x.filter(r => r.status === 'new').length); }).catch(e => toast(e.message));
  useEffect(() => { load(); }, []);
  const list = (rows || []).filter(r => f === 'all' ? true : f === 'open' ? (r.status === 'new' || r.status === 'seen') : r.status === f)
    .filter(r => !q || (r.name + ' ' + r.email + ' ' + r.phone + ' ' + JSON.stringify(r.data.tree || {})).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="row" style={{ marginBottom: 6 }}><h1 style={{ fontSize: '1.6em', flex: 1, margin: 0 }}>Requests</h1></div>
      <p className="hint" style={{ marginTop: 0 }}>Family-tree requests and inquiries sent from the public website. Open one to see the details, then turn it into a project with one click — the tree is pre-filled from what they entered.</p>
      <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {FILTERS.map(([k, l]) => <button key={k} className={'btn sm ' + (f === k ? 'navy' : 'ghost')} onClick={() => setF(k)}>{l}</button>)}
        <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Search name, email, place…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search requests" />
      </div>
      {rows === null ? <div className="empty">Loading…</div> : list.length === 0 ? <div className="empty">No requests here yet. New ones from the website’s “Start Application” page appear here.</div>
        : list.map(r => <Req key={r.id} r={r} onChange={load} toast={toast} />)}
    </>
  );
}
