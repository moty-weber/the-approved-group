import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import SiteGate from './SiteGate.jsx';
import EmailVerify from './EmailVerify.jsx';
import { savedEmail } from './emailjs.js';

export function Inquiry() {
  const [email, setEmail] = useState(savedEmail());
  const [err, setErr] = useState('');
  const onSubmit = e => { if (!email) { e.preventDefault(); setErr('Please verify your email first!'); } };
  return (
    <div className="card inquiry" id="inquiry">
      <div className="eyebrow">Confidential inquiry</div>
      <h2 style={{ marginTop: 6 }}>Start your case</h2>
      <p className="muted" style={{ marginTop: 0 }}>Tell us about your situation. Your details go directly to our team.</p>
      <EmailVerify onVerified={setEmail} />
      {err && <div className="notice err" style={{ marginBottom: 12 }}>{err}</div>}
      <form action="https://formspree.io/f/xdayrong" method="POST" onSubmit={onSubmit}>
        <div className="grid2">
          <div className="field"><label htmlFor="q-name">Full name</label><input id="q-name" name="name" required autoComplete="name" /></div>
          <div className="field"><label htmlFor="q-phone">Phone number</label><input id="q-phone" name="phone" type="tel" required autoComplete="tel" /></div>
        </div>
        <div className="field"><label htmlFor="q-email">Email address (verified)</label><input id="q-email" name="email" type="email" required readOnly value={email} placeholder="Verify your email above" /></div>
        <div className="field"><label htmlFor="q-obj">Primary objective</label>
          <select id="q-obj" name="objective" required defaultValue="">
            <option value="" disabled>Select inquiry type…</option>
            <option value="citizenship">EU Citizenship by Ancestry</option>
            <option value="residency">EU Residency / Work Permits</option>
            <option value="consultation">Legal Consultation</option>
            <option value="other">Other</option>
          </select></div>
        <div className="field"><label htmlFor="q-msg">Additional details</label><textarea id="q-msg" name="message" rows={4} /></div>
        <button className="btn gold block" type="submit">Submit inquiry</button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteGate />
      <section className="hero">
        <video autoPlay muted loop playsInline preload="metadata" poster="/preview.png"><source src="/hero-video.mp4" type="video/mp4" /></video>
        <div className="in">
          <div className="eyebrow">Expert EU Citizenship Consultancy</div>
          <h1>Your ancestry is a legal key to the European Union.</h1>
          <p>Secure your future in Europe with The Approved Group — premier consultancy for EU citizenship by ancestry and residency applications.</p>
          <div className="row">
            <Link className="btn gold" to="/family-tree"><Icon name="tree" /> Build your family tree</Link>
            <a className="btn" href="#inquiry" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>Confidential inquiry</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">What we do</div>
        <h2>Transforming ancestral history into legal rights</h2>
        <p className="lead">For too long, families were left to struggle alone against European courts and municipal archives. We bridge that void — from archival research in Poland to residency files in the heart of Belgium.</p>
        <div className="cards">
          <div className="svc"><div className="ic"><Icon name="globe" /></div><h3>EU Citizenship by Ancestry</h3><p>Reclaim the status your grandparents held. Many descendants are entitled to a European passport by heritage.</p></div>
          <div className="svc"><div className="ic"><Icon name="home" /></div><h3>EU Residency & Work Permits</h3><p>End the 90-day cycle. Family reunification and residency files for young couples in Antwerp and across Belgium.</p></div>
          <div className="svc"><div className="ic"><Icon name="book" /></div><h3>Archival Research</h3><p>Birth records from 1890, military papers from 1920, marriage acts from pre-war municipalities — found and verified.</p></div>
          <div className="svc"><div className="ic"><Icon name="scale" /></div><h3>Legal Consultation</h3><p>A clear strategy for your file before you collect a single document.</p></div>
        </div>
        <div style={{ marginTop: 22 }}><Link to="/services" className="btn">All services & countries →</Link></div>
      </section>

      <section className="dark">
        <div className="section">
          <div className="eyebrow">How it works</div>
          <h2>From family tree to European passport</h2>
          <div className="steps" style={{ color: 'var(--ink)' }}>
            <div className="step"><b>Map your ancestry</b><span className="muted">Fill in the direct branch that connects you to Europe — names, dates and places.</span></div>
            <div className="step"><b>Verify & submit</b><span className="muted">Verify your email and send the structure securely to our team.</span></div>
            <div className="step"><b>We verify the records</b><span className="muted">Our team checks the data against historical records to assess your case.</span></div>
            <div className="step"><b>Documents & filing</b><span className="muted">We locate the archive records, prepare the file and follow it through.</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="quote">“Why wait in line as a stranger when you are legally a son of the soil? Your ancestry is not just a story — it is a legal key to the European Union.”</p>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <Inquiry />
      </section>
    </>
  );
}
