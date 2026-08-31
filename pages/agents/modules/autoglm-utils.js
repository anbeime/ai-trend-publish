// pages/agents/modules/autoglm-utils.js
// AutoGLM 自动发布和GLM视频生成工具模块
// 注意：此模块为预留功能，待AutoGLM服务成熟后使用

/**
 * 平台名称映射
 */
const PLATFORM_NAMES = {
  douyin: '抖音',
  kuaishou: '快手',
  youtube: 'YouTube Shorts',
  bilibili: 'B站'
};

/**
 * 状态文本映射
 */
const STATUS_TEXTS = {
  disconnected: "未连接",
  connected: "已连接",
  error: "连接错误",
  disabled: "已禁用",
};

/**
 * 获取平台名称
 * @param {string} platformKey - 平台key
 * @returns {string} 平台名称
 */
function getPlatformName(platformKey) {
  return PLATFORM_NAMES[platformKey] || platformKey;
}

/**
 * 获取状态文本
 * @param {string} status - 状态
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  return STATUS_TEXTS[status] || status;
}

/**
 * 调用 AutoGLM 发布API
 * @param {string} platform - 平台
 * @param {string} title - 标题
 * @param {string} description - 描述
 * @param {Array} tags - 标签列表
 * @param {object} config - AutoGLM配置 {serverUrl}
 * @returns {Promise<{success: boolean, data: object}>} 发布结果
 */
function callAutoGLMPublish(platform, title, description, tags, config) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.serverUrl}/api/publish`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      data: {
        platform: platform,
        title: title,
        description: description,
        tags: tags,
        timestamp: Date.now(),
      },
      timeout: 30000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          resolve({
            success: true,
            data: res.data
          });
        } else {
          reject(new Error(res.data?.error?.message || '发布失败'));
        }
      },
      fail: (err) => {
        console.error('AutoGLM发布API调用失败:', err);
        reject(new Error(`发布API调用失败: ${err.errMsg}`));
      },
    });
  });
}

/**
 * 检查AutoGLM服务器状态
 * @param {object} config - AutoGLM配置 {serverUrl}
 * @param {function} onSuccess - 成功回调
 * @param {function} onError - 失败回调
 * @returns {void}
 */
function checkAutoGLMStatus(config, onSuccess, onError) {
  wx.showLoading({
    title: '正在连接...',
  });

  wx.request({
    url: `${config.serverUrl}/api/health`,
    method: 'GET',
    timeout: 10000,
    success: (res) => {
      wx.hideLoading();

      if (res.statusCode === 200) {
        if (onSuccess) onSuccess('connected');
      } else {
        if (onError) onError('error', '无法连接到AutoGLM服务器，请检查服务器地址和状态');
      }
    },
    fail: (err) => {
      wx.hideLoading();
      console.error('测试连接失败:', err);
      if (onError) {
        onError('error', err.errMsg || '无法连接到AutoGLM服务器');
      }
    },
  });
}

/**
 * GLM视频生成函数
 * @param {string} prompt - 提示词
 * @param {object} apiConfig - API配置 {endpoint, apiKey}
 * @returns {Promise<{videoUrl: string, coverUrl: string}>} 视频生成结果
 */
async function generateVideoGLM(prompt, apiConfig) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiConfig.endpoint.replace('/chat/completions', '/video/generations'),
      method: "POST",
      header: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiConfig.apiKey}`,
      },
      data: {
        model: "cogvideox-3-flash",
        prompt: prompt,
        max_frames: 100,
        fps: 24,
      },
      timeout: 150000,
      success: (res) => {
        console.log("GLM视频API响应:", {
          statusCode: res.statusCode,
          hasData: !!res.data,
        });

        if (res.statusCode === 200 && res.data && res.data.video_url) {
          resolve({
            videoUrl: res.data.video_url,
            coverUrl: res.data.cover_url || "",
          });
        } else {
          reject(new Error(res.data?.error?.message || "GLM视频生成失败"));
        }
      },
      fail: (err) => {
        console.error("GLM视频API调用失败:", err);
        reject(new Error(`GLM视频API调用失败: ${err.errMsg}`));
      },
    });
  });
}

/**
 * AutoGLM工具类
 * 提供完整的AutoGLM功能封装
 */
class AutoGLMUtils {
  /**
   * 构造函数
   * @param {object} pageContext - 页面上下文对象
   */
  constructor(pageContext) {
    this.page = pageContext;
  }

  /**
   * 获取平台名称
   * @param {string} platformKey - 平台key
   * @returns {string} 平台名称
   */
  getPlatformName(platformKey) {
    return getPlatformName(platformKey);
  }

  /**
   * 获取状态文本
   * @param {string} status - 状态
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    return getStatusText(status);
  }

  /**
   * 调用 AutoGLM 发布API
   * @param {string} platform - 平台
   * @param {string} title - 标题
   * @param {string} description - 描述
   * @param {Array} tags - 标签列表
   * @returns {Promise<{success: boolean, data: object}>} 发布结果
   */
  callAutoGLMPublish(platform, title, description, tags) {
    const config = this.page.data.autoglmConfig;
    return callAutoGLMPublish(platform, title, description, tags, config);
  }

  /**
   * 检查AutoGLM服务器状态
   * @returns {Promise<void>}
   */
  checkAutoGLMStatus() {
    const config = this.page.data.autoglmConfig;

    return new Promise((resolve, reject) => {
      checkAutoGLMStatus(
        config,
        (status) => {
          this.page.setData({
            'autoglmConfig.status': status
          });
          wx.showModal({
            title: '连接成功',
            content: '已成功连接到AutoGLM服务器',
            showCancel: false,
            success: () => resolve()
          });
        },
        (status, errorMsg) => {
          this.page.setData({
            'autoglmConfig.status': status
          });
          wx.showModal({
            title: '连接失败',
            content: errorMsg,
            showCancel: false,
            success: () => reject(new Error(errorMsg))
          });
        }
      );
    });
  }

  /**
   * 切换AutoGLM启用状态
   * @returns {void}
   */
  toggleAutoGLMEnabled() {
    const config = this.page.data.autoglmConfig;
    const newEnabled = !config.enabled;

    this.page.setData({
      "autoglmConfig.enabled": newEnabled,
    });

    wx.showToast({
      title: newEnabled ? "已启用AutoGLM" : "已禁用AutoGLM",
      icon: "success",
    });

    // 如果启用，检查连接状态
    if (newEnabled) {
      this.checkAutoGLMStatus();
    }
  }

  /**
   * GLM视频生成
   * @param {string} prompt - 提示词
   * @returns {Promise<{videoUrl: string, coverUrl: string}>}
   */
  async generateVideoGLM(prompt) {
    const apiConfig = this.page.data.apiConfig;
    return await generateVideoGLM(prompt, apiConfig);
  }
}

module.exports = {
  // 函数导出
  getPlatformName,
  getStatusText,
  callAutoGLMPublish,
  checkAutoGLMStatus,
  generateVideoGLM,

  // 类导出
  AutoGLMUtils,
};
