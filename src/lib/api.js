async function req(method, url, body, opts = {}) {
  const init = { method, headers: {}, credentials: 'same-origin' };
  if (body instanceof Blob || body instanceof ArrayBuffer) { init.body = body; Object.assign(init.headers, opts.headers || {}); }
  else if (body !== undefined) { init.body = JSON.stringify(body); init.headers['content-type'] = 'application/json'; }
  const r = await fetch(url, init);
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : await r.text();
  if (!r.ok) { const e = new Error((data && data.error) || `Request failed (${r.status})`); e.status = r.status; throw e; }
  return data;
}
export const api = {
  get: u => req('GET', u), post: (u, b) => req('POST', u, b ?? {}), put: (u, b) => req('PUT', u, b), del: u => req('DELETE', u),
  upload: (u, file, extra = {}) => req('POST', u, file, { headers: { 'content-type': file.type || 'application/octet-stream', 'x-filename': encodeURIComponent(file.name || 'document'), ...extra } }),
};
/** Base path for a project's API: staff use /api/projects/:id, a client link uses /api/c/:token */
export const projectBase = (mode, key) => mode === 'client' ? `/api/c/${encodeURIComponent(key)}` : `/api/projects/${encodeURIComponent(key)}`;
