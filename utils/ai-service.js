/**
 * 统一 AI 服务模块
 * 
 * 优先级：FreeSwitch API 代理 > MiniMax 直连 > 智谱 GLM 直连 > 降级/错误
 * 
 * FreeSwitch 部署在 RackNerd VPS（美国 San Jose），
 * 通过国内服务器 Nginx 反向代理访问。
 * 
 * 当 FreeSwitch 不可用时，自动降级到 MiniMax/智谱直连。
 */

let secrets = null;

/**
 * 安全加载 secrets 配置
 */
function loadSecrets() {
  if (secrets) return secrets;
  try {
    secrets = require('../config/secrets.js');
  } catch (e) {
    console.error('加载 secrets 配置失败:', e);
    secrets = {};
  }
  return secrets;
}

/**
 * 获取 FreeSwitch 配置
 */
function getFreeSwitchConfig() {
  const s = loadSecrets();
  return {
    gatewayUrl: s.freeswitch?.gatewayUrl || '',
    primaryModel: s.freeswitch?.primaryModel || 'minimax',
    fallbackModel: s.freeswitch?.fallbackModel || 'glm-4.7-flash',
    freeModel: s.freeswitch?.freeModel || 'google-gemini',
    userToken: s.freeswitch?.userToken || '',
  };
}

/**
 * 通过 FreeSwitch API 代理调用 LLM
 * 
 * FreeSwitch 兼容 OpenAI API 格式：
 *   POST {gatewayUrl}/chat/completions
 *   Body: { model, messages, temperature, max_tokens }
 *   Header: Authorization: Bearer {userToken} (Enterprise 模式)
 * 
 * @param {string} prompt - 用户提示词
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} { success, reply, model, raw }
 */
async function callFreeSwitch(prompt, options = {}) {
  const config = getFreeSwitchConfig();

  if (!config.gatewayUrl) {
    throw new Error('FreeSwitch gatewayUrl 未配置');
  }

  console.log('[AI] 调用 FreeSwitch API 代理...', { model: config.primaryModel });

  // 构建消息列表
  let messages = [];
  if (options.system) {
    messages.push({ role: 'system', content: options.system });
  }
  if (options.messages && options.messages.length > 0) {
    messages = messages.concat(options.messages);
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  // 构建请求体（OpenAI 兼容格式）
  const requestData = {
    model: options.model || config.primaryModel,
    messages: messages,
    temperature: options.temperature ?? 0.7,
    top_p: options.top_p ?? 0.9,
    max_tokens: options.max_tokens ?? 8192,
    stream: false,
  };

  // Enterprise 模式需要用户 Token
  const header = {
    'Content-Type': 'application/json',
  };
  if (config.userToken) {
    header['Authorization'] = `Bearer ${config.userToken}`;
  }

  try {
    const data = await request({
      url: config.gatewayUrl + '/chat/completions',
      header,
      data: requestData,
      timeout: 120000,
    });

    console.log('[AI] FreeSwitch 响应状态: OK');

    // OpenAI 兼容格式
    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message?.content || data.choices[0].text || '';
      return {
        success: true,
        reply: reply,
        model: data.model || 'freeswitch',
        raw: data,
      };
    }

    throw new Error('FreeSwitch 返回格式异常: 无 choices 字段');
  } catch (error) {
    console.error('[AI] FreeSwitch 调用失败:', error.message);
    throw error;
  }
}

/**
 * 获取 MiniMax 配置
 */
function getMinimaxConfig() {
  const s = loadSecrets();
  return {
    apiKey: s.minimax?.apiKey || '',
    groupId: s.minimax?.groupId || '',
    endpoint: s.minimax?.endpoint || 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    model: s.minimax?.model || 'MiniMax-Text-01',
    temperature: s.minimax?.temperature ?? 1,
    top_p: s.minimax?.top_p ?? 0.95,
    max_tokens: s.minimax?.max_tokens ?? 8192,
  };
}

/**
 * 获取智谱 GLM 配置
 */
function getGLMConfig() {
  const s = loadSecrets();
  return {
    apiKey: s.zhipu?.apiKey || '',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4.7-flash',
  };
}

/**
 * 获取 Agnes AI 配置
 */
function getAgnesConfig() {
  const s = loadSecrets();
  return {
    apiKey: s.agnes?.apiKey || '',
    baseUrl: s.agnes?.baseUrl || 'https://apihub.agnes-ai.com/v1',
    imageModel: s.agnes?.imageModel || 'agnes-image-2.1-flash',
    llmModel: s.agnes?.llmModel || 'agnes-2.0-flash',
  };
}

/**
 * 通用 wx.request 封装
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'POST',
      timeout: options.timeout || 120000,
      header: options.header || { 'Content-Type': 'application/json' },
      data: options.data || {},
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const err = new Error(`HTTP ${res.statusCode}`);
          err.statusCode = res.statusCode;
          err.data = res.data;
          reject(err);
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });
  });
}

/**
 * 调用 MiniMax TokenPlanPlus API
 * 
 * 鉴权方式：Bearer Token + body 中带 GroupId
 * 
 * @param {string} prompt - 用户提示词
 * @param {Object} options - 可选参数 { messages, temperature, max_tokens, system }
 * @returns {Promise<Object>} { success, reply, model, raw }
 */
async function callMiniMax(prompt, options = {}) {
  const config = getMinimaxConfig();
  
  if (!config.apiKey) {
    throw new Error('MiniMax apiKey 未配置');
  }

  console.log('[AI] 调用 MiniMax TokenPlanPlus...', { model: config.model, groupId: config.groupId });

  // 构建消息列表
  let messages = [];
  if (options.system) {
    messages.push({ role: 'system', content: options.system });
  }
  if (options.messages && options.messages.length > 0) {
    messages = messages.concat(options.messages);
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  // 构建请求体，body 中带 GroupId
  const requestData = {
    model: options.model || config.model,
    messages: messages,
    temperature: options.temperature ?? config.temperature,
    top_p: options.top_p ?? config.top_p,
    max_tokens: options.max_tokens ?? config.max_tokens,
    stream: false,
  };

  // MiniMax TokenPlanPlus 需要在 body 中带 GroupId
  if (config.groupId) {
    requestData.group_id = config.groupId;
  }

  const header = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  try {
    const data = await request({
      url: config.endpoint,
      header,
      data: requestData,
      timeout: 120000,
    });

    console.log('[AI] MiniMax 响应状态: OK');

    // MiniMax chatcompletion_v2 响应格式兼容 OpenAI 格式
    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content;
      return {
        success: true,
        reply: reply,
        model: 'minimax-text-01',
        raw: data,
      };
    }

    // 兼容 MiniMax 原生格式
    if (data.choices && data.choices[0] && data.choices[0].text) {
      const reply = data.choices[0].text;
      return {
        success: true,
        reply: reply,
        model: 'minimax-text-01',
        raw: data,
      };
    }

    throw new Error('MiniMax 返回格式异常: 无 choices 字段');
  } catch (error) {
    console.error('[AI] MiniMax 调用失败:', error.message);
    throw error;
  }
}

/**
 * 调用智谱 GLM API（作为降级方案）
 * 
 * @param {string} prompt - 用户提示词
 * @param {Object} options - 可选参数 { messages, temperature, max_tokens }
 * @returns {Promise<Object>} { success, reply, model, raw }
 */
async function callGLM(prompt, options = {}) {
  const config = getGLMConfig();

  if (!config.apiKey) {
    throw new Error('智谱 apiKey 未配置');
  }

  console.log('[AI] 调用智谱 GLM...', { model: config.model });

  let messages = [];
  if (options.system) {
    messages.push({ role: 'system', content: options.system });
  }
  if (options.messages && options.messages.length > 0) {
    messages = messages.concat(options.messages);
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const requestData = {
    model: options.model || config.model,
    messages: messages,
    temperature: options.temperature ?? 0.7,
    top_p: options.top_p ?? 0.9,
    max_tokens: options.max_tokens ?? 2000,
  };

  const header = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  try {
    const data = await request({
      url: config.endpoint,
      header,
      data: requestData,
      timeout: 120000,
    });

    console.log('[AI] GLM 响应状态: OK');

    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content;
      return {
        success: true,
        reply: reply,
        model: 'glm-4.7-flash',
        raw: data,
      };
    }

    throw new Error('GLM 返回格式异常: 无 choices 字段');
  } catch (error) {
    console.error('[AI] GLM 调用失败:', error.message);
    throw error;
  }
}

/**
 * 统一 AI 调用入口
 * 
 * 优先使用 MiniMax TokenPlanPlus，失败后降级到智谱 GLM
 * 
 * @param {string} prompt - 用户提示词
 * @param {Object} options - 可选参数
 * @param {string} options.agentType - 智能体类型（用于日志）
 * @param {Array} options.messages - 消息列表（可选，优先于 prompt）
 * @param {string} options.system - 系统提示词
 * @param {number} options.temperature - 温度参数
 * @param {number} options.max_tokens - 最大 token 数
 * @returns {Promise<Object>} { success, reply, model, agentType }
 */
async function callAI(prompt, options = {}) {
  const { agentType = 'default', ...apiOptions } = options;
  console.log(`[AI] callAI 开始, agentType: ${agentType}`);

  // 策略1: FreeSwitch API 代理（最高优先级）
  // FreeSwitch 聚合了 18+ 免费 LLM 提供商 + MiniMax + 智谱
  // 通过 RackNerd VPS → 国内服务器反向代理访问
  try {
    const result = await callFreeSwitch(prompt, apiOptions);
    if (result.success && result.reply) {
      console.log('[AI] FreeSwitch 成功，返回内容长度:', result.reply.length);
      return {
        success: true,
        reply: result.reply,
        agentType,
        type: 'text',
        model: result.model,
      };
    }
  } catch (freeswitchError) {
    console.warn('[AI] FreeSwitch 失败，降级到 MiniMax 直连:', freeswitchError.message);
  }

  // 策略2: MiniMax TokenPlanPlus 直连（降级）
  try {
    const result = await callMiniMax(prompt, apiOptions);
    if (result.success && result.reply) {
      console.log('[AI] MiniMax 成功，返回内容长度:', result.reply.length);
      return {
        success: true,
        reply: result.reply,
        agentType,
        type: 'text',
        model: result.model,
      };
    }
  } catch (minimaxError) {
    console.warn('[AI] MiniMax 失败，降级到 GLM:', minimaxError.message);
  }

  // 策略3: 智谱 GLM 直连（最终降级）
  try {
    const result = await callGLM(prompt, apiOptions);
    if (result.success && result.reply) {
      console.log('[AI] GLM 成功，返回内容长度:', result.reply.length);
      return {
        success: true,
        reply: result.reply,
        agentType,
        type: 'text',
        model: result.model,
      };
    }
  } catch (glmError) {
    console.error('[AI] GLM 也失败:', glmError.message);
  }

  // 所有模型都失败
  return {
    success: false,
    error: '所有 AI 模型均不可用',
    agentType,
  };
}

/**
 * 调用 MiniMax 并尝试解析 JSON 格式的返回内容
 * 
 * @param {string} prompt - 提示词
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} 解析后的 JSON 对象或文本
 */
async function callAIForJSON(prompt, options = {}) {
  const result = await callAI(prompt, options);
  
  if (!result.success) {
    return result;
  }

  const rawContent = result.reply;
  console.log('[AI] 原始返回内容（前500字）:', rawContent?.substring(0, 500));

  // 尝试解析 JSON
  try {
    let jsonStr = rawContent;
    
    // 匹配 ```json ... ``` 或 ``` ... ``` 格式
    const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonStr = codeBlockMatch[1].trim();
      console.log('[AI] 从代码块中提取JSON:', jsonStr?.substring(0, 200));
    }
    
    const parsedContent = JSON.parse(jsonStr);
    console.log('[AI] JSON解析成功:', Object.keys(parsedContent));
    
    return {
      success: true,
      content: parsedContent,
      model: result.model,
      agentType: result.agentType,
    };
  } catch (parseError) {
    console.warn('[AI] JSON解析失败，尝试修复:', parseError.message);
    
    // 尝试修复常见的 JSON 格式问题
    try {
      let fixedContent = rawContent;
      fixedContent = fixedContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      const jsonStart = fixedContent.indexOf('{');
      const jsonEnd = fixedContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        fixedContent = fixedContent.substring(jsonStart, jsonEnd + 1);
      }
      
      const parsedContent = JSON.parse(fixedContent);
      console.log('[AI] 修复后 JSON 解析成功:', Object.keys(parsedContent));
      
      return {
        success: true,
        content: parsedContent,
        model: result.model,
        agentType: result.agentType,
      };
    } catch (secondError) {
      console.warn('[AI] 二次解析也失败，返回原始文本');
      
      // 尝试提取 title 和 content
      let extractedTitle = 'AI生成内容';
      let extractedBody = rawContent;
      
      const titleMatch = rawContent.match(/"title"\s*:\s*"([^"]+)"/);
      if (titleMatch) extractedTitle = titleMatch[1];
      
      const contentMatch = rawContent.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (contentMatch) {
        extractedBody = contentMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      
      return {
        success: true,
        content: {
          title: extractedTitle,
          content: extractedBody,
          body: extractedBody,
        },
        model: result.model,
        agentType: result.agentType,
        parseWarning: true,
      };
    }
  }
}

/**
 * 获取热点数据（通过自有服务器代理，完整多源采集版）
 *
 * 服务器端 draft-api.py 提供：
 * - 15个平台分批并发采集（微博/知乎/百度/抖音/B站等）
 * - 智能分类 + 关键词提取
 * - 时效性评分 + 去重 + 排序
 * - 5分钟内存缓存
 *
 * @param {Object} options - 可选参数
 * @param {boolean} options.scoring - 是否启用10分制评分
 * @param {number} options.limit - 返回数量限制
 * @returns {Promise<Object>} { success, data: [...], sourceStats, freshnessStats }
 */
async function fetchHotspots(options = {}) {
  const s = loadSecrets();
  const baseUrl = s.server?.draftApiUrl || 'http://39.108.254.228:8002';
  const scoring = options.scoring ? '&scoring=1' : '';
  const limit = options.limit || 100;
  const url = `${baseUrl}/api/hot/all?limit=${limit}${scoring}`;

  console.log('[AI] 获取热点数据（多源采集）:', url);

  try {
    const data = await request({
      url: url,
      method: 'GET',
      timeout: 120000,
      header: { 'Content-Type': 'application/json' },
    });

    console.log('[AI] 热点API返回数据类型:', typeof data);

    let hotspots = [];
    if (Array.isArray(data)) {
      hotspots = data;
    } else if (data && Array.isArray(data.data)) {
      hotspots = data.data;
    }

    console.log('[AI] 获取到热点数:', hotspots.length);
    console.log('[AI] 来源统计:', data.sourceStats || {});
    console.log('[AI] 时效性分布:', data.freshnessStats || {});

    if (hotspots.length === 0) {
      return {
        success: false,
        error: '热点数据源返回空数据',
        data: [],
      };
    }

    // 数据已由服务器端增强（智能分类、关键词、时效性评分等）
    // 直接返回，无需客户端再处理
    return {
      success: true,
      data: hotspots,
      source: '自有服务器多源采集',
      timestamp: data.timestamp || new Date().toISOString(),
      fromCache: data.fromCache || false,
      sourceStats: data.sourceStats || {},
      sourceFetchStatus: data.sourceFetchStatus || {},
      freshnessStats: data.freshnessStats || {},
    };
  } catch (error) {
    console.error('[AI] 热点采集失败:', error.message);
    return {
      success: false,
      error: '热点数据源不可用: ' + error.message,
      data: [],
    };
  }
}

/**
 * 热点10分制评分（通过服务器端接口）
 *
 * 移植自云函数 topic-scorer
 * 评分维度：时效性(2) + 热度(3) + 争议性(2) + 价值(2) + 可操作性(1)
 *
 * @param {Array} items - 热点列表
 * @param {Object} options - { minScore, sortBy, targetPlatform, maxResults, showAll, categoryFilter }
 * @returns {Promise<Object>} { success, recommended, statistics, scoringGuide }
 */
async function scoreTopics(items, options = {}) {
  const s = loadSecrets();
  const baseUrl = s.server?.draftApiUrl || 'http://39.108.254.228:8002';
  const url = `${baseUrl}/api/hot/score`;

  console.log('[AI] 热点评分:', items.length, '条');

  try {
    const data = await request({
      url: url,
      method: 'POST',
      timeout: 120000,
      header: { 'Content-Type': 'application/json' },
      data: {
        items: items,
        minScore: options.minScore || 7,
        sortBy: options.sortBy || 'score',
        targetPlatform: options.targetPlatform || 'general',
        maxResults: options.maxResults || 0,
        showAll: options.showAll || false,
        categoryFilter: options.categoryFilter || null,
      },
    });
    return data;
  } catch (error) {
    console.error('[AI] 热点评分失败:', error.message);
    return { success: false, error: error.message, recommended: [] };
  }
}

/**
 * 热点深度分析（通过服务器端接口）
 *
 * 移植自云函数 hotspot-analyzer
 * 现象层分析：数据统计 + 关键词提取 + 趋势分布
 *
 * @param {Array} hotspots - 热点列表
 * @param {string} category - 分类过滤
 * @returns {Promise<Object>} { success, report }
 */
async function analyzeHotspots(hotspots, category = '全部') {
  const s = loadSecrets();
  const baseUrl = s.server?.draftApiUrl || 'http://39.108.254.228:8002';
  const url = `${baseUrl}/api/hot/analyze`;

  console.log('[AI] 热点分析:', hotspots.length, '条, 分类:', category);

  try {
    const data = await request({
      url: url,
      method: 'POST',
      timeout: 120000,
      header: { 'Content-Type': 'application/json' },
      data: { hotspots: hotspots, category: category },
    });
    return data;
  } catch (error) {
    console.error('[AI] 热点分析失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 发布到微信公众号草稿箱（替代 wechat-publish-api 云函数）
 * 
 * 通过自建服务器 draft-api.py 转发
 * 
 * @param {Object} articleData - { title, content, cover }
 * @returns {Promise<Object>} { success, media_id }
 */
async function publishToWechat(articleData) {
  const s = loadSecrets();
  const publishUrl = (s.server?.publishApiUrl || 'http://39.108.254.228:8002') + '/publish-draft';
  
  console.log('[AI] 发布到微信草稿箱:', articleData.title);
  
  try {
    const data = await request({
      url: publishUrl,
      method: 'POST',
      timeout: 120000,
      header: { 'Content-Type': 'application/json' },
      data: articleData,
    });
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('[AI] 发布失败:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 社交媒体发布（替代 social-media-proxy 云函数）
 * 
 * @param {string} platform - 平台名称
 * @param {Object} publishData - 发布数据
 * @returns {Promise<Object>}
 */
async function publishToSocialMedia(platform, publishData) {
  const s = loadSecrets();
  const socialUrl = s.server?.socialApiUrl || 'http://39.108.254.228:8002';
  
  console.log('[AI] 发布到社交媒体:', platform);
  
  try {
    const data = await request({
      url: socialUrl + '/api/upload/' + platform,
      method: 'POST',
      timeout: 60000,
      header: { 'Content-Type': 'application/json' },
      data: {
        platform: platform,
        ...publishData,
      },
    });
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('[AI] 社交媒体发布失败:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * AI 生成图片（替代 generateImage 云函数）
 * 
 * 优先使用 Agnes AI（OpenAI 兼容接口），降级使用智谱 CogView
 * 
 * @param {string} prompt - 图片提示词
 * @param {Object} options - { size }
 * @returns {Promise<Object>} { success, imageUrl }
 */
async function generateImage(prompt, options = {}) {
  console.log('[AI] 生成图片:', prompt.substring(0, 100));

  // 智谱 CogView-3 只支持以下尺寸，需要把任意尺寸映射过去
  const COGVIEW_SIZES = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864'];
  function mapSize(size) {
    if (!size || typeof size !== 'string') return '1024x1024';
    if (COGVIEW_SIZES.includes(size)) return size;
    const [w, h] = size.split('x').map(Number);
    if (!w || !h) return '1024x1024';
    const ratio = w / h;
    if (ratio > 1.3) return '1344x768';   // 横图
    if (ratio > 1.1) return '1152x864';   // 偏横
    if (ratio < 0.7) return '768x1344';   // 竖图
    if (ratio < 0.9) return '864x1152';   // 偏竖
    return '1024x1024';                    // 正方形
  }
  const mappedSize = mapSize(options.size);
  if (mappedSize !== (options.size || '')) {
    console.log('[AI] 尺寸映射:', options.size, '->', mappedSize);
  }

  // 优先使用 Agnes AI
  try {
    const agnes = getAgnesConfig();
    if (agnes.apiKey) {
      console.log('[AI] 使用 Agnes 图片生成:', agnes.imageModel);
      const data = await request({
        url: `${agnes.baseUrl}/images/generations`,
        method: 'POST',
        timeout: 60000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agnes.apiKey}`,
        },
        data: {
          model: agnes.imageModel,
          prompt: prompt,
          size: mappedSize,
        },
      });

      if (data.data && data.data.length > 0) {
        const imgUrl = data.data[0].url;
        console.log('[AI] Agnes 图片生成成功:', imgUrl);
        return {
          success: true,
          imageUrl: imgUrl,
          revised_prompt: data.data[0].revised_prompt || prompt,
        };
      }
      throw new Error('Agnes 图片生成返回格式异常');
    }
  } catch (agnesError) {
    console.warn('[AI] Agnes 图片生成失败:', agnesError.message, '，降级到智谱');
  }

  // 降级到智谱 CogView
  try {
    const config = getGLMConfig();
    const data = await request({
      url: 'https://open.bigmodel.cn/api/paas/v4/images/generations',
      method: 'POST',
      timeout: 60000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      data: {
        model: 'cogview-3-flash',
        prompt: prompt,
        size: mappedSize,
      },
    });
    
    if (data.data && data.data.length > 0) {
      const imgUrl = data.data[0].url;
      console.log('[AI] 智谱图片生成成功:', imgUrl);
      return {
        success: true,
        imageUrl: imgUrl,
        revised_prompt: data.data[0].revised_prompt || prompt,
      };
    }
    
    throw new Error('图片生成返回格式异常');
  } catch (error) {
    console.error('[AI] 图片生成失败:', error.message);
    return {
      success: false,
      error: error.message,
      imageUrl: '',
    };
  }
}

module.exports = {
  callAI,
  callAIForJSON,
  callFreeSwitch,
  callMiniMax,
  callGLM,
  fetchHotspots,
  scoreTopics,
  analyzeHotspots,
  publishToWechat,
  publishToSocialMedia,
  generateImage,
  getFreeSwitchConfig,
  getMinimaxConfig,
  getGLMConfig,
  request,
};
