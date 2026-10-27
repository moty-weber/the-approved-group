import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
export default function Guide() {
  return (
    <>
      <div className="page-head"><div className="in"><div className="eyebrow">Submission Guide</div><h1>How to complete your Ancestry Map</h1><p>Everything our legal team needs to see the bloodline bridge between you and your European ancestor.</p></div></div>
      <section className="section prose">
        <div className="row" style={{ marginBottom: 24 }}>
          <a className="btn gold" href="/guide.pdf" target="_blank" rel="noopener"><Icon name="download" /> Download the PDF guide</a>
          <a className="btn" href="/family-tree-template.png" download><Icon name="tree" /> Family tree template (PNG)</a>
          <Link className="btn" to="/family-tree">Open the Family Tree form</Link>
        </div>
        <h2>1. Purpose of the Ancestry Map</h2>
        <p>The Ancestry Map is designed to provide our legal team with a clear “bloodline bridge” between you and your European ancestor. This document serves as the foundation for your citizenship claim.</p>
        <h2>2. The Golden Rule: Lineage Only</h2>
        <p>Do not feel pressured to fill out every single box. We only require information for the <b>direct branch</b> that connects you to Europe. If a relative is not part of that specific chain, their details are not required for this application.</p>
        <h2>3. Completing the Frames (EU Side)</h2>
        <p><b>Applicant (Level 1):</b> This is you. Provide your full legal name as it appears on your birth certificate.</p>
        <p><b>EU Parent/Grandparent:</b> These are the frames labeled “EU SIDE”. These boxes must be filled with the individuals who hold the European connection.</p>
        <p><b>Spousal Frames:</b> Next to each EU ancestor, provide the details of their legal spouse. This is necessary to verify marriage records and legitimacy for citizenship laws.</p>
        <h2>4. Data Accuracy (Critical)</h2>
        <p>Legal authorities in Europe are extremely strict regarding dates and spellings. Please follow these rules:</p>
        <ul>
          <li><b>Full Legal Name:</b> Use original spellings found on official documents. Do not use nicknames.</li>
          <li><b>D.O.B (Date of Birth):</b> Use the format (DD/MM/YYYY) if possible to avoid confusion.</li>
          <li><b>P.O.B (Place of Birth):</b> List the specific city/town and country.</li>
          <li><b>D.O.M (Date of Marriage):</b> Provide the legal date of marriage. If unknown, please indicate “Unknown”.</li>
        </ul>
        <h2>5. Submission Process</h2>
        <p>Once you have completed the relevant frames, verify your email at the bottom of the page. After successful verification, click “Submit Structure”. Your data will be sent directly to our secure legal database for immediate review.</p>
        <div className="notice"><b>Important Legal Note:</b> Submission of this map does not guarantee citizenship. Our team will verify the data against historical records to determine the feasibility of your case. Accuracy is the single most important factor in your success.</div>
      </section>
    </>
  );
}
