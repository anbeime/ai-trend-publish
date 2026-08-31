/**
 * 内容优化工具
 * 提供标题优化、内容润色、SEO优化等功能
 */

class ContentOptimizer {
  constructor() {
    // 爆款标题模板
    this.titleTemplates = {
      number: [
        '{n}个让你{benefit}的{topic}',
        '{n}个{target}必知的{topic}技巧',
        '{n}步掌握{skill}，{benefit}',
        '为什么{n}%的人都在用{tool}？',
        '{n}分钟学会{skill}，{benefit}'
      ],
      question: [
        '为什么{topic}？{benefit}',
        '如何{action}？{n}个方法告诉你',
        '{topic}是什么？一文搞懂',
        '你还在{wrong_way}？试试{right_way}',
        '为什么{target}都在{action}？'
      ],
      contrast: [
        '从{before}到{after}，我只用了{n}天',
        '你以为{wrong}，其实是{right}',
        '{n}%的人不知道的{topic}真相',
        '{common_way} vs {better_way}，哪个更好？',
        '为什么{expert}都在{action}，而你还在{old_way}？'
      ],
      hot: [
        '{hot_topic}来了，{target}该怎么办？',
        '{hot_event}，意味着什么？',
        '{hot_topic}时代，如何{benefit}？',
        '关于{hot_topic}，{n}个你必须知道的事',
        '{hot_topic}正在改变{industry}'
      ]
    };

    // 情感词库
    this.emotionWords = {
      positive: ['惊人', '震撼', '神奇', '绝妙', '完美', '极致', '爆款', '宝藏'],
      urgency: ['紧急', '立即', '马上', '限时', '最后', '错过', '赶紧'],
      curiosity: ['秘密', '真相', '内幕', '揭秘', '曝光', '隐藏', '不为人知'],
      authority: ['专家', '权威', '官方', '专业', '必看', '必读', '必知']
    };

    // SEO关键词建议
    this.seoKeywords = {
      'AI': ['人工智能', 'ChatGPT', '大模型', 'AIGC', '机器学习'],
      '科技': ['科技趋势', '数字化转型', '创新技术', '智能时代'],
      '职场': ['职场技能', '工作效率', '职业发展', '升职加薪'],
      '生活': ['生活方式', '品质生活', '生活技巧', '实用指南']
    };
  }

  /**
   * 优化标题
   * @param {String} title - 原标题
   * @param {String} style - 风格类型 (number/question/contrast/hot)
   * @param {Object} context - 上下文信息
   * @returns {Array} 优化后的标题列表
   */
  optimizeTitle(title, style = 'number', context = {}) {
    const templates = this.titleTemplates[style] || this.titleTemplates.number;
    const results = [];

    // 提取关键词
    const keywords = this.extractKeywords(title);
    
    // 根据模板生成变体
    templates.forEach((template, index) => {
      let optimized = template
        .replace(/{n}/g, context.number || Math.floor(Math.random() * 8) + 3)
        .replace(/{topic}/g, keywords.topic || title.substring(0, 10))
        .replace(/{benefit}/g, context.benefit || '效率翻倍')
        .replace(/{target}/g, context.target || '职场人')
        .replace(/{skill}/g, context.skill || keywords.topic || '新技能')
        .replace(/{tool}/g, context.tool || 'AI工具')
        .replace(/{action}/g, context.action || '提升效率')
        .replace(/{wrong_way}/g, context.wrongWay || '低效工作')
        .replace(/{right_way}/g, context.rightWay || '智能办公')
        .replace(/{before}/g, context.before || '普通员工')
        .replace(/{after}/g, context.after || '高效达人')
        .replace(/{wrong}/g, context.wrong || '很难')
        .replace(/{right}/g, context.right || '很简单')
        .replace(/{common_way}/g, context.commonWay || '传统方法')
        .replace(/{better_way}/g, context.betterWay || 'AI方法')
        .replace(/{expert}/g, context.expert || '高手')
        .replace(/{old_way}/g, context.oldWay || '手动操作')
        .replace(/{hot_topic}/g, context.hotTopic || keywords.topic || 'AI')
        .replace(/{hot_event}/g, context.hotEvent || '行业变革')
        .replace(/{industry}/g, context.industry || '整个行业');

      results.push({
        title: optimized,
        style: style,
        score: this.scoreTitle(optimized),
        template: template
      });
    });

    // 按评分排序
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 标题评分
   */
  scoreTitle(title) {
    let score = 50; // 基础分

    // 长度评分（20-30字最佳）
    const length = title.length;
    if (length >= 15 && length <= 30) {
      score += 15;
    } else if (length >= 10 && length <= 35) {
      score += 10;
    }

    // 数字加分
    if (/\d+/.test(title)) {
      score += 10;
    }

    // 情感词加分
    Object.values(this.emotionWords).flat().forEach(word => {
      if (title.includes(word)) {
        score += 5;
      }
    });

    // 疑问词加分
    if (/[为什么如何怎样]/.test(title)) {
      score += 8;
    }

    // 对比词加分
    if (/[vs比差异区别]/.test(title)) {
      score += 8;
    }

    // 标点符号检查（过多扣分）
    const punctuationCount = (title.match(/[!！?？。，,]/g) || []).length;
    if (punctuationCount > 3) {
      score -= 10;
    }

    // 重复字检查
    const charCounts = {};
    for (let char of title) {
      charCounts[char] = (charCounts[char] || 0) + 1;
    }
    const maxRepeat = Math.max(...Object.values(charCounts));
    if (maxRepeat > 3) {
      score -= 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    // 简单的关键词提取逻辑
    const words = text.split(/[，,。！!？?\s]+/);
    const topic = words.find(w => w.length >= 4 && w.length <= 10) || words[0];
    
    return {
      topic,
      keywords: words.filter(w => w.length >= 2)
    };
  }

  /**
   * 优化内容结构
   */
  optimizeStructure(content) {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    const analysis = {
      totalParagraphs: paragraphs.length,
      avgLength: paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length,
      hasIntroduction: false,
      hasConclusion: false,
      hasSubtitles: false,
      suggestions: []
    };

    // 检查开头
    if (paragraphs.length > 0) {
      const first = paragraphs[0];
      if (first.length < 100 && (first.includes('？') || first.includes('!'))) {
        analysis.hasIntroduction = true;
      } else {
        analysis.suggestions.push('建议开头使用疑问句或感叹句吸引读者');
      }
    }

    // 检查结尾
    if (paragraphs.length > 1) {
      const last = paragraphs[paragraphs.length - 1];
      if (last.includes('总结') || last.includes('结论') || last.includes('建议')) {
        analysis.hasConclusion = true;
      } else {
        analysis.suggestions.push('建议添加总结段落');
      }
    }

    // 检查小标题
    const subtitlePatterns = [/^[一二三四五六七八九十]+、/, /^\d+[\.、]/, /^【.+】/];
    analysis.hasSubtitles = paragraphs.some(p => 
      subtitlePatterns.some(pattern => pattern.test(p))
    );
    if (!analysis.hasSubtitles) {
      analysis.suggestions.push('建议添加小标题提升可读性');
    }

    // 段落长度检查
    if (analysis.avgLength > 200) {
      analysis.suggestions.push('段落偏长，建议拆分为更短的段落');
    }

    return analysis;
  }

  /**
   * SEO优化建议
   */
  getSEORecommendations(content, topic) {
    const recommendations = [];
    
    // 关键词密度检查
    const relatedKeywords = this.seoKeywords[topic] || [];
    const contentLower = content.toLowerCase();
    
    relatedKeywords.forEach(keyword => {
      const count = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      const density = (count * keyword.length) / content.length * 100;
      
      if (density < 0.5) {
        recommendations.push({
          type: 'keyword',
          keyword,
          message: `建议增加"${keyword}"关键词出现频率`,
          priority: 'medium'
        });
      }
    });

    // 标题优化
    if (content.length < 500) {
      recommendations.push({
        type: 'length',
        message: '内容偏短，建议扩展到800字以上以获得更好的SEO效果',
        priority: 'high'
      });
    }

    // 图片建议
    recommendations.push({
      type: 'media',
      message: '建议添加2-3张相关图片，提升内容丰富度',
      priority: 'medium'
    });

    // 内链建议
    recommendations.push({
      type: 'link',
      message: '适当添加相关话题链接，提升内容关联性',
      priority: 'low'
    });

    return recommendations;
  }

  /**
   * 内容润色
   */
  polishContent(content, style = 'professional') {
    const styles = {
      professional: {
        replacements: [
          { from: /很[多好]/g, to: '大量' },
          { from: /非常/g, to: '极其' },
          { from: /[挺蛮]好的/g, to: '优秀' }
        ]
      },
      casual: {
        replacements: [
          { from: /因此/g, to: '所以' },
          { from: /然而/g, to: '但是' },
          { from: /[非常极其]/g, to: '挺' }
        ]
      },
      viral: {
        replacements: [
          { from: /重要/g, to: '关键' },
          { from: /建议/g, to: '必须' },
          { from: /可以/g, to: '一定要' }
        ]
      }
    };

    let polished = content;
    const selectedStyle = styles[style] || styles.professional;
    
    selectedStyle.replacements.forEach(({ from, to }) => {
      polished = polished.replace(from, to);
    });

    return polished;
  }

  /**
   * 生成摘要
   */
  generateSummary(content, maxLength = 100) {
    // 提取前几句作为摘要
    const sentences = content.split(/[。！?！]/).filter(s => s.trim());
    let summary = '';
    
    for (let sentence of sentences) {
      if ((summary + sentence).length <= maxLength) {
        summary += sentence + '。';
      } else {
        break;
      }
    }
    
    return summary || sentences[0]?.substring(0, maxLength) + '...';
  }

  /**
   * 生成标签
   */
  generateTags(content, count = 5) {
    // 简单的标签生成逻辑
    const commonTags = ['AI', '科技', '职场', '效率', '工具', '方法', '技巧', '指南'];
    const contentLower = content.toLowerCase();
    
    // 根据内容匹配标签
    const matched = commonTags.filter(tag => 
      contentLower.includes(tag.toLowerCase())
    );
    
    // 补充通用标签
    while (matched.length < count) {
      const random = commonTags[Math.floor(Math.random() * commonTags.length)];
      if (!matched.includes(random)) {
        matched.push(random);
      }
    }
    
    return matched.slice(0, count);
  }

  /**
   * 检查内容质量
   */
  checkQuality(content) {
    const checks = {
      length: content.length,
      hasNumbers: /\d+/.test(content),
      hasExamples: /例如|比如|案例/.test(content),
      hasData: /数据|统计|研究|报告/.test(content),
      hasQuotes: /[""''']/.test(content),
      hasQuestions: /[?？]/.test(content),
      readability: this.calculateReadability(content),
      score: 0
    };

    // 计算质量分数
    let score = 0;
    if (checks.length >= 500) score += 20;
    if (checks.length >= 1000) score += 10;
    if (checks.hasNumbers) score += 15;
    if (checks.hasExamples) score += 15;
    if (checks.hasData) score += 15;
    if (checks.hasQuotes) score += 10;
    if (checks.hasQuestions) score += 10;
    if (checks.readability > 60) score += 5;

    checks.score = score;
    return checks;
  }

  /**
   * 计算可读性分数（简化版）
   */
  calculateReadability(content) {
    const sentences = content.split(/[。！?！]/).filter(s => s.trim());
    const words = content.split(/[\s，,。！?！]/).filter(w => w.trim());
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = content.length / words.length;
    
    // 简化公式：句子越短、词越短，可读性越高
    const score = Math.max(0, 100 - (avgSentenceLength - 10) * 5 - (avgWordLength - 2) * 10);
    
    return Math.min(100, score);
  }
}

// 导出
const contentOptimizer = new ContentOptimizer();

module.exports = {
  ContentOptimizer,
  contentOptimizer
};
