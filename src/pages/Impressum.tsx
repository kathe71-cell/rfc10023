import React from 'react';
import { Mail, Phone, MapPin, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Impressum() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? 'Legal Provider Identification' : 'Rechtliche Anbieterkennzeichnung'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {language === 'en' ? 'Imprint & Legal Notice' : 'Impressum'}
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-mono">
          {language === 'en' ? 'Information pursuant to § 5 German Digital Services Act (DDG)' : 'Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)'}
        </p>
      </div>

      {/* Operator Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        
        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
            {language === 'en' ? 'Service Provider' : 'Diensteanbieter'}
          </h2>
          <p className="text-base font-extrabold text-slate-900">Jens Kathe</p>
          <p className="text-sm text-slate-700 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            Hansastraße 6, 34119 Kassel, {language === 'en' ? 'Germany' : 'Deutschland'}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
            {language === 'en' ? 'Contact Details' : 'Kontaktmöglichkeiten'}
          </h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              {language === 'en' ? 'Email:' : 'E-Mail:'}{' '}
              <a href="mailto:jens@kathe.org" className="text-emerald-700 font-semibold hover:underline font-mono">
                jens@kathe.org
              </a>
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              {language === 'en' ? 'Phone:' : 'Telefon:'}{' '}
              <a href="tel:+491786652623" className="text-slate-900 font-semibold hover:underline font-mono">
                +49 178 6652623
              </a>
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
            {language === 'en' ? 'Responsible for Editorial Content (§ 18 (2) MStV)' : 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV'}
          </h2>
          <p className="text-sm text-slate-800">
            Jens Kathe<br />
            Hansastraße 6<br />
            34119 Kassel, {language === 'en' ? 'Germany' : 'Deutschland'}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
            {language === 'en' ? 'Independence Disclaimer' : 'Hinweis zur Unabhängigkeit'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {language === 'en'
              ? 'rfc10023.de is an independent, non-commercial reference portal and documentation service for IETF RFC 10023. There is no corporate affiliation or partnership with the Internet Engineering Task Force (IETF), DENIC eG, SIDN, or any mentioned DNS provider.'
              : 'rfc10023.de ist ein unabhängiges, privates Fachportal und Dokumentationsangebot zur IETF-Spezifikation RFC 10023. Es besteht kein gesellschaftsrechtliches Verhältnis oder eine sonstige geschäftliche Bindung zur Internet Engineering Task Force (IETF), DENIC eG, SIDN oder genannten DNS-Dienstleistern.'}
          </p>
        </div>

      </div>

    </div>
  );
}
