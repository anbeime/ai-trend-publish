// 工具函数：微信发布模块
// 已从云函数方案改造为 wx.request 直接调用服务器API方案

const aiService = require('./ai-service.js');

/**
 * 发布到微信公众号（通过服务器API）
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @returns {Promise<Object>} 发布结果
 */
async function publishViaServer(title, content) {
  try {
    const result = await aiService.publishToWechat({ title, content });
    return {
      success: result.success,
      mode: 'server-api',
      ...result,
    };
  } catch (error) {
    console.error('发布失败:', error);
    return {
      success: false,
      error: error.message || '发布失败',
      mode: 'failed',
    };
  }
}

/**
 * 发布到微信公众号（统一入口）
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @returns {Promise<Object>} 发布结果
 */
async function publishToWeChat(title, content) {
  console.log('发布到微信...', { title, contentLength: content?.length });
  return publishViaServer(title, content);
}

/**
 * 检查发布服务是否可用
 * @returns {Promise<Object>} 检查结果
 */
async function checkServiceAvailable() {
  try {
    let secrets = {};
    try { secrets = require('../config/secrets.js'); } catch(e) {}
    const healthUrl = (secrets.server?.publishApiUrl || secrets.server?.draftApiUrl || 'http://39.108.254.228:8002') + '/health';
    const result = await aiService.request({
      url: healthUrl,
      method: 'GET',
      timeout: 10000,
    });
    return {
      available: true,
      message: '发布服务可用',
      data: result,
    };
  } catch (error) {
    return {
      available: false,
      message: '发布服务不可用: ' + error.message,
    };
  }
}

module.exports = {
  publishToWeChat,
  publishViaServer,
  checkServiceAvailable,
};
