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
} from 'lucide-react';
import type { CopilotAction, CopilotAttachment } from '@/lib/gemini';

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
        'Bonjour ! Je suis PulseAI, votre assistant personnel exécutif et Directeur Social Media. Je suis là pour échanger avec vous en temps réel, concevoir vos publications, peaufiner vos accroches, analyser vos visuels et accélérer vos conversions. Que souhaitez-vous qu’on développe ensemble aujourd’hui ?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<CopilotAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pulsesocial_copilot_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-20));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const persistMessages = (next: ChatMessage[]) => {
    setMessages(next);
    try {
      // Save without heavy base64 dataUrls to preserve localStorage quota
      const lite = next.slice(-20).map((m) => ({
        ...m,
        attachments: m.attachments?.map((a) => ({ name: a.name, type: a.type, size: a.size })),
      }));
      localStorage.setItem('pulsesocial_copilot_history', JSON.stringify(lite));
    } catch {
      // ignore
    }
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

  // Speech-to-Text (Microphone Input fr-FR)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setUploadError('Reconnaissance vocale non supportée sur ce navigateur (utilisez Chrome ou Edge).');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setUploadError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
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

  // Execute agentic actions returned by PulseAI
  const executeClientAction = async (action: CopilotAction): Promise<string | undefined> => {
    if (action.type === 'navigate' && typeof action.payload.path === 'string') {
      router.push(action.payload.path);
      if (onClose) onClose();
      return undefined;
    }

    if (action.type === 'create_post') {
      window.dispatchEvent(new Event('posts-updated'));
      return undefined;
    }

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
          status: 'lead',
          lead_score: 88,
          notes: String(action.payload.notes || 'Créé via PulseAI Copilot'),
          last_interaction: new Date().toISOString(),
        };
        localStorage.setItem('pulsesocial_crm_prospects', JSON.stringify([newProspect, ...list]));
        window.dispatchEvent(new Event('crm-updated'));
      } catch {
        // ignore
      }
      return undefined;
    }

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

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
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
    'Génère un lien Paystack de 15000 FCFA',
    'Aide-moi sur cette page',
  ];

  return (
    <div className={`flex flex-col bg-[#0A0E17] text-slate-100 ${compact ? 'h-full' : 'h-[calc(100vh-10rem)] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden'}`}>
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
              PulseAI Copilot
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Gemini Vocal
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Contexte actif : <span className="font-mono text-violet-400">{pathname}</span> • Concis &amp; Exécutif
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

        {loading && (
          <div className="flex items-center gap-2 text-xs text-violet-400 px-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>PulseAI réfléchit et exécute...</span>
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
        <div className="px-3 py-1.5 bg-rose-500/10 text-rose-400 text-[10px] border-t border-rose-500/20">
          {uploadError}
        </div>
      )}

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
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title={isListening ? 'Arrêter la dictée vocale' : 'Parler à PulseAI (Vocal fr-FR)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Écoute en cours (parlez)...' : 'Écrivez ou parlez à PulseAI...'}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
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
    </div>
  );
}
