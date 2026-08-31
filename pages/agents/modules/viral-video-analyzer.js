// viral-video-analyzer.js - 爆款视频分析器
// 功能：分析对标爆款视频，提取成功要素，生成复刻方案

/**
 * ViralVideoAnalyzer - 爆款视频分析器
 * 核心功能：
 * 1. 视频链接解析（抖音、快手、视频号、B站、小红书）
 * 2. 视频内容分析（画面、文案、音乐、节奏）
 * 3. 成功要素提取（钩子、爆点、情绪曲线）
 * 4. 复刻方案生成（脚本、分镜、文案模板）
 * 5. 差异化建议（如何避免同质化）
 */

class ViralVideoAnalyzer {
  constructor(pageContext) {
    this.page = pageContext;
    this.supportedPlatforms = [
      { name: '抖音', domains: ['douyin.com', 'iesdouyin.com'] },
      { name: '快手', domains: ['kuaishou.com', 'kuaishouapp.com'] },
      { name: '视频号', domains: ['channels.weixin.qq.com'] },
      { name: 'B站', domains: ['bilibili.com', 'b23.tv'] },
      { name: '小红书', domains: ['xiaohongshu.com', 'xhs.link'] }
    ];
  }

  /**
   * 分析爆款视频
   * @param {String} videoUrl - 视频链接
   * @param {Object} options - 分析选项
   */
  async analyzeVideo(videoUrl, options = {}) {
    console.log('[ViralVideoAnalyzer] 开始分析视频:', videoUrl);

    try {
      // 1. 验证链接
      if (!this.validateUrl(videoUrl)) {
        throw new Error('不支持的视频链接格式');
      }

      // 2. 识别平台
      const platform = this.detectPlatform(videoUrl);
      console.log('[ViralVideoAnalyzer] 检测到平台:', platform);

      // 3. 调用云函数解析视频
      const parseResult = await this.parseVideo(videoUrl, platform);
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || '视频解析失败');
      }

      // 4. AI 分析视频内容
      const analysis = await this.analyzeContent(parseResult.data, options);

      // 5. 生成复刻方案
      const replicationPlan = await this.generateReplicationPlan(analysis, options);

      return {
        success: true,
        platform,
        originalData: parseResult.data,
        analysis,
        replicationPlan,
        suggestions: this.generateSuggestions(analysis)
      };

    } catch (error) {
      console.error('[ViralVideoAnalyzer] 分析失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证 URL
   */
  validateUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // 检查是否包含支持的域名
    return this.supportedPlatforms.some(platform => 
      platform.domains.some(domain => url.includes(domain))
    );
  }

  /**
   * 检测平台
   */
  detectPlatform(url) {
    for (const platform of this.supportedPlatforms) {
      if (platform.domains.some(domain => url.includes(domain))) {
        return platform.name;
      }
    }
    return '未知平台';
  }

  /**
   * 解析视频
   */
  async parseVideo(videoUrl, platform) {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '解析视频中...', mask: true });

      wx.cloud.callFunction({
        name: 'viral-video-parser',
        data: {
          action: 'parse',
          videoUrl,
          platform
        },
        success: (res) => {
          wx.hideLoading();
          resolve(res.result);
        },
        fail: (err) => {
          wx.hideLoading();
          reject(err);
        }
      });
    });
  }

  /**
   * 分析视频内容
   */
  async analyzeContent(videoData, options) {
    const { 
      analyzeHook = true,
      analyzeStructure = true,
      analyzeEmotion = true,
      analyzeVisual = true
    } = options;

    const analysis = {
      // 基础信息
      basicInfo: {
        title: videoData.title,
        author: videoData.author,
        duration: videoData.duration,
        likes: videoData.likes,
        comments: videoData.comments,
        shares: videoData.shares,
        publishTime: videoData.publishTime
      },

      // 为什么能爆？
      viralFactors: [],

      // 内容结构
      structure: null,

      // 情绪曲线
      emotionCurve: null,

      // 视觉元素
      visualElements: null,

      // 文案分析
      copywriting: null,

      // 音乐/音效
      audio: null
    };

    // 分析爆款因素
    if (analyzeHook) {
      analysis.viralFactors = this.analyzeViralFactors(videoData);
    }

    // 分析内容结构
    if (analyzeStructure) {
      analysis.structure = this.analyzeStructure(videoData);
    }

    // 分析情绪曲线
    if (analyzeEmotion) {
      analysis.emotionCurve = this.analyzeEmotionCurve(videoData);
    }

    // 分析视觉元素
    if (analyzeVisual) {
      analysis.visualElements = this.analyzeVisualElements(videoData);
    }

    // 文案分析
    analysis.copywriting = this.analyzeCopywriting(videoData);

    // 音乐分析
    analysis.audio = this.analyzeAudio(videoData);

    return analysis;
  }

  /**
   * 分析爆款因素
   */
  analyzeViralFactors(videoData) {
    const factors = [];

    // 1. 黄金3秒钩子
    if (videoData.hook) {
      factors.push({
        type: 'hook',
        name: '黄金3秒钩子',
        description: videoData.hook,
        score: this.scoreHook(videoData.hook)
      });
    }

    // 2. 情绪价值
    if (videoData.emotionValue) {
      factors.push({
        type: 'emotion',
        name: '情绪价值',
        description: videoData.emotionValue,
        examples: ['共鸣', '好奇', '愤怒', '感动', '搞笑']
      });
    }

    // 3. 信息价值
    if (videoData.infoValue) {
      factors.push({
        type: 'information',
        name: '信息价值',
        description: videoData.infoValue,
        examples: ['干货', '技巧', '知识', '揭秘']
      });
    }

    // 4. 冲突/争议
    if (videoData.conflict) {
      factors.push({
        type: 'conflict',
        name: '冲突点',
        description: videoData.conflict
      });
    }

    // 5. 互动设计
    if (videoData.interaction) {
      factors.push({
        type: 'interaction',
        name: '互动设计',
        description: videoData.interaction
      });
    }

    return factors;
  }

  /**
   * 评分钩子质量
   */
  scoreHook(hook) {
    let score = 0;
    
    // 悬念型
    if (/为什么|怎么|什么|吗|呢/.test(hook)) score += 30;
    // 数字型
    if (/\d+/.test(hook)) score += 20;
    // 冲突型
    if (/但是|然而|竟然|居然/.test(hook)) score += 25;
    // 利益型
    if (/学会|掌握|得到|赚到|省钱|赚钱/.test(hook)) score += 25;
    
    return Math.min(score, 100);
  }

  /**
   * 分析内容结构
   */
  analyzeStructure(videoData) {
    return {
      // 开场（0-3秒）
      opening: {
        duration: '0-3秒',
        purpose: '抓住注意力',
        technique: videoData.openingTechnique || '悬念开场'
      },

      // 铺垫（3-10秒）
      setup: {
        duration: '3-10秒',
        purpose: '建立背景/问题',
        content: videoData.setupContent
      },

      // 高潮（中间部分）
      climax: {
        duration: '10秒-结尾前5秒',
        purpose: '核心内容/解决方案',
        content: videoData.climaxContent
      },

      // 结尾（最后5秒）
      ending: {
        duration: '最后5秒',
        purpose: '引导互动/关注',
        cta: videoData.callToAction
      },

      // 节奏分析
      pacing: {
        cutsPerMinute: videoData.cutsPerMinute || 0,
        speed: videoData.pacingSpeed || '中等',
        pattern: videoData.pacingPattern || '渐进式'
      }
    };
  }

  /**
   * 分析情绪曲线
   */
  analyzeEmotionCurve(videoData) {
    return {
      // 情绪标签
      emotions: videoData.emotions || [],
      
      // 情绪强度变化
      curve: [
        { time: '0-3秒', emotion: '好奇', intensity: 80 },
        { time: '3-10秒', emotion: '期待', intensity: 60 },
        { time: '中间', emotion: videoData.mainEmotion || '兴奋', intensity: 90 },
        { time: '结尾', emotion: '满足', intensity: 70 }
      ],

      // 情绪触发点
      triggers: videoData.emotionTriggers || []
    };
  }

  /**
   * 分析视觉元素
   */
  analyzeVisualElements(videoData) {
    return {
      // 画面风格
      style: videoData.visualStyle || '写实',
      
      // 色彩特点
      colorPalette: videoData.colorPalette || [],
      
      // 镜头运用
      shots: videoData.shots || [],
      
      // 字幕样式
      subtitles: {
        style: videoData.subtitleStyle,
        animation: videoData.subtitleAnimation,
        position: videoData.subtitlePosition
      },

      // 特效使用
      effects: videoData.effects || []
    };
  }

  /**
   * 分析文案
   */
  analyzeCopywriting(videoData) {
    return {
      // 标题特点
      title: {
        text: videoData.title,
        length: videoData.title?.length || 0,
        keywords: this.extractKeywords(videoData.title),
        pattern: this.identifyTitlePattern(videoData.title)
      },

      // 文案结构
      structure: videoData.copyStructure || '问题-解决-结果',

      // 话术特点
      phrases: videoData.keyPhrases || [],

      // 语言风格
      tone: videoData.tone || '口语化'
    };
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    if (!text) return [];
    
    // 简单的关键词提取（实际项目中可以使用 NLP）
    const commonWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人'];
    const words = text.split(/\s+|，|。|！|？/);
    
    return words
      .filter(w => w.length >= 2 && !commonWords.includes(w))
      .slice(0, 5);
  }

  /**
   * 识别标题模式
   */
  identifyTitlePattern(title) {
    if (!title) return '未知';
    
    if (/\d+/.test(title) && /个|种|步|招/.test(title)) {
      return '清单型';
    }
    if (/为什么|怎么|如何|什么/.test(title)) {
      return '疑问型';
    }
    if (/震惊|竟然|居然|原来/.test(title)) {
      return '震惊型';
    }
    if (/学会|掌握|得到|秒变/.test(title)) {
      return '教程型';
    }
    return '叙述型';
  }

  /**
   * 分析音频
   */
  analyzeAudio(videoData) {
    return {
      // BGM
      music: {
        name: videoData.bgmName,
        style: videoData.bgmStyle,
        tempo: videoData.bgmTempo
      },

      // 音效
      soundEffects: videoData.soundEffects || [],

      // 配音
      voiceover: {
        type: videoData.voiceType || '原声',
        style: videoData.voiceStyle || '自然'
      }
    };
  }

  /**
   * 生成复刻方案
   */
  async generateReplicationPlan(analysis, options) {
    const {
      keepStructure = true,
      adaptContent = true,
      differentiate = true
    } = options;

    return {
      // 复刻要点
      keyPoints: this.generateKeyPoints(analysis),

      // 脚本模板
      scriptTemplate: this.generateScriptTemplate(analysis, keepStructure),

      // 分镜方案
      storyboard: this.generateStoryboard(analysis),

      // 文案模板
      copyTemplate: this.generateCopyTemplate(analysis),

      // 差异化建议
      differentiation: differentiate ? this.generateDifferentiation(analysis) : null,

      // 执行清单
      checklist: this.generateChecklist(analysis)
    };
  }

  /**
   * 生成复刻要点
   */
  generateKeyPoints(analysis) {
    const points = [];

    // 必须复刻的要素
    analysis.viralFactors.forEach(factor => {
      points.push({
        priority: '必须',
        element: factor.name,
        description: factor.description,
        implementation: this.getImplementationGuide(factor.type)
      });
    });

    // 结构要素
    if (analysis.structure) {
      points.push({
        priority: '重要',
        element: '内容结构',
        description: `${analysis.structure.opening.technique} → ${analysis.structure.climax.purpose}`,
        implementation: '保持相同的节奏和结构'
      });
    }

    return points;
  }

  /**
   * 获取实施指南
   */
  getImplementationGuide(type) {
    const guides = {
      hook: '设计一个同样吸引人的开场，可以使用类似的悬念或冲突',
      emotion: '找到能引发相同情绪的内容角度',
      information: '提供同等价值的信息或干货',
      conflict: '设置类似的冲突点或争议话题',
      interaction: '设计类似的互动引导话术'
    };
    return guides[type] || '参考原视频的实现方式';
  }

  /**
   * 生成脚本模板
   */
  generateScriptTemplate(analysis, keepStructure) {
    if (!keepStructure) return null;

    const structure = analysis.structure;
    
    return {
      // 开场模板
      opening: {
        duration: structure.opening.duration,
        template: this.generateOpeningTemplate(structure.opening),
        tips: ['前3秒必须抓住注意力', '使用强视觉冲击或悬念']
      },

      // 主体模板
      body: {
        duration: '根据内容调整',
        template: this.generateBodyTemplate(structure),
        tips: ['保持信息密度', '每10秒一个情绪起伏']
      },

      // 结尾模板
      ending: {
        duration: structure.ending.duration,
        template: this.generateEndingTemplate(structure.ending),
        tips: ['明确引导互动', '留下记忆点']
      }
    };
  }

  /**
   * 生成开场模板
   */
  generateOpeningTemplate(opening) {
    const templates = {
      '悬念开场': '【画面：{强视觉冲击}】\n【文案：{提出悬念问题}】',
      '冲突开场': '【画面：{对比画面}】\n【文案：{制造冲突}】',
      '利益开场': '【画面：{结果展示}】\n【文案：{承诺价值}】',
      'default': '【画面：吸引眼球的画面】\n【文案：引发好奇的文案】'
    };
    return templates[opening.technique] || templates.default;
  }

  /**
   * 生成主体模板
   */
  generateBodyTemplate(structure) {
    return `【铺垫】${structure.setup?.content || '建立问题背景'}
【发展】逐步展开内容，保持节奏
【高潮】${structure.climax?.content || '核心内容展示'}
【转折】制造小高潮或意外'`;
  }

  /**
   * 生成结尾模板
   */
  generateEndingTemplate(ending) {
    return `【总结】快速回顾要点
【CTA】${ending.cta || '引导点赞关注评论'}
【钩子】留下下期预告或悬念`;
  }

  /**
   * 生成分镜方案
   */
  generateStoryboard(analysis) {
    const visual = analysis.visualElements;
    
    return {
      style: visual.style,
      colorPalette: visual.colorPalette,
      shots: visual.shots,
      subtitleStyle: visual.subtitles,
      effects: visual.effects
    };
  }

  /**
   * 生成文案模板
   */
  generateCopyTemplate(analysis) {
    const copy = analysis.copywriting;
    
    return {
      title: {
        pattern: copy.title.pattern,
        template: this.generateTitleTemplate(copy.title.pattern),
        examples: copy.title.keywords
      },
      body: {
        structure: copy.structure,
        keyPhrases: copy.phrases,
        tone: copy.tone
      }
    };
  }

  /**
   * 生成标题模板
   */
  generateTitleTemplate(pattern) {
    const templates = {
      '清单型': '{数字}个{主题}，第{数字}个{效果}',
      '疑问型': '为什么{人群}都{行为}？{揭秘}',
      '震惊型': '{人群}竟然{行为}，{结果}',
      '教程型': '{数字}步学会{技能}，{效果}',
      '叙述型': '{主题}，{观点}'
    };
    return templates[pattern] || templates['叙述型'];
  }

  /**
   * 生成差异化建议
   */
  generateDifferentiation(analysis) {
    return {
      // 内容角度差异
      contentAngles: [
        '换个受众群体（如从职场人换成学生）',
        '换个场景（如从室内换成户外）',
        '换个时间（如从白天换成晚上）',
        '增加个人经历或故事',
        '加入争议观点或反转'
      ],

      // 表现形式差异
      presentation: [
        '改变拍摄角度或景别',
        '使用不同的剪辑节奏',
        '尝试不同的字幕样式',
        '更换背景音乐风格',
        '增加动画或特效'
      ],

      // 避免同质化的方法
      avoidHomogenization: [
        '加入个人 IP 特色（口头禅、标志性动作）',
        '结合时事热点',
        '提供更新的信息或数据',
        '增加互动环节',
        '设计独特的视觉标识'
      ],

      // 创新建议
      innovation: [
        '在原爆款基础上做升级版（如"进阶版"、"2026版"）',
        '做反向内容（如"千万别这样做"）',
        '做合集或系列化',
        '跨界结合（如美食+科技）'
      ]
    };
  }

  /**
   * 生成执行清单
   */
  generateChecklist(analysis) {
    return [
      { step: 1, task: '确定对标视频的核心爆款要素', done: false },
      { step: 2, task: '设计差异化内容角度', done: false },
      { step: 3, task: '撰写脚本（参考模板）', done: false },
      { step: 4, task: '设计分镜和视觉风格', done: false },
      { step: 5, task: '准备拍摄/制作素材', done: false },
      { step: 6, task: '拍摄/制作视频', done: false },
      { step: 7, task: '剪辑（保持相同节奏）', done: false },
      { step: 8, task: '添加字幕和特效', done: false },
      { step: 9, task: '选择相似风格的 BGM', done: false },
      { step: 10, task: '设计标题和封面', done: false },
      { step: 11, task: '发布并监测数据', done: false }
    ];
  }

  /**
   * 生成建议
   */
  generateSuggestions(analysis) {
    return {
      // 适合人群
      suitableFor: this.identifySuitableAudience(analysis),

      // 难度评估
      difficulty: this.assessDifficulty(analysis),

      // 成功概率
      successProbability: this.assessSuccessProbability(analysis),

      // 注意事项
      warnings: [
        '避免完全抄袭，要有自己的创新',
        '注意版权问题（音乐、字体等）',
        '保持内容质量，不要为了追热点牺牲质量',
        '及时跟进数据，必要时调整策略'
      ]
    };
  }

  /**
   * 识别适合人群
   */
  identifySuitableAudience(analysis) {
    const factors = analysis.viralFactors;
    const audiences = [];

    if (factors.some(f => f.type === 'information')) {
      audiences.push('知识型创作者');
    }
    if (factors.some(f => f.type === 'emotion')) {
      audiences.push('情感型创作者');
    }
    if (factors.some(f => f.type === 'conflict')) {
      audiences.push('观点型创作者');
    }

    return audiences.length > 0 ? audiences : ['所有创作者'];
  }

  /**
   * 评估难度
   */
  assessDifficulty(analysis) {
    const visual = analysis.visualElements;
    let difficulty = '中等';

    if (visual.effects?.length > 5) {
      difficulty = '困难';
    } else if (visual.shots?.length < 3) {
      difficulty = '简单';
    }

    return {
      level: difficulty,
      reasons: [
        `需要 ${visual.shots?.length || 0} 个镜头`,
        `需要 ${visual.effects?.length || 0} 种特效`,
        `文案复杂度: ${analysis.copywriting?.title?.length > 20 ? '高' : '中'}`
      ]
    };
  }

  /**
   * 评估成功概率
   */
  assessSuccessProbability(analysis) {
    const score = analysis.viralFactors.reduce((sum, f) => {
      return sum + (f.score || 50);
    }, 0) / (analysis.viralFactors.length || 1);

    return {
      score: Math.round(score),
      level: score >= 80 ? '高' : score >= 60 ? '中' : '低',
      reasons: analysis.viralFactors.map(f => f.name)
    };
  }
}

module.exports = {
  ViralVideoAnalyzer
};
