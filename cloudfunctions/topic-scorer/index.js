// 智能选题筛选云函数
// 功能: 10分制打分筛选热点话题
// 评分维度: 热度(4分) + 争议性(2分) + 价值(3分) + 相关性(1分)

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 选题筛选器
 */
class TopicFilter {
  constructor(userKeywords = []) {
    this.userKeywords = userKeywords.map(k => k.toLowerCase());
  }

  /**
   * 评分: 热度/趋势 (4分)
   * 
   * 评分标准:
   * - 4分: 当前非常热门 (知乎热榜Top10、微博热搜Top20)
   * - 3分: 热门 (知乎热榜Top30、微博热搜Top50)
   * - 2分: 较热 (有一定讨论量)
   * - 1分: 普通 (讨论量一般)
   * - 0分: 冷门
   */
  scoreHeat(item) {
    const source = item.source || '';
    const heat = item.heat || 0;
    const rank = item.rank || 999;

    if (source.includes('知乎')) {
      if (rank <= 10) return 4;
      if (rank <= 30) return 3;
      if (rank <= 50) return 2;
      return 1;
    } else if (source.includes('微博')) {
      if (rank <= 20) return 4;
      if (rank <= 50) return 3;
      if (rank <= 80) return 2;
      return 1;
    } else if (source.includes('小红书')) {
      if (rank <= 15) return 4;
      if (rank <= 40) return 3;
      if (rank <= 60) return 2;
      return 1;
    } else if (source.includes('抖音') || source.includes('B站')) {
      if (rank <= 20) return 4;
      if (rank <= 50) return 3;
      if (rank <= 80) return 2;
      return 1;
    } else {
      // 其他源，根据热度值判断
      if (typeof heat === 'number') {
        if (heat >= 100000) return 4;
        if (heat >= 50000) return 3;
        if (heat >= 10000) return 2;
        return 1;
      } else if (typeof heat === 'string') {
        const heatNum = parseInt(heat.replace(/[^\d]/g, ''));
        if (heatNum >= 100000) return 4;
        if (heatNum >= 50000) return 3;
        if (heatNum >= 10000) return 2;
        return 1;
      }
      return 1;
    }
  }

  /**
   * 评分: 争议性 (2分)
   * 
   * 评分标准:
   * - 2分: 具有明显争议性、对立观点、可引发讨论
   * - 1分: 有一定争议性
   * - 0分: 无明显争议
   */
  scoreControversy(item) {
    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || item.desc || '').toLowerCase();
    const text = title + ' ' + summary;

    // 争议性关键词
    const controversyKeywords = [
      '争议', '批评', '质疑', '反驳', '反对',
      '冲突', '辩论', '讨论', '问题', '负面',
      '不利', '对立', '抨击', '指责', '炮轰',
      '回应', '澄清', '道歉', '争论', '分歧'
    ];

    let count = 0;
    for (const keyword of controversyKeywords) {
      if (text.includes(keyword)) {
        count++;
      }
    }

    if (count >= 2) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  /**
   * 评分: 价值 (3分)
   * 
   * 评分标准:
   * - 3分: 高价值 (实用、可操作、信息密度高)
   * - 2分: 中等价值 (有启发性)
   * - 1分: 一般价值
   * - 0分: 低价值
   */
  scoreValue(item) {
    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || item.desc || '').toLowerCase();
    const text = title + ' ' + summary;

    // 价值关键词
    const valueKeywords = [
      '教程', '指南', '方法', '技巧', '原理',
      '分析', '解读', '详解', '深入', '学习',
      '实践', '经验', '总结', '方案', '优化',
      '如何', '怎么', '最佳', '提升', '攻略',
      '揭秘', '盘点', '推荐', '必看', '干货'
    ];

    let count = 0;
    for (const keyword of valueKeywords) {
      if (text.includes(keyword)) {
        count++;
      }
    }

    // 检查标题长度 (通常详细标题价值更高)
    const titleLength = title.length;
    let lengthScore = 0;
    if (titleLength > 20) {
      lengthScore = 1;
    }

    if (count >= 3) return 3;
    if (count >= 2) return 2;
    if (count >= 1 || lengthScore) return 1;
    return 0;
  }

  /**
   * 评分: 相关性 (1分)
   * 
   * 评分标准:
   * - 1分: 与用户关注的关键词高度相关
   * - 0分: 无关或相关性低
   */
  scoreRelevance(item) {
    if (this.userKeywords.length === 0) {
      // 如果没有配置关键词，默认给1分
      return 1;
    }

    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || item.desc || '').toLowerCase();
    const text = title + ' ' + summary;

    // 检查是否包含用户关键词
    for (const keyword of this.userKeywords) {
      if (text.includes(keyword)) {
        return 1;
      }
    }

    return 0;
  }

  /**
   * 对单个选题进行评分
   */
  scoreItem(item) {
    const heatScore = this.scoreHeat(item);
    const controversyScore = this.scoreControversy(item);
    const valueScore = this.scoreValue(item);
    const relevanceScore = this.scoreRelevance(item);

    const totalScore = heatScore + controversyScore + valueScore + relevanceScore;

    return {
      title: item.title || '',
      link: item.link || item.url || '',
      source: item.source || '',
      heat: item.heat || '',
      rank: item.rank || 0,
      originalItem: item,
      scores: {
        '热度': heatScore,
        '争议性': controversyScore,
        '价值': valueScore,
        '相关性': relevanceScore
      },
      totalScore: totalScore,
      recommend: totalScore >= 7  // ≥7分推荐
    };
  }

  /**
   * 批量评分并筛选选题
   */
  filterTopics(items, minScore = 7) {
    // 评分
    const scoredItems = items.map(item => this.scoreItem(item));

    // 按总分排序
    scoredItems.sort((a, b) => b.totalScore - a.totalScore);

    // 筛选推荐选题
    const recommended = scoredItems.filter(item => item.totalScore >= minScore);

    return {
      totalItems: items.length,
      recommendedCount: recommended.length,
      minScore: minScore,
      allItems: scoredItems,
      recommended: recommended
    };
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { items, keywords, minScore = 7, showAll = false } = event;

  console.log('[topic-scorer]收到请求');
  console.log('[topic-scorer]选题数量:', items ? items.length : 0);
  console.log('[topic-scorer]关键词:', keywords);
  console.log('[topic-scorer]最低分数:', minScore);

  try {
    // 参数验证
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('参数错误: items必须是非空数组');
    }

    // 创建筛选器并评分
    const filter = new TopicFilter(keywords || []);
    const result = filter.filterTopics(items, minScore);

    console.log('[topic-scorer]评分完成');
    console.log('[topic-scorer]推荐选题数:', result.recommendedCount);

    // 返回结果
    return {
      success: true,
      filterTime: new Date().toISOString(),
      keywords: keywords || [],
      minScore: minScore,
      statistics: {
        total: result.totalItems,
        recommended: result.recommendedCount,
        rejected: result.totalItems - result.recommendedCount
      },
      recommended: result.recommended,
      allItems: showAll ? result.allItems : []
    };

  } catch (error) {
    console.error('[topic-scorer]错误:', error);

    return {
      success: false,
      error: error.message,
      errorCode: 'SCORING_ERROR',
      errorDetails: {
        message: error.message,
        stack: error.stack
      }
    };
  }
};
