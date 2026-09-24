import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, EyeOff, Server, Globe } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export default function Datenschutz() {
  const { language } = useLanguage();
  const langPrefix = language === 'en' ? '/en' : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? 'Data Privacy per GDPR / DSGVO' : 'Datenschutz nach DSGVO & TTDSG'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {language === 'en' ? 'Privacy Policy' : 'Datenschutzerklärung'}
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-mono">
          {language === 'en' ? 'Transparency, minimalism, and cookieless privacy on rfc10023.de' : 'Transparenz und Datensparsamkeit auf rfc10023.de'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-700 text-sm leading-relaxed shadow-xs">
        
        {/* 1. Verantwortlicher */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {language === 'en' ? '1. Responsible Entity / Data Controller' : '1. Verantwortliche Stelle'}
          </h2>
          <p>
            {language === 'en'
              ? 'The data controller within the meaning of the General Data Protection Regulation (GDPR) and other data protection regulations is the operator of this website. For full contact information, please refer to the '
              : 'Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und sonstiger datenschutzrechtlicher Bestimmungen ist der Betreiber dieser Website. Vollständige Kontaktdaten siehe '}
            <Link to={`${langPrefix}/impressum`} className="text-emerald-700 font-bold hover:underline">
              {language === 'en' ? 'Imprint' : 'Impressum'}
            </Link>.
          </p>
        </div>

        {/* 2. Zero-CDN & System-Schriften */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-emerald-600" />
            {language === 'en' ? '2. Zero External CDNs (Zero-CDN Architecture)' : '2. Keine externen CDNs (Zero-CDN-Prinzip)'}
          </h2>
          <p>
            {language === 'en'
              ? 'This website does not load external web fonts (e.g. Google Fonts) or remote CDN JavaScript/CSS libraries. Only native system fonts installed locally on your operating system are rendered. This strictly eliminates the unauthorized transmission of visitor IP addresses to third-party servers in non-EU countries during page loads.'
              : 'Auf dieser Website werden keine externen Webfonts (wie z. B. Google Fonts) oder externe CDN-Bibliotheken eingebunden. Es werden ausschließlich lokal auf Ihrem Endgerät vorinstallierte Systemschriftarten verwendet. Dadurch wird verhindert, dass beim reinen Laden der Webseite Ihre IP-Adresse unbemerkt an Server Dritter in Drittstaaten übertragen wird.'}
          </p>
        </div>

        {/* 3. Vercel Web Analytics */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            {language === 'en' ? '3. Vercel Web Analytics (Cookieless Metrics)' : '3. Vercel Web Analytics (Cookielose Reichweitenmessung)'}
          </h2>
          <p>
            {language === 'en'
              ? 'This website utilizes Vercel Web Analytics, provided by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.'
              : 'Diese Website nutzt Vercel Web Analytics, einen Dienst der Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.'}
          </p>
          <p className="mt-2">
            {language === 'en'
              ? 'Vercel Web Analytics is designed to operate without cookies, aims not to create individual user profiles, and is intended not to store personal data permanently. To measure anonymous page views and optimize loading times, an ephemeral, irreversible hash is generated that prevents identification of your individual person or device. IP addresses are not stored persistently.'
              : 'Vercel Web Analytics ist cookielos ausgelegt und soll keine individuellen Nutzerprofile erstellen oder personenbezogene Daten dauerhaft speichern. Zur statistischen Zählung von Seitenaufrufen und zur Optimierung der Ladezeiten wird lediglich ein kurzlebiger, irreversibler Hash erzeugt, der keine Rückschlüsse auf Ihre Identität zulässt. Ihre IP-Adresse wird nicht persistent gespeichert.'}
          </p>
          <p className="mt-2">
            {language === 'en'
              ? 'The legal basis is our legitimate interest in the technically stable, secure, and needs-oriented provision of our informational service in accordance with Art. 6 (1) lit. f GDPR.'
              : 'Rechtsgrundlage ist unser berechtigtes Interesse an der bedarfsgerechten und stabilen Bereitstellung unseres Online-Angebots gemäß Art. 6 Abs. 1 lit. f DSGVO.'}
          </p>
        </div>

        {/* 4. Live DNS-over-HTTPS (DoH) Validator, Bulk-Scanner & API */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            {language === 'en' ? '4. Live DNS-over-HTTPS (DoH) Validator, Bulk Scanner & API' : '4. Funktionsweise des Live DNS-Validators, Bulk-Scanners und der REST-API'}
          </h2>
          <p>
            {language === 'en'
              ? 'When verifying a domain via our live validator or bulk scanner, DNS lookups run over HTTPS (DoH) directly from your client browser to public anycast resolvers provided by Cloudflare Inc. or Google LLC. Only publicly queried DNS records (_for-sale.[domain]) are retrieved. We do not store your inspected domains or submitted portfolio lists on our servers, nor do we create user profiles.'
              : 'Wenn Sie eine Domain in unserem Live-Validator oder dem Portfolio Bulk-Scanner prüfen, sendet Ihr Browser DNS-Abfragen über HTTPS (DoH) an die öffentlichen Anycast-Resolver von Cloudflare Inc. bzw. Google LLC. Hierbei wird ausschließlich der öffentlich registrierte Resource Record _for-sale.[eingegebene-domain] abgefragt. Wir speichern die von Ihnen eingegebenen Domains oder Portfolio-Listen nicht auf unseren Servern und erstellen keine Nutzungsprofile.'}
          </p>
        </div>

        {/* 5. Server-Log-Dateien */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {language === 'en' ? '5. Server Log Files' : '5. Server-Log-Dateien'}
          </h2>
          <p>
            {language === 'en'
              ? 'When accessing this website, our hosting provider (Vercel) automatically logs standard technical connection data (server logs), including browser user-agent, operating system, referrer URL, and timestamp. This data is not assignable to specific individuals and serves solely to ensure technical operation and denial-of-service defense.'
              : 'Beim Aufruf dieser Website erfasst unser Hosting-Dienstleister (Vercel) automatisch technische Informationen (sogenannte Server-Logfiles), darunter Browsertyp, Betriebssystem, Referrer URL und Uhrzeit der Serveranfrage. Diese Daten sind nicht bestimmten Personen zuordenbar und dienen ausschließlich der Sicherstellung eines störungsfreien Betriebs.'}
          </p>
        </div>

        {/* 6. Betroffenenrechte */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {language === 'en' ? '6. Your Rights as a Data Subject' : '6. Ihre Rechte als betroffene Person'}
          </h2>
          <p>
            {language === 'en'
              ? 'Under applicable data protection laws, you have the right at any time to free information regarding your stored personal data, its origin and recipients, and the right to rectification or erasure. For any inquiries regarding personal data and privacy, you may contact us at any time via the address specified in the '
              : 'Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger sowie das Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an die im '}
            <Link to={`${langPrefix}/impressum`} className="text-emerald-700 font-bold hover:underline">
              {language === 'en' ? 'Imprint' : 'Impressum'}
            </Link>
            {language === 'en' ? '.' : ' angegebene Adresse wenden.'}
          </p>
        </div>

      </div>

    </div>
  );
}
