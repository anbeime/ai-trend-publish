// pages/index/index.js - AI热点自动发布系统首页
const errorHandler = require("../../utils/error-handler.js");
const gamificationEngine = require("../../utils/gamification-engine.js");
const aiService = require("../../utils/ai-service.js");

// 预设热点数据（云函数调用失败时的后备数据）
const PRESET_HOTSPOTS = [
  {
    id: "preset-1",
    title: "AI视频生成工具更新",
    name: "AI视频生成工具更新",
    description: "最新的AI视频生成工具支持4K分辨率，创作效率大幅提升",
    hotness: 95,
    heat: 95,
    source: "科技",
    url: "",
    tags: ["AI", "视频", "科技"],
  },
  {
    id: "preset-2",
    title: "短视频创作技巧分享",
    name: "短视频创作技巧分享",
    description: "分享5个实用的短视频创作技巧，让你的视频更吸引人",
    hotness: 88,
    heat: 88,
    source: "生活",
    url: "",
    tags: ["创作", "技巧", "生活"],
  },
  {
    id: "preset-3",
    title: "新能源汽车市场分析",
    name: "新能源汽车市场分析",
    description: "2024年新能源汽车市场趋势分析，哪些品牌最受欢迎",
    hotness: 82,
    heat: 82,
    source: "科技",
    url: "",
    tags: ["新能源", "汽车", "科技"],
  },
  {
    id: "preset-4",
    title: "美食制作教程",
    name: "美食制作教程",
    description: "简单易学的家常菜制作教程，新手也能轻松上手",
    hotness: 90,
    heat: 90,
    source: "美食",
    url: "",
    tags: ["美食", "烹饪", "教程"],
  },
  {
    id: "preset-5",
    title: "旅行Vlog拍摄指南",
    name: "旅行Vlog拍摄指南",
    description: "如何拍摄出精彩的旅行Vlog？分享拍摄技巧和设备推荐",
    hotness: 85,
    heat: 85,
    source: "旅行",
    url: "",
    tags: ["旅行", "Vlog", "拍摄"],
  },
];

Page({
  data: {
    inputValue: "",
    userCredits: null,
    showMoreDrawer: false,
    showGuide: false,
    // === 健康打卡（轻量游戏化） ===
    healthStreak: 0,
    healthPoints: 0,
    todayChecked: false,
    // === 热点数据 ===
    realtimeHotspots: [],
    displayedHotspots: [],
    maxDisplayCount: 10,
    techHotspots: [],
    lifeHotspots: [],
    entertainmentHotspots: [],
    foodHotspots: [],
    loadingHotspots: false,
    lastHotspotFetch: null,
    hotspotCacheValid: false,
    selectedCategory: "all",
    suggestions: [
      {
        id: "suggestion-1",
        icon: "",
        title: "开头吸引人",
        desc: "基于热点标题设计15秒内的黄金开场",
        tags: ["开头", "创意"],
      },
      {
        id: "suggestion-2",
        icon: "",
        title: "标签优化",
        desc: "使用当前热点标签提升视频曝光率",
        tags: ["标签", "流量"],
      },
      {
        id: "suggestion-3",
        icon: "",
        title: "风格适配",
        desc: "根据热点类型选择最佳视频风格",
        tags: ["风格", "适配"],
      },
    ],
  },

  onLoad() {
    console.log("AI热点自动发布系统首页加载");
    this.setData({
      showMoreDrawer: false,
      showGuide: false,
    });
    this.initUserCredits();
    this.loadHealthData();

    // 优先从本地缓存加载热点
    const hasCache = this.loadHotspotsFromStorage();
    if (!hasCache) {
      this.loadHotspots();
    } else {
      this.checkHotspotCacheAndRefresh();
    }
  },

  onShow() {
    console.log("首页显示");
    this.setData({
      showMoreDrawer: false,
      showGuide: false,
    });
    this.getUserCredits();
    this.loadHealthData();

    // 检查缓存刷新
    const cached = wx.getStorageSync("hotspot_cache");
    if (cached && cached.fetchTime) {
      const fetchTime = new Date(cached.fetchTime);
      const elapsed = Date.now() - fetchTime.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      if (elapsed > thirtyMinutes) {
        this.loadHotspotsInBackground();
      }
    }
  },

  // === 健康打卡（与内容创作深度结合） ===
  loadHealthData() {
    const healthData = wx.getStorageSync('gamification_health');
    const today = new Date().toISOString().split('T')[0];
    const todayChecked = healthData && healthData.lastActiveDate === today;

    this.setData({
      healthStreak: healthData ? healthData.streak : 0,
      healthPoints: healthData ? healthData.totalPoints : 0,
      todayChecked: todayChecked,
    });
  },

  doHealthCheck() {
    let healthData = wx.getStorageSync('gamification_health');
    if (!healthData) {
      healthData = gamificationEngine.initUserData('health');
    }

    const today = new Date().toISOString().split('T')[0];
    if (healthData.lastActiveDate === today) {
      wx.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }

    // 打卡奖励：基础10分 + 连击加成
    const result = gamificationEngine.addPoints(healthData, 'health', 10, '每日健康打卡');
    wx.setStorageSync('gamification_health', healthData);

    this.setData({
      healthStreak: healthData.streak,
      healthPoints: healthData.totalPoints,
      todayChecked: true,
    });

    const msg = result.leveledUp
      ? `打卡成功！活力值+${result.pointsAdded}，已升级！`
      : `打卡成功！活力值+${result.pointsAdded}，连击${result.streak}天`;
    wx.showToast({ title: msg, icon: 'none', duration: 2000 });
  },

  goToHealth() {
    wx.navigateTo({ url: '/pages/health/health' });
  },

  // === 原有功能 ===
  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  handleCreateClick(e) {
    const inputValue = this.data.inputValue ? this.data.inputValue.trim() : "";
    if (!inputValue) {
      wx.showToast({ title: "请输入创作内容", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/pages/agents/agents?input=${encodeURIComponent(inputValue)}`,
    });
  },

  handleAgentsClick(e) {
    wx.navigateTo({ url: "/pages/agents/agents" });
  },

  handleTemplatesClick(e) {
    wx.navigateTo({ url: "/pages/templates/templates" });
  },

  handleProjectClick(e) {
    wx.navigateTo({ url: "/pages/project/project" });
  },

  openHotspotPage() {
    wx.navigateTo({ url: "/pages/hotspot/hotspot" });
  },

  // === 热点功能 ===
  checkHotspotCache() {
    const lastFetch = this.data.lastHotspotFetch;
    if (!lastFetch) return false;
    const now = Date.now();
    const elapsed = now - lastFetch.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    return elapsed <= thirtyMinutes;
  },

  checkHotspotCacheAndRefresh() {
    const lastFetch = this.data.lastHotspotFetch;
    if (!lastFetch) return;
    const now = Date.now();
    const elapsed = now - lastFetch.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    if (elapsed > thirtyMinutes) {
      this.loadHotspotsInBackground();
    }
  },

  async loadHotspotsInBackground() {
    try {
      const result = await aiService.fetchHotspots();
      if (result.success) {
        const allHotspots = result.data || [];
        const categorized = this.categorizeHotspots(allHotspots);
        this.setData({
          realtimeHotspots: allHotspots,
          displayedHotspots: allHotspots.slice(0, this.data.maxDisplayCount),
          ...categorized,
          lastHotspotFetch: new Date(),
          hotspotCacheValid: true,
        });
        this.saveHotspotsToStorage({
          hotspots: allHotspots,
          categories: categorized,
          fetchTime: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn("后台热点加载失败:", error);
    }
  },

  async loadHotspots() {
    this.setData({ loadingHotspots: true });
    try {
      const result = await aiService.fetchHotspots();
      if (result.success) {
        const allHotspots = result.data || [];
        const categorized = this.categorizeHotspots(allHotspots);
        this.setData({
          realtimeHotspots: allHotspots,
          displayedHotspots: allHotspots.slice(0, this.data.maxDisplayCount),
          ...categorized,
          loadingHotspots: false,
          lastHotspotFetch: new Date(),
          hotspotCacheValid: true,
        });
        this.saveHotspotsToStorage({
          hotspots: allHotspots,
          categories: categorized,
          fetchTime: new Date().toISOString(),
        });
        wx.showToast({ title: "热点更新成功", icon: "success", duration: 1500 });
      } else {
        throw new Error(result.error || "获取热点失败");
      }
    } catch (error) {
      console.error("加载热点失败:", error);
      this.setData({ loadingHotspots: false });
      const hasCache = this.loadHotspotsFromStorage();
      wx.showToast({
        title: hasCache ? "使用缓存数据" : "热点加载失败",
        icon: hasCache ? "none" : "error",
        duration: 3000,
      });
    }
  },

  categorizeHotspots(hotspots) {
    const keywordsMap = {
      tech: ["AI", "人工智能", "科技", "技术", "芯片", "半导体", "算力", "GLM", "CLAUDE", "OPENCODE", "鸿蒙", "智能"],
      life: ["生活", "技巧", "实用", "家居", "日常", "美食", "做饭", "菜谱", "旅行", "旅游"],
      entertainment: ["娱乐", "游戏", "音乐", "短剧", "vlog", "视频", "明星", "电影", "电视"],
      food: ["美食", "做饭", "烹饪", "菜谱", "料理", "餐厅", "探店", "外卖"],
    };
    const filterHotspots = (keywords) => {
      return hotspots
        .filter((hotspot) => {
          const text = `${hotspot.title || ""} ${hotspot.description || ""}`.toLowerCase();
          return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
        })
        .slice(0, 8);
    };
    return {
      techHotspots: filterHotspots(keywordsMap.tech),
      lifeHotspots: filterHotspots(keywordsMap.life),
      entertainmentHotspots: filterHotspots(keywordsMap.entertainment),
      foodHotspots: filterHotspots(keywordsMap.food),
    };
  },

  saveHotspotsToStorage(data) {
    try {
      wx.setStorageSync("hotspot_cache", data);
    } catch (error) {
      console.error("保存热点数据失败:", error);
    }
  },

  loadHotspotsFromStorage() {
    try {
      const cached = wx.getStorageSync("hotspot_cache");
      if (cached && cached.hotspots && cached.hotspots.length > 0) {
        this.setData({
          realtimeHotspots: cached.hotspots,
          displayedHotspots: cached.hotspots.slice(0, this.data.maxDisplayCount),
          ...cached.categories,
          lastHotspotFetch: new Date(cached.fetchTime),
          hotspotCacheValid: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("从本地存储加载热点失败:", error);
      return false;
    }
  },

  useHotspotForCreation(e) {
    const hotspot = e.currentTarget.dataset.hotspot;
    if (!hotspot) return;
    const hotspotParam = encodeURIComponent(JSON.stringify({
      id: hotspot.id,
      name: hotspot.title || hotspot.name,
      title: hotspot.title || hotspot.name,
      description: hotspot.description || hotspot.reason || "",
      source: hotspot.source || "",
      heat: hotspot.hotness || hotspot.heat || 0,
      category: hotspot.category || "",
    }));
    wx.navigateTo({ url: `/pages/agents/agents?hotspot=${hotspotParam}` });
  },

  goToContentCreatorWithHotspot(e) {
    const hotspot = e.currentTarget.dataset.hotspot;
    if (!hotspot) return;
    const hotspotParam = encodeURIComponent(JSON.stringify({
      id: hotspot.id,
      name: hotspot.title || hotspot.name,
      title: hotspot.title || hotspot.name,
      description: hotspot.description || hotspot.reason || "",
      source: hotspot.source || "",
      heat: hotspot.hotness || hotspot.heat || 0,
      category: hotspot.category || "",
    }));
    wx.navigateTo({ url: `/pages/content-creator/content-creator?hotspot=${hotspotParam}` });
  },

  openContentCreator() {
    wx.navigateTo({ url: "/pages/content-creator/content-creator" });
  },

  handlePublishClick() {
    const accounts = wx.getStorageSync('wechat_accounts') || [];
    if (accounts.length === 0) {
      wx.showModal({
        title: '尚未配置公众号',
        content: '需要先配置公众号才能发布内容，是否前往配置？',
        confirmText: '去配置',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/agents/wechat-accounts' });
          } else {
            wx.navigateTo({ url: '/pages/content-creator/content-creator' });
          }
        },
      });
    } else {
      wx.navigateTo({ url: '/pages/content-creator/content-creator' });
    }
  },

  openViralAnalyzer() {
    wx.navigateTo({ url: "/pages/viral-analyzer/viral-analyzer" });
  },

  refreshHotspots() {
    this.loadHotspots();
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    const categoryMapping = {
      tech: ["tech", "科技"],
      life: ["life", "生活"],
      entertainment: ["entertainment", "娱乐"],
      food: ["food", "美食"],
    };
    let displayedHotspots = [];
    if (category === "all") {
      displayedHotspots = this.data.realtimeHotspots.slice(0, this.data.maxDisplayCount);
    } else {
      const validCategories = categoryMapping[category] || [category];
      displayedHotspots = this.data.realtimeHotspots
        .filter((item) => validCategories.includes(item.category))
        .slice(0, this.data.maxDisplayCount);
    }
    this.setData({ selectedCategory: category, displayedHotspots });
  },

  applySuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    let inputValue = this.data.inputValue || "";
    switch (suggestion.id) {
      case "suggestion-1":
        inputValue = `请帮我在${Math.floor(Math.random() * 10 + 5)}秒内制作一个吸引人的开头，使用悬念式开场，抓住观众注意力`;
        break;
      case "suggestion-2":
        inputValue = `请根据当前热点优化视频标签，使用热门标签提升曝光率，建议包含：#热门 #推荐`;
        break;
      case "suggestion-3":
        inputValue = `请根据热点内容选择最佳视频风格，推荐使用：动漫/日系风格或现代写实风格`;
        break;
      default:
        inputValue = suggestion.desc || "";
    }
    this.setData({ inputValue });
    wx.showToast({ title: `已应用：${suggestion.title}`, icon: "none", duration: 2000 });
  },

  // 更多功能抽屉
  openMoreDrawer() { this.setData({ showMoreDrawer: true }); },
  closeMoreDrawer() { this.setData({ showMoreDrawer: false }); },
  navigateToAgentsFromDrawer() { wx.navigateTo({ url: "/pages/agents/agents" }); this.closeMoreDrawer(); },
  navigateToAgentUIFromDrawer() { wx.navigateTo({ url: "/pages/agent-ui/agent-ui" }); this.closeMoreDrawer(); },
  navigateToParamsFromDrawer() { wx.navigateTo({ url: "/pages/params/params" }); this.closeMoreDrawer(); },
  navigateToTemplatesFromDrawer() { wx.navigateTo({ url: "/pages/templates/templates" }); this.closeMoreDrawer(); },
  navigateToProjectFromDrawer() { wx.navigateTo({ url: "/pages/project/project" }); this.closeMoreDrawer(); },
  navigateToApiConfigFromDrawer() { wx.navigateTo({ url: "/pages/api-config/api-config" }); this.closeMoreDrawer(); },
  navigateToWechatAccounts() { wx.navigateTo({ url: "/pages/agents/wechat-accounts" }); this.closeMoreDrawer(); },
  navigateToCreationHistory() { wx.navigateTo({ url: "/pages/creation-history/creation-history" }); this.closeMoreDrawer(); },

  // 积分相关
  getDefaultCredits() {
    return {
      credits: 100, coins: 50, dailyQuota: 3, dailyUsed: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
      totalCreations: 0, level: 1, createTime: new Date().toISOString(),
    };
  },

  async initUserCredits() {
    // 使用本地存储替代云函数
    let credits = wx.getStorageSync('user_credits');
    if (!credits) {
      credits = this.getDefaultCredits();
      wx.setStorageSync('user_credits', credits);
    }
    this.setData({ userCredits: credits });
  },

  async getUserCredits() {
    // 使用本地存储替代云函数
    let credits = wx.getStorageSync('user_credits');
    if (credits) {
      // 检查是否需要重置每日额度
      const today = new Date().toISOString().split('T')[0];
      if (credits.lastResetDate !== today) {
        credits.dailyQuota = 3;
        credits.dailyUsed = 0;
        credits.lastResetDate = today;
        wx.setStorageSync('user_credits', credits);
      }
      this.setData({ userCredits: credits });
    }
  },

  showCreditsDetail() {
    const credits = this.data.userCredits;
    if (!credits) return;
    const content = `每日额度：${credits.dailyQuota - credits.dailyUsed}/${credits.dailyQuota} 次\n金币余额：${credits.coins} 个\n总创作数：${credits.totalCreations} 次`;
    wx.showModal({ title: "我的积分", content: content, showCancel: false });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'AI热点自动发布系统 - 热点采集 智能改写 多平台发布',
      path: '/pages/index/index',
    };
  },

  onShareTimeline() {
    return {
      title: 'AI热点自动发布系统 - 让创作更高效',
    };
  },
});
