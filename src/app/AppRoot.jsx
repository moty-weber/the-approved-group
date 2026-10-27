import { useEffect, useState } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import Projects from './Projects.jsx';
import ProjectView from './ProjectView.jsx';
import PrintView from './PrintView.jsx';
import Settings from './Settings.jsx';
import { useProject, useToast } from './useProject.jsx';

function Login({ onDone }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setBusy(true); setErr(''); try { onDone(await api.post('/api/login', { email, password: pw })); } catch (x) { setErr(x.message); } setBusy(false); };
  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit}>
        <img className="logo" src="/logo.png" alt="The Approved Group" />
        <h1 style={{ textAlign: 'center', fontSize: '1.5em' }}>Case Manager</h1>
        <p className="hint" style={{ textAlign: 'center', marginTop: -6 }}>Staff sign-in</p>
        <div className="field"><label htmlFor="l-e">Email</label><input id="l-e" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div className="field"><label htmlFor="l-p">Password</label><input id="l-p" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required /></div>
        {err && <div className="notice err" style={{ marginBottom: 10 }}>{err}</div>}
        <button className="btn gold block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p style={{ textAlign: 'center', marginBottom: 0 }}><Link to="/" className="hint">← Back to the website</Link></p>
      </form>
    </div>
  );
}

function ProjectRoute({ toast }) {
  const { id } = useParams();
  const ctx = useProject('staff', id, toast);
  if (ctx.error) return <div className="empty">{ctx.error} · <Link to="/app">All projects</Link></div>;
  if (!ctx.data) return <div className="empty">Loading project…</div>;
  return <ProjectView ctx={ctx} toast={toast} />;
}
function PrintRoute() {
  const { id } = useParams();
  const ctx = useProject('staff', id);
  if (!ctx.data) return <div className="empty">{ctx.error || 'Loading…'}</div>;
  return <PrintView ctx={ctx} />;
}

export default function AppRoot() {
  const [me, setMe] = useState(undefined);
  const [toast, toastNode] = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => { api.get('/api/me').then(setMe).catch(() => setMe(null)); document.title = 'Case Manager | The Approved Group'; }, []);
  if (me === undefined) return <div className="empty">Loading…</div>;
  if (!me) return <Login onDone={setMe} />;
  const logout = async () => { await api.post('/api/logout'); setMe(null); nav('/app'); };
  const isProject = /^\/app\/p\/[^/]+\/?$/.test(loc.pathname);
  return (
    <div className="app" style={isProject ? { height: '100dvh', overflow: 'hidden' } : null}>
      <header className="app-top no-print">
        <Link to="/app" className="brand"><img src="/logo.png" alt="" width="32" height="32" /><span><b style={{ fontSize: '.95em' }}>Approved</b><small>Case Manager</small></span></Link>
        <span className="spacer" />
        <Link to="/app/settings" className="btn ghost sm" title="Team & settings"><Icon name="settings" size={18} /><span className="hide-sm">{me.name || me.email}</span></Link>
        <button className="btn ghost sm" onClick={logout} title="Sign out" aria-label="Sign out"><Icon name="logout" size={18} /></button>
      </header>
      <div className={isProject ? 'app-main full' : 'app-main'} style={isProject ? { flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' } : null}>
        <Routes>
          <Route index element={<Projects toast={toast} />} />
          <Route path="p/:id" element={<ProjectRoute toast={toast} />} />
          <Route path="p/:id/print" element={<PrintRoute />} />
          <Route path="settings" element={<Settings me={me} toast={toast} />} />
        </Routes>
      </div>
      {toastNode}
    </div>
  );
}
