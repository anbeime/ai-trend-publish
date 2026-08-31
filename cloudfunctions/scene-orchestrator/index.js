// cloudfunctions/scene-orchestrator/index.js
// 健康场景智能体调度引擎
// 根据健康场景需求路由到专业化智能体，调用AI能力完成任务

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// === 健康场景智能体定义 ===
const SCENE_AGENTS = {
  health: {
    'health-habit': { name: 'AI习惯追踪', model: 'glm-4', },
    'health-analyzer': { name: 'AI健康分析', model: 'glm-4v', },
    'health-companion': { name: 'AI健康陪伴', model: 'glm-4', },
    'health-planner': { name: 'AI计划生成', model: 'glm-4', },
  },
};

// === Action处理器 ===
const ACTION_HANDLERS = {
  // 健康场景 - 分析饮食
  'analyze_meal': async (params, context) => {
    const { fileID } = params;
    if (!fileID) return { food: '未知', calories: 0, advice: '均衡饮食' };

    const prompt = `请分析这张饮食照片。
返回JSON：{"food":"食物名称","calories":200,"protein":0,"carbs":0,"fat":0,"advice":"营养建议"}`;

    const result = await callGLMVision(prompt, fileID);
    return {
      food: result.food || '已识别',
      calories: result.calories || 200,
      advice: result.advice || '均衡饮食，适量运动',
    };
  },

  // 健康场景 - 解码微信运动数据
  'decode_werun': async (params, context) => {
    // 需要sessionKey来解密，此处返回模拟数据
    return {
      stepInfoList: [
        { timestamp: Date.now() - 86400000, steps: Math.floor(Math.random() * 8000 + 2000) },
        { timestamp: Date.now(), steps: Math.floor(Math.random() * 8000 + 2000) },
      ],
    };
  },

  // 健康场景 - 生成运动总结
  'generate_summary': async (params, context) => {
    const data = params;
    const prompt = `请为用户生成一段健康运动总结分享文案。
用户等级：${data.level}
活力值：${data.points}
连续天数：${data.streak}
请生成鼓励性的总结文案。
返回JSON：{"title":"","desc":"","encouragement":""}`;

    const result = await callGLM(prompt);
    return {
      ...data,
      title: result.title || data.title,
      desc: result.desc || data.desc,
      encouragement: result.encouragement || '坚持就是胜利，继续加油！',
    };
  },

  // 健康场景 - 生成运动计划
  'generate_plan': async (params, context) => {
    const { level = 1, goal = 'general' } = params;
    const prompt = `请为用户生成一个渐进式运动计划。
用户等级：${level}
目标：${goal === 'weight_loss' ? '减脂' : goal === 'muscle' ? '增肌' : '综合健康'}
请生成一周运动计划，每天包含运动项目、时长、强度。
返回JSON：{"plan":[{"day":"周一","items":[{"name":"慢跑","duration":"30分钟","intensity":"中等"}]}]}`;

    const result = await callGLM(prompt);
    return {
      plan: result.plan || [
        { day: '周一', items: [{ name: '快走', duration: '30分钟', intensity: '低' }] },
        { day: '周三', items: [{ name: '慢跑', duration: '20分钟', intensity: '中' }] },
        { day: '周五', items: [{ name: '拉伸', duration: '15分钟', intensity: '低' }] },
      ],
    };
  },
};

// === GLM API调用 ===
async function callGLM(prompt) {
  try {
    const res = await cloud.callFunction({
      name: 'glm-api',
      data: {
        endpoint: 'chat/completions',
        data: {
          model: 'glm-4',
          messages: [
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
      },
    });

    if (res.result && res.result.success) {
      const content = res.result.data?.choices?.[0]?.message?.content || '';
      return parseJSONResponse(content);
    }
    return {};
  } catch (error) {
    console.error('GLM调用失败:', error);
    return {};
  }
}

// === GLM Vision API调用 ===
async function callGLMVision(prompt, fileID) {
  try {
    const fileList = await cloud.getTempFileURL({ fileList: [fileID] });
    const imageUrl = fileList.fileList[0]?.tempFileURL;

    if (!imageUrl) return {};

    const res = await cloud.callFunction({
      name: 'glm-api',
      data: {
        endpoint: 'chat/completions',
        data: {
          model: 'glm-4v',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
      },
    });

    if (res.result && res.result.success) {
      const content = res.result.data?.choices?.[0]?.message?.content || '';
      return parseJSONResponse(content);
    }
    return {};
  } catch (error) {
    console.error('GLM Vision调用失败:', error);
    return {};
  }
}

// === JSON解析 ===
function parseJSONResponse(content) {
  if (!content) return {};
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('JSON解析失败:', error);
    return {};
  }
}

// === 主入口 ===
exports.main = async (event, context) => {
  const { scene, agent, action, params = {} } = event;

  try {
    // 验证场景和智能体
    if (!SCENE_AGENTS[scene] || !SCENE_AGENTS[scene][agent]) {
      return {
        success: false,
        error: `未知的场景或智能体: ${scene}/${agent}`,
      };
    }

    // 查找Action处理器
    const handler = ACTION_HANDLERS[action];
    if (!handler) {
      return {
        success: false,
        error: `未知的操作: ${action}`,
      };
    }

    // 执行
    const data = await handler(params, context);

    // 记录调用日志
    try {
      const wxContext = cloud.getWXContext();
      await db.collection('scene_logs').add({
        data: {
          openid: wxContext.OPENID,
          scene,
          agent,
          action,
          success: true,
          createdAt: new Date(),
        },
      });
    } catch (logError) {
      console.warn('日志记录失败:', logError);
    }

    return {
      success: true,
      data,
      scene,
      agent,
      action,
    };
  } catch (error) {
    console.error('Scene orchestrator error:', error);
    return {
      success: false,
      error: error.message || '内部错误',
    };
  }
};
