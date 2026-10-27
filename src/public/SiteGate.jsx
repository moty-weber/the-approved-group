import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
/** The original "Website Is Currently Closed" overlay (index.html), now with the passcode checked on the server.
    Staff can switch it off under Admin → Site settings. */
export default function SiteGate() {
  const [state, setState] = useState(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { fetch('/api/site').then(r => r.json()).then(setState).catch(() => setState({ closed: false })); }, []);
  if (!state || !state.closed || state.unlocked) return null;
  const unlock = async e => {
    e.preventDefault(); setErr('');
    const r = await fetch('/api/site/unlock', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
    if (r.ok) setState({ ...state, unlocked: true }); else { const j = await r.json().catch(() => ({})); setErr(j.error || 'Incorrect passcode.'); }
  };
  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-t">
      <div className="c">
        <img src="/logo.png" alt="The Approved Group" />
        <h1 id="gate-t">Website Is Currently Closed</h1>
        <p>We are currently updating our portal to serve you better. For urgent inquiries or consultations, please contact us directly.</p>
        <div className="contacts">
          <a href="mailto:info@approvedeu.com"><Icon name="mail" /> info@approvedeu.com</a>
          <a href="tel:+32470912705"><Icon name="phone" /> +32 470 91 27 05</a>
        </div>
      </div>
      <form className="access" onSubmit={unlock}>
        <input type="password" maxLength={20} placeholder="Passcode" aria-label="Passcode" value={code} onChange={e => setCode(e.target.value)} />
        <button type="submit">Enter</button>
        {err && <span style={{ color: '#f3b0a8', fontSize: '.85em', alignSelf: 'center' }}>{err}</span>}
      </form>
    </div>
  );
}
