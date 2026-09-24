import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes, Layout } from './App';
import { LanguageProvider } from './context/LanguageContext';

export function render(url: string) {
  const isEn = url === '/en' || url.startsWith('/en/');
  const html = renderToString(
    <StaticRouter location={url}>
      <LanguageProvider initialLanguage={isEn ? 'en' : 'de'}>
        <Layout>
          <AppRoutes />
        </Layout>
      </LanguageProvider>
    </StaticRouter>
  );

  return { html, isEn };
}
