import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface SocialShareProps {
  url?: string;
  title?: string;
  summary?: string;
}

export default function SocialShare({
  url = 'https://rfc10023.de',
  title = 'RFC 10023 DACH Portal – Domain-Verkäufe direkt im DNS',
  summary = 'Der neue IETF-Standard RFC 10023: Verkaufsangebote dezentral im DNS hinterlegen ohne Parking oder Weiterleitung.'
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title} – ${url}`);

  const shareLinks = [
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      bgColor: 'hover:bg-[#0077b5] hover:text-white',
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
      bgColor: 'hover:bg-slate-900 hover:text-white',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bgColor: 'hover:bg-[#1877f2] hover:text-white',
    },
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}`,
      bgColor: 'hover:bg-[#25d366] hover:text-white',
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
      <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-1">
        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Teilen:</span>
      </div>

      {shareLinks.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 transition-colors shadow-2xs ${item.bgColor}`}
        >
          {item.name}
        </a>
      ))}

      <button
        type="button"
        onClick={handleCopy}
        className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs flex items-center gap-1"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
        <span>{copied ? 'Kopiert' : 'Link'}</span>
      </button>
    </div>
  );
}
