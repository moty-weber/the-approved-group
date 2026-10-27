import { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { DOC_TYPES, DOC_STATUSES } from '../lib/rules.js';

const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const ext = d => (d.filename || '').split('.').pop().toUpperCase().slice(0, 4) || 'DOC';

export function StatusSelect({ value, onChange, disabled }) {
  return <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={'st-' + value} aria-label="Status">{DOC_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
}

/** One document row: icon, type, file, status, view/download/upload/delete. */
export function DocRow({ doc, P, onUpdate, onUpload, onDelete, fileUrl, showPerson, readOnly }) {
  const inp = useRef(null);
  const [busy, setBusy] = useState(false);
  const pick = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; setBusy(true); try { await onUpload(doc.id, f); } catch (err) { alert(err.message); } setBusy(false); };
  const person = showPerson && doc.person_id && P.get(doc.person_id);
  return (
    <div className="doc-row">
      <div className="ic">{doc.size ? ext(doc) : <Icon name="doc" size={16} />}</div>
      <div className="t">
        <b>{DOC_TYPES[doc.doc_type] || doc.doc_type}{person ? <span className="muted" style={{ fontWeight: 400 }}> · {[person.given, person.surname].filter(Boolean).join(' ')}</span> : null}</b>
        <small>{busy ? 'Uploading…' : doc.size ? `${doc.filename} · ${fmtSize(doc.size)}` : (doc.notes || 'No file yet')}</small>
      </div>
      <StatusSelect value={doc.status} onChange={v => onUpdate(doc.id, { status: v })} disabled={readOnly && false} />
      {doc.size > 0 && <a className="btn sm ghost" href={fileUrl(doc.id, true)} target="_blank" rel="noopener" title="View" aria-label="View"><Icon name="eye" size={16} /></a>}
      <button className="btn sm ghost" title={doc.size ? 'Replace file' : 'Upload file'} aria-label="Upload" onClick={() => inp.current.click()}><Icon name="upload" size={16} /></button>
      {!readOnly && onDelete && <button className="btn sm ghost danger" title="Delete" aria-label="Delete" onClick={() => confirm('Delete this document?') && onDelete(doc.id)}><Icon name="trash" size={16} /></button>}
      <input ref={inp} type="file" accept="application/pdf,image/*,.doc,.docx" hidden onChange={pick} />
    </div>
  );
}

/** "Add a document" control: pick type, then file (or just add as a needed item). */
export function AddDoc({ personId, onCreate, onUpload, defaultType = 'birth_cert' }) {
  const [type, setType] = useState(defaultType);
  const inp = useRef(null);
  const [busy, setBusy] = useState(false);
  const withFile = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    setBusy(true);
    try { const d = await onCreate({ person_id: personId, doc_type: type, status: 'received' }); await onUpload(d.id, f); } catch (err) { alert(err.message); }
    setBusy(false);
  };
  return (
    <div className="row" style={{ marginTop: 10 }}>
      <select className="input" style={{ flex: '1 1 160px', minHeight: 38 }} value={type} onChange={e => setType(e.target.value)} aria-label="Document type">
        {Object.entries(DOC_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <button className="btn gold sm" disabled={busy} onClick={() => inp.current.click()}><Icon name="upload" size={15} /> {busy ? 'Uploading…' : 'Upload'}</button>
      <button className="btn sm" onClick={() => onCreate({ person_id: personId, doc_type: type, status: 'needed' })}>+ As needed</button>
      <input ref={inp} type="file" accept="application/pdf,image/*,.doc,.docx" hidden onChange={withFile} />
    </div>
  );
}

/** Requirement line from the country rules, with its document(s) or a one-tap way to create/upload one. */
export function ReqRow({ r, onCreate, onUpdate, onUpload, fileUrl }) {
  const inp = useRef(null);
  const [busy, setBusy] = useState(false);
  const doc = r.docs[0];
  const setStatus = async v => { if (doc) onUpdate(doc.id, { status: v }); else await onCreate({ person_id: r.personId, doc_type: r.type, status: v, notes: r.why }); };
  const pick = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return; setBusy(true);
    try { const d = doc || await onCreate({ person_id: r.personId, doc_type: r.type, status: 'received', notes: r.why }); await onUpload(d.id, f); } catch (err) { alert(err.message); }
    setBusy(false);
  };
  return (
    <div className="doc-row">
      <div className="ic" style={{ background: r.done ? '#e3f4ea' : '#fbe4e1', color: r.done ? 'var(--ok)' : 'var(--err)' }}>{r.done ? <Icon name="check" size={16} /> : <Icon name="doc" size={16} />}</div>
      <div className="t">
        <b>{DOC_TYPES[r.type]}{r.optional ? <span className="muted" style={{ fontWeight: 400 }}> · if applicable</span> : ''}</b>
        <small title={r.why}>{busy ? 'Uploading…' : doc && doc.size ? `📎 ${doc.filename}` : r.why}</small>
      </div>
      <StatusSelect value={r.status} onChange={setStatus} />
      {doc && doc.size > 0 && <a className="btn sm ghost" href={fileUrl(doc.id, true)} target="_blank" rel="noopener" aria-label="View"><Icon name="eye" size={16} /></a>}
      <button className="btn sm ghost" aria-label="Upload" title="Upload" onClick={() => inp.current.click()}><Icon name="upload" size={16} /></button>
      <input ref={inp} type="file" accept="application/pdf,image/*,.doc,.docx" hidden onChange={pick} />
    </div>
  );
}
