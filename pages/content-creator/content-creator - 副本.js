// pages/content-creator/content-creator.js - 集成多平台排版优化技能
const app = getApp();

// 引入排版优化工具
const { platformFormatter } = require("../../utils/platform-formatter.js");
const { contentOptimizer } = require("../../utils/content-optimizer.js");
const { imageService } = require("../../utils/image-service.js");
const trialManager = require("../agents/modules/trial-manager.js");

// 平台配置（扩展版）
const PLATFORM_CONFIG = {
  微信公众号: {
    algorithm: "订阅+推荐",
    userHabit: "深度阅读",
    features: ["长文深度", "图文并茂", "专业权威"],
    contentTips: "注重内容深度和专业性，适合长篇图文",
    maxLength: 2000,
    supportHTML: true,
    supportMarkdown: false,
    highlightColors: [
      "#fff3cd",
      "#d4edda",
      "#f8d7da",
      "#e8f4f8",
      "#f3e5f5",
      "#fff8e1",
    ],
  },
  小红书: {
    algorithm: "搜索+推荐双引擎",
    userHabit: "主动搜索 | 实用价值",
    features: ["关键词优化", "干货密度", "结构化"],
    contentTips: "标题需包含核心关键词，内容结构清晰，强调实用价值和解决方案",
    maxLength: 1000,
    supportHTML: false,
    supportMarkdown: false,
    emojiStyle: true,
  },
  知乎: {
    algorithm: "问答+推荐",
    userHabit: "深度思考",
    features: ["专业深度", "逻辑严谨", "数据支撑"],
    contentTips: "注重论证逻辑和专业性，适合深度分析和知识分享",
    maxLength: 3000,
    supportHTML: false,
    supportMarkdown: true,
  },
  抖音: {
    algorithm: "流量池赛马",
    userHabit: "被动浏览 | 情绪价值",
    features: ["3秒钩子", "高节奏", "情绪共鸣"],
    contentTips: "前3秒必须有强钩子，节奏紧凑，口语化表达，制造情绪价值",
    maxLength: 500,
    supportHTML: false,
    supportMarkdown: false,
    shortForm: true,
  },
  B站: {
    algorithm: "推荐+搜索",
    userHabit: "兴趣驱动",
    features: ["内容质量", "互动氛围", "系列化"],
    contentTips: "注重内容质量和创意，适合系列化内容和深度互动",
    maxLength: 2000,
    supportHTML: false,
    supportMarkdown: true,
    interactive: true,
  },
};

Page({
  data: {
    // 用户信息
    userCredits: null,

    // 流程步骤
    currentStep: 1,

    // 热点相关
    realtimeHotspots: [],
    displayedHotspots: [],
    selectedCategory: "all",
    selectedHotspot: null,
    loadingHotspots: false,

    // 错误状态
    pageError: false,
    errorMessage: "",

    // 创作类型
    creationType: "",

    // 创作参数
    styleOptions: ["专业严谨", "轻松幽默", "情感共鸣", "干货实用", "故事叙述"],
    styleIndex: 0,
    lengthOptions: [
      "短篇(300字)",
      "中篇(800字)",
      "长篇(1500字)",
      "超长(3000字)",
    ],
    lengthIndex: 1,
    platformOptions: ["微信公众号", "小红书", "知乎", "抖音", "B站"],
    platformIndex: 0,

    // 平台特性配置（使用扩展配置）
    platformConfig: PLATFORM_CONFIG,

    // 排版优化相关
    showFormatOptions: false, // 显示排版选项
    showTitleOptimizer: false, // 显示标题优化
    showQualityAnalyzer: false, // 显示质量分析
    showMultiPlatform: false, // 显示多平台预览
    formatOptions: {
      useHTML: true, // 使用HTML排版（公众号）
      addHighlight: true, // 添加高亮
      addEmoji: true, // 添加Emoji
      optimizeTitle: true, // 优化标题
      addStructure: true, // 添加结构化标记
    },
    optimizedTitles: [], // 优化后的标题列表
    selectedTitleIndex: 0, // 选中的标题索引

    // 内容质量分析
    contentQuality: null, // 内容质量分析结果
    seoRecommendations: [], // SEO优化建议

    // 多平台预览
    showMultiPlatform: false, // 显示多平台预览
    allPlatformContents: {}, // 所有平台的格式化内容

    // 图片相关
    showImagePanel: false, // 显示图片面板
    imageMode: "search", // 'search' | 'generate'
    searchedImages: [], // 搜索到的图片
    generatedImages: [], // AI生成的图片
    selectedImages: [], // 已选中的图片
    coverImage: null, // 封面图
    contentImages: [], // 内容配图
    imageLoading: false, // 图片加载中
    imageSearchQuery: "", // 图片搜索关键词
    imageGenerationPrompt: "", // 图片生成提示词
    imageSuggestions: [], // 智能配图建议
    currentPreviewPlatform: "微信公众号", // 当前预览平台

    // 弹窗控制
    showTitleOptimizer: false,
    showQualityAnalyzer: false,
    showFormatOptions: false,
    showArticleJSON: false,

    // 公众号文章JSON
    articleJSON: null,

    // 阻止冒泡
    preventBubble: function () {},

    // 额外需求
    additionalRequirements: "",

    // 生成状态
    generating: false,
    generatedContent: null, // 改为对象结构，包含title、content、tags等
    formattedContents: {}, // 各平台的格式化内容
    currentFormattedContent: "", // 当前显示的格式化内容
    currentFormattedHtml: "", // 当前平台的HTML格式内容
    showFormattedView: true, // 是否显示格式化视图
    showHtmlPreview: false, // 是否显示HTML预览
    loadingText: "",

    // 当前选择的平台信息
    selectedPlatformInfo: null,

    // 发布平台
    publishPlatforms: [
      { id: "wechat", name: "微信公众号", icon: "💬", selected: false },
      { id: "xiaohongshu", name: "小红书", icon: "📕", selected: false },
      { id: "zhihu", name: "知乎", icon: "🔵", selected: false },
      { id: "douyin", name: "抖音", icon: "🎵", selected: false },
      { id: "bilibili", name: "B站", icon: "📺", selected: false },
    ],
    publishing: false,
    
    // 当前选中的公众号
    currentWechatAccount: null,

    // GLM API配置
    glmConfig: {
      apiKey: "4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn",
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      model: "glm-4.7-flash",
    },

    // 页面状态标记（防止热重载错误）
    isPageAlive: true,
  },

  onLoad(options) {
    console.log("✅ 内容创作页面开始加载", options);

    try {
      // 初始化默认平台信息
      const defaultPlatform =
        this.data.platformOptions[this.data.platformIndex];
      const defaultPlatformInfo = this.data.platformConfig[defaultPlatform];
      this.setData({
        selectedPlatformInfo: defaultPlatformInfo,
      });

      // 从首页传入的热点
      if (options.hotspot) {
        try {
          const hotspot = JSON.parse(decodeURIComponent(options.hotspot));
          this.setData({
            selectedHotspot: hotspot,
            currentStep: 2,
          });
          console.log("✅ 成功解析传入的热点数据");
        } catch (e) {
          console.error("❌ 解析热点数据失败", e);
          this.showError("热点数据解析失败");
        }
      }

      // 初始化用户积分
      this.initUserCredits();

      // 优先从缓存加载（立即显示）
      const hasCache = this.loadHotspotsFromStorage();

      // 如果没有缓存，使用Mock数据防止白屏
      if (!hasCache) {
        console.log("⚠️ 没有缓存数据，加载Mock数据");
        this.loadMockHotspots();
      }

      // 然后检查是否需要刷新
      this.checkHotspotCacheAndRefresh();

      console.log("✅ 页面加载完成");
    } catch (error) {
      console.error("❌ 页面加载失败:", error);
      this.showError("页面初始化失败: " + error.message);
    }
  },

  // 显示错误信息
  showError(message) {
    console.error("显示错误:", message);
    this.setData({
      pageError: true,
      errorMessage: message,
    });
  },

  // 重试加载
  retryLoad() {
    console.log("🔄 重试加载页面");
    this.setData({
      pageError: false,
      errorMessage: "",
    });
    this.loadHotspots();
  },

  // 加载Mock数据（防止白屏）
  loadMockHotspots() {
    const mockHotspots = [
      {
        id: "mock_1",
        title: "2024年AI技术发展趋势",
        name: "2024年AI技术发展趋势",
        source: "科技资讯",
        category: "tech",
        hotness: 9850,
        heat: 9850,
        tags: ["AI", "科技", "趋势"],
      },
      {
        id: "mock_2",
        title: "健康生活方式指南",
        name: "健康生活方式指南",
        source: "健康频道",
        category: "life",
        hotness: 8760,
        heat: 8760,
        tags: ["健康", "生活", "养生"],
      },
      {
        id: "mock_3",
        title: "热门电影推荐榜单",
        name: "热门电影推荐榜单",
        source: "娱乐八卦",
        category: "entertainment",
        hotness: 7650,
        heat: 7650,
        tags: ["电影", "娱乐", "推荐"],
      },
      {
        id: "mock_4",
        title: "美食制作教程分享",
        name: "美食制作教程分享",
        source: "美食天地",
        category: "food",
        hotness: 6540,
        heat: 6540,
        tags: ["美食", "教程", "烹饪"],
      },
    ];

    this.setData({
      realtimeHotspots: mockHotspots,
      displayedHotspots: mockHotspots,
    });

    console.log("✅ Mock数据加载完成");
  },

  // 初始化用户积分
  initUserCredits() {
    try {
      const credits = wx.getStorageSync("user_credits") || {
        dailyQuota: 10,
        dailyUsed: 0,
        coins: 100,
      };
      this.setData({ userCredits: credits });
      console.log("✅ 用户积分初始化完成:", credits);
    } catch (error) {
      console.error("❌ 用户积分初始化失败:", error);
      // 使用默认值
      this.setData({
        userCredits: {
          dailyQuota: 10,
          dailyUsed: 0,
          coins: 100,
        },
      });
    }
  },

  // 从本地存储加载热点（立即显示）
  loadHotspotsFromStorage() {
    try {
      const cached = wx.getStorageSync("hotspot_cache");

      // 验证缓存数据完整性
      if (
        cached &&
        cached.hotspots &&
        Array.isArray(cached.hotspots) &&
        cached.hotspots.length > 0
      ) {
        // 验证每个热点数据的必要字段
        const validHotspots = cached.hotspots.filter(
          (item) => item && (item.title || item.name) && item.id,
        );

        if (validHotspots.length > 0) {
          console.log("✅ 从缓存加载热点:", validHotspots.length, "条");

          // 根据当前选中的分类筛选
          const category = this.data.selectedCategory;
          let displayedHotspots = validHotspots;

          if (category !== "all") {
            displayedHotspots = validHotspots.filter(
              (item) => item.category === category,
            );
            console.log(
              `📂 分类筛选: ${category}, 筛选出 ${displayedHotspots.length} 条`,
            );
          }

          this.setData({
            realtimeHotspots: validHotspots,
            displayedHotspots: displayedHotspots,
          });
          return true;
        } else {
          console.warn("⚠️ 缓存数据格式不正确");
          // 清除损坏的缓存
          wx.removeStorageSync("hotspot_cache");
          return false;
        }
      }

      console.log("⚠️ 本地存储中没有有效的缓存热点");
      return false;
    } catch (error) {
      console.error("❌ 从缓存加载热点失败:", error);
      // 清除可能损坏的缓存
      try {
        wx.removeStorageSync("hotspot_cache");
      } catch (e) {
        console.error("清除缓存失败:", e);
      }
      return false;
    }
  },

  // 检查缓存并智能刷新
  checkHotspotCacheAndRefresh() {
    try {
      const cached = wx.getStorageSync("hotspot_cache");

      if (!cached || !cached.fetchTime || !cached.hotspots) {
        // 没有缓存，立即加载（显示加载状态）
        console.log("⚠️ 没有热点缓存，立即加载");
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
        console.log("⚠️ 热点缓存过期，后台刷新");
        this.loadHotspotsInBackground();
      } else {
        console.log(
          `✅ 热点缓存有效，剩余 ${Math.floor((thirtyMinutes - elapsed) / 60000)} 分钟`,
        );
      }
    } catch (error) {
      console.error("❌ 检查缓存失败:", error);
      // 出错时尝试加载
      this.loadHotspots();
    }
  },

  // 后台加载热点（不显示加载状态）
  async loadHotspotsInBackground() {
    try {
      console.log("🔄 后台获取热点数据...");

      // 检查云开发是否初始化
      if (!wx.cloud) {
        console.error("❌ 云开发未初始化");
        return;
      }

      const res = await wx.cloud.callFunction({
        name: "hotspot-miyucaicai",
        data: {},
        timeout: 60000,
      });

      console.log("云函数返回结果:", res);

      // 兼容两种返回格式
      // 格式1: { result: { data: { hotspots: [...] } } }
      // 格式2: { result: { data: [...] } } (直接数组）
      let hotspots = [];
      if (res.result && res.result.data) {
        if (res.result.data.hotspots) {
          // 格式1
          hotspots = res.result.data.hotspots;
        } else if (Array.isArray(res.result.data)) {
          // 格式2
          hotspots = res.result.data;
        }
      }

      if (hotspots.length > 0) {
        console.log(`✅ 后台获取到 ${hotspots.length} 条热点`);

        // 更新数据（不显示加载状态）
        this.setData({
          realtimeHotspots: hotspots,
          displayedHotspots: hotspots,
        });

        // 更新缓存
        wx.setStorageSync("hotspot_cache", {
          hotspots: hotspots,
          fetchTime: new Date().toISOString(),
        });

        console.log("✅ 热点后台更新成功");
      } else {
        console.warn("⚠️ 云函数返回数据格式异常:", res.result);
      }
    } catch (error) {
      console.warn("⚠️ 后台热点加载失败（不影响使用）:", error);
      console.error("错误详情:", {
        message: error.message,
        errMsg: error.errMsg,
        errCode: error.errCode,
      });
      // 后台加载失败不显示错误提示，继续使用缓存
    }
  },

  // 加载热点数据（显示加载状态）
  async loadHotspots() {
    this.safeSetData({ loadingHotspots: true });

    try {
      console.log("🔄 开始获取热点数据");

      // 检查云开发是否初始化
      if (!wx.cloud) {
        throw new Error("云开发未初始化，请检查 app.js 中的云开发配置");
      }

      const res = await wx.cloud.callFunction({
        name: "hotspot-miyucaicai",
        data: {},
        timeout: 60000,
      });

      console.log("✅ 云函数调用成功:", res);

      // 兼容两种返回格式
      // 格式1: { result: { data: { hotspots: [...] } } }
      // 格式2: { result: { data: [...] } } (直接数组）
      let hotspots = [];
      if (res.result && res.result.data) {
        if (res.result.data.hotspots) {
          // 格式1
          hotspots = res.result.data.hotspots;
        } else if (Array.isArray(res.result.data)) {
          // 格式2
          hotspots = res.result.data;
        }
      }

      console.log(`✅ 获取到 ${hotspots.length} 条热点`);

      // 显示数据来源
      const fromCache = res.result && res.result.fromCache;
      const timestamp = res.result && res.result.timestamp;
      console.log(`📊 数据来源: ${fromCache ? "云函数缓存" : "最新数据"}`);
      if (timestamp) {
        console.log(`⏰ 数据时间: ${timestamp}`);
      }

      // 根据当前选中的分类筛选
      const category = this.data.selectedCategory;
      let displayedHotspots = hotspots;

      if (category !== "all") {
        displayedHotspots = hotspots.filter(
          (item) => item.category === category,
        );
        console.log(
          `📂 分类筛选: ${category}, 筛选出 ${displayedHotspots.length} 条`,
        );
      }

      this.safeSetData({
        realtimeHotspots: hotspots,
        displayedHotspots: displayedHotspots,
      });

      // 更新缓存
      wx.setStorageSync("hotspot_cache", {
        hotspots: hotspots,
        fetchTime: new Date().toISOString(),
      });

      wx.showToast({
        title: "热点更新成功",
        icon: "success",
        duration: 1500,
      });
    } catch (error) {
      console.error("❌ 加载热点失败:", error);
      console.error("错误详情:", {
        message: error.message,
        errMsg: error.errMsg,
        errCode: error.errCode,
      });

      // 加载失败时，检查是否有缓存可用
      const hasCache = this.loadHotspotsFromStorage();

      if (!hasCache) {
        // 没有缓存，使用Mock数据
        this.loadMockHotspots();
      }

      wx.showModal({
        title: "热点加载失败",
        content: `错误信息: ${error.message || error.errMsg || "未知错误"}\n\n${hasCache ? "已使用缓存数据" : "已使用示例数据"}`,
        showCancel: true,
        confirmText: "重试",
        cancelText: "继续使用",
        success: (res) => {
          if (res.confirm) {
            this.loadHotspots();
          }
        },
      });
    } finally {
      this.safeSetData({ loadingHotspots: false });
    }
  },

  // 刷新热点
  refreshHotspots() {
    this.loadHotspots();
  },

  // 选择分类（带防抖）
  selectCategory(e) {
    try {
      const category = e.currentTarget.dataset.category;

      console.log(`📂 点击分类: ${category}`);
      console.log(`📊 当前热点总数: ${this.data.realtimeHotspots.length}`);
      console.log(`🔍 当前选中的分类: ${this.data.selectedCategory}`);

      // 防止重复点击
      if (
        this.data.selectedCategory === category &&
        this.data._lastCategoryClick
      ) {
        console.log(`⚠️ 分类 ${category} 已被选中，跳过重复调用`);
        return;
      }

      // 记录点击时间戳
      this.setData({ _lastCategoryClick: Date.now() });

      // 打印前5个热点的分类信息
      console.log(
        "🔍 前5个热点的分类:",
        this.data.realtimeHotspots.slice(0, 5).map((h) => ({
          title: h.title,
          category: h.category,
        })),
      );

      // 中英文分类映射（兼容云函数缓存的中文分类）
      const categoryMapping = {
        tech: ["tech", "科技"],
        life: ["life", "生活"],
        entertainment: ["entertainment", "娱乐"],
        food: ["food", "美食"],
        travel: ["travel", "旅行"],
      };

      // 根据分类筛选热点（在setData前完成）
      let filtered = this.data.realtimeHotspots;
      if (category !== "all") {
        const validCategories = categoryMapping[category] || [category];
        filtered = this.data.realtimeHotspots.filter((item) =>
          validCategories.includes(item.category),
        );
        console.log(
          `✅ 筛选 ${category} 分类 (匹配: ${validCategories.join(", ")}) : ${filtered.length} 条`,
        );
      } else {
        console.log("✅ 显示全部热点:", this.data.realtimeHotspots.length);
      }

      console.log(`📦 筛选后将要设置的热点数: ${filtered.length}`);

      // 一次性设置所有数据
      this.setData(
        {
          selectedCategory: category,
          displayedHotspots: filtered,
        },
        () => {
          console.log(
            `✅ setData 完成，实际显示的热点数: ${this.data.displayedHotspots.length}`,
          );
        },
      );

      console.log(
        "✅ 当前分类:",
        category,
        "热点数量:",
        this.data.displayedHotspots.length,
      );
    } catch (error) {
      console.error("❌ 选择分类失败:", error);
    }
  },

  // 选择热点
  selectHotspot(e) {
    try {
      const hotspot = e.currentTarget.dataset.hotspot;
      this.setData({ selectedHotspot: hotspot });
      console.log("✅ 选择热点:", hotspot);
    } catch (error) {
      console.error("❌ 选择热点失败:", error);
    }
  },

  // 进入步骤2
  goToStep2() {
    if (!this.data.selectedHotspot) {
      wx.showToast({
        title: "请先选择热点",
        icon: "none",
      });
      return;
    }
    this.setData({ currentStep: 2 });
    console.log("✅ 进入步骤2");
  },

  // 返回步骤1
  backToStep1() {
    this.setData({ currentStep: 1 });
    console.log("✅ 返回步骤1");
  },

  // 选择创作类型
  selectCreationType(e) {
    try {
      const type = e.currentTarget.dataset.type;
      this.setData({ creationType: type });
      console.log("✅ 选择创作类型:", type);
    } catch (error) {
      console.error("❌ 选择创作类型失败:", error);
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
  /**
   * 切换混元AI生图配置
   */
  toggleHunyuanConfig(e) {
    const enabled = e.detail.value;
    this.setData({
      'hunyuanConfig.enabled': enabled
    });
    console.log('混元AI生图:', enabled ? '已启用' : '已禁用');
  },

  onPlatformChange(e) {
    const platformIndex = e.detail.value;
    const platformName = this.data.platformOptions[platformIndex];
    const platformInfo = this.data.platformConfig[platformName];

    this.setData({
      platformIndex: platformIndex,
      selectedPlatformInfo: platformInfo,
    });

    console.log("✅ 选择平台:", platformName, platformInfo);
  },

  // 额外需求输入
  onAdditionalInput(e) {
    this.setData({ additionalRequirements: e.detail.value });
  },

  // 生成内容
  async generateContent() {
    console.log("🚀 开始生成内容流程...");

    if (!this.data.creationType) {
      console.warn("⚠️ 未选择创作类型");
      wx.showToast({
        title: "请选择创作类型",
        icon: "none",
      });
      return;
    }

    // 检查积分
    if (this.data.userCredits.dailyUsed >= this.data.userCredits.dailyQuota) {
      console.warn("⚠️ 积分不足");
      wx.showModal({
        title: "积分不足",
        content: "今日免费额度已用完，是否使用金币继续？",
        success: (res) => {
          if (res.confirm) {
            this.doGenerateContent();
          }
        },
      });
      return;
    }

    console.log("✅ 开始执行生成任务");
    await this.doGenerateContent();
  },

  // 执行内容生成
  async doGenerateContent() {
    this.setData({
      generating: true,
      loadingText: "🎯 正在分析热点内容...",
    });

    try {
      console.log("🔄 开始生成内容");

      // 检查试用次数（异步）
      const canUse = await trialManager.checkAndConsume("内容生成");
      if (!canUse) {
        throw new Error("今日免费次数已用完");
      }

      // 模拟分析阶段
      await this.delay(1000);
      this.setData({ loadingText: "💡 正在构思创作思路..." });

      // 构建提示词
      const prompt = this.buildPrompt();
      console.log("✅ 提示词构建完成");

      await this.delay(800);
      this.setData({ loadingText: "✍️ AI正在创作内容..." });

      // 调用 GLM-4.7-Flash 模型
      const content = await this.callGLMAPI(prompt);
      console.log("✅ 内容生成成功:", content ? "有内容" : "无内容");

      this.safeSetData({ loadingText: "✅ 内容生成完成！" });
      await this.delay(500);

      // 验证生成的内容
      if (!content || (!content.content && typeof content !== "string")) {
        throw new Error("生成的内容为空，请重试");
      }

      console.log(
        "📦 生成的内容类型:",
        typeof content,
        "是否有标题:",
        !!content.title,
        "是否有content:",
        !!content.content,
      );
      
      // 详细日志：检查 content 字段的实际内容
      console.log("📦 content 字段详情:", {
        contentType: typeof content.content,
        contentIsString: typeof content.content === 'string',
        contentPreview: typeof content.content === 'string' 
          ? content.content.substring(0, 200) 
          : JSON.stringify(content.content).substring(0, 200),
        contentStartsWith: typeof content.content === 'string' 
          ? content.content.trim().substring(0, 10) 
          : 'not string',
      });

      // 生成各平台的格式化内容
      // 使用新的排版优化工具生成格式化内容
      const formattedContents = this.generateFormattedContentV2(content);
      console.log("✅ 已生成各平台格式化内容", Object.keys(formattedContents));
      
      // 打印每个平台的 HTML 长度
      Object.keys(formattedContents).forEach(platform => {
        const p = formattedContents[platform];
        console.log(`📊 ${platform}:`, {
          hasHtml: !!p.html,
          htmlLength: p.html?.length || 0,
          hasText: !!p.text,
          textLength: p.text?.length || 0,
        });
      });

      // 记录试用次数使用
      await trialManager.recordUsage();

      // 更新积分
      const credits = this.data.userCredits;
      credits.dailyUsed += 1;
      wx.setStorageSync("user_credits", credits);

      // 保存到创作历史（本地 + 云端）
      console.log("💾 开始保存创作历史...");
      let cloudSaveResult = null;

      try {
        const historyItem = {
          id: Date.now(),
          hotspot: {
            title:
              this.data.selectedHotspot?.title ||
              this.data.selectedHotspot?.name ||
              "创作内容",
            name:
              this.data.selectedHotspot?.title ||
              this.data.selectedHotspot?.name ||
              "创作内容",
          },
          type: this.data.creationType || "article",
          content: content,
          style: this.data.styleOptions[this.data.styleIndex],
          length: this.data.lengthOptions[this.data.lengthIndex],
          platform: this.data.platformOptions[this.data.platformIndex],
          createTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          status: "completed",
        };

        // 1. 保存到本地存储（作为备份）
        const historyList = wx.getStorageSync("creation_history") || [];
        historyList.unshift(historyItem);
        if (historyList.length > 100) historyList.pop();
        wx.setStorageSync("creation_history", historyList);
        console.log("✅ 本地备份完成，共", historyList.length, "条");

        // 2. 保存到云端（等待结果）
        cloudSaveResult = await this.saveToCloudHistory(historyItem);

        if (cloudSaveResult.success) {
          console.log("✅ 云端保存成功");
        } else {
          console.warn("⚠️ 云端保存失败:", cloudSaveResult.error);
        }
      } catch (saveError) {
        console.error("保存历史失败:", saveError);
      }

      console.log("🔄 设置步骤3，生成内容预览:", {
        hasTitle: !!content.title,
        hasContent: !!content.content,
        title: content.title?.substring(0, 50),
        contentLength: content.content?.length || 0,
      });

      // 处理 content 格式 - 确保 contentText 是字符串
      let contentText = content.content;
      if (typeof contentText === "object" && contentText !== null) {
        // 处理 JSON 格式的 content
        if (contentText.social_media_post) {
          contentText =
            contentText.social_media_post.description ||
            contentText.social_media_post.title ||
            JSON.stringify(contentText, null, 2);
        } else if (contentText.video_script) {
          if (contentText.video_script.shots) {
            contentText = contentText.video_script.shots
              .map((shot, i) => `【分镜${i + 1}】${shot.description || ""}`)
              .join("\n\n");
          } else {
            contentText = JSON.stringify(contentText, null, 2);
          }
        } else {
          contentText = JSON.stringify(contentText, null, 2);
        }
      }

      // 创建显示用的 content 对象
      const displayContent = {
        ...content,
        content: contentText,
      };

      // 获取当前选中平台的格式化内容
      const currentPlatform =
        this.data.platformOptions[this.data.platformIndex];
      const platformContent = formattedContents[currentPlatform];
      
      console.log("📊 平台内容详情:", {
        currentPlatform,
        hasPlatformContent: !!platformContent,
        platformContentKeys: platformContent ? Object.keys(platformContent) : [],
        hasHtml: !!platformContent?.html,
        htmlLength: platformContent?.html?.length || 0,
        hasText: !!platformContent?.text,
        textLength: platformContent?.text?.length || 0,
      });
      
      // 获取文本和HTML格式
      const formattedText = platformContent?.text || contentText;
      const formattedHtml = platformContent?.html || "";

      this.safeSetData(
        {
          generatedContent: displayContent,
          formattedContents: formattedContents,
          currentFormattedContent: formattedText,
          currentFormattedHtml: formattedHtml,
          currentStep: 3,
          userCredits: credits,
        },
        () => {
          console.log("✅ setData 回调执行完成");
          console.log("📊 当前数据状态:", {
            currentStep: this.data.currentStep,
            generatedContent: !!this.data.generatedContent,
            isPageAlive: this.data.isPageAlive,
          });
        },
      );

      console.log("✅ 跳转到步骤3，生成内容:", content ? "已设置" : "为空");

      wx.showToast({
        title: "生成成功",
        icon: "success",
      });
    } catch (error) {
      console.error("❌ 生成内容失败:", error);
      console.error("错误堆栈:", error.stack);

      wx.showModal({
        title: "生成失败",
        content: error.message || "请稍后重试",
        showCancel: true,
        confirmText: "重试",
        success: (res) => {
          if (res.confirm) {
            this.doGenerateContent();
          }
        },
      });
    } finally {
      this.safeSetData({ generating: false });
    }
  },

  // 延迟函数
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // 生成各平台的格式化内容
  generateFormattedContent(content) {
    const { title, content: body, tags, optimizationTips } = content;

    return {
      微信公众号: this.formatForWeChat(title, body, tags, optimizationTips),
      小红书: this.formatForXiaohongshu(title, body, tags, optimizationTips),
      知乎: this.formatForZhihu(title, body, tags, optimizationTips),
      抖音: this.formatForDouyin(title, body, tags, optimizationTips),
      B站: this.formatForBilibili(title, body, tags, optimizationTips),
    };
  },

  // 微信公众号格式化（优化版）
  formatForWeChat(title, body, tags, optimizationTips) {
    const tagStr = tags ? tags.map((t) => `#${t}`).join(" ") : "";
    const tips =
      optimizationTips && optimizationTips.length > 0
        ? optimizationTips.map((t, i) => `${i + 1}. ${t}`).join("\n")
        : "";

    return `${title}

${body}

${tagStr ? `\n相关标签：${tagStr}` : ""}${tips ? `\n\n💡 发布建议：\n${tips}` : ""}`;
  },

  // 小红书格式化（优化版）
  formatForXiaohongshu(title, body, tags, optimizationTips) {
    const tagStr = tags ? tags.map((t) => `#${t}`).join(" ") : "";

    // 将内容分段，每段添加emoji和空行
    const paragraphs = body.split("\n\n").filter((p) => p.trim());
    const formattedBody = paragraphs
      .map((p, index) => {
        const emojis = ["💡", "✨", "🔥", "📌", "💫"];
        const emoji = emojis[index % emojis.length];
        return `${emoji} ${p}\n\n`;
      })
      .join("");

    const tips =
      optimizationTips && optimizationTips.length > 0
        ? optimizationTips
            .slice(0, 3)
            .map((t) => `• ${t}`)
            .join("\n")
        : "";

    return `🔥 ${title}

${formattedBody}
${tagStr ? `\n${tagStr}` : ""}
${tips ? `\n\n💡 小贴士：\n${tips}` : ""}

✨ 喜欢就点赞收藏吧～`;
  },

  // 知乎格式化（优化版）
  formatForZhihu(title, body, tags, optimizationTips) {
    const tagStr = tags ? tags.map((t) => `#${t} `).join("") : "";

    // 知乎需要添加引号、引用等格式
    const formattedBody = body
      .split("\n\n")
      .map((p) => {
        if (p.includes("总结") || p.includes("结论")) {
          return `\n> **${p}**\n`;
        }
        return p + "\n";
      })
      .join("\n");

    const tips =
      optimizationTips && optimizationTips.length > 0
        ? optimizationTips.map((t, i) => `${i + 1}. ${t}`).join("\n")
        : "";

    return `### ${title}

---

${formattedBody}
---

${tagStr ? `相关话题：${tagStr}` : ""}${tips ? `\n\n**回答建议：**\n${tips}` : ""}`;
  },

  // 抖音格式化（优化版）
  formatForDouyin(title, body, tags, optimizationTips) {
    const tagStr = tags ? tags.map((t) => `#${t}`).join(" ") : "";

    // 抖音需要更口语化、添加节奏感
    const sentences = body.split(/[。！？\n]/).filter((s) => s.trim());
    const formattedBody = sentences
      .map((s, i) => {
        if (i % 2 === 0) {
          return `${s}，`;
        } else {
          return `${s}！\n\n`;
        }
      })
      .join("");

    const tips =
      optimizationTips && optimizationTips.length > 0
        ? optimizationTips
            .slice(0, 2)
            .map((t) => `• ${t}`)
            .join("\n")
        : "";

    return `📱 ${title}

${formattedBody}
${tagStr ? `${tagStr}\n\n` : ""}
${tips ? `💡 拍摄建议：\n${tips}` : ""}

👍 觉得有用记得点赞收藏～`;
  },

  // B站格式化（优化版）
  formatForBilibili(title, body, tags, optimizationTips) {
    const tagStr = tags ? tags.map((t) => `#${t}`).join(" ") : "";

    // B站需要更活泼、添加互动元素
    const formattedBody = body
      .split("\n\n")
      .map((p) => {
        return `📍 ${p}\n\n`;
      })
      .join("");

    const tips =
      optimizationTips && optimizationTips.length > 0
        ? optimizationTips.map((t, i) => `${i + 1}. ${t}`).join("\n")
        : "";

    return `【${title}】

${formattedBody}
${tagStr ? `\n相关标签：${tagStr}` : ""}
${tips ? `\n\n💡 UP主小贴士：\n${tips}` : ""}

🎉 觉得有用别忘了三连支持一下！`;
  },

  // 切换查看格式
  toggleFormatView() {
    this.setData({
      showFormattedView: !this.data.showFormattedView,
    });
  },

  // 切换平台格式
  switchPlatformFormat(e) {
    const platform = e.currentTarget.dataset.platform;
    const platformContent = this.data.formattedContents[platform];
    if (platformContent) {
      this.setData({
        currentFormattedContent: platformContent.text || platformContent,
        currentFormattedHtml: platformContent.html || "",
        platformIndex: this.data.platformOptions.indexOf(platform),
      });
    }
  },

  // ========== 多平台排版优化技能方法 ==========

  /**
   * 使用排版优化工具生成格式化内容
   * 返回完整的格式化对象（包含 html 和 text）
   */
  generateFormattedContentV2(content) {
    console.log("🔧 generateFormattedContentV2 输入:", {
      hasContent: !!content,
      contentType: typeof content,
      contentKeys: content ? Object.keys(content) : [],
      title: content?.title?.substring(0, 50),
      contentLength: typeof content?.content === 'string' ? content.content.length : 'not string',
    });
    
    try {
      // 提取内容 - 处理各种可能的格式
      let title = content.title;
      let body = content.content;
      let tags = content.tags || [];

      // 如果 content 是对象（包含 video_script 等），提取文本内容
      if (typeof body === "object" && body !== null) {
        // 处理 { video_script: {...}, social_media_post: {...} } 格式
        if (body.social_media_post) {
          title = title || body.social_media_post.title || "创作内容";
          body =
            body.social_media_post.description ||
            body.social_media_post.title ||
            JSON.stringify(body, null, 2);
          tags = body.social_media_post.hashtags || tags;
        } else if (body.video_script) {
          title = title || body.video_script.title || "视频脚本";
          // 将分镜转为文本
          if (
            body.video_script.shots &&
            Array.isArray(body.video_script.shots)
          ) {
            body = body.video_script.shots
              .map(
                (shot, i) =>
                  `【分镜${i + 1}】${shot.description || ""}\n${shot.AI_painting_prompt || ""}`,
              )
              .join("\n\n");
          } else {
            body = JSON.stringify(body, null, 2);
          }
        } else {
          // 其他对象格式，转为格式化文本
          body = JSON.stringify(body, null, 2);
        }
      }

      // 确保body是字符串
      if (typeof body !== "string") {
        body = String(body || "");
      }
      
      // 再次检查 body 是否是 JSON 字符串，需要提取实际内容
      const trimmedBody = body.trim();
      if (trimmedBody.startsWith('{') || trimmedBody.startsWith('[')) {
        try {
          const innerParsed = JSON.parse(trimmedBody);
          console.log("🔧 generateFormattedContentV2 检测到 body 是 JSON:", Object.keys(innerParsed));
          
          // 提取内层内容
          if (innerParsed.content && typeof innerParsed.content === 'string') {
            body = innerParsed.content;
          } else if (innerParsed.description) {
            body = innerParsed.description;
          } else if (innerParsed.text) {
            body = innerParsed.text;
          } else if (innerParsed.body) {
            body = innerParsed.body;
          } else if (typeof innerParsed === 'string') {
            body = innerParsed;
          }
          // 如果都没找到，保持原样
        } catch (e) {
          // 解析失败，不是JSON，保持原样
        }
      }

      // 构建格式化工具期望的数据结构
      const formatInput = {
        title: title || "创作内容",
        content: body,
        tags: Array.isArray(tags) ? tags : [],
        coverSuggestion: content.coverSuggestion || "",
        optimizationTips: content.optimizationTips || [],
      };

      console.log("格式化输入:", formatInput);

      // 使用 platformFormatter 进行智能格式化
      const allContents = platformFormatter.formatAll(formatInput, {
        useHtml: this.data.formatOptions.useHTML,
        highlight: this.data.formatOptions.addHighlight,
        addEmoji: this.data.formatOptions.addEmoji,
        addStructure: this.data.formatOptions.addStructure,
      });

      console.log("格式化结果:", allContents);

      return allContents;
    } catch (error) {
      console.error("排版优化失败:", error);
      // 降级处理 - 返回简单文本
      const fallbackContent = {
        title: content.title || "创作内容",
        content:
          typeof content.content === "string"
            ? content.content
            : JSON.stringify(content.content, null, 2),
        tags: content.tags || [],
      };
      return {
        微信公众号: { text: fallbackContent.content, html: null },
        小红书: { text: fallbackContent.content, html: null },
        知乎: { text: fallbackContent.content, html: null },
        抖音: { text: fallbackContent.content, html: null },
        B站: { text: fallbackContent.content, html: null },
      };
    }
  },

  /**
   * 切换排版选项面板显示
   */
  toggleFormatOptions() {
    this.setData({
      showFormatOptions: !this.data.showFormatOptions,
    });
  },

  /**
   * 切换排版选项
   */
  toggleFormatOption(e) {
    const option = e.currentTarget.dataset.option;
    const formatOptions = { ...this.data.formatOptions };
    formatOptions[option] = !formatOptions[option];

    this.setData({ formatOptions });

    // 如果修改了影响排版的选项，重新生成格式化内容
    if (
      ["useHTML", "addHighlight", "addEmoji", "addStructure"].includes(option)
    ) {
      this.regenerateFormattedContent();
    }
  },

  /**
   * 重新生成格式化内容
   */
  regenerateFormattedContent() {
    if (!this.data.generatedContent) return;

    try {
      const formatted = this.generateFormattedContent(
        this.data.generatedContent,
      );
      this.setData({
        "generatedContent.formattedContent": formatted,
      });
    } catch (error) {
      console.error("重新生成格式化内容失败:", error);
    }
  },

  /**
   * 优化标题
   */
  optimizeTitle() {
    const { generatedContent } = this.data;
    if (!generatedContent || !generatedContent.title) {
      wx.showToast({ title: "请先生成内容", icon: "none" });
      return;
    }

    try {
      const styles = ["number", "question", "contrast", "hot"];
      let allTitles = [];

      styles.forEach((style) => {
        const titles = contentOptimizer.optimizeTitle(
          generatedContent.title,
          style,
          {
            topic: generatedContent.tags?.[0] || generatedContent.title,
            target: this.getTargetAudience(),
          },
        );
        allTitles = allTitles.concat(titles);
      });

      // 按评分排序，取前5个
      allTitles = allTitles.sort((a, b) => b.score - a.score).slice(0, 5);

      this.setData({
        optimizedTitles: allTitles,
        showTitleOptimizer: true,
      });

      wx.showToast({ title: "已生成优化标题", icon: "success" });
    } catch (error) {
      console.error("标题优化失败:", error);
      wx.showToast({ title: "标题优化失败", icon: "none" });
    }
  },

  /**
   * 选择优化后的标题
   */
  selectOptimizedTitle(e) {
    const index = e.currentTarget.dataset.index;
    const selectedTitle = this.data.optimizedTitles[index];

    this.setData({
      "generatedContent.title": selectedTitle.title,
      selectedTitleIndex: index,
      showTitleOptimizer: false,
    });

    // 重新生成格式化内容
    this.regenerateFormattedContent();
  },

  /**
   * 分析内容质量
   */
  analyzeContentQuality() {
    const { generatedContent } = this.data;
    if (!generatedContent || !generatedContent.content) {
      wx.showToast({ title: "请先生成内容", icon: "none" });
      return;
    }

    try {
      // 质量检查
      const quality = contentOptimizer.checkQuality(generatedContent.content);

      // 结构分析
      const structure = contentOptimizer.optimizeStructure(
        generatedContent.content,
      );

      // SEO建议
      const seo = contentOptimizer.getSEORecommendations(
        generatedContent.content,
        generatedContent.tags?.[0] || "",
      );

      this.setData({
        contentQuality: {
          ...quality,
          structure,
          seo,
        },
        showQualityAnalyzer: true,
      });
    } catch (error) {
      console.error("质量分析失败:", error);
      wx.showToast({ title: "分析失败", icon: "none" });
    }
  },

  /**
   * 生成多平台预览
   */
  generateMultiPlatformPreview() {
    const { generatedContent } = this.data;
    if (!generatedContent) {
      wx.showToast({ title: "请先生成内容", icon: "none" });
      return;
    }

    try {
      const allContents = platformFormatter.formatAll(generatedContent, {
        useHtml: true,
        highlight: true,
        addEmoji: true,
        addStructure: true,
      });

      // 添加平台信息
      const enrichedContents = {};
      Object.keys(allContents).forEach((platform) => {
        const platformInfo = PLATFORM_CONFIG[platform];
        const content = allContents[platform];
        const lengthCheck = platformFormatter.checkLength(
          content.text,
          platform,
        );

        enrichedContents[platform] = {
          ...content,
          platformInfo,
          lengthCheck,
          preview: content.html || content.text.substring(0, 200) + "...",
        };
      });

      this.setData({
        allPlatformContents: enrichedContents,
        showMultiPlatform: true,
      });
    } catch (error) {
      console.error("多平台预览生成失败:", error);
      wx.showToast({ title: "生成失败", icon: "none" });
    }
  },

  /**
   * 切换排版选项面板
   */
  toggleFormatOptions() {
    this.setData({
      showFormatOptions: !this.data.showFormatOptions,
    });
  },

  /**
   * 切换排版选项
   */
  toggleFormatOption(e) {
    const option = e.currentTarget.dataset.option;
    const currentValue = this.data.formatOptions[option];

    this.setData({
      [`formatOptions.${option}`]: !currentValue,
    });

    // 如果有内容，重新生成
    if (this.data.generatedContent) {
      this.regenerateFormattedContent();
    }
  },

  /**
   * 重新生成格式化内容
   */
  regenerateFormattedContent() {
    const { generatedContent } = this.data;
    if (!generatedContent) return;

    const formattedContents = this.generateFormattedContentV2(generatedContent);
    const currentPlatform = this.data.platformOptions[this.data.platformIndex];
    const platformContent = formattedContents[currentPlatform];

    this.setData({
      formattedContents,
      currentFormattedContent: platformContent?.text || "",
      currentFormattedHtml: platformContent?.html || "",
    });
  },

  /**
   * 获取目标受众
   */
  getTargetAudience() {
    const platform = this.data.platformOptions[this.data.platformIndex];
    const audiences = {
      微信公众号: "职场人士",
      小红书: "年轻女性",
      知乎: "知识型用户",
      抖音: "泛娱乐用户",
      B站: "年轻群体",
    };
    return audiences[platform] || "普通用户";
  },

  /**
   * 复制HTML代码（公众号）
   */
  copyHTMLCode() {
    const { allPlatformContents } = this.data;
    const wechatContent = allPlatformContents["微信公众号"];

    if (wechatContent && wechatContent.html) {
      wx.setClipboardData({
        data: wechatContent.html,
        success: () => {
          wx.showToast({ title: "HTML代码已复制", icon: "success" });
        },
      });
    } else {
      wx.showToast({ title: "暂无HTML代码", icon: "none" });
    }
  },

  // ========== 图片搜索与AI生成方法 ==========

  /**
   * 打开图片面板
   */
  openImagePanel() {
    this.setData({
      showImagePanel: true,
      imageMode: "search",
    });

    // 如果有内容，生成配图建议
    if (this.data.generatedContent) {
      this.generateImageSuggestions();
    }
  },

  /**
   * 关闭图片面板
   */
  closeImagePanel() {
    this.setData({
      showImagePanel: false,
    });
  },

  /**
   * 切换图片模式
   */
  switchImageMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      imageMode: mode,
    });
  },

  /**
   * 生成智能配图建议
   */
  generateImageSuggestions() {
    const { generatedContent, platformOptions, platformIndex } = this.data;
    if (!generatedContent) return;

    const platform = platformOptions[platformIndex];
    const suggestions = imageService.getImageSuggestions(
      generatedContent.title + "\n" + generatedContent.content,
      platform,
    );

    this.setData({
      imageSuggestions: suggestions,
      imageSearchQuery: suggestions[0]?.keyword || generatedContent.title,
    });
  },

  /**
   * 搜索图片
   */
  async searchImages() {
    const { imageSearchQuery, platformOptions, platformIndex } = this.data;

    if (!imageSearchQuery.trim()) {
      wx.showToast({ title: "请输入搜索关键词", icon: "none" });
      return;
    }

    this.setData({ imageLoading: true });

    try {
      const platform = platformOptions[platformIndex];
      const images = await imageService.searchImages(imageSearchQuery, {
        platform,
        type: "inline",
        count: 6,
      });

      this.setData({
        searchedImages: images,
        imageLoading: false,
      });

      wx.showToast({ title: `找到${images.length}张图片`, icon: "success" });
    } catch (error) {
      console.error("搜索图片失败:", error);
      this.setData({ imageLoading: false });
      wx.showToast({ title: "搜索失败", icon: "none" });
    }
  },

  /**
   * AI生成图片
   */
  async generateImages() {
    const { imageGenerationPrompt, platformOptions, platformIndex } = this.data;

    if (!imageGenerationPrompt.trim()) {
      wx.showToast({ title: "请输入生成提示词", icon: "none" });
      return;
    }

    this.setData({ imageLoading: true });

    try {
      const platform = platformOptions[platformIndex];
      const result = await imageService.generateImage(imageGenerationPrompt, {
        platform,
        type: "inline",
        style: "realistic",
      });

      const newImages = [...this.data.generatedImages, result];

      this.setData({
        generatedImages: newImages,
        imageLoading: false,
      });

      wx.showToast({ title: "生成成功", icon: "success" });
    } catch (error) {
      console.error("生成图片失败:", error);
      this.setData({ imageLoading: false });
      wx.showToast({ title: "生成失败", icon: "none" });
    }
  },

  /**
   * 生成封面图
   */
  async generateCoverImage() {
    const { generatedContent, platformOptions, platformIndex } = this.data;

    if (!generatedContent) {
      wx.showToast({ title: "请先生成内容", icon: "none" });
      return;
    }

    this.setData({ imageLoading: true });

    try {
      const platform = platformOptions[platformIndex];
      const coverImage = await imageService.generateCoverImage(
        generatedContent.title,
        generatedContent.content,
        platform,
      );

      this.setData({
        coverImage,
        imageLoading: false,
      });

      wx.showToast({ title: "封面生成成功", icon: "success" });
    } catch (error) {
      console.error("生成封面失败:", error);
      this.setData({ imageLoading: false });
      wx.showToast({ title: "生成失败", icon: "none" });
    }
  },

  /**
   * 批量生成内容配图
   */
  async generateContentImages() {
    const { generatedContent, platformOptions, platformIndex } = this.data;

    if (!generatedContent) {
      wx.showToast({ title: "请先生成内容", icon: "none" });
      return;
    }

    this.setData({ imageLoading: true });

    try {
      const platform = platformOptions[platformIndex];
      const images = await imageService.generateContentImages(
        generatedContent.content,
        {
          platform,
          count: 3,
          generateType: "search",
        },
      );

      this.setData({
        contentImages: images,
        imageLoading: false,
      });

      wx.showToast({ title: `生成${images.length}张配图`, icon: "success" });
    } catch (error) {
      console.error("生成配图失败:", error);
      this.setData({ imageLoading: false });
      wx.showToast({ title: "生成失败", icon: "none" });
    }
  },

  /**
   * 选择图片
   */
  selectImage(e) {
    const { image, type } = e.currentTarget.dataset;
    const { selectedImages } = this.data;

    const index = selectedImages.findIndex((img) => img.id === image.id);

    if (index > -1) {
      // 取消选择
      selectedImages.splice(index, 1);
    } else {
      // 添加选择
      selectedImages.push({ ...image, selectType: type });
    }

    this.setData({ selectedImages });
  },

  /**
   * 更新搜索关键词
   */
  onImageSearchInput(e) {
    this.setData({
      imageSearchQuery: e.detail.value,
    });
  },

  /**
   * 更新生成提示词
   */
  onImagePromptInput(e) {
    this.setData({
      imageGenerationPrompt: e.detail.value,
    });
  },

  /**
   * 使用建议关键词搜索
   */
  useSuggestion(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData(
      {
        imageSearchQuery: keyword,
      },
      () => {
        this.searchImages();
      },
    );
  },

  /**
   * 插入图片到内容
   */
  insertImagesToContent() {
    const { selectedImages, generatedContent } = this.data;

    if (selectedImages.length === 0) {
      wx.showToast({ title: "请先选择图片", icon: "none" });
      return;
    }

    // 构建图片HTML/Markdown
    let imageContent = "\n\n";
    selectedImages.forEach((img) => {
      imageContent += `![${img.title || "配图"}](${img.url})\n\n`;
    });

    // 更新内容
    const updatedContent = generatedContent.content + imageContent;

    this.setData({
      "generatedContent.content": updatedContent,
      showImagePanel: false,
    });

    // 重新生成格式化内容
    this.regenerateFormattedContent();

    wx.showToast({ title: "图片已插入", icon: "success" });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    const allImages = [
      ...this.data.searchedImages,
      ...this.data.generatedImages,
      ...this.data.contentImages,
    ].map((img) => img.url);

    wx.previewImage({
      current: url,
      urls: allImages,
    });
  },

  /**
   * 下载图片
   */
  downloadImage(e) {
    const { url } = e.currentTarget.dataset;

    wx.downloadFile({
      url,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({ title: "保存成功", icon: "success" });
          },
          fail: () => {
            wx.showToast({ title: "保存失败", icon: "none" });
          },
        });
      },
      fail: () => {
        wx.showToast({ title: "下载失败", icon: "none" });
      },
    });
  },

  /**
   * 切换预览平台
   */
  switchPreviewPlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    this.setData({
      currentPreviewPlatform: platform,
    });
  },

  /**
   * 导出所有平台内容
   */
  exportAllPlatforms() {
    const { allPlatformContents } = this.data;
    let exportText = "# 多平台内容导出\n\n";

    Object.keys(allPlatformContents).forEach((platform) => {
      const content = allPlatformContents[platform];
      exportText += `## ${platform}\n\n`;
      exportText += `**标题：** ${content.title}\n\n`;
      exportText += `${content.text}\n\n`;
      exportText += `---\n\n`;
    });

    wx.setClipboardData({
      data: exportText,
      success: () => {
        wx.showToast({ title: "所有内容已复制", icon: "success" });
      },
    });
  },

  /**
   * 生成公众号文章JSON（符合推送规范）
   */
  async generateWechatArticleJSON() {
    const { generatedContent, searchedImages, coverImage } = this.data;

    if (!generatedContent) {
      wx.showToast({ title: "请先生成内容", icon: "none" });
      return;
    }

    wx.showLoading({ title: "生成JSON中..." });

    try {
      // 准备图片列表
      const contentImages =
        searchedImages.length > 0 ? searchedImages.slice(0, 5) : [];

      // 使用纯内联CSS生成HTML
      const htmlContent = platformFormatter.generateWeChatHTML(
        generatedContent.title,
        generatedContent.content,
        generatedContent.tags || [],
        true,
        contentImages,
      );

      // 构建JSON对象
      const articleJSON = {
        title: generatedContent.title,
        content: htmlContent,
        cover_url: coverImage?.url || contentImages[0]?.url || "",
      };

      // 验证JSON
      if (
        !articleJSON.title ||
        !articleJSON.content ||
        !articleJSON.cover_url
      ) {
        throw new Error("JSON字段不完整");
      }

      if (articleJSON.content.length < 500) {
        throw new Error("内容长度不足");
      }

      this.setData({
        articleJSON: articleJSON,
        showArticleJSON: true,
      });

      wx.hideLoading();
      wx.showToast({ title: "JSON生成成功", icon: "success" });
    } catch (error) {
      console.error("生成JSON失败:", error);
      wx.hideLoading();
      wx.showToast({ title: error.message || "生成失败", icon: "none" });
    }
  },

  /**
   * 复制公众号文章JSON
   */
  copyArticleJSON() {
    const { articleJSON } = this.data;
    if (!articleJSON) {
      wx.showToast({ title: "请先生成JSON", icon: "none" });
      return;
    }

    const jsonString = JSON.stringify(articleJSON, null, 2);

    wx.setClipboardData({
      data: jsonString,
      success: () => {
        wx.showToast({ title: "JSON已复制", icon: "success" });
      },
    });
  },

  /**
   * 推送文章到服务器
   */
  async publishArticle() {
    const { articleJSON } = this.data;

    if (!articleJSON) {
      wx.showToast({ title: "请先生成JSON", icon: "none" });
      return;
    }

    wx.showLoading({ title: "推送中..." });

    const url = "http://39.108.254.228:8002/publish-draft";
    let retryCount = 0;
    const maxRetries = 3;

    const tryPublish = async () => {
      try {
        const response = await new Promise((resolve, reject) => {
          wx.request({
            url: url,
            method: "POST",
            data: articleJSON,
            header: {
              "Content-Type": "application/json",
            },
            timeout: 120000, // 120秒超时
            success: resolve,
            fail: reject,
          });
        });

        wx.hideLoading();

        if (response.statusCode === 200) {
          wx.showToast({ title: "推送成功", icon: "success" });
          return true;
        } else {
          throw new Error(`服务器返回 ${response.statusCode}`);
        }
      } catch (error) {
        console.error(
          `推送失败 (尝试 ${retryCount + 1}/${maxRetries}):`,
          error,
        );

        if (retryCount < maxRetries - 1) {
          retryCount++;
          wx.showLoading({ title: `重试中 ${retryCount}/${maxRetries}...` });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return tryPublish();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: "推送失败",
            content: error.message || "网络错误，是否重试？",
            confirmText: "重试",
            success: (res) => {
              if (res.confirm) {
                retryCount = 0;
                this.publishArticle();
              }
            },
          });
          return false;
        }
      }
    };

    await tryPublish();
  },

  /**
   * 关闭弹窗
   */
  closeModal(e) {
    const modal = e.currentTarget.dataset.modal;
    this.setData({
      [modal]: false,
    });
  },

  // ========== 原有格式化方法（作为降级方案保留） ==========

  generateFormattedContentLegacy(content) {
    const { title, content: body, tags, optimizationTips } = content;

    return {
      微信公众号: this.formatForWeChat(title, body, tags, optimizationTips),
      小红书: this.formatForXiaohongshu(title, body, tags, optimizationTips),
      知乎: this.formatForZhihu(title, body, tags, optimizationTips),
      抖音: this.formatForDouyin(title, body, tags, optimizationTips),
      B站: this.formatForBilibili(title, body, tags, optimizationTips),
    };
  },

  // 构建平台特定的提示词
  buildPrompt() {
    const {
      selectedHotspot,
      creationType,
      styleOptions,
      styleIndex,
      lengthOptions,
      lengthIndex,
      platformOptions,
      platformIndex,
      platformConfig,
      additionalRequirements,
    } = this.data;

    const hotspotTitle = selectedHotspot.title || selectedHotspot.name;
    const style = styleOptions[styleIndex];
    const length = lengthOptions[lengthIndex];
    const platform = platformOptions[platformIndex];
    const platformInfo = platformConfig[platform];

    let typePrompt = "";
    switch (creationType) {
      case "article":
        typePrompt = "撰写一篇深度文章";
        break;
      case "post":
        typePrompt = "撰写一篇短文快讯";
        break;
      case "video-script":
        typePrompt = "撰写一个短视频脚本";
        break;
    }

    // 根据平台特性构建差异化的prompt
    let platformSpecificRequirements = "";

    if (platform === "抖音") {
      platformSpecificRequirements = `
【抖音平台特性要求】
- 算法逻辑：${platformInfo.algorithm}，内容需在前3秒设计极强的"钩子"
- 用户习惯：${platformInfo.userHabit}，追求情绪价值和即时共鸣
- 核心要点：
  * 开头必须有强烈的悬念、冲突或视觉冲击（前3秒决定完播率）
  * 节奏紧凑，语言口语化，多用短句和感叹句
  * 制造情绪价值：共鸣、惊喜、搞笑、感动等
  * 标题要有悬念感或情绪化表达
  * 适当使用热门梗和流行语
  * 如果是视频脚本，需标注关键镜头和节奏点`;
    } else if (platform === "小红书") {
      platformSpecificRequirements = `
【小红书平台特性要求】
- 算法逻辑：${platformInfo.algorithm}，内容需优化关键词布局
- 用户习惯：${platformInfo.userHabit}，追求实用价值和问题解决
- 核心要点：
  * 标题必须包含核心关键词（用户会搜索的词）
  * 内容结构化：使用序号、小标题、分段清晰
  * 强调干货和实用性，提供具体的解决方案或步骤
  * 多使用emoji和符号增强可读性
  * 标签要精准，覆盖核心关键词
  * 语言要亲切、真诚，像朋友分享经验
  * 适当加入个人体验和使用感受`;
    } else if (platform === "微信公众号") {
      platformSpecificRequirements = `
【微信公众号平台特性要求】
- 算法逻辑：${platformInfo.algorithm}，内容需有深度和专业性
- 用户习惯：${platformInfo.userHabit}，适合长文深度阅读
- 核心要点：
  * 标题要有吸引力但不夸张，符合公众号调性
  * 内容要有深度，论证充分，逻辑严密
  * 适合图文并茂，可以建议配图位置
  * 语言专业但不晦涩，适合深度阅读
  * 可以适当引用数据、案例支撑观点
  * 结尾可以有互动引导（点赞、转发、评论）`;
    } else if (platform === "知乎") {
      platformSpecificRequirements = `
【知乎平台特性要求】
- 算法逻辑：${platformInfo.algorithm}，内容需专业深度
- 用户习惯：${platformInfo.userHabit}，追求深度思考和专业见解
- 核心要点：
  * 内容要有专业深度，论证严谨
  * 多使用数据、案例、研究支撑观点
  * 逻辑清晰，层次分明
  * 可以适当展示专业背景和经验
  * 语言理性客观，避免过度情绪化
  * 适合长文，深入分析问题`;
    } else if (platform === "B站") {
      platformSpecificRequirements = `
【B站平台特性要求】
- 算法逻辑：${platformInfo.algorithm}，内容需有质量和创意
- 用户习惯：${platformInfo.userHabit}，追求内容质量和互动
- 核心要点：
  * 内容要有创意和趣味性
  * 适合系列化内容，可以预告后续
  * 语言可以活泼，适当使用B站特色梗
  * 如果是视频脚本，注重节奏和互动设计
  * 可以加入弹幕互动引导
  * 注重内容质量，不要过度追求流量`;
    }

    const prompt = `你是一位专业的自媒体内容创作者，深谙各平台的算法逻辑和用户偏好。

【创作任务】
${typePrompt}

【热点主题】
${hotspotTitle}

【基础创作要求】
- 内容风格：${style}
- 内容长度：${length}
- 目标平台：${platform}
${additionalRequirements ? `- 补充需求：${additionalRequirements}` : ""}

${platformSpecificRequirements}

【输出格式要求】
请以JSON格式输出，包含以下字段：
{
  "title": "标题（符合${platform}平台特点）",
  "content": "正文内容（完整的创作内容）",
  "tags": ["标签1", "标签2", "标签3"],
  "coverSuggestion": "封面/配图建议（简要描述）",
  "optimizationTips": ["优化建议1", "优化建议2", "优化建议3"]
}

注意：
1. title要符合${platform}的标题风格和用户习惯
2. content是完整的创作内容，要体现平台特性
3. tags要精准，覆盖核心关键词
4. coverSuggestion给出封面或配图的具体建议
5. optimizationTips给出3-5条针对${platform}的优化建议

请直接输出JSON，不要有任何额外说明。`;

    return prompt;
  },

  // 调用 GLM API 并解析结构化内容
  async callGLMAPI(prompt, retryCount = 0) {
    const { apiKey, endpoint, model } = this.data.glmConfig;
    const maxRetries = 3;
    const timeout = 120000; // 120秒超时

    return new Promise((resolve, reject) => {
      console.log(`🔄 调用 GLM API... (重试次数: ${retryCount}/${maxRetries})`);

      wx.request({
        url: endpoint,
        method: "POST",
        timeout: timeout,
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
        },
        success: (res) => {
          console.log("✅ GLM API 调用成功, status:", res.statusCode);

          if (res.statusCode !== 200) {
            console.error("❌ API状态码异常:", res.statusCode, res.data);
            reject(new Error(`API返回状态码: ${res.statusCode}`));
            return;
          }

          if (res.data && res.data.choices && res.data.choices.length > 0) {
            const rawContent = res.data.choices[0].message.content;
            console.log("📦 原始返回内容:", rawContent?.substring(0, 500));

            // 尝试解析JSON
            try {
              // 先尝试提取markdown代码块中的JSON
              let jsonStr = rawContent;
              
              // 匹配 ```json ... ``` 或 ``` ... ``` 格式
              const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (codeBlockMatch && codeBlockMatch[1]) {
                jsonStr = codeBlockMatch[1].trim();
                console.log("📦 从代码块中提取JSON:", jsonStr?.substring(0, 200));
              }
              
              const parsedContent = JSON.parse(jsonStr);
              console.log("✅ JSON解析成功:", Object.keys(parsedContent));

              // 处理嵌套的JSON格式（video_script + social_media_post）
              const normalizedContent = this.normalizeContent(parsedContent);

              resolve(normalizedContent);
            } catch (parseError) {
              console.warn(
                "⚠️ JSON解析失败，尝试修复后解析:",
                parseError.message,
              );
              
              // 尝试修复常见的JSON格式问题
              try {
                let fixedContent = rawContent;
                
                // 移除markdown代码块标记
                fixedContent = fixedContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
                
                // 尝试找到JSON对象的开始和结束
                const jsonStart = fixedContent.indexOf('{');
                const jsonEnd = fixedContent.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                  fixedContent = fixedContent.substring(jsonStart, jsonEnd + 1);
                }
                
                const parsedContent = JSON.parse(fixedContent);
                console.log("✅ 修复后JSON解析成功:", Object.keys(parsedContent));
                
                const normalizedContent = this.normalizeContent(parsedContent);
                resolve(normalizedContent);
              } catch (secondError) {
                console.warn("⚠️ 二次解析也失败，尝试提取内容:", secondError.message);
                
                // 尝试从原始内容中提取有用的信息
                let extractedContent = rawContent.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
                let extractedTitle = "AI生成内容";
                let extractedBody = extractedContent;
                
                // 尝试提取 title 和 content 字段
                const titleMatch = extractedContent.match(/"title"\s*:\s*"([^"]+)"/);
                if (titleMatch) {
                  extractedTitle = titleMatch[1];
                  console.log("🔧 提取到标题:", extractedTitle?.substring(0, 30));
                }
                
                // 尝试提取 content 字段
                const contentMatch = extractedContent.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (contentMatch) {
                  extractedBody = contentMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                  console.log("🔧 提取到内容，长度:", extractedBody.length);
                }
                
                resolve({
                  title: extractedTitle,
                  content: extractedBody,
                  tags: [],
                  coverSuggestion: "请根据内容自行设计封面",
                  optimizationTips: ["内容已生成，建议根据平台特性进行优化"],
                });
              }
            }
          } else {
            console.error("❌ API返回数据格式错误:", res.data);
            reject(new Error("API返回数据格式错误"));
          }
        },
        fail: (error) => {
          console.error("❌ GLM API 调用失败:", error);

          // 超时错误自动重试
          if (
            error.errMsg &&
            error.errMsg.includes("timeout") &&
            retryCount < maxRetries
          ) {
            console.log(
              `⏱️ 请求超时，准备重试... (${retryCount + 1}/${maxRetries})`,
            );
            setTimeout(
              () => {
                this.callGLMAPI(prompt, retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              },
              2000 * (retryCount + 1),
            ); // 递增延迟
            return;
          }

          reject(new Error("API调用失败: " + error.errMsg));
        },
      });
    });
  },

  // 规范化内容格式 - 处理各种AI返回格式
  normalizeContent(parsedContent) {
    console.log("🔧 normalizeContent 输入:", JSON.stringify(parsedContent).substring(0, 300));
    
    // 首先检查 content 字段是否是嵌套的 JSON 字符串
    if (parsedContent.content && typeof parsedContent.content === "string") {
      const contentStr = parsedContent.content.trim();
      // 如果 content 以 { 开头，尝试解析它
      if (contentStr.startsWith('{')) {
        try {
          const innerContent = JSON.parse(contentStr);
          console.log("🔧 检测到 content 是嵌套的 JSON 对象，正在提取...");
          
          // 如果内部对象有 title 和 content，直接使用内部对象
          if (innerContent.title && innerContent.content) {
            console.log("🔧 成功提取嵌套内容，标题:", innerContent.title?.substring(0, 30));
            return {
              title: innerContent.title,
              content: typeof innerContent.content === 'string' 
                ? innerContent.content 
                : JSON.stringify(innerContent.content),
              tags: innerContent.tags || [],
              coverSuggestion: innerContent.coverSuggestion || "",
              optimizationTips: innerContent.optimizationTips || [],
            };
          }
        } catch (e) {
          console.log("🔧 content 不是有效的 JSON，保持原样");
        }
      }
    }
    
    // 如果已经是标准格式 { title, content, tags }
    if (parsedContent.title && typeof parsedContent.content === "string") {
      let contentText = parsedContent.content;
      
      // 检查 content 是否还是 JSON 字符串（AI有时候会返回嵌套的JSON）
      const trimmedContent = contentText.trim();
      if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
        try {
          const innerParsed = JSON.parse(trimmedContent);
          console.log("🔧 检测到 content 是 JSON 字符串:", Object.keys(innerParsed));
          
          // 提取内层内容
          if (innerParsed.content && typeof innerParsed.content === 'string') {
            contentText = innerParsed.content;
          } else if (innerParsed.description) {
            contentText = innerParsed.description;
          } else if (innerParsed.text) {
            contentText = innerParsed.text;
          } else if (innerParsed.body) {
            contentText = innerParsed.body;
          }
        } catch (e) {
          // 解析失败，不是JSON，保持原样
        }
      }
      
      return {
        ...parsedContent,
        content: contentText,
      };
    }

    // 处理 { video_script, social_media_post } 格式
    if (parsedContent.video_script || parsedContent.social_media_post) {
      const social = parsedContent.social_media_post || {};
      const video = parsedContent.video_script || {};

      // 优先使用 social_media_post 的内容
      const title = social.title || video.title || "创作内容";
      let content = social.description || "";
      const tags = this.extractHashtags(social.hashtags) || [];

      // 如果有分镜，转换为文本格式
      if (video.shots && Array.isArray(video.shots)) {
        content = video.shots
          .map((shot, i) => {
            let text = `【分镜${i + 1}】${shot.description || shot.scene || ""}`;
            if (shot.dialogue) text += `\n旁白: ${shot.dialogue}`;
            return text;
          })
          .join("\n\n");
      }

      return {
        title: title,
        content: content,
        tags: tags,
        coverSuggestion: social.image_prompt || "根据内容设计封面",
        optimizationTips: [],
      };
    }

    // 如果content是对象而不是字符串
    if (parsedContent.content && typeof parsedContent.content === "object") {
      const innerContent = parsedContent.content;

      // 处理嵌套的 social_media_post
      if (innerContent.social_media_post) {
        return {
          title:
            parsedContent.title ||
            innerContent.social_media_post.title ||
            "创作内容",
          content:
            innerContent.social_media_post.description ||
            JSON.stringify(innerContent),
          tags:
            this.extractHashtags(innerContent.social_media_post.hashtags) || [],
          coverSuggestion: parsedContent.coverSuggestion || "",
          optimizationTips: parsedContent.optimizationTips || [],
        };
      }

      // 处理嵌套的 video_script
      if (innerContent.video_script) {
        const shots = innerContent.video_script.shots || [];
        const contentText = shots
          .map((shot, i) => `【分镜${i + 1}】${shot.description || ""}`)
          .join("\n\n");

        return {
          title:
            parsedContent.title ||
            innerContent.video_script.title ||
            "视频脚本",
          content: contentText,
          tags: parsedContent.tags || [],
          coverSuggestion: parsedContent.coverSuggestion || "",
          optimizationTips: parsedContent.optimizationTips || [],
        };
      }

      // 其他对象格式，转为字符串
      return {
        ...parsedContent,
        content: JSON.stringify(innerContent, null, 2),
      };
    }

    // 默认返回原内容
    return parsedContent;
  },

  // 从hashtags字符串中提取标签数组
  extractHashtags(hashtags) {
    if (!hashtags) return [];
    if (Array.isArray(hashtags)) return hashtags;
    if (typeof hashtags === "string") {
      // 从 "#标签1 #标签2" 格式中提取
      return hashtags
        .split(/[\s,]+/)
        .filter((t) => t.trim())
        .map((t) => t.replace("#", ""));
    }
    return [];
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

  // 复制内容（支持复制不同部分）
  copyContent(e) {
    const type = e.currentTarget.dataset.type || "all";
    const content = this.data.generatedContent;

    if (!content) {
      wx.showToast({
        title: "暂无内容",
        icon: "none",
      });
      return;
    }

    let copyText = "";

    switch (type) {
      case "title":
        copyText = content.title || "";
        break;
      case "content":
        copyText = content.content || "";
        break;
      case "tags":
        copyText = (content.tags || []).map((tag) => `#${tag}`).join(" ");
        break;
      case "all":
        copyText = `标题：${content.title}\n\n${content.content}\n\n标签：${(content.tags || []).map((tag) => `#${tag}`).join(" ")}`;
        break;
      default:
        copyText = content.content || "";
    }

    if (!copyText) {
      wx.showToast({
        title: "内容为空",
        icon: "none",
      });
      return;
    }

    wx.setClipboardData({
      data: copyText,
      success: () => {
        wx.showToast({
          title: "已复制到剪贴板",
          icon: "success",
        });
      },
    });
  },

  // 复制格式化内容（支持HTML格式）
  copyFormattedContent(e) {
    const type = e.currentTarget?.dataset?.type || "text";
    const platform = this.data.platformOptions[this.data.platformIndex];
    const platformContent = this.data.formattedContents[platform];

    if (!platformContent) {
      wx.showToast({
        title: "暂无格式化内容",
        icon: "none",
      });
      return;
    }

    let copyText = "";
    let tipMsg = "已复制到剪贴板";

    if (type === "html" && platformContent.html) {
      // 复制HTML格式（适合公众号编辑器）
      copyText = platformContent.html;
      tipMsg = "已复制HTML格式";
    } else {
      // 复制纯文本格式
      copyText = platformContent.text || platformContent;
    }

    if (!copyText) {
      wx.showToast({
        title: "内容为空",
        icon: "none",
      });
      return;
    }

    wx.setClipboardData({
      data: copyText,
      success: () => {
        wx.showToast({
          title: tipMsg,
          icon: "success",
        });
      },
    });
  },

  // 复制HTML格式（快捷方法）
  copyHtmlContent() {
    const platform = this.data.platformOptions[this.data.platformIndex];
    const platformContent = this.data.formattedContents[platform];

    if (!platformContent?.html) {
      wx.showToast({
        title: "当前平台不支持HTML",
        icon: "none",
      });
      return;
    }

    // 为公众号生成只包含body的HTML（不包含html/head/body标签）
    let htmlToCopy = platformContent.html;
    
    if (platform === '微信公众号') {
      // 重新生成，只返回body内容
      const { platformFormatter } = require("../../utils/platform-formatter.js");
      const contentImages = this.data.searchedImages.slice(0, 5);
      
      htmlToCopy = platformFormatter.generateWeChatHTML(
        platformContent.title || this.data.generatedContent?.title,
        this.data.generatedContent?.content || '',
        platformContent.tags || [],
        true,
        contentImages,
        false // 只返回body内容，适合复制到公众号编辑器
      );
    }

    wx.setClipboardData({
      data: htmlToCopy,
      success: () => {
        wx.showModal({
          title: "复制成功",
          content: "HTML已复制到剪贴板！\n\n粘贴方式：\n1. 公众号编辑器：直接粘贴（Ctrl+V）\n2. 如仍显示源码，请切换到“HTML源码”模式粘贴",
          showCancel: false,
          confirmText: "知道了"
        });
      },
    });
  },

  // 优化内容
  async optimizeContent(e) {
    const type = e.currentTarget.dataset.type;

    wx.showToast({
      title: "优化功能开发中",
      icon: "none",
    });
  },

  // 切换发布平台
  togglePlatform(e) {
    const id = e.currentTarget.dataset.id;
    const platforms = this.data.publishPlatforms.map((p) => {
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
        status: "draft",
      };

      // 保存到创作历史（统一存储）
      const history = wx.getStorageSync("creation_history") || [];
      // 检查是否已存在相同ID的记录，存在则更新，否则添加
      const existingIndex = history.findIndex((item) => item.id === draft.id);
      if (existingIndex >= 0) {
        history[existingIndex] = draft;
      } else {
        history.unshift(draft);
      }
      // 最多保存100条历史记录
      if (history.length > 100) {
        history.pop();
      }
      wx.setStorageSync("creation_history", history);

      wx.showToast({
        title: "已保存草稿",
        icon: "success",
      });

      console.log("✅ 草稿保存成功");
    } catch (error) {
      console.error("❌ 保存草稿失败:", error);
      wx.showToast({
        title: "保存失败",
        icon: "error",
      });
    }
  },

  // 保存到云端数据库（同步等待结果）
  async saveToCloudHistory(historyItem) {
    try {
      console.log("=== 开始保存到云端 ===");

      // 检查云开发是否初始化
      if (!wx.cloud) {
        console.warn("⚠️ wx.cloud 不可用");
        return { success: false, error: "云开发未初始化" };
      }

      const hotspotTitle = historyItem.hotspot?.title || "创作内容";

      // 处理 content - 确保是字符串
      let contentStr = historyItem.content;
      if (typeof contentStr === "object" && contentStr !== null) {
        // 如果是复杂对象，提取关键文本
        if (contentStr.social_media_post) {
          contentStr =
            contentStr.social_media_post.description ||
            contentStr.social_media_post.title ||
            JSON.stringify(contentStr);
        } else if (contentStr.video_script) {
          contentStr =
            contentStr.video_script.title || JSON.stringify(contentStr);
        } else {
          contentStr = JSON.stringify(contentStr);
        }
      }

      const cloudData = {
        projectId: this.data.currentProjectId || "",
        agentId: "content-creator",
        agentName: "自媒体创作",
        character: hotspotTitle,
        prompt: hotspotTitle,
        content: String(contentStr),
        mediaType: "article",
        mediaUrl: this.data.coverImage?.url || "",
        status: "completed",
      };

      console.log("云端保存数据:", cloudData);

      const res = await wx.cloud.callFunction({
        name: "creationHistory",
        data: {
          action: "save",
          data: cloudData,
        },
      });

      console.log("云端返回结果:", res);

      if (res.result && res.result.success) {
        console.log("✅ 创作历史已同步到云端，_id:", res.result.data?._id);
        return { success: true };
      } else {
        console.warn("⚠️ 云端同步失败:", res.result?.error);
        return { success: false, error: res.result?.error };
      }
    } catch (error) {
      console.error("❌ 云端同步异常:", error);
      return { success: false, error: error.message };
    }
  },

  // 保存到创作历史（本地 + 云端数据库）- 保留用于草稿保存
  async saveToHistory(data) {
    console.log("=== 开始保存创作历史 ===");
    console.log("传入的数据:", data);

    try {
      // 确保 hotspot 有正确的格式
      const hotspotData = data.hotspot;
      const hotspotTitle =
        typeof hotspotData === "string"
          ? hotspotData
          : hotspotData?.title || hotspotData?.name || "创作内容";

      const history = {
        id: Date.now(),
        hotspot: {
          title: hotspotTitle,
          name: hotspotTitle,
        },
        type: data.type || "article",
        content: data.content,
        style: data.style,
        length: data.length,
        platform: data.platform,
        createTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "completed",
      };

      console.log("准备保存的历史记录:", history);

      // 1. 保存到本地存储
      const historyList = wx.getStorageSync("creation_history") || [];
      historyList.unshift(history);
      // 最多保存100条历史记录
      if (historyList.length > 100) {
        historyList.pop();
      }
      wx.setStorageSync("creation_history", historyList);
      console.log("✅ 创作历史已保存到本地，当前共", historyList.length, "条");

      // 2. 保存到云端数据库
      try {
        // 构建保存到云端的数据
        const cloudData = {
          projectId: this.data.currentProjectId || "",
          agentId: "content-creator",
          agentName: "自媒体创作",
          character: hotspotTitle,
          prompt: hotspotTitle,
          content:
            typeof data.content === "string"
              ? data.content
              : JSON.stringify(data.content),
          mediaType: "article",
          mediaUrl: this.data.coverImage?.url || "",
          status: "completed",
        };

        console.log("准备保存到云端的数据:", cloudData);

        const res = await wx.cloud.callFunction({
          name: "creationHistory",
          data: {
            action: "save",
            data: cloudData,
          },
        });

        console.log("云端保存结果:", res);

        if (res.result && res.result.success) {
          console.log("✅ 创作历史已保存到云端数据库");
        } else {
          console.warn("⚠️ 云端保存失败:", res.result?.error);
        }
      } catch (cloudError) {
        // 云端保存失败不影响本地保存
        console.warn("⚠️ 云端保存失败，本地已保存:", cloudError.message);
      }
    } catch (error) {
      console.error("❌ 保存创作历史失败:", error);
    }
  },

  // 发布内容
  async publishContent() {
    const selectedPlatforms = this.data.publishPlatforms.filter(
      (p) => p.selected,
    );

    if (selectedPlatforms.length === 0) {
      wx.showToast({
        title: "请选择发布平台",
        icon: "none",
      });
      return;
    }

    // 检查是否选择了微信公众号
    const wechatPlatform = selectedPlatforms.find((p) => p.id === "wechat");

    if (wechatPlatform) {
      await this.publishToWechatMultiAccount();
    } else {
      // 其他平台暂不支持
      wx.showModal({
        title: "功能开发中",
        content:
          "当前仅支持微信公众号发布，其他平台正在开发中。您可以先复制内容，手动发布到各平台。",
        showCancel: true,
        confirmText: "我知道了",
        cancelText: "取消",
      });
    }
  },

  /**
   * 发布到微信公众号（多账号支持）
   */
  async publishToWechatMultiAccount() {
    const MultiAccountPublisher = require("../agents/modules/multi-account-publisher.js");
    const publisher = new MultiAccountPublisher(this);

    // 获取当前选中的公众号（异步）
    const currentAccount = await publisher.getCurrentAccount();

    if (!currentAccount) {
      // 没有配置公众号，引导用户去配置
      wx.showModal({
        title: "未配置公众号",
        content: "您还没有配置公众号账号，是否现在去添加？",
        confirmText: "去添加",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: "/pages/agents/wechat-accounts",
            });
          }
        },
      });
      return;
    }

    // 检查生成的内容
    const { generatedContent, formattedContents } = this.data;

    if (!generatedContent || !generatedContent.title) {
      wx.showToast({
        title: "请先生成内容",
        icon: "none",
      });
      return;
    }

    // 准备发布数据
    wx.showModal({
      title: "确认发布",
      content: `即将发布到公众号【${currentAccount.name}】，是否继续？`,
      confirmText: "确认发布",
      cancelText: "取消",
      success: async (res) => {
        if (res.confirm) {
          await this.doPublishToWechat(publisher, currentAccount);
        }
      },
    });
  },

  /**
   * 执行发布到微信公众号
   */
  async doPublishToWechat(publisher, currentAccount) {
    const { generatedContent, formattedContents, searchedImages, coverImage } =
      this.data;

    this.setData({ publishing: true });
    wx.showLoading({ title: "准备发布...", mask: true });

    try {
      // 1. 准备文章内容
      let htmlContent = "";
      let contentImages = [];

      // 优先使用格式化的微信公众号内容
      if (formattedContents && formattedContents["微信公众号"]) {
        htmlContent = formattedContents["微信公众号"].html || "";
        console.log('📦 使用 formattedContents HTML, 长度:', htmlContent.length);
      }

      // 如果没有格式化内容，使用原始内容
      if (!htmlContent && generatedContent.content) {
        // 使用平台格式化器生成HTML
        const { platformFormatter } = require("../../utils/platform-formatter.js");
        contentImages =
          searchedImages.length > 0 ? searchedImages.slice(0, 5) : [];

        // 提取正文内容 - 处理可能的 JSON 格式
        let bodyContent = generatedContent.content;
        
        // 如果 content 是对象，尝试提取文本
        if (typeof bodyContent === 'object' && bodyContent !== null) {
          console.log('📦 content 是对象，尝试提取文本...');
          if (bodyContent.social_media_post?.description) {
            bodyContent = bodyContent.social_media_post.description;
          } else if (bodyContent.content && typeof bodyContent.content === 'string') {
            bodyContent = bodyContent.content;
          } else if (bodyContent.text) {
            bodyContent = bodyContent.text;
          } else {
            bodyContent = JSON.stringify(bodyContent, null, 2);
          }
        }
        
        // 如果 content 是 JSON 字符串，解析并提取
        if (typeof bodyContent === 'string') {
          const trimmed = bodyContent.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(trimmed);
              console.log('📦 content 是 JSON 字符串，解析成功:', Object.keys(parsed));
              if (parsed.content && typeof parsed.content === 'string') {
                bodyContent = parsed.content;
              } else if (parsed.description) {
                bodyContent = parsed.description;
              } else if (parsed.text) {
                bodyContent = parsed.text;
              }
            } catch (e) {
              // 不是 JSON，保持原样
            }
          }
        }
        
        console.log('📦 最终 bodyContent 类型:', typeof bodyContent, '长度:', bodyContent?.length);

        htmlContent = platformFormatter.generateWeChatHTML(
          generatedContent.title,
          bodyContent,
          generatedContent.tags || [],
          true,
          contentImages,
          true // API发布需要完整HTML文档
        );
      }

      // 2. 检查封面图
      let finalCoverUrl = coverImage?.url || searchedImages[0]?.url || "";
      
      console.log('检查封面图状态:', {
        hasCoverImage: !!coverImage,
        coverImageUrl: coverImage?.url,
        hasSearchedImages: searchedImages.length > 0,
        firstSearchedUrl: searchedImages[0]?.url,
        finalCoverUrl: finalCoverUrl
      });

      // 如果没有封面图，生成一个默认封面
      if (!finalCoverUrl) {
        wx.showLoading({ title: "生成封面图...", mask: true });
        
        try {
          console.log('开始生成封面图，标题:', generatedContent.title);
          const generatedCover = await this.generateDefaultCover(generatedContent.title);
          finalCoverUrl = generatedCover;
          console.log('✅ 封面图生成成功:', finalCoverUrl);
        } catch (error) {
          console.error('❌ 生成封面图失败:', error);
          // 使用默认占位图
          finalCoverUrl = 'https://gcore.jsdelivr.net/gh/anbeime/nav@image/1750204383207.png';
          console.log('使用兜底封面图:', finalCoverUrl);
        }
      }

      // 3. 确保HTML中包含封面图
      if (finalCoverUrl && !htmlContent.includes('<img')) {
        // 在正文前插入封面图
        const coverImgHtml = `<div style="text-align: center; margin-bottom: 25px;">
          <img src="${finalCoverUrl}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" alt="封面图"/>
        </div>`;
        
        // 在标题后插入封面图
        htmlContent = htmlContent.replace('</h1>', `</h1>\n${coverImgHtml}`);
      }

      // 4. 构建文章数据
      const articleData = {
        title: generatedContent.title,
        content: htmlContent,
        cover_url: finalCoverUrl
      };

      console.log("准备发布文章:", {
        title: articleData.title,
        contentLength: articleData.content.length,
        account: currentAccount.name,
        hasCover: !!finalCoverUrl
      });

      // 5. 调用多账号发布
      wx.showLoading({ title: "发布中...", mask: true });
      const result = await publisher.publishToAccount(articleData);

      wx.hideLoading();

      if (result.success) {
        this.setData({ publishing: false });

        wx.showModal({
          title: "发布成功",
          content: `文章已成功发布到【${currentAccount.name}】的草稿箱！\n\n请在微信公众号后台审核后发布。`,
          showCancel: false,
          confirmText: "知道了",
          success: () => {
            // 可以选择返回上一页或留在当前页
            console.log("发布成功，media_id:", result.media_id);
          },
        });
      } else {
        throw new Error(result.error || "发布失败");
      }
    } catch (error) {
      console.error("发布到微信公众号失败:", error);
      wx.hideLoading();
      this.setData({ publishing: false });

      // 错误处理
      let errorMessage = error.message || "发布失败，请重试";

      // 特定错误提示
      if (errorMessage.includes("40164") || errorMessage.includes("IP")) {
        errorMessage =
          "IP地址不在白名单中，请在公众号后台添加服务器IP: 39.108.254.228";
      } else if (
        errorMessage.includes("40001") ||
        errorMessage.includes("secret")
      ) {
        errorMessage =
          "AppSecret错误，请检查公众号配置是否正确";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "网络超时，请检查网络连接后重试";
      }

      wx.showModal({
        title: "发布失败",
        content: errorMessage,
        showCancel: true,
        confirmText: "重试",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.doPublishToWechat(publisher, currentAccount);
          }
        },
      });
    }
  },

  /**
   * 快速发布到默认公众号草稿箱（简化版，无需选择热点）
   * 直接将当前生成的内容排版后发布
   */
  async quickPublishToWechat() {
    const { generatedContent, searchedImages, coverImage } = this.data;

    if (!generatedContent || !generatedContent.title) {
      wx.showToast({
        title: "请先生成内容",
        icon: "none"
      });
      return;
    }

    this.setData({ publishing: true });
    wx.showLoading({ title: "准备发布...", mask: true });

    try {
      console.log('🚀 开始快速发布到公众号草稿箱...');

      // 1. 生成HTML内容（使用爆款排版模板）
      const { platformFormatter } = require("../../utils/platform-formatter.js");
      
      // 准备配图
      const contentImages = searchedImages.length > 0 ? searchedImages.slice(0, 5) : [];
      
      // 生成HTML（API发布需要完整HTML文档）
      const htmlContent = platformFormatter.generateWeChatHTML(
        generatedContent.title,
        generatedContent.content,
        generatedContent.tags || [],
        true, // 启用高亮
        contentImages,
        true // 生成完整HTML文档（包含html/head/body）
      );

      // 2. 准备封面图
      let finalCoverUrl = coverImage?.url || searchedImages[0]?.url || "";
      
      if (!finalCoverUrl) {
        wx.showLoading({ title: "生成封面图...", mask: true });
        try {
          finalCoverUrl = await this.generateDefaultCover(generatedContent.title);
          console.log('✅ 封面图生成成功:', finalCoverUrl);
        } catch (error) {
          console.warn('⚠️ 封面图生成失败，使用默认图:', error);
          finalCoverUrl = 'https://mmbiz.qpic.cn/mmbiz_png/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxaMazawCIAFhYLBkxMLs0yHx3qGpzBmibia6LeQO6Vg/0';
        }
      }

      // 3. 构建JSON数据
      const articleJSON = {
        title: generatedContent.title,
        content: htmlContent,
        cover_url: finalCoverUrl
      };

      // 4. 验证JSON
      if (!articleJSON.title || !articleJSON.content || !articleJSON.cover_url) {
        throw new Error('文章数据不完整');
      }

      if (articleJSON.content.length < 500) {
        throw new Error('文章内容长度不足');
      }

      console.log('📄 文章数据准备完成:', {
        title: articleJSON.title,
        contentLength: articleJSON.content.length,
        hasCover: !!articleJSON.cover_url
      });

      // 5. POST推送到草稿箱API
      wx.showLoading({ title: "发布中...", mask: true });
      
      const publishResult = await this.postToDraftAPI(articleJSON);

      wx.hideLoading();

      if (publishResult.success) {
        this.setData({ publishing: false });

        wx.showModal({
          title: "✅ 发布成功",
          content: `文章已成功发布到公众号草稿箱！\n\n标题：${articleJSON.title}\n\n请在公众号后台审核后发布。`,
          showCancel: false,
          confirmText: "知道了"
        });

        console.log('✅ 文章发布成功');
      } else {
        throw new Error(publishResult.error || '发布失败');
      }

    } catch (error) {
      console.error('❌ 快速发布失败:', error);
      wx.hideLoading();
      this.setData({ publishing: false });

      wx.showModal({
        title: "发布失败",
        content: error.message || "发布失败，请重试",
        showCancel: true,
        confirmText: "重试",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.quickPublishToWechat();
          }
        }
      });
    }
  },

  /**
   * POST推送到草稿箱API
   */
  postToDraftAPI(articleJSON) {
    return new Promise((resolve, reject) => {
      const url = 'http://39.108.254.228:8002/publish-draft';
      
      console.log('📤 POST推送到:', url);
      
      wx.request({
        url: url,
        method: 'POST',
        data: articleJSON,
        header: {
          'Content-Type': 'application/json'
        },
        timeout: 120000, // 120秒超时
        success: (res) => {
          console.log('📥 API响应:', res);
          
          if (res.statusCode === 200) {
            resolve({
              success: true,
              data: res.data
            });
          } else {
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`
            });
          }
        },
        fail: (err) => {
          console.error('API调用失败:', err);
          resolve({
            success: false,
            error: err.errMsg || '网络请求失败'
          });
        }
      });
    });
  },

  /**
   * 生成默认封面图
   */
  async generateDefaultCover(title) {
    console.log('generateDefaultCover 开始，标题:', title);
    
    // 使用已导入的 imageService（文件顶部已导入）
    try {
      console.log('调用 imageService.generateCoverImage...');
      
      // 调用 generateCoverImage(title, content, platform)
      const coverImage = await imageService.generateCoverImage(title, '', 'wechat');
      
      console.log('generateCoverImage 返回结果:', coverImage);
      
      if (coverImage && coverImage.url) {
        console.log('图片服务生成封面成功，URL:', coverImage.url);
        return coverImage.url;
      } else {
        console.log('generateCoverImage 返回了数据但没有 URL');
      }
    } catch (error) {
      console.error('图片服务生成封面失败:', error.message);
      console.error('错误堆栈:', error.stack);
    }

    // 使用固定的兜底封面图 URL
    const fallbackCoverUrl = 'https://gcore.jsdelivr.net/gh/anbeime/nav@image/1750204383207.png';
    
    console.log('📷 使用兜底封面图:', fallbackCoverUrl);
    return fallbackCoverUrl;
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果无法返回，跳转到首页
        wx.switchTab({
          url: "/pages/index/index",
        });
      },
    });
  },

  // 页面显示时
  onShow() {
    console.log("✅ 页面显示");
    
    // 每次显示页面时，加载当前选中的公众号
    this.loadCurrentWechatAccount();
  },
  
  /**
   * 加载当前选中的公众号（异步，从云数据库）
   */
  async loadCurrentWechatAccount() {
    try {
      const MultiAccountPublisher = require("../agents/modules/multi-account-publisher.js");
      const publisher = new MultiAccountPublisher(this);
      const currentAccount = await publisher.getCurrentAccount();
      
      console.log('当前选中的公众号:', currentAccount);
      
      this.setData({
        currentWechatAccount: currentAccount
      });
    } catch (error) {
      console.error('加载当前公众号失败:', error);
    }
  },
  
  /**
   * 跳转到公众号管理页面
   */
  goToWechatAccounts() {
    wx.navigateTo({
      url: '/pages/agents/wechat-accounts'
    });
  },

  // 页面隐藏时
  onHide() {
    console.log("页面隐藏");
  },

  // 页面卸载时
  onUnload() {
    console.log("页面卸载 - 卸载前数据状态:", {
      currentStep: this.data.currentStep,
      hasGeneratedContent: !!this.data.generatedContent,
      hasSelectedHotspot: !!this.data.selectedHotspot,
    });
    this.setData({
      isPageAlive: false,
    });
  },

  // 安全的setData封装
  safeSetData(data, callback) {
    if (this.data.isPageAlive) {
      this.setData(data, callback);
    }
  },

  // 页面错误处理
  onError(error) {
    console.error("页面错误:", error);
    this.showError("页面运行错误: " + error);
  },
});