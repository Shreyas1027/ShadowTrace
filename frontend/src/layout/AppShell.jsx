import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
