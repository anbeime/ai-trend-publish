// utils/agents-module.js - 首页智能体功能模块化
// 此文件已从云函数方案改造为 wx.request 直接调用方案

const aiService = require('./ai-service.js');

/**
 * 通用 API 调用方法（替代 wx.cloud.callFunction）
 * @param {string} name - 原云函数名称（仅用于日志）
 * @param {object} data - 请求参数
 * @returns {Promise<object>} - 返回结果
 */
async function callCloudFunction(name, data) {
  // 兼容旧代码调用，实际转发到 aiService
  if (name === 'agentAI') {
    return aiService.callAI(data.userMessage || '', {
      agentType: data.agentType || 'default',
      messages: data.conversationHistory || [],
    });
  }
  if (name === 'hotspot-collector' || name === 'hotspot-miyucaicai') {
    return aiService.fetchHotspots();
  }
  // 默认返回不支持
  return {
    success: false,
    error: `不支持的操作: ${name}`,
  };
}

/**
 * AI对话包装器
 * @param {string} userMessage - 用户消息
 * @param {string} agentType - 智能体类型
 * @param {array} context - 对话历史
 * @returns {Promise<object>} - AI回复
 */
async function callAI(userMessage, agentType, context = []) {
  console.log(`调用AI智能体: ${agentType}`);

  const result = await aiService.callAI(userMessage, {
    agentType: agentType,
    messages: context,
  });

  if (result && result.success && result.reply) {
    return {
      success: true,
      reply: result.reply,
      agentType,
      type: 'text',
      model: result.model || 'minimax',
    };
  }

  return {
    success: false,
    error: result.error || 'AI调用失败',
    agentType,
  };
}

/**
 * 从输入生成智能体内容
 * @param {object} options - 生成选项
 * @returns {Promise<object>} - 生成结果
 */
async function generateFromInput(options) {
  const { prompt, agentType = 'scriptAgent', pageContext = null } = options;

  if (!prompt || prompt.trim() === '') {
    return {
      success: false,
      error: '请输入创作内容',
    };
  }

  try {
    const res = await callAI(prompt, agentType, []);

    if (res && res.success) {
      if (pageContext) {
        const history = pageContext.data.messages || [];
        history.push({
          role: 'user',
          content: prompt,
        });
        history.push({
          role: 'assistant',
          content: res.reply,
          agentType: agentType,
          type: 'text',
        });
        pageContext.setData({ messages: history });
      }

      return {
        success: true,
        message: res.reply,
        agentType,
      };
    }

    return {
      success: false,
      error: res.error || '生成失败',
    };
  } catch (error) {
    console.error('生成失败:', error);
    return {
      success: false,
      error: error.message || '生成失败',
    };
  }
}

/**
 * 热点智能体 - 获取热点话题
 * @returns {Promise<object>} - 热点列表
 */
async function getHotspots() {
  try {
    const result = await aiService.fetchHotspots();

    if (result && result.success) {
      const hotspots = result.data || [];

      return {
        success: true,
        hotspots: hotspots.map((item) => ({
          name: item.title,
          reason: item.reason || '',
          score: item.hotness || 0,
          tag: item.tag || '热点',
          source: item.source || '未知',
        })),
      };
    }

    return {
      success: false,
      error: result?.error || '获取热点失败',
    };
  } catch (error) {
    console.error('获取热点失败:', error);
    return {
      success: false,
      error: error.message || '获取热点失败',
    };
  }
}

/**
 * 保存创作到本地存储（替代云数据库）
 * @param {object} creationData - 创作数据
 * @param {object} pageContext - 页面上下文
 * @returns {Promise<boolean>} - 保存结果
 */
async function saveCreation(creationData, pageContext = null) {
  try {
    const history = wx.getStorageSync('dream_records') || [];
    history.unshift({
      type: 'creation',
      content: creationData.content,
      agentType: creationData.agentType,
      createTime: new Date().toISOString(),
    });
    if (history.length > 100) history.pop();
    wx.setStorageSync('dream_records', history);
    return true;
  } catch (error) {
    console.error('保存创作失败:', error);
    return false;
  }
}

/**
 * 获取创作历史（从本地存储）
 * @returns {Promise<object>} - 历史记录
 */
async function getCreationHistory() {
  try {
    const records = wx.getStorageSync('dream_records') || [];
    return {
      success: true,
      records: records,
    };
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return {
      success: false,
      error: error.message || '获取历史失败',
    };
  }
}

/**
 * 检查用户额度（本地存储方案）
 * @returns {Promise<object>} - 额度信息
 */
async function checkUserCredits() {
  try {
    let credits = wx.getStorageSync('user_credits');

    if (!credits) {
      credits = {
        dailyQuota: 3,
        extraQuota: 0,
        coins: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        totalCreations: 0,
        level: 1,
        createTime: new Date().toISOString(),
      };
      wx.setStorageSync('user_credits', credits);
    }

    // 检查是否需要重置每日额度
    const today = new Date().toISOString().split('T')[0];
    if (credits.lastResetDate !== today) {
      credits.dailyQuota = 3;
      credits.lastResetDate = today;
      wx.setStorageSync('user_credits', credits);
    }

    return {
      success: true,
      dailyQuota: credits.dailyQuota,
      extraQuota: credits.extraQuota || 0,
      coins: credits.coins || 0,
      lastResetDate: credits.lastResetDate,
    };
  } catch (error) {
    console.error('检查用户额度失败:', error);
    return {
      success: false,
      dailyQuota: 3,
      extraQuota: 0,
      coins: 0,
      error: error.message || '获取额度失败',
    };
  }
}

/**
 * 消耗用户额度（本地存储方案）
 * @param {number} count - 消耗数量
 * @param {object} pageContext - 页面上下文
 * @returns {Promise<boolean>} - 消耗结果
 */
async function consumeCredits(count, pageContext = null) {
  if (count <= 0) return false;

  try {
    let credits = wx.getStorageSync('user_credits');

    if (!credits) {
      credits = {
        dailyQuota: 3,
        extraQuota: 0,
        coins: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        totalCreations: 0,
      };
    }

    // 优先消耗每日免费额度
    if (credits.dailyQuota >= count) {
      credits.dailyQuota -= count;
      credits.totalCreations = (credits.totalCreations || 0) + count;
      wx.setStorageSync('user_credits', credits);
      return true;
    }

    // 消耗额外额度
    if ((credits.coins || 0) >= count * 10) {
      credits.coins -= count * 10;
      credits.extraQuota = (credits.extraQuota || 0) + count;
      credits.totalCreations = (credits.totalCreations || 0) + count;
      wx.setStorageSync('user_credits', credits);
      return true;
    }

    return false;
  } catch (error) {
    console.error('消耗额度失败:', error);
    return false;
  }
}

/**
 * 导出模块
 */
module.exports = {
  callCloudFunction,
  callAI,
  generateFromInput,
  getHotspots,
  saveCreation,
  getCreationHistory,
  checkUserCredits,
  consumeCredits,
};
