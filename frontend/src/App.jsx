import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScanProvider } from './context/ScanProvider';
import AppShell from './layout/AppShell';
import Landing from './pages/Landing';
import Scanner from './pages/Scanner';
import PrivacyGuide from './pages/PrivacyGuide';
import About from './pages/About';
import Results from './pages/Results';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ScanProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Landing />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/guide" element={<PrivacyGuide />} />
            <Route path="/about" element={<About />} />
            <Route path="/results" element={<Results />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ScanProvider>
  );
}
