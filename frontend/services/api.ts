/**
 * API Service for TikTokGen Frontend
 * Handles all communication with the backend API
 */

import type { Asset, Project, ApiConfig, CategoryProviders, CategoryConfig } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Storage key for auth token
const TOKEN_KEY = 'tiktokgen_token';

/**
 * Get stored auth token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store auth token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove auth token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Make API request with auth
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.detail || 'Request failed');
  }

  return data.data || data;
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  /**
   * Get GitHub OAuth URL
   */
  getGitHubAuthURL: () => request<{ auth_url: string }>('/auth/github'),

  /**
   * Handle GitHub OAuth callback
   */
  githubCallback: (code: string) =>
    request<{
      token: string;
      expires_in: number;
      user: {
        id: string;
        username: string;
        email: string;
        avatar_url: string;
        tier: string;
      };
    }>('/auth/github/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  /**
   * Register with username and password
   */
  register: (username: string, password: string) =>
    request<{
      token: string;
      expires_in: number;
      user: {
        id: string;
        username: string;
        email: string;
        avatar_url: string;
        tier: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  /**
   * Login with username and password
   */
  login: (username: string, password: string) =>
    request<{
      token: string;
      expires_in: number;
      user: {
        id: string;
        username: string;
        email: string;
        avatar_url: string;
        tier: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  /**
   * Get current user
   */
  getMe: () =>
    request<{
      id: string;
      username: string;
      email: string;
      avatar_url: string;
      tier: string;
    }>('/auth/me'),

  /**
   * Logout
   */
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};

// ============================================
// Assets API
// ============================================

export const assetsApi = {
  /**
   * Get assets list
   */
  getAssets: (params?: {
    type?: 'avatar' | 'voice' | 'script' | 'storyboard';
    is_system?: boolean;
    keyword?: string;
    page?: number;
    page_size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.is_system !== undefined) searchParams.append('is_system', String(params.is_system));
    if (params?.keyword) searchParams.append('keyword', params.keyword);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    return request<{
      list: Asset[];
      pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
      };
    }>(`/assets?${searchParams.toString()}`);
  },

  /**
   * Get asset by ID
   */
  getAssetById: (id: string) =>
    request<Asset>(`/assets/${id}`),

  /**
   * Upload avatar (direct file upload)
   * Note: This endpoint expects FormData with 'file' and 'title' fields
   */
  uploadAvatar: (data: FormData) =>
    request<Asset>('/assets/avatars/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: data,
    }),

  /**
   * Generate avatar with AI
   */
  generateAvatar: (data: {
    title: string;
    prompt: string;
    style?: string;
    gender?: string;
    age_range?: string;
    reference_images?: File[];
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('prompt', data.prompt);
    if (data.style) formData.append('style', data.style);
    if (data.gender) formData.append('gender', data.gender);
    if (data.age_range) formData.append('age_range', data.age_range);
    // 添加参考图片（以图生图）
    if (data.reference_images && data.reference_images.length > 0) {
      data.reference_images.forEach((file) => {
        formData.append('reference_images', file);
      });
    }

    return request<Asset>('/assets/avatars/generate', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  },

  /**
   * Upload voice (audio file upload)
   */
  uploadVoice: (data: FormData) =>
    request<Asset>('/assets/voices/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: data,
    }),

  /**
   * Create script
   */
  createScript: (data: {
    title: string;
    content: string;
    tags?: string;
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.tags) formData.append('tags', data.tags);

    return request<Asset>('/assets/scripts', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  },

  /**
   * Update asset
   */
  updateAsset: (id: string, data: { title?: string; metadata?: any }) =>
    request<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete asset
   */
  deleteAsset: (id: string) =>
    request<void>(`/assets/${id}`, { method: 'DELETE' }),
};

// ============================================
// Projects API
// ============================================

export const projectsApi = {
  /**
   * Get projects list
   */
  getProjects: (params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    return request<{
      list: Project[];
      pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
      };
    }>(`/projects?${searchParams.toString()}`);
  },

  /**
   * Get project by ID
   */
  getProjectById: (id: string) => request<Project>(`/projects/${id}`),

  /**
   * Get project status
   */
  getProjectStatus: (id: string) =>
    request<{
      id: string;
      status: string;
      progress: number;
      currentStep: string;
      steps: Array<{ name: string; status: string }>;
      estimatedRemainingSeconds: number;
      error?: string;
    }>(`/projects/${id}/status`),

  /**
   * Create new project
   */
  createProject: (data: {
    title?: string;
    avatar_id: string;
    voice_id: string;
    script_id?: string;
    script_content?: string;
    emotion?: string;
    emotion_mode?: 'preset' | 'vector' | 'audio_ref' | 'text_ref';
    emotion_vector?: number[];
    emotion_text?: string;
    emotion_alpha?: number;
    emotion_audio_asset_id?: string;
    performance_prompt?: string;
    resolution?: string;
    use_voice_audio_directly?: boolean;
    video_generation_mode?: 'tts_required' | 'audio_sync';
    storyboard_asset_ids?: string[];
    reference_image_asset_ids?: string[];
    storyboard_mode?: 'none' | 'first_frame' | 'multi_image' | 'keyframes';
    prompt_mode?: 'script' | 'direct';
    prompt_only_video?: boolean;
    language?: 'zh' | 'en';
  }) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Delete project
   */
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),
};

// ============================================
// Generation API
// ============================================

export const generationApi = {
  /**
   * Generate audio preview
   */
  audioPreview: (data: {
    voice_id: string;
    text: string;
    emotion?: string;
    emotion_mode?: 'preset' | 'vector' | 'audio_ref' | 'text_ref';
    emotion_vector?: number[];
    emotion_text?: string;
    emotion_alpha?: number;
    emotion_audio_asset_id?: string;
  }) =>
    request<{
      audio_url: string;
      duration_seconds: number;
      expires_in: number;
    }>('/generation/audio-preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Save preview audio into voice library
   */
  saveAudioPreview: (data: {
    audio_url: string;
    title?: string;
    voice_id?: string;
    text?: string;
  }) =>
    request<Asset>('/generation/audio-preview/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Generate marketing script with AI
   */
  generateScript: (data: {
    product_name: string;
    product_description: string;
    target_audience?: string;
    tone?: string;
    duration_seconds?: number;
  }) =>
    request<{
      scripts: Array<{
        content: string;
        estimated_seconds: number;
        word_count: number;
      }>;
    }>('/generation/script', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Generate storyboard frames from a script
   */
  generateStoryboard: (data: {
    script_content: string;
    product_name?: string;
    user_prompt?: string;
    style?: string;
    frame_count?: number;
    aspect_ratio?: string;
    image_provider?: string;
    reference_image_url?: string;
    language?: 'zh' | 'en';
  }) =>
    request<{
      storyboard_id: string;
      frames: Array<{
        asset_id: string;
        scene_index: number;
        prompt: string;
        video_prompt?: string;
        image_url: string;
      }>;
    }>('/generation/storyboard', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================
// Upload API
// ============================================

export const uploadApi = {
  /**
   * Get presigned upload URL
   */
  getPresignedUrl: (data: {
    file_name: string;
    file_type: string;
    file_size: number;
    category: string;
  }) =>
    request<{
      uploadUrl: string;
      key: string;
      fileUrl: string;
      expiresIn: number;
    }>('/upload/presign', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================
// Users API
// ============================================

export const usersApi = {
  /**
   * Update user profile
   */
  updateProfile: (data: {
    username?: string;
    email?: string;
  }) =>
    request<{
      id: string;
      username: string;
      email: string;
      avatar_url: string;
      tier: string;
    }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Change password
   */
  changePassword: (data: {
    current_password: string;
    new_password: string;
  }) =>
    request<void>('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================
// System API
// ============================================

export const systemApi = {
  /**
   * Get system config
   */
  getConfig: () =>
    request<{
      max_upload_size_mb: number;
      supported_image_formats: string[];
      supported_audio_formats: string[];
      max_script_length: number;
      max_video_duration_seconds: number;
      resolutions: string[];
      tiers: Record<string, {
        minutes_per_month: number;
        storage_mb: number;
        max_resolution: string;
      }>;
      emotions: Array<{ id: string; label: string; icon: string }>;
    }>('/system/config'),

  /**
   * Get subscription plans
   */
  getPlans: () =>
    request<Array<{
      tier: string;
      name: string;
      description: string;
      priceMonthly: number;
      priceYearly: number;
      currency: string;
      minutesPerMonth: number;
      storageMb: number;
      maxResolution: string;
      maxAssets: number;
      features: Record<string, boolean>;
    }>>('/system/plans'),
};

// ============================================
// API Config API
// ============================================

export const apiConfigApi = {
  /**
   * Get all providers grouped by category
   */
  getProviders: () =>
    request<{ categories: CategoryProviders[] }>('/api-configs/providers'),

  /**
   * Get providers for a specific category
   */
  getProvidersByCategory: (category: string) =>
    request<CategoryProviders>(`/api-configs/providers/${category}`),

  /**
   * Get latest SiliconFlow audio models
   */
  getSiliconFlowModels: (params?: { api_key?: string; base_url?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.api_key) searchParams.append('api_key', params.api_key);
    if (params?.base_url) searchParams.append('base_url', params.base_url);
    const suffix = searchParams.toString();
    return request<{ models: Array<{ id: string; label: string }> }>(
      `/api-configs/providers/tts/siliconflow/models${suffix ? `?${suffix}` : ''}`
    );
  },

  /**
   * List all API configurations
   */
  listConfigs: (params?: {
    category?: string;
    include_system?: boolean;
    page?: number;
    page_size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.include_system !== undefined) searchParams.append('include_system', String(params.include_system));
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    return request<{
      list: ApiConfig[];
      pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
      };
    }>(`/api-configs?${searchParams.toString()}`);
  },

  /**
   * Get configurations grouped by category
   */
  getConfigsByCategory: () =>
    request<CategoryConfig[]>('/api-configs/by-category'),

  /**
   * Get a specific configuration
   */
  getConfig: (id: string, includeDecrypted = false) =>
    request<ApiConfig>(`/api-configs/${id}?include_decrypted=${includeDecrypted}`),

  /**
   * Create a new configuration
   */
  createConfig: (data: {
    category: string;
    provider: string;
    display_name?: string;
    config_data: Record<string, unknown>;
    set_as_default?: boolean;
  }) =>
    request<ApiConfig>('/api-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update a configuration
   */
  updateConfig: (id: string, data: {
    display_name?: string;
    config_data?: Record<string, unknown>;
    is_active?: boolean;
  }) =>
    request<ApiConfig>(`/api-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a configuration
   */
  deleteConfig: (id: string) =>
    request<void>(`/api-configs/${id}`, { method: 'DELETE' }),

  /**
   * Validate configuration data
   */
  validateConfig: (data: {
    category: string;
    provider: string;
    config_data: Record<string, unknown>;
  }) =>
    request<{
      is_valid: boolean;
      message?: string;
      details?: Record<string, unknown>;
    }>('/api-configs/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Set configuration as default for its category
   */
  setDefault: (id: string) =>
    request<{
      id: string;
      category: string;
      provider: string;
      is_default: boolean;
      message: string;
    }>(`/api-configs/${id}/set-default`, {
      method: 'POST',
    }),

  /**
   * Validate connection for a configuration
   */
  validateConnection: (id: string) =>
    request<{
      is_valid: boolean;
      message?: string;
      details?: Record<string, unknown>;
    }>(`/api-configs/${id}/validate-connection`, {
      method: 'POST',
    }),
};

export default {
  authApi,
  assetsApi,
  projectsApi,
  generationApi,
  uploadApi,
  usersApi,
  systemApi,
  apiConfigApi,
  getToken,
  setToken,
  removeToken,
};
