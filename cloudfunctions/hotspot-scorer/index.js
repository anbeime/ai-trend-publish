// 云函数：hotspot-scorer - 热点智能评分
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 评分模型配置
const SCORING_MODEL = {
  dimensions: {
    heat: { weight: 0.3 },      // 热度维度 30%
    trend: { weight: 0.25 },     // 趋势维度 25%
    content: { weight: 0.2 },    // 内容维度 20%
    userMatch: { weight: 0.15 }, // 用户匹配度 15%
    timeliness: { weight: 0.1 }, // 时效性 10%
  }
};

exports.main = async (event, context) => {
  const { hotspots, userProfile } = event;
  
  try {
    console.log(`开始为 ${hotspots.length} 个热点评分`);
    
    // 获取用户画像（如果没有传入）
    let profile = userProfile;
    if (!profile && context.OPENID) {
      profile = await getUserProfile(context.OPENID);
    }
    
    // 批量评分
    const scoredHotspots = await Promise.all(
      hotspots.map(hotspot => calculateFitScore(hotspot, profile))
    );
    
    // 按适合度排序
    scoredHotspots.sort((a, b) => b.fitScore - a.fitScore);
    
    console.log('评分完成');
    
    return {
      success: true,
      data: scoredHotspots,
      count: scoredHotspots.length,
    };
  } catch (error) {
    console.error('评分失败:', error);
    return {
      success: false,
      error: error.message,
      data: hotspots, // 返回原始数据
    };
  }
};

// 计算适合度评分
async function calculateFitScore(hotspot, userProfile) {
  const scores = {};
  
  // 1. 热度评分（0-100）
  scores.heat = calculateHeatScore(hotspot);
  
  // 2. 趋势评分（0-100）
  scores.trend = calculateTrendScore(hotspot);
  
  // 3. 内容评分（0-100）
  scores.content = calculateContentScore(hotspot, userProfile);
  
  // 4. 用户匹配度评分（0-100）
  scores.userMatch = calculateUserMatchScore(hotspot, userProfile);
  
  // 5. 时效性评分（0-100）
  scores.timeliness = calculateTimelinessScore(hotspot);
  
  // 加权计算总分
  const fitScore = Math.round(
    scores.heat * SCORING_MODEL.dimensions.heat.weight +
    scores.trend * SCORING_MODEL.dimensions.trend.weight +
    scores.content * SCORING_MODEL.dimensions.content.weight +
    scores.userMatch * SCORING_MODEL.dimensions.userMatch.weight +
    scores.timeliness * SCORING_MODEL.dimensions.timeliness.weight
  );
  
  return {
    ...hotspot,
    fitScore: fitScore,
    scoreBreakdown: scores, // 评分明细
  };
}

// 热度评分
function calculateHeatScore(hotspot) {
  const heat = hotspot.heat || hotspot.hotness || 0;
  const maxHeat = 10000000; // 假设最大热度1000万
  const normalizedHeat = Math.min(heat / maxHeat, 1);
  return Math.round(normalizedHeat * 100);
}

// 趋势评分
function calculateTrendScore(hotspot) {
  let score = 50; // 基础分
  
  // 上升趋势加分
  const trend = hotspot.trend || hotspot.trendDirection || 'stable';
  if (trend === 'up') {
    score += 30;
  } else if (trend === 'down') {
    score -= 20;
  }
  
  // 热度变化加分
  if (hotspot.heatChange) {
    const changeStr = String(hotspot.heatChange).replace(/[+%]/g, '');
    const change = parseInt(changeStr);
    if (!isNaN(change)) {
      score += Math.min(change, 20);
    }
  }
  
  // 排名变化加分
  if (hotspot.rankChange && hotspot.rankChange < 0) { // 排名上升
    score += Math.min(Math.abs(hotspot.rankChange) * 2, 20);
  }
  
  return Math.max(0, Math.min(100, score));
}

// 内容评分
function calculateContentScore(hotspot, userProfile) {
  let score = 50;
  
  // 分类匹配
  if (userProfile && userProfile.preferredCategories) {
    const category = hotspot.category || '生活';
    if (userProfile.preferredCategories.includes(category)) {
      score += 25;
    }
  }
  
  // 关键词匹配
  if (userProfile && userProfile.interests && hotspot.keywords) {
    const keywords = Array.isArray(hotspot.keywords) ? hotspot.keywords : [];
    const interests = Array.isArray(userProfile.interests) ? userProfile.interests : [];
    const matchCount = keywords.filter(k => interests.includes(k)).length;
    score += Math.min(matchCount * 5, 25);
  }
  
  // 来源偏好
  if (userProfile && userProfile.preferredSources) {
    if (userProfile.preferredSources.includes(hotspot.source)) {
      score += 10;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

// 用户匹配度评分
function calculateUserMatchScore(hotspot, userProfile) {
  if (!userProfile) return 50; // 无用户画像时返回中等分数
  
  let score = 50;
  
  // 历史话题相似度
  if (userProfile.historyTopics && hotspot.keywords) {
    const similarity = calculateTopicSimilarity(
      hotspot.keywords,
      userProfile.historyTopics
    );
    score += similarity * 50;
  }
  
  // 创作风格匹配
  if (userProfile.creationStyle && hotspot.category) {
    const styleMatch = matchCreationStyle(
      userProfile.creationStyle,
      hotspot.category
    );
    if (styleMatch) {
      score += 20;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

// 时效性评分
function calculateTimelinessScore(hotspot) {
  const now = new Date();
  const fetchTime = hotspot.fetchTime ? new Date(hotspot.fetchTime) : now;
  const hoursSinceFetch = (now - fetchTime) / (1000 * 60 * 60);
  
  // 黄金时间：获取后0-12小时
  if (hoursSinceFetch <= 12) {
    return 100 - Math.round(hoursSinceFetch * 2);
  } else if (hoursSinceFetch <= 24) {
    return 76 - Math.round((hoursSinceFetch - 12) * 3);
  } else if (hoursSinceFetch <= 48) {
    return 40 - Math.round((hoursSinceFetch - 24) * 1);
  } else {
    return 20;
  }
}

// 计算话题相似度（Jaccard相似度）
function calculateTopicSimilarity(keywords1, keywords2) {
  if (!keywords1 || !keywords2 || keywords1.length === 0 || keywords2.length === 0) {
    return 0;
  }
  
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// 匹配创作风格
function matchCreationStyle(style, category) {
  const styleMap = {
    'educational': ['科技', '生活'],
    'entertaining': ['娱乐', '美食'],
    'practical': ['生活', '旅行'],
    'emotional': ['生活', '娱乐'],
    'creative': ['科技', '娱乐', '美食', '旅行'],
  };
  
  return styleMap[style] && styleMap[style].includes(category);
}

// 获取用户画像
async function getUserProfile(openid) {
  try {
    const result = await db.collection('user_profiles').doc(openid).get();
    return result.data;
  } catch (error) {
    console.log('未找到用户画像，使用默认配置');
    return {
      preferredCategories: ['科技', '生活'],
      interests: [],
      preferredSources: ['微博', '知乎'],
      creationStyle: 'creative',
    };
  }
}
