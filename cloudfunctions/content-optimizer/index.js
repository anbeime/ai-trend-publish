// 内容优化云函数
// 功能: Markdown格式化、SEO优化、智能配图

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * Markdown格式化
 * 基于baoyu-format-markdown技能
 */
class MarkdownFormatter {
  /**
   * 分析内容结构
   */
  analyzeContent(content) {
    const structure = {
      hasTitle: /^#\s+.+$/m.test(content),
      hasFrontmatter: /^---\n[\s\S]+?\n---/.test(content),
      hasHeadings: /^#{2,6}\s+.+$/m.test(content),
      hasBold: /\*\*.+?\*\*/.test(content),
      hasLists: /^[-*+]\s+.+$/m.test(content) || /^\d+\.\s+.+$/m.test(content),
      hasCodeBlocks: /```[\s\S]+?```/.test(content),
      hasBlockquotes: /^>\s+.+$/m.test(content)
    };
    
    const isMarkdown = Object.values(structure).some(v => v);
    
    return {
      type: isMarkdown ? 'markdown' : 'plaintext',
      structure: structure
    };
  }

  /**
   * 生成标题候选
   */
  generateTitleCandidates(content) {
    // 提取关键词
    const keywords = this.extractKeywords(content);
    
    // 生成3个候选标题
    const candidates = [
      this.generateTitle(keywords, 'concise'),
      this.generateTitle(keywords, 'engaging'),
      this.generateTitle(keywords, 'descriptive')
    ];
    
    return candidates;
  }

  /**
   * 提取关键词
   */
  extractKeywords(content) {
    // 简单的关键词提取（实际可以使用更复杂的算法）
    const words = content
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
    
    // 统计词频
    const freq = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });
    
    // 排序并返回前5个
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * 生成标题
   */
  generateTitle(keywords, style) {
    const keyword = keywords[0] || '内容';
    
    switch (style) {
      case 'concise':
        return `${keyword}指南`;
      case 'engaging':
        return `深入理解${keyword}`;
      case 'descriptive':
        return `${keyword}：完整解析`;
      default:
        return keyword;
    }
  }

  /**
   * 添加/更新frontmatter
   */
  addFrontmatter(content, title, slug) {
    const now = new Date().toISOString().split('T')[0];
    
    // 生成摘要（取前100字符）
    const summary = content
      .replace(/^---[\s\S]+?---/, '')
      .replace(/^#.+$/gm, '')
      .replace(/\*\*/g, '')
      .trim()
      .substring(0, 100) + '...';
    
    const frontmatter = [
      '---',
      `title: "${title}"`,
      `slug: ${slug}`,
      `date: ${now}`,
      `summary: "${summary}"`,
      '---',
      ''
    ].join('\n');
    
    // 移除已有的frontmatter
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]+?---\n*/, '');
    
    return frontmatter + contentWithoutFrontmatter;
  }

  /**
   * 格式化内容
   */
  formatContent(content) {
    let formatted = content;
    
    // 1. 标题层级规范化
    formatted = this.normalizeHeadings(formatted);
    
    // 2. 添加关键词加粗
    formatted = this.addBoldKeywords(formatted);
    
    // 3. 优化列表格式
    formatted = this.optimizeLists(formatted);
    
    // 4. 优化代码块
    formatted = this.optimizeCodeBlocks(formatted);
    
    // 5. 添加分隔线
    formatted = this.addSeparators(formatted);
    
    return formatted;
  }

  /**
   * 标题层级规范化
   */
  normalizeHeadings(content) {
    // 移除H1（因为已在frontmatter中）
    let normalized = content.replace(/^#\s+.+$/gm, '');
    
    // 确保标题前后有空行
    normalized = normalized.replace(/([^\n])\n(#{2,6}\s)/g, '$1\n\n$2');
    normalized = normalized.replace(/(#{2,6}\s[^\n]+)\n([^\n])/g, '$1\n\n$2');
    
    return normalized;
  }

  /**
   * 添加关键词加粗
   */
  addBoldKeywords(content) {
    // 识别重要关键词并加粗（简化版）
    const keywords = this.extractKeywords(content);
    
    let formatted = content;
    keywords.forEach(keyword => {
      // 只在段落中加粗，避免在标题、代码块中加粗
      const regex = new RegExp('(?<!#|`)\\b' + keyword + '\\b(?!`)', 'g');
      formatted = formatted.replace(regex, `**${keyword}**`);
    });
    
    return formatted;
  }

  /**
   * 优化列表格式
   */
  optimizeLists(content) {
    // 确保列表前后有空行
    let optimized = content.replace(/([^\n])\n([-*+]\s)/g, '$1\n\n$2');
    optimized = optimized.replace(/([-*+]\s[^\n]+)\n([^\n])/g, '$1\n\n$2');
    
    return optimized;
  }

  /**
   * 优化代码块
   */
  optimizeCodeBlocks(content) {
    // 确保代码块前后有空行
    let optimized = content.replace(/([^\n])\n(```)/g, '$1\n\n$2');
    optimized = optimized.replace(/(```)\n([^\n])/g, '$1\n\n$2');
    
    return optimized;
  }

  /**
   * 添加分隔线
   */
  addSeparators(content) {
    // 在主要章节之间添加分隔线
    return content.replace(/(#{2}\s[^\n]+\n\n[\s\S]+?)\n\n(#{2}\s)/g, '$1\n\n---\n\n$2');
  }

  /**
   * 完整格式化流程
   */
  async format(content, options = {}) {
    try {
      console.log('[MarkdownFormatter]开始格式化');
      
      // 1. 分析内容
      const analysis = this.analyzeContent(content);
      console.log('[MarkdownFormatter]内容类型:', analysis.type);
      
      // 2. 生成标题
      const titleCandidates = this.generateTitleCandidates(content);
      const title = options.title || titleCandidates[0];
      const slug = options.slug || this.generateSlug(title);
      
      console.log('[MarkdownFormatter]标题:', title);
      
      // 3. 添加frontmatter
      let formatted = this.addFrontmatter(content, title, slug);
      
      // 4. 格式化内容
      formatted = this.formatContent(formatted);
      
      // 5. 清理多余空行
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
      
      console.log('[MarkdownFormatter]格式化完成');
      
      return {
        success: true,
        content: formatted,
        metadata: {
          title: title,
          slug: slug,
          type: analysis.type,
          titleCandidates: titleCandidates
        }
      };
      
    } catch (error) {
      console.error('[MarkdownFormatter]错误:', error);
      throw error;
    }
  }

  /**
   * 生成slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }
}

/**
 * SEO优化器
 */
class SEOOptimizer {
  /**
   * 优化内容SEO
   */
  async optimize(content, options = {}) {
    try {
      console.log('[SEOOptimizer]开始SEO优化');
      
      const optimized = {
        content: content,
        seo: {}
      };
      
      // 1. 提取/生成关键词
      optimized.seo.keywords = this.extractKeywords(content);
      
      // 2. 生成描述
      optimized.seo.description = this.generateDescription(content);
      
      // 3. 优化标题
      optimized.seo.optimizedTitle = this.optimizeTitle(content);
      
      // 4. 添加内链建议
      optimized.seo.internalLinks = this.suggestInternalLinks(content);
      
      // 5. 关键词密度分析
      optimized.seo.keywordDensity = this.analyzeKeywordDensity(content);
      
      console.log('[SEOOptimizer]SEO优化完成');
      
      return {
        success: true,
        ...optimized
      };
      
    } catch (error) {
      console.error('[SEOOptimizer]错误:', error);
      throw error;
    }
  }

  extractKeywords(content) {
    // 提取关键词（简化版）
    const words = content
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
    
    const freq = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });
    
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  generateDescription(content) {
    return content
      .replace(/^---[\s\S]+?---/, '')
      .replace(/^#.+$/gm, '')
      .replace(/\*\*/g, '')
      .trim()
      .substring(0, 160);
  }

  optimizeTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (!titleMatch) return null;
    
    const title = titleMatch[1];
    const keywords = this.extractKeywords(content);
    
    return {
      original: title,
      optimized: `${keywords[0]?.word || ''} - ${title}`,
      suggestions: [
        `如何${title}`,
        `${title}完整指南`,
        `深入理解${title}`
      ]
    };
  }

  suggestInternalLinks(content) {
    // 简化版：建议可以添加内链的关键词
    const keywords = this.extractKeywords(content);
    return keywords.slice(0, 5).map(k => k.word);
  }

  analyzeKeywordDensity(content) {
    const words = content.split(/\s+/).length;
    const keywords = this.extractKeywords(content);
    
    return keywords.map(k => ({
      word: k.word,
      count: k.count,
      density: ((k.count / words) * 100).toFixed(2) + '%'
    }));
  }
}

/**
 * 智能配图规划器
 */
class IllustrationPlanner {
  /**
   * 分析配图需求
   */
  async plan(content, options = {}) {
    try {
      console.log('[IllustrationPlanner]开始分析配图需求');
      
      // 1. 分析文章结构
      const structure = this.analyzeStructure(content);
      
      // 2. 识别配图位置
      const positions = this.identifyIllustrationPositions(content, structure);
      
      // 3. 生成配图计划
      const plans = positions.map((pos, index) => ({
        id: index + 1,
        position: pos.position,
        purpose: pos.purpose,
        visualContent: pos.visualContent,
        style: pos.style,
        filename: `illustration-${this.generateSlug(pos.visualContent)}.png`
      }));
      
      console.log(`[IllustrationPlanner]识别到${plans.length}个配图位置`);
      
      return {
        success: true,
        count: plans.length,
        plans: plans
      };
      
    } catch (error) {
      console.error('[IllustrationPlanner]错误:', error);
      throw error;
    }
  }

  analyzeStructure(content) {
    const lines = content.split('\n');
    const structure = {
      sections: [],
      paragraphs: []
    };
    
    let currentSection = null;
    let currentParagraph = '';
    
    lines.forEach((line, index) => {
      // 识别章节
      const headingMatch = line.match(/^(#{2,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentParagraph) {
          structure.paragraphs.push({
            content: currentParagraph,
            section: currentSection,
            lineNumber: index
          });
          currentParagraph = '';
        }
        
        currentSection = {
          level: headingMatch[1].length,
          title: headingMatch[2],
          lineNumber: index
        };
        structure.sections.push(currentSection);
      } else if (line.trim()) {
        currentParagraph += line + '\n';
      } else if (currentParagraph) {
        structure.paragraphs.push({
          content: currentParagraph,
          section: currentSection,
          lineNumber: index
        });
        currentParagraph = '';
      }
    });
    
    return structure;
  }

  identifyIllustrationPositions(content, structure) {
    const positions = [];
    
    // 为每个主要章节考虑配图
    structure.sections.forEach(section => {
      if (section.level === 2) {  // 只为二级标题配图
        const needsIllustration = this.checkIfNeedsIllustration(section.title);
        
        if (needsIllustration) {
          positions.push({
            position: `${section.title} 章节`,
            purpose: this.determinePurpose(section.title),
            visualContent: this.generateVisualContent(section.title),
            style: this.determineStyle(section.title)
          });
        }
      }
    });
    
    return positions;
  }

  checkIfNeedsIllustration(title) {
    // 包含抽象概念的标题需要配图
    const abstractKeywords = ['概念', '原理', '架构', '流程', '对比', '演进', '趋势'];
    return abstractKeywords.some(keyword => title.includes(keyword));
  }

  determinePurpose(title) {
    if (title.includes('流程') || title.includes('步骤')) {
      return '流程可视化';
    } else if (title.includes('对比') || title.includes('区别')) {
      return '对比关系展示';
    } else if (title.includes('概念') || title.includes('原理')) {
      return '概念具象化';
    } else {
      return '信息补充';
    }
  }

  generateVisualContent(title) {
    return `展示${title}的核心要点`;
  }

  determineStyle(title) {
    if (title.includes('AI') || title.includes('技术')) {
      return '科幻未来感';
    } else if (title.includes('流程') || title.includes('数据')) {
      return '信息图表风';
    } else {
      return '极简扁平矢量';
    }
  }

  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { action, content, options = {} } = event;
  
  console.log('[content-optimizer]收到请求, action:', action);
  
  try {
    // 参数验证
    if (!content) {
      throw new Error('参数错误: content必须提供');
    }
    
    // 根据action执行不同操作
    switch (action) {
      case 'format':
        // Markdown格式化
        const formatter = new MarkdownFormatter();
        return await formatter.format(content, options);
        
      case 'seo':
        // SEO优化
        const seoOptimizer = new SEOOptimizer();
        return await seoOptimizer.optimize(content, options);
        
      case 'illustration':
        // 智能配图规划
        const illustrationPlanner = new IllustrationPlanner();
        return await illustrationPlanner.plan(content, options);
        
      default:
        throw new Error('未知的action: ' + action);
    }
    
  } catch (error) {
    console.error('[content-optimizer]错误:', error);
    
    // 返回错误信息
    return {
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR',
      errorDetails: {
        action: action,
        message: error.message,
        stack: error.stack
      }
    };
  }
};
