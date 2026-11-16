import {
  SocialAccount,
  Post,
  InboxConversation,
  InboxMessage,
  ListeningMention,
  ReviewItem,
  PulsePage,
} from './types';

// Reset to clean, zero-mock state for 100% real data testing
export const INITIAL_ACCOUNTS: SocialAccount[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_CONVERSATIONS: InboxConversation[] = [];

export const INITIAL_MESSAGES: Record<string, InboxMessage[]> = {};

export const INITIAL_MENTIONS: ListeningMention[] = [];

export const INITIAL_REVIEWS: ReviewItem[] = [];

export const INITIAL_PULSE_PAGE: PulsePage = {
  id: 'pulse-default',
  workspace_id: 'ws-default',
  title: 'PulseSocial Agency',
  slug: 'pulsesocial',
  bio: '⚡ Agence Digitale & Stratégie Social Media Haute Performance.\nPropulsez votre marque avec un contenu d\'impact.',
  avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  theme_config: {
    preset: 'pulse_cyber',
    bg_type: 'gradient',
    bg_gradient: 'from-slate-950 via-purple-950 to-indigo-950',
    text_color: '#ffffff',
    button_bg: 'rgba(255, 255, 255, 0.08)',
    button_text: '#ffffff',
    button_border: 'rgba(255, 255, 255, 0.18)',
    button_radius: 'rounded-2xl',
    font_family: 'sans',
  },
  blocks: [
    {
      id: 'blk-1',
      type: 'link',
      title: '🌟 Découvrir nos services et offres 2026',
      url: 'https://pulsesocial.app',
      subtitle: 'Campagnes virales, gestion de communauté et branding',
      is_active: true,
    },
    {
      id: 'blk-2',
      type: 'social_row',
      title: 'Suivez nos réseaux',
      is_active: true,
    },
  ],
  is_published: true,
  views_count: 0,
  clicks_count: 0,
};

export const INITIAL_VISTA_PAGE = INITIAL_PULSE_PAGE;
