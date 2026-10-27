import { yearOf } from './dates.js';
// Prefilled search links on the big genealogy sites. These open the site's own search page in a new tab;
// MyHeritage, Ancestry and Geni need the user's own login for full results. No data is sent anywhere by us.
const e = encodeURIComponent;
export function searchLinks(p) {
  const given = (p.given || '').trim(), sur = (p.maiden || p.surname || '').trim();
  const by = yearOf(p.birth_date); const place = (p.birth_place || '').split(',')[0].trim();
  const name = [given, sur].filter(Boolean).join(' ');
  if (!name) return [];
  return [
    { site: 'MyHeritage', url: `https://www.myheritage.com/research?formId=master&formMode=1&action=query&qname=Name+fn.${e(given)}+ln.${e(sur)}${by ? `&qevents-event1=Event+et.birth+ey.${by}` : ''}` },
    { site: 'Geni', url: `https://www.geni.com/search?search_type=people&names=${e(name)}` },
    { site: 'FamilySearch', url: `https://www.familysearch.org/search/record/results?q.givenName=${e(given)}&q.surname=${e(sur)}${by ? `&q.birthLikeDate.from=${by - 2}&q.birthLikeDate.to=${by + 2}` : ''}${place ? `&q.birthLikePlace=${e(place)}` : ''}` },
    { site: 'Ancestry', url: `https://www.ancestry.com/search/?name=${e(given)}_${e(sur)}${by ? `&birth=${by}` : ''}${place ? `&birth_x=_${e(place)}` : ''}` },
    { site: 'JewishGen', url: `https://www.jewishgen.org/databases/all/` , note: 'opens the JewishGen database search (free login)' },
    { site: 'Yad Vashem names', url: `https://collections.yadvashem.org/en/names/search-results?first_name=${e(given)}&last_name=${e(sur)}` },
    { site: 'Arolsen Archives', url: `https://collections.arolsen-archives.org/en/search?s=${e(name)}` },
    { site: 'Google', url: `https://www.google.com/search?q=${e(`"${name}"${by ? ' ' + by : ''}${place ? ' ' + place : ''}`)}` },
  ];
}
export function placeLinks(place) {
  const town = (place || '').split(',')[0].trim(); if (!town) return [];
  return [
    { site: 'JewishGen Communities', url: `https://www.jewishgen.org/communities/search.asp?Town=${e(town)}` },
    { site: 'Map', url: `https://www.google.com/maps/search/${e(place)}` },
  ];
}
