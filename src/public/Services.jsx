import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { COUNTRIES, DISCLAIMER } from '../lib/rules.js';

export default function Services() {
  return (
    <>
      <div className="page-head"><div className="in">
        <div className="eyebrow">Services</div>
        <h1>What we do for your family</h1>
        <p>Citizenship by ancestry, residency for young couples, and the meticulous archive research behind every file.</p>
      </div></div>
      <section className="section">
        <div className="cards" style={{ marginTop: 0 }}>
          <div className="svc"><div className="ic"><Icon name="globe" /></div><h3>EU Citizenship by Ancestry</h3><p>Many descendants of European citizens — including families whose rights were taken by persecution and displacement — are entitled to a European passport by heritage. We build the bloodline bridge between you and your ancestor and prepare the file.</p></div>
          <div className="svc"><div className="ic"><Icon name="home" /></div><h3>EU Residency / Work Permits</h3><p>Young married couples in Antwerp and across Belgium are often forced to leave every three months to reset a 90-day visa. Through family reunification and ancestry routes we work towards permanent, stable status.</p></div>
          <div className="svc"><div className="ic"><Icon name="book" /></div><h3>Archive Research — “The Grill”</h3><p>Our network of researchers works with municipal, religious and military archives in Europe to find birth records, marriage acts and citizenship papers — or a legal equivalent when the original is lost.</p></div>
          <div className="svc"><div className="ic"><Icon name="scale" /></div><h3>Legal Consultation</h3><p>Before documents are collected, we look at which country and which ancestor give your family the strongest legal basis.</p></div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="eyebrow">Countries</div>
        <h2>Ancestry routes at a glance</h2>
        <p className="lead">Which route fits depends on where — and when — your ancestor lived. Borders in Central and Eastern Europe moved many times; a town in today’s Ukraine may have been Hungarian, Czechoslovak or Polish in your grandfather’s day. We check it for you.</p>
        <div className="country-grid">
          {Object.entries(COUNTRIES).filter(([k]) => k !== 'OTHER').map(([k, c]) => (
            <div key={k} className="card country"><div className="flag" aria-hidden="true">{c.flag}</div><h3>{c.name}</h3><div className="route">{c.route}</div><p>{c.summary}</p></div>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 14 }}>{DISCLAIMER}</p>
        <div className="row" style={{ marginTop: 18 }}><Link className="btn gold" to="/family-tree">Build your family tree</Link><Link className="btn" to="/contact">Talk to the founders</Link></div>
      </section>
    </>
  );
}
