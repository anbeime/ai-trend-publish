import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import axios from 'axios';

const app = new Hono();

// 中间件
app.use('*', logger());
app.use('*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 微信配置存储
let wechatConfig = {
  appid: '',
  secret: ''
};

// 智谱AI默认配置
const ZHIPU_API_CONFIG = {
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: process.env.ZHIPU_API_KEY || '4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn'
};

// 备用热点数据
const BACKUP_HOTSPOTS = [
  {
    id: "v2ex_backup_1",
    title: "AI Agent 技术发展趋势讨论",
    content: "AI Agent 相关技术讨论",
    source: "v2ex",
    category: "tech",
    tags: ["科技", "V2EX", "AI"],
    hotness: 85,
    trend: "hot",
    url: "https://v2ex.com/t/1031234",
    imageUrl: "",
    createTime: new Date(),
    updateTime: new Date(),
    recommendScore: 85,
  },
  {
    id: "weibo_backup_1",
    title: "AI视频生成工具快速迭代",
    content: "AI视频生成工具成为新热点",
    source: "weibo",
    category: "tech",
    tags: ["微博", "热搜", "AI", "视频"],
    hotness: 92,
    trend: "hot",
    url: "https://m.weibo.cn/search?q=AI视频",
    imageUrl: "",
    createTime: new Date(),
    updateTime: new Date(),
    recommendScore: 90,
  },
  {
    id: "zhihu_backup_1",
    title: "如何选择合适的 AI 模型进行内容创作",
    content: "AI 模型选择和应用场景讨论",
    source: "zhihu",
    category: "knowledge",
    tags: ["知乎", "热榜", "AI", "知识"],
    hotness: 95,
    trend: "hot",
    url: "https://www.zhihu.com/question/123456",
    imageUrl: "",
    createTime: new Date(),
    updateTime: new Date(),
    recommendScore: 92,
  },
];

// ============================================================
// 工具函数
// ============================================================

async function callZhipuAI(messages: any[], model = 'glm-4.6v-flash') {
  try {
    const result = await axios.post(
      ZHIPU_API_CONFIG.endpoint,
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        stream: false,
        thinking: { type: 'enabled' }
      },
      {
        headers: {
          'Authorization': 'Bearer ' + ZHIPU_API_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return result.data.choices?.[0]?.message?.content || '';
  } catch (error: any) {
    console.error('智谱AI调用失败:', error.message);
    throw new Error('AI调用失败: ' + error.message);
  }
}

// ============================================================
// 健康检查
// ============================================================

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TrendPublish API',
    version: '1.0.0'
  });
});

// ============================================================
// 热点采集 API
// ============================================================

app.get('/api/hotspots', async (c) => {
  try {
    const [v2exData, weiboData, zhihuData] = await Promise.allSettled([
      fetchV2exHotspots(),
      fetchWeiboHotspots(),
      fetchZhihuHotspots(),
    ]);

    const v2ex = v2exData.status === 'fulfilled' ? v2exData.value : [];
    const weibo = weiboData.status === 'fulfilled' ? weiboData.value : [];
    const zhihu = zhihuData.status === 'fulfilled' ? zhihuData.value : [];

    const allHotspots = [...v2ex, ...weibo, ...zhihu];
    const uniqueMap = new Map();
    allHotspots.forEach((hotspot) => {
      const key = `${hotspot.source.toLowerCase()}_${hotspot.title.toLowerCase()}`;
      if (!uniqueMap.has(key) || hotspot.hotness > uniqueMap.get(key).hotness) {
        uniqueMap.set(key, hotspot);
      }
    });

    const sorted = Array.from(uniqueMap.values()).sort((a, b) => b.hotness - a.hotness);

    return c.json({
      success: true,
      data: sorted,
      total: sorted.length,
      sources: { v2ex: v2ex.length, weibo: weibo.length, zhihu: zhihu.length }
    });
  } catch (error: any) {
    return c.json({ success: true, data: BACKUP_HOTSPOTS, total: BACKUP_HOTSPOTS.length, error: error.message });
  }
});

async function fetchV2exHotspots() {
  try {
    const response = await axios.get('https://www.v2ex.com/api/topics/hot.json', {
      timeout: 3000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return (response.data || []).map((topic: any) => ({
      id: `v2ex_${topic.id}`,
      title: topic.title || 'V2EX热点',
      content: '',
      source: 'v2ex',
      category: 'tech',
      tags: ['科技', 'V2EX'],
      hotness: topic.replies || 0,
      trend: topic.replies > 10 ? 'hot' : 'stable',
      url: topic.url || `https://v2ex.com/t/${topic.id}`,
      imageUrl: '',
      createTime: new Date((topic.created || Date.now() / 1000) * 1000),
      updateTime: new Date(),
      recommendScore: Math.min(Math.floor((topic.replies || 0) / 5), 100),
    }));
  } catch (error) {
    return [];
  }
}

async function fetchWeiboHotspots() {
  try {
    return BACKUP_HOTSPOTS.filter((h) => h.source === 'weibo');
  } catch (error) {
    return BACKUP_HOTSPOTS.filter((h) => h.source === 'weibo');
  }
}

async function fetchZhihuHotspots() {
  try {
    return BACKUP_HOTSPOTS.filter((h) => h.source === 'zhihu');
  } catch (error) {
    return BACKUP_HOTSPOTS.filter((h) => h.source === 'zhihu');
  }
}

// ============================================================
// 热点分析 API
// ============================================================

app.post('/api/hotspots/analyze', async (c) => {
  try {
    const { hotspots, category = '全部' } = await c.req.json();
    let filtered = hotspots || [];
    if (category !== '全部') {
      filtered = filtered.filter((h: any) => h.category === category);
    }

    if (filtered.length === 0) {
      return c.json({ success: false, error: '没有符合条件的热点数据' }, 400);
    }

    const phenomenon = analyzePhenomenon(filtered);
    const logic = await analyzeLogic(filtered, phenomenon);
    const demand = await analyzeDemand(filtered, logic);
    const prediction = await analyzePrediction(filtered, demand);
    const report = generateReport({ category, phenomenon, logic, demand, prediction });

    return c.json({ success: true, report, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

function analyzePhenomenon(hotspots: any[]) {
  const stats = {
    totalCount: hotspots.length,
    avgHeat: Math.round(hotspots.reduce((sum, h) => sum + (h.heat || h.hotness || 0), 0) / hotspots.length),
    topCategories: getTopCategories(hotspots),
    topSources: getTopSources(hotspots),
    trendDistribution: getTrendDistribution(hotspots),
  };
  const keywords = extractTopKeywords(hotspots);
  const trends = {
    risingCount: hotspots.filter((h) => h.trend === 'up').length,
    fallingCount: hotspots.filter((h) => h.trend === 'down').length,
    stableCount: hotspots.filter((h) => h.trend === 'stable' || !h.trend).length,
  };
  return { stats, keywords, trends };
}

function getTopCategories(hotspots: any[]) {
  const count: Record<string, number> = {};
  hotspots.forEach((h) => { count[h.category || '其他'] = (count[h.category || '其他'] || 0) + 1; });
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, count]) => ({ category, count }));
}

function getTopSources(hotspots: any[]) {
  const count: Record<string, number> = {};
  hotspots.forEach((h) => { count[h.source || '未知'] = (count[h.source || '未知'] || 0) + 1; });
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([source, count]) => ({ source, count }));
}

function getTrendDistribution(hotspots: any[]) {
  const distribution = { up: 0, down: 0, stable: 0 };
  hotspots.forEach((h) => { distribution[(h.trend || 'stable') as keyof typeof distribution]++; });
  return distribution;
}

function extractTopKeywords(hotspots: any[]) {
  const keywordCount: Record<string, number> = {};
  hotspots.forEach((h) => {
    const words = extractKeywordsFromText(h.title || h.name || '');
    words.forEach((word) => { keywordCount[word] = (keywordCount[word] || 0) + 1; });
    if (h.keywords && Array.isArray(h.keywords)) {
      h.keywords.forEach((kw: string) => { keywordCount[kw] = (keywordCount[kw] || 0) + 1; });
    }
  });
  return Object.entries(keywordCount).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([keyword, count]) => ({ keyword, count }));
}

function extractKeywordsFromText(text: string) {
  const cleaned = text.replace(/[，。！？、；：""''（）《》【】]/g, ' ');
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2);
  const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
  return words.filter((w) => !stopWords.includes(w));
}

async function analyzeLogic(hotspots: any[], phenomenon: any) {
  const topHotspots = hotspots.slice(0, 10);
  const prompt = `你是一位专业的热点分析专家。

请基于以下热点数据和现象分析，深入分析：
1. 这些热点为什么会火？背后的核心驱动因素是什么？
2. 用户行为背后的心理动机是什么？
3. 相关的社会文化背景是什么？

热点数据（前10条）：
${topHotspots.map((h, i) => `${i + 1}. ${h.title} (来源:${h.source}, 热度:${h.heat || h.hotness})`).join('\n')}

现象分析：
- 总数：${phenomenon.stats.totalCount}
- 平均热度：${phenomenon.stats.avgHeat}
- 热门分类：${phenomenon.stats.topCategories.map((c: any) => c.category).join('、')}
- 热门关键词：${phenomenon.keywords.slice(0, 10).map((k: any) => k.keyword).join('、')}
- 趋势分布：上升${phenomenon.trends.risingCount}个，下降${phenomenon.trends.fallingCount}个

请以JSON格式返回分析结果：
{
  "causeAnalysis": "原因分析（200字以内）",
  "userPsychology": "用户心理分析（200字以内）",
  "socialContext": "社会背景分析（200字以内）"
}`;

  try {
    const content = await callZhipuAI([{ role: 'user', content: prompt }]);
    try { return JSON.parse(content); } catch (e) { return parseFallback(content); }
  } catch (error) {
    return { causeAnalysis: '热点话题通常具有时效性强、话题性高、与用户生活相关等特点。', userPsychology: '用户对热点话题保持高度关注，反映出对新鲜事物的好奇心和参与讨论的意愿。', socialContext: '当前社会信息传播速度快，热点话题更新频繁，用户注意力分散。' };
  }
}

async function analyzeDemand(hotspots: any[], logicAnalysis: any) {
  const topHotspots = hotspots.slice(0, 10);
  const prompt = `你是一位专业的用户研究专家。

请基于以下热点数据，使用痛点金字塔模型分四层分析用户痛点：认知焦虑、信任危机、身份焦虑、价值迷茫。

热点数据：
${topHotspots.map((h, i) => `${i + 1}. ${h.title}`).join('\n')}

逻辑分析：
${JSON.stringify(logicAnalysis, null, 2)}

请以JSON格式返回：
{
  "userNeeds": ["需求1", "需求2", "需求3"],
  "painPoints": {
    "cognitive": ["认知焦虑1", "认知焦虑2"],
    "trust": ["信任危机1", "信任危机2"],
    "identity": ["身份焦虑1", "身份焦虑2"],
    "value": ["价值迷茫1", "价值迷茫2"]
  }
}`;

  try {
    const content = await callZhipuAI([{ role: 'user', content: prompt }]);
    try { return JSON.parse(content); } catch (e) { return getDefaultDemandAnalysis(); }
  } catch (error) {
    return getDefaultDemandAnalysis();
  }
}

async function analyzePrediction(hotspots: any[], demandAnalysis: any) {
  const topHotspots = hotspots.slice(0, 10);
  const prompt = `你是一位专业的趋势预测专家。

请基于以下热点数据和需求分析，预测未来趋势和内容机会（短期1-3天、中期1-2周、长期1个月+）。

热点数据：
${topHotspots.map((h, i) => `${i + 1}. ${h.title} (趋势:${h.trend || 'stable'})`).join('\n')}

用户需求：${demandAnalysis.userNeeds.join('、')}

请以JSON格式返回：
{
  "shortTerm": { "trends": ["趋势1", "趋势2"], "opportunities": ["机会1", "机会2"] },
  "midTerm": { "trends": ["趋势1", "趋势2"], "opportunities": ["机会1", "机会2"] },
  "longTerm": { "trends": ["趋势1", "趋势2"], "opportunities": ["机会1", "机会2"] }
}`;

  try {
    const content = await callZhipuAI([{ role: 'user', content: prompt }]);
    try { return JSON.parse(content); } catch (e) { return getDefaultPrediction(); }
  } catch (error) {
    return getDefaultPrediction();
  }
}

function parseFallback(content: string) {
  return {
    causeAnalysis: content.substring(0, 200),
    userPsychology: '用户对热点话题保持高度关注，反映出对新鲜事物的好奇心和参与讨论的意愿。',
    socialContext: '当前社会信息传播速度快，热点话题更新频繁，用户注意力分散。'
  };
}

function getDefaultDemandAnalysis() {
  return {
    userNeeds: ['获取最新热点信息', '了解热点背后的深层含义', '找到适合自己创作的角度'],
    painPoints: {
      cognitive: ['信息过载，难以筛选有价值的热点', '热点更新快，难以持续跟踪'],
      trust: ['热点真实性难以判断', '担心跟风创作效果不佳'],
      identity: ['不确定自己适合哪类热点', '担心创作内容缺乏独特性'],
      value: ['追热点是否有长期价值', '如何在热点中体现个人观点']
    }
  };
}

function getDefaultPrediction() {
  return {
    shortTerm: { trends: ['当前热点持续发酵', '衍生话题开始出现'], opportunities: ['快速跟进热点话题', '提供独特视角解读'] },
    midTerm: { trends: ['热点话题深度化', '用户关注点转移'], opportunities: ['深度内容创作', '跨领域融合创新'] },
    longTerm: { trends: ['用户需求结构性变化', '新的内容形式涌现'], opportunities: ['建立个人IP', '打造系列内容'] }
  };
}

function generateReport(analysis: any) {
  const topKeywords = analysis.phenomenon.keywords.slice(0, 5).map((k: any) => k.keyword);
  return {
    category: analysis.category,
    summary: {
      totalHotspots: analysis.phenomenon.stats.totalCount,
      avgHeat: analysis.phenomenon.stats.avgHeat,
      topKeywords: analysis.phenomenon.keywords.slice(0, 10).map((k: any) => k.keyword),
      topCategories: analysis.phenomenon.stats.topCategories,
    },
    phenomenon: analysis.phenomenon,
    logic: analysis.logic,
    demand: analysis.demand,
    prediction: analysis.prediction,
    recommendations: {
      forCreators: [
        `关注热门关键词：${topKeywords.join('、')}`,
        '选择上升趋势的热点进行创作',
        '结合用户痛点提供有价值的内容',
        '提前布局中长期趋势话题',
      ],
      forOperators: [
        '优化热点推荐算法，提高匹配度',
        '增加热点分析功能，帮助用户决策',
        '建立用户画像，实现个性化推荐',
        '提供创作工具，降低创作门槛',
      ],
      forMarketers: [
        '选择高热度、高匹配度的热点',
        '关注用户痛点，设计针对性内容',
        '把握短期机会，快速响应热点',
        '布局长期趋势，建立品牌认知',
      ],
    },
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================
// AI 智能体 API
// ============================================================

const AGENT_PROMPTS: Record<string, string> = {
  trendHunter: `你是一个热点追踪专家，擅长分析当前平台的热门趋势。请推荐2-3个热门选题方向。`,
  scriptWriter: `你是一个专业的短视频脚本创作者。请根据用户需求，创作60秒左右的短视频脚本，包含分镜规划。`,
  videoProducer: `你是一个视频制作专家，擅长短视频制作和数字人应用。请提供视频制作方案。`,
  editor: `你是一个视频剪辑专家，精通短视频剪辑和平台适配。请提供剪辑建议。`,
  dataAnalyst: `你是一个短视频数据分析师，擅长预测视频效果和优化建议。请提供发布建议。`,
  articleWriter: `你是一个专业的公众号文章作者。请根据提供的热点或主题，撰写一篇1000字左右的高质量公众号文章。文章结构清晰，观点鲜明，适合大众读者。`
};

app.post('/api/ai/chat', async (c) => {
  try {
    const { agentType = 'articleWriter', userMessage, conversationHistory = [] } = await c.req.json();
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.articleWriter;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage }
    ];

    const reply = await callZhipuAI(messages);

    return c.json({ success: true, reply, agentType });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================
// 文章生成 API
// ============================================================

app.post('/api/articles/generate', async (c) => {
  try {
    const { topic, keywords, tone = '专业', wordCount = 1000, style = '公众号' } = await c.req.json();

    if (!topic) {
      return c.json({ success: false, error: '主题不能为空' }, 400);
    }

    const prompt = `请撰写一篇${style}文章。

主题：${topic}
关键词：${keywords || '热点、AI、内容创作'}
语调：${tone}
字数：${wordCount}字左右

要求：
1. 标题吸引人，包含核心关键词
2. 文章结构清晰，包含引言、正文（3-5个要点）、结论
3. 语言流畅，观点鲜明
4. 适合发布在公众号平台

请直接输出文章正文和标题。`;

    const reply = await callZhipuAI([{ role: 'user', content: prompt }]);

    const titleMatch = reply.match(/^\s*#?\s*标题[：:]\s*(.+)/m) || reply.match(/^\s*#\s*(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : `${topic}深度解读`;
    const content = reply.replace(/^\s*#?\s*标题[：:]\s*(.+)\n*/m, '').trim();

    return c.json({
      success: true,
      data: { title, content, wordCount: content.length, topic, keywords }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================
// 微信公众号发布 API
// ============================================================

app.get('/api/wechat/config', (c) => {
  return c.json({
    appid: wechatConfig.appid ? '***' + wechatConfig.appid.slice(-4) : '',
    configured: !!wechatConfig.appid && !!wechatConfig.secret
  });
});

app.post('/api/wechat/config', async (c) => {
  try {
    const { appid, secret } = await c.req.json();
    if (!appid || !secret) {
      return c.json({ success: false, error: 'AppID和AppSecret不能为空' }, 400);
    }
    wechatConfig = { appid, secret };
    return c.json({ success: true, message: '微信配置保存成功', appid: '***' + appid.slice(-4) });
  } catch (error: any) {
    return c.json({ success: false, error: '配置保存失败: ' + error.message }, 500);
  }
});

app.post('/api/wechat/token', async (c) => {
  try {
    if (!wechatConfig.appid || !wechatConfig.secret) {
      return c.json({ success: false, error: '微信配置未设置' }, 400);
    }
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatConfig.appid}&secret=${wechatConfig.secret}`;
    const response = await axios.get(tokenUrl);
    if (response.data.access_token) {
      return c.json({ success: true, access_token: response.data.access_token, expires_in: response.data.expires_in });
    } else {
      return c.json({ success: false, error: response.data.errmsg || '获取访问令牌失败', errcode: response.data.errcode }, 400);
    }
  } catch (error: any) {
    return c.json({ success: false, error: '网络请求失败: ' + error.message }, 500);
  }
});

app.post('/api/wechat/publish', async (c) => {
  try {
    const { title, content, summary, thumb_media_id } = await c.req.json();
    if (!title || !content) {
      return c.json({ success: false, error: '标题和内容不能为空' }, 400);
    }

    if (!wechatConfig.appid || !wechatConfig.secret) {
      return c.json({ success: false, error: '微信配置未设置' }, 400);
    }

    const tokenResponse = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatConfig.appid}&secret=${wechatConfig.secret}`);
    if (!tokenResponse.data.access_token) {
      return c.json({ success: false, error: tokenResponse.data.errmsg || '获取微信访问令牌失败' }, 400);
    }

    const draftResponse = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${tokenResponse.data.access_token}`,
      {
        articles: [{
          title,
          content,
          digest: summary || '',
          thumb_media_id: thumb_media_id || '',
          need_open_comment: 0,
          only_fans_can_comment: 0
        }]
      }
    );

    if (draftResponse.data.errcode === 0) {
      return c.json({ success: true, message: '草稿创建成功', media_id: draftResponse.data.media_id });
    } else {
      return c.json({ success: false, error: draftResponse.data.errmsg || '草稿创建失败', errcode: draftResponse.data.errcode }, 400);
    }
  } catch (error: any) {
    return c.json({ success: false, error: '发布失败: ' + error.message }, 500);
  }
});

// ============================================================
// 完整工作流 API：采集 → 分析 → 创作 → 发布
// ============================================================

app.post('/api/workflow/auto-publish', async (c) => {
  try {
    const { topic, keywords, tone = '专业', publishToWechat = false } = await c.req.json();

    // 1. 采集热点
    const hotspotsResponse = await fetchV2exHotspots();
    const hotspots = [...hotspotsResponse, ...BACKUP_HOTSPOTS].slice(0, 10);

    // 2. 分析热点
    const phenomenon = analyzePhenomenon(hotspots);
    const logic = await analyzeLogic(hotspots, phenomenon);
    const demand = await analyzeDemand(hotspots, logic);
    const prediction = await analyzePrediction(hotspots, demand);
    const report = generateReport({ category: '全部', phenomenon, logic, demand, prediction });

    // 3. 生成文章
    const articleTopic = topic || report.summary.topKeywords.slice(0, 3).join('、');
    const prompt = `请撰写一篇公众号文章。

主题：${articleTopic}
关键词：${keywords || report.summary.topKeywords.join('、')}
语调：${tone}
字数：1000字左右

参考热点分析：
- 热门关键词：${report.summary.topKeywords.join('、')}
- 原因分析：${logic.causeAnalysis}
- 用户心理：${logic.userPsychology}

要求：标题吸引人，结构清晰，观点鲜明，适合公众号发布。请直接输出文章正文和标题。`;

    const articleRaw = await callZhipuAI([{ role: 'user', content: prompt }]);
    const titleMatch = articleRaw.match(/^\s*#?\s*标题[：:]\s*(.+)/m) || articleRaw.match(/^\s*#\s*(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : `${articleTopic}深度解读`;
    const content = articleRaw.replace(/^\s*#?\s*标题[：:]\s*(.+)\n*/m, '').trim();

    // 4. 发布到微信（可选）
    let publishResult = null;
    if (publishToWechat && wechatConfig.appid && wechatConfig.secret) {
      try {
        const tokenResponse = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatConfig.appid}&secret=${wechatConfig.secret}`);
        if (tokenResponse.data.access_token) {
          const draftResponse = await axios.post(
            `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${tokenResponse.data.access_token}`,
            { articles: [{ title, content, digest: '', thumb_media_id: '', need_open_comment: 0, only_fans_can_comment: 0 }] }
          );
          publishResult = draftResponse.data;
        }
      } catch (e: any) {
        publishResult = { error: e.message };
      }
    }

    return c.json({
      success: true,
      data: {
        hotspots,
        report,
        article: { title, content },
        published: publishResult
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;