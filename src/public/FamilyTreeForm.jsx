import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import EmailVerify from './EmailVerify.jsx';
import { loadEmailJs, EMAILJS, savedEmail } from './emailjs.js';
import { parseDate, formatDate, yearOf } from '../lib/dates.js';
import { placeInfo } from '../lib/places.js';

// Same structure and field names as the original family-tree.html (the EmailJS template reads L1_name … L4_8_dom and user_email).
const LEVELS = [
  { title: 'Level 1 — Applicant', boxes: [['L1', 'Applicant (you)', true]] },
  { title: 'Level 2 — Parent', boxes: [['L2_1', 'Parent (EU side)', true], ['L2_2', 'Spouse']] },
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
      <h4>{label}</h4>
      <div className="field"><input name={`${k}_name`} placeholder={k === 'L1' ? 'Full legal name' : 'Name'} aria-label={`${label} name`} value={v.name} onChange={set('name')} /></div>
      <div className="field"><input name={`${k}_dob`} placeholder="Date of birth (DD/MM/YYYY)" aria-label={`${label} date of birth`} value={v.dob} onChange={set('dob')} /><DateHint v={v.dob} /></div>
      <div className="field"><input name={`${k}_pob`} placeholder="Place of birth (town, country)" aria-label={`${label} place of birth`} value={v.pob} onChange={set('pob')} /><PlaceHint v={v.pob} dob={v.dob} /></div>
      <div className="field"><input name={`${k}_dom`} placeholder="Date of marriage" aria-label={`${label} date of marriage`} value={v.dom} onChange={set('dom')} /></div>
    </div>
  );
}
export default function FamilyTreeForm() {
  const form = useRef(null);
  const [email, setEmail] = useState(savedEmail());
  const [state, setState] = useState('');
  const submit = async e => {
    e.preventDefault();
    if (!email) { setState('verify'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setState('sending');
    try { const ej = await loadEmailJs(); await ej.sendForm(EMAILJS.service, EMAILJS.treeTemplate, form.current); setState('sent'); }
    catch (err) { setState('error:' + (err.text || err.message || 'please try again')); }
  };
  return (
    <>
      <div className="page-head"><div className="in">
        <div className="eyebrow">Ancestry Map</div>
        <h1>Family Tree Structure</h1>
        <p>Fill in only the direct branch that connects you to Europe. Dates and places are checked as you type.</p>
      </div></div>
      <section className="section">
        <div className="row" style={{ marginBottom: 18 }}>
          <Link className="btn" to="/guide"><Icon name="book" /> Submission guide</Link>
          <a className="btn" href="/family-tree-template.png" download><Icon name="download" /> Download PNG template</a>
        </div>
        <EmailVerify onVerified={setEmail} />
        {state === 'verify' && <div className="notice err" style={{ marginBottom: 12 }}>Email verification required.</div>}
        <form ref={form} onSubmit={submit} className="legacy-tree">
          {LEVELS.map(l => <div key={l.title}><div className="lbl" style={{ margin: '10px 0 8px' }}>{l.title}</div><div className="legacy-level">{l.boxes.map(([k, label, eu]) => <Box key={k} k={k} label={label} eu={eu} />)}</div></div>)}
          <input type="hidden" name="user_email" value={email} readOnly />
          <div className="card" style={{ padding: 16 }}>
            <div className="hint" style={{ marginBottom: 10 }}>Verified applicant email: <b>{email || 'waiting for verification'}</b></div>
            <button className="btn gold block" type="submit" disabled={state === 'sending' || state === 'sent'}>{state === 'sending' ? 'Sending structure…' : state === 'sent' ? 'Sent successfully ✓' : 'Submit structure'}</button>
            {state.startsWith('error:') && <div className="notice err" style={{ marginTop: 10 }}>Could not send: {state.slice(6)}</div>}
            {state === 'sent' && <div className="notice" style={{ marginTop: 10 }}>Structure sent! Our team will review it. Need a bigger tree with documents? Ask us for your private family-tree link.</div>}
          </div>
        </form>
        <p className="hint" style={{ marginTop: 16 }}><b>Important legal note:</b> Submission of this map does not guarantee citizenship. Our team will verify the data against historical records to determine the feasibility of your case.</p>
      </section>
    </>
  );
}
