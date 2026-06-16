// 云函数：coze-skill
// 调用扣子（Coze）平台的Bot技能
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 扣子API配置
const COZE_API_URL = 'https://api.coze.cn/open_api/v2/chat';
const COZE_TOKEN = process.env.COZE_TOKEN || ''; // 从环境变量读取

// Bot ID配置（可以在这里配置多个Bot）
const BOT_IDS = {
  'script-optimizer': process.env.BOT_SCRIPT_OPTIMIZER || '',
  'prompt-generator': process.env.BOT_PROMPT_GENERATOR || '',
  'copywriting': process.env.BOT_COPYWRITING || '',
  'quality-checker': process.env.BOT_QUALITY_CHECKER || '',
  'video-enhancer': process.env.BOT_VIDEO_ENHANCER || '',
  'trend-analyzer': process.env.BOT_TREND_ANALYZER || ''
};

/**
 * 调用扣子Bot
 * @param {string} botId - Bot ID
 * @param {string} query - 用户输入
 * @param {string} userId - 用户ID（用于会话管理）
 * @param {object} options - 额外选项
 */
async function callCozeBot(botId, query, userId = 'default_user', options = {}) {
  try {
    console.log(`调用扣子Bot: ${botId}, 用户: ${userId}`);
    
    const requestData = {
      bot_id: botId,
      user: userId,
      query: query,
      stream: false,
      ...options
    };

    const response = await axios.post(COZE_API_URL, requestData, {
      headers: {
        'Authorization': `Bearer ${COZE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 60000 // 60秒超时
    });

    console.log('扣子API响应状态:', response.status);

    if (response.data) {
      // 提取Bot的回复
      const messages = response.data.messages || [];
      const botMessages = messages.filter(
        msg => msg.role === 'assistant' && msg.type === 'answer'
      );
      
      if (botMessages.length > 0) {
        return {
          success: true,
          data: botMessages,
          content: botMessages.map(msg => msg.content).join('\n'),
          rawResponse: response.data
        };
      } else {
        console.warn('未找到Bot回复消息');
        return {
          success: false,
          error: '未获取到Bot回复',
          rawResponse: response.data
        };
      }
    }

    throw new Error('API响应数据为空');
  } catch (error) {
    console.error('调用扣子Bot失败:', error.message);
    
    if (error.response) {
      console.error('错误响应:', error.response.status, error.response.data);
      return {
        success: false,
        error: `API错误: ${error.response.status}`,
        details: error.response.data
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { 
    skill,      // 技能名称
    botId,      // Bot ID（可选，如果不提供则从BOT_IDS中查找）
    input,      // 用户输入
    userId,     // 用户ID（可选）
    options     // 额外选项（可选）
  } = event;

  try {
    console.log(`=== 扣子技能调用开始 ===`);
    console.log(`技能: ${skill}`);
    console.log(`输入长度: ${input?.length || 0}`);

    // 验证必要参数
    if (!input) {
      throw new Error('缺少必要参数: input');
    }

    // 确定Bot ID
    let targetBotId = botId;
    if (!targetBotId && skill) {
      targetBotId = BOT_IDS[skill];
    }

    if (!targetBotId) {
      throw new Error(`未找到技能对应的Bot ID: ${skill}`);
    }

    // 验证Token
    if (!COZE_TOKEN) {
      throw new Error('未配置COZE_TOKEN环境变量');
    }

    // 调用扣子Bot
    const result = await callCozeBot(
      targetBotId,
      input,
      userId || context.OPENID || 'default_user',
      options || {}
    );

    if (result.success) {
      console.log('扣子技能调用成功');
      return {
        success: true,
        skill: skill,
        output: result.content,
        messages: result.data,
        timestamp: new Date().toISOString()
      };
    } else {
      console.error('扣子技能调用失败:', result.error);
      return {
        success: false,
        skill: skill,
        error: result.error,
        details: result.details,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    console.log(`=== 扣子技能调用结束 ===`);
  }
};
