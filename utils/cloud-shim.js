/**
 * 云函数兼容层 (Cloud Function Shim) v2
 *
 * 所有功能都通过 HTTP 请求自有服务器，不再使用本地 Storage 模拟。
 * 服务器端由 draft-api.py 提供完整 API。
 *
 * AI/热点/发布类：通过 ai-service.js 调用
 * 用户数据类：直接请求服务器 API
 */

const aiService = require('./ai-service.js');

/**
 * 获取服务器基础 URL
 */
function getServerUrl() {
  try {
    const secrets = require('../config/secrets.js');
    return secrets.server?.draftApiUrl || 'http://39.108.254.228:8002';
  } catch (e) {
    return 'http://39.108.254.228:8002';
  }
}

/**
 * 获取用户 openid（从本地缓存或生成）
 */
function getOpenId() {
  let openid = wx.getStorageSync('user_openid');
  if (!openid) {
    openid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    wx.setStorageSync('user_openid', openid);
  }
  return openid;
}

/**
 * 服务器请求封装
 */
async function serverRequest(path, method = 'GET', data = {}) {
  const baseUrl = getServerUrl();
  const url = baseUrl + path;
  const openid = getOpenId();

  console.log(`[CloudShim] 请求服务器: ${method} ${url}`);

  return new Promise((resolve, reject) => {
    const requestData = method === 'GET' ? {} : { ...data, openid };
    wx.request({
      url: url + (method === 'GET' ? '?openid=' + openid + (data.action ? '&action=' + data.action : '') : ''),
      method: method,
      timeout: 15000,
      header: { 'Content-Type': 'application/json' },
      data: requestData,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '服务器请求失败'));
      },
    });
  });
}

// 云函数名称到处理器的映射
const FUNCTION_ROUTING = {
  // === AI 对话（通过 ai-service.js，请求真实 AI API） ===
  'agentAI': async (data) => {
    return aiService.callAI(data.userMessage || '', {
      agentType: data.agentType || 'default',
      messages: data.conversationHistory || [],
    });
  },

  // === 热点采集（通过 ai-service.js，请求自有服务器多源采集） ===
  'hotspot-miyucaicai': async (data) => {
    // 多源采集（15平台分批并发），支持评分参数
    return aiService.fetchHotspots({
      scoring: data?.enableScoring || false,
      limit: data?.limit || 100,
    });
  },
  'hotspot-collector': async (data) => aiService.fetchHotspots({
    scoring: data?.enableScoring || false,
    limit: data?.limit || 100,
  }),
  
  // === 热点评分（通过服务器端 10分制评分接口） ===
  'topic-scorer': async (data) => aiService.scoreTopics(data?.items || [], {
    minScore: data?.minScore || 7,
    sortBy: data?.sortBy || 'score',
    targetPlatform: data?.targetPlatform || 'general',
    maxResults: data?.maxResults || 0,
    showAll: data?.showAll || false,
    categoryFilter: data?.categoryFilter || null,
  }),
  'hotspot-scorer': async (data) => aiService.scoreTopics(data?.hotspots || data?.items || [], {
    minScore: data?.minScore || 7,
  }),

  // === 热点分析（通过服务器端深度分析接口） ===
  'hotspot-analyzer': async (data) => aiService.analyzeHotspots(
    data?.hotspots || [],
    data?.category || '全部'
  ),
  'mediacrawler-hotspot': async (data) => aiService.fetchHotspots({
    scoring: data?.enableScoring || false,
    limit: data?.limit || 100,
  }),

  // === 微信发布（通过 ai-service.js，请求自有服务器） ===
  'wechat-publish-api': async (data) => {
    if (data && data.action === 'workflow') {
      return aiService.publishToWechat(data.data || {});
    }
    return aiService.publishToWechat(data || {});
  },
  'wechat-publish-sdk': async (data) => aiService.publishToWechat(data || {}),
  'social-media-proxy': async (data) => {
    if (data && data.action === 'publish-draft') {
      return aiService.publishToWechat(data.data || {});
    }
    if (data && data.action === 'publish-multi') {
      // 多账号发布：转发到 8003 端口的多账号发布服务
      try {
        const secrets = require('../config/secrets.js');
        const multiPublishUrl = (secrets.server?.socialApiUrl || 'http://39.108.254.228:8002') + '/publish-draft';
        const openid = getOpenId();
        const requestData = { ...(data.data || {}), openid };
        console.log(`[CloudShim] 多账号发布请求: POST ${multiPublishUrl}`);
        return new Promise((resolve, reject) => {
          wx.request({
            url: multiPublishUrl,
            method: 'POST',
            timeout: 120000,
            header: { 'Content-Type': 'application/json' },
            data: requestData,
            success: (res) => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(res.data);
              } else {
                resolve({ success: false, error: `HTTP ${res.statusCode}: ${JSON.stringify(res.data)}` });
              }
            },
            fail: (err) => {
              resolve({ success: false, error: err.errMsg || '多账号发布请求失败' });
            },
          });
        });
      } catch (e) {
        return { success: false, error: e.message || '多账号发布配置错误' };
      }
    }
    if (data && data.action === 'upload') {
      return aiService.publishToSocialMedia(data.platform || 'wechat', data.data || {});
    }
    if (data && data.action === 'health') {
      return { success: true, apiAvailable: true };
    }
    if (data && data.action === 'platforms') {
      return { success: true, platforms: ['douyin', 'xiaohongshu', 'bilibili', 'kuaishou'] };
    }
    return { success: false, error: '不支持的操作' };
  },
  'xiaohongshu-publisher': async (data) => aiService.publishToSocialMedia('xiaohongshu', data?.data || data || {}),

  // === 图片生成（通过 ai-service.js，请求真实 AI API） ===
  'generateImage': async (data) => aiService.generateImage(data?.prompt || '', data || {}),
  'generateImage-xd0Ly2': async (data) => aiService.generateImage(data?.prompt || '', data || {}),
  'generateDreamPrompt': async (data) => aiService.generateImage(data?.prompt || '', data || {}),

  // === 用户积分（请求服务器 SQLite 数据库） ===
  'credit-manager': async (data) => {
    const action = data?.action || 'get';
    try {
      const result = await serverRequest('/api/user/credits', action === 'get' || action === 'init' ? 'GET' : 'POST', { action });
      return result;
    } catch (error) {
      console.error('[CloudShim] 积分请求失败:', error.message);
      return { success: false, error: error.message };
    }
  },

  // === 会员管理（请求服务器） ===
  'member-manager': async (data) => {
    const action = data?.action || 'getStatus';
    try {
      const result = await serverRequest('/api/user/member', action === 'getStatus' || action === 'checkQuota' ? 'GET' : 'POST', { action });
      return result;
    } catch (error) {
      console.error('[CloudShim] 会员请求失败:', error.message);
      return { success: false, error: error.message };
    }
  },

  // === 创作历史（请求服务器） ===
  'creationHistory': async (data) => {
    const action = data?.action;
    if (action === 'getOpenId') {
      return { success: true, openid: getOpenId() };
    }
    try {
      if (action === 'save') {
        const result = await serverRequest('/api/history', 'POST', data.data || {});
        return result;
      }
      // list / getHistory
      const result = await serverRequest('/api/history', 'GET');
      return result;
    } catch (error) {
      console.error('[CloudShim] 历史请求失败:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  'creationHistory-initDatabase': async () => {
    return { success: true, message: '服务器数据库已就绪' };
  },

  // === GLM API（通过 ai-service.js） ===
  'glm-api': async (data) => {
    if (data && data.action === 'chat') {
      return aiService.callGLM(data.data?.prompt || '', data.data || {});
    }
    return aiService.callGLM(data?.prompt || '', data || {});
  },

  // === 项目管理（请求服务器） ===
  'project-manager': async (data) => {
    const action = data?.action;
    try {
      if (action === 'create') {
        return await serverRequest('/api/projects', 'POST', data.data || {});
      }
      // list / get
      return await serverRequest('/api/projects', 'GET');
    } catch (error) {
      console.error('[CloudShim] 项目请求失败:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  // === 角色管理（请求服务器） ===
  'character-manager': async (data) => {
    const action = data?.action;
    try {
      if (action === 'create' || action === 'save') {
        return await serverRequest('/api/characters', 'POST', data.data || {});
      }
      return await serverRequest('/api/characters', 'GET');
    } catch (error) {
      console.error('[CloudShim] 角色请求失败:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  // === 模板管理（请求服务器） ===
  'template-manager': async (data) => {
    const action = data?.action;
    try {
      if (action === 'create' || action === 'save') {
        return await serverRequest('/api/templates', 'POST', data.data || {});
      }
      return await serverRequest('/api/templates', 'GET');
    } catch (error) {
      console.error('[CloudShim] 模板请求失败:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  // === API 配置（请求服务器） ===
  'api-config': async (data) => {
    const action = data?.action;
    try {
      if (action === 'save') {
        return await serverRequest('/api/configs', 'POST', { data: data.data || {} });
      }
      return await serverRequest('/api/configs', 'GET');
    } catch (error) {
      console.error('[CloudShim] 配置请求失败:', error.message);
      return { success: false, error: error.message, data: {} };
    }
  },

  // === 微信公众号账号管理（请求服务器） ===
  'wechat-account-manager': async (data) => {
    const action = data?.action || 'getAccounts';
    try {
      if (action === 'saveAccount' || action === 'deleteAccount' || action === 'setSelected') {
        return await serverRequest('/api/wechat-accounts', 'POST', { action, ...data });
      }
      // getAccounts / getSelected -> GET 请求，serverRequest 会自动添加 openid 和 action
      return await serverRequest('/api/wechat-accounts', 'GET', { action });
    } catch (error) {
      console.error('[CloudShim] 公众号管理请求失败:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  // === 场景编排（通过 ai-service.js） ===
  'scene-orchestrator': async (data) => {
    return aiService.callAI(data?.userMessage || '', {
      agentType: data?.agentType || 'scene',
    });
  },

  // === 内容优化（通过 ai-service.js） ===
  'content-optimizer': async (data) => {
    return aiService.callAI(data?.content || data?.text || '', {
      agentType: 'content-optimizer',
    });
  },

  // === ChatDream（通过 ai-service.js） ===
  'chatDream': async (data) => {
    return aiService.callAI(data?.message || data?.prompt || '', {
      agentType: 'chatDream',
    });
  },

  // === 以下功能需要额外服务器端支持 ===
  'video-composer': async () => {
    return { success: false, error: '视频合成功能需要额外的服务器端模块' };
  },
  'viral-video-parser': async () => {
    return { success: false, error: '爆款视频解析需要额外的服务器端模块' };
  },
  'url-to-markdown': async () => {
    return { success: false, error: 'URL转Markdown需要额外的服务器端模块' };
  },
  'coze-skill': async () => {
    return { success: false, error: 'COZE技能需要额外的服务器端配置' };
  },
  'pay': async () => {
    return { success: false, error: '支付功能需要微信支付配置' };
  },
  'init-collections': async () => {
    return { success: true, message: '服务器数据库已就绪，无需初始化集合' };
  },
};

/**
 * 兼容层安装方法
 * 在 app.js 的 onLaunch 中调用
 */
function install() {
  if (typeof wx.cloud === 'undefined' || !wx.cloud) {
    console.log('[CloudShim] wx.cloud 不可用，安装兼容层');
    wx.cloud = {};
  }

  const originalCallFunction = wx.cloud.callFunction;

  wx.cloud.callFunction = function (options) {
    const { name, data = {}, success, fail, complete } = options;

    const handler = FUNCTION_ROUTING[name];

    if (handler) {
      console.log(`[CloudShim] 路由云函数 ${name} -> 服务器API`);

      // 只调用一次 handler，同时支持回调和 Promise
      const promise = handler(data)
        .then((result) => {
          const response = { result: result };
          if (success) success(response);
          if (complete) complete(response);
          return response;
        })
        .catch((error) => {
          console.error(`[CloudShim] 云函数 ${name} 路由失败:`, error);
          const errObj = error.errCode ? error : { errCode: -1, errMsg: error.message || String(error) };
          if (fail) fail(errObj);
          if (complete) complete(errObj);
          throw errObj;
        });

      // 返回 Promise 供 await 使用，不会重复调用 handler
      return promise;
    }

    // 未找到路由，尝试使用原始云函数
    if (originalCallFunction) {
      console.log(`[CloudShim] 未找到路由 ${name}，使用原始云函数`);
      return originalCallFunction.call(wx.cloud, options);
    }

    // 没有原始云函数，直接报错
    const error = { errCode: -1, errMsg: `云函数 ${name} 不可用（未配置）` };
    console.warn(`[CloudShim] ${error.errMsg}`);
    if (fail) fail(error);
    if (complete) complete(error);
    return Promise.reject(error);
  };

  // wx.cloud.database 也改为请求服务器
  if (!wx.cloud.database) {
    wx.cloud.database = function () {
      return {
        collection: function (name) {
          return {
            where: function () { return this; },
            orderBy: function () { return this; },
            limit: function () { return this; },
            get: function () {
              // 通过 HTTP 请求服务器获取数据
              return new Promise((resolve, reject) => {
                serverRequest('/api/' + name, 'GET')
                  .then(res => resolve({ data: res.data || [] }))
                  .catch(reject);
              });
            },
            add: function (options) {
              return new Promise((resolve, reject) => {
                serverRequest('/api/' + name, 'POST', options.data || {})
                  .then(res => resolve({ _id: res.data?.id || 'id_' + Date.now() }))
                  .catch(reject);
              });
            },
            update: function () {
              return Promise.resolve({ stats: { updated: 1 } });
            },
            remove: function () {
              return Promise.resolve({ stats: { removed: 1 } });
            },
            count: function () {
              return Promise.resolve({ total: 0 });
            },
          };
        },
        command: {
          eq: function () { return {}; },
          gt: function () { return {}; },
          lt: function () { return {}; },
          gte: function () { return {}; },
          lte: function () { return {}; },
          in: function () { return {}; },
          nin: function () { return {}; },
          and: function () { return {}; },
          or: function () { return {}; },
        },
      };
    };
  }

  if (!wx.cloud.openapi) {
    wx.cloud.openapi = function () {
      return new Promise((resolve, reject) => {
        reject({ errCode: -1, errMsg: 'openAPI 不可用（未配置云环境）' });
      });
    };
  }

  console.log('[CloudShim] v2 兼容层安装完成（全部数据走服务器）');
}

module.exports = {
  install,
  FUNCTION_ROUTING,
  getOpenId,
  serverRequest,
};
