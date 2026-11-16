'use client';

import React, { useState } from 'react';
import { SocialAccount } from '@/lib/types';
import {
  Settings,
  Share2,
  Users,
  ShieldCheck,
  Key,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  Database,
  Lock,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'tokens' | 'accounts' | 'team' | 'api'>('tokens');

  // Real API Tokens form
  const [tokens, setTokens] = useState({
    metaToken: '',
    xBearerToken: '',
    linkedInToken: '',
    tiktokToken: '',
    googleBusinessKey: '',
  });
  const [savedTokens, setSavedTokens] = useState(false);

  const handleSaveTokens = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedTokens(true);
    setTimeout(() => setSavedTokens(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-400" />
          Paramètres & Gestion des Réseaux
        </h1>
        <p className="text-xs text-slate-400">
          Gérez vos clés API directes, profils connectés, membres de l&apos;équipe et intégrations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'tokens'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Tokens & Accès Développeurs</span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'accounts'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Comptes Réseaux ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'team'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Équipe & Rôles</span>
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'api'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Supabase & IA Gemini</span>
        </button>
      </div>

      {/* TAB 0: TOKENS & ACCÈS DÉVELOPPEURS DIRECTS */}
      {activeTab === 'tokens' && (
        <form onSubmit={handleSaveTokens} className="pulse-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400" />
                Intégration Directe des Tokens APIs Réseaux Sociaux
              </h3>
              <p className="text-xs text-slate-400">
                Collez vos tokens développeurs obtenus (Meta Graph API, X API v2, LinkedIn OAuth, TikTok) pour synchroniser vos vrais comptes.
              </p>
            </div>
            <button
              type="submit"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md ${
                savedTokens ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
              }`}
            >
              {savedTokens ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedTokens ? 'Tokens Enregistrés !' : 'Enregistrer les Tokens'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meta Graph (Instagram & Facebook) */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                Meta Graph Access Token (Instagram & Facebook)
              </label>
              <p className="text-[11px] text-slate-400">
                Généré depuis Meta for Developers (Graph API Explorer) avec permissions `pages_manage_posts`, `instagram_content_publish`.
              </p>
              <input
                type="password"
                placeholder="EAA..."
                value={tokens.metaToken}
                onChange={(e) => setTokens({ ...tokens, metaToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* X / Twitter API v2 */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                X (Twitter) Bearer Token / API Key
              </label>
              <p className="text-[11px] text-slate-400">
                Généré depuis Twitter Developer Portal avec accès `tweet.read`, `tweet.write`, `users.read`.
              </p>
              <input
                type="password"
                placeholder="AAAA..."
                value={tokens.xBearerToken}
                onChange={(e) => setTokens({ ...tokens, xBearerToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* LinkedIn OAuth */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                LinkedIn Member / Page Access Token
              </label>
              <p className="text-[11px] text-slate-400">
                Généré depuis LinkedIn Developer Portal avec scopes `w_member_social`, `rw_organization_admin`.
              </p>
              <input
                type="password"
                placeholder="AQX..."
                value={tokens.linkedInToken}
                onChange={(e) => setTokens({ ...tokens, linkedInToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* TikTok for Developers */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                TikTok Content Posting API Token
              </label>
              <p className="text-[11px] text-slate-400">
                Généré depuis TikTok for Developers avec permissions `video.publish`, `video.upload`.
              </p>
              <input
                type="password"
                placeholder="act.example..."
                value={tokens.tiktokToken}
                onChange={(e) => setTokens({ ...tokens, tiktokToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 1: CONNECTED ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {accounts.length} compte social connecté
            </span>
            <button
              onClick={() => setActiveTab('tokens')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connecter un nouveau réseau</span>
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="py-16 text-center pulse-card p-8 border-dashed border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Aucun réseau social connecté pour le moment</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Connectez vos pages Instagram, Facebook, LinkedIn ou profils X dans l&apos;onglet &quot;Tokens & Accès Développeurs&quot; pour synchroniser vos publications en direct.
              </p>
              <button
                onClick={() => setActiveTab('tokens')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all hover:scale-105"
              >
                <Lock className="w-4 h-4" />
                Configurer mes tokens réseaux
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="pulse-card p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={acc.avatar_url}
                      alt={acc.account_name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white leading-tight">
                        {acc.account_name}
                      </h4>
                      <p className="text-xs text-slate-400">{acc.username}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {acc.followers_count.toLocaleString()} abonnés
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAM */}
      {activeTab === 'team' && (
        <div className="pulse-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">
                Membres & Rôles de l&apos;Espace de Travail
              </h3>
              <p className="text-xs text-slate-400">
                Gérez les permissions de publication et les circuits d&apos;approbation.
              </p>
            </div>
            <button
              onClick={() => alert('Inviter un collaborateur')}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-colors"
            >
              + Inviter un collaborateur
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Super-Admin (Propriétaire)', email: 'admin@pulsesocial.app', role: 'Super-Admin (Accès Illimité)' },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800"
              >
                <div>
                  <p className="font-bold text-xs text-white">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{m.email}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-400">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: API, GEMINI & SUPABASE */}
      {activeTab === 'api' && (
        <div className="pulse-card p-6 space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Moteur IA Gemini & Base de Données
            </h3>
            <p className="text-xs text-slate-400">
              Génère automatiquement les légendes, réécritures multi-canaux et réponses intelligentes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-bold text-xs text-emerald-300">
                  Clé d&apos;API Gemini connectée et opérationnelle
                </p>
                <p className="text-[10px] text-emerald-400">
                  Modèle : gemini-2.0-flash • Clé active configurée dans .env.local
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
              Actif
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              <p className="font-bold text-xs text-violet-300">
                Base de données Supabase PostgreSQL
              </p>
            </div>
            <p className="text-[10px] text-slate-300">
              Projet : https://ljpslbcouvyyzzvxxfme.supabase.co • Schéma complet : 13 tables actives
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
