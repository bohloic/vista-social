'use client';

import React, { useState } from 'react';
import { INITIAL_ACCOUNTS } from '@/lib/mockData';
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
} from 'lucide-react';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>(INITIAL_ACCOUNTS);
  const [activeTab, setActiveTab] = useState<'accounts' | 'team' | 'api'>('accounts');

  const handleToggleConnection = (id: string) => {
    setAccounts(
      accounts.map((a) => (a.id === id ? { ...a, is_connected: !a.is_connected } : a))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Paramètres & Gestion des Réseaux
        </h1>
        <p className="text-xs text-slate-500">
          Gérez vos profils connectés, membres de l&apos;équipe et clés d&apos;intégration.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'accounts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Comptes Connectés ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'team'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Équipe & Rôles</span>
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'api'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Intégrations & IA Gemini</span>
        </button>
      </div>

      {/* TAB 1: CONNECTED ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              5 réseaux sociaux synchronisés avec les APIs officielles
            </span>
            <button
              onClick={() => alert('Ouverture du flux OAuth d&apos;autorisation...')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connecter un nouveau réseau</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="vista-card p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={acc.avatar_url}
                      alt={acc.account_name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white uppercase ${
                        acc.platform === 'instagram'
                          ? 'badge-instagram'
                          : acc.platform === 'linkedin'
                          ? 'badge-linkedin'
                          : 'badge-twitter'
                      }`}
                    >
                      {acc.platform.slice(0, 2)}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {acc.account_name}
                    </h4>
                    <p className="text-xs text-slate-400">{acc.username}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {acc.followers_count.toLocaleString()} abonnés
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.is_connected
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {acc.is_connected ? 'Synchronisé' : 'Déconnecté'}
                  </span>

                  <div>
                    <button
                      onClick={() => handleToggleConnection(acc.id)}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-semibold block"
                    >
                      {acc.is_connected ? 'Déconnecter' : 'Reconnexion'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TEAM */}
      {activeTab === 'team' && (
        <div className="vista-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Membres de l&apos;espace Studio Nova
              </h3>
              <p className="text-xs text-slate-400">
                Gérez les permissions de publication et les circuits d&apos;approbation.
              </p>
            </div>
            <button
              onClick={() => alert('Inviter un collaborateur')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Inviter un collaborateur
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Sarah Connor', email: 'sarah@studionova.agency', role: 'Lead Community Manager (Admin)' },
              { name: 'Alexandre Dumas', email: 'alex@studionova.agency', role: 'Rédacteur & Créatif' },
              { name: 'Client Approbateur', email: 'dircom@clientbrand.com', role: 'Client (Validation des brouillons)' },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{m.email}</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: API & GEMINI */}
      {activeTab === 'api' && (
        <div className="vista-card p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Moteur IA Gemini 2.0 Flash
            </h3>
            <p className="text-xs text-slate-400">
              Génère automatiquement les légendes, réécritures multi-canaux et réponses de community management.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold text-xs text-emerald-900 dark:text-emerald-300">
                  Clé d&apos;API Gemini connectée et opérationnelle
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Modèle : gemini-2.0-flash • Clé active configurée dans .env.local
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
              Actif
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1">
            <p className="font-bold text-xs text-indigo-900 dark:text-indigo-300">
              Base de données Supabase (PostgreSQL)
            </p>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400">
              Projet : https://azhboxpmkrosvykmxzct.supabase.co • Schéma complet : supabase_schema.sql
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

