// utils/agents-module.js - 首页智能体功能模块化
// 这个文件将agents.js的核心功能模块化，供首页直接调用

/**
 * 通用云函数调用方法
 * @param {string} name - 云函数名称
 * @param {object} data - 云函数参数
 * @returns {Promise<object>} - 云函数返回结果
 */
async function callCloudFunction(name, data) {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data,
    });
    return res.result;
  } catch (error) {
    console.error(`云函数 ${name} 调用失败:`, error);
    return {
      success: false,
      error: error.message || `云函数 ${name} 调用失败`,
    };
  }
}

/**
 * 智能体基础参数处理
 * @param {string} userMessage - 用户输入内容
 * @param {string} agentType - 智能体类型
 * @returns {object} - 处理后的参数
 */
function prepareAgentParams(userMessage, agentType, context = []) {
  return {
    userMessage: userMessage,
    agentType: agentType,
    conversationHistory: context,
    useZhipuAI: false,
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
  const params = prepareAgentParams(userMessage, agentType, context);
  console.log(`调用AI智能体: ${agentType}`);

  const res = await callCloudFunction("agentAI", params);

  if (res && res.success && res.reply) {
    return {
      success: true,
      reply: res.reply,
      agentType,
      type: "text",
      model: "hunyuan-lite",
    };
  }

  if (res && res.error) {
    console.error("AI调用失败:", res.error);
  }

  return {
    success: false,
    error: res.error || "AI调用失败",
    agentType,
  };
}

/**
 * 从输入生成智能体内容
 * @param {object} options - 生成选项
 * @returns {Promise<object>} - 生成结果
 */
async function generateFromInput(options) {
  const { prompt, agentType = "scriptAgent", pageContext = null } = options;

  if (!prompt || prompt.trim() === "") {
    return {
      success: false,
      error: "请输入创作内容",
    };
  }

  try {
    const res = await callAI(prompt, agentType, []);

    if (res && res.success) {
      // 保存对话历史
      if (pageContext) {
        const history = pageContext.data.messages || [];
        history.push({
          role: "user",
          content: prompt,
        });
        history.push({
          role: "assistant",
          content: res.reply,
          agentType: agentType,
          type: "text",
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
      error: res.error || "生成失败",
    };
  } catch (error) {
    console.error("生成失败:", error);
    return {
      success: false,
      error: error.message || "生成失败",
    };
  }
}

/**
 * 热点智能体 - 获取热点话题
 * @returns {Promise<object>} - 热点列表
 */
async function getHotspots() {
  try {
    const res = await callCloudFunction("hotspot-collector", {
      action: "list",
    });

    if (res && res.success) {
      const hotspots = res.data || [];

      return {
        success: true,
        hotspots: hotspots.map((item) => ({
          name: item.title,
          reason: item.reason || "",
          score: item.hotness || 0,
          tag: item.tag || "热点",
          source: item.source || "未知",
        })),
      };
    }

    return {
      success: false,
      error: res?.error || "获取热点失败",
    };
  } catch (error) {
    console.error("获取热点失败:", error);
    return {
      success: false,
      error: error.message || "获取热点失败",
    };
  }
}

/**
 * 保存创作到数据库
 * @param {object} creationData - 创作数据
 * @param {object} pageContext - 页面上下文
 * @returns {Promise<boolean>} - 保存结果
 */
async function saveCreation(creationData, pageContext = null) {
  if (!pageContext) {
    return false;
  }

  try {
    const db = wx.cloud.database();

    await db.collection("dream_records").add({
      data: {
        _openid: "{openid}",
        type: "creation",
        content: creationData.content,
        agentType: creationData.agentType,
        createTime: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("保存创作失败:", error);
    return false;
  }
}

/**
 * 获取创作历史
 * @returns {Promise<object>} - 历史记录
 */
async function getCreationHistory() {
  try {
    const db = wx.cloud.database();
    const res = await db
      .collection("dream_records")
      .where({
        _openid: "{openid}",
      })
      .orderBy("createTime", "desc")
      .limit(20)
      .get();

    return {
      success: true,
      records: res.data,
    };
  } catch (error) {
    console.error("获取历史记录失败:", error);
    return {
      success: false,
      error: error.message || "获取历史失败",
    };
  }
}

/**
 * 检查用户额度
 * @returns {Promise<object>} - 额度信息
 */
async function checkUserCredits() {
  try {
    const db = wx.cloud.database();
    const res = await db
      .collection("user_credits")
      .where({
        _openid: "{openid}",
      })
      .get();

    const credits = res.data;

    return {
      success: true,
      dailyQuota: credits?.dailyQuota || 3,
      extraQuota: credits?.extraQuota || 0,
      coins: credits?.coins || 0,
      lastResetDate: credits?.lastResetDate || "",
    };
  } catch (error) {
    console.error("检查用户额度失败:", error);
    return {
      success: false,
      dailyQuota: 3,
      extraQuota: 0,
      coins: 0,
      error: error.message || "获取额度失败",
    };
  }
}

/**
 * 消耗用户额度
 * @param {number} count - 消耗数量
 * @param {object} pageContext - 页面上下文
 * @returns {Promise<boolean>} - 消耗结果
 */
async function consumeCredits(count, pageContext = null) {
  if (!pageContext) {
    return false;
  }

  if (count <= 0) {
    return false;
  }

  try {
    const db = wx.cloud.database();

    const res = await db
      .collection("user_credits")
      .where({
        _openid: "{openid}",
      })
      .get();

    const credits = res.data || {
      dailyQuota: 3,
      extraQuota: 0,
      coins: 0,
    };

    // 优先消耗每日免费额度
    if (credits.dailyQuota >= count) {
      const newDailyQuota = credits.dailyQuota - count;

      await db
        .collection("user_credits")
        .where({
          _openid: "{openid}",
        })
        .update({
          data: {
            dailyQuota: newDailyQuota,
          },
        });

      return true;
    }

    // 消耗额外额度
    else if (credits.coins >= count * 10) {
      const newCoins = credits.coins - count * 10;
      const newExtraQuota = credits.extraQuota + count;

      await db
        .collection("user_credits")
        .where({
          _openid: "{openid}",
        })
        .update({
          data: {
            coins: newCoins,
            extraQuota: newExtraQuota,
          },
        });

      return true;
    }

    // 额度不足
    return false;
  } catch (error) {
    console.error("消耗额度失败:", error);
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
  // 导出这些核心函数供首页直接调用
};
