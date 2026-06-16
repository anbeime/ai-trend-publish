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

    // 平台特性配置
    platformConfig: {
      微信公众号: {
        algorithm: "订阅+推荐",
        userHabit: "深度阅读",
        features: ["长文深度", "图文并茂", "专业权威"],
        contentTips: "注重内容深度和专业性，适合长篇图文",
      },
      小红书: {
        algorithm: "搜索+推荐双引擎",
        userHabit: "主动搜索 | 实用价值",
        features: ["关键词优化", "干货密度", "结构化"],
        contentTips:
          "标题需包含核心关键词，内容结构清晰，强调实用价值和解决方案",
      },
      知乎: {
        algorithm: "问答+推荐",
        userHabit: "深度思考",
        features: ["专业深度", "逻辑严谨", "数据支撑"],
        contentTips: "注重论证逻辑和专业性，适合深度分析和知识分享",
      },
      抖音: {
        algorithm: "流量池赛马",
        userHabit: "被动浏览 | 情绪价值",
        features: ["3秒钩子", "高节奏", "情绪共鸣"],
        contentTips: "前3秒必须有强钩子，节奏紧凑，口语化表达，制造情绪价值",
      },
      B站: {
        algorithm: "推荐+搜索",
        userHabit: "兴趣驱动",
        features: ["内容质量", "互动氛围", "系列化"],
        contentTips: "注重内容质量和创意，适合系列化内容和深度互动",
      },
    },

    // 额外需求
    additionalRequirements: "",

    // 生成状态
    generating: false,
    generatedContent: null, // 改为对象结构，包含title、content、tags等
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

      if (res.result && res.result.data && res.result.data.hotspots) {
        const hotspots = res.result.data.hotspots || [];
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
      if (this.data.selectedCategory === category && this.data._lastCategoryClick) {
        console.log(`⚠️ 分类 ${category} 已被选中，跳过重复调用`);
        return;
      }

      // 记录点击时间戳
      this.setData({ _lastCategoryClick: Date.now() });

      // 打印前5个热点的分类信息
      console.log("🔍 前5个热点的分类:", this.data.realtimeHotspots.slice(0, 5).map(h => ({
        title: h.title,
        category: h.category,
      })));

      // 中英文分类映射（兼容云函数缓存的中文分类）
      const categoryMapping = {
        "tech": ["tech", "科技"],
        "life": ["life", "生活"],
        "entertainment": ["entertainment", "娱乐"],
        "food": ["food", "美食"],
        "travel": ["travel", "旅行"],
      };

      // 根据分类筛选热点（在setData前完成）
      let filtered = this.data.realtimeHotspots;
      if (category !== "all") {
        const validCategories = categoryMapping[category] || [category];
        filtered = this.data.realtimeHotspots.filter(
          (item) => validCategories.includes(item.category),
        );
        console.log(`✅ 筛选 ${category} 分类 (匹配: ${validCategories.join(", ")}) : ${filtered.length} 条`);
      } else {
        console.log("✅ 显示全部热点:", this.data.realtimeHotspots.length);
      }

      console.log(`📦 筛选后将要设置的热点数: ${filtered.length}`);

      // 一次性设置所有数据
      this.setData({
        selectedCategory: category,
        displayedHotspots: filtered,
      }, () => {
        console.log(`✅ setData 完成，实际显示的热点数: ${this.data.displayedHotspots.length}`);
      });

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

      // 更新积分
      const credits = this.data.userCredits;
      credits.dailyUsed += 1;
      wx.setStorageSync("user_credits", credits);

      // 保存到创作历史
      console.log("💾 开始保存到历史记录...");
      this.saveToHistory({
        hotspot: this.data.selectedHotspot,
        type: this.data.creationType,
        content: content,
        style: this.data.styleOptions[this.data.styleIndex],
        length: this.data.lengthOptions[this.data.lengthIndex],
        platform: this.data.platformOptions[this.data.platformIndex],
      });

      console.log("🔄 设置步骤3，生成内容预览:", {
        hasTitle: !!content.title,
        hasContent: !!content.content,
        title: content.title?.substring(0, 50),
        contentLength: content.content?.length || 0,
      });

      this.safeSetData(
        {
          generatedContent: content,
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
  async callGLMAPI(prompt) {
    const { apiKey, endpoint, model } = this.data.glmConfig;

    return new Promise((resolve, reject) => {
      console.log("🔄 调用 GLM API...");

      wx.request({
        url: endpoint,
        method: "POST",
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
            console.log("📦 原始返回内容长度:", rawContent?.length || 0);

            // 尝试解析JSON
            try {
              const parsedContent = JSON.parse(rawContent);
              console.log(
                "✅ JSON解析成功:",
                !!parsedContent.title,
                !!parsedContent.content,
              );
              resolve(parsedContent);
            } catch (parseError) {
              console.warn(
                "⚠️ JSON解析失败，返回原始文本:",
                parseError.message,
              );
              // 返回原始文本作为content字段
              resolve({
                title: "AI生成内容",
                content: rawContent,
                tags: [],
                coverSuggestion: "请根据内容自行设计封面",
                optimizationTips: ["内容已生成，建议根据平台特性进行优化"],
              });
            }
          } else {
            console.error("❌ API返回数据格式错误:", res.data);
            reject(new Error("API返回数据格式错误"));
          }
        },
        fail: (error) => {
          console.error("❌ GLM API 调用失败:", error);
          reject(new Error("API调用失败: " + error.errMsg));
        },
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
        status: "completed",
      };

      // 保存到本地存储
      const historyList = wx.getStorageSync("creation_history") || [];
      historyList.unshift(history);
      // 最多保存100条历史记录
      if (historyList.length > 100) {
        historyList.pop();
      }
      wx.setStorageSync("creation_history", historyList);

      console.log("✅ 创作历史已保存");
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

    this.setData({
      publishing: true,
      loadingText: "📤 正在发布到平台...",
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
        platforms: selectedPlatforms.map((p) => p.name),
        createTime: new Date().toISOString(),
        publishTime: new Date().toISOString(),
        status: "published",
      };

      // 保存到创作历史（统一存储）
      const history = wx.getStorageSync("creation_history") || [];
      // 检查是否已存在相同ID的记录，存在则更新，否则添加
      const existingIndex = history.findIndex(
        (item) => item.id === publishRecord.id,
      );
      if (existingIndex >= 0) {
        history[existingIndex] = publishRecord;
      } else {
        history.unshift(publishRecord);
      }
      // 最多保存100条历史记录
      if (history.length > 100) {
        history.pop();
      }
      wx.setStorageSync("creation_history", history);

      // TODO: 实现多平台发布功能
      await this.delay(2000);

      this.setData({ publishing: false });

      wx.showModal({
        title: "发布成功",
        content: `已发布到 ${selectedPlatforms.map((p) => p.name).join("、")}`,
        showCancel: false,
        success: () => {
          // 返回首页
          wx.switchTab({
            url: "/pages/index/index",
          });
        },
      });

      console.log("✅ 内容发布成功");
    } catch (error) {
      console.error("❌ 发布失败:", error);
      this.setData({ publishing: false });
      wx.showToast({
        title: "发布失败",
        icon: "error",
      });
    }
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
  },

  // 页面隐藏时
  onHide() {
    console.log("✅ 页面隐藏");
  },

  // 页面卸载时
  onUnload() {
    console.log("✅ 页面卸载 - 卸载前数据状态:", {
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
    console.error("❌ 页面错误:", error);
    this.showError("页面运行错误: " + error);
  },
});
