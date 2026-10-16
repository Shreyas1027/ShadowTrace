import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ScanSearch, Menu, X, ShieldCheck } from 'lucide-react';

const NAV_LINKS = [
  { name: 'Overview', to: '/', end: true },
  { name: 'Image Scanner', to: '/scanner' },
  { name: 'Privacy Guide', to: '/guide' },
  { name: 'About', to: '/about' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Trap focus within mobile menu when opened
  useEffect(() => {
    if (!mobileMenuOpen || !menuRef.current) return;

    const focusableElements = menuRef.current.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ShadowTrace Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-3 group outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl p-1"
            aria-label="ShadowTrace Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 shadow-sm transition duration-200 group-hover:bg-amber-100 group-hover:scale-105">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Shadow<span className="text-amber-500">Trace</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Visual Privacy Guard
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative px-3.5 py-1.5 text-sm font-medium transition rounded-lg ${
                    isActive
                      ? 'text-slate-900 font-semibold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-amber-500 after:rounded-full'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Header Status / Action */}
          <div className="hidden md:flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Zero-Storage Safe</span>
            </div>

            <Link
              to="/scanner"
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 shadow-sm transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            >
              Open Scanner
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            ref={toggleButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label="Toggle navigation menu"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Sheet Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="md:hidden border-b border-slate-100 bg-white/95 px-4 pt-3 pb-6 shadow-xl backdrop-blur-lg animate-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-50 text-slate-900 font-semibold border-l-4 border-amber-500 pl-3'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <span>{link.name}</span>
                <span className="text-xs text-slate-400">→</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              to="/scanner"
              className="w-full inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 shadow-sm transition"
            >
              Open Scanner
            </Link>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Free · No account · In-memory ephemeral</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
