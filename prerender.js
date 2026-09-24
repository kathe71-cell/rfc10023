import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute("dist/index.html"), "utf-8");
const { render } = await import("./dist-ssr/entry-server.js");

const routesToPrerender = [
  { url: "/", title: "RFC 10023 & FORSALE1 | Referenz-Portal & DNS-Validator für Domainverkäufe", desc: "Unabhängiges Referenz-Portal und Toolkit für IETF RFC 10023 (Informational). DNS-Validator für _for-sale TXT-Records, REST-API v1 & Generator." },
  { url: "/validator", title: "RFC 10023 DNS-Validator | Live-Prüfung von _for-sale Einträgen", desc: "Prüfe _for-sale TXT-Einträge live im DNS mit genauer Fehlerdifferenzierung, DNSSEC-Transparenz und E-Mail-Routing-Diagnose." },
  { url: "/generator", title: "RFC 10023 Generator | DNS-Verkaufseinträge erstellen", desc: "Erstelle standardkonforme RFC 10023 Multi-Record RRsets für Cloudflare, Hetzner, INWX, Netcup, BIND und Terraform." },
  { url: "/bulk-scan", title: "RFC 10023 Portfolio-Prüfung | Massenabfrage", desc: "Gleichzeitige Prüfung ganzer Domain-Portfolios auf RFC 10023 Verkaufssignale mit DoH-Ratenbegrenzung und CSV-Export." },
  { url: "/badge-generator", title: "RFC 10023 Badge Generator | DNS-Verkaufsstatus einbinden", desc: "Erstelle neutrale Prüf-Links und 100% datenschutzkonforme HTML/CSS-Badges für Domain-Verkaufsseiten." },
  { url: "/api-docs", title: "RFC 10023 REST-API v1 | Dokumentation & Endpunkte", desc: "Vollständige Dokumentation der JSON DoH REST-API für RFC 10023 DNS-Validierung mit Code-Beispielen." },
  { url: "/recht-leitfaden", title: "RFC 10023 Recht & Praxis | Bindungswirkung & Steuern", desc: "Rechtliche Leitfäden für Domainverkäufe via DNS-Signal: Bindungswirkung nach BGB, Preisauszeichnung, MwSt. und Escrow-Treuhand." },
  { url: "/hoster-matrix", title: "RFC 10023 DNS-Anbieter Matrix & Anleitungen", desc: "Schritt-für-Schritt-Konfigurationsanleitungen für Hetzner, Cloudflare, INWX, Netcup, BIND und Terraform." },
  { url: "/spezifikation", title: "RFC 10023 ABNF-Spezifikation & Wire Format", desc: "Vollständige technische Spezifikation nach IETF RFC 10023: ABNF-Grammatik, Tag-Definitionen und DNS-Wire-Format." },
  { url: "/faq", title: "RFC 10023 Häufig gestellte Fragen (FAQ)", desc: "Antworten auf alle technischen, praktischen und administrativen Fragen zu RFC 10023 und FORSALE1." },
  { url: "/dokumentation", title: "RFC 10023 Dokumentation | Spezifikation & Leitfäden", desc: "Zentrale Dokumentation zu IETF RFC 10023 (Informational): ABNF-Syntax, Anbieter-Konfigurationen, REST-API und Rechtsfragen." },
  { url: "/oekosystem", title: "RFC 10023 Adoption & Ökosystem – Tools, Integrationen und Statistiken", desc: "Aktuelle Übersicht zur Verbreitung von RFC 10023 und dem _for-sale DNS Record: Implementierungen, Tools, Registrare, Datensätze und Adoption." },
  { url: "/impressum", title: "Impressum | RFC 10023 Referenzportal", desc: "Impressum und Anbieterkennzeichnung des RFC 10023 Referenzportals." },
  { url: "/datenschutz", title: "Datenschutzerklärung | RFC 10023 Referenzportal", desc: "Datenschutzhinweise und DSGVO-Informationen des RFC 10023 Referenzportals." },
  { url: "/en", title: "RFC 10023 | Signal Domain Sales Directly in the DNS", desc: "Independent reference portal & developer toolkit for IETF RFC 10023 (Informational). Live DNS validator and multi-record builder." },
  { url: "/en/validator", title: "RFC 10023 DNS Validator | Live _for-sale Inspection", desc: "Inspect live _for-sale TXT records with DNS error taxonomy, DNSSEC AD-flag check and isolated mail routing diagnostics." },
  { url: "/en/generator", title: "RFC 10023 Record Generator | DNS for-sale RRset Builder", desc: "Build specification-compliant RFC 10023 multi-record RRsets for Cloudflare, Hetzner, INWX, BIND and Terraform." },
  { url: "/en/bulk-scan", title: "RFC 10023 Bulk Portfolio Auditor | Multi-Domain Scan", desc: "Audit multiple domain names simultaneously for RFC 10023 for-sale TXT records with throttled DoH requests." },
  { url: "/en/badge-generator", title: "RFC 10023 Status Badge Generator", desc: "Generate neutral DNS verification links and privacy-compliant HTML/CSS badges for domain sales pages." },
  { url: "/en/api-docs", title: "RFC 10023 REST API Documentation & Endpoints", desc: "Comprehensive documentation of the public DoH JSON REST API for automated RFC 10023 validation." },
  { url: "/en/legal-guidelines", title: "RFC 10023 Legal Guidelines & Best Practices", desc: "Legal overview for signaling domain sales in the DNS: offer vs invitatio ad offerendum, VAT and escrow." },
  { url: "/en/legal-guide", title: "RFC 10023 Legal Guide", desc: "Legal overview for signaling domain sales in the DNS." },
  { url: "/en/hoster-matrix", title: "RFC 10023 DNS Provider Compatibility Matrix", desc: "Step-by-step guides for configuring _for-sale TXT records on Cloudflare, Hetzner, INWX, BIND and Terraform." },
  { url: "/en/specification", title: "RFC 10023 ABNF Specification & Wire Format", desc: "Complete technical reference for IETF RFC 10023: formal ABNF grammar, parameter registry and parser rules." },
  { url: "/en/faq", title: "RFC 10023 Frequently Asked Questions (FAQ)", desc: "Frequently asked questions regarding IETF RFC 10023 _for-sale DNS records." },
  { url: "/en/documentation", title: "RFC 10023 Documentation Hub", desc: "Central documentation for IETF RFC 10023 (Informational), hoster configuration matrix, and developer API." },
  { url: "/en/ecosystem", title: "RFC 10023 Adoption & Ecosystem – Tools, Integrations and Statistics", desc: "Comprehensive overview of RFC 10023 and _for-sale DNS record adoption: implementations, tools, registrars, datasets and verified telemetry." },
  { url: "/en/imprint", title: "Imprint | RFC 10023 Reference Portal", desc: "Legal notice and imprint for RFC 10023 Reference Portal." },
  { url: "/en/privacy", title: "Privacy Policy | RFC 10023 Reference Portal", desc: "Privacy policy and GDPR compliance statement for RFC 10023 Reference Portal." },
  { url: "/widget-embed", title: "RFC 10023 Widget Embed", desc: "RFC 10023 Live Widget Embed" },
  { url: "/rechner-embed", title: "RFC 10023 Rechner Embed", desc: "RFC 10023 Rechner Embed" },
  { url: "/validator-embed", title: "RFC 10023 Validator Embed", desc: "RFC 10023 Validator Embed" },
  { url: "/en/widget-embed", title: "RFC 10023 Widget Embed", desc: "RFC 10023 Live Widget Embed" },
  { url: "/en/rechner-embed", title: "RFC 10023 Calculator Embed", desc: "RFC 10023 Calculator Embed" },
  { url: "/en/validator-embed", title: "RFC 10023 Validator Embed", desc: "RFC 10023 Validator Embed" }
];

const deToEnRouteMap = {
  "/": "/en",
  "/validator": "/en/validator",
  "/generator": "/en/generator",
  "/bulk-scan": "/en/bulk-scan",
  "/badge-generator": "/en/badge-generator",
  "/api-docs": "/en/api-docs",
  "/recht-leitfaden": "/en/legal-guidelines",
  "/hoster-matrix": "/en/hoster-matrix",
  "/spezifikation": "/en/specification",
  "/faq": "/en/faq",
  "/dokumentation": "/en/documentation",
  "/oekosystem": "/en/ecosystem",
  "/impressum": "/en/imprint",
  "/datenschutz": "/en/privacy"
};

const enToDeRouteMap = {
  "/en": "/",
  "/en/validator": "/validator",
  "/en/generator": "/generator",
  "/en/bulk-scan": "/bulk-scan",
  "/en/badge-generator": "/badge-generator",
  "/en/api-docs": "/api-docs",
  "/en/legal-guidelines": "/recht-leitfaden",
  "/en/legal-guide": "/recht-leitfaden",
  "/en/hoster-matrix": "/hoster-matrix",
  "/en/specification": "/spezifikation",
  "/en/faq": "/faq",
  "/en/documentation": "/dokumentation",
  "/en/ecosystem": "/oekosystem",
  "/en/imprint": "/impressum",
  "/en/privacy": "/datenschutz"
};

console.log("Starting prerendering of " + routesToPrerender.length + " routes...");

for (const route of routesToPrerender) {
  try {
    const { html: appHtml, isEn } = render(route.url);
    let rendered = template.replace("<div id=\"root\"></div>", "<div id=\"root\">" + appHtml + "</div>");
    rendered = rendered.replace(/<title>.*?<\/title>/, "<title>" + route.title + "</title>");
    rendered = rendered.replace(/<meta name=\"description\" content=\".*?\" \/>/, "<meta name=\"description\" content=\"" + route.desc + "\" />");
    const fullUrl = "https://www.rfc10023.de" + (route.url === "/" ? "" : route.url);
    rendered = rendered.replace(/<link rel=\"canonical\" href=\".*?\" \/>/, "<link rel=\"canonical\" href=\"" + fullUrl + "\" />");
    rendered = rendered.replace(/<meta property=\"og:url\" content=\".*?\" \/>/, "<meta property=\"og:url\" content=\"" + fullUrl + "\" />");
    rendered = rendered.replace(/<meta name=\"twitter:url\" content=\".*?\" \/>/, "<meta name=\"twitter:url\" content=\"" + fullUrl + "\" />");
    rendered = rendered.replace(/<meta property=\"og:title\" content=\".*?\" \/>/, "<meta property=\"og:title\" content=\"" + route.title + "\" />");
    rendered = rendered.replace(/<meta name=\"twitter:title\" content=\".*?\" \/>/, "<meta name=\"twitter:title\" content=\"" + route.title + "\" />");
    rendered = rendered.replace(/<meta property=\"og:description\" content=\".*?\" \/>/, "<meta property=\"og:description\" content=\"" + route.desc + "\" />");
    rendered = rendered.replace(/<meta name=\"twitter:description\" content=\".*?\" \/>/, "<meta name=\"twitter:description\" content=\"" + route.desc + "\" />");

    // Dynamic Route-Aware hreflang
    let dePath = "/";
    let enPath = "/en";
    if (route.url in enToDeRouteMap) {
      dePath = enToDeRouteMap[route.url];
      enPath = route.url;
    } else if (route.url in deToEnRouteMap) {
      dePath = route.url;
      enPath = deToEnRouteMap[route.url];
    }
    const hreflangDe = "https://www.rfc10023.de" + (dePath === "/" ? "/" : dePath);
    const hreflangEn = "https://www.rfc10023.de" + enPath;
    const hreflangDefault = hreflangDe;

    rendered = rendered.replace(/<link rel=\"alternate\" hreflang=\"de\" href=\".*?\" \/>/, `<link rel="alternate" hreflang="de" href="${hreflangDe}" />`);
    rendered = rendered.replace(/<link rel=\"alternate\" hreflang=\"en\" href=\".*?\" \/>/, `<link rel="alternate" hreflang="en" href="${hreflangEn}" />`);
    rendered = rendered.replace(/<link rel=\"alternate\" hreflang=\"x-default\" href=\".*?\" \/>/, `<link rel="alternate" hreflang="x-default" href="${hreflangDefault}" />`);

    if (isEn) {
      rendered = rendered.replace("<html lang=\"de\"", "<html lang=\"en\"");
      rendered = rendered.replace("content=\"de_DE\"", "content=\"en_US\"");

      // Replace global German structured data in head for English routes
      const enJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "https://www.rfc10023.de/#org",
            "name": "RFC 10023 Editorial Team",
            "url": "https://www.rfc10023.de/en",
            "logo": "https://www.rfc10023.de/favicon.svg"
          },
          {
            "@type": "WebSite",
            "@id": "https://www.rfc10023.de/#website",
            "url": "https://www.rfc10023.de/en",
            "name": "RFC 10023 Reference Portal",
            "inLanguage": "en-US",
            "publisher": { "@id": "https://www.rfc10023.de/#org" },
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://www.rfc10023.de/en/validator?d={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "SoftwareApplication",
            "@id": "https://www.rfc10023.de/#validator",
            "name": "RFC 10023 DNS Live Validator & Generator",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0.00",
              "priceCurrency": "EUR"
            }
          },
          {
            "@type": "FAQPage",
            "@id": "https://www.rfc10023.de/#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is RFC 10023?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "RFC 10023 is an Informational publication published in July 2026 by the IETF ('The _for-sale Underscored and Globally Scoped DNS Node Name'), authored by Marco Davids (SIDN Labs). It defines a machine-readable convention in the DNS for domain owners to publish availability for sale via _for-sale TXT records."
                }
              },
              {
                "@type": "Question",
                "name": "What is the designated DNS node for RFC 10023?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The standardized DNS node is '_for-sale.[domain]', such as '_for-sale.example.com'. A TXT record is placed there starting mandatory with 'v=FORSALE1;'."
                }
              },
              {
                "@type": "Question",
                "name": "Which registries already support RFC 10023?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Dutch ccTLD registry SIDN (.nl) natively evaluates RFC 10023 during Whois and domain availability searches. The standard is also supported across various registrars, developer tools, and scanners."
                }
              }
            ]
          }
        ]
      }, null, 2);

      rendered = rendered.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        `<script type="application/ld+json">\n${enJsonLd}\n    </script>`
      );
    }
    const filePath = route.url === "/" ? "dist/index.html" : "dist" + route.url + "/index.html";
    const absolutePath = toAbsolute(filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, rendered);
    console.log("  ✓ " + route.url + " -> " + filePath + " (" + (rendered.length / 1024).toFixed(1) + " kB)");
  } catch (err) {
    console.error("  ✗ Error prerendering " + route.url + ":", err);
    process.exit(1);
  }
}

// Regression Test Assertion for /en/ecosystem
const enEcosystemPath = toAbsolute("dist/en/ecosystem/index.html");
if (fs.existsSync(enEcosystemPath)) {
  const enHtml = fs.readFileSync(enEcosystemPath, "utf-8");
  const forbiddenGermanPhrases = [
    "Letzte Aktualisierung",
    "Erkannte _for-sale Records",
    "Erkannte",
    "Quelle öffnen",
    "Zuletzt geprüft",
    "Beobachtet seit",
    "Methodik",
    "Schritt 1",
    "RFC 10023 ist ein noch junger Mechanismus",
    "RFC 10023 Adoption Kennzahlen",
    "Telemetrische Zeitreihe der Adoption",
    "Hinweis zur methodischen Integrität",
    "Drei Arten der RFC-10023-Adoption",
    "Vom DNS-Signal zur Domain-Suche",
    "Was ist RFC 10023?",
    "Wie lautet der DNS-Knoten",
    "Welche Registries unterstützen"
  ];

  const foundViolations = [];
  for (const phrase of forbiddenGermanPhrases) {
    if (enHtml.includes(phrase)) {
      foundViolations.push(phrase);
    }
  }

  if (foundViolations.length > 0) {
    console.error("❌ SSG Prerender Regression Error: Found German phrases in dist/en/ecosystem/index.html:");
    for (const v of foundViolations) {
      console.error("   - " + v);
    }
    process.exit(1);
  } else {
    console.log("  ✓ Regression Check: dist/en/ecosystem/index.html contains 0 forbidden German phrases.");
  }
} else {
  console.error("❌ SSG Prerender Error: dist/en/ecosystem/index.html was not generated.");
  process.exit(1);
}

console.log("Static Site Prerendering complete!");