'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  X,
  Sparkles,
  Loader2,
  FileText,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Brain,
  Radio,
  HelpCircle,
} from 'lucide-react';
import { ResourceShortcutGuide } from './ResourceShortcutGuide';
import type { CopilotAction, CopilotAttachment, CopilotMemory } from '@/lib/gemini';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: CopilotAttachment[];
  action?: CopilotAction | null;
  paystackUrl?: string;
  timestamp: string;
}

interface PulseAICopilotPanelProps {
  compact?: boolean;
  onClose?: () => void;
}

const MAX_FILES = 10;

export function PulseAICopilotPanel({ compact = false, onClose }: PulseAICopilotPanelProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Bonjour ! Je suis PulseAI, votre copilote exécutif et Directeur Stratégie Social Media. Je peux concevoir vos publications, enrichir votre CRM, gérer vos avis et générer vos liens de paiement Paystack en direct. Échangez avec moi par écrit ou directement à la voix !',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<CopilotAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Persistent Memory
  const [memory, setMemory] = useState<CopilotMemory>({
    userPreferences: [],
    brandSummary: 'PulseSocial Agency',
    keyEntities: {},
  });

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcut: Alt + M to toggle Microphone
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  // Restore history and memory on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pulsesocial_copilot_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-30));
        }
      }

      const savedMem = localStorage.getItem('pulsesocial_copilot_memory');
      if (savedMem) {
        setMemory(JSON.parse(savedMem));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, interimSpeech]);

  const persistMessages = (next: ChatMessage[]) => {
    setMessages(next);
    try {
      const lite = next.slice(-30).map((m) => ({
        ...m,
        attachments: m.attachments?.map((a) => ({ name: a.name, type: a.type, size: a.size })),
      }));
      localStorage.setItem('pulsesocial_copilot_history', JSON.stringify(lite));
    } catch {
      // ignore
    }
  };

  const persistMemory = (newMem: CopilotMemory) => {
    setMemory((prev) => {
      const merged = { ...prev, ...newMem };
      try {
        localStorage.setItem('pulsesocial_copilot_memory', JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  };

  // Text-to-Speech (French Voice Output)
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#`_]/g, '').replace(/https?:\/\/\S+/g, 'lien sécurisé');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.toLowerCase().startsWith('fr'));
      if (frVoice) utterance.voice = frVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  // Robust Speech-to-Text with Upfront Microphone Permission & Real-Time Interim Transcript
  const toggleListening = async () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setUploadError('Reconnaissance vocale non supportée sur ce navigateur (veuillez utiliser Google Chrome, Microsoft Edge ou Safari).');
      return;
    }

    // If currently recording, stop
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimSpeech('');
      return;
    }

    setUploadError(null);

    // 1. Explicitly prompt / verify microphone permissions via getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release tracks so SpeechRecognition has sole access to audio hardware
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (permErr: any) {
      const isDenied = permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError';
      if (isDenied) {
        setUploadError("Microphone bloqué : veuillez autoriser le micro dans les paramètres ou la barre d'adresse de votre navigateur.");
      } else {
        setUploadError("Impossible d'accéder au microphone. Vérifiez vos périphériques audio.");
      }
      setIsListening(false);
      return;
    }

    // 2. Start SpeechRecognition with real-time interim streaming
    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setUploadError(null);
        setInterimSpeech('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += transcript;
          } else {
            interim += transcript;
          }
        }

        if (finalChunk.trim()) {
          setInput((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
        }
        setInterimSpeech(interim.trim());
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setUploadError("Accès micro refusé : autorisez le microphone dans votre navigateur.");
        } else if (event.error === 'network') {
          setUploadError("Erreur réseau pour la reconnaissance vocale.");
        } else if (event.error !== 'no-speech') {
          setUploadError(`Note vocale (${event.error}). Vous pouvez taper directement.`);
        }
        setIsListening(false);
        setInterimSpeech('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimSpeech('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setUploadError("Erreur lors de l'activation du microphone. Veuillez réessayer.");
      setIsListening(false);
    }
  };

  // File upload handler (Up to 10 files: images, videos, documents)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadError(null);

    if (attachments.length + files.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} fichiers autorisés par message.`);
      return;
    }

    const processed: CopilotAttachment[] = [];
    for (const file of files) {
      const item: CopilotAttachment = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
      };

      if (file.type.startsWith('image/') && file.size < 4 * 1024 * 1024) {
        item.dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.readAsDataURL(file);
        });
      } else if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.json')
      ) {
        item.textContent = (await file.text()).slice(0, 1500);
      }

      processed.push(item);
    }

    setAttachments((prev) => [...prev, ...processed].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Full CRUD Client Actions on Platform Features
  const executeClientAction = async (action: CopilotAction): Promise<string | undefined> => {
    // 1. Navigation
    if (action.type === 'navigate' && typeof action.payload.path === 'string') {
      router.push(action.payload.path);
      if (onClose) onClose();
      return undefined;
    }

    // 2. Posts CRUD Events
    if (action.type === 'create_post' || action.type === 'delete_post' || action.type === 'update_post') {
      window.dispatchEvent(new Event('posts-updated'));
      return undefined;
    }

    // 3. CRM Prospect Create CRUD
    if (action.type === 'create_crm_prospect') {
      try {
        const saved = localStorage.getItem('pulsesocial_crm_prospects');
        const list = saved ? JSON.parse(saved) : [];
        const newProspect = {
          id: `crm-ai-${Date.now()}`,
          name: String(action.payload.name || 'Prospect PulseAI'),
          platform: String(action.payload.platform || 'whatsapp'),
          handle: String(action.payload.handle || '+225 07 00 00 00'),
          deal_value: Number(action.payload.deal_value || 50000),
          currency: 'FCFA',
          status: String(action.payload.status || 'lead'),
          lead_score: 90,
          notes: String(action.payload.notes || 'Inscrit via PulseAI Copilot'),
          last_interaction: new Date().toISOString(),
        };
        localStorage.setItem('pulsesocial_crm_prospects', JSON.stringify([newProspect, ...list]));
        window.dispatchEvent(new Event('crm-updated'));
      } catch {
        // ignore
      }
      return undefined;
    }

    // 4. CRM Prospect Stage Update CRUD
    if (action.type === 'update_crm_prospect_stage') {
      try {
        const saved = localStorage.getItem('pulsesocial_crm_prospects');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) {
            list[0].status = String(action.payload.stage || 'won');
            list[0].last_interaction = new Date().toISOString();
            localStorage.setItem('pulsesocial_crm_prospects', JSON.stringify(list));
            window.dispatchEvent(new Event('crm-updated'));
          }
        }
      } catch {
        // ignore
      }
      return undefined;
    }

    // 5. CRM Prospect Deletion CRUD
    if (action.type === 'delete_crm_prospect') {
      try {
        const saved = localStorage.getItem('pulsesocial_crm_prospects');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 1) {
            localStorage.setItem('pulsesocial_crm_prospects', JSON.stringify(list.slice(1)));
          } else {
            localStorage.removeItem('pulsesocial_crm_prospects');
          }
          window.dispatchEvent(new Event('crm-updated'));
        }
      } catch {
        // ignore
      }
      return undefined;
    }

    // 6. Pulse Pages (Bio-Link) CRUD
    if (action.type === 'create_pulse_page') {
      window.dispatchEvent(new Event('pulse-pages-updated'));
      return undefined;
    }

    // 7. Team Invitation CRUD
    if (action.type === 'invite_team_member') {
      window.dispatchEvent(new Event('team-updated'));
      return undefined;
    }

    // 8. Inbox Reply CRUD
    if (action.type === 'send_inbox_reply') {
      window.dispatchEvent(new Event('inbox-updated'));
      return undefined;
    }

    // 9. Paystack Payment Link
    if (action.type === 'generate_paystack_link') {
      try {
        const res = await fetch('/api/billing/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(action.payload.amount || 15000),
            currency: String(action.payload.currency || 'XOF'),
            provider: String(action.payload.provider || 'wave'),
            customerName: String(action.payload.customerName || 'Client PulseSocial'),
            plan: 'pro',
          }),
        });
        const data = await res.json();
        if (data?.authorization_url) return data.authorization_url;
      } catch {
        // ignore
      }
    }

    return undefined;
  };

  const handleSend = async (customPrompt?: string) => {
    // If voice recognition is active, stop it before sending
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimSpeech('');
    }

    const text = (customPrompt ?? input).trim();
    if ((!text && attachments.length === 0) || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text || `Analyse de ${attachments.length} fichier(s)`,
      attachments: [...attachments],
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    persistMessages(nextMessages);
    setInput('');
    const filesToSend = [...attachments];
    setAttachments([]);
    setLoading(true);
    setUploadError(null);

    try {
      let crmCount = 0;
      let workspaceName = 'PulseSocial';
      try {
        const crm = localStorage.getItem('pulsesocial_crm_prospects');
        if (crm) crmCount = JSON.parse(crm).length;
        const ws = localStorage.getItem('pulsesocial_active_workspace');
        if (ws) workspaceName = JSON.parse(ws).name || workspaceName;
      } catch {
        // ignore
      }

      // Send multi-turn history & persistent memory
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
          memory,
          currentPath: pathname,
          attachments: filesToSend,
          clientStats: { crmCount, workspaceName },
        }),
      });

      const data = await res.json();
      const replyText = data.reply || data.error || 'Action traitée.';
      let paystackUrl: string | undefined;

      if (data.action) {
        paystackUrl = await executeClientAction(data.action);
      }

      if (data.updatedMemory) {
        persistMemory(data.updatedMemory);
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        action: data.action || null,
        paystackUrl,
        timestamp: new Date().toISOString(),
      };

      persistMessages([...nextMessages, assistantMsg]);

      if (voiceOutputEnabled) {
        speakText(replyText);
      }
    } catch {
      persistMessages([
        ...nextMessages,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Erreur de connexion avec PulseAI. Réessayez dans un instant.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Crée un post LinkedIn sur notre offre',
    'Ajoute un prospect CRM de 100000 FCFA',
    'Passe le prospect en étape Gagné',
    'Génère un lien Paystack de 15000 FCFA',
    'Crée une page bio pour nos réseaux',
  ];

  return (
    <div className={`flex flex-col bg-[#0A0E17] text-slate-100 ${compact ? 'h-full' : 'h-[calc(100vh-10rem)] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden'}`}>
      {/* Top Bar with Memory & Voice Badges */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
              Assistant Exécutif Pulse
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                Vocal &amp; Actions CRUD
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hidden sm:inline-flex items-center gap-1">
                <Brain className="w-2.5 h-2.5" />
                Mémoire Continue
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Contexte : <span className="font-mono text-violet-400">{pathname}</span> • Actions en direct sur Posts, CRM, Pages, Paystack
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !voiceOutputEnabled;
              setVoiceOutputEnabled(next);
              if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              voiceOutputEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={voiceOutputEnabled ? 'Désactiver la voix IA' : 'Activer la voix IA'}
          >
            {voiceOutputEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              persistMessages([messages[0]]);
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
            title="Effacer la conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>

              {/* Attachments preview */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.attachments.map((att, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/25 text-[10px]"
                    >
                      {att.type.startsWith('image/') ? (
                        <ImageIcon className="w-3 h-3" />
                      ) : att.type.startsWith('video/') ? (
                        <Film className="w-3 h-3" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span className="truncate max-w-[120px]">{att.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Executed Action Badge */}
              {msg.action && (
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {msg.action.label}
                  </span>

                  {msg.paystackUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(msg.paystackUrl, 'PaystackCopilot', 'width=540,height=720')
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ouvrir Paystack
                    </button>
                  )}
                </div>
              )}

              {/* Replay Voice Button for assistant */}
              {msg.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => speakText(msg.content)}
                  className="text-[10px] text-slate-400 hover:text-violet-400 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" /> Écouter
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Interim Speech Transcription Live Indicator */}
        {interimSpeech && (
          <div className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-xs bg-violet-600/40 text-violet-200 border border-violet-500/30 animate-pulse italic">
              « {interimSpeech} »
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-violet-400 px-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>PulseAI réfléchit et exécute vos actions en direct...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(qp)}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Live Voice Recording Status Bar */}
      {isListening && (
        <div className="px-3.5 py-2 bg-rose-500/10 border-t border-rose-500/30 flex items-center justify-between text-xs text-rose-300 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-semibold text-[11px]">
              Micro ouvert : parlez naturellement (en français)...
            </span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
          >
            Terminer la dictée
          </button>
        </div>
      )}

      {/* Pending File Attachments Bar (Max 10) */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold text-violet-400 mr-1">
            {attachments.length}/{MAX_FILES} fichiers :
          </span>
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-200"
            >
              {file.dataUrl ? (
                <img src={file.dataUrl} alt={file.name} className="w-4 h-4 rounded object-cover" />
              ) : (
                <FileText className="w-3 h-3 text-violet-400" />
              )}
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <div className="px-3 py-2 bg-rose-500/10 text-rose-400 text-[10px] border-t border-rose-500/20 flex items-center justify-between gap-2">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setShowShortcutGuide(true)}
            className="shrink-0 underline font-bold hover:text-rose-300 cursor-pointer"
          >
            Aide &amp; Raccourci
          </button>
        </div>
      )}

      {/* Quick Resource Shortcut Indicator */}
      <div className="px-3 py-1 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Mic className="w-3 h-3 text-[#6366F1]" />
          <span className="text-[10px]">Raccourci micro :</span>
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-800 text-amber-300 rounded border border-slate-700 shadow-xs">
            Alt + M
          </kbd>
        </div>
        <button
          type="button"
          onClick={() => setShowShortcutGuide(true)}
          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
        >
          <span>Aide micro</span>
          <HelpCircle className="w-3 h-3" />
        </button>
      </div>

      {/* Composer Input + Voice Mic + File Upload */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.md,.json"
          onChange={handleFilesSelected}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= MAX_FILES}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
          title={`Joindre images, vidéos ou documents (${attachments.length}/${MAX_FILES})`}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
            isListening
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/40 ring-2 ring-rose-400/50'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title={isListening ? 'Arrêter la dictée vocale' : 'Parler à PulseAI au micro (Vocal fr-FR)'}
        >
          {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
          {isListening && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping" />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Écoute active en français (parlez)...' : 'Écrivez ou dictez au micro à PulseAI...'}
          className={`flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
            isListening ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-slate-800 focus:border-violet-500'
          }`}
        />

        <button
          type="submit"
          disabled={loading || (!input.trim() && attachments.length === 0)}
          className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white shadow-lg shadow-violet-600/30 cursor-pointer"
          title="Envoyer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Resource Shortcut & Permission Guide */}
      <ResourceShortcutGuide
        isOpen={showShortcutGuide}
        onClose={() => setShowShortcutGuide(false)}
        resourceType="microphone"
      />
    </div>
  );
}
