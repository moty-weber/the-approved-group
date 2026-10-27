const P = {
  plus: 'M12 5v14M5 12h14', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5-5', menu: 'M4 7h16M4 12h16M4 17h16', x: 'M6 6l12 12M18 6 6 18',
  tree: 'M12 3v6m0 0H6v4m6-4h6v4M6 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 21v-4', doc: 'M7 3h7l5 5v13H7zM14 3v5h5',
  upload: 'M12 16V4m0 0-5 5m5-5 5 5M5 20h14', download: 'M12 4v12m0 0-5-5m5 5 5-5M5 20h14', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a6 6 0 0 0-4-5.6', zoomin: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5-5M11 8v6M8 11h6',
  zoomout: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5-5M8 11h6', fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', target: 'M12 3v4m0 10v4m9-9h-4M7 12H3m9-5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  back: 'M15 5l-7 7 7 7', print: 'M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z', check: 'M5 12l5 5 9-10', alert: 'M12 4 2 20h20zM12 10v4m0 3v.5',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  scale: 'M12 4v16M5 20h14M6 8l-3 6h6zm12 0-3 6h6zM6 8h12', archive: 'M4 5h16v4H4zM5 9v10h14V9M10 13h4', home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z', mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  chat: 'M4 5h16v11H8l-4 4z', link: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1m2 4a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1', copy: 'M8 8h11v13H8zM5 16V3h11',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11', settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm8 3 2-1-2-4-2 1-2-2V4h-4v2L10 8 8 7 6 11l2 1v0l-2 1 2 4 2-1 2 2v2h4v-2l2-2 2 1 2-4z',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13', edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  card: 'M3 6h18v12H3zM3 10h18', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2',
};
export default function Icon({ name, size = 18, stroke = 2, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={P[name] || P.doc} /></svg>;
}
