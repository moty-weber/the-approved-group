import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';

export default function Settings({ me, toast }) {
  const [users, setUsers] = useState([]);
  const [nu, setNu] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [pw, setPw] = useState({ current: '', password: '' });
  const [site, setSite] = useState(null); const [code, setCode] = useState('');
  const load = () => me.role === 'admin' && api.get('/api/users').then(setUsers);
  useEffect(() => { load(); fetch('/api/site').then(r => r.json()).then(setSite); }, []);
  const addUser = async e => { e.preventDefault(); try { await api.post('/api/users', nu); setNu({ name: '', email: '', password: '', role: 'staff' }); toast('User added'); load(); } catch (x) { toast(x.message); } };
  const changePw = async e => { e.preventDefault(); try { await api.put('/api/users/me', pw); setPw({ current: '', password: '' }); toast('Password changed'); } catch (x) { toast(x.message); } };
  const setClosed = async closed => { await api.put('/api/site', { closed }); setSite({ ...site, closed }); toast(closed ? 'Website is now closed (passcode overlay)' : 'Website is now open to everyone'); };
  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: '1.6em' }}>Team & settings</h1>
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>My password</h3>
        <form onSubmit={changePw} className="grid2">
          <div className="field"><label htmlFor="s-c">Current password</label><input id="s-c" type="password" autoComplete="current-password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required /></div>
          <div className="field"><label htmlFor="s-n">New password (8+ characters)</label><input id="s-n" type="password" autoComplete="new-password" minLength={8} value={pw.password} onChange={e => setPw({ ...pw, password: e.target.value })} required /></div>
          <div><button className="btn gold sm">Change password</button></div>
        </form>
      </div>
      {me.role === 'admin' && <>
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Team</h3>
          <table className="tbl"><tbody>{users.map(u => <tr key={u.id}><td><b>{u.name || '—'}</b><div className="hint">{u.email}</div></td><td><span className="chip">{u.role}</span></td><td className="hint">{u.last_login ? 'last in ' + new Date(u.last_login).toLocaleDateString() : 'never signed in'}</td><td>{u.id !== me.id && <button className="btn sm ghost danger" onClick={async () => { if (confirm('Remove ' + u.email + '?')) { await api.del('/api/users/' + u.id); load(); } }} aria-label="Remove"><Icon name="trash" size={15} /></button>}</td></tr>)}</tbody></table>
          <form onSubmit={addUser} style={{ marginTop: 12 }}>
            <div className="grid2">
              <div className="field"><label htmlFor="u-n">Name</label><input id="u-n" value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} /></div>
              <div className="field"><label htmlFor="u-e">Email</label><input id="u-e" type="email" value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} required /></div>
              <div className="field"><label htmlFor="u-p">Temporary password</label><input id="u-p" type="text" minLength={8} value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} required /></div>
              <div className="field"><label htmlFor="u-r">Role</label><select id="u-r" value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
            </div>
            <button className="btn sm gold"><Icon name="plus" size={15} /> Add team member</button>
          </form>
        </div>
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05em' }}>Website “closed” overlay</h3>
          <p className="hint" style={{ marginTop: 0 }}>The home page shows “Website Is Currently Closed” with a passcode box (as on the current site) while this is on.</p>
          {site && <div className="row"><span className={'chip ' + (site.closed ? 'warn' : 'ok')}>{site.closed ? 'Closed (passcode needed)' : 'Open'}</span><button className="btn sm" onClick={() => setClosed(!site.closed)}>{site.closed ? 'Open the website' : 'Close the website'}</button></div>}
          <form className="row" style={{ marginTop: 10 }} onSubmit={async e => { e.preventDefault(); await api.put('/api/site', { code }); setCode(''); toast('Passcode changed'); }}><input className="input" style={{ maxWidth: 200 }} placeholder="New passcode" value={code} onChange={e => setCode(e.target.value)} required aria-label="New passcode" /><button className="btn sm">Change passcode</button></form>
        </div>
      </>}
    </div>
  );
}
