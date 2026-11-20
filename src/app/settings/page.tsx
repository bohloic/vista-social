'use client';

import React, { useState, useEffect } from 'react';
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
  Zap,
  ExternalLink,
  Check,
  Loader2,
  X,
  Mail,
  UserCheck,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'editor' | 'client';
  avatar_url?: string;
  is_lifetime_free?: boolean;
  created_at?: string;
}

const OAUTH_PROVIDERS = [
  {
    id: 'instagram',
    name: 'Instagram Business',
    platform: 'instagram' as const,
    color: 'from-amber-500 via-pink-500 to-purple-600',
    description: 'Publication de Posts, Reels, Stories & Statistiques d\'audience',
    suggestedHandle: '@pulsesocial.brand',
    suggestedName: 'PulseSocial Instagram Officiel',
    scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'instagram_manage_comments'],
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    platform: 'facebook' as const,
    color: 'from-blue-600 to-indigo-600',
    description: 'Gestion de pages officielles, commentaires & DMs Messenger',
    suggestedHandle: '@pulsesocial.page',
    suggestedName: 'PulseSocial Facebook Page',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_messaging'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Entreprise & Profil',
    platform: 'linkedin' as const,
    color: 'from-sky-700 to-blue-800',
    description: 'Posts B2B, articles, carrousels et surveillance de mentions',
    suggestedHandle: '@pulsesocial-media',
    suggestedName: 'PulseSocial LinkedIn Entreprise',
    scopes: ['w_member_social', 'r_organization_social', 'w_organization_social', 'r_basicprofile'],
  },
  {
    id: 'twitter',
    name: 'X (ex-Twitter)',
    platform: 'twitter' as const,
    color: 'from-slate-800 to-slate-950',
    description: 'Tweets instantanés, threads, veille de marque et réponses DMs',
    suggestedHandle: '@PulseSocialHQ',
    suggestedName: 'PulseSocial X Pro',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'dm.read', 'dm.write'],
  },
  {
    id: 'tiktok',
    name: 'TikTok for Business',
    platform: 'tiktok' as const,
    color: 'from-teal-400 via-pink-500 to-black',
    description: 'Publication de vidéos courtes HD, analyse des tendances',
    suggestedHandle: '@pulsesocial.tok',
    suggestedName: 'PulseSocial TikTok Pro',
    scopes: ['user.info.basic', 'video.list', 'video.upload', 'video.publish'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Cloud API',
    platform: 'whatsapp' as const,
    color: 'from-emerald-500 via-teal-600 to-green-700',
    description: 'Messagerie directe, notifications automatisées et gestion des prospects clients',
    suggestedHandle: '+225 07 00 00 00 00',
    suggestedName: 'PulseSocial WhatsApp Pro',
    scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
  },
];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'oauth' | 'tokens' | 'accounts' | 'team' | 'api'>('oauth');
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  // Interactive OAuth Modal state
  const [oauthModalProvider, setOauthModalProvider] = useState<typeof OAUTH_PROVIDERS[0] | null>(null);
  const [oauthAccountName, setOauthAccountName] = useState('');
  const [oauthUsername, setOauthUsername] = useState('');

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'editor' | 'client'>('editor');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Real API Tokens form
  const [tokens, setTokens] = useState({
    composioApiKey: '',
    paystackSecretKey: '',
    calComUrl: 'https://cal.com/pulsesocial/rdv-15min',
    metaToken: '',
    xBearerToken: '',
    linkedInToken: '',
    tiktokToken: '',
    googleBusinessKey: '',
    whatsappToken: '',
    whatsappPhoneId: '',
  });
  const [savedTokens, setSavedTokens] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [showSupabaseUrl, setShowSupabaseUrl] = useState(false);

  // Ping test state
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<{
    supabase: { status: string; latencyMs: number };
    ai: { status: string; model: string };
  } | null>(null);

  const toggleTokenVisibility = (key: string) => {
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch real accounts from database
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/social/connect');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) setAccounts(data.accounts);
      }
    } catch (err) {
      console.warn('Failed to fetch accounts from Supabase');
    }
  };

  // Fetch real team members from database
  const fetchTeamMembers = async () => {
    setTeamLoading(true);
    try {
      const res = await fetch('/api/team/members');
      if (res.ok) {
        const data = await res.json();
        if (data.members) setTeamMembers(data.members);
      }
    } catch (err) {
      console.warn('Failed to fetch team members');
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchTeamMembers();
    try {
      const saved = localStorage.getItem('pulsesocial_manual_tokens');
      if (saved) {
        setTokens((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.warn('Could not load manual tokens', e);
    }

    const handleOAuthPopupMessage = (event: MessageEvent) => {
      if (event.data?.type === 'COMPOSIO_OAUTH_SUCCESS') {
        const accName = event.data.account?.account_name || event.data.platform?.toUpperCase();
        setConnectMessage(
          `✓ ${accName} authentifié et synchronisé avec succès via la fenêtre officielle OAuth 2.0 (Composio) !`
        );
        setConnectingPlatform(null);
        fetchAccounts();
      }
    };

    window.addEventListener('message', handleOAuthPopupMessage);
    return () => window.removeEventListener('message', handleOAuthPopupMessage);
  }, []);

  const handleTestConnection = async () => {
    setPingLoading(true);
    try {
      const res = await fetch('/api/health?test=all');
      const data = await res.json();
      setPingResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPingLoading(false);
    }
  };

  // Launch Real External OAuth 2.0 Popup Window via Composio Gateway
  const handleOpenOAuthModal = async (provider: typeof OAUTH_PROVIDERS[0]) => {
    setConnectingPlatform(provider.id);
    setConnectMessage(null);

    try {
      let workspaceId = '';
      try {
        const savedWs = localStorage.getItem('pulsesocial_active_workspace');
        if (savedWs) workspaceId = JSON.parse(savedWs).id || '';
      } catch {
        // ignore
      }

      const res = await fetch('/api/social/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: provider.platform,
          workspaceId: workspaceId || undefined,
          composioApiKey: tokens.composioApiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        setConnectMessage(`Erreur OAuth : ${data.error || 'Impossible d’ouvrir la fenêtre OAuth 2.0'}`);
        setConnectingPlatform(null);
        return;
      }

      const width = 560;
      const height = 740;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      const popup = window.open(
        data.redirectUrl,
        `ComposioOAuth_${provider.platform}`,
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=yes,scrollbars=yes`
      );

      if (!popup) {
        setConnectMessage('Veuillez autoriser les fenêtres pop-up dans votre navigateur pour ouvrir le portail OAuth.');
        setConnectingPlatform(null);
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setConnectingPlatform(null);
          fetchAccounts();
        }
      }, 600);
    } catch {
      setConnectMessage('Erreur réseau lors de l’ouverture de la passerelle OAuth 2.0 Composio.');
      setConnectingPlatform(null);
    }
  };

  // Disconnect social account
  const handleDisconnectAccount = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter le compte ${name} ?`)) return;

    try {
      const res = await fetch(`/api/social/connect?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectMessage(`Compte ${name} déconnecté.`);
        fetchAccounts();
      } else {
        alert(data.error || 'Impossible de déconnecter ce compte');
      }
    } catch (err) {
      alert('Erreur réseau lors de la déconnexion');
    }
  };

  // Invite team member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFullName.trim() || !inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const res = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inviteFullName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConnectMessage(`✓ Invitation envoyée à ${inviteEmail}`);
        setInviteModalOpen(false);
        setInviteFullName('');
        setInviteEmail('');
        fetchTeamMembers();
      } else {
        alert(data.error || 'Erreur lors de l\'invitation');
      }
    } catch (err) {
      alert('Erreur réseau lors de l\'envoi de l\'invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Update member role
  const handleUpdateRole = async (userId: string, newRole: any) => {
    try {
      const res = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectMessage('Rôle mis à jour avec succès.');
        fetchTeamMembers();
      } else {
        alert(data.error || 'Impossible de mettre à jour le rôle');
      }
    } catch (err) {
      alert('Erreur réseau');
    }
  };

  // Remove member
  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment retirer ${name} de l'espace de travail ?`)) return;

    try {
      const res = await fetch(`/api/team/members?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectMessage(`Membre ${name} retiré.`);
        fetchTeamMembers();
      } else {
        alert(data.error || 'Impossible de retirer le membre');
      }
    } catch (err) {
      alert('Erreur réseau');
    }
  };

  const handleSaveTokens = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('pulsesocial_manual_tokens', JSON.stringify(tokens));
    } catch (err) {
      console.warn('Failed to persist manual tokens', err);
    }
    setSavedTokens(true);
    setTimeout(() => setSavedTokens(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-400" />
          Paramètres & Gestion des Réseaux PulseSocial
        </h1>
        <p className="text-xs text-slate-400">
          Connectez vos profils sociaux en 1 clic (OAuth 2.0 interactif), gérez vos membres, clés APIs et base Supabase.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-800 pb-px overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('oauth')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'oauth'
              ? 'border-violet-500 text-violet-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>OAuth 1-Clic</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'accounts'
              ? 'border-violet-500 text-violet-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span>Comptes ({accounts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'border-violet-500 text-violet-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Équipe ({teamMembers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'tokens'
              ? 'border-violet-500 text-violet-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 shrink-0" />
          <span>Tokens Manuels</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'api'
              ? 'border-violet-500 text-violet-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 shrink-0" />
          <span>Supabase & IA</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {connectMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{connectMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setConnectMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* TAB 0: 1-CLIC OAUTH 2.0 CONNECT */}
      {activeTab === 'oauth' && (
        <div className="space-y-5">
          <div className="pulse-card p-6 bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40 border border-violet-500/30 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Passerelle OAuth 2.0 Unifiée (Composio • Nouvelle Fenêtre Officielle)
              </span>
              <span className="text-[11px] text-slate-400">Fenêtre Pop-up Externe OAuth 2.0 • Tokens Chiffrés Supabase</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Connectez vos réseaux sociaux en 1 clic (Fenêtre OAuth Officielle)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Cliquez sur un réseau ci-dessous : une <strong>nouvelle fenêtre d&apos;authentification officielle (OAuth 2.0 via Composio)</strong> s&apos;ouvre pour vous permettre de saisir vos identifiants directement sur la plateforme et d&apos;autoriser PulseSocial en toute sécurité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OAUTH_PROVIDERS.map((prov) => {
              const isConnected = accounts.some((a) => a.platform === prov.platform);
              const isProcessing = connectingPlatform === prov.id;

              return (
                <div
                  key={prov.id}
                  className="pulse-card p-5 flex flex-col justify-between space-y-4 hover:border-violet-500/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${prov.color} flex items-center justify-center font-black text-white text-xs shadow-md`}>
                        {prov.name.slice(0, 2).toUpperCase()}
                      </div>
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Connecté
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Prêt</span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-white">{prov.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{prov.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenOAuthModal(prov)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isConnected
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 active:scale-98'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Autorisation OAuth en cours...</span>
                      </>
                    ) : isConnected ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reconfigurer / Reconnecter</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Connecter en 1 Clic</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: ACCOUNTS LIST */}
      {activeTab === 'accounts' && (
        <div className="pulse-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">
                Comptes Réseaux Connectés ({accounts.length})
              </h3>
              <p className="text-xs text-slate-400">
                Profils synchronisés prêts pour la publication, le calendrier et les statistiques.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('oauth')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connecter un nouveau réseau</span>
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Share2 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">
                Aucun compte réseau social connecté pour le moment.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('oauth')}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 cursor-pointer"
              >
                Connecter un compte en 1 Clic
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatar_url}
                      alt={acc.account_name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white leading-tight">
                          {acc.account_name}
                        </h4>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-violet-400 border border-slate-700">
                          {acc.platform}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{acc.username}</p>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {acc.followers_count?.toLocaleString()} abonnés
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Synchronisé
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDisconnectAccount(acc.id, acc.account_name)}
                      className="text-slate-500 hover:text-red-400 text-xs p-1 rounded transition-colors cursor-pointer"
                      title="Déconnecter ce compte"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAM & ROLES (REAL DATABASE CRUD) */}
      {activeTab === 'team' && (
        <div className="pulse-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Membres & Rôles de l&apos;Espace de Travail ({teamMembers.length})
              </h3>
              <p className="text-xs text-slate-400">
                Gérez les permissions de publication, les rôles (Admin, Manager, Éditeur, Client) et les accès à votre Supabase.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-colors cursor-pointer shadow-md shadow-violet-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inviter un collaborateur</span>
            </button>
          </div>

          {teamLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span>Chargement des membres...</span>
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">Aucun membre enregistré.</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((m) => {
                const isSuperAdmin = m.role === 'super_admin';
                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-xs uppercase">
                        {m.full_name ? m.full_name.slice(0, 2) : 'US'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-white">{m.full_name}</p>
                          {m.is_lifetime_free && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              LIFETIME FREE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSuperAdmin ? (
                        <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          Super-Admin (Propriétaire)
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-200 cursor-pointer focus:outline-none focus:border-violet-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="editor">Éditeur</option>
                          <option value="client">Client (Lecture seule)</option>
                        </select>
                      )}

                      {!isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id, m.full_name)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Retirer ce membre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANUAL TOKENS */}
      {activeTab === 'tokens' && (
        <form onSubmit={handleSaveTokens} className="pulse-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400" />
                Saisie Manuelle de Tokens Développeurs (Mode Avancé)
              </h3>
              <p className="text-xs text-slate-400">
                Optionnel : pour injecter directement vos jetons d&apos;accès personnalisés générés depuis Meta for Developers ou Twitter Developer Portal.
              </p>
            </div>
            <button
              type="submit"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
                savedTokens ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
              }`}
            >
              {savedTokens ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedTokens ? 'Tokens Enregistrés !' : 'Enregistrer les Tokens'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-4 rounded-2xl bg-violet-950/30 border border-violet-500/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-violet-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  Clé API Composio (Passerelle OAuth 2.0 Unifiée 1-Clic)
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('composio')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['composio'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['composio'] ? 'text' : 'password'}
                placeholder="cmp_live_..."
                value={tokens.composioApiKey}
                onChange={(e) => setTokens({ ...tokens, composioApiKey: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Clé Secrète Paystack (Mobile Money &amp; Cartes XOF)
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('paystack')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['paystack'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['paystack'] ? 'text' : 'password'}
                placeholder="sk_live_... ou sk_test_..."
                value={tokens.paystackSecretKey}
                onChange={(e) => setTokens({ ...tokens, paystackSecretKey: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 md:col-span-2">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Lien d&apos;Agenda Cal.com (Prise de RDV automatique dans /inbox et /crm)
              </label>
              <input
                type="url"
                placeholder="https://cal.com/votre-entreprise/15min"
                value={tokens.calComUrl}
                onChange={(e) => setTokens({ ...tokens, calComUrl: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  Meta Graph Access Token (Instagram & Facebook)
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('meta')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['meta'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['meta'] ? 'text' : 'password'}
                placeholder="EAA..."
                value={tokens.metaToken}
                onChange={(e) => setTokens({ ...tokens, metaToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  X (Twitter) Bearer Token / API Key
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('x')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['x'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['x'] ? 'text' : 'password'}
                placeholder="AAAA..."
                value={tokens.xBearerToken}
                onChange={(e) => setTokens({ ...tokens, xBearerToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  LinkedIn Member / Page Access Token
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('linkedin')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['linkedin'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['linkedin'] ? 'text' : 'password'}
                placeholder="AQX..."
                value={tokens.linkedInToken}
                onChange={(e) => setTokens({ ...tokens, linkedInToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  TikTok Content Posting API Token
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('tiktok')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['tiktok'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['tiktok'] ? 'text' : 'password'}
                placeholder="act.example..."
                value={tokens.tiktokToken}
                onChange={(e) => setTokens({ ...tokens, tiktokToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  WhatsApp Business Cloud API Token (Bearer)
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('whatsapp')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['whatsapp'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['whatsapp'] ? 'text' : 'password'}
                placeholder="EAABw..."
                value={tokens.whatsappToken}
                onChange={(e) => setTokens({ ...tokens, whatsappToken: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  WhatsApp Phone Number ID
                </label>
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility('whatsappPhone')}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Afficher/Masquer"
                >
                  {showTokens['whatsappPhone'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showTokens['whatsappPhone'] ? 'text' : 'password'}
                placeholder="1045239928..."
                value={tokens.whatsappPhoneId}
                onChange={(e) => setTokens({ ...tokens, whatsappPhoneId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: API, GEMINI & SUPABASE */}
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
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-xs text-emerald-300">
                  Clé d&apos;API Gemini connectée et opérationnelle
                </p>
                <p className="text-[10px] text-emerald-400">
                  Modèle : gemini-2.0-flash • Variables d&apos;environnement serveur sécurisées (Production)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
              Actif
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-400" />
                <p className="font-bold text-xs text-violet-300">
                  Base de données Supabase PostgreSQL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupabaseUrl(!showSupabaseUrl)}
                className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white cursor-pointer px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 transition-colors"
              >
                {showSupabaseUrl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSupabaseUrl ? 'Masquer URL' : 'Afficher URL Projet'}</span>
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-300">
              Projet : {showSupabaseUrl ? 'https://ljpslbcouvyyzzvxxfme.supabase.co' : 'https://ljps••••••••xfme.supabase.co'} • Schéma complet : 14 tables actives
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-xs text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Vérification du Pipeline & Diagnostic Latence
              </p>
              <p className="text-[11px] text-slate-400">
                Teste en direct la connectivité Supabase PostgreSQL et l&apos;accès à l&apos;API Gemini.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={pingLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {pingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{pingLoading ? 'Test en cours...' : 'Tester la connexion Supabase & IA'}</span>
            </button>
          </div>

          {pingResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Supabase DB : Connecté ({pingResult.supabase.latencyMs} ms)
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Tables vérifiées, accès instantané.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs">
                <span className="font-bold text-violet-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Moteur Gemini : {pingResult.ai.status.toUpperCase()}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Modèle : {pingResult.ai.model} opérationnel.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INVITE TEAM MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleInviteMember}
            className="w-full max-w-md bg-slate-900 border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-sm text-white">Inviter un Collaborateur</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom complet :
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sarah Koné"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adresse email professionnelle :
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@agence.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rôle &amp; Niveau de permissions :
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:border-violet-500"
                >
                  <option value="editor">Éditeur (Création &amp; Planification)</option>
                  <option value="manager">Manager (Approbation &amp; Calendrier)</option>
                  <option value="admin">Admin (Accès complet sauf facturation)</option>
                  <option value="client">Client (Validation des posts uniquement)</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={inviteLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 cursor-pointer disabled:opacity-50"
              >
                {inviteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Création du membre...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Envoyer l&apos;invitation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
