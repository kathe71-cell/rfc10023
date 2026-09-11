import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, EyeOff, Server, Globe } from 'lucide-react';

export default function Datenschutz() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Datenschutz nach DSGVO &amp; TTDSG</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Datenschutzerklärung
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-mono">
          Transparenz und Datensparsamkeit auf rfc10023.de
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-700 text-sm leading-relaxed shadow-xs">
        
        {/* 1. Verantwortlicher */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            1. Verantwortliche Stelle
          </h2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und sonstiger datenschutzrechtlicher Bestimmungen ist der Betreiber dieser Website. 
            Vollständige Kontaktdaten siehe <Link to="/impressum" className="text-emerald-700 font-bold hover:underline">Impressum</Link>.
          </p>
        </div>

        {/* 2. Zero-CDN & System-Schriften */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-emerald-600" />
            2. Keine externen CDNs (Zero-CDN-Prinzip)
          </h2>
          <p>
            Auf dieser Website werden <strong>keine externen Webfonts</strong> (wie z. B. Google Fonts) oder externe CDN-Bibliotheken eingebunden. 
            Es werden ausschließlich lokal auf Ihrem Endgerät vorinstallierte Systemschriftarten verwendet. 
            Dadurch wird verhindert, dass beim reinen Laden der Webseite Ihre IP-Adresse unbemerkt an Server Dritter in Drittstaaten übertragen wird.
          </p>
        </div>

        {/* 3. Vercel Web Analytics */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            3. Vercel Web Analytics (Cookielose Reichweitenmessung)
          </h2>
          <p>
            Diese Website nutzt <strong>Vercel Web Analytics</strong>, einen Dienst der Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
          </p>
          <p className="mt-2">
            Vercel Web Analytics arbeitet <strong>vollständig ohne Cookies</strong>, speichert keine personenbezogenen Daten und rekonstruiert keine individuellen Nutzerprofile über Webseiten hinweg. 
            Zur statistischen Zählung von Seitenaufrufen und zur Optimierung der Ladezeiten wird lediglich ein kurzlebiger, irreversibler Hash erzeugt, der keine Rückschlüsse auf Ihre Identität zulässt. 
            Ihre IP-Adresse wird nicht persistent gespeichert.
          </p>
          <p className="mt-2">
            Rechtsgrundlage ist unser berechtigtes Interesse an der bedarfsgerechten und stabilen Bereitstellung unseres Online-Angebots gemäß Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </div>

        {/* 4. Live DNS-over-HTTPS (DoH) Validator, Bulk-Scanner & API */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            4. Funktionsweise des Live DNS-Validators, Bulk-Scanners und der REST-API
          </h2>
          <p>
            Wenn Sie eine Domain in unserem Live-Validator oder dem Portfolio Bulk-Scanner prüfen, sendet Ihr Browser DNS-Abfragen über HTTPS (DoH) an die öffentlichen Anycast-Resolver von Cloudflare Inc. bzw. Google LLC. 
            Hierbei wird ausschließlich der öffentlich registrierte Resource Record <code>_for-sale.[eingegebene-domain]</code> abgefragt. 
            Wir speichern die von Ihnen eingegebenen Domains oder Portfolio-Listen nicht auf unseren Servern und erstellen keine Nutzungsprofile.
          </p>
        </div>

        {/* 5. Server-Log-Dateien */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            5. Server-Log-Dateien
          </h2>
          <p>
            Beim Aufruf dieser Website erfasst unser Hosting-Dienstleister (Vercel) automatisch technische Informationen (sogenannte Server-Logfiles), 
            darunter Browsertyp, Betriebssystem, Referrer URL und Uhrzeit der Serveranfrage. 
            Diese Daten sind nicht bestimmten Personen zuordenbar und dienen ausschließlich der Sicherstellung eines störungsfreien Betriebs.
          </p>
        </div>

        {/* 6. Betroffenenrechte */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            6. Ihre Rechte als betroffene Person
          </h2>
          <p>
            Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, 
            deren Herkunft und Empfänger sowie das Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. 
            Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an die im <Link to="/impressum" className="text-emerald-700 font-bold hover:underline">Impressum</Link> angegebene Adresse wenden.
          </p>
        </div>

      </div>

    </div>
  );
}
