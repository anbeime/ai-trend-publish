// pages/hotspot/hotspot.js - 热点列表页面
Page({
  data: {
    hotspots: [],
    allHotspots: [], // 存储所有热点用于本地过滤
    loading: true,
    categories: ['全部', '科技', '生活', '娱乐', '美食', '旅行'],
    selectedCategory: '全部',
    sortBy: 'hot', // hot: 热度, fit: 适合度
    keyword: '', // 搜索关键词
    platform: '', // 平台筛选
    // === 热点缓存 ===
    lastHotspotFetch: null, // 最后获取热点的时间
    hotspotCacheValid: false, // 缓存是否有效（30分钟）
    refreshing: false, // 是否正在手动刷新
    cacheExpired: false, // 缓存是否已过期
    // === 新增功能 ===
    enableScoring: true, // 启用智能评分
    showDetailModal: false, // 显示详情弹窗
    selectedHotspot: null, // 选中的热点
  },

  onLoad(options) {
    // 获取URL参数
    if (options.keyword) {
      this.setData({ keyword: decodeURIComponent(options.keyword) });
    }
    if (options.platform) {
      this.setData({ platform: options.platform });
    }

    this.loadHotspots();
  },

  onShow() {
    // 检查热点缓存是否需要刷新
    this.checkHotspotCache();
  },

  // 检查热点缓存是否有效（30分钟）
  checkHotspotCache() {
    const lastFetch = this.data.lastHotspotFetch;
    if (!lastFetch) {
      // 从本地存储加载缓存
      this.loadHotspotsFromStorage();
      return;
    }

    // 计算时间差（毫秒）
    const now = Date.now();
    const elapsed = now - lastFetch.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (elapsed > thirtyMinutes) {
      console.log('热点缓存过期，尝试自动刷新');
      this.setData({ cacheExpired: true });
      // 静默刷新，不打扰用户
      this.loadHotspots(false);
    } else {
      console.log(
        `热点缓存有效，剩余 ${(thirtyMinutes - elapsed) / 60000} 分钟`
      );
      // 缓存有效，确保显示本地过滤数据
      this.applyFilters();
    }
  },

  // 加载热点列表（带缓存）
  async loadHotspots(showToast = true) {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      console.log('云开发未初始化，跳过热点加载');
      // 从本地存储加载缓存
      this.loadHotspotsFromStorage();
      return;
    }

    // 设置加载状态
    this.setData({ loading: true });

    try {
      console.log('开始获取热点数据');

      // 使用 Promise.race 实现超时控制（云函数自身有20秒限制）
      const cloudCall = wx.cloud.callFunction({
        name: 'hotspot-miyucaicai',
        data: {
          enableScoring: this.data.enableScoring, // 启用智能评分
        },
      });

      // 18秒超时（云函数20秒超时，留2秒余量）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), 18000);
      });

      const res = await Promise.race([cloudCall, timeoutPromise]);

      if (res.result && res.result.success) {
        const allHotspots = res.result.data || [];
        console.log(`获取到 ${allHotspots.length} 条热点`);

        // 保存原始数据
        this.setData({
          allHotspots: allHotspots,
          lastHotspotFetch: new Date(),
          hotspotCacheValid: true,
          cacheExpired: false,
        });

        // 应用筛选
        this.applyFilters();

        // 保存到本地存储
        this.saveHotspotsToStorage({
          hotspots: allHotspots,
          fetchTime: new Date().toISOString(),
        });

        if (showToast) {
          wx.showToast({
            title: '热点更新成功',
            icon: 'success',
            duration: 1500,
          });
        }
      } else {
        throw new Error(res.result?.error || '获取热点失败');
      }
    } catch (error) {
      console.error('加载热点失败:', error);
      this.setData({ loading: false });

      // 加载失败时，尝试从本地存储加载
      const hasCache = this.loadHotspotsFromStorage();

      if (showToast) {
        wx.showToast({
          title: hasCache ? '显示缓存数据' : '热点加载失败',
          icon: hasCache ? 'none' : 'error',
          duration: 5000,
        });
      }
    }
  },

  // 保存热点到本地存储
  saveHotspotsToStorage(data) {
    try {
      wx.setStorageSync('hotspot_cache', data);
      console.log('热点数据已保存到本地存储');
    } catch (error) {
      console.error('保存热点数据失败:', error);
    }
  },

  // 从本地存储加载热点
  loadHotspotsFromStorage() {
    try {
      const cached = wx.getStorageSync('hotspot_cache');
      if (cached && cached.hotspots && cached.hotspots.length > 0) {
        console.log('从本地存储加载热点:', cached.hotspots.length, '条');

        // 保存原始数据
        this.setData({
          allHotspots: cached.hotspots,
          lastHotspotFetch: new Date(cached.fetchTime),
          hotspotCacheValid: true,
        });

        // 应用筛选
        this.applyFilters();

        return true;
      }
      return false;
    } catch (error) {
      console.error('从本地存储加载热点失败:', error);
      return false;
    }
  },

  // 应用筛选条件（本地过滤）
  applyFilters() {
    let hotspots = this.data.allHotspots;

    // 根据平台筛选
    if (this.data.platform) {
      hotspots = hotspots.filter(item =>
        item.source.toLowerCase() === this.data.platform.toLowerCase()
      );
    }

    // 根据关键词筛选
    if (this.data.keyword) {
      const keyword = this.data.keyword.toLowerCase();
      hotspots = hotspots.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(keyword)
      );
    }

    // 先转换为页面需要的格式（包含自动分类）
    hotspots = hotspots.map((item, index) => {
      // 自动判断分类
      let category = item.category || '全部';
      if (category === '全部') {
        const title = (item.title || item.name || '').toLowerCase();
        const source = item.source || '';

        // 根据标题关键词判断分类
        if (title.includes('科技') || title.includes('ai') || title.includes('芯片') || title.includes('智能') || source.includes('科技')) {
          category = '科技';
        } else if (title.includes('美食') || title.includes('吃') || title.includes('餐厅') || title.includes('咖啡')) {
          category = '美食';
        } else if (title.includes('旅行') || title.includes('旅游') || title.includes('景点') || title.includes('户外')) {
          category = '旅行';
        } else if (title.includes('电影') || title.includes('电视剧') || title.includes('明星') || title.includes('综艺') || source.includes('娱乐') || source.includes('抖音')) {
          category = '娱乐';
        } else if (title.includes('生活') || title.includes('家居') || title.includes('健康') || title.includes('education')) {
          category = '生活';
        } else {
          // 默认分类
          category = '生活';
        }
      }

      // 确保分类在有效列表中
      const validCategories = ['科技', '生活', '娱乐', '美食', '旅行'];
      if (!validCategories.includes(category)) {
        category = '生活';
      }

      return {
        id: item.id || `hotspot_${index}`,
        title: item.title || item.name || '未知热点',
        hotScore: item.hotness || item.heat || 80,
        fitScore: item.fitScore || Math.floor(Math.random() * 20) + 80,
        category: category,
        tags: item.tags || [item.source],
        trend: item.trend || 'up',
        description: item.description || `来自${item.source}的热点`,
        suggestedAngles: item.suggestedAngles || ['热点解读', '创意改编', '话题讨论']
      };
    });

    console.log('after mapping, hotspots count:', hotspots.length);

    // 根据分类筛选（在转换之后）
    if (this.data.selectedCategory !== '全部') {
      hotspots = hotspots.filter(item =>
        item.category === this.data.selectedCategory
      );
      console.log('after category filter:', hotspots.length);
    }

    // 根据排序
    hotspots.sort((a, b) => {
      if (this.data.sortBy === 'hot') {
        return b.hotScore - a.hotScore;
      } else {
        return b.fitScore - a.fitScore;
      }
    });

    // 如果没有热点，使用模拟数据
    if (hotspots.length === 0) {
      console.warn('没有热点数据，使用模拟数据');
      hotspots = this.getMockHotspots();
      // 将模拟数据转换为相同格式
      hotspots = hotspots.map((item, index) => ({
        id: `mock_${index}`,
        title: item.title,
        hotScore: item.hotScore || 80,
        fitScore: item.fitScore || 85,
        category: item.category || '生活',
        tags: item.tags || ['模拟'],
        trend: item.trend || 'up',
        description: item.description,
        suggestedAngles: item.suggestedAngles || ['热点解读', '创意改编', '话题讨论']
      }));
    }

    console.log('final hotspots count:', hotspots.length);
    this.setData({ hotspots, loading: false });
  },

  // 切换分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category });
    // 本地过滤，不调用云函数
    this.applyFilters();
  },

  // 切换排序
  changeSortBy(e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({ sortBy });
    // 本地过滤，不调用云函数
    this.applyFilters();
  },

  // 创建视频
  createFromHotspot(e) {
    const hotspot = e.currentTarget.dataset.hotspot;

    wx.showModal({
      title: '选择创作角度',
      content: hotspot.suggestedAngles.map((angle, i) => `${i + 1}. ${angle}`).join('\n'),
      confirmText: '开始创作',
      success: (res) => {
        if (res.confirm) {
          // 使用正确的参数名 trend 和 reason，与 agents 页面期望的参数匹配
          wx.navigateTo({
            url: `/pages/agents/agents?trend=${encodeURIComponent(hotspot.title)}&reason=${encodeURIComponent(hotspot.description)}`
          });
        }
      }
    });
  },

  // 查看详情
  viewDetail(e) {
    const hotspot = e.currentTarget.dataset.hotspot;
    wx.showModal({
      title: hotspot.title,
      content: `${hotspot.description}\n\n建议角度：\n${hotspot.suggestedAngles.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
      confirmText: '立即创作',
      success: (res) => {
        if (res.confirm) {
          this.createFromHotspot(e);
        }
      }
    });
  },

  // 刷新列表
  onPullDownRefresh() {
    this.loadHotspots().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 手动刷新热点
  refreshHotspots() {
    console.log('手动刷新热点');
    this.setData({ refreshing: true });
    this.loadHotspots(true).then(() => {
      this.setData({ refreshing: false });
    });
  },

  // 获取备用热点数据
  getMockHotspots() {
    return [
      {
        title: '库迪宣布取消全场9.9元',
        description: '瑞幸、蜜雪冰城、奈雪的茶等纷纷收缩低价策略，中国咖啡价格战走到拐点了吗？',
        source: '知乎',
        hotScore: 95,
        fitScore: 88,
        category: '生活',
        tags: ['咖啡', '价格', '瑞幸', '库迪'],
        trend: 'up',
        suggestedAngles: ['市场分析', '消费者视角', '商业模式探讨']
      },
      {
        title: 'ChatGPT-5即将发布',
        description: 'OpenAI最新模型即将来袭，AI领域迎来新一轮竞争',
        source: '微博',
        hotScore: 92,
        fitScore: 85,
        category: '科技',
        tags: ['AI', 'OpenAI', 'GPT', '人工智能'],
        trend: 'up',
        suggestedAngles: ['功能介绍', '对比评测', '应用场景']
      },
      {
        title: '小米汽车SU7销量突破',
        description: '上市首月销量突破万台，新能源汽车市场竞争白热化',
        source: '新闻',
        hotScore: 89,
        fitScore: 90,
        category: '科技',
        tags: ['汽车', '小米', '新能源', '销量'],
        trend: 'up',
        suggestedAngles: ['产品分析', '市场对比', '用户评价']
      },
      {
        title: '大学生就业率创新低',
        description: '2024届毕业生就业形势严峻，灵活就业成为新趋势',
        source: '知乎',
        hotScore: 87,
        fitScore: 92,
        category: '生活',
        tags: ['就业', '大学生', '职场', '求职'],
        trend: 'up',
        suggestedAngles: ['求职技巧', '职场建议', '政策解读']
      },
      {
        title: '短剧市场爆发式增长',
        description: '微短剧成为新风口，创作者纷纷入局',
        source: '抖音',
        hotScore: 94,
        fitScore: 86,
        category: '娱乐',
        tags: ['短剧', '创作', '风口', '流量'],
        trend: 'up',
        suggestedAngles: ['创作技巧', '变现方式', '平台对比']
      },
      {
        title: 'AI视频工具快速迭代',
        description: 'Runway、Sora等AI视频工具竞相推出，视频创作迎来变革',
        source: '科技媒体',
        hotScore: 91,
        fitScore: 84,
        category: '科技',
        tags: ['AI', '视频', '工具', 'Runway', 'Sora'],
        trend: 'up',
        suggestedAngles: ['工具测评', '功能对比', '使用教程']
      },
      {
        title: '户外露营持续火热',
        description: '都市青年纷纷拥抱户外生活，露营装备热销',
        source: '小红书',
        hotScore: 85,
        fitScore: 89,
        category: '生活',
        tags: ['露营', '户外', '生活方式', '装备'],
        trend: 'up',
        suggestedAngles: ['装备推荐', '露营技巧', '场景分享']
      },
      {
        title: '数字人民币推广加速',
        description: '多个城市试点数字人民币，数字货币普及进入新阶段',
        source: '新闻',
        hotScore: 82,
        fitScore: 81,
        category: '科技',
        tags: ['数字人民币', '支付', '金融科技'],
        trend: 'up',
        suggestedAngles: ['政策解读', '应用场景', '用户体验']
      }
    ];
  },

  // === 新增功能：查看分析报告 ===
  async viewAnalysisReport() {
    const category = this.data.selectedCategory;
    const hotspots = this.data.allHotspots;
    
    if (hotspots.length === 0) {
      wx.showToast({
        title: '暂无热点数据',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '分析中，请稍候...' });
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'hotspot-analyzer',
        data: {
          hotspots: hotspots,
          category: category,
        }
      });
      
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        // 将报告数据存储到全局数据或本地存储
        const app = getApp();
        app.globalData.hotspotReport = res.result.report;
        
        // 跳转到分析报告页面
        wx.navigateTo({
          url: '/pages/hotspot-report/hotspot-report'
        });
      } else {
        wx.showToast({
          title: '分析失败，请重试',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('分析失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '分析失败，请重试',
        icon: 'error'
      });
    }
  },

  // 切换智能评分
  toggleScoring() {
    const enableScoring = !this.data.enableScoring;
    this.setData({ enableScoring });
    
    wx.showToast({
      title: enableScoring ? '已启用智能评分' : '已关闭智能评分',
      icon: 'none'
    });
    
    // 重新加载数据
    if (enableScoring) {
      this.refreshHotspots();
    }
  }
});
