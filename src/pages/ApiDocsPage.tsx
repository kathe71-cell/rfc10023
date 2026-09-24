import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Copy, Check, Code2, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ApiDocsPage() {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testDomain, setTestDomain] = useState('forsaledns.net');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'curl' | 'js' | 'python' | 'go'>('curl');

  const curlSnippet = `curl -s "https://www.rfc10023.de/api/v1/validate?domain=${testDomain}"`;

  const runLiveTest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/validate?domain=${encodeURIComponent(testDomain)}`);
      const json = await res.json();
      setApiResponse(json);
    } catch (e) {
      setApiResponse({ error: 'Lookup failed', details: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 text-emerald-400 font-mono text-xs font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>RFC 10023 REST API v1.0</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('api.title')}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          {t('api.desc')}
        </p>
      </div>

      {/* Endpoint Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
              GET
            </span>
            <code className="text-sm sm:text-base font-mono font-bold text-slate-900">
              https://www.rfc10023.de/api/v1/validate?domain=&#123;domain&#125;
            </code>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>{t('api.feature_cors')}</span>
            <span>•</span>
            <span>{t('api.feature_auth')}</span>
            <span>•</span>
            <span>{t('api.feature_anycast')}</span>
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            {t('api.params_title')}
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="px-4 py-2.5">{t('api.col_param')}</th>
                  <th className="px-4 py-2.5">{t('api.col_type')}</th>
                  <th className="px-4 py-2.5">{t('api.col_required')}</th>
                  <th className="px-4 py-2.5">{t('api.col_desc')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-900">domain <span className="font-normal text-slate-400">{t('api.param_or')}</span> d</td>
                  <td className="px-4 py-2.5 text-slate-600">string</td>
                  <td className="px-4 py-2.5 text-emerald-700 font-bold">{t('api.param_yes')}</td>
                  <td className="px-4 py-2.5 text-slate-600">{t('api.param_desc')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Try-it Console */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            {t('api.console_title')}
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={testDomain}
              onChange={(e) => setTestDomain(e.target.value)}
              placeholder={t('val.placeholder')}
              className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-slate-900"
            />
            <button
              type="button"
              onClick={runLiveTest}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? t('api.btn_loading') : t('api.btn_send')}
            </button>
            <button
              type="button"
              onClick={copyCurl}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{t('api.btn_copy_curl')}</span>
            </button>
          </div>

          {/* Response Payload */}
          {apiResponse && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto">
              <div className="text-slate-500 mb-2">{t('api.response_label')}</div>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          )}
        </div>

      </div>

      {/* Code Examples with Multi-Language Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-mono font-bold text-slate-900">Developer Code Snippets</h3>
          </div>
          <div className="flex items-center gap-1">
            {(['curl', 'js', 'python', 'go'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveLangTab(tab)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold uppercase transition-all ${
                  activeLangTab === tab
                    ? 'bg-slate-900 text-emerald-400 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'js' ? 'TypeScript' : tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : 'Go'}
              </button>
            ))}
          </div>
        </div>

        {activeLangTab === 'curl' && (
          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
{`# 1. Standard API Query
curl -s "https://www.rfc10023.de/api/v1/validate?domain=forsaledns.net" | jq .

# 2. Extract asking price directly via jq
curl -s "https://www.rfc10023.de/api/v1/validate?domain=forsaledns.net" | jq -r '.tags.parsed.fval'`}
          </pre>
        )}

        {activeLangTab === 'js' && (
          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
{`// TypeScript / Node.js 18+
async function checkDomainSale(domain: string) {
  const res = await fetch(\`https://www.rfc10023.de/api/v1/validate?domain=\${encodeURIComponent(domain)}\`);
  const data = await res.json();
  
  if (data.status === "valid") {
    console.log(\`✅ \${domain} is for sale!\`);
    console.log("Price:", data.tags.parsed.fval || "Inquire");
    console.log("Contact:", data.tags.parsed.furi);
    console.log("DNSSEC Validated:", data.dnssec.authenticated);
  } else {
    console.log(\`No active RFC 10023 record on \${domain}\`);
  }
}

checkDomainSale("forsaledns.net");`}
          </pre>
        )}

        {activeLangTab === 'python' && (
          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
{`# Python 3
import requests

def verify_rfc10023(domain: str):
    url = f"https://www.rfc10023.de/api/v1/validate?domain={domain}"
    response = requests.get(url, timeout=5)
    data = response.json()
    
    if data.get("status") == "valid":
        print(f"Domain {domain} is for sale!")
        print(f"Asking Price: {data['tags']['parsed'].get('fval')}")
        print(f"Contact Endpoint: {data['tags']['parsed'].get('furi')}")
    else:
        print(f"Status: {data.get('statusMessage')}")

verify_rfc10023("forsaledns.net")`}
          </pre>
        )}

        {activeLangTab === 'go' && (
          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
{`// Go 1.20+
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type RfcResponse struct {
	Status string \`json:"status"\`
	Tags   struct {
		Parsed map[string]string \`json:"parsed"\`
	} \`json:"tags"\`
}

func main() {
	resp, err := http.Get("https://www.rfc10023.de/api/v1/validate?domain=forsaledns.net")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var data RfcResponse
	json.NewDecoder(resp.Body).Decode(&data)
	if data.Status == "valid" {
		fmt.Printf("For sale! Price: %s\\n", data.Tags.Parsed["fval"])
	}
}`}
          </pre>
        )}
      </div>

      {/* Ecosystem Link */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <span>
          {isEn
            ? 'See the RFC 10023 ecosystem for additional parsers, scanners, MCP and developer integrations.'
            : 'Weitere Parser, Scanner, MCP- und Entwickler-Integrationen findest du im RFC 10023 Ökosystem.'}
        </span>
        <Link
          to={isEn ? '/en/ecosystem' : '/oekosystem'}
          className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
        >
          {isEn ? 'RFC 10023 Ecosystem & Adoption →' : 'RFC 10023 Ökosystem & Adoption →'}
        </Link>
      </div>

    </div>
  );
}
