// 智能选题筛选云函数（增强版）
// 功能: 多维度打分筛选热点话题
// 评分体系: 10分制 - 时效性(2分) + 热度(3分) + 争议性(2分) + 价值(2分) + 可操作性(1分)
//
// 增强功能:
// - 多维度评分（时效性、热度、争议性、价值、可操作性）
// - 热度趋势分析
// - 推荐解释生成
// - 智能排序算法

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 选题筛选器（增强版）
 */
class TopicFilter {
  constructor(userKeywords = [], userOptions = {}) {
    this.userKeywords = userKeywords.map(k => k.toLowerCase());
    this.userOptions = userOptions || {};
    // 用户偏好设置
    this.preferredCategories = userOptions.preferredCategories || [];
    this.creationStyle = userOptions.creationStyle || 'balanced'; // balanced, viral, educational, practical
    this.targetPlatform = userOptions.targetPlatform || 'general'; // general, douyin, xiaohongshu, wechat, bilibili
  }

  // ==================== 评分维度 ====================

  /**
   * 评分: 时效性 (2分)
   * 
   * 评估话题的新鲜程度和发布时间
   * 
   * 评分标准:
   * - 2分: 刚发布/最新热点（1小时内）
   * - 1.5分: 较新（1-6小时）
   * - 1分: 一般（6-24小时）
   * - 0.5分: 较旧（24-48小时）
   * - 0分: 过时（48小时以上）
   */
  scoreTimeliness(item) {
    const now = new Date();
    
    // 尝试多种时间字段
    const timeFields = [
      item.publishTime,
      item.pubTime,
      item.createdAt,
      item.created_at,
      item.timestamp,
      item.fetchTime,
      item.time
    ];
    
    let publishTime = null;
    for (const field of timeFields) {
      if (field) {
        publishTime = new Date(field);
        if (!isNaN(publishTime.getTime())) {
          break;
        }
        publishTime = null;
      }
    }
    
    // 如果没有时间信息，根据排名估算
    if (!publishTime) {
      const rank = item.rank || 999;
      // 排名越靠前通常越新
      if (rank <= 10) return 1.8;
      if (rank <= 30) return 1.5;
      if (rank <= 50) return 1.0;
      return 0.5;
    }
    
    const hoursSincePublish = (now - publishTime) / (1000 * 60 * 60);
    
    if (hoursSincePublish <= 1) return 2.0;
    if (hoursSincePublish <= 6) return 1.5;
    if (hoursSincePublish <= 12) return 1.2;
    if (hoursSincePublish <= 24) return 1.0;
    if (hoursSincePublish <= 48) return 0.5;
    return 0;
  }

  /**
   * 评分: 热度/趋势 (3分)
   * 
   * 评估话题当前的热门程度
   * 
   * 评分标准:
   * - 3分: 爆款级别（各平台热榜Top10）
   * - 2分: 热门（热榜Top30-50）
   * - 1分: 较热（有一定讨论量）
   * - 0.5分: 普通
   * - 0分: 冷门
   */
  scoreHeat(item) {
    const source = item.source || '';
    const heat = item.heat || 0;
    const rank = item.rank || 999;
    const hotValue = item.hotValue || item.hotness || 0;

    // 根据来源平台调整评分标准
    if (source.includes('知乎') || source.includes('zhihu')) {
      if (rank <= 10) return 3.0;
      if (rank <= 30) return 2.0;
      if (rank <= 50) return 1.2;
      if (rank <= 100) return 0.8;
      return 0.5;
    } else if (source.includes('微博') || source.includes('weibo')) {
      if (rank <= 10) return 3.0;
      if (rank <= 20) return 2.5;
      if (rank <= 50) return 2.0;
      if (rank <= 80) return 1.2;
      return 0.5;
    } else if (source.includes('小红书') || source.includes('xiaohongshu') || source.includes('xhs')) {
      if (rank <= 10) return 3.0;
      if (rank <= 25) return 2.2;
      if (rank <= 50) return 1.5;
      return 0.8;
    } else if (source.includes('抖音') || source.includes('douyin') || source.includes('B站') || source.includes('bilibili')) {
      if (rank <= 10) return 3.0;
      if (rank <= 30) return 2.3;
      if (rank <= 60) return 1.5;
      return 0.8;
    } else if (source.includes('百度') || source.includes('baidu')) {
      if (rank <= 10) return 2.8;
      if (rank <= 30) return 2.0;
      if (rank <= 50) return 1.2;
      return 0.5;
    } else {
      // 其他源，根据热度值判断
      const heatNum = this.parseHeatValue(heat || hotValue);
      if (heatNum >= 500000) return 3.0;     // 50万+
      if (heatNum >= 100000) return 2.5;    // 10万+
      if (heatNum >= 50000) return 2.0;     // 5万+
      if (heatNum >= 10000) return 1.2;     // 1万+
      if (heatNum >= 1000) return 0.8;      // 1000+
      return 0.5;
    }
  }

  /**
   * 解析热度值（支持数字和字符串格式）
   */
  parseHeatValue(heat) {
    if (typeof heat === 'number') return heat;
    if (typeof heat === 'string') {
      // 处理 "1.2万", "5000+" 等格式
      let numStr = heat.replace(/[^\d.]/g, '');
      const num = parseFloat(numStr);
      if (heat.includes('万')) return num * 10000;
      if (heat.includes('亿')) return num * 100000000;
      return num || 0;
    }
    return 0;
  }

  /**
   * 评分: 争议性 (2分)
   * 
   * 评估话题的讨论价值和传播潜力
   * 
   * 评分标准:
   * - 2分: 高争议性（多方观点对立、可引发广泛讨论）
   * - 1分: 中等争议性（有一定讨论空间）
   * - 0分: 低争议性（事实陈述、无讨论空间）
   */
  scoreControversy(item) {
    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || item.desc || item.content || '').toLowerCase();
    const text = title + ' ' + summary;

    // 高争议性关键词（权重更高）
    const highControversyKeywords = [
      '争议', '炮轰', '抨击', '反击', '对峙',
      '翻车', '塌房', '封杀', '禁令', '下架',
      '起诉', '诉讼', '索赔', '天价', '暴雷',
      '造假', '抄袭', '盗版', '侵权', '违约'
    ];

    // 中等争议性关键词
    const mediumControversyKeywords = [
      '批评', '质疑', '反驳', '反对', '冲突',
      '辩论', '问题', '负面', '不利', '对立',
      '回应', '澄清', '道歉', '争论', '分歧',
      '整改', '约谈', '处罚', '调查', '曝光'
    ];

    // 讨论引导词
    const discussionKeywords = [
      '你怎么看', '大家觉得', '是否应该', '该不该',
      '为什么', '怎么看', '如何评价', '如何看待'
    ];

    let score = 0;
    
    // 高争议性关键词（每个+0.5分）
    for (const keyword of highControversyKeywords) {
      if (text.includes(keyword)) {
        score += 0.5;
      }
    }

    // 中等争议性关键词（每个+0.25分）
    for (const keyword of mediumControversyKeywords) {
      if (text.includes(keyword)) {
        score += 0.25;
      }
    }

    // 讨论引导词（每个+0.3分）
    for (const keyword of discussionKeywords) {
      if (text.includes(keyword)) {
        score += 0.3;
      }
    }

    // 问号结尾的标题通常有讨论价值
    if (title.endsWith('?') || title.endsWith('？')) {
      score += 0.3;
    }

    return Math.min(score, 2.0); // 最高2分
  }

  /**
   * 评分: 内容价值 (2分)
   * 
   * 评估话题的内容创作价值
   * 
   * 评分标准:
   * - 2分: 高价值（实用性强、信息密度高、有深度）
   * - 1分: 中等价值（有一定启发性）
   * - 0.5分: 一般价值
   * - 0分: 低价值
   */
  scoreValue(item) {
    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || item.desc || item.content || '').toLowerCase();
    const text = title + ' ' + summary;

    // 高价值关键词（教程、干货类）
    const highValueKeywords = [
      '教程', '指南', '方法', '技巧', '原理',
      '分析', '解读', '详解', '深入', '学习',
      '实践', '经验', '总结', '方案', '优化',
      '如何', '怎么', '最佳', '提升', '攻略',
      '揭秘', '盘点', '推荐', '必看', '干货',
      '白皮书', '报告', '研究', '数据', '统计'
    ];

    // 中等价值关键词
    const mediumValueKeywords = [
      '分享', '介绍', '了解', '知道', '认识',
      '看法', '观点', '思考', '感悟', '体验',
      '测评', '对比', '评测', '使用', '效果'
    ];

    let score = 0;

    // 高价值关键词（每个+0.2分）
    for (const keyword of highValueKeywords) {
      if (text.includes(keyword)) {
        score += 0.2;
      }
    }

    // 中等价值关键词（每个+0.1分）
    for (const keyword of mediumValueKeywords) {
      if (text.includes(keyword)) {
        score += 0.1;
      }
    }

    // 标题长度加成（详细标题通常更有价值）
    const titleLength = title.length;
    if (titleLength >= 20 && titleLength <= 35) {
      score += 0.3; // 最佳长度
    } else if (titleLength > 15) {
      score += 0.15;
    }

    // 数字标题加分（具体数据更有价值）
    if (/\d+/.test(title)) {
      score += 0.2;
    }

    return Math.min(score, 2.0); // 最高2分
  }

  /**
   * 评分: 可操作性 (1分)
   * 
   * 评估话题转化为内容的难易程度
   * 
   * 评分标准:
   * - 1分: 易于创作（有明确角度、素材丰富）
   * - 0.7分: 较易创作
   * - 0.4分: 需要一定准备
   * - 0分: 难以创作（过于抽象或敏感）
   */
  scoreActionability(item) {
    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || item.desc || item.content || '').toLowerCase();
    const text = title + ' ' + summary;

    // 容易创作的特征
    const easyCreateKeywords = [
      '教程', '指南', '方法', '技巧', '步骤',
      '清单', '模板', '工具', '资源', '推荐',
      '盘点', '排行', '榜单', '合集', '总结'
    ];

    // 难以创作的特征（过于敏感或抽象）
    const hardCreateKeywords = [
      '涉密', '机密', '内部', '未公开',
      '违法', '违规', '封禁', '屏蔽'
    ];

    let score = 0.5; // 基础分

    // 容易创作的关键词加分
    for (const keyword of easyCreateKeywords) {
      if (text.includes(keyword)) {
        score += 0.15;
      }
    }

    // 有明确的数字或列表暗示内容结构清晰
    if (/\d+\s*[条点个项]/.test(text) || /\d+个/.test(text)) {
      score += 0.2;
    }

    // 难以创作的关键词扣分
    for (const keyword of hardCreateKeywords) {
      if (text.includes(keyword)) {
        score -= 0.3;
      }
    }

    // 标题过长可能难以聚焦
    if (title.length > 40) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(score, 1.0)); // 限制在0-1分
  }

  // ==================== 趋势分析 ====================

  /**
   * 分析热度趋势
   * 
   * 基于现有数据推断话题的热度变化趋势
   * 返回: { trend: 'rising'|'stable'|'falling'|'unknown', confidence: 0-1, reason: string }
   */
  analyzeTrend(item) {
    const trend = (item.trend || '').toLowerCase();
    const hotValueChange = item.hotValueChange || item.heatChange || 0;
    const rank = item.rank || 999;
    const comments = item.comments || item.commentCount || 0;

    // 如果已有明确的趋势标记
    if (trend === 'up' || trend === 'rising' || trend === '上升') {
      return {
        direction: 'rising',
        confidence: 0.85,
        reason: '平台标记为上升趋势'
      };
    }
    if (trend === 'down' || trend === 'falling' || trend === '下降') {
      return {
        direction: 'falling',
        confidence: 0.85,
        reason: '平台标记为下降趋势'
      };
    }
    if (trend === 'stable' || trend === 'flat' || trend === '平稳') {
      return {
        direction: 'stable',
        confidence: 0.8,
        reason: '平台标记为平稳'
      };
    }

    // 根据热度变化值判断
    if (typeof hotValueChange === 'number') {
      if (hotValueChange > 20) {
        return {
          direction: 'rising',
          confidence: 0.75,
          reason: `热度增长${hotValueChange}%`
        };
      } else if (hotValueChange < -20) {
        return {
          direction: 'falling',
          confidence: 0.75,
          reason: `热度下降${Math.abs(hotValueChange)}%`
        };
      }
    }

    // 根据排名推断（排名靠前且评论量大通常还在上升期）
    if (rank <= 20 && comments > 1000) {
      return {
        direction: 'rising',
        confidence: 0.6,
        reason: '高排名高互动，可能仍在上升期'
      };
    } else if (rank <= 50) {
      return {
        direction: 'stable',
        confidence: 0.55,
        reason: '中等排名，热度相对稳定'
      };
    } else if (rank > 100) {
      return {
        direction: 'falling',
        confidence: 0.5,
        reason: '排名较低，可能在降温'
      };
    }

    // 默认返回未知
    return {
      direction: 'unknown',
      confidence: 0.3,
      reason: '无法确定趋势'
    };
  }

  // ==================== 推荐解释生成 ====================

  /**
   * 生成推荐理由
   * 
   * 为每个评分后的话题生成人类可读的推荐理由
   */
  generateRecommendationReason(scoredItem) {
    const scores = scoredItem.scores;
    const totalScore = scoredItem.totalScore;
    const reasons = [];
    const suggestions = [];

    // 时效性理由
    if (scores['时效性'] >= 1.8) {
      reasons.push('🕐 刚出炉的新鲜热点，抢占第一时间');
    } else if (scores['时效性'] >= 1.2) {
      reasons.push('🕐 较新的热点话题');
    } else if (scores['时效性'] < 0.5) {
      suggestions.push('⚠️ 话题较旧，需找新角度切入');
    }

    // 热度理由
    if (scores['热度'] >= 2.5) {
      reasons.push('🔥 爆款级热度，流量巨大');
    } else if (scores['热度'] >= 2.0) {
      reasons.push('🔥 热门话题，关注度高');
    } else if (scores['热度'] >= 1.2) {
      reasons.push('🌟 有一定热度基础');
    }

    // 争议性理由
    if (scores['争议性'] >= 1.5) {
      reasons.push('💬 高争议性，容易引发讨论和传播');
      suggestions.push('💡 可从多角度分析，引发用户讨论');
    } else if (scores['争议性'] >= 1.0) {
      reasons.push('💬 有一定讨论空间');
    }

    // 价值理由
    if (scores['价值'] >= 1.5) {
      reasons.push('📚 高价值内容，实用性强');
      suggestions.push('💡 适合做深度内容或教程类视频');
    } else if (scores['价值'] >= 1.0) {
      reasons.push('📝 有一定内容价值');
    }

    // 可操作性理由
    if (scores['可操作性'] >= 0.8) {
      reasons.push('✅ 易于创作，素材丰富');
    } else if (scores['可操作性'] < 0.4) {
      suggestions.push('⚠️ 创作难度较高，需要充分准备');
    }

    // 趋势建议
    const trendAnalysis = scoredItem.trendAnalysis;
    if (trendAnalysis && trendAnalysis.direction === 'rising') {
      reasons.push('📈 热度呈上升趋势，正当时');
    } else if (trendAnalysis && trendAnalysis.direction === 'falling') {
      suggestions.push('⚠️ 热度可能在下降，需要独特角度');
    }

    // 综合评级
    let rating = '';
    let ratingEmoji = '';
    if (totalScore >= 9) {
      rating = '强烈推荐';
      ratingEmoji = '🏆';
    } else if (totalScore >= 7.5) {
      rating = '推荐';
      ratingEmoji = '⭐';
    } else if (totalScore >= 6) {
      rating = '可以考虑';
      ratingEmoji = '👍';
    } else {
      rating = '一般';
      ratingEmoji = '😐';
    }

    return {
      overallRating: rating,
      ratingEmoji: ratingEmoji,
      strengths: reasons,           // 优势
      suggestions: suggestions,     // 建议
      summary: this.generateSummary(reasons, suggestions, totalScore)
    };
  }

  /**
   * 生成推荐摘要
   */
  generateSummary(reasons, suggestions, totalScore) {
    if (totalScore >= 8) {
      return `${reasons[0] || '综合表现优秀'}，${reasons[1] || '值得优先创作'}`;
    } else if (totalScore >= 6) {
      return reasons[0] || '有潜力的选题';
    } else {
      return suggestions[0] || '可作为备选题材';
    }
  }

  // ==================== 平台适配评分 ====================

  /**
   * 根据目标平台调整评分
   * 
   * 不同平台对内容类型的偏好不同：
   * - 抖音：偏娱乐、争议、短视频友好
   * - 小红书：偏实用、审美、生活方式
   * - 微信公众号：偏深度、专业、长文
   * - B站：偏知识、技术、年轻化
   */
  adjustForPlatform(scores, item) {
    const platform = this.targetPlatform;
    const title = (item.title || '').toLowerCase();
    const text = title + ' ' + (item.summary || item.desc || '').toLowerCase();

    let bonus = 0;

    switch (platform) {
      case 'douyin':
        // 抖音偏好：娱乐性、争议性、短平快
        if (scores['争议性'] >= 1.5) bonus += 0.3;
        if (text.includes('搞笑') || text.includes('反转') || text.includes(' shock')) bonus += 0.2;
        break;

      case 'xiaohongshu':
        // 小红书偏好：实用性、审美、生活化
        if (scores['价值'] >= 1.5) bonus += 0.3;
        if (text.includes('攻略') || text.includes('测评') || text.includes('好物')) bonus += 0.2;
        break;

      case 'wechat':
        // 微信公众号偏好：深度、专业性
        if (scores['价值'] >= 1.5) bonus += 0.3;
        if (title.length > 15) bonus += 0.1; // 较长标题适合公众号
        break;

      case 'bilibili':
        // B站偏好：知识性、技术、年轻化
        if (scores['价值'] >= 1.2) bonus += 0.2;
        if (text.includes('科技') || text.includes('学习') || text.includes('教程')) bonus += 0.2;
        break;

      default:
        // general 不做调整
        break;
    }

    return Math.max(0, Math.min(bonus, 0.5)); // 平台加成最高0.5分
  }

  // ==================== 核心评分逻辑 ====================

  /**
   * 对单个选题进行完整评分
   */
  scoreItem(item) {
    // 各维度评分
    const timelinessScore = this.scoreTimeliness(item);
    const heatScore = this.scoreHeat(item);
    const controversyScore = this.scoreControversy(item);
    const valueScore = this.scoreValue(item);
    const actionabilityScore = this.scoreActionability(item);

    // 基础总分
    let totalScore = timelinessScore + heatScore + controversyScore + valueScore + actionabilityScore;

    // 平台适配加成
    const baseScores = {
      '时效性': parseFloat(timelinessScore.toFixed(1)),
      '热度': parseFloat(heatScore.toFixed(1)),
      '争议性': parseFloat(controversyScore.toFixed(1)),
      '价值': parseFloat(valueScore.toFixed(1)),
      '可操作性': parseFloat(actionabilityScore.toFixed(1))
    };
    const platformBonus = this.adjustForPlatform(baseScores, item);
    totalScore += platformBonus;

    // 趋势分析
    const trendAnalysis = this.analyzeTrend(item);

    // 趋势加成（上升中的话题额外加分）
    let trendBonus = 0;
    if (trendAnalysis.direction === 'rising') {
      trendBonus = 0.3 * trendAnalysis.confidence;
    } else if (trendAnalysis.direction === 'falling') {
      trendBonus = -0.2 * trendAnalysis.confidence;
    }
    totalScore += trendBonus;

    // 构建评分结果
    const scoredItem = {
      title: item.title || '',
      link: item.link || item.url || '',
      source: item.source || '',
      heat: item.heat || item.hotness || '',
      rank: item.rank || 0,
      originalItem: item,
      scores: baseScores,
      platformBonus: parseFloat(platformBonus.toFixed(2)),
      trendBonus: parseFloat(trendBonus.toFixed(2)),
      totalScore: parseFloat(totalScore.toFixed(1)),
      trendAnalysis: trendAnalysis,
      recommend: totalScore >= 7,  // ≥7分推荐
      recommendLevel: this.getRecommendLevel(totalScore)
    };

    // 生成推荐理由
    scoredItem.recommendation = this.generateRecommendationReason(scoredItem);

    return scoredItem;
  }

  /**
   * 获取推荐等级
   */
  getRecommendLevel(score) {
    if (score >= 9) return 'excellent';      // 强烈推荐
    if (score >= 7.5) return 'high';          // 推荐
    if (score >= 6) return 'medium';          // 可以考虑
    if (score >= 4) return 'low';             // 一般
    return 'poor';                            // 不推荐
  }

  // ==================== 批量处理 ====================

  /**
   * 批量评分并筛选选题
   * 
   * @param {Array} items - 待评分的选题列表
   * @param {number} minScore - 最低推荐分数
   * @param {Object} options - 筛选选项
   *   - sortBy: 'score'|'timeliness'|'heat'|'controversy' 排序方式
   *   - maxResults: 最大返回数量
   *   - categoryFilter: 分类过滤
   */
  filterTopics(items, minScore = 7, options = {}) {
    const { sortBy = 'score', maxResults = 0, categoryFilter = null } = options || {};

    // 评分
    const scoredItems = items.map(item => this.scoreItem(item));

    // 分类过滤
    let filteredItems = scoredItems;
    if (categoryFilter && categoryFilter !== '全部') {
      filteredItems = scoredItems.filter(item => {
        const cat = item.originalItem.category || '';
        return cat === categoryFilter || cat.includes(categoryFilter);
      });
    }

    // 排序
    switch (sortBy) {
      case 'timeliness':
        filteredItems.sort((a, b) => b.scores['时效性'] - a.scores['时效性']);
        break;
      case 'heat':
        filteredItems.sort((a, b) => b.scores['热度'] - a.scores['热度']);
        break;
      case 'controversy':
        filteredItems.sort((a, b) => b.scores['争议性'] - a.scores['争议性']);
        break;
      case 'value':
        filteredItems.sort((a, b) => b.scores['价值'] - a.scores['价值']);
        break;
      case 'score':
      default:
        filteredItems.sort((a, b) => b.totalScore - a.totalScore);
        break;
    }

    // 限制结果数量
    if (maxResults > 0) {
      filteredItems = filteredItems.slice(0, maxResults);
    }

    // 筛选推荐选题
    const recommended = filteredItems.filter(item => item.totalScore >= minScore);

    // 生成统计摘要
    const statistics = this.generateStatistics(filteredItems, minScore);

    return {
      totalItems: items.length,
      filteredCount: filteredItems.length,
      recommendedCount: recommended.length,
      minScore: minScore,
      sortBy: sortBy,
      allItems: filteredItems,
      recommended: recommended,
      statistics: statistics
    };
  }

  /**
   * 生成统计摘要
   */
  generateStatistics(scoredItems, minScore) {
    const total = scoredItems.length;
    const recommended = scoredItems.filter(item => item.totalScore >= minScore).length;
    
    // 分数分布
    const scoreDistribution = {
      excellent: scoredItems.filter(item => item.totalScore >= 9).length,
      high: scoredItems.filter(item => item.totalScore >= 7.5 && item.totalScore < 9).length,
      medium: scoredItems.filter(item => item.totalScore >= 6 && item.totalScore < 7.5).length,
      low: scoredItems.filter(item => item.totalScore >= 4 && item.totalScore < 6).length,
      poor: scoredItems.filter(item => item.totalScore < 4).length
    };

    // 平均分
    const avgScore = total > 0 
      ? parseFloat((scoredItems.reduce((sum, item) => sum + item.totalScore, 0) / total).toFixed(1))
      : 0;

    // 最高分和最低分
    const maxScore = total > 0 ? Math.max(...scoredItems.map(item => item.totalScore)) : 0;
    const minScoreActual = total > 0 ? Math.min(...scoredItems.map(item => item.totalScore)) : 0;

    // 趋势分布
    const trendDistribution = {
      rising: scoredItems.filter(item => item.trendAnalysis && item.trendAnalysis.direction === 'rising').length,
      stable: scoredItems.filter(item => item.trendAnalysis && item.trendAnalysis.direction === 'stable').length,
      falling: scoredItems.filter(item => item.trendAnalysis && item.trendAnalysis.direction === 'falling').length,
      unknown: scoredItems.filter(item => !item.trendAnalysis || item.trendAnalysis.direction === 'unknown').length
    };

    return {
      total: total,
      recommended: recommended,
      rejected: total - recommended,
      avgScore: avgScore,
      maxScore: parseFloat(maxScore.toFixed(1)),
      minScore: parseFloat(minScoreActual.toFixed(1)),
      scoreDistribution: scoreDistribution,
      trendDistribution: trendDistribution
    };
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { 
    items, 
    keywords, 
    minScore = 7, 
    showAll = false,
    sortBy = 'score',
    maxResults = 0,
    categoryFilter = null,
    targetPlatform = 'general',
    creationStyle = 'balanced'
  } = event;

  console.log('[topic-scorer] 收到请求（增强版）');
  console.log('[topic-scorer] 选题数量:', items ? items.length : 0);
  console.log('[topic-scorer] 关键词:', keywords);
  console.log('[topic-scorer] 最低分数:', minScore);
  console.log('[topic-scorer] 排序方式:', sortBy);
  console.log('[topic-scorer] 目标平台:', targetPlatform);

  try {
    // 参数验证
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('参数错误: items必须是非空数组');
    }

    // 用户选项
    const userOptions = {
      targetPlatform: targetPlatform,
      creationStyle: creationStyle
    };

    // 创建筛选器并评分
    const filter = new TopicFilter(keywords || [], userOptions);
    const result = filter.filterTopics(items, minScore, {
      sortBy: sortBy,
      maxResults: maxResults,
      categoryFilter: categoryFilter
    });

    console.log('[topic-scorer] 评分完成');
    console.log('[topic-scorer] 推荐选题数:', result.recommendedCount);
    console.log('[topic-scorer] 平均分:', result.statistics.avgScore);

    // 返回结果
    return {
      success: true,
      version: '2.0',  // 版本号，标识增强版
      filterTime: new Date().toISOString(),
      keywords: keywords || [],
      minScore: minScore,
      sortBy: sortBy,
      targetPlatform: targetPlatform,
      statistics: result.statistics,
      recommended: result.recommended,
      allItems: showAll ? result.allItems : [],
      scoringGuide: {
        dimensions: ['时效性(2分)', '热度(3分)', '争议性(2分)', '价值(2分)', '可操作性(1分)'],
        maxScore: 10,
        recommendThreshold: minScore,
        levels: {
          excellent: '≥9分 强烈推荐',
          high: '≥7.5分 推荐',
          medium: '≥6分 可以考虑',
          low: '≥4分 一般',
          poor: '<4分 不推荐'
        }
      }
    };

  } catch (error) {
    console.error('[topic-scorer] 错误:', error);

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
