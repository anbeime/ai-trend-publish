/**
 * React Hooks for API Data
 * Provides state management for assets, projects, and auth
 */

import { useState, useEffect } from 'react';
import { assetsApi, projectsApi, authApi, getToken, setToken, removeToken } from './api';
import type { Asset, Project } from './api';

// ============================================
// Auth Hook
// ============================================

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (token) {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        removeToken();
      }
    }
    setLoading(false);
  };

  const login = async (code: string) => {
    const data = await authApi.githubCallback(code);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithPassword = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username: string, password: string) => {
    const data = await authApi.register(username, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout();
    removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const token = getToken();
    if (token) {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  return { user, loading, login, loginWithPassword, register, logout, checkAuth, refreshUser };
}

// ============================================
// Assets Hook
// ============================================

export function useAssets(type?: 'avatar' | 'voice' | 'script' | 'storyboard') {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [type]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // Increase page_size to get more assets, including user uploads
      const response = await assetsApi.getAssets({ type, page_size: 100 });
      setAssets(response.list);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchAssets();

  return { assets, loading, error, refetch };
}

// ============================================
// Projects Hook
// ============================================

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getProjects();
      setProjects(response.list);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchProjects();

  const createProject = async (data: {
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
  }) => {
    const project = await projectsApi.createProject(data);
    setProjects(prev => [project, ...prev]);
    return project;
  };

  return { projects, loading, error, refetch, createProject };
}

// ============================================
// Project Status Hook (for polling)
// ============================================

export function useProjectStatus(projectId: string | null, poll: boolean = true) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!projectId || !poll) return;

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds if not completed
    const interval = setInterval(() => {
      fetchStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId, poll]);

  const fetchStatus = async () => {
    if (!projectId) return;
    try {
      const data = await projectsApi.getProjectStatus(projectId);
      setStatus(data);

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        // The interval will be cleared by the cleanup function
      }
    } catch (error) {
      console.error('Failed to fetch project status:', error);
    }
  };

  return status;
}

// ============================================
// System Config Hook
// ============================================

export function useSystemConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await (await import('./api')).systemApi.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch system config:', error);
    } finally {
      setLoading(false);
    }
  };

  return { config, loading };
}

export { assetsApi, projectsApi, authApi, generationApi };
