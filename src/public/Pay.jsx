import Icon from '../components/Icon.jsx';
export default function Pay() {
  return (
    <>
      <div className="page-head"><div className="in"><div className="eyebrow">Payment</div><h1>Secure Payment Portal</h1><p>Please proceed with Wise to complete your transaction securely via bank transfer or card.</p></div></div>
      <section className="section">
        <div className="card pay-card">
          <div style={{ fontSize: '2em', fontWeight: 700, color: '#163300', letterSpacing: '-.02em' }}>wise</div>
          <p className="muted">Fast and secure international bank transfers (Wire/ACH) directly into our account.</p>
          <a className="btn gold block" href="https://wise.com/pay/me/moishew11?utm_source=request_flow" target="_blank" rel="noopener"><Icon name="card" /> Proceed to pay</a>
          <p className="hint" style={{ marginTop: 14 }}>Additional payment methods will be available soon.</p>
        </div>
      </section>
    </>
  );
}
