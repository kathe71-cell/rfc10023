import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ShieldCheck, Cpu, Database, BookOpen, Layers, Sparkles, Code2, Scale, HelpCircle, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SEARCH_INDEX, SearchItem } from '../data/searchIndex';
import { HOSTERS_DATA } from '../data/hosters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const langPrefix = language === 'en' ? '/en' : '';

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle ESC or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Detect domain input
  const isDomainInput = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return trimmed.length > 3 && trimmed.includes('.') && !trimmed.includes(' ');
  }, [query]);

  // Search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default top suggestions
      return SEARCH_INDEX.slice(0, 6);
    }

    const items: Array<{ item: SearchItem; score: number }> = [];

    SEARCH_INDEX.forEach((item) => {
      let score = 0;
      const title = (language === 'en' ? item.titleEn : item.titleDe).toLowerCase();
      const desc = (language === 'en' ? item.descEn : item.descDe).toLowerCase();
      const keywords = language === 'en' ? item.keywordsEn : item.keywordsDe;

      if (title.startsWith(q)) score += 50;
      else if (title.includes(q)) score += 30;

      if (desc.includes(q)) score += 15;

      keywords.forEach((kw) => {
        if (kw === q) score += 40;
        else if (kw.startsWith(q)) score += 25;
        else if (kw.includes(q)) score += 10;
      });

      if (score > 0) {
        items.push({ item, score });
      }
    });

    // Also check hosters
    HOSTERS_DATA.forEach((hoster) => {
      if (hoster.name.toLowerCase().includes(q) || hoster.id.includes(q)) {
        items.push({
          item: {
            id: `hoster-${hoster.id}`,
            titleDe: `${hoster.name} DNS-Anleitung`,
            titleEn: `${hoster.name} DNS Guide`,
            descDe: hoster.notes,
            descEn: hoster.notesEn || hoster.notes,
            category: 'hoster',
            pathDe: `/hoster-matrix`,
            pathEn: `/en/hoster-matrix`,
            keywordsDe: ['hoster', hoster.id],
            keywordsEn: ['hoster', hoster.id],
          },
          score: 35,
        });
      }
    });

    items.sort((a, b) => b.score - a.score);
    return items.map((i) => i.item);
  }, [query, language]);

  // Total items including the domain validator dynamic action
  const totalItemsCount = isDomainInput ? results.length + 1 : results.length;

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItemsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItemsCount) % Math.max(1, totalItemsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDomainInput && selectedIndex === 0) {
        // Run validation for this domain
        navigate(`${langPrefix}/validator?domain=${encodeURIComponent(query.trim())}`);
        onClose();
      } else {
        const targetIndex = isDomainInput ? selectedIndex - 1 : selectedIndex;
        const target = results[targetIndex];
        if (target) {
          const path = language === 'en' ? target.pathEn : target.pathDe;
          navigate(path);
          onClose();
        }
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tools':
        return <Cpu className="w-4 h-4 text-emerald-600" />;
      case 'standards':
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'hoster':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'legal':
        return <Scale className="w-4 h-4 text-purple-600" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4 text-slate-600" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'tools':
        return language === 'en' ? 'Tools & Generators' : 'Tools & Generatoren';
      case 'standards':
        return language === 'en' ? 'IETF Specification' : 'IETF Spezifikation';
      case 'hoster':
        return language === 'en' ? 'DNS Providers' : 'DNS-Hoster';
      case 'legal':
        return language === 'en' ? 'Legal & Compliance' : 'Recht & Leitfaden';
      case 'faq':
        return language === 'en' ? 'Help & FAQ' : 'Hilfe & FAQ';
      default:
        return category;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'en'
                ? 'Search tools, tags (fval, furi), hosters or test domain...'
                : 'Suche nach Tools, Tags (fval, furi), Hostern oder Domain prüfen...'
            }
            className="w-full px-3 py-4 text-sm sm:text-base bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono font-bold text-slate-500 bg-slate-200/80 rounded border border-slate-300">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100">
          {/* Dynamic Action: Directly test entered domain */}
          {isDomainInput && (
            <div
              onClick={() => {
                navigate(`${langPrefix}/validator?domain=${encodeURIComponent(query.trim())}`);
                onClose();
              }}
              className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors mb-1 ${
                selectedIndex === 0 ? 'bg-emerald-50 text-emerald-950 border border-emerald-200' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
                    {language === 'en' ? 'Live DNS Test' : 'Echtzeit-DNS-Prüfung'}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {language === 'en' ? `Validate "${query.trim()}" now` : `"${query.trim()}" im Live-Validator prüfen`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 font-mono font-bold">
                <span>Enter</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Regular Results */}
          {results.length > 0 ? (
            results.map((item, idx) => {
              const itemVisualIndex = isDomainInput ? idx + 1 : idx;
              const isSelected = selectedIndex === itemVisualIndex;
              const title = language === 'en' ? item.titleEn : item.titleDe;
              const desc = language === 'en' ? item.descEn : item.descDe;
              const path = language === 'en' ? item.pathEn : item.pathDe;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(itemVisualIndex)}
                  className={`p-3 rounded-lg flex items-start justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-100 text-slate-950' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <div className="mt-0.5 w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {title}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 mt-1">
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-slate-300'} transition-transform`} />
                  </div>
                </div>
              );
            })
          ) : !isDomainInput ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">
                {language === 'en' ? 'No matching pages or tools found.' : 'Keine passenden Seiten oder Tools gefunden.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'en' ? 'Try searching for "fval", "Strato", "SPF" or enter a domain name.' : 'Versuche Suchbegriffe wie „fval", „Strato", „SPF" oder gib einen Domainnamen ein.'}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold">↓</kbd>
              <span>{language === 'en' ? 'Navigate' : 'Navigieren'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold">↵</kbd>
              <span>{language === 'en' ? 'Select' : 'Öffnen'}</span>
            </span>
          </div>
          <span className="text-slate-400">
            {language === 'en' ? 'RFC 10023 Quick-Search' : 'RFC 10023 Schnellsuche'}
          </span>
        </div>
      </div>
    </div>
  );
}
