import { Link } from 'react-router-dom';

const VOLS = [
  ['Volume I', 'Institutional Advocacy', [
    <>The Approved Group was established as more than a service provider; it was founded as an <b>Organization of Legal Restitution</b>. For too long, our community operated within a vacuum, where individual families were left to struggle against the formidable bureaucracy of European courts and municipal archives. We stepped in to bridge that void, transforming ancestral history into functional legal rights.</>,
    <>Our operation is rooted in the belief that historical justice is a continuous process. While we navigate the technicalities of <b>Jus Sanguinis</b> and modern restitution statutes, our ultimate focus remains on the person behind the file. We advocate for the student in Antwerp, the business leader in London, and the family in Monsey—all seeking to reclaim what was once stolen by time and displacement.</>]],
  ['Volume II', 'The Border & The Birthright', [
    <>A disturbing reality exists today: thousands of <b>American Jews</b> find themselves waiting for hours in exhausting border queues when entering the EU. They stand as “foreigners” on the very soil where their grandfathers were recognized citizens.</>,
    <>This is a legal paradox. Under current EU restitution laws, many of these individuals possess the inherent <b>Right of Return</b>. They are entitled to European passports by heritage, yet they remain unaware or intimidated by the process. Our organization works tirelessly to correct this. We help American families reclaim their status, allowing them to enter Europe with the dignity of a citizen, skipping the lines and securing their permanent right to the continent.</>]],
  ['Volume III', 'Ending the 90-Day Exile', [
    <>In the heart of Antwerp and across Belgium, many young married couples from across the globe find themselves trapped in a cycle of instability. Without proper status, they are forced to leave the country every three months to “reset” their 90-day visa, disrupting their lives, their studies, and their families.</>,
    <>Our organization has made it a priority to end this cycle of “exile.” Through expert application of <b>Family Reunification</b> laws and ancestry restitution, we help these couples secure their permanent residency and European passports. No longer do they have to live in fear of the calendar; we provide the legal stability needed to build a home in Belgium with full rights and security.</>]],
  ['Volume IV', 'The Labor of Justice', [
    <>We do not operate like a typical business. We are an organization that “sweats” for the community. Every file is a battle against bureaucratic inertia. We provide <span lang="yi">מה שמען רופט</span> <b>“The Grill”</b>—the intense, meticulous research required to find birth records from 1890, military papers from 1920, and marriage acts from pre-war municipalities.</>,
    <>While a business might seek the easiest path, we seek the most just one. We engage with historians and genealogical experts to verify family trees that were shattered by the Holocaust. Every minute we spend in an archive in Poland or Germany is a minute dedicated to the restoration of a family’s rightful status.</>]],
];
const FAQ1 = [
  ['What if I don’t have my grandfather’s birth certificate?', 'This is where our organization excels. We utilize a network of researchers to access closed municipal and military archives in Europe. In many cases, we can retrieve a legal equivalent.'],
  ['Does an American citizen lose their US passport by obtaining an EU one?', 'Absolutely not. The United States and most EU nations fully recognize dual citizenship. You retain all your American rights.'],
  ['How many generations back can we go?', 'Generally, if your ancestor was a citizen after 1918 or persecuted between 1933-1945, there is a strong legal basis.'],
];
const FAQ2 = [
  ['Why are young couples forced to leave Belgium every 3 months?', 'They enter on 90-day tourist visas. Without official status, their stay is temporary. We convert this into permanent residency through ancestry or family reunification laws.'],
  ['What is the “Annex 3bis”?', 'A complex sponsorship document. Our organization provides the legal “Grill” to ensure this is accepted without delay.'],
];
export default function About() {
  return (
    <>
      <div className="page-head"><div className="in">
        <div className="eyebrow">Sovereign Restitution & Heritage Organization</div>
        <h1>Foundation Archive</h1>
        <p>A definitive database of legal restitution, historical justice, and our organization’s commitment to the global Jewish community.</p>
      </div></div>
      <section className="section prose">
        {VOLS.map(([v, t, ps]) => <div className="vol" key={v}><div className="eyebrow">{v}</div><h2>{t}</h2>{ps.map((p, i) => <p key={i}>{p}</p>)}</div>)}
        <p className="quote">“Why wait in line as a stranger when you are legally a son of the soil? Your ancestry is not just a story—it is a legal key to the European Union.”</p>
      </section>
      <section className="section faq" style={{ paddingTop: 0 }}>
        <div className="eyebrow">Knowledge Base</div>
        <h2>Technical FAQ & Legal Portfolios</h2>
        <div className="grid2" style={{ gap: 24, alignItems: 'start' }}>
          <div><h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Restitution & Ancestry FAQ</h3>{FAQ1.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}<Link to="/contact" className="hint">For further questions, contact our founders for direct clarification →</Link></div>
          <div><h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Belgian Residency FAQ</h3>{FAQ2.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}<Link to="/contact" className="hint">For further questions, contact our founders for direct clarification →</Link></div>
        </div>
      </section>
      <section className="dark"><div className="section" style={{ textAlign: 'center' }}>
        <div className="eyebrow">Interactive Legal Strategy Portfolio</div>
        <h2>Secure Your Legacy</h2>
        <p className="lead" style={{ margin: '0 auto 20px' }}>The Approved Group Organization is a global legal body dedicated to the restitution of Jewish heritage and EU citizenship rights. We stand as a shield for the Diaspora.</p>
        <Link to="/family-tree" className="btn gold">Start Your Mission</Link>
      </div></section>
    </>
  );
}
