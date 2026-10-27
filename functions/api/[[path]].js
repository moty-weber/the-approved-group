// The Approved Group v2 — API (Cloudflare Pages Function). D1 binding: DB.
// Documents are stored in D1 as ~1.9 MB BLOB chunks (R2 is not enabled on this account).
const CHUNK = 1900000;
const MAX_FILE = 25 * 1024 * 1024;
const SESSION_DAYS = 30;
const enc = new TextEncoder();

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const err = (status, message) => json({ error: message }, status);
const now = () => Date.now();
const rid = (n = 12) => { const a = crypto.getRandomValues(new Uint8Array(n)); const c = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (const b of a) s += c[b % c.length]; return s; };
const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const parse = (s, d = {}) => { try { return JSON.parse(s || ''); } catch { return d; } };

async function pbkdf2(password, saltB64, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: iter }, key, 256);
  return b64(bits);
}
function safeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
async function hashPassword(pw) { const salt = b64(crypto.getRandomValues(new Uint8Array(16))); return { pw_salt: salt, pw_iter: 100000, pw_hash: await pbkdf2(pw, salt, 100000) }; }

function cookies(req) { const o = {}; (req.headers.get('cookie') || '').split(/;\s*/).forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); }); return o; }
const cookie = (name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

async function currentUser(env, req) {
  const t = cookies(req).aeg_s; if (!t) return null;
  const row = await env.DB.prepare('SELECT u.id,u.email,u.name,u.role,s.expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').bind(t).first();
  if (!row || row.expires < now()) return null;
  return row;
}

async function log(env, projectId, who, text) {
  await env.DB.prepare('INSERT INTO activity (project_id,ts,who,text) VALUES (?,?,?,?)').bind(projectId, now(), who || '', text).run();
}
async function touch(env, projectId) { await env.DB.prepare('UPDATE projects SET updated=? WHERE id=?').bind(now(), projectId).run(); }

function projectOut(p, extra = {}) {
  return { id: p.id, name: p.name, status: p.status, data: parse(p.data), client_enabled: !!p.client_enabled, client_token: p.client_token, created: p.created, updated: p.updated, ...extra };
}

async function bundle(env, projectId, forClient) {
  const p = await env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(projectId).first();
  if (!p) return null;
  const [persons, families, docs, act] = await env.DB.batch([
    env.DB.prepare('SELECT id,data,updated FROM persons WHERE project_id=?').bind(projectId),
    env.DB.prepare('SELECT id,data,updated FROM families WHERE project_id=?').bind(projectId),
    env.DB.prepare('SELECT id,person_id,doc_type,status,filename,mime,size,notes,created,updated,uploaded_by FROM documents WHERE project_id=? ORDER BY created').bind(projectId),
    env.DB.prepare('SELECT ts,who,text FROM activity WHERE project_id=? ORDER BY ts DESC LIMIT 80').bind(projectId),
  ]);
  const out = {
    project: projectOut(p),
    persons: persons.results.map(r => ({ id: r.id, ...parse(r.data), _u: r.updated })),
    families: families.results.map(r => ({ id: r.id, ...parse(r.data), _u: r.updated })),
    documents: docs.results,
    activity: forClient ? [] : act.results,
  };
  if (forClient) { delete out.project.client_token; if (out.project.data) delete out.project.data.internal_notes; }
  return out;
}

const PERSON_KEYS = ['given', 'surname', 'maiden', 'hebrew', 'variants', 'sex', 'birth_date', 'birth_place', 'death_date', 'death_place', 'living', 'citizenship', 'religion', 'occupation', 'residence', 'emigration', 'naturalization', 'notes', 'famc', 'is_applicant', 'created_by', 'source', 'label'];
const FAMILY_KEYS = ['husb', 'wife', 'children', 'marr_date', 'marr_place', 'marr_type', 'divorced', 'notes'];
const pick = (o, keys) => { const r = {}; for (const k of keys) if (o[k] !== undefined) r[k] = o[k]; return r; };

async function applyOps(env, projectId, ops, who, client) {
  const stmts = [];
  const t = now();
  const ups = (ops.upsertPersons || []).slice(0, 3000);
  const upf = (ops.upsertFamilies || []).slice(0, 3000);
  for (const p of ups) {
    if (!p.id || typeof p.id !== 'string' || p.id.length > 40) continue;
    const data = JSON.stringify(pick(p, PERSON_KEYS));
    if (data.length > 60000) continue;
    stmts.push(env.DB.prepare('INSERT INTO persons (id,project_id,data,updated) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated=excluded.updated WHERE persons.project_id=excluded.project_id').bind(p.id, projectId, data, t));
  }
  for (const f of upf) {
    if (!f.id || typeof f.id !== 'string' || f.id.length > 40) continue;
    const data = JSON.stringify(pick(f, FAMILY_KEYS));
    stmts.push(env.DB.prepare('INSERT INTO families (id,project_id,data,updated) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated=excluded.updated WHERE families.project_id=excluded.project_id').bind(f.id, projectId, data, t));
  }
  if (!client) {
    for (const id of (ops.deletePersons || [])) {
      stmts.push(env.DB.prepare('DELETE FROM persons WHERE id=? AND project_id=?').bind(id, projectId));
      stmts.push(env.DB.prepare('UPDATE documents SET person_id=NULL WHERE person_id=? AND project_id=?').bind(id, projectId));
    }
    for (const id of (ops.deleteFamilies || [])) stmts.push(env.DB.prepare('DELETE FROM families WHERE id=? AND project_id=?').bind(id, projectId));
  }
  stmts.push(env.DB.prepare('UPDATE projects SET updated=? WHERE id=?').bind(t, projectId));
  for (let i = 0; i < stmts.length; i += 90) await env.DB.batch(stmts.slice(i, i + 90));
  if (ops.log) await log(env, projectId, who, String(ops.log).slice(0, 300));
  return { ok: true, updated: t };
}

async function docUpload(env, req, projectId, docId, who) {
  const doc = await env.DB.prepare('SELECT id FROM documents WHERE id=? AND project_id=?').bind(docId, projectId).first();
  if (!doc) return err(404, 'Document not found');
  const buf = new Uint8Array(await req.arrayBuffer());
  if (!buf.length) return err(400, 'Empty file');
  if (buf.length > MAX_FILE) return err(413, 'File is larger than 25 MB');
  const filename = decodeURIComponent(req.headers.get('x-filename') || 'document').slice(0, 200);
  const mime = (req.headers.get('content-type') || 'application/octet-stream').slice(0, 100);
  await env.DB.prepare('DELETE FROM doc_chunks WHERE doc_id=?').bind(docId).run();
  let n = 0;
  for (let off = 0; off < buf.length; off += CHUNK, n++) {
    await env.DB.prepare('INSERT INTO doc_chunks (doc_id,idx,data) VALUES (?,?,?)').bind(docId, n, buf.slice(off, off + CHUNK)).run();
  }
  const status = req.headers.get('x-status') || 'received';
  await env.DB.prepare('UPDATE documents SET filename=?, mime=?, size=?, chunks=?, updated=?, uploaded_by=?, status=CASE WHEN status IN (\'needed\',\'requested\') THEN ? ELSE status END WHERE id=?')
    .bind(filename, mime, buf.length, n, now(), who, status, docId).run();
  await log(env, projectId, who, `Uploaded ${filename}`);
  await touch(env, projectId);
  return json(await env.DB.prepare('SELECT id,person_id,doc_type,status,filename,mime,size,notes,created,updated,uploaded_by FROM documents WHERE id=?').bind(docId).first());
}

async function docDownload(env, url, projectId, docId) {
  const d = await env.DB.prepare('SELECT * FROM documents WHERE id=? AND project_id=?').bind(docId, projectId).first();
  if (!d || !d.chunks) return err(404, 'No file');
  const inline = url.searchParams.has('inline');
  const { readable, writable } = new TransformStream();
  const wr = writable.getWriter();
  (async () => {
    for (let i = 0; i < d.chunks; i++) {
      const c = await env.DB.prepare('SELECT data FROM doc_chunks WHERE doc_id=? AND idx=?').bind(docId, i).first();
      if (!c) break;
      await wr.write(new Uint8Array(c.data));
    }
    await wr.close();
  })().catch(e => wr.abort(e));
  const fname = (d.filename || 'document').replace(/["\\\r\n]/g, '_');
  return new Response(readable, { headers: {
    'content-type': d.mime || 'application/octet-stream', 'content-length': String(d.size),
    'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="${fname.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(d.filename || 'document')}`,
    'cache-control': 'private, max-age=60', 'x-content-type-options': 'nosniff',
  } });
}

async function docRoutes(env, req, url, projectId, rest, who, client) {
  // rest: [] | [docId] | [docId,'file']
  const m = req.method;
  if (rest.length === 0 && m === 'POST') {
    const b = await req.json();
    const id = rid();
    const t = now();
    await env.DB.prepare('INSERT INTO documents (id,project_id,person_id,doc_type,status,notes,created,updated,uploaded_by) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(id, projectId, b.person_id || null, String(b.doc_type || 'other').slice(0, 60), String(b.status || 'needed').slice(0, 30), String(b.notes || '').slice(0, 2000), t, t, who).run();
    await touch(env, projectId);
    return json(await env.DB.prepare('SELECT id,person_id,doc_type,status,filename,mime,size,notes,created,updated,uploaded_by FROM documents WHERE id=?').bind(id).first());
  }
  const docId = rest[0];
  if (rest[1] === 'file') {
    if (m === 'POST' || m === 'PUT') return docUpload(env, req, projectId, docId, who);
    if (m === 'GET') return docDownload(env, url, projectId, docId);
  }
  if (rest.length === 1 && m === 'PUT') {
    const b = await req.json();
    const cur = await env.DB.prepare('SELECT * FROM documents WHERE id=? AND project_id=?').bind(docId, projectId).first();
    if (!cur) return err(404, 'Not found');
    await env.DB.prepare('UPDATE documents SET doc_type=?, status=?, notes=?, person_id=?, updated=? WHERE id=?')
      .bind(String(b.doc_type ?? cur.doc_type).slice(0, 60), String(b.status ?? cur.status).slice(0, 30), String(b.notes ?? cur.notes ?? '').slice(0, 2000), b.person_id !== undefined ? b.person_id : cur.person_id, now(), docId).run();
    if (b.status && b.status !== cur.status) await log(env, projectId, who, `Document status → ${b.status}`);
    await touch(env, projectId);
    return json(await env.DB.prepare('SELECT id,person_id,doc_type,status,filename,mime,size,notes,created,updated,uploaded_by FROM documents WHERE id=?').bind(docId).first());
  }
  if (rest.length === 1 && m === 'DELETE' && !client) {
    await env.DB.batch([env.DB.prepare('DELETE FROM doc_chunks WHERE doc_id=?').bind(docId), env.DB.prepare('DELETE FROM documents WHERE id=? AND project_id=?').bind(docId, projectId)]);
    await touch(env, projectId);
    return json({ ok: true });
  }
  return err(404, 'Not found');
}

async function rateLimited(env, key) {
  const r = await env.DB.prepare('SELECT n,first FROM login_attempts WHERE k=?').bind(key).first();
  if (!r) return false;
  if (now() - r.first > 15 * 60 * 1000) { await env.DB.prepare('DELETE FROM login_attempts WHERE k=?').bind(key).run(); return false; }
  return r.n >= 10;
}
async function noteFail(env, key) {
  await env.DB.prepare('INSERT INTO login_attempts (k,n,first) VALUES (?,1,?) ON CONFLICT(k) DO UPDATE SET n=n+1').bind(key, now()).run();
}

async function getSetting(env, k, d) { const r = await env.DB.prepare('SELECT v FROM settings WHERE k=?').bind(k).first(); return r ? r.v : d; }

async function handle(req, env) {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const m = req.method;
  const ip = req.headers.get('cf-connecting-ip') || '';

  // ---- public site gate (the original "Website Is Currently Closed" overlay, now checked server-side) ----
  if (parts[0] === 'site') {
    const closed = (await getSetting(env, 'site_closed', '1')) === '1';
    if (m === 'GET' && parts.length === 1) return json({ closed, unlocked: cookies(req).aeg_site === 'ok' });
    if (m === 'POST' && parts[1] === 'unlock') {
      const b = await req.json().catch(() => ({}));
      const k = 'site:' + ip;
      if (await rateLimited(env, k)) return err(429, 'Too many attempts. Try again in 15 minutes.');
      const code = await getSetting(env, 'site_code', '6559154');
      if (String(b.code || '').trim() === code) return json({ ok: true }, 200, { 'set-cookie': cookie('aeg_site', 'ok', 60 * 60 * 24 * 30) });
      await noteFail(env, k);
      return err(403, 'Incorrect passcode.');
    }
    if (m === 'PUT' && parts.length === 1) {
      const u = await currentUser(env, req); if (!u || u.role !== 'admin') return err(403, 'Admins only');
      const b = await req.json();
      if (b.closed !== undefined) await env.DB.prepare('INSERT INTO settings (k,v) VALUES (\'site_closed\',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(b.closed ? '1' : '0').run();
      if (b.code) await env.DB.prepare('INSERT INTO settings (k,v) VALUES (\'site_code\',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(String(b.code).slice(0, 20)).run();
      return json({ ok: true });
    }
  }

  // ---- auth ----
  if (parts[0] === 'login' && m === 'POST') {
    const b = await req.json().catch(() => ({}));
    const email = String(b.email || '').trim().toLowerCase();
    const k = 'login:' + email + ':' + ip;
    if (await rateLimited(env, k)) return err(429, 'Too many attempts. Try again in 15 minutes.');
    const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
    if (!u || !safeEq(await pbkdf2(String(b.password || ''), u.pw_salt, u.pw_iter), u.pw_hash)) { await noteFail(env, k); return err(401, 'Wrong email or password'); }
    const token = rid(32);
    await env.DB.batch([
      env.DB.prepare('INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)').bind(token, u.id, now() + SESSION_DAYS * 86400000),
      env.DB.prepare('UPDATE users SET last_login=? WHERE id=?').bind(now(), u.id),
      env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(now()),
    ]);
    return json({ id: u.id, email: u.email, name: u.name, role: u.role }, 200, { 'set-cookie': cookie('aeg_s', token, SESSION_DAYS * 86400) });
  }
  if (parts[0] === 'logout') {
    const t = cookies(req).aeg_s; if (t) await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(t).run();
    return json({ ok: true }, 200, { 'set-cookie': cookie('aeg_s', '', 0) });
  }

  // ---- client portal (no login; a per-project secret link the staff can switch on/off) ----
  if (parts[0] === 'c' && parts[1]) {
    const p = await env.DB.prepare('SELECT id,client_enabled FROM projects WHERE client_token=?').bind(parts[1]).first();
    if (!p || !p.client_enabled) return err(404, 'This link is not active. Please contact The Approved Group.');
    const who = 'Client';
    if (parts.length === 2 && m === 'GET') return json(await bundle(env, p.id, true));
    if (parts[2] === 'ops' && m === 'POST') { const b = await req.json(); return json(await applyOps(env, p.id, b, who, true)); }
    if (parts[2] === 'documents') return docRoutes(env, req, url, p.id, parts.slice(3), who, true);
    return err(404, 'Not found');
  }

  const user = await currentUser(env, req);
  if (parts[0] === 'me') return user ? json(user) : err(401, 'Not signed in');
  if (!user) return err(401, 'Not signed in');
  const who = user.name || user.email;

  // ---- users ----
  if (parts[0] === 'users') {
    if (m === 'GET' && parts.length === 1) {
      if (user.role !== 'admin') return err(403, 'Admins only');
      return json((await env.DB.prepare('SELECT id,email,name,role,created,last_login FROM users ORDER BY created').all()).results);
    }
    if (m === 'POST' && parts.length === 1) {
      if (user.role !== 'admin') return err(403, 'Admins only');
      const b = await req.json();
      const email = String(b.email || '').trim().toLowerCase();
      if (!email.includes('@') || String(b.password || '').length < 8) return err(400, 'Email and a password of at least 8 characters are required');
      const h = await hashPassword(b.password);
      try {
        await env.DB.prepare('INSERT INTO users (id,email,name,role,pw_hash,pw_salt,pw_iter,created) VALUES (?,?,?,?,?,?,?,?)')
          .bind(rid(), email, String(b.name || '').slice(0, 80), b.role === 'admin' ? 'admin' : 'staff', h.pw_hash, h.pw_salt, h.pw_iter, now()).run();
      } catch { return err(409, 'That email already has an account'); }
      return json({ ok: true });
    }
    if (m === 'PUT' && parts[1]) {
      const target = parts[1] === 'me' ? user.id : parts[1];
      if (target !== user.id && user.role !== 'admin') return err(403, 'Not allowed');
      const b = await req.json();
      if (b.password) {
        if (String(b.password).length < 8) return err(400, 'Password must be at least 8 characters');
        if (target === user.id) {
          const u = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(user.id).first();
          if (!safeEq(await pbkdf2(String(b.current || ''), u.pw_salt, u.pw_iter), u.pw_hash)) return err(403, 'Current password is wrong');
        }
        const h = await hashPassword(b.password);
        await env.DB.prepare('UPDATE users SET pw_hash=?, pw_salt=?, pw_iter=? WHERE id=?').bind(h.pw_hash, h.pw_salt, h.pw_iter, target).run();
        await env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token<>?').bind(target, cookies(req).aeg_s || '').run();
      }
      if (b.name !== undefined) await env.DB.prepare('UPDATE users SET name=? WHERE id=?').bind(String(b.name).slice(0, 80), target).run();
      return json({ ok: true });
    }
    if (m === 'DELETE' && parts[1]) {
      if (user.role !== 'admin' || parts[1] === user.id) return err(403, 'Not allowed');
      await env.DB.batch([env.DB.prepare('DELETE FROM users WHERE id=?').bind(parts[1]), env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(parts[1])]);
      return json({ ok: true });
    }
  }

  // ---- projects ----
  if (parts[0] === 'projects') {
    if (parts.length === 1 && m === 'GET') {
      const rows = (await env.DB.prepare(`SELECT p.*, (SELECT COUNT(*) FROM persons x WHERE x.project_id=p.id) AS n_persons,
        (SELECT COUNT(*) FROM documents d WHERE d.project_id=p.id AND d.chunks>0) AS n_files,
        (SELECT COUNT(*) FROM documents d WHERE d.project_id=p.id) AS n_docs,
        (SELECT COUNT(*) FROM documents d WHERE d.project_id=p.id AND d.status IN ('received','apostilled','translated','submitted')) AS n_docs_done
        FROM projects p ORDER BY p.updated DESC LIMIT 1000`).all()).results;
      return json(rows.map(p => projectOut(p, { n_persons: p.n_persons, n_files: p.n_files, n_docs: p.n_docs, n_docs_done: p.n_docs_done })));
    }
    if (parts.length === 1 && m === 'POST') {
      const b = await req.json();
      const id = rid(); const t = now();
      await env.DB.prepare('INSERT INTO projects (id,name,status,data,client_token,client_enabled,created,updated,created_by) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(id, String(b.name || 'New project').slice(0, 120), 'new', JSON.stringify(b.data || {}), rid(24), 0, t, t, user.id).run();
      if (b.ops) await applyOps(env, id, b.ops, who, false);
      await log(env, id, who, 'Project created');
      return json(await bundle(env, id, false));
    }
    const pid = parts[1];
    const exists = await env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(pid).first();
    if (!exists) return err(404, 'Project not found');
    if (parts.length === 2) {
      if (m === 'GET') return json(await bundle(env, pid, false));
      if (m === 'PUT') {
        const b = await req.json();
        const name = b.name !== undefined ? String(b.name).slice(0, 120) : exists.name;
        const status = b.status !== undefined ? String(b.status).slice(0, 20) : exists.status;
        const data = b.data !== undefined ? JSON.stringify(b.data) : exists.data;
        await env.DB.prepare('UPDATE projects SET name=?, status=?, data=?, updated=? WHERE id=?').bind(name, status, data, now(), pid).run();
        if (status !== exists.status) await log(env, pid, who, `Status → ${status}`);
        if (b.log) await log(env, pid, who, String(b.log).slice(0, 300));
        return json({ ok: true, project: projectOut(await env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(pid).first()) });
      }
      if (m === 'DELETE') {
        if (user.role !== 'admin') return err(403, 'Admins only — archive instead');
        const docs = (await env.DB.prepare('SELECT id FROM documents WHERE project_id=?').bind(pid).all()).results;
        const st = docs.map(d => env.DB.prepare('DELETE FROM doc_chunks WHERE doc_id=?').bind(d.id));
        st.push(env.DB.prepare('DELETE FROM documents WHERE project_id=?').bind(pid), env.DB.prepare('DELETE FROM persons WHERE project_id=?').bind(pid),
          env.DB.prepare('DELETE FROM families WHERE project_id=?').bind(pid), env.DB.prepare('DELETE FROM activity WHERE project_id=?').bind(pid),
          env.DB.prepare('DELETE FROM projects WHERE id=?').bind(pid));
        for (let i = 0; i < st.length; i += 90) await env.DB.batch(st.slice(i, i + 90));
        return json({ ok: true });
      }
    }
    if (parts[2] === 'ops' && m === 'POST') return json(await applyOps(env, pid, await req.json(), who, false));
    if (parts[2] === 'documents') return docRoutes(env, req, url, pid, parts.slice(3), who, false);
    if (parts[2] === 'duplicate' && m === 'POST') {
      const b = await bundle(env, pid, false);
      const id = rid(); const t = now();
      const map = {}; const nid = old => old ? (map[old] ||= rid()) : old;
      await env.DB.prepare('INSERT INTO projects (id,name,status,data,client_token,client_enabled,created,updated,created_by) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(id, (b.project.name + ' (copy)').slice(0, 120), 'new', JSON.stringify({ ...b.project.data, claim_ancestor: nid(b.project.data.claim_ancestor), applicant: nid(b.project.data.applicant) }), rid(24), 0, t, t, user.id).run();
      const ops = {
        upsertPersons: b.persons.map(p => ({ ...p, id: nid(p.id), famc: nid(p.famc) })),
        upsertFamilies: b.families.map(f => ({ ...f, id: nid(f.id), husb: nid(f.husb), wife: nid(f.wife), children: (f.children || []).map(nid) })),
      };
      await applyOps(env, id, ops, who, false);
      await log(env, id, who, `Duplicated from “${b.project.name}” (documents not copied)`);
      return json({ id });
    }
    if (parts[2] === 'client-link' && m === 'POST') {
      const b = await req.json();
      const token = b.regenerate ? rid(24) : (exists.client_token || rid(24));
      await env.DB.prepare('UPDATE projects SET client_token=?, client_enabled=? WHERE id=?').bind(token, b.enabled ? 1 : 0, pid).run();
      await log(env, pid, who, b.enabled ? 'Client link switched on' : 'Client link switched off');
      return json({ client_token: token, client_enabled: !!b.enabled });
    }
  }
  return err(404, 'Not found');
}

export async function onRequest(ctx) {
  try { return await handle(ctx.request, ctx.env); }
  catch (e) { return err(500, 'Server error: ' + (e && e.message || e)); }
}
