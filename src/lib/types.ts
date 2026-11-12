export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'threads'
  | 'google_business';

export type PostStatus =
  | 'draft'
  | 'needs_approval'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed';

export type PostType =
  | 'post'
  | 'reel'
  | 'story'
  | 'carousel'
  | 'thread'
  | 'short'
  | 'pin';

export interface SocialAccount {
  id: string;
  workspace_id: string;
  platform: SocialPlatform;
  account_name: string;
  username: string;
  avatar_url: string;
  is_connected: boolean;
  status: 'active' | 'expired' | 'error' | 'paused';
  followers_count: number;
}

export interface Post {
  id: string;
  workspace_id: string;
  author_name: string;
  content: string;
  post_type: PostType;
  media_urls: string[];
  status: PostStatus;
  scheduled_for: string; // ISO string
  published_at?: string;
  error_message?: string;
  tags?: string[];
  notes?: string;
  first_comment?: string;
  target_accounts: string[]; // social_account ids
  created_at: string;
}

export interface InboxConversation {
  id: string;
  workspace_id: string;
  social_account_id: string;
  customer_name: string;
  customer_username: string;
  customer_avatar_url: string;
  status: 'open' | 'closed' | 'snoozed';
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  last_message_preview: string;
  last_message_at: string;
  unread_count?: number;
}

export interface InboxMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_type: 'dm' | 'comment' | 'mention' | 'review';
  content: string;
  media_urls?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export interface ListeningMention {
  id: string;
  platform: SocialPlatform;
  author_name: string;
  author_handle: string;
  author_avatar: string;
  content: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reach: number;
  engagement: number;
  published_at: string;
}

export interface ReviewItem {
  id: string;
  workspace_id: string;
  platform: 'google' | 'yelp' | 'facebook' | 'trustpilot';
  author_name: string;
  author_avatar?: string;
  rating: number; // 1-5
  review_text: string;
  response_text?: string;
  responded_at?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  review_date: string;
}

export interface VistaPageBlock {
  id: string;
  type: 'link' | 'header' | 'social_row' | 'video' | 'product';
  title?: string;
  url?: string;
  subtitle?: string;
  icon?: string;
  image_url?: string;
  price?: string;
  is_active: boolean;
}

export interface VistaPage {
  id: string;
  workspace_id: string;
  title: string;
  slug: string;
  bio: string;
  avatar_url: string;
  theme_config: {
    preset: string;
    bg_type: 'gradient' | 'solid' | 'mesh';
    bg_gradient: string;
    text_color: string;
    button_bg: string;
    button_text: string;
    button_border: string;
    button_radius: string;
    font_family: string;
  };
  blocks: VistaPageBlock[];
  is_published: boolean;
  views_count: number;
  clicks_count: number;
}

