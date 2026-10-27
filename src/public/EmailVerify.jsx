import { useState } from 'react';
import { loadEmailJs, EMAILJS, savedEmail } from './emailjs.js';
import Icon from '../components/Icon.jsx';

/** Same flow as the original site: a 6-digit code is emailed via EmailJS; once confirmed the email is remembered on this device. */
export default function EmailVerify({ onVerified }) {
  const [email, setEmail] = useState(savedEmail());
  const [verified, setVerified] = useState(!!savedEmail());
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (verified) return <div className="verify-box"><span className="chip ok"><Icon name="check" size={14} /> Email verified</span><b style={{ fontSize: '.9em' }}>{email}</b><span className="spacer" /><button type="button" className="btn sm ghost" onClick={() => { localStorage.removeItem('user_email'); setVerified(false); setStep(1); onVerified && onVerified(''); }}>Change</button></div>;
  const send = async () => {
    if (!email || !email.includes('@')) return setMsg('Please enter a valid email address.');
    setBusy(true); setMsg('');
    try {
      const ej = await loadEmailJs(); const c = Math.floor(100000 + Math.random() * 900000);
      await ej.send(EMAILJS.service, EMAILJS.verifyTemplate, { to_email: email, code: c });
      setSent(c); setStep(2); setMsg(`A verification code was sent to ${email}.`);
    } catch (e) { setMsg('Could not send the code: ' + (e.text || e.message || 'please try again')); }
    setBusy(false);
  };
  const confirm = () => {
    if (String(code).trim() === String(sent)) { localStorage.setItem('user_email', email); setVerified(true); onVerified && onVerified(email); }
    else setMsg('Invalid code.');
  };
  return (
    <div className="verify-box">
      {step === 1 ? <>
        <div className="field"><label htmlFor="ve">Verify your email</label><input id="ve" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
        <button type="button" className="btn navy" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
      </> : <>
        <div className="field"><label htmlFor="vc">6-digit code</label><input id="vc" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" /></div>
        <button type="button" className="btn gold" onClick={confirm}>Confirm</button>
        <button type="button" className="btn ghost sm" onClick={() => setStep(1)}>Back</button>
      </>}
      {msg && <div className="hint" style={{ flexBasis: '100%' }}>{msg}</div>}
    </div>
  );
}
