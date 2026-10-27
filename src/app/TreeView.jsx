import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { layout, NODE_W, NODE_H, fullName, lifeSpan, relationLabel } from '../lib/tree.js';

/** Interactive family tree: drag to pan, wheel / pinch / buttons to zoom. */
export default function TreeView({ idx, rootId, line, selected, onSelect, onQuick, warnings, docStats, roleOf, readOnly, highlightOnly }) {
  const L = useMemo(() => layout(idx, rootId), [idx, rootId]);
  const wrap = useRef(null);
  const [view, setView] = useState({ x: 20, y: 20, k: 1 });
  const vref = useRef(view); vref.current = view;
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const moved = useRef(false);
  const lineSet = useMemo(() => new Set(line || []), [line]);
  const lineEdges = useMemo(() => { const s = new Set(); (line || []).forEach((id, i) => { if (i > 0) s.add(line[i - 1]); }); return s; }, [line]);

  const fit = (focusId) => {
    const el = wrap.current; if (!el || !L.width) return;
    const W = el.clientWidth, H = el.clientHeight;
    if (focusId && L.pos.get(focusId)) {
      const p = L.pos.get(focusId); const k = Math.min(1, Math.max(.55, vref.current.k));
      setView({ k, x: W / 2 - (p.x + NODE_W / 2) * k, y: H / 2 - (p.y + NODE_H / 2) * k }); return;
    }
    const k = Math.max(.25, Math.min(1.1, Math.min((W - 30) / L.width, (H - 30) / L.height)));
    setView({ k, x: (W - L.width * k) / 2, y: Math.max(10, (H - L.height * k) / 2) });
  };
  const first = useRef(true);
  useEffect(() => { if (first.current && L.width) { first.current = false; fit(); } }, [L.width]);
  useEffect(() => { if (selected && L.pos.get(selected)) { const el = wrap.current; const p = L.pos.get(selected); const v = vref.current; const sx = p.x * v.k + v.x, sy = p.y * v.k + v.y; if (sx < 0 || sy < 0 || sx > el.clientWidth - 60 || sy > el.clientHeight - 60) fit(selected); } }, [selected]);

  const zoomAt = (factor, cx, cy) => setView(v => { const k = Math.max(.2, Math.min(2.5, v.k * factor)); const f = k / v.k; return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f }; });
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const onWheel = e => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  const down = e => {
    if (e.target.closest('.quick, .tree-tools')) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    const ps = [...pointers.current.values()];
    if (ps.length === 1) gesture.current = { type: 'pan', sx: e.clientX, sy: e.clientY, v: vref.current };
    if (ps.length === 2) { const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y); gesture.current = { type: 'pinch', d, v: vref.current, cx: (ps[0].x + ps[1].x) / 2, cy: (ps[0].y + ps[1].y) / 2 }; }
  };
  const move = e => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current; if (!g) return;
    if (g.type === 'pan') { const dx = e.clientX - g.sx, dy = e.clientY - g.sy; if (Math.abs(dx) + Math.abs(dy) > 5) moved.current = true; setView({ ...g.v, x: g.v.x + dx, y: g.v.y + dy }); }
    else if (g.type === 'pinch') {
      const ps = [...pointers.current.values()]; if (ps.length < 2) return; moved.current = true;
      const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y); const r = wrap.current.getBoundingClientRect();
      const k = Math.max(.2, Math.min(2.5, g.v.k * d / g.d)); const f = k / g.v.k; const cx = g.cx - r.left, cy = g.cy - r.top;
      setView({ k, x: cx - (cx - g.v.x) * f, y: cy - (cy - g.v.y) * f });
    }
  };
  const up = e => { pointers.current.delete(e.pointerId); if (pointers.current.size === 0) gesture.current = null; else if (pointers.current.size === 1) { const [p] = [...pointers.current.values()]; gesture.current = { type: 'pan', sx: p.x, sy: p.y, v: vref.current }; } };
  const clickNode = (id, e) => { e.stopPropagation(); if (moved.current) return; onSelect(id); };

  const sel = selected && L.pos.get(selected);
  return (
    <div className="tree-wrap" ref={wrap} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={() => !moved.current && onSelect(null)}>
      <div className="tree-stage" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, width: L.width, height: L.height }}>
        <svg width={L.width} height={L.height}>
          {L.couples.map(c => <line key={'c' + c.fam} x1={c.x1} x2={c.x2} y1={c.y} y2={c.y} stroke={c.ids.some(i => lineSet.has(i)) && c.ids.every(i => lineSet.has(i) || true) ? '#b9a25a' : '#a9a28f'} strokeWidth={2} strokeDasharray={idx.F.get(c.fam)?.divorced ? '5 4' : ''} />)}
          {L.edges.map((e, i) => { const on = e.kids.some(k => lineEdges.has(k)) && e.parents.some(p => lineSet.has(p)); return <path key={i} d={e.d} fill="none" stroke={on ? '#d4af37' : '#b3ad9c'} strokeWidth={on ? 3.5 : 1.6} />; })}
        </svg>
        {[...L.pos.entries()].map(([id, p]) => {
          const per = idx.P.get(id); const w = warnings.get(id) || []; const ds = docStats.get(id);
          const role = roleOf(id); const errs = w.filter(x => x.level === 'error').length, warns = w.filter(x => x.level === 'warn').length;
          const nm = fullName(per); const blank = !per.given;
          const cls = ['tnode', per.sex || '', lineSet.has(id) ? 'line' : '', selected === id ? 'sel' : '', highlightOnly && line && !lineSet.has(id) ? 'dim' : '', blank ? 'placeholder' : ''].join(' ');
          return (
            <div key={id} className={cls} style={{ left: p.x, top: p.y }} onClick={e => clickNode(id, e)} role="button" tabIndex={0} aria-label={nm} onKeyDown={e => e.key === 'Enter' && onSelect(id)}>
              {role && <span className="tag">{role}</span>}
              <div className="nm" style={{ paddingRight: role ? 44 : 0 }}>{blank ? `${per.label || 'Tap to fill in'}${per.surname ? ' · ' + per.surname : ''}` : nm}</div>
              {per.hebrew ? <div className="he" dir="rtl">{per.hebrew}</div> : per.maiden ? <div className="yrs">née {per.maiden}</div> : null}
              <div className="yrs">{[lifeSpan(per), (per.birth_place || '').split(',')[0]].filter(Boolean).join(' · ') || '—'}</div>
              <div className="badges">
                {errs > 0 && <span className="e" title="Errors">!{errs}</span>}
                {!errs && warns > 0 && <span className="w" title="Warnings">!{warns}</span>}
                {ds && ds.need > 0 && <span className="n" title="Documents still needed">{ds.need} need</span>}
                {ds && ds.files > 0 && <span className="d" title="Files attached">📎{ds.files}</span>}
              </div>
            </div>
          );
        })}
        {sel && !readOnly && (
          <div className="quick" style={{ left: sel.x, top: sel.y - 34 }}>
            <button onClick={e => { e.stopPropagation(); onQuick('father', selected); }}>+ Father</button>
            <button onClick={e => { e.stopPropagation(); onQuick('mother', selected); }}>+ Mother</button>
          </div>
        )}
        {sel && !readOnly && (
          <div className="quick" style={{ left: sel.x, top: sel.y + NODE_H + 6 }}>
            <button onClick={e => { e.stopPropagation(); onQuick('spouse', selected); }}>+ Spouse</button>
            <button onClick={e => { e.stopPropagation(); onQuick('child', selected); }}>+ Child</button>
            <button onClick={e => { e.stopPropagation(); onQuick('sibling', selected); }}>+ Sibling</button>
          </div>
        )}
      </div>
      <div className="tree-tools">
        <button className="btn" title="Zoom in" aria-label="Zoom in" onClick={() => zoomAt(1.2, wrap.current.clientWidth / 2, wrap.current.clientHeight / 2)}><Icon name="zoomin" /></button>
        <button className="btn" title="Zoom out" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.2, wrap.current.clientWidth / 2, wrap.current.clientHeight / 2)}><Icon name="zoomout" /></button>
        <button className="btn" title="Fit the whole tree" aria-label="Fit" onClick={() => fit()}><Icon name="fit" /></button>
        {rootId && <button className="btn" title="Centre on the applicant" aria-label="Centre on applicant" onClick={() => fit(rootId)}><Icon name="target" /></button>}
      </div>
      <div className="tree-legend">
        <span><b style={{ color: '#d4af37' }}>━</b> Claim line</span><span><span className="chip err" style={{ padding: '0 5px' }}>need</span> docs missing</span><span>📎 files</span>
      </div>
    </div>
  );
}
export { relationLabel };
