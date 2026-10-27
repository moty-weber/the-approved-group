import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import EmailVerify from './EmailVerify.jsx';
import { loadEmailJs, EMAILJS, savedEmail } from './emailjs.js';
import { parseDate, formatDate, yearOf } from '../lib/dates.js';
import { placeInfo } from '../lib/places.js';
import { COUNTRIES } from '../lib/rules.js';

// Same structure and field names as the original family-tree.html (the EmailJS template reads L1_name … L4_8_dom and user_email).
const LEVELS = [
  { title: 'Level 1 — Applicant', boxes: [['L1', 'Applicant (you)', true]] },
  { title: 'Level 2 — Parents', boxes: [['L2_1', 'Parent (EU side)', true], ['L2_2', 'Spouse']] },
  { title: 'Level 3 — Grandparents', boxes: [['L3_1', 'EU grandparent', true], ['L3_2', 'Spouse'], ['L3_3', 'EU grandparent', true], ['L3_4', 'Spouse']] },
  { title: 'Level 4 — Great-grandparents', boxes: [['L4_1', 'EU great-grandparent', true], ['L4_2', 'Spouse'], ['L4_3', 'EU great-grandparent', true], ['L4_4', 'Spouse'], ['L4_5', 'EU great-grandparent', true], ['L4_6', 'Spouse'], ['L4_7', 'EU great-grandparent', true], ['L4_8', 'Spouse']] },
];
function DateHint({ v }) {
  if (!v) return null; const p = parseDate(v);
  if (!p) return <div className="hint warn">Use DD/MM/YYYY if possible</div>;
  return <div className="hint ok">✓ {formatDate(p)}</div>;
}
function PlaceHint({ v, dob }) {
  const i = v && placeInfo(v, yearOf(dob));
  if (!i) return null;
  return <div className="hint ok">✓ {i.label}{i.then ? ` · in ${i.year}: ${i.then}` : ''}</div>;
}
function Box({ k, label, eu }) {
  const [v, setV] = useState({ name: '', dob: '', pob: '', dom: '' });
  const set = f => e => setV({ ...v, [f]: e.target.value });
  return (
    <div className={'legacy-box' + (eu ? ' eu' : '')}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 6, marginBottom: 6 }}><h4 style={{ margin: 0 }}>{label}</h4>
        <select name={`${k}_sex`} aria-label={`${label} gender`} className="sex-sel" defaultValue=""><option value="">M / F</option><option value="M">Male</option><option value="F">Female</option></select></div>
      <div className="field"><input name={`${k}_name`} placeholder={k === 'L1' ? 'Full legal name' : 'Name'} aria-label={`${label} name`} value={v.name} onChange={set('name')} /></div>
      <div className="field"><input name={`${k}_dob`} placeholder="Date of birth (DD/MM/YYYY)" aria-label={`${label} date of birth`} value={v.dob} onChange={set('dob')} /><DateHint v={v.dob} /></div>
      <div className="field"><input name={`${k}_pob`} placeholder="Place of birth (town, country)" aria-label={`${label} place of birth`} value={v.pob} onChange={set('pob')} /><PlaceHint v={v.pob} dob={v.dob} /></div>
      <div className="field"><input name={`${k}_dom`} placeholder="Date of marriage" aria-label={`${label} date of marriage`} value={v.dom} onChange={set('dom')} /></div>
    </div>
  );
}
const field = (fd, k) => String(fd.get(k) || '').trim();
export default function FamilyTreeForm() {
  const form = useRef(null);
  const [email, setEmail] = useState(savedEmail());
  const [state, setState] = useState('');
  const submit = async e => {
    e.preventDefault();
    if (!email) { setState('verify'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const fd = new FormData(form.current);
    if (!field(fd, 'applicant_name') || !field(fd, 'applicant_phone')) { setState('error:Please fill in your name and phone number.'); return; }
    setState('sending');
    const tree = {};
    for (const [k, v] of fd.entries()) if (/^L[1-4]/.test(k) && String(v).trim()) tree[k] = String(v).trim();
    if (!tree.L1_name) tree.L1_name = field(fd, 'applicant_name');
    // 1) saved for the team's Requests inbox in the case manager
    let saved = null;
    try {
      const r = await fetch('/api/requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        kind: 'family_tree', name: field(fd, 'applicant_name'), email, phone: field(fd, 'applicant_phone'), country: field(fd, 'applicant_country'),
        message: field(fd, 'message'), website: field(fd, 'website'), tree, source: 'family-tree' }) });
      if (r.ok) saved = (await r.json()).id;
    } catch { /* email below still goes */ }
    // 2) the original email to the team (EmailJS, same service + template as the old site)
    let mailed = false, mailErr = '';
    try { const ej = await loadEmailJs(); await ej.sendForm(EMAILJS.service, EMAILJS.treeTemplate, form.current); mailed = true; }
    catch (err) { mailErr = err.text || err.message || 'please try again'; }
    if (saved && mailed) fetch(`/api/requests/${saved}/emailed`, { method: 'POST' }).catch(() => {});
    setState(saved || mailed ? 'sent' : 'error:' + mailErr);
  };
  const sent = state === 'sent';
  return (
    <>
      <div className="page-head"><div className="in">
        <div className="eyebrow">Start your application</div>
        <h1>Family Tree Request</h1>
        <p>Tell us who you are and fill in the direct branch that connects you to Europe. Your request goes straight to our team — we review it and contact you.</p>
      </div></div>
      <section className="section">
        <div className="row" style={{ marginBottom: 18 }}>
          <Link className="btn" to="/guide"><Icon name="book" /> Submission guide</Link>
          <a className="btn" href="/family-tree-template.png" download><Icon name="download" /> Download PNG template</a>
        </div>
        {sent ? (
          <div className="card request-done" style={{ padding: 22 }}>
            <div className="eyebrow">Request received</div>
            <h2 style={{ marginTop: 6 }}>Thank you — your request is with our team.</h2>
            <p className="muted">We will review your family details against the historical records and contact you at <b>{email}</b>. Nothing else is needed from you right now.</p>
            <div className="row"><Link className="btn gold" to="/">Back to home</Link><Link className="btn" to="/contact">Contact us</Link></div>
          </div>
        ) : <>
        <div className="lbl" style={{ margin: '4px 0 8px' }}>Step 1 — Verify your email</div>
        <EmailVerify onVerified={setEmail} />
        {state === 'verify' && <div className="notice err" style={{ marginBottom: 12 }}>Email verification required.</div>}
        <form ref={form} onSubmit={submit} className="legacy-tree">
          <div className="lbl" style={{ margin: '10px 0 8px' }}>Step 2 — Your details</div>
          <div className="card" style={{ padding: 16 }}>
            <div className="grid2">
              <div className="field"><label htmlFor="r-name">Full name *</label><input id="r-name" name="applicant_name" autoComplete="name" required /></div>
              <div className="field"><label htmlFor="r-phone">Phone / WhatsApp *</label><input id="r-phone" name="applicant_phone" type="tel" autoComplete="tel" required /></div>
            </div>
            <div className="field"><label htmlFor="r-country">Country of your European ancestry</label>
              <select id="r-country" name="applicant_country" defaultValue="">
                <option value="">Not sure / other</option>
                {Object.entries(COUNTRIES).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
              </select></div>
            <div className="field"><label htmlFor="r-msg">Anything we should know? (optional)</label><textarea id="r-msg" name="message" rows={3} placeholder="e.g. my grandfather was born in Munkács in 1925 and emigrated in 1947" /></div>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-5000px', width: 1, height: 1 }} />
          </div>
          <div className="lbl" style={{ margin: '18px 0 0' }}>Step 3 — Your family tree (direct branch only)</div>
          {LEVELS.map(l => <div key={l.title}><div className="lbl" style={{ margin: '10px 0 8px' }}>{l.title}</div><div className="legacy-level">{l.boxes.map(([k, label, eu]) => <Box key={k} k={k} label={label} eu={eu} />)}</div></div>)}
          <input type="hidden" name="user_email" value={email} readOnly />
          <div className="card" style={{ padding: 16 }}>
            <div className="hint" style={{ marginBottom: 10 }}>Verified applicant email: <b>{email || 'waiting for verification'}</b></div>
            <button className="btn gold block" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending your request…' : 'Send request to the team'}</button>
            {state.startsWith('error:') && <div className="notice err" style={{ marginTop: 10 }}>Could not send: {state.slice(6)}</div>}
          </div>
        </form>
        </>}
        <p className="hint" style={{ marginTop: 16 }}><b>Important legal note:</b> Submission of this map does not guarantee citizenship. Our team will verify the data against historical records to determine the feasibility of your case.</p>
      </section>
    </>
  );
}
