import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectView from './ProjectView.jsx';
import { useProject, useToast } from './useProject.jsx';

export default function ClientPortal() {
  const { token } = useParams();
  const [toast, toastNode] = useToast();
  const ctx = useProject('client', token, toast);
  useEffect(() => { document.title = 'Your family tree | The Approved Group'; }, []);
  return (
    <div className="app" style={{ height: '100dvh', overflow: 'hidden' }}>
      <header className="app-top">
        <a href="/" className="brand"><img src="/logo.png" alt="" width="32" height="32" /><span><b style={{ fontSize: '.95em' }}>The Approved Group</b><small>Your family tree</small></span></a>
      </header>
      <div className="app-main full" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {ctx.error ? <div className="empty">{ctx.error}</div> : !ctx.data ? <div className="empty">Loading…</div> : <ProjectView ctx={ctx} toast={toast} mode="client" />}
      </div>
      {toastNode}
    </div>
  );
}
