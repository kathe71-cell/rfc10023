import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom 100% DSGVO-compliant Vercel Web Analytics tracker for React Router & Vite.
 * Works seamlessly alongside @vercel/analytics.
 */
export default function VercelAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // 1. Ensure Vercel Insights queue is defined
    if (!window.va) {
      window.va = function (...params: unknown[]) {
        (window.vaq = window.vaq || []).push(params as [string, unknown?]);
      };
    }

    // 2. Dynamically inject Vercel Insights script if not already in DOM
    if (!document.getElementById('vercel-insights-script')) {
      const script = document.createElement('script');
      script.id = 'vercel-insights-script';
      script.src = '/_vercel/insights/script.js';
      script.defer = true;
      document.head.appendChild(script);
    }

    // 3. Send route pageview telemetry to Vercel Insights Edge
    try {
      if (typeof window.va === 'function') {
        window.va('pageview', { 
          route: location.pathname + location.search 
        });
      }
    } catch {
      window.vaq = window.vaq || [];
      window.vaq.push(['pageview', { route: location.pathname + location.search }]);
    }
  }, [location]);

  return null;
}
