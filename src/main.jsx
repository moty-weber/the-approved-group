import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import PublicLayout from './public/PublicLayout.jsx';
import Home from './public/Home.jsx';
import Services from './public/Services.jsx';
import About from './public/About.jsx';
import Contact from './public/Contact.jsx';
import Pay from './public/Pay.jsx';
import Guide from './public/Guide.jsx';
import FamilyTreeForm from './public/FamilyTreeForm.jsx';

const AppRoot = lazy(() => import('./app/AppRoot.jsx'));
const ClientPortal = lazy(() => import('./app/ClientPortal.jsx'));
const Loading = () => <div className="empty">Loading…</div>;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/family-tree" element={<FamilyTreeForm />} />
          </Route>
          <Route path="/app/*" element={<AppRoot />} />
          <Route path="/c/:token" element={<ClientPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
createRoot(document.getElementById('root')).render(<App />);
