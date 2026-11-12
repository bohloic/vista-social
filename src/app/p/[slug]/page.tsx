import React from 'react';
import { INITIAL_VISTA_PAGE } from '@/lib/mockData';
import { ExternalLink, Sparkles } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicVistaPage({ params }: Props) {
  const { slug } = await params;

  // In production, queries Supabase by slug; fallback to mock data
  const page = slug === INITIAL_VISTA_PAGE.slug ? INITIAL_VISTA_PAGE : INITIAL_VISTA_PAGE;

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-b ${page.theme_config.bg_gradient} text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none`}
    >
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6 pt-6">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full p-1.5 border-2 border-white/40 overflow-hidden shadow-2xl shrink-0">
          <img
            src={page.avatar_url}
            alt={page.title}
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">{page.title}</h1>
          <p className="text-xs sm:text-sm text-white/85 whitespace-pre-line leading-relaxed max-w-sm">
            {page.bio}
          </p>
        </div>

        {/* Social Icons Quick Row */}
        <div className="flex items-center gap-3 pt-1">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center font-bold text-xs transition-transform hover:scale-110"
            aria-label="Instagram"
          >
            IG
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center font-bold text-xs transition-transform hover:scale-110"
            aria-label="LinkedIn"
          >
            in
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center font-bold text-xs transition-transform hover:scale-110"
            aria-label="Twitter / X"
          >
            𝕏
          </a>
        </div>

        {/* Action Links */}
        <div className="w-full space-y-3.5 pt-4">
          {page.blocks.map((block) => (
            <a
              key={block.id}
              href={block.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="w-full p-4 rounded-2xl block text-center border backdrop-blur-md shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: page.theme_config.button_bg,
                borderColor: page.theme_config.button_border,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="w-4" />
                <span className="font-bold text-sm leading-tight flex-1">
                  {block.title}
                </span>
                <ExternalLink className="w-4 h-4 text-white/60" />
              </div>
              {block.subtitle && (
                <p className="text-[11px] text-white/70 mt-1 leading-snug">
                  {block.subtitle}
                </p>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-12 pb-4 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] text-white/75 font-semibold border border-white/15 hover:bg-white/20 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-yellow-300" />
          <span>Propulsé par Vista Social CM</span>
        </a>
      </footer>
    </div>
  );
}
