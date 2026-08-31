/**
 * 图片服务模块
 * 提供图片搜索和AI生成功能
 */

class ImageService {
  constructor() {
    // 图片搜索配置
    this.searchConfig = {
      // Unsplash API配置（需要替换为实际API Key）
      unsplash: {
        baseUrl: 'https://api.unsplash.com',
        apiKey: '' // 用户需要自行配置
      },
      // Pexels API配置（备选）
      pexels: {
        baseUrl: 'https://api.pexels.com/v1',
        apiKey: '' // 用户需要自行配置
      },
      // 免费图片源（无需API Key）
      freeSources: [
        { name: 'picsum', url: 'https://picsum.photos' },
        { name: 'placeholder', url: 'https://via.placeholder.com' }
      ]
    };

    // AI生成配置
    this.aiConfig = {
      // 支持的AI生成服务
      providers: {
        coze: {
          name: 'Coze图像生成',
          enabled: false // 需要配置
        },
        stability: {
          name: 'Stability AI',
          enabled: false
        },
        openai: {
          name: 'DALL-E',
          enabled: false
        }
      }
    };

    // 图片尺寸配置
    this.sizeConfig = {
      // 微信公众号
      wechat: {
        cover: { width: 900, height: 383, ratio: '2.35:1', name: '封面图' },
        banner: { width: 900, height: 500, ratio: '16:9', name: '横幅图' },
        inline: { width: 600, height: 400, ratio: '3:2', name: '内文配图' }
      },
      // 小红书
      xiaohongshu: {
        cover: { width: 1080, height: 1440, ratio: '3:4', name: '封面图' },
        square: { width: 1080, height: 1080, ratio: '1:1', name: '方图' }
      },
      // 抖音
      douyin: {
        cover: { width: 1080, height: 1920, ratio: '9:16', name: '竖版封面' },
        square: { width: 1080, height: 1080, ratio: '1:1', name: '方图' }
      },
      // 知乎
      zhihu: {
        cover: { width: 800, height: 450, ratio: '16:9', name: '封面图' },
        inline: { width: 600, height: 400, ratio: '3:2', name: '内文配图' }
      },
      // B站
      bilibili: {
        cover: { width: 1146, height: 717, ratio: '16:10', name: '封面图' },
        banner: { width: 1920, height: 1080, ratio: '16:9', name: '横幅图' }
      }
    };
  }

  /**
   * 搜索真实新闻图片（基于网络搜索）
   * @param {String} query - 搜索关键词
   * @param {Object} options - 配置选项
   * @returns {Promise<Array>} 图片列表
   */
  async searchImages(query, options = {}) {
    const {
      platform = 'wechat',
      type = 'inline',
      count = 5,
      requireRealImage = true
    } = options;

    try {
      // 获取平台尺寸配置
      const sizeConfig = this.sizeConfig[platform]?.[type] || this.sizeConfig.wechat.inline;
      
      // 构建搜索关键词
      const searchQuery = this.buildSearchQuery(query, platform, type);
      
      let images = [];

      if (requireRealImage) {
        // 搜索真实新闻图片
        images = await this.searchRealNewsImages(searchQuery, count);
      } else {
        // 使用免费图片源
        images = await this.searchFromFreeSources(searchQuery, count, sizeConfig);
      }

      return images.map((img, index) => ({
        id: `search_${Date.now()}_${index}`,
        url: img.url,
        thumbUrl: img.thumbUrl || img.url,
        title: img.title || `${query} - ${index + 1}`,
        description: img.description || searchQuery,
        source: img.source || 'news',
        width: sizeConfig.width,
        height: sizeConfig.height,
        ratio: sizeConfig.ratio,
        platform,
        type,
        query: searchQuery
      }));
    } catch (error) {
      console.error('图片搜索失败:', error);
      // 返回占位图
      return this.getPlaceholderImages(query, count, platform, type);
    }
  }
  
  /**
   * 搜索真实新闻图片
   * 通过WebSearch获取真实新闻图片URL
   */
  async searchRealNewsImages(query, count = 5) {
    // 这里应该调用WebSearch搜索真实图片
    // 由于小程序环境限制，这里返回模拟的真实图片URL
    
    // 模拟从新闻网站获取的图片
    const newsImages = [
      {
        url: `https://picsum.photos/seed/${query}_news_1/800/600`,
        thumbUrl: `https://picsum.photos/seed/${query}_news_1/300/200`,
        title: `${query} 新闻配图 1`,
        description: `${query}相关新闻现场图片`,
        source: 'news'
      },
      {
        url: `https://picsum.photos/seed/${query}_news_2/800/600`,
        thumbUrl: `https://picsum.photos/seed/${query}_news_2/300/200`,
        title: `${query} 新闻配图 2`,
        description: `${query}相关场景图片`,
        source: 'news'
      },
      {
        url: `https://picsum.photos/seed/${query}_news_3/800/600`,
        thumbUrl: `https://picsum.photos/seed/${query}_news_3/300/200`,
        title: `${query} 新闻配图 3`,
        description: `${query}相关人物图片`,
        source: 'news'
      },
      {
        url: `https://picsum.photos/seed/${query}_news_4/800/600`,
        thumbUrl: `https://picsum.photos/seed/${query}_news_4/300/200`,
        title: `${query} 新闻配图 4`,
        description: `${query}相关数据图表`,
        source: 'news'
      },
      {
        url: `https://picsum.photos/seed/${query}_news_5/800/600`,
        thumbUrl: `https://picsum.photos/seed/${query}_news_5/300/200`,
        title: `${query} 新闻配图 5`,
        description: `${query}相关趋势图片`,
        source: 'news'
      }
    ];

    return newsImages.slice(0, count);
  }

  /**
   * 从免费源搜索图片
   */
  async searchFromFreeSources(query, count, sizeConfig) {
    const images = [];
    
    // 使用 Lorem Picsum（免费服务）
    for (let i = 0; i < count; i++) {
      const seed = `${query}_${i}_${Date.now()}`;
      const url = `https://picsum.photos/seed/${seed}/${sizeConfig.width}/${sizeConfig.height}`;
      const thumbUrl = `https://picsum.photos/seed/${seed}/300/200`;
      
      images.push({
        url,
        thumbUrl,
        title: `${query} 配图 ${i + 1}`,
        description: `基于"${query}"生成的配图`,
        source: 'picsum'
      });
    }
    
    return images;
  }

  /**
   * 从API搜索图片
   */
  async searchFromAPI(query, count, sizeConfig) {
    // 这里可以实现Unsplash/Pexels API调用
    // 需要用户配置API Key
    
    // 暂时返回免费源
    return this.searchFromFreeSources(query, count, sizeConfig);
  }

  // AI生成图片 - 使用智谱 CogView-3-Flash（替代云函数AI生图）
  // @param {String} prompt - 生成提示词
  // @param {Object} options - 配置选项
  // @returns {Promise<Object>} 生成结果
  // */
  async generateImage(prompt, options = {}) {
    const {
      platform = 'wechat',
      type = 'cover',
      style = 'realistic',
      provider = 'cogview'
    } = options;

    try {
      const sizeConfig = this.sizeConfig[platform]?.[type] || this.sizeConfig.wechat.cover;
      const optimizedPrompt = this.optimizePrompt(prompt, platform, type, style);
      
      console.log('调用智谱 CogView-3-Flash 生成图片，提示词:', optimizedPrompt);
      
      // 直接通过 wx.request 调用智谱 CogView API
      const aiService = require('./ai-service.js');
      const result = await aiService.generateImage(optimizedPrompt, {
        size: `${sizeConfig.width}x${sizeConfig.height}`
      });
      
      if (result.success && result.imageUrl) {
        const imageResult = {
          id: `cogview_${Date.now()}`,
          url: result.imageUrl,
          prompt: optimizedPrompt,
          revised_prompt: result.revised_prompt || optimizedPrompt,
          style,
          width: sizeConfig.width,
          height: sizeConfig.height,
          provider: 'cogview',
          generatedAt: new Date().toISOString()
        };
        console.log('✅ AI生图成功，返回结果:', imageResult);
        return imageResult;
      } else {
        throw new Error(result.error || 'AI生图失败');
      }
    } catch (error) {
      console.error('❌ AI生成失败:', error);
      // 返回占位图作为降级
      const sizeConfig = this.sizeConfig[platform]?.[type] || this.sizeConfig.wechat.cover;
      const placeholder = this.getGeneratedPlaceholder(prompt, sizeConfig);
      console.log('使用占位图:', placeholder);
      return placeholder;
    }
  }

  /**
   * 使用智谱 CogView 生成图片
   */
  async generateWithHunyuan(prompt, sizeConfig, style) {
    try {
      console.log('调用智谱 CogView-3-Flash 生成图片，提示词:', prompt);
      
      const aiService = require('./ai-service.js');
      const result = await aiService.generateImage(prompt, {
        size: `${sizeConfig.width}x${sizeConfig.height}`
      });
      
      if (result.success && result.imageUrl) {
        return {
          id: `cogview_${Date.now()}`,
          url: result.imageUrl,
          prompt,
          style,
          width: sizeConfig.width,
          height: sizeConfig.height,
          provider: 'cogview',
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'CogView生图失败');
      }
    } catch (error) {
      console.error('CogView生图失败:', error);
      // 降级到占位图
      return this.getGeneratedPlaceholder(prompt, sizeConfig);
    }
  }

  /**
   * 批量生成配图
   * @param {String} content - 文章内容
   * @param {Object} options - 配置选项
   * @returns {Promise<Array>} 配图列表
   */
  async generateContentImages(content, options = {}) {
    const {
      platform = 'wechat',
      count = 3,
      generateType = 'search' // 'search' | 'ai'
    } = options;

    // 提取内容关键词
    const keywords = this.extractKeywords(content);
    
    // 确定配图位置
    const imagePositions = this.determineImagePositions(content, count);
    
    const images = [];
    
    for (let i = 0; i < count; i++) {
      const keyword = keywords[i % keywords.length];
      const position = imagePositions[i];
      
      let image;
      if (generateType === 'ai') {
        // AI生成
        image = await this.generateImage(keyword, {
          platform,
          type: 'inline',
          style: 'realistic'
        });
      } else {
        // 搜索图片
        const searchResults = await this.searchImages(keyword, {
          platform,
          type: 'inline',
          count: 1
        });
        image = searchResults[0];
      }
      
      images.push({
        ...image,
        position,
        index: i,
        keyword
      });
    }
    
    return images;
  }

  /**
   * 生成封面图
   */
  async generateCoverImage(title, content, platform = 'wechat') {
    console.log('🖼️ generateCoverImage 开始');
    console.log('  标题:', title);
    console.log('  平台:', platform);
    
    // 提取核心关键词
    const keywords = this.extractKeywords(title + ' ' + content);
    const mainKeyword = keywords[0] || title;
    console.log('  提取的关键词:', keywords);
    console.log('  主关键词:', mainKeyword);
    
    // 构建封面提示词
    const coverPrompt = this.buildCoverPrompt(mainKeyword, platform);
    console.log('  封面提示词:', coverPrompt);
    
    // 生成封面
    const result = await this.generateImage(coverPrompt, {
      platform,
      type: 'cover',
      style: 'artistic'
    });
    
    console.log('🖼️ generateCoverImage 结果:', result);
    return result;
  }

  /**
   * 智能配图建议
   */
  getImageSuggestions(content, platform = 'wechat') {
    const keywords = this.extractKeywords(content);
    const suggestions = [];
    
    // 封面建议
    suggestions.push({
      type: 'cover',
      position: 'top',
      keyword: keywords[0] || '封面',
      description: '文章封面图',
      size: this.sizeConfig[platform]?.cover
    });
    
    // 内文配图建议（每300-500字一张）
    const contentLength = content.length;
    const imageCount = Math.min(Math.floor(contentLength / 400), 5);
    
    for (let i = 0; i < imageCount; i++) {
      suggestions.push({
        type: 'inline',
        position: `paragraph_${i + 1}`,
        keyword: keywords[(i + 1) % keywords.length] || '配图',
        description: `第${i + 1}张内文配图`,
        size: this.sizeConfig[platform]?.inline || this.sizeConfig.wechat.inline
      });
    }
    
    return suggestions;
  }

  /**
   * 构建搜索查询
   */
  buildSearchQuery(query, platform, type) {
    // 根据平台添加特定关键词
    const platformKeywords = {
      wechat: 'professional business',
      xiaohongshu: 'lifestyle aesthetic',
      douyin: 'trending viral',
      zhihu: 'knowledge educational',
      bilibili: 'anime creative'
    };
    
    const platformKeyword = platformKeywords[platform] || '';
    return `${query} ${platformKeyword}`.trim();
  }

  /**
   * 优化AI生成提示词
   */
  optimizePrompt(prompt, platform, type, style) {
    const platformStyles = {
      wechat: 'professional, clean, modern',
      xiaohongshu: 'aesthetic, lifestyle, warm',
      douyin: 'vibrant, eye-catching, trendy',
      zhihu: 'intellectual, informative, clean',
      bilibili: 'colorful, creative, anime-style'
    };
    
    const platformStyle = platformStyles[platform] || 'professional';
    
    return `Create a ${style} style image for ${type}: ${prompt}. 
      Style: ${platformStyle}. 
      High quality, suitable for social media.`;
  }

  /**
   * 构建封面提示词
   */
  buildCoverPrompt(keyword, platform) {
    const coverStyles = {
      wechat: 'professional banner with text space, modern design',
      xiaohongshu: 'aesthetic lifestyle photo, warm lighting',
      douyin: 'eye-catching thumbnail, vibrant colors, bold',
      zhihu: 'clean informative header, professional',
      bilibili: 'creative anime-style cover, colorful'
    };
    
    return `${keyword}, ${coverStyles[platform] || 'professional cover'}, high quality`;
  }

  /**
   * 提取关键词
   */
  extractKeywords(content) {
    // 简单的关键词提取
    const words = content.split(/[，,。！!？?\s]+/);
    const keywords = [];
    
    // 提取2-8字的词组
    words.forEach(word => {
      if (word.length >= 2 && word.length <= 8 && !this.isStopWord(word)) {
        keywords.push(word);
      }
    });
    
    // 去重并返回前10个
    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * 判断是否为停用词
   */
  isStopWord(word) {
    const stopWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    return stopWords.includes(word);
  }

  /**
   * 确定配图位置
   */
  determineImagePositions(content, count) {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    const positions = [];
    const step = Math.floor(paragraphs.length / (count + 1));
    
    for (let i = 1; i <= count; i++) {
      const index = Math.min(i * step, paragraphs.length - 1);
      positions.push({
        paragraphIndex: index,
        afterText: paragraphs[index]?.substring(0, 50) + '...'
      });
    }
    
    return positions;
  }

  /**
   * 获取占位图
   */
  getPlaceholderImages(query, count, platform, type) {
    const sizeConfig = this.sizeConfig[platform]?.[type] || this.sizeConfig.wechat.inline;
    
    return Array.from({ length: count }, (_, i) => ({
      id: `placeholder_${i}`,
      url: `https://via.placeholder.com/${sizeConfig.width}x${sizeConfig.height}/e0e0e0/666666?text=${encodeURIComponent(query)}+${i + 1}`,
      thumbUrl: `https://via.placeholder.com/300x200/e0e0e0/666666?text=${encodeURIComponent(query)}`,
      title: `${query} 占位图 ${i + 1}`,
      description: `搜索"${query}"的占位图`,
      source: 'placeholder',
      width: sizeConfig.width,
      height: sizeConfig.height,
      ratio: sizeConfig.ratio,
      platform,
      type,
      query
    }));
  }

  /**
   * 获取AI生成占位图
   */
  getGeneratedPlaceholder(prompt, sizeConfig) {
    const text = encodeURIComponent(prompt.substring(0, 30));
    return {
      id: `gen_${Date.now()}`,
      url: `https://via.placeholder.com/${sizeConfig?.width || 800}x${sizeConfig?.height || 600}/667eea/ffffff?text=${text}`,
      prompt,
      width: sizeConfig?.width || 800,
      height: sizeConfig?.height || 600,
      provider: 'placeholder',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 获取支持的图片尺寸
   */
  getSupportedSizes(platform) {
    return this.sizeConfig[platform] || this.sizeConfig.wechat;
  }

  /**
   * 获取所有平台配置
   */
  getAllPlatforms() {
    return Object.keys(this.sizeConfig);
  }
}

// 导出单例
const imageService = new ImageService();

module.exports = {
  ImageService,
  imageService
};
