// Date parsing / formatting for genealogy (fuzzy dates) + Hebrew calendar conversion (via Intl's ICU hebrew calendar).
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_RE = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  januar: 1, februar: 2, märz: 3, maerz: 3, mai: 5, juni: 6, juli: 7, oktober: 10, dezember: 12, janvier: 1, fevrier: 2, mars: 3, avril: 4, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12 };
const QUAL = [[/^(abt\.?|about|approx\.?|circa|ca\.?|c\.|~|around)\s*/i, 'abt'], [/^(bef\.?|before)\s*/i, 'bef'], [/^(aft\.?|after)\s*/i, 'aft'], [/^(est\.?|estimated|cal\.?)\s*/i, 'est']];

function valid(y, m, d) {
  if (!y || y < 1000 || y > 2100) return false;
  if (m && (m < 1 || m > 12)) return false;
  if (d) { const dt = new Date(Date.UTC(y, (m || 1) - 1, d)); if (dt.getUTCDate() !== d) return false; }
  return true;
}

/** Parse a free-text date. Returns {y, m, d, q} or null. Day-first for numeric dates (DD/MM/YYYY), like the Approved guide asks. */
export function parseDate(input) {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;
  let q = '';
  const bet = /^bet\.?\s+(.+?)\s+and\s+(.+)$/i.exec(s) || /^between\s+(.+?)\s+and\s+(.+)$/i.exec(s);
  if (bet) { s = bet[1]; q = 'abt'; }
  for (const [re, k] of QUAL) if (re.test(s)) { s = s.replace(re, ''); q = k; break; }
  s = s.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  let m;
  if ((m = /^(\d{4})$/.exec(s))) { const y = +m[1]; return valid(y) ? { y, m: 0, d: 0, q } : null; }
  if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s))) { const [y, mo, d] = [+m[1], +m[2], +m[3]]; return valid(y, mo, d) ? { y, m: mo, d, q } : null; }
  if ((m = /^(\d{4})[-/.](\d{1,2})$/.exec(s))) { const [y, mo] = [+m[1], +m[2]]; return valid(y, mo) ? { y, m: mo, d: 0, q } : null; }
  if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) {
    let [d, mo, y] = [+m[1], +m[2], +m[3]];
    if (mo > 12 && d <= 12) [d, mo] = [mo, d]; // clearly US order
    return valid(y, mo, d) ? { y, m: mo, d, q } : null;
  }
  if ((m = /^(\d{1,2})[-/.](\d{4})$/.exec(s))) { const [mo, y] = [+m[1], +m[2]]; return valid(y, mo) ? { y, m: mo, d: 0, q } : null; }
  if ((m = /^(\d{1,2})\.?\s+([a-zäéû]+)\.?\s+(\d{4})$/i.exec(s))) { const mo = MONTH_RE[m[2].toLowerCase()]; const [d, y] = [+m[1], +m[3]]; return mo && valid(y, mo, d) ? { y, m: mo, d, q } : null; }
  if ((m = /^([a-zäéû]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})$/i.exec(s))) { const mo = MONTH_RE[m[1].toLowerCase()]; const [d, y] = [+m[2], +m[3]]; return mo && valid(y, mo, d) ? { y, m: mo, d, q } : null; }
  if ((m = /^([a-zäéû]+)\.?\s+(\d{4})$/i.exec(s))) { const mo = MONTH_RE[m[1].toLowerCase()]; const y = +m[2]; return mo && valid(y, mo) ? { y, m: mo, d: 0, q } : null; }
  return null;
}

const QLABEL = { abt: 'abt.', bef: 'before', aft: 'after', est: 'est.' };
export function formatDate(p) {
  if (!p) return '';
  const core = p.d ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : p.m ? `${MONTHS[p.m - 1]} ${p.y}` : `${p.y}`;
  return p.q ? `${QLABEL[p.q]} ${core}` : core;
}
/** Normalise what the user typed (keeps the text if it cannot be parsed). */
export function normalizeDate(text) { const p = parseDate(text); return p ? formatDate(p) : (text || '').trim(); }
export function yearOf(text) { const p = parseDate(text); return p ? p.y : null; }
/** Comparable day number (approximate for partial dates). */
export function dayNum(p) { if (!p) return null; return p.y * 372 + ((p.m || 6) - 1) * 31 + (p.d || 15); }
export function toGedcomDate(text) {
  const p = parseDate(text); if (!p) return (text || '').trim();
  const core = p.d ? `${p.d} ${MONTHS[p.m - 1].toUpperCase()} ${p.y}` : p.m ? `${MONTHS[p.m - 1].toUpperCase()} ${p.y}` : `${p.y}`;
  return p.q ? `${{ abt: 'ABT', bef: 'BEF', aft: 'AFT', est: 'EST' }[p.q]} ${core}` : core;
}

// ---------------- Hebrew calendar ----------------
let fmtEn, fmtHe;
function fmts() {
  if (!fmtEn) {
    fmtEn = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    try { fmtHe = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch { fmtHe = null; }
  }
  return [fmtEn, fmtHe];
}
function partsOf(date) {
  const o = {}; for (const x of fmts()[0].formatToParts(date)) o[x.type] = x.value;
  return { day: +o.day, month: o.month, year: +(o.year || o.relatedYear) };
}
/** Gregorian full date → Hebrew date, e.g. {en: "12 Adar 5681", he: "י״ב באדר תרפ״א"}; null for partial dates. Note: after-sunset births belong to the next Hebrew day. */
export function toHebrew(text) {
  const p = parseDate(text); if (!p || !p.d || p.q) return null;
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const e = partsOf(dt);
  const he = `${gematria(e.day)} ${HE_MONTH[canonMonth(e.month)] || e.month} ${gematria(e.year % 1000)}`;
  return { en: `${e.day} ${e.month} ${e.year}`, he };
}

const MONTH_ALIASES = {
  tishri: 'Tishri', tishrei: 'Tishri', tishre: 'Tishri', 'תשרי': 'Tishri',
  heshvan: 'Heshvan', cheshvan: 'Heshvan', marcheshvan: 'Heshvan', marheshvan: 'Heshvan', 'חשון': 'Heshvan', 'חשוון': 'Heshvan', 'מרחשון': 'Heshvan', 'מרחשוון': 'Heshvan',
  kislev: 'Kislev', kislew: 'Kislev', 'כסלו': 'Kislev', 'כסליו': 'Kislev',
  tevet: 'Tevet', teves: 'Tevet', tebeth: 'Tevet', 'טבת': 'Tevet',
  shevat: 'Shevat', shvat: 'Shevat', shevet: 'Shevat', 'שבט': 'Shevat',
  adar: 'Adar', 'אדר': 'Adar', 'adar i': 'Adar I', 'adar 1': 'Adar I', 'adar rishon': 'Adar I', 'אדר א': 'Adar I', 'אדר ראשון': 'Adar I',
  'adar ii': 'Adar II', 'adar 2': 'Adar II', 'adar sheni': 'Adar II', 'adar beit': 'Adar II', 'אדר ב': 'Adar II', 'אדר שני': 'Adar II',
  nisan: 'Nisan', nissan: 'Nisan', 'ניסן': 'Nisan', iyar: 'Iyar', iyyar: 'Iyar', 'אייר': 'Iyar', 'איר': 'Iyar',
  sivan: 'Sivan', 'סיון': 'Sivan', 'סיוון': 'Sivan', tamuz: 'Tamuz', tammuz: 'Tamuz', 'תמוז': 'Tamuz',
  av: 'Av', ab: 'Av', 'menachem av': 'Av', 'אב': 'Av', 'מנחם אב': 'Av', elul: 'Elul', 'אלול': 'Elul',
};
const HE_MONTH = { Tishri: 'תשרי', Heshvan: 'חשון', Kislev: 'כסלו', Tevet: 'טבת', Shevat: 'שבט', Adar: 'אדר', 'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳', Nisan: 'ניסן', Iyar: 'אייר', Sivan: 'סיון', Tamuz: 'תמוז', Av: 'אב', Elul: 'אלול' };
function canonMonth(m) { return MONTH_ALIASES[String(m).toLowerCase().replace(/[׳'"]/g, '').trim()] || m; }

const GEM = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };
export function fromGematria(s) { let n = 0; for (const ch of String(s)) if (GEM[ch]) n += GEM[ch]; return n; }
export function gematria(n) {
  const L = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
  let out = ''; let x = n;
  while (x > 0) {
    if (x === 15) { out += 'טו'; break; } if (x === 16) { out += 'טז'; break; }
    for (const [v, c] of L) if (x >= v) { out += c; x -= v; break; }
  }
  return out.length > 1 ? out.slice(0, -1) + '״' + out.slice(-1) : out + '׳';
}

/** Parse a Hebrew date like "12 Adar 5681", "Adar II 15 5684", "י״ב אדר תרפ״א" → {day, month, year} */
export function parseHebrewDate(input) {
  let s = String(input || '').trim().replace(/[,]/g, ' ').replace(/\s+/g, ' ');
  if (!s) return null;
  s = s.replace(/\bב(?=[\u05d0-\u05ea]{2,})/g, ''); // "באדר" → "אדר"
  const tokens = s.split(' ');
  let day = null, year = null, monthTok = [];
  for (const t of tokens) {
    const clean = t.replace(/[׳'"״]/g, '');
    if (/^\d+$/.test(clean)) { const n = +clean; if (n > 31) year = n; else if (day == null) day = n; continue; }
    if (/^[\u05d0-\u05ea]+$/.test(clean) && !MONTH_ALIASES[clean] && !(monthTok.length && MONTH_ALIASES[(monthTok.join(' ') + ' ' + clean)])) {
      const v = fromGematria(clean);
      if (/[״"']/.test(t) || v > 30 || day != null) { if (v > 30) { year = v < 1000 ? 5000 + v : v; continue; } }
      if (day == null && v <= 30) { day = v; continue; }
    }
    monthTok.push(clean.toLowerCase());
  }
  const month = canonMonth(monthTok.join(' ').replace(/^ב/, ''));
  if (!HE_MONTH[month] || !day || !year) return null;
  return { day, month, year };
}
/** Hebrew date → Gregorian text "12 Mar 1921" (or null). Adar in a leap year is treated as Adar I unless "Adar II" is given. */
export function fromHebrew(input) {
  const h = typeof input === 'string' ? parseHebrewDate(input) : input;
  if (!h) return null;
  const gy = h.year - 3761;
  const start = Date.UTC(gy, 7, 1);
  for (let i = 0; i < 430; i++) {
    const dt = new Date(start + i * 86400000);
    const e = partsOf(dt);
    if (e.year !== h.year || e.day !== h.day) continue;
    const em = canonMonth(e.month);
    if (em === h.month || (h.month === 'Adar' && em === 'Adar I')) return formatDate({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), q: '' });
  }
  return null;
}
