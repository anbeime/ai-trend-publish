export enum AssetType {
  AVATAR = 'avatar',
  VOICE = 'voice',
  SCRIPT = 'script',
  STORYBOARD = 'storyboard'
}

export type AudioMode = 'tts' | 'direct';
export type VideoGenerationMode = 'tts_required' | 'audio_sync';
export type StoryboardMode = 'none' | 'first_frame' | 'multi_image' | 'keyframes';

export type Locale = 'en' | 'zh';

export interface Asset {
  id: string;
  type: 'avatar' | 'voice' | 'script' | 'storyboard';
  title: string;
  description?: string;
  is_system: boolean;
  content?: string;
  file_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
  metadata?: {
    prompt?: string;
    estimatedSeconds?: number;
    gender?: 'male' | 'female';
    tags?: string[];
    duration_seconds?: number;
    word_count?: number;
    width?: number;
    height?: number;
    storyboard_id?: string;
    scene_index?: number;
    scene_count?: number;
    provider?: string;
    model?: string;
  };
  status?: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

export enum ProjectStatus {
  PENDING = 'pending',
  GENERATING_AUDIO = 'generating_audio',
  GENERATING_VIDEO = 'generating_video',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Project {
  id: string;
  title: string;
  thumbnail_url?: string;
  video_url?: string;
  status: ProjectStatus;
  created_at: string;
  assets: {
    avatar?: Asset;
    voice?: Asset;
    script?: Asset;
  };
  prompt?: string;
  error?: string;
}

export interface User {
  id: string;
  username: string;
  avatar_url: string;
}

// ============================================================
// API Configuration Types
// ============================================================

export type ApiCategory = 'ai_image' | 'cloud_storage' | 'digital_human' | 'tts' | 'llm';

export interface ProviderField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'url';
  required: boolean;
  default?: string | number;
  placeholder?: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  sensitive: boolean;
  min_value?: number;
  max_value?: number;
}

export interface Provider {
  provider: string;
  display_name: string;
  description: string;
  category: string;
  website_url?: string;
  icon?: string;
  fields: ProviderField[];
}

export interface CategoryProviders {
  category: string;
  display_name: string;
  icon: string;
  providers: Provider[];
}

export interface ApiConfig {
  id: string;
  user_id: string | null;
  category: string;
  provider: string;
  display_name: string | null;
  config_data: Record<string, unknown>;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
  is_validated: boolean;
  last_validated_at: string | null;
  validation_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiConfigBrief {
  id: string;
  category: string;
  provider: string;
  display_name: string | null;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
  is_validated: boolean;
}

export interface CategoryConfig {
  category: string;
  display_name: string;
  icon: string;
  configs: ApiConfigBrief[];
  has_default: boolean;
  default_provider: string | null;
}
