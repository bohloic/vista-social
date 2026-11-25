'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CRMProspect, CRMStage, SocialPlatform } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import {
  Briefcase,
  Plus,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Calendar,
  Flame,
  Copy,
  Check,
  Search,
} from 'lucide-react';

const COLUMNS: { id: CRMStage; label: string; color: string; badgeBg: string; borderColor: string }[] = [
  {
    id: 'lead',
    label: 'Nouveau Contact',
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    borderColor: 'border-sky-500/30',
  },
  {
    id: 'contacted',
    label: 'Discussion en cours',
    color: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    borderColor: 'border-violet-500/30',
  },
  {
    id: 'proposal',
    label: 'Devis / Lien envoyé',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'won',
    label: 'Payé ✅ (Clôturé)',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderColor: 'border-emerald-500/30',
  },
];

export default function CRMPage() {
  const [prospects, setProspects] = useState<CRMProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Prospect Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('whatsapp');
  const [newHandle, setNewHandle] = useState('');
  const [newDealValue, setNewDealValue] = useState<number>(100000);
  const [newStatus, setNewStatus] = useState<CRMStage>('lead');
  const [newNotes, setNewNotes] = useState('');

  // Payment Link Generator Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedProspectForPayment, setSelectedProspectForPayment] = useState<CRMProspect | null>(null);
  const [paymentOperator, setPaymentOperator] = useState<string>('wave');
  const [paymentAmount, setPaymentAmount] = useState<number>(100000);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const getStorageKey = (wsId: string) => `pulsesocial_crm_prospects_${wsId || 'default'}`;

  const loadProspects = async (wsId = workspaceId) => {
    try {
      const res = await fetch('/api/crm/prospects', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.prospects) ? data.prospects : [];
        setProspects(list);
        try {
          localStorage.setItem(getStorageKey(wsId), JSON.stringify(list));
        } catch {
          // ignore
        }
        return;
      }
      const errData = await res.json().catch(() => ({}));
      showToast('error', errData.error || `Erreur lors du chargement du CRM (${res.status})`);
    } catch {
      showToast('error', 'Erreur réseau lors du chargement du CRM Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let activeWs = 'default';
    try {
      const savedWs = localStorage.getItem('pulsesocial_active_workspace');
      if (savedWs) {
        activeWs = JSON.parse(savedWs).id || 'default';
      }
    } catch {
      // ignore
    }
    setWorkspaceId(activeWs);
    loadProspects(activeWs);

    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user?.workspaceId) {
          setWorkspaceId(data.user.workspaceId);
          loadProspects(data.user.workspaceId);
        }
      })
      .catch(() => {});

    const handleUpdate = () => loadProspects(activeWs);
    window.addEventListener('crm-updated', handleUpdate);

    const handlePaystackMsg = async (event: MessageEvent) => {
      if (event.data?.type === 'PAYSTACK_PAYMENT_SUCCESS' && event.data?.prospectId) {
        try {
          const res = await fetch('/api/crm/prospects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: event.data.prospectId,
              status: 'won',
              deal_value: Number(event.data.amount) || undefined,
            }),
          });
          if (res.ok) {
            await loadProspects(activeWs);
            setPaymentModalOpen(false);
            showToast(
              'success',
              `✓ Paiement Paystack reçu (${Number(event.data.amount).toLocaleString('fr-FR')} FCFA) ! Prospect passé en Payé ✅`
            );
          } else {
            const err = await res.json().catch(() => ({}));
            showToast('error', err.error || 'Échec de mise à jour du prospect après paiement.');
          }
        } catch {
          showToast('error', 'Erreur réseau lors de la confirmation du prospect.');
        }
      }
    };

    window.addEventListener('message', handlePaystackMsg);
    return () => {
      window.removeEventListener('crm-updated', handleUpdate);
      window.removeEventListener('message', handlePaystackMsg);
    };
  }, []);

  // Move stage
  const handleMoveStage = async (id: string, direction: 'prev' | 'next') => {
    const target = prospects.find((p) => p.id === id);
    if (!target) return;
    const stageOrder: CRMStage[] = ['lead', 'contacted', 'proposal', 'won'];
    const currentIndex = stageOrder.indexOf(target.status);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= stageOrder.length) newIndex = stageOrder.length - 1;
    const nextStatus = stageOrder[newIndex];

    try {
      const res = await fetch('/api/crm/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        await loadProspects();
        window.dispatchEvent(new Event('crm-updated'));
        showToast('success', '✓ Étape du prospect mise à jour dans Supabase !');
      } else {
        showToast('error', data.error || `Impossible de déplacer le prospect (${res.status})`);
      }
    } catch {
      showToast('error', 'Erreur réseau lors de la mise à jour de l’étape.');
    }
  };

  // Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} du pipeline commercial ?`)) return;
    try {
      const res = await fetch(`/api/crm/prospects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        await loadProspects();
        window.dispatchEvent(new Event('crm-updated'));
        showToast('success', `✓ ${name} retiré du pipeline.`);
      } else {
        showToast('error', data.error || `Impossible de supprimer ${name}`);
      }
    } catch {
      showToast('error', 'Erreur réseau lors de la suppression.');
    }
  };

  // Create
  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/crm/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          platform: newPlatform,
          handle: newHandle.trim() || '@prospect',
          deal_value: Number(newDealValue) || 0,
          currency: 'FCFA',
          status: newStatus,
          lead_score: 85,
          notes: newNotes.trim() || 'Ajouté dans le CRM PulseSocial',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if ((res.status === 200 || res.status === 201) && data.success) {
        await loadProspects();
        window.dispatchEvent(new Event('crm-updated'));
        setNewModalOpen(false);
        setNewName('');
        setNewHandle('');
        setNewNotes('');
        setNewDealValue(100000);
        showToast('success', `✓ Nouveau prospect ${data.prospect?.name || newName.trim()} enregistré !`);
      } else {
        showToast('error', data.error || `Échec d'enregistrement (${res.status})`);
      }
    } catch {
      showToast('error', 'Erreur réseau lors de la création du prospect.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Payment Link Modal
  const openPaymentModal = (p: CRMProspect) => {
    setSelectedProspectForPayment(p);
    setPaymentAmount(p.deal_value || 50000);
    setPaymentModalOpen(true);
    setCopiedLink(false);
  };

  // Copy payment link
  const copyPaymentLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vista-social-app.vercel.app';
    const ref = `PSTK-${selectedProspectForPayment?.id || Date.now()}`;
    const link = `${origin}/oauth-popup?provider=paystack&reference=${encodeURIComponent(ref)}&amount=${paymentAmount}&currency=XOF&plan=commande_client&channel=${encodeURIComponent(paymentOperator)}&customer=${encodeURIComponent(selectedProspectForPayment?.name || 'Client')}&prospectId=${encodeURIComponent(selectedProspectForPayment?.id || '')}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    showToast('success', '✓ Lien de paiement Paystack sécurisé copié dans le presse-papier !');
  };

  const openLivePaystackWindow = async () => {
    if (!selectedProspectForPayment) return;
    try {
      const res = await fetch('/api/billing/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'XOF',
          plan: 'starter',
          provider: paymentOperator,
          customerName: selectedProspectForPayment.name,
          prospectId: selectedProspectForPayment.id,
        }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        const width = 540;
        const height = 720;
        const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
        const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
        window.open(
          data.authorization_url,
          'PaystackCRMWindow',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        const errData = await res.json().catch(() => ({}));
        showToast('error', errData.error || 'Erreur lors de l’initialisation Paystack');
      }
    } catch {
      showToast('error', 'Erreur lors de l’ouverture de la fenêtre Paystack');
    }
  };

  // Copy Cal.com link (configured in /settings)
  const copyCalLink = (p: CRMProspect) => {
    let calUrl = 'https://cal.com/pulsesocial/rdv-15min';
    try {
      const saved = localStorage.getItem('pulsesocial_manual_tokens');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.calComUrl && parsed.calComUrl.trim()) calUrl = parsed.calComUrl.trim();
      }
    } catch {
      // ignore
    }
    navigator.clipboard.writeText(calUrl);
    showToast('success', `✓ Lien Cal.com copié pour ${p.name} !`);
  };

  // KPI Calculations
  const activeCount = prospects.filter((p) => p.status !== 'won').length;
  const pipelineValue = prospects
    .filter((p) => p.status !== 'won')
    .reduce((sum, p) => sum + (p.deal_value || 0), 0);
  const proposalsCount = prospects.filter((p) => p.status === 'proposal').length;
  const wonRevenue = prospects
    .filter((p) => p.status === 'won')
    .reduce((sum, p) => sum + (p.deal_value || 0), 0);

  // Filtered prospects
  const filteredProspects = prospects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.handle.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-fredoka text-[#1E1B4B] flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#7C3AED]" />
            Pipeline de Vente &amp; Mini-CRM (Social Selling)
          </h1>
          <p className="text-xs text-slate-600 font-medium font-jakarta">
            Suivez vos opportunités commerciales issues des réseaux, générez des liens de paiement et suivez vos clôtures en Francs CFA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-violet-100 text-[#1E1B4B] hover:bg-violet-50 text-xs font-bold font-jakarta transition-colors cursor-pointer shadow-sm"
          >
            <span>← Ouvrir le Radar à Prospects</span>
          </Link>
          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold font-jakarta shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nouveau Prospect</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-violet-100/80 rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 font-jakarta flex items-center justify-between">
            Prospects Actifs
            <Users className="w-4 h-4 text-sky-500" />
          </span>
          <p className="text-2xl font-black font-fredoka text-[#1E1B4B]">{activeCount}</p>
          <p className="text-[10px] text-slate-500 font-jakarta">En cours de qualification &amp; négociation</p>
        </div>

        <div className="bg-white border border-violet-100/80 rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 font-jakarta flex items-center justify-between">
            Valeur du Pipeline
            <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
          </span>
          <p className="text-2xl font-black font-fredoka text-[#7C3AED]">{pipelineValue.toLocaleString()} FCFA</p>
          <p className="text-[10px] text-slate-500 font-jakarta">Opportunités potentielles pondérées</p>
        </div>

        <div className="bg-white border border-violet-100/80 rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 font-jakarta flex items-center justify-between">
            Devis &amp; Liens Envoyés
            <CreditCard className="w-4 h-4 text-amber-500" />
          </span>
          <p className="text-2xl font-black font-fredoka text-amber-600">{proposalsCount}</p>
          <p className="text-[10px] text-slate-500 font-jakarta">En attente de règlement client</p>
        </div>

        <div className="bg-white border border-violet-100/80 rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 font-jakarta flex items-center justify-between">
            CA Clôturé (Payé ✅)
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </span>
          <p className="text-2xl font-black font-fredoka text-emerald-600">{wonRevenue.toLocaleString()} FCFA</p>
          <p className="text-[10px] text-emerald-600/90 font-jakarta">Encaissé par Wave / Mobile Money / Virement</p>
        </div>
      </div>

      {/* Search & Quick Filter */}
      <div className="p-3 bg-white border border-violet-100/80 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer un prospect ou une note dans le pipeline..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-violet-50/50 border border-violet-100 text-[#1E1B4B] placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] font-jakarta"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-jakarta font-medium">
          <span>{filteredProspects.length} opportunités affichées</span>
        </div>
      </div>

      {/* 4-COLUMN KANBAN BOARD with bottom clearance for Assistant Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-28">
        {COLUMNS.map((col) => {
          const colProspects = filteredProspects.filter((p) => p.status === col.id);
          const colTotal = colProspects.reduce((sum, p) => sum + (p.deal_value || 0), 0);

          return (
            <div
              key={col.id}
              className="bg-white border border-violet-100/80 rounded-2xl p-3 space-y-3 min-h-[500px] flex flex-col shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-violet-100/70">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold font-fredoka text-xs ${col.color}`}>{col.label}</h3>
                  <span className={`text-[10px] font-black font-jakarta px-1.5 py-0.2 rounded-full border ${col.badgeBg}`}>
                    {colProspects.length}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500 font-jakarta">
                  {colTotal.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Cards Stream */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colProspects.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-slate-500 italic font-jakarta">
                    Aucun prospect à cette étape.
                  </div>
                ) : (
                  colProspects.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-violet-50/40 border border-violet-100/90 hover:border-[#7C3AED]/40 hover:bg-violet-50/70 transition-all space-y-2.5 shadow-sm group"
                    >
                      {/* Top Row: Avatar + Name + Platform Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={p.avatar_url}
                            name={p.name}
                            size={28}
                            className="ring-1 ring-violet-200"
                          />
                          <div>
                            <h4 className="font-bold font-fredoka text-xs text-[#1E1B4B] leading-tight">{p.name}</h4>
                            <span className="text-[10px] text-slate-500 font-jakarta">{p.handle}</span>
                          </div>
                        </div>

                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-[#7C3AED] border border-violet-100">
                          {p.platform}
                        </span>
                      </div>

                      {/* Deal Value & Score */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-extrabold font-fredoka text-[#1E1B4B]">
                          {(p.deal_value || 0).toLocaleString()} FCFA
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Flame className="w-2.5 h-2.5 text-amber-500" /> {p.lead_score || 80}%
                        </span>
                      </div>

                      {/* Notes / Context */}
                      {p.notes && (
                        <p className="text-[10px] text-slate-600 font-jakarta bg-white/90 p-2 rounded-lg border border-violet-100 leading-relaxed break-words">
                          {p.notes}
                        </p>
                      )}

                      {/* Card Action Toolbar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400">
                        {/* Quick action tools */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openPaymentModal(p)}
                            title="Générer un lien de paiement direct"
                            className="p-1 rounded hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyCalLink(p)}
                            title="Copier le lien de rendez-vous Cal.com"
                            className="p-1 rounded hover:bg-violet-500/20 hover:text-violet-300 transition-colors cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Supprimer ce prospect"
                            className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stage movement buttons */}
                        <div className="flex items-center gap-1">
                          {col.id !== 'lead' && (
                            <button
                              type="button"
                              onClick={() => handleMoveStage(p.id, 'prev')}
                              title="Déplacer à l'étape précédente"
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {col.id !== 'won' && (
                            <button
                              type="button"
                              onClick={() => handleMoveStage(p.id, 'next')}
                              title="Avancer à l'étape suivante"
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW PROSPECT MODAL */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E1B4B]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-violet-100 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-violet-100">
              <h3 className="font-bold font-fredoka text-sm text-[#1E1B4B] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#7C3AED]" />
                Ajouter une Nouvelle Opportunité Commerciale
              </h3>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-[#1E1B4B] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProspect} className="space-y-3 text-xs font-jakarta">
              <div>
                <label className="text-[#1E1B4B] font-bold block mb-1">Nom du Prospect / Entreprise :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kouamé Koffi / Alpha SARL"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-violet-50/50 border border-violet-100 text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#1E1B4B] font-bold block mb-1">Canal Réseau :</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                    className="w-full p-2.5 rounded-xl bg-violet-50/50 border border-violet-200 text-[#1E1B4B]"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#1E1B4B] font-bold block mb-1">Identifiant / N° Tél :</label>
                  <input
                    type="text"
                    placeholder="+225 07..."
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-violet-50/50 border border-violet-200 text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#1E1B4B] font-bold block mb-1">Valeur Estimée (FCFA) :</label>
                  <input
                    type="number"
                    min={0}
                    value={newDealValue}
                    onChange={(e) => setNewDealValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-violet-50/50 border border-violet-200 text-[#1E1B4B] font-bold"
                  />
                </div>

                <div>
                  <label className="text-[#1E1B4B] font-bold block mb-1">Étape Initiale :</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as CRMStage)}
                    className="w-full p-2.5 rounded-xl bg-violet-50/50 border border-violet-200 text-[#1E1B4B]"
                  >
                    <option value="lead">Nouveau Contact</option>
                    <option value="contacted">Discussion en cours</option>
                    <option value="proposal">Devis / Lien envoyé</option>
                    <option value="won">Payé ✅</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#1E1B4B] font-bold block mb-1">Notes / Besoins du Client :</label>
                <textarea
                  rows={2}
                  placeholder="Détails de la demande, articles choisis, relance..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-violet-50/50 border border-violet-200 text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-violet-100">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {submitting ? 'Enregistrement...' : "Enregistrer l'Opportunité"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT LINK MODAL */}
      {paymentModalOpen && selectedProspectForPayment && (
        <div className="fixed inset-0 z-50 bg-[#1E1B4B]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-violet-100 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-violet-100">
              <h3 className="font-bold font-fredoka text-sm text-[#1E1B4B] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#7C3AED]" />
                Lien de Paiement pour {selectedProspectForPayment.name}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-[#1E1B4B] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Opérateur de Paiement :</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'wave', label: 'Wave' },
                    { id: 'orange', label: 'Orange Money' },
                    { id: 'cinetpay', label: 'CinetPay' },
                    { id: 'paystack', label: 'Paystack' },
                    { id: 'stripe', label: 'Stripe' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setPaymentOperator(op.id)}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] border transition-colors cursor-pointer ${
                        paymentOperator === op.id
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Montant à régler (FCFA) :</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all select-all">
                https://checkout.paystack.com/PSTK-{selectedProspectForPayment.id}?amount={paymentAmount}&amp;channel={paymentOperator}&amp;currency=XOF
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={openLivePaystackWindow}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Ouvrir Fenêtre Paystack</span>
              </button>
              <button
                type="button"
                onClick={copyPaymentLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Lien Copié !' : 'Copier le Lien'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
