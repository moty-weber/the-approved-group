import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

const NAV = [['/', 'Home'], ['/services', 'Services'], ['/family-tree', 'Start Application'], ['/about', 'About'], ['/guide', 'Guide'], ['/pay', 'Payment'], ['/contact', 'Contact']];
function useSmartsupp() {
  useEffect(() => {
    if (window.smartsupp) return;
    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = 'adfa0d91298f8cf7e8f066474ef7b18a0da2817b';
    window._smartsupp.customColors = { primary: '#d4af37', secondary: '#050c1a' };
    const o = window.smartsupp = function () { o._.push(arguments); }; o._ = [];
    const s = document.createElement('script'); s.async = true; s.charset = 'utf-8'; s.src = 'https://www.smartsuppchat.com/loader.js?';
    document.body.appendChild(s);
  }, []);
}
export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useSmartsupp();
  return (
    <>
      <header className="pub-header">
        <div className="in">
          <Link to="/" className="brand"><img src="/logo.png" alt="The Approved Group" width="42" height="42" /><span><b>The Approved Group</b><small>EU Citizenship</small></span></Link>
          <button className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'x' : 'menu'} size={26} /></button>
          <nav className={'pub-nav' + (open ? ' open' : '')}>
            {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="pub-footer">
        <div className="in">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}><img src="/logo.png" alt="" width="42" height="42" /><span><b>The Approved Group</b><small>EU Citizenship</small></span></div>
            <p style={{ maxWidth: 420 }}>A global organization dedicated to the restitution of Jewish heritage and EU citizenship rights.</p>
          </div>
          <div>
            <h4>Pages</h4>
            {NAV.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </div>
          <div>
            <h4>Contact</h4>
            <a href="mailto:info@approvedeu.com">info@approvedeu.com</a>
            <a href="tel:+32470912705">+32 470 91 27 05</a>
            <a href="tel:+32492617249">+32 492 61 72 49</a>
            <a href="/guide.pdf" target="_blank" rel="noopener">PDF guide</a>
          </div>
        </div>
        <div className="bottom">© {new Date().getFullYear()} The Approved Group. All rights reserved. <Link to="/app" className="team-login">Team login</Link></div>
      </footer>
    </>
  );
}
