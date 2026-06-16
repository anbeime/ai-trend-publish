// pages/content-creator/content-creator.js - 修复白屏问题版本
const app = getApp();

Page({
  data: {
    // 用户信息
    userCredits: null,
    
    // 流程步骤
    currentStep: 1,
    
    // 热点相关
    realtimeHotspots: [],
    displayedHotspots: [],
    selectedCategory: 'all',
    selectedHotspot: null,
    loadingHotspots: false,
    
    // 错误状态
    pageError: false,
    errorMessage: '',
    
    // 创作类型
    creationType: '',
    
    // 创作参数
    styleOptions: ['专业严谨', '轻松幽默', '情感共鸣', '干货实用', '故事叙述'],
    styleIndex: 0,
    lengthOptions: ['短篇(300字)', '中篇(800字)', '长篇(1500字)', '超长(3000字)'],
    lengthIndex: 1,
    platformOptions: ['微信公众号', '小红书', '知乎', '抖音', 'B站'],
    platformIndex: 0,
    
    // 额外需求
    additionalRequirements: '',
    
    // 生成状态
    generating: false,
    generatedContent: '',
    loadingText: '',
    
    // 发布平台
    publishPlatforms: [
      { id: 'wechat', name: '微信公众号', icon: '💬', selected: false },
      { id: 'xiaohongshu', name: '小红书', icon: '📕', selected: false },
      { id: 'zhihu', name: '知乎', icon: '🔵', selected: false },
      { id: 'douyin', name: '抖音', icon: '🎵', selected: false },
      { id: 'bilibili', name: 'B站', icon: '📺', selected: false }
    ],
    publishing: false,
    
    // GLM API配置
    glmConfig: {
      apiKey: '4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4.7-flash'
    }
  },

  onLoad(options) {
    console.log('✅ 内容创作页面开始加载', options);
    
    try {
      // 从首页传入的热点
      if (options.hotspot) {
        try {
          const hotspot = JSON.parse(decodeURIComponent(options.hotspot));
          this.setData({
            selectedHotspot: hotspot,
            currentStep: 2
          });
          console.log('✅ 成功解析传入的热点数据');
        } catch (e) {
          console.error('❌ 解析热点数据失败', e);
          this.showError('热点数据解析失败');
        }
      }
      
      // 初始化用户积分
      this.initUserCredits();
      
      // 优先从缓存加载（立即显示）
      const hasCache = this.loadHotspotsFromStorage();
      
      // 如果没有缓存，使用Mock数据防止白屏
      if (!hasCache) {
        console.log('⚠️ 没有缓存数据，加载Mock数据');
        this.loadMockHotspots();
      }
      
      // 然后检查是否需要刷新
      this.checkHotspotCacheAndRefresh();
      
      console.log('✅ 页面加载完成');
    } catch (error) {
      console.error('❌ 页面加载失败:', error);
      this.showError('页面初始化失败: ' + error.message);
    }
  },

  // 显示错误信息
  showError(message) {
    console.error('显示错误:', message);
    this.setData({
      pageError: true,
      errorMessage: message
    });
  },

  // 重试加载
  retryLoad() {
    console.log('🔄 重试加载页面');
    this.setData({
      pageError: false,
      errorMessage: ''
    });
    this.loadHotspots();
  },

  // 加载Mock数据（防止白屏）
  loadMockHotspots() {
    const mockHotspots = [
      {
        id: 'mock_1',
        title: '2024年AI技术发展趋势',
        name: '2024年AI技术发展趋势',
        source: '科技资讯',
        category: 'tech',
        hotness: 9850,
        heat: 9850,
        tags: ['AI', '科技', '趋势']
      },
      {
        id: 'mock_2',
        title: '健康生活方式指南',
        name: '健康生活方式指南',
        source: '健康频道',
        category: 'life',
        hotness: 8760,
        heat: 8760,
        tags: ['健康', '生活', '养生']
      },
      {
        id: 'mock_3',
        title: '热门电影推荐榜单',
        name: '热门电影推荐榜单',
        source: '娱乐八卦',
        category: 'entertainment',
        hotness: 7650,
        heat: 7650,
        tags: ['电影', '娱乐', '推荐']
      },
      {
        id: 'mock_4',
        title: '美食制作教程分享',
        name: '美食制作教程分享',
        source: '美食天地',
        category: 'food',
        hotness: 6540,
        heat: 6540,
        tags: ['美食', '教程', '烹饪']
      }
    ];

    this.setData({
      realtimeHotspots: mockHotspots,
      displayedHotspots: mockHotspots
    });

    console.log('✅ Mock数据加载完成');
  },

  // 初始化用户积分
  initUserCredits() {
    try {
      const credits = wx.getStorageSync('user_credits') || {
        dailyQuota: 10,
        dailyUsed: 0,
        coins: 100
      };
      this.setData({ userCredits: credits });
      console.log('✅ 用户积分初始化完成:', credits);
    } catch (error) {
      console.error('❌ 用户积分初始化失败:', error);
      // 使用默认值
      this.setData({
        userCredits: {
          dailyQuota: 10,
          dailyUsed: 0,
          coins: 100
        }
      });
    }
  },

  // 从本地存储加载热点（立即显示）
  loadHotspotsFromStorage() {
    try {
      const cached = wx.getStorageSync('hotspot_cache');
      
      // 验证缓存数据完整性
      if (cached && cached.hotspots && Array.isArray(cached.hotspots) && cached.hotspots.length > 0) {
        // 验证每个热点数据的必要字段
        const validHotspots = cached.hotspots.filter(item => 
          item && (item.title || item.name) && item.id
        );
        
        if (validHotspots.length > 0) {
          console.log('✅ 从缓存加载热点:', validHotspots.length, '条');
          this.setData({
            realtimeHotspots: validHotspots,
            displayedHotspots: validHotspots
          });
          return true;
        } else {
          console.warn('⚠️ 缓存数据格式不正确');
          // 清除损坏的缓存
          wx.removeStorageSync('hotspot_cache');
          return false;
        }
      }
      
      console.log('⚠️ 本地存储中没有有效的缓存热点');
      return false;
    } catch (error) {
      console.error('❌ 从缓存加载热点失败:', error);
      // 清除可能损坏的缓存
      try {
        wx.removeStorageSync('hotspot_cache');
      } catch (e) {
        console.error('清除缓存失败:', e);
      }
      return false;
    }
  },

  // 检查缓存并智能刷新
  checkHotspotCacheAndRefresh() {
    try {
      const cached = wx.getStorageSync('hotspot_cache');

      if (!cached || !cached.fetchTime || !cached.hotspots) {
        // 没有缓存，立即加载（显示加载状态）
        console.log('⚠️ 没有热点缓存，立即加载');
        this.loadHotspots();
        return;
      }

      // 检查缓存是否过期（30分钟）
      const fetchTime = new Date(cached.fetchTime);
      const now = Date.now();
      const elapsed = now - fetchTime.getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (elapsed > thirtyMinutes) {
        // 缓存过期，后台刷新（不显示加载状态）
        console.log('⚠️ 热点缓存过期，后台刷新');
        this.loadHotspotsInBackground();
      } else {
        console.log(`✅ 热点缓存有效，剩余 ${Math.floor((thirtyMinutes - elapsed) / 60000)} 分钟`);
      }
    } catch (error) {
      console.error('❌ 检查缓存失败:', error);
      // 出错时尝试加载
      this.loadHotspots();
    }
  },

  // 后台加载热点（不显示加载状态）
  async loadHotspotsInBackground() {
    try {
      console.log('🔄 后台获取热点数据...');
      
      // 检查云开发是否初始化
      if (!wx.cloud) {
        console.error('❌ 云开发未初始化');
        return;
      }

      const res = await wx.cloud.callFunction({
        name: 'hotspot-miyucaicai',
        data: {},
        timeout: 60000
      });

      console.log('云函数返回结果:', res);

      if (res.result && res.result.data && res.result.data.hotspots) {
        const hotspots = res.result.data.hotspots || [];
        console.log(`✅ 后台获取到 ${hotspots.length} 条热点`);

        // 更新数据（不显示加载状态）
        this.setData({
          realtimeHotspots: hotspots,
          displayedHotspots: hotspots
        });

        // 更新缓存
        wx.setStorageSync('hotspot_cache', {
          hotspots: hotspots,
          fetchTime: new Date().toISOString()
        });

        console.log('✅ 热点后台更新成功');
      } else {
        console.warn('⚠️ 云函数返回数据格式异常:', res.result);
      }
    } catch (error) {
      console.warn('⚠️ 后台热点加载失败（不影响使用）:', error);
      console.error('错误详情:', {
        message: error.message,
        errMsg: error.errMsg,
        errCode: error.errCode
      });
      // 后台加载失败不显示错误提示，继续使用缓存
    }
  },

  // 加载热点数据（显示加载状态）
  async loadHotspots() {
    this.setData({ loadingHotspots: true });

    try {
      console.log('🔄 开始获取热点数据');
      
      // 检查云开发是否初始化
      if (!wx.cloud) {
        throw new Error('云开发未初始化，请检查 app.js 中的云开发配置');
      }

      const res = await wx.cloud.callFunction({
        name: 'hotspot-miyucaicai',
        data: {},
        timeout: 60000
      });

      console.log('✅ 云函数调用成功:', res);

      if (res.result && res.result.data && res.result.data.hotspots) {
        const hotspots = res.result.data.hotspots || [];
        console.log(`✅ 获取到 ${hotspots.length} 条热点`);

        this.setData({
          realtimeHotspots: hotspots,
          displayedHotspots: hotspots
        });

        // 更新缓存
        wx.setStorageSync('hotspot_cache', {
          hotspots: hotspots,
          fetchTime: new Date().toISOString()
        });

        wx.showToast({
          title: '热点更新成功',
          icon: 'success',
          duration: 1500
        });
      } else {
        throw new Error(res.result?.error || '云函数返回数据格式错误');
      }
    } catch (error) {
      console.error('❌ 加载热点失败:', error);
      console.error('错误详情:', {
        message: error.message,
        errMsg: error.errMsg,
        errCode: error.errCode
      });

      // 加载失败时，检查是否有缓存可用
      const hasCache = this.loadHotspotsFromStorage();

      if (!hasCache) {
        // 没有缓存，使用Mock数据
        this.loadMockHotspots();
      }

      wx.showModal({
        title: '热点加载失败',
        content: `错误信息: ${error.message || error.errMsg || '未知错误'}\n\n${hasCache ? '已使用缓存数据' : '已使用示例数据'}`,
        showCancel: true,
        confirmText: '重试',
        cancelText: '继续使用',
        success: (res) => {
          if (res.confirm) {
            this.loadHotspots();
          }
        }
      });
    } finally {
      this.setData({ loadingHotspots: false });
    }
  },

  // 刷新热点
  refreshHotspots() {
    this.loadHotspots();
  },

  // 选择分类
  selectCategory(e) {
    try {
      const category = e.currentTarget.dataset.category;
      
      // 设置选中的分类
      this.setData({ selectedCategory: category });
      
      // 根据分类筛选热点
      if (category === 'all') {
        this.setData({ displayedHotspots: this.data.realtimeHotspots });
      } else {
        const filtered = this.data.realtimeHotspots.filter(item =>
          item.category === category
        );
        this.setData({ displayedHotspots: filtered });
      }
      
      console.log('✅ 当前分类:', category, '热点数量:', this.data.displayedHotspots.length);
    } catch (error) {
      console.error('❌ 选择分类失败:', error);
    }
  },

  // 选择热点
  selectHotspot(e) {
    try {
      const hotspot = e.currentTarget.dataset.hotspot;
      this.setData({ selectedHotspot: hotspot });
      console.log('✅ 选择热点:', hotspot);
    } catch (error) {
      console.error('❌ 选择热点失败:', error);
    }
  },

  // 进入步骤2
  goToStep2() {
    if (!this.data.selectedHotspot) {
      wx.showToast({
        title: '请先选择热点',
        icon: 'none'
      });
      return;
    }
    this.setData({ currentStep: 2 });
    console.log('✅ 进入步骤2');
  },

  // 返回步骤1
  backToStep1() {
    this.setData({ currentStep: 1 });
    console.log('✅ 返回步骤1');
  },

  // 选择创作类型
  selectCreationType(e) {
    try {
      const type = e.currentTarget.dataset.type;
      this.setData({ creationType: type });
      console.log('✅ 选择创作类型:', type);
    } catch (error) {
      console.error('❌ 选择创作类型失败:', error);
    }
  },

  // 风格选择
  onStyleChange(e) {
    this.setData({ styleIndex: e.detail.value });
  },

  // 长度选择
  onLengthChange(e) {
    this.setData({ lengthIndex: e.detail.value });
  },

  // 平台选择
  onPlatformChange(e) {
    this.setData({ platformIndex: e.detail.value });
  },

  // 额外需求输入
  onAdditionalInput(e) {
    this.setData({ additionalRequirements: e.detail.value });
  },

  // 生成内容
  async generateContent() {
    if (!this.data.creationType) {
      wx.showToast({
        title: '请选择创作类型',
        icon: 'none'
      });
      return;
    }

    // 检查积分
    if (this.data.userCredits.dailyUsed >= this.data.userCredits.dailyQuota) {
      wx.showModal({
        title: '积分不足',
        content: '今日免费额度已用完，是否使用金币继续？',
        success: (res) => {
          if (res.confirm) {
            this.doGenerateContent();
          }
        }
      });
      return;
    }

    this.doGenerateContent();
  },

  // 执行内容生成
  async doGenerateContent() {
    this.setData({ 
      generating: true,
      loadingText: '🎯 正在分析热点内容...'
    });

    try {
      console.log('🔄 开始生成内容');
      
      // 模拟分析阶段
      await this.delay(1000);
      this.setData({ loadingText: '💡 正在构思创作思路...' });
      
      // 构建提示词
      const prompt = this.buildPrompt();
      console.log('✅ 提示词构建完成');
      
      await this.delay(800);
      this.setData({ loadingText: '✍️ AI正在创作内容...' });
      
      // 调用 GLM-4.7-Flash 模型
      const content = await this.callGLMAPI(prompt);
      console.log('✅ 内容生成成功');
      
      this.setData({ loadingText: '✅ 内容生成完成！' });
      await this.delay(500);
      
      // 更新积分
      const credits = this.data.userCredits;
      credits.dailyUsed += 1;
      wx.setStorageSync('user_credits', credits);
      
      // 保存到创作历史
      this.saveToHistory({
        hotspot: this.data.selectedHotspot,
        type: this.data.creationType,
        content: content,
        style: this.data.styleOptions[this.data.styleIndex],
        length: this.data.lengthOptions[this.data.lengthIndex],
        platform: this.data.platformOptions[this.data.platformIndex]
      });
      
      this.setData({
        generatedContent: content,
        currentStep: 3,
        userCredits: credits
      });

      wx.showToast({
        title: '生成成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('❌ 生成内容失败:', error);
      wx.showModal({
        title: '生成失败',
        content: error.message || '请稍后重试',
        showCancel: true,
        confirmText: '重试',
        success: (res) => {
          if (res.confirm) {
            this.doGenerateContent();
          }
        }
      });
    } finally {
      this.setData({ generating: false });
    }
  },

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 构建提示词
  buildPrompt() {
    const { selectedHotspot, creationType, styleOptions, styleIndex, 
            lengthOptions, lengthIndex, platformOptions, platformIndex,
            additionalRequirements } = this.data;

    const hotspotTitle = selectedHotspot.title || selectedHotspot.name;
    const style = styleOptions[styleIndex];
    const length = lengthOptions[lengthIndex];
    const platform = platformOptions[platformIndex];

    let typePrompt = '';
    switch (creationType) {
      case 'article':
        typePrompt = '撰写一篇深度文章';
        break;
      case 'post':
        typePrompt = '撰写一篇短文快讯';
        break;
      case 'video-script':
        typePrompt = '撰写一个短视频脚本';
        break;
    }

    const prompt = `你是一位专业的自媒体内容创作者。

【创作任务】
${typePrompt}

【热点主题】
${hotspotTitle}

【创作要求】
- 内容风格：${style}
- 内容长度：${length}
- 目标平台：${platform}
${additionalRequirements ? `- 补充需求：${additionalRequirements}` : ''}

【输出要求】
1. 标题要吸引眼球，符合平台特点
2. 内容结构清晰，逻辑连贯
3. 语言生动，易于传播
4. 适当加入热点标签和关键词
5. 符合目标平台的内容规范

请直接输出创作内容，不要有多余的说明。`;

    return prompt;
  },

  // 调用 GLM API
  async callGLMAPI(prompt) {
    const { apiKey, endpoint, model } = this.data.glmConfig;

    return new Promise((resolve, reject) => {
      console.log('🔄 调用 GLM API...');
      
      wx.request({
        url: endpoint,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        },
        success: (res) => {
          console.log('✅ GLM API 调用成功:', res);
          
          if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
            const content = res.data.choices[0].message.content;
            resolve(content);
          } else {
            console.error('❌ API返回数据格式错误:', res);
            reject(new Error('API返回数据格式错误'));
          }
        },
        fail: (error) => {
          console.error('❌ GLM API 调用失败:', error);
          reject(new Error('API调用失败: ' + error.errMsg));
        }
      });
    });
  },

  // 返回步骤2
  backToStep2() {
    this.setData({ currentStep: 2 });
  },

  // 重新生成
  regenerateContent() {
    this.setData({ currentStep: 2 });
    this.doGenerateContent();
  },

  // 复制内容
  copyContent() {
    wx.setClipboardData({
      data: this.data.generatedContent,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 优化内容
  async optimizeContent(e) {
    const type = e.currentTarget.dataset.type;
    
    wx.showToast({
      title: '优化功能开发中',
      icon: 'none'
    });
  },

  // 切换发布平台
  togglePlatform(e) {
    const id = e.currentTarget.dataset.id;
    const platforms = this.data.publishPlatforms.map(p => {
      if (p.id === id) {
        p.selected = !p.selected;
      }
      return p;
    });
    this.setData({ publishPlatforms: platforms });
  },

  // 保存草稿
  saveContent() {
    try {
      const draft = {
        id: Date.now(),
        hotspot: this.data.selectedHotspot,
        type: this.data.creationType,
        content: this.data.generatedContent,
        style: this.data.styleOptions[this.data.styleIndex],
        length: this.data.lengthOptions[this.data.lengthIndex],
        platform: this.data.platformOptions[this.data.platformIndex],
        createTime: new Date().toISOString(),
        status: 'draft'
      };

      // 保存到本地存储
      const drafts = wx.getStorageSync('content_drafts') || [];
      drafts.unshift(draft);
      // 最多保存50个草稿
      if (drafts.length > 50) {
        drafts.pop();
      }
      wx.setStorageSync('content_drafts', drafts);

      wx.showToast({
        title: '已保存草稿',
        icon: 'success'
      });
      
      console.log('✅ 草稿保存成功');
    } catch (error) {
      console.error('❌ 保存草稿失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 保存到创作历史
  saveToHistory(data) {
    try {
      const history = {
        id: Date.now(),
        hotspot: data.hotspot,
        type: data.type,
        content: data.content,
        style: data.style,
        length: data.length,
        platform: data.platform,
        createTime: new Date().toISOString(),
        status: 'completed'
      };

      // 保存到本地存储
      const historyList = wx.getStorageSync('creation_history') || [];
      historyList.unshift(history);
      // 最多保存100条历史记录
      if (historyList.length > 100) {
        historyList.pop();
      }
      wx.setStorageSync('creation_history', historyList);
      
      console.log('✅ 创作历史已保存');
    } catch (error) {
      console.error('❌ 保存创作历史失败:', error);
    }
  },

  // 发布内容
  async publishContent() {
    const selectedPlatforms = this.data.publishPlatforms.filter(p => p.selected);
    
    if (selectedPlatforms.length === 0) {
      wx.showToast({
        title: '请选择发布平台',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      publishing: true,
      loadingText: '📤 正在发布到平台...'
    });

    try {
      // 保存到发布历史
      const publishRecord = {
        id: Date.now(),
        hotspot: this.data.selectedHotspot,
        type: this.data.creationType,
        content: this.data.generatedContent,
        style: this.data.styleOptions[this.data.styleIndex],
        length: this.data.lengthOptions[this.data.lengthIndex],
        platforms: selectedPlatforms.map(p => p.name),
        createTime: new Date().toISOString(),
        publishTime: new Date().toISOString(),
        status: 'published'
      };

      const publishHistory = wx.getStorageSync('publish_history') || [];
      publishHistory.unshift(publishRecord);
      if (publishHistory.length > 50) {
        publishHistory.pop();
      }
      wx.setStorageSync('publish_history', publishHistory);

      // TODO: 实现多平台发布功能
      await this.delay(2000);
      
      this.setData({ publishing: false });
      
      wx.showModal({
        title: '发布成功',
        content: `已发布到 ${selectedPlatforms.map(p => p.name).join('、')}`,
        showCancel: false,
        success: () => {
          // 返回首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });
      
      console.log('✅ 内容发布成功');
    } catch (error) {
      console.error('❌ 发布失败:', error);
      this.setData({ publishing: false });
      wx.showToast({
        title: '发布失败',
        icon: 'error'
      });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果无法返回，跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  },

  // 页面显示时
  onShow() {
    console.log('✅ 页面显示');
  },

  // 页面隐藏时
  onHide() {
    console.log('✅ 页面隐藏');
  },

  // 页面卸载时
  onUnload() {
    console.log('✅ 页面卸载');
  },

  // 页面错误处理
  onError(error) {
    console.error('❌ 页面错误:', error);
    this.showError('页面运行错误: ' + error);
  }
});