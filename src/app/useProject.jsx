import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, projectBase } from '../lib/api.js';
import { buildIndex } from '../lib/tree.js';

export function useToast() {
  const [msg, setMsg] = useState('');
  const t = useRef();
  const show = useCallback((m, ms = 2600) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(''), ms); }, []);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [show, node];
}

/** Loads one project bundle and applies edits optimistically (local first, then the server). */
export function useProject(mode, key, toast) {
  const base = projectBase(mode, key);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(0);
  const queue = useRef(Promise.resolve());
  const load = useCallback(async () => {
    try { setData(await api.get(base)); setError(''); } catch (e) { setError(e.message); }
  }, [base]);
  useEffect(() => { load(); }, [load]);
  const idx = useMemo(() => data ? buildIndex(data.persons, data.families) : null, [data]);

  const applyLocal = (d, ops) => {
    let persons = d.persons, families = d.families;
    const up = new Map((ops.upsertPersons || []).map(p => [p.id, p]));
    const uf = new Map((ops.upsertFamilies || []).map(f => [f.id, f]));
    persons = persons.map(p => up.has(p.id) ? { ...p, ...up.get(p.id) } : p).concat([...up.values()].filter(p => !d.persons.some(x => x.id === p.id)));
    families = families.map(f => uf.has(f.id) ? { ...f, ...uf.get(f.id) } : f).concat([...uf.values()].filter(f => !d.families.some(x => x.id === f.id)));
    const dp = new Set(ops.deletePersons || []), df = new Set(ops.deleteFamilies || []);
    persons = persons.filter(p => !dp.has(p.id)); families = families.filter(f => !df.has(f.id));
    const documents = dp.size ? d.documents.map(x => dp.has(x.person_id) ? { ...x, person_id: null } : x) : d.documents;
    return { ...d, persons, families, documents };
  };
  const send = (fn) => {
    setSaving(s => s + 1);
    const p = queue.current.then(fn).catch(e => { toast && toast('Not saved: ' + e.message, 5000); load(); throw e; }).finally(() => setSaving(s => s - 1));
    queue.current = p.catch(() => {});
    return p;
  };
  const apply = useCallback((ops, log) => {
    const clean = { ...ops }; delete clean.newId;
    setData(d => applyLocal(d, clean));
    return send(() => api.post(base + '/ops', { ...clean, log }));
  }, [base]);
  const updateProject = useCallback((patch, log) => {
    setData(d => ({ ...d, project: { ...d.project, ...patch, data: patch.data ? patch.data : d.project.data } }));
    return send(() => api.put(base, { ...patch, log }));
  }, [base]);
  const createDoc = useCallback(async meta => {
    const doc = await send(() => api.post(base + '/documents', meta));
    setData(d => ({ ...d, documents: [...d.documents, doc] }));
    return doc;
  }, [base]);
  const updateDoc = useCallback((id, patch) => {
    setData(d => ({ ...d, documents: d.documents.map(x => x.id === id ? { ...x, ...patch } : x) }));
    return send(() => api.put(`${base}/documents/${id}`, patch));
  }, [base]);
  const uploadFile = useCallback(async (docId, file) => {
    if (file.size > 25 * 1024 * 1024) throw new Error('Files up to 25 MB');
    const doc = await send(() => api.upload(`${base}/documents/${docId}/file`, file));
    setData(d => ({ ...d, documents: d.documents.map(x => x.id === docId ? doc : x) }));
    return doc;
  }, [base]);
  const deleteDoc = useCallback(id => {
    setData(d => ({ ...d, documents: d.documents.filter(x => x.id !== id) }));
    return send(() => api.del(`${base}/documents/${id}`));
  }, [base]);
  const fileUrl = (docId, inline) => `${base}/documents/${docId}/file${inline ? '?inline=1' : ''}`;
  return { data, idx, error, saving, load, apply, updateProject, createDoc, updateDoc, uploadFile, deleteDoc, fileUrl, base, mode };
}
