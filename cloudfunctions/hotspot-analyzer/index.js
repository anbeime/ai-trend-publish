// 云函数：hotspot-analyzer - 热点深度分析
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 分析框架配置
const ANALYSIS_FRAMEWORK = {
  // 1. 现象层分析
  phenomenon: {
    dataStats: true,        // 数据统计
    keywordExtract: true,   // 关键词提取
    trendAnalysis: true,    // 时间趋势
  },
  
  // 2. 逻辑层分析
  logic: {
    causeAnalysis: true,    // 原因分析
    userPsychology: true,   // 用户心理
    socialContext: true,    // 社会背景
  },
  
  // 3. 需求层分析
  demand: {
    userNeeds: true,        // 用户诉求
    painPoints: true,       // 痛点挖掘
    painPointLayers: [      // 痛点分层
      'cognitive',          // 认知焦虑
      'trust',              // 信任危机
      'identity',           // 身份焦虑
      'value'               // 价值迷茫
    ]
  },
  
  // 4. 预测层分析
  prediction: {
    shortTerm: true,        // 短期预测（1-3天）
    midTerm: true,          // 中期预测（1-2周）
    longTerm: true,         // 长期预测（1个月+）
  }
};

exports.main = async (event, context) => {
  const { hotspots, category = '全部' } = event;
  
  try {
    console.log(`开始分析 ${hotspots.length} 个热点，分类：${category}`);
    
    // 过滤分类
    let filteredHotspots = hotspots;
    if (category !== '全部') {
      filteredHotspots = hotspots.filter(h => h.category === category);
    }
    
    if (filteredHotspots.length === 0) {
      return {
        success: false,
        error: '没有符合条件的热点数据',
      };
    }
    
    // 1. 现象层分析
    console.log('执行现象层分析...');
    const phenomenonAnalysis = analyzePhenomenon(filteredHotspots);
    
    // 2. 逻辑层分析（使用AI）
    console.log('执行逻辑层分析...');
    const logicAnalysis = await analyzeLogic(filteredHotspots, phenomenonAnalysis);
    
    // 3. 需求层分析（痛点挖掘）
    console.log('执行需求层分析...');
    const demandAnalysis = await analyzeDemand(filteredHotspots, logicAnalysis);
    
    // 4. 预测层分析
    console.log('执行预测层分析...');
    const predictionAnalysis = await analyzePrediction(filteredHotspots, demandAnalysis);
    
    // 5. 生成报告
    console.log('生成分析报告...');
    const report = generateReport({
      category,
      phenomenon: phenomenonAnalysis,
      logic: logicAnalysis,
      demand: demandAnalysis,
      prediction: predictionAnalysis,
    });
    
    console.log('分析完成');
    
    return {
      success: true,
      report: report,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('分析失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 现象层分析
function analyzePhenomenon(hotspots) {
  // 数据统计
  const stats = {
    totalCount: hotspots.length,
    avgHeat: Math.round(hotspots.reduce((sum, h) => sum + (h.heat || 0), 0) / hotspots.length),
    topCategories: getTopCategories(hotspots),
    topSources: getTopSources(hotspots),
    trendDistribution: getTrendDistribution(hotspots),
  };
  
  // 关键词提取
  const keywords = extractTopKeywords(hotspots);
  
  // 趋势分析
  const trends = {
    risingCount: hotspots.filter(h => h.trend === 'up').length,
    fallingCount: hotspots.filter(h => h.trend === 'down').length,
    stableCount: hotspots.filter(h => h.trend === 'stable' || !h.trend).length,
  };
  
  return { stats, keywords, trends };
}

// 获取热门分类
function getTopCategories(hotspots) {
  const categoryCount = {};
  hotspots.forEach(h => {
    const cat = h.category || '其他';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

// 获取热门来源
function getTopSources(hotspots) {
  const sourceCount = {};
  hotspots.forEach(h => {
    const src = h.source || '未知';
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  });
  
  return Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

// 获取趋势分布
function getTrendDistribution(hotspots) {
  const distribution = {
    up: 0,
    down: 0,
    stable: 0,
  };
  
  hotspots.forEach(h => {
    const trend = h.trend || 'stable';
    distribution[trend] = (distribution[trend] || 0) + 1;
  });
  
  return distribution;
}

// 提取热门关键词
function extractTopKeywords(hotspots) {
  const keywordCount = {};
  
  hotspots.forEach(h => {
    // 从标题提取关键词
    const title = h.title || h.name || '';
    const words = extractKeywordsFromText(title);
    
    words.forEach(word => {
      keywordCount[word] = (keywordCount[word] || 0) + 1;
    });
    
    // 从已有关键词提取
    if (h.keywords && Array.isArray(h.keywords)) {
      h.keywords.forEach(kw => {
        keywordCount[kw] = (keywordCount[kw] || 0) + 1;
      });
    }
  });
  
  return Object.entries(keywordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
}

// 从文本提取关键词（简单实现）
function extractKeywordsFromText(text) {
  // 移除标点符号
  const cleaned = text.replace(/[，。！？、；：""''（）《》【】]/g, ' ');
  
  // 分词（简单按空格分）
  const words = cleaned.split(/\s+/).filter(w => w.length >= 2);
  
  // 过滤停用词
  const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
  
  return words.filter(w => !stopWords.includes(w));
}

// 逻辑层分析（使用AI）
async function analyzeLogic(hotspots, phenomenonAnalysis) {
  const topHotspots = hotspots.slice(0, 10);
  
  const prompt = `你是一位专业的热点分析专家。

请基于以下热点数据和现象分析，深入分析：
1. 这些热点为什么会火？背后的核心驱动因素是什么？
2. 用户行为背后的心理动机是什么？
3. 相关的社会文化背景是什么？

热点数据（前10条）：
${topHotspots.map((h, i) => `${i + 1}. ${h.title} (来源:${h.source}, 热度:${h.heat || h.hotness})`).join('\n')}

现象分析：
- 总数：${phenomenonAnalysis.stats.totalCount}
- 平均热度：${phenomenonAnalysis.stats.avgHeat}
- 热门分类：${phenomenonAnalysis.stats.topCategories.map(c => c.category).join('、')}
- 热门关键词：${phenomenonAnalysis.keywords.slice(0, 10).map(k => k.keyword).join('、')}
- 趋势分布：上升${phenomenonAnalysis.trends.risingCount}个，下降${phenomenonAnalysis.trends.fallingCount}个

请以JSON格式返回分析结果：
{
  "causeAnalysis": "原因分析（200字以内）",
  "userPsychology": "用户心理分析（200字以内）",
  "socialContext": "社会背景分析（200字以内）"
}`;

  try {
    const aiResult = await cloud.callFunction({
      name: 'agentAI',
      data: {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }
    });
    
    const content = aiResult.result.content || aiResult.result.reply || '';
    
    // 尝试解析JSON
    try {
      return JSON.parse(content);
    } catch (e) {
      // 如果不是JSON，尝试提取内容
      return {
        causeAnalysis: content.substring(0, 200),
        userPsychology: '用户对热点话题保持高度关注，反映出对新鲜事物的好奇心和参与讨论的意愿。',
        socialContext: '当前社会信息传播速度快，热点话题更新频繁，用户注意力分散。',
      };
    }
  } catch (error) {
    console.error('AI分析失败:', error);
    return {
      causeAnalysis: '热点话题通常具有时效性强、话题性高、与用户生活相关等特点。',
      userPsychology: '用户对热点话题保持高度关注，反映出对新鲜事物的好奇心和参与讨论的意愿。',
      socialContext: '当前社会信息传播速度快，热点话题更新频繁，用户注意力分散。',
    };
  }
}

// 需求层分析（痛点挖掘）
async function analyzeDemand(hotspots, logicAnalysis) {
  const topHotspots = hotspots.slice(0, 10);
  
  const prompt = `你是一位专业的用户研究专家。

请基于以下热点数据和逻辑分析，深度挖掘用户的核心痛点。

使用痛点金字塔模型，分四层分析：
1. 认知焦虑（底层）：信息过载、学习成本、真伪辨别等
2. 信任危机：真实性、安全性、隐私担忧等
3. 身份焦虑：角色定位、能力担忧、竞争压力等
4. 价值迷茫（顶层）：意义、价值观、人生方向等

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
    const aiResult = await cloud.callFunction({
      name: 'agentAI',
      data: {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }
    });
    
    const content = aiResult.result.content || aiResult.result.reply || '';
    
    try {
      return JSON.parse(content);
    } catch (e) {
      return getDefaultDemandAnalysis();
    }
  } catch (error) {
    console.error('需求分析失败:', error);
    return getDefaultDemandAnalysis();
  }
}

// 默认需求分析
function getDefaultDemandAnalysis() {
  return {
    userNeeds: [
      '获取最新热点信息',
      '了解热点背后的深层含义',
      '找到适合自己创作的角度',
    ],
    painPoints: {
      cognitive: [
        '信息过载，难以筛选有价值的热点',
        '热点更新快，难以持续跟踪',
      ],
      trust: [
        '热点真实性难以判断',
        '担心跟风创作效果不佳',
      ],
      identity: [
        '不确定自己适合哪类热点',
        '担心创作内容缺乏独特性',
      ],
      value: [
        '追热点是否有长期价值',
        '如何在热点中体现个人观点',
      ],
    },
  };
}

// 预测层分析
async function analyzePrediction(hotspots, demandAnalysis) {
  const topHotspots = hotspots.slice(0, 10);
  
  const prompt = `你是一位专业的趋势预测专家。

请基于以下热点数据和需求分析，预测未来趋势和内容机会。

预测三个时间维度：
1. 短期（1-3天）：基于当前热度和话题生命周期
2. 中期（1-2周）：基于话题发酵规律和衍生话题
3. 长期（1个月+）：基于用户需求的持续性和社会趋势

热点数据：
${topHotspots.map((h, i) => `${i + 1}. ${h.title} (趋势:${h.trend || 'stable'})`).join('\n')}

需求分析：
用户需求：${demandAnalysis.userNeeds.join('、')}

请以JSON格式返回：
{
  "shortTerm": {
    "trends": ["趋势1", "趋势2"],
    "opportunities": ["机会1", "机会2"]
  },
  "midTerm": {
    "trends": ["趋势1", "趋势2"],
    "opportunities": ["机会1", "机会2"]
  },
  "longTerm": {
    "trends": ["趋势1", "趋势2"],
    "opportunities": ["机会1", "机会2"]
  }
}`;

  try {
    const aiResult = await cloud.callFunction({
      name: 'agentAI',
      data: {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }
    });
    
    const content = aiResult.result.content || aiResult.result.reply || '';
    
    try {
      return JSON.parse(content);
    } catch (e) {
      return getDefaultPrediction();
    }
  } catch (error) {
    console.error('预测分析失败:', error);
    return getDefaultPrediction();
  }
}

// 默认预测
function getDefaultPrediction() {
  return {
    shortTerm: {
      trends: ['当前热点持续发酵', '衍生话题开始出现'],
      opportunities: ['快速跟进热点话题', '提供独特视角解读'],
    },
    midTerm: {
      trends: ['热点话题深度化', '用户关注点转移'],
      opportunities: ['深度内容创作', '跨领域融合创新'],
    },
    longTerm: {
      trends: ['用户需求结构性变化', '新的内容形式涌现'],
      opportunities: ['建立个人IP', '打造系列内容'],
    },
  };
}

// 生成报告
function generateReport(analysis) {
  return {
    category: analysis.category,
    
    summary: {
      totalHotspots: analysis.phenomenon.stats.totalCount,
      avgHeat: analysis.phenomenon.stats.avgHeat,
      topKeywords: analysis.phenomenon.keywords.slice(0, 10).map(k => k.keyword),
      topCategories: analysis.phenomenon.stats.topCategories,
    },
    
    phenomenon: analysis.phenomenon,
    
    logic: analysis.logic,
    
    demand: analysis.demand,
    
    prediction: analysis.prediction,
    
    recommendations: generateRecommendations(analysis),
    
    generatedAt: new Date().toISOString(),
  };
}

// 生成建议
function generateRecommendations(analysis) {
  const topKeywords = analysis.phenomenon.keywords.slice(0, 5).map(k => k.keyword);
  
  return {
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
  };
}
