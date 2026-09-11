import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, ShieldCheck, Cpu, Database, Menu, X, BookOpen, Code2 } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Live Validator', path: '/validator', icon: ShieldCheck },
    { name: 'Generator', path: '/generator', icon: Cpu },
    { name: 'Hoster-Matrix', path: '/hoster-matrix', icon: Database },
    { name: 'Spezifikation', path: '/spezifikation', icon: BookOpen },
    { name: 'Widget-Embed', path: '/rechner-embed', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                RFC<span className="text-emerald-600">10023</span><span className="text-slate-400 text-sm font-semibold">.de</span>
              </span>
              <span className="hidden sm:block text-[10px] font-mono tracking-wider uppercase text-slate-500">
                _for-sale DNS Reference Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Quick Action Button */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/validator"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-md bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all duration-150 shadow-sm"
            >
              DoH Test starten
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-700 hover:bg-slate-100"
              aria-label="Menü öffnen"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-emerald-600" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
