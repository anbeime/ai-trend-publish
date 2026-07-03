/**
 * API路由控制器 - 完整的RESTful API
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { verifyToken } from '../services/auth.service';
import { register, loginWithPassword, loginWithGitHub, getCurrentUser, logout } from '../services/auth.service';
import { getUserProfile, updateProfile, changePassword } from '../services/user.service';
import { getAssets, getAssetById, createAsset, updateAsset, deleteAsset } from '../services/asset.service';
import { getProjects, getProjectById, getProjectStatus, createProject, deleteProject } from '../services/project.service';
import { 
  getAllProviders, 
  getProvidersForCategory, 
  listConfigs, 
  getConfigsByCategory,
  getConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  setDefaultConfig
} from '../services/api-config.service';
import {
  generateAudioPreview,
  saveAudioPreview,
  generateScript,
  generateStoryboard,
} from '../services/generation.service';

const app = new Hono();

// ============================================================
// 中间件
// ============================================================

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: true,
}));

// 认证中间件
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '未授权访问' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  
  if (!user) {
    return c.json({ success: false, error: '无效的令牌' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// ============================================================
// 健康检查
// ============================================================

app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TikTokGen API',
    version: '1.0.0'
  });
});

// ============================================================
// 认证路由
// ============================================================

// 获取GitHub OAuth URL
app.get('/api/v1/auth/github', (c) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/auth/callback';
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  
  return c.json({ auth_url: authUrl });
});

// GitHub OAuth 回调
app.post('/api/v1/auth/github/callback', async (c) => {
  try {
    const { code } = await c.req.json();
    
    if (!code) {
      return c.json({ success: false, error: '缺少授权码' }, 400);
    }
    
    // 获取GitHub access token
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return c.json({ success: false, error: '获取GitHub令牌失败' }, 400);
    }
    
    // 获取GitHub用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    const githubUser = await userResponse.json();
    
    // 登录或创建用户
    const result = await loginWithGitHub(
      githubUser.id.toString(),
      githubUser.login,
      githubUser.email,
      githubUser.avatar_url
    );
    
    return c.json({
      success: true,
      data: {
        token: result.token,
        expires_in: result.expiresIn,
        user: result.user,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 用户注册
app.post('/api/v1/auth/register', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ success: false, error: '用户名和密码不能为空' }, 400);
    }
    
    if (username.length < 3) {
      return c.json({ success: false, error: '用户名至少3个字符' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ success: false, error: '密码至少6个字符' }, 400);
    }
    
    const result = await register(username, password);
    
    return c.json({
      success: true,
      data: {
        token: result.token,
        expires_in: result.expiresIn,
        user: result.user,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 用户登录
app.post('/api/v1/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ success: false, error: '用户名和密码不能为空' }, 400);
    }
    
    const result = await loginWithPassword(username, password);
    
    return c.json({
      success: true,
      data: {
        token: result.token,
        expires_in: result.expiresIn,
        user: result.user,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 401);
  }
});

// 获取当前用户信息
app.get('/api/v1/auth/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const userData = await getCurrentUser(user.id);
  
  if (!userData) {
    return c.json({ success: false, error: '用户不存在' }, 404);
  }
  
  return c.json({ success: true, data: userData });
});

// 用户登出
app.post('/api/v1/auth/logout', authMiddleware, async (c) => {
  const user = c.get('user');
  await logout(user.id);
  
  return c.json({ success: true, message: '登出成功' });
});

// ============================================================
// 用户路由
// ============================================================

// 获取用户详细信息
app.get('/api/v1/users/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const profile = await getUserProfile(user.id);
  
  if (!profile) {
    return c.json({ success: false, error: '用户不存在' }, 404);
  }
  
  return c.json({ success: true, data: profile });
});

// 更新用户信息
app.put('/api/v1/users/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    const profile = await updateProfile(user.id, data);
    
    return c.json({ success: true, data: profile });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 更改密码
app.post('/api/v1/users/change-password', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { current_password, new_password } = await c.req.json();
    
    if (!current_password || !new_password) {
      return c.json({ success: false, error: '当前密码和新密码不能为空' }, 400);
    }
    
    if (new_password.length < 6) {
      return c.json({ success: false, error: '新密码至少6个字符' }, 400);
    }
    
    await changePassword(user.id, current_password, new_password);
    
    return c.json({ success: true, message: '密码更改成功' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ============================================================
// 资产路由
// ============================================================

// 获取资产列表
app.get('/api/v1/assets', authMiddleware, async (c) => {
  const user = c.get('user');
  const type = c.req.query('type');
  const isSystem = c.req.query('is_system') === 'true';
  const keyword = c.req.query('keyword');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('page_size') || '50');
  
  const result = await getAssets(user.id, { type, isSystem, keyword }, page, pageSize);
  
  return c.json({ success: true, data: result });
});

// 获取单个资产
app.get('/api/v1/assets/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const assetId = c.req.param('id');
  
  const asset = await getAssetById(assetId, user.id);
  
  if (!asset) {
    return c.json({ success: false, error: '资产不存在' }, 404);
  }
  
  return c.json({ success: true, data: asset });
});

// 创建资产
app.post('/api/v1/assets', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const content = formData.get('content') as string;
    
    if (!title || !type) {
      return c.json({ success: false, error: '标题和类型不能为空' }, 400);
    }
    
    const asset = await createAsset(user.id, {
      type,
      title,
      content,
    });
    
    return c.json({ success: true, data: asset });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 更新资产
app.put('/api/v1/assets/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const assetId = c.req.param('id');
    const data = await c.req.json();
    
    const asset = await updateAsset(assetId, user.id, data);
    
    return c.json({ success: true, data: asset });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 删除资产
app.delete('/api/v1/assets/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const assetId = c.req.param('id');
    
    await deleteAsset(assetId, user.id);
    
    return c.json({ success: true, message: '删除成功' }, 204);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ============================================================
// 项目路由
// ============================================================

// 获取项目列表
app.get('/api/v1/projects', authMiddleware, async (c) => {
  const user = c.get('user');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('page_size') || '20');
  
  const result = await getProjects(user.id, status, page, pageSize);
  
  return c.json({ success: true, data: result });
});

// 获取单个项目
app.get('/api/v1/projects/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('id');
  
  const project = await getProjectById(projectId, user.id);
  
  if (!project) {
    return c.json({ success: false, error: '项目不存在' }, 404);
  }
  
  return c.json({ success: true, data: project });
});

// 获取项目状态
app.get('/api/v1/projects/:id/status', authMiddleware, async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('id');
  
  const status = await getProjectStatus(projectId, user.id);
  
  if (!status) {
    return c.json({ success: false, error: '项目不存在' }, 404);
  }
  
  return c.json({ success: true, data: status });
});

// 创建项目
app.post('/api/v1/projects', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    if (!data.avatar_id || !data.voice_id) {
      return c.json({ success: false, error: '头像和声音不能为空' }, 400);
    }
    
    const project = await createProject(user.id, {
      title: data.title,
      avatarId: data.avatar_id,
      voiceId: data.voice_id,
      scriptId: data.script_id,
      scriptContent: data.script_content,
      emotion: data.emotion,
      emotionMode: data.emotion_mode,
      emotionVector: data.emotion_vector,
      emotionText: data.emotion_text,
      emotionAlpha: data.emotion_alpha,
      emotionAudioAssetId: data.emotion_audio_asset_id,
      performancePrompt: data.performance_prompt,
      resolution: data.resolution,
      useVoiceAudioDirectly: data.use_voice_audio_directly,
      videoGenerationMode: data.video_generation_mode,
      storyboardAssetIds: data.storyboard_asset_ids,
      referenceImageAssetIds: data.reference_image_asset_ids,
      storyboardMode: data.storyboard_mode,
      promptMode: data.prompt_mode,
      promptOnlyVideo: data.prompt_only_video,
      language: data.language,
    });
    
    return c.json({ success: true, data: project });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 删除项目
app.delete('/api/v1/projects/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const projectId = c.req.param('id');
    
    await deleteProject(projectId, user.id);
    
    return c.json({ success: true, message: '删除成功' }, 204);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ============================================================
// API配置路由
// ============================================================

// 获取所有提供商
app.get('/api/v1/api-configs/providers', authMiddleware, async (c) => {
  const providers = getAllProviders();
  return c.json({ success: true, data: providers });
});

// 获取特定类别的提供商
app.get('/api/v1/api-configs/providers/:category', authMiddleware, async (c) => {
  const category = c.req.param('category');
  const providers = getProvidersForCategory(category);
  
  if (!providers) {
    return c.json({ success: false, error: '不支持的类别' }, 404);
  }
  
  return c.json({ success: true, data: providers });
});

// 获取配置列表
app.get('/api/v1/api-configs', authMiddleware, async (c) => {
  const user = c.get('user');
  const category = c.req.query('category');
  const includeSystem = c.req.query('include_system') !== 'false';
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('page_size') || '50');
  
  const result = await listConfigs(user.id, category, includeSystem, page, pageSize);
  
  return c.json({ success: true, data: result });
});

// 按类别分组获取配置
app.get('/api/v1/api-configs/by-category', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await getConfigsByCategory(user.id);
  
  return c.json({ success: true, data: result });
});

// 获取单个配置
app.get('/api/v1/api-configs/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const configId = c.req.param('id');
  const includeDecrypted = c.req.query('include_decrypted') === 'true';
  
  const config = await getConfig(configId, user.id, includeDecrypted);
  
  if (!config) {
    return c.json({ success: false, error: '配置不存在' }, 404);
  }
  
  return c.json({ success: true, data: config });
});

// 创建配置
app.post('/api/v1/api-configs', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    if (!data.category || !data.provider || !data.config_data) {
      return c.json({ success: false, error: '缺少必要参数' }, 400);
    }
    
    const config = await createConfig(
      user.id,
      data.category,
      data.provider,
      data.config_data,
      data.display_name,
      data.set_as_default
    );
    
    return c.json({ success: true, data: config });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 更新配置
app.put('/api/v1/api-configs/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const configId = c.req.param('id');
    const data = await c.req.json();
    
    const config = await updateConfig(
      configId,
      user.id,
      data.display_name,
      data.config_data,
      data.is_active
    );
    
    return c.json({ success: true, data: config });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 删除配置
app.delete('/api/v1/api-configs/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const configId = c.req.param('id');
    
    await deleteConfig(configId, user.id);
    
    return c.json({ success: true, message: '删除成功' }, 204);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 设置默认配置
app.post('/api/v1/api-configs/:id/set-default', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const configId = c.req.param('id');
    
    const config = await setDefaultConfig(configId, user.id);
    
    return c.json({
      success: true,
      data: {
        id: config.id,
        category: config.category,
        provider: config.provider,
        is_default: config.isDefault,
        message: '已设置为默认配置',
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ============================================================
// 生成路由
// ============================================================

// 音频预览
app.post('/api/v1/generation/audio-preview', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    if (!data.voice_id || !data.text) {
      return c.json({ success: false, error: '声音和文本不能为空' }, 400);
    }
    
    const result = await generateAudioPreview({
      voiceId: data.voice_id,
      text: data.text,
      emotion: data.emotion,
      emotionMode: data.emotion_mode,
      emotionVector: data.emotion_vector,
      emotionText: data.emotion_text,
      emotionAlpha: data.emotion_alpha,
      emotionAudioAssetId: data.emotion_audio_asset_id,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 保存音频预览
app.post('/api/v1/generation/audio-preview/save', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    if (!data.audio_url) {
      return c.json({ success: false, error: '音频URL不能为空' }, 400);
    }
    
    const result = await saveAudioPreview({
      audioUrl: data.audio_url,
      title: data.title,
      voiceId: data.voice_id,
      text: data.text,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 生成脚本
app.post('/api/v1/generation/script', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    if (!data.product_name || !data.product_description) {
      return c.json({ success: false, error: '产品名称和描述不能为空' }, 400);
    }
    
    const result = await generateScript({
      productName: data.product_name,
      productDescription: data.product_description,
      targetAudience: data.target_audience,
      tone: data.tone,
      durationSeconds: data.duration_seconds,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 生成故事板
app.post('/api/v1/generation/storyboard', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    if (!data.script_content) {
      return c.json({ success: false, error: '脚本内容不能为空' }, 400);
    }
    
    const result = await generateStoryboard({
      scriptContent: data.script_content,
      productName: data.product_name,
      userPrompt: data.user_prompt,
      style: data.style,
      frameCount: data.frame_count,
      aspectRatio: data.aspect_ratio,
      imageProvider: data.image_provider,
      referenceImageUrl: data.reference_image_url,
      language: data.language,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;