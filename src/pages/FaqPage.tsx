import React, { useState, useMemo } from 'react';
import { HelpCircle, Search, ChevronDown, BookOpen, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import CitationBox from '../components/CitationBox';

interface FaqItem {
  id: string;
  category: 'general' | 'technical' | 'legal' | 'hoster';
  q: string;
  a: string;
}

export default function FaqPage() {
  const { t, language } = useLanguage();
  const langPrefix = language === 'en' ? '/en' : '';
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'q1': true,
    'q2': true,
  });

  const faqs: FaqItem[] = useMemo(() => [
    { id: 'q1', category: 'general', q: t('faq.q1'), a: t('faq.a1') },
    { id: 'q2', category: 'technical', q: t('faq.q2'), a: t('faq.a2') },
    { id: 'q3', category: 'hoster', q: t('faq.q3'), a: t('faq.a3') },
    { id: 'q4', category: 'general', q: t('faq.q4'), a: t('faq.a4') },
    { id: 'q5', category: 'general', q: t('faq.q5'), a: t('faq.a5') },
    { id: 'q6', category: 'technical', q: t('faq.q6'), a: t('faq.a6') },
    { id: 'q7', category: 'technical', q: t('faq.q7'), a: t('faq.a7') },
    { id: 'q8', category: 'technical', q: t('faq.q8'), a: t('faq.a8') },
    { id: 'q9', category: 'technical', q: t('faq.q9'), a: t('faq.a9') },
    { id: 'q10', category: 'legal', q: t('faq.q10'), a: t('faq.a10') },
    { id: 'q11', category: 'legal', q: t('faq.q11'), a: t('faq.a11') },
    { id: 'q12', category: 'hoster', q: t('faq.q12'), a: t('faq.a12') },
    { id: 'q13', category: 'technical', q: t('faq.q13'), a: t('faq.a13') },
    { id: 'q14', category: 'general', q: t('faq.q14'), a: t('faq.a14') },
  ], [t]);

  const toggleFaq = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchQuery]);

  const categories = [
    { id: 'all', label: t('faq.cat_all') },
    { id: 'general', label: t('faq.cat_general') },
    { id: 'technical', label: t('faq.cat_technical') },
    { id: 'legal', label: t('faq.cat_legal') },
    { id: 'hoster', label: t('faq.cat_hoster') },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs font-bold">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('faq.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          {t('faq.title')}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          {t('faq.desc')}
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('faq.search_placeholder')}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm font-mono">
            {language === 'en' ? 'No matching questions found.' : 'Keine passenden Fragen gefunden.'}
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openIds[faq.id];
            return (
              <div
                key={faq.id}
                id={faq.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs scroll-mt-24 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 font-bold text-slate-950 text-base sm:text-lg hover:bg-slate-50/80 transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-5 sm:p-6 pt-0 text-sm sm:text-base text-slate-700 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Deep Dive Action CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <Link
          to={`${langPrefix}/validator`}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 w-fit mb-2 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              {language === 'en' ? 'Test a Domain Live' : 'Domain live prüfen'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'en' ? 'Check _for-sale TXT records & DNSSEC' : 'TXT-Records und DNSSEC verifizieren'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all mt-2" />
        </Link>

        <Link
          to={`${langPrefix}/generator`}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="p-2 rounded-lg bg-emerald-600 text-white w-fit mb-2 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              {language === 'en' ? 'Build Record with Byte-Guard' : 'Eintrag mit Byte-Guard bauen'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'en' ? 'Exports for Cloudflare, Hetzner, BIND' : 'Export für Cloudflare, Hetzner & BIND'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all mt-2" />
        </Link>
      </div>

      {/* Citation */}
      <CitationBox
        title={language === 'en' ? 'RFC 10023 FAQ & Technical Guide' : 'RFC 10023 Häufige Fragen (FAQ) & Praxis-Guide'}
        url={`https://rfc10023.de${langPrefix}/faq`}
      />

    </div>
  );
}
