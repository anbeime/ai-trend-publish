/**
 * 热点与内容自动化相关 API
 */

const API_BASE = typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : '';

async function request(url: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const trendApi = {
  // 健康检查
  health: () => request('/api/health'),

  // 获取热点列表
  getHotspots: () => request('/api/hotspots'),

  // 分析热点
  analyzeHotspots: (hotspots: any[], category?: string) =>
    request('/api/hotspots/analyze', {
      method: 'POST',
      body: JSON.stringify({ hotspots, category }),
    }),

  // AI 对话
  chat: (agentType: string, userMessage: string, conversationHistory?: any[]) =>
    request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ agentType, userMessage, conversationHistory }),
    }),

  // 生成文章
  generateArticle: (data: { topic: string; keywords?: string; tone?: string; wordCount?: number; style?: string }) =>
    request('/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 获取微信配置
  getWechatConfig: () => request('/api/wechat/config'),

  // 保存微信配置
  saveWechatConfig: (appid: string, secret: string) =>
    request('/api/wechat/config', {
      method: 'POST',
      body: JSON.stringify({ appid, secret }),
    }),

  // 发布到微信
  publishToWechat: (data: { title: string; content: string; summary?: string; thumb_media_id?: string }) =>
    request('/api/wechat/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 完整自动发布工作流
  autoPublish: (data: { topic?: string; keywords?: string; tone?: string; publishToWechat?: boolean }) =>
    request('/api/workflow/auto-publish', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
