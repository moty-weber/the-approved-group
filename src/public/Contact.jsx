import Icon from '../components/Icon.jsx';
import { Inquiry } from './Home.jsx';
export default function Contact() {
  return (
    <>
      <div className="page-head"><div className="in">
        <div className="eyebrow">Direct Leadership</div>
        <h1>Contact the Founders</h1>
        <p>Moishe and Boruch remain personally involved in the strategic direction of every high-stakes case.</p>
      </div></div>
      <section className="section">
        <div className="prose" style={{ marginBottom: 30 }}>
          <h2>A Legacy of Advocacy</h2>
          <p>The Approved Foundation was established on a singular premise: that the complex legal rights of the global Jewish community should never be left to chance. Founded by <b>Moishe Weiss</b> and <b>Boruch Goldstein</b>, our organization grew out of a profound understanding of the “void” that existed in European citizenship and residency services.</p>
          <p>After years of navigating the intricate systems of the <b>European Union</b>—from archival research in Poland to residency litigation in the heart of Belgium—our founders decided to consolidate their expertise. We moved from individual consulting to a structured organization, built specifically to provide the “Grill” and the hard work required to break through administrative barriers.</p>
          <p>Today, Moishe and Boruch remain personally involved in the strategic direction of every high-stakes case. Whether it is heritage citizenship for descendants of Holocaust survivors or long-term residency for young couples in Antwerp, our leadership ensures that justice is pursued with integrity and personal attention.</p>
        </div>
        <div className="people">
          <div className="card person-card">
            <h3>Moishe Weiss</h3><div className="role">Co-Founder & Operations Lead</div>
            <a className="btn" href="tel:+32492617249"><Icon name="phone" /> Call: +32 492 61 72 49</a>
            <a className="btn" href="https://wa.me/18454183135" target="_blank" rel="noopener"><Icon name="chat" /> Message on WhatsApp</a>
            <a className="btn" href="mailto:moishe@approvedeu.com"><Icon name="mail" /> moishe@approvedeu.com</a>
          </div>
          <div className="card person-card">
            <h3>Boruch Goldstein</h3><div className="role">Co-Founder & Legal Strategy</div>
            <a className="btn" href="tel:+32470912705"><Icon name="phone" /> Call: +32 470 91 27 05</a>
            <a className="btn" href="mailto:boruch@approvedeu.com"><Icon name="mail" /> boruch@approvedeu.com</a>
          </div>
          <div className="card person-card">
            <h3>General</h3><div className="role">The Approved Group</div>
            <a className="btn" href="mailto:info@approvedeu.com"><Icon name="mail" /> info@approvedeu.com</a>
            <a className="btn" href="tel:+32470912705"><Icon name="phone" /> +32 470 91 27 05</a>
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}><Inquiry /></section>
    </>
  );
}
