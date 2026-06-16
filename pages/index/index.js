// pages/index/index.js - 热点整合版
const errorHandler = require("../../utils/error-handler.js");

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
    // === 热点数据 ===
    realtimeHotspots: [], // 所有热点
    displayedHotspots: [], // 当前显示的热点（首页限制显示数量）
    maxDisplayCount: 10, // 首页最多显示10条
    techHotspots: [], // 科技类热点
    lifeHotspots: [], // 生活类热点
    entertainmentHotspots: [], // 娱乐类热点
    foodHotspots: [], // 美食类热点
    loadingHotspots: false, // 热点加载中
    lastHotspotFetch: null, // 最后获取热点的时间
    hotspotCacheValid: false, // 缓存是否有效（30分钟）
    selectedCategory: "all", // 当前选中的分类
    suggestions: [
      // 创意建议
      {
        id: "suggestion-1",
        icon: "",
        title: "开头吸引人",
        desc: "基于热点标题设计15秒内的黄金开场",
        tags: ["开头", "创意"],
      },
      {
        id: "suggestion-2",
        icon: "🏷️️",
        title: "标签优化",
        desc: "使用当前热点标签提升视频曝光率",
        tags: ["标签", "流量"],
      },
      {
        id: "suggestion-3",
        icon: "📱",
        title: "风格适配",
        desc: "根据热点类型选择最佳视频风格",
        tags: ["风格", "适配"],
      },
    ],
  },

  onLoad() {
    console.log("首页加载");
    this.setData({
      showMoreDrawer: false,
      showGuide: false,
    });
    this.initUserCredits();

    // 优先从本地缓存加载热点（快速显示）
    const hasCache = this.loadHotspotsFromStorage();

    // 如果没有缓存，立即显示加载状态并从云函数获取
    if (!hasCache) {
      console.log("首次加载，从云函数获取热点数据");
      this.loadHotspots();
    } else {
      // 有缓存，检查是否需要后台刷新
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

    // 只在缓存过期时才后台刷新
    const cached = wx.getStorageSync("hotspot_cache");
    if (cached && cached.fetchTime) {
      const fetchTime = new Date(cached.fetchTime);
      const elapsed = Date.now() - fetchTime.getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (elapsed > thirtyMinutes) {
        console.log("onShow: 热点缓存过期，后台刷新");
        this.loadHotspotsInBackground();
      }
    }
  },

  // 输入框变化
  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 开始创作
  handleCreateClick(e) {
    const inputValue = this.data.inputValue ? this.data.inputValue.trim() : "";

    if (!inputValue) {
      wx.showToast({
        title: "请输入创作内容",
        icon: "none",
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/agents/agents?input=${encodeURIComponent(inputValue)}`,
    });
  },

  // 智能体协作
  handleAgentsClick(e) {
    console.log("点击智能体协作");
    wx.navigateTo({
      url: "/pages/agents/agents",
    });
  },

  // 模板库
  handleTemplatesClick(e) {
    console.log("点击模板库");
    wx.navigateTo({
      url: "/pages/templates/templates",
    });
  },

  // 我的项目
  handleProjectClick(e) {
    console.log("点击我的项目");
    wx.navigateTo({
      url: "/pages/project/project",
    });
  },

  // 打开热点列表页面（查看全部热点）
  openHotspotPage() {
    console.log("打开热点列表");
    wx.navigateTo({
      url: "/pages/hotspot/hotspot",
    });
  },

  // === 热点功能 ===

  // 检查热点缓存是否有效（30分钟）
  checkHotspotCache() {
    const lastFetch = this.data.lastHotspotFetch;
    if (!lastFetch) {
      console.log("没有缓存时间记录");
      return false;
    }

    // 计算时间差（毫秒）
    const now = Date.now();
    const elapsed = now - lastFetch.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (elapsed > thirtyMinutes) {
      console.log("热点缓存过期，需要刷新");
      return false;
    } else {
      console.log(
        `热点缓存有效，剩余 ${Math.floor((thirtyMinutes - elapsed) / 60000)} 分钟`,
      );
      return true;
    }
  },

  // 检查缓存并在后台刷新（如果需要）
  checkHotspotCacheAndRefresh() {
    // 检查内存中的缓存状态
    const lastFetch = this.data.lastHotspotFetch;
    if (!lastFetch) {
      console.log("内存中没有缓存时间记录，跳过刷新检查");
      return;
    }

    // 检查缓存是否过期（30分钟）
    const now = Date.now();
    const elapsed = now - lastFetch.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (elapsed > thirtyMinutes) {
      // 缓存过期，后台刷新（不显示加载状态，避免影响用户体验）
      console.log("热点缓存过期，后台刷新");
      this.loadHotspotsInBackground();
    } else {
      console.log(
        `热点缓存有效，剩余 ${Math.floor((thirtyMinutes - elapsed) / 60000)} 分钟`,
      );
    }
  },

  // 后台加载热点（不显示加载状态）
  async loadHotspotsInBackground() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      console.log("云开发未初始化，跳过后台热点加载");
      return;
    }

    try {
      console.log("后台获取热点数据...");
      const res = await wx.cloud.callFunction({
        name: "hotspot-miyucaicai",
        data: {},
        timeout: 60000, // 增加超时时间到60秒
      });

      if (res.result && res.result.success) {
        const allHotspots = res.result.data || [];
        console.log(`后台获取到 ${allHotspots.length} 条热点`);

        // 分类热点
        const categorized = this.categorizeHotspots(allHotspots);

        // 更新数据（不显示加载状态）
        this.setData({
          realtimeHotspots: allHotspots,
          displayedHotspots: allHotspots.slice(0, this.data.maxDisplayCount),
          ...categorized,
          lastHotspotFetch: new Date(),
          hotspotCacheValid: true,
        });

        // 保存到本地存储
        this.saveHotspotsToStorage({
          hotspots: allHotspots,
          categories: categorized,
          fetchTime: new Date().toISOString(),
        });

        console.log("✅ 热点后台更新成功");
      }
    } catch (error) {
      console.warn("后台热点加载失败（不影响使用）:", error);
      // 后台加载失败不显示错误提示，继续使用缓存
    }
  },

  // 加载热点数据（带缓存）
  async loadHotspots() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      console.log("云开发未初始化，跳过热点加载");
      return;
    }

    // 设置加载状态
    this.setData({ loadingHotspots: true });

    try {
      console.log("开始获取热点数据", new Date().toLocaleTimeString());
      const startTime = Date.now();

      const res = await wx.cloud.callFunction({
        name: "hotspot-miyucaicai",
        data: {},
        timeout: 60000, // 增加超时时间到60秒
      });

      const endTime = Date.now();
      console.log(`云函数调用完成，耗时：${endTime - startTime}ms`);

      if (res.result && res.result.success) {
        const allHotspots = res.result.data || [];
        console.log(`获取到 ${allHotspots.length} 条热点`);
        console.log(
          `数据来源: ${res.result.fromCache ? "云函数缓存" : "最新数据"}`,
        );
        if (res.result.fast) {
          console.log(`⚡ 快速响应: 使用云数据库缓存`);
        }
        console.log(`缓存时间戳: ${res.result.timestamp}`);

        // 分类热点
        const categorized = this.categorizeHotspots(allHotspots);

        // 更新数据
        this.setData({
          realtimeHotspots: allHotspots,
          displayedHotspots: allHotspots.slice(0, this.data.maxDisplayCount), // 首页只显示前10条
          ...categorized,
          loadingHotspots: false,
          lastHotspotFetch: new Date(),
          hotspotCacheValid: true,
        });

        // 保存到本地存储
        this.saveHotspotsToStorage({
          hotspots: allHotspots,
          categories: categorized,
          fetchTime: new Date().toISOString(),
        });

        wx.showToast({
          title: "热点更新成功",
          icon: "success",
          duration: 1500,
        });
      } else {
        throw new Error(res.result?.error || "获取热点失败");
      }
    } catch (error) {
      console.error("加载热点失败:", error);
      this.setData({ loadingHotspots: false });

      // 判断是否是超时错误
      if (error.message && error.message.includes("timeout")) {
        console.warn("检测到超时错误，建议：");
        console.warn("1. 检查网络连接");
        console.warn("2. 重新部署云函数：tcb fn deploy hotspot-miyucaicai");
        console.warn("3. 云函数配置 timeout 应 >= 20 秒");
        console.warn("4. 使用本地缓存数据");
      }

      // 加载失败时，尝试从本地存储加载
      const hasCache = this.loadHotspotsFromStorage();

      wx.showToast({
        title: hasCache ? "使用缓存数据" : "热点加载失败",
        icon: hasCache ? "none" : "error",
        duration: 3000,
      });
    }
  },

  // 分类热点
  categorizeHotspots(hotspots) {
    const keywordsMap = {
      tech: [
        "AI",
        "人工智能",
        "科技",
        "技术",
        "芯片",
        "半导体",
        "算力",
        "GLM",
        "CLAUDE",
        "OPENCODE",
        "鸿蒙",
        "智能",
      ],
      life: [
        "生活",
        "技巧",
        "实用",
        "家居",
        "日常",
        "美食",
        "做饭",
        "菜谱",
        "旅行",
        "旅游",
      ],
      entertainment: [
        "娱乐",
        "游戏",
        "音乐",
        "短剧",
        "vlog",
        "视频",
        "明星",
        "电影",
        "电视",
      ],
      food: ["美食", "做饭", "烹饪", "菜谱", "料理", "餐厅", "探店", "外卖"],
    };

    const filterHotspots = (keywords) => {
      return hotspots
        .filter((hotspot) => {
          const text =
            `${hotspot.title || ""} ${hotspot.description || ""}`.toLowerCase();
          return keywords.some((keyword) =>
            text.includes(keyword.toLowerCase()),
          );
        })
        .slice(0, 8); // 每类最多8条
    };

    return {
      techHotspots: filterHotspots(keywordsMap.tech),
      lifeHotspots: filterHotspots(keywordsMap.life),
      entertainmentHotspots: filterHotspots(keywordsMap.entertainment),
      foodHotspots: filterHotspots(keywordsMap.food),
    };
  },

  // 保存热点到本地存储
  saveHotspotsToStorage(data) {
    try {
      wx.setStorageSync("hotspot_cache", data);
      console.log("热点数据已保存到本地存储");
    } catch (error) {
      console.error("保存热点数据失败:", error);
    }
  },

  // 从本地存储加载热点
  loadHotspotsFromStorage() {
    try {
      const cached = wx.getStorageSync("hotspot_cache");
      if (cached && cached.hotspots && cached.hotspots.length > 0) {
        console.log("从本地存储加载热点:", cached.hotspots.length, "条");

        this.setData({
          realtimeHotspots: cached.hotspots,
          displayedHotspots: cached.hotspots.slice(
            0,
            this.data.maxDisplayCount,
          ), // 首页只显示前10条
          ...cached.categories,
          lastHotspotFetch: new Date(cached.fetchTime),
          hotspotCacheValid: true,
        });

        return true; // 返回成功
      }

      console.log("本地存储中没有缓存热点");
      return false; // 返回失败
    } catch (error) {
      console.error("从本地存储加载热点失败:", error);
      return false; // 返回失败
    }
  },

  // 点击使用热点 - 跳转到agents页面
  useHotspotForCreation(e) {
    const hotspot = e.currentTarget.dataset.hotspot;

    if (!hotspot) {
      console.warn("热点数据为空");
      return;
    }

    console.log("选择热点，跳转到agents页面:", hotspot);

    // 将热点对象转换为URL参数
    const hotspotParam = encodeURIComponent(
      JSON.stringify({
        id: hotspot.id,
        name: hotspot.title || hotspot.name,
        title: hotspot.title || hotspot.name,
        description: hotspot.description || hotspot.reason || "",
        source: hotspot.source || "",
        heat: hotspot.hotness || hotspot.heat || 0,
        category: hotspot.category || "",
      }),
    );

    // 跳转到agents页面，携带热点参数
    wx.navigateTo({
      url: `/pages/agents/agents?hotspot=${hotspotParam}`,
    });
  },

  // 点击热点跳转到内容创作页面（带热点参数）
  goToContentCreatorWithHotspot(e) {
    const hotspot = e.currentTarget.dataset.hotspot;

    if (!hotspot) {
      console.warn("热点数据为空");
      return;
    }

    console.log("跳转到内容创作页面，携带热点:", hotspot);

    // 将热点对象转换为URL参数
    const hotspotParam = encodeURIComponent(
      JSON.stringify({
        id: hotspot.id,
        name: hotspot.title || hotspot.name,
        title: hotspot.title || hotspot.name,
        description: hotspot.description || hotspot.reason || "",
        source: hotspot.source || "",
        heat: hotspot.hotness || hotspot.heat || 0,
        category: hotspot.category || "",
      }),
    );

    wx.navigateTo({
      url: `/pages/content-creator/content-creator?hotspot=${hotspotParam}`,
    });
  },

  // 打开自媒体创作页面
  openContentCreator() {
    console.log("打开自媒体创作页面");
    wx.navigateTo({
      url: "/pages/content-creator/content-creator",
    });
  },

  // 刷新热点
  refreshHotspots() {
    console.log("手动刷新热点");
    this.loadHotspots();
  },

  // 切换分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    console.log("切换分类:", category);

    // 根据分类更新显示的热点
    let displayedHotspots = [];
    switch (category) {
      case "all":
        displayedHotspots = this.data.realtimeHotspots.slice(
          0,
          this.data.maxDisplayCount,
        );
        break;
      case "tech":
        displayedHotspots = this.data.techHotspots.slice(
          0,
          this.data.maxDisplayCount,
        );
        break;
      case "life":
        displayedHotspots = this.data.lifeHotspots.slice(
          0,
          this.data.maxDisplayCount,
        );
        break;
      case "entertainment":
        displayedHotspots = this.data.entertainmentHotspots.slice(
          0,
          this.data.maxDisplayCount,
        );
        break;
      case "food":
        displayedHotspots = this.data.foodHotspots.slice(
          0,
          this.data.maxDisplayCount,
        );
        break;
      default:
        displayedHotspots = this.data.realtimeHotspots.slice(
          0,
          this.data.maxDisplayCount,
        );
    }

    this.setData({
      selectedCategory: category,
      displayedHotspots: displayedHotspots,
    });
  },

  // 应用创意建议
  applySuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion;

    console.log("应用创意建议:", suggestion);

    // 根据建议类型设置输入值
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

    // 设置输入值
    this.setData({ inputValue });

    // 提示用户
    wx.showToast({
      title: `已应用：${suggestion.title}`,
      icon: "none",
      duration: 5000,
    });

    console.log("应用创意建议后的输入值:", inputValue);
  },

  // 视频播放相关方法（保留兼容性）
  toggleVideoPlay(e) {
    const templateId = e.currentTarget.dataset.template;
    const templates = this.data.inspirationTemplates;
    const updatedTemplates = templates.map((t) => ({
      ...t,
      playing: t.id === templateId ? !t.playing : false,
    }));
    this.setData({ inspirationTemplates: updatedTemplates });
  },

  onVideoEnded(e) {
    const templateId = e.currentTarget.dataset.template;
    const templates = this.data.inspirationTemplates;
    const updatedTemplates = templates.map((t) => ({
      ...t,
      playing: t.id === templateId ? false : t.playing,
    }));
    this.setData({ inspirationTemplates: updatedTemplates });
  },
  openHotspotPage() {
    console.log("打开热点列表");
    wx.navigateTo({
      url: "/pages/hotspot/hotspot",
    });
  },

  // 更多功能抽屉
  openMoreDrawer() {
    this.setData({ showMoreDrawer: true });
  },

  closeMoreDrawer() {
    this.setData({ showMoreDrawer: false });
  },

  navigateToAgentsFromDrawer() {
    wx.navigateTo({ url: "/pages/agents/agents" });
    this.closeMoreDrawer();
  },

  navigateToAgentUIFromDrawer() {
    wx.navigateTo({ url: "/pages/agent-ui/agent-ui" });
    this.closeMoreDrawer();
  },

  navigateToParamsFromDrawer() {
    wx.navigateTo({ url: "/pages/params/params" });
    this.closeMoreDrawer();
  },

  navigateToTemplatesFromDrawer() {
    wx.navigateTo({ url: "/pages/templates/templates" });
    this.closeMoreDrawer();
  },

  navigateToProjectFromDrawer() {
    wx.navigateTo({ url: "/pages/project/project" });
    this.closeMoreDrawer();
  },

  navigateToApiConfigFromDrawer() {
    wx.navigateTo({ url: "/pages/api-config/api-config" });
    this.closeMoreDrawer();
  },

  // 灵感模板
  useTemplate(e) {
    const template = e.currentTarget.dataset.template;
    wx.navigateTo({
      url: `/pages/agents/agents?template=${template.id}`,
    });
  },

  toggleVideoPlay(e) {
    const templateId = e.currentTarget.dataset.template;
    const templates = this.data.inspirationTemplates;
    const updatedTemplates = templates.map((t) => ({
      ...t,
      playing: t.id === templateId ? !t.playing : false,
    }));
    this.setData({ inspirationTemplates: updatedTemplates });
  },

  onVideoEnded(e) {
    const templateId = e.currentTarget.dataset.template;
    const templates = this.data.inspirationTemplates;
    const updatedTemplates = templates.map((t) => ({
      ...t,
      playing: t.id === templateId ? false : t.playing,
    }));
    this.setData({ inspirationTemplates: updatedTemplates });
  },

  // 积分相关
  getDefaultCredits() {
    return {
      credits: 100,
      coins: 50,
      dailyQuota: 3,
      dailyUsed: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
      totalCreations: 0,
      level: 1,
      createTime: new Date().toISOString(),
    };
  },

  async initUserCredits() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      this.setData({ userCredits: this.getDefaultCredits() });
      return;
    }

    try {
      const res = await wx.cloud.callFunction({
        name: "credit-manager",
        data: { action: "init" },
      });
      if (res.result && res.result.success) {
        this.setData({ userCredits: res.result.data });
      } else {
        this.setData({ userCredits: this.getDefaultCredits() });
      }
    } catch (error) {
      console.error("初始化积分失败:", error);
      this.setData({ userCredits: this.getDefaultCredits() });
    }
  },

  async getUserCredits() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      return;
    }

    try {
      const res = await wx.cloud.callFunction({
        name: "credit-manager",
        data: { action: "get" },
      });
      if (res.result && res.result.success) {
        this.setData({ userCredits: res.result.data });
      }
    } catch (error) {
      console.error("获取积分失败:", error);
    }
  },

  showCreditsDetail() {
    const credits = this.data.userCredits;
    if (!credits) return;

    const content = `每日额度：${credits.dailyQuota - credits.dailyUsed}/${credits.dailyQuota} 次\n金币余额：${credits.coins} 个\n总创作数：${credits.totalCreations} 次`;

    wx.showModal({
      title: "我的积分",
      content: content,
      showCancel: false,
    });
  },
});
