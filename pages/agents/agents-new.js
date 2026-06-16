/* pages/agents/agents-new.js */

Page({
  data: {
    userInput: "",
    messages: [],
    inputFocus: false,
    working: false,
    workingMessage: "",
    progressPercent: 0,
    currentStep: 0,
    toView: "",
    scrollTop: 0,
    toViewWorkspace: "",
    scrollToWorkspace: 0,

    selectedTrend: null,
    selectedTrendIndex: -1,

    showTrendPanel: false,
    hotspotDataSource: "cache",
    lastHotspotFetch: null,
    fetchingTrends: false,
    selectedTrendCategory: "",
    filteredTrends: [],
    trendCategories: ["全部", "科技", "生活", "娱乐", "美食", "旅行"],

    showStylePanel: false,
    selectedStyle: "anime",
    styleArray: [
      {
        key: "anime",
        value: {
          icon: "🎌",
          name: "日系动漫",
          extendedKeywords: "日系 动漫 二次元 治愈 可爱",
          description: "明亮、温暖的日系风格，适合日常、治愈系内容",
        },
      },
      {
        key: "realistic",
        value: {
          icon: "📷",
          name: "写实风格",
          extendedKeywords: "写实 真实 纪实 沉稳 专业",
          description: "写实、沉稳的风格，适合纪录片、新闻、专业内容",
        },
      },
      {
        key: "cartoon",
        value: {
          icon: "🎨",
          name: "卡通风格",
          extendedKeywords: "卡通 搞笑 幽默 童趣",
          description: "明亮活泼的卡通风格，适合搞笑、娱乐、儿童内容",
        },
      },
      {
        key: "cinematic",
        value: {
          icon: "🎬",
          name: "电影质感",
          extendedKeywords: "电影 质感 大片 情怀 沉浸",
          description: "电影质感、沉浸式风格，适合电影、剧情片、情感内容",
        },
      },
      {
        key: "documentary",
        value: {
          icon: "📹",
          name: "纪录片风",
          extendedKeywords: "纪录片 真实 讲述 深度",
          description: "真实、深度的纪录片风格，适合科普、历史、教育内容",
        },
      },
    ],

    showSettings: false,
    settingsCollapsed: true,
    selectedPlatform: "douyin",
    userCredits: null,
    dailyUsed: 0,
    dailyQuota: 3,

    agents: {},
    agentWorkspace: [],

    hotspotCardVisible: false,
    hotspotCardCollapsed: false,
    selectedHotspot: null,

    creationHistory: [],
    testMode: "workflow",
    selectedTestAgent: "scriptWriter",

    agentsConfig: {
      scriptWriter: { enabled: true, config: {} },
      storyboard: { enabled: true, config: {} },
      videoComposer: { enabled: true, config: {} },
      qualityChecker: { enabled: true, config: {} },
      platformAdapter: { enabled: true, config: {} },
      autoPublisher: { enabled: true, config: {} },
    },
  },

  onLoad(options) {
    console.log("页面加载:", options);

    this.initAgents();
    this.loadAgentConfigs();
    this.loadCreationHistory();
    this.loadUserCredits();

    if (options.hotspot) {
      console.log("从首页传入热点:", options.hotspot);
      this.handleHotspotSelection(options.hotspot);
    } else if (options.input) {
      console.log("从首页传入输入:", options.input);
      this.setData({ inputValue: decodeURIComponent(options.input) });
    }
  },

  onShow() {
    console.log("页面显示");
    this.setData({
      showTrendPanel: false,
      showStylePanel: false,
      showSettings: false,
      inputFocus: false,
    });

    this.updateAgentsList();
  },

  onUnload() {
    console.log("页面卸载");
  },

  // 初始化所有智能体
  initAgents() {
    const agents = {
      trendHunter: {
        key: "trendHunter",
        name: "热点追踪",
        icon: "🔥",
        status: "idle",
        enabled: true,
        output: "",
        collapsed: false,
        order: 1,
      },
      scriptWriter: {
        key: "scriptWriter",
        name: "脚本创作",
        icon: "📝",
        status: "idle",
        enabled: true,
        output: "",
        collapsed: false,
        order: 2,
      },
      storyboard: {
        key: "storyboard",
        name: "分镜设计",
        icon: "🎨",
        status: "idle",
        enabled: true,
        output: "",
        collapsed: false,
        order: 3,
      },
      videoComposer: {
        key: "videoComposer",
        name: "视频合成",
        icon: "🎬",
        status: "idle",
        enabled: true,
        output: "",
        collapsed: false,
        order: 4,
      },
      qualityChecker: {
        key: "qualityChecker",
        name: "质检审核",
        icon: "✂️",
        status: "idle",
        enabled: true,
        output: "",
        collapsed: false,
        order: 5,
      },
      platformAdapter: {
        key: "platformAdapter",
        name: "平台适配",
        icon: "📱",
        status: "idle",
        enabled: true,
        output: "",
        collapsed: false,
        order: 6,
      },
      autoPublisher: {
        key: "autoPublisher",
        name: "自动发布",
        icon: "🚀",
        status: "idle",
        enabled: true,
        output: "",
        collapsed: false,
        order: 7,
      },
    };

    this.setData({ agents });
  },

  // 更新智能体列表（根据配置）
  updateAgentsList() {
    const agents = this.data.agents;
    const configs = this.data.agentsConfig;

    for (const key in agents) {
      if (configs[key]) {
        agents[key].enabled = configs[key].enabled;
        if (configs[key].config) {
          agents[key].config = configs[key].config;
        }
      }
    }

    this.updateWorkspaceDisplay();
  },

  // 切换工作流模式
  onWorkflowStepTap(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    const agentKey = e.currentTarget.dataset.agent;

    console.log(`点击工作流步骤 ${step}, 目标智能体: ${agentKey}`);

    this.updateAgentsList();

    this.startWorkflow(step, agentKey);
  },

  // 开始工作流
  async startWorkflow(step, agentKey) {
    const agents = this.data.agents;

    try {
      for (let i = step; i <= 7; i++) {
        if (i === 1) {
          agents.trendHunter.status = "working";
          this.setData({
            agents,
            currentStep: i,
            working: true,
            workingMessage: "追踪热点话题中...",
          });

          const trendManager =
            new (require("./modules/trend-manager.js").TrendManager)(this);
          await trendManager.selectBestTrend();

          agents.trendHunter.status = "completed";
          agents.trendHunter.output = "已选择最佳热点话题";
          this.setData({ agents, progressPercent: Math.floor((i / 7) * 100) });
        } else if (i === 2) {
          agents.scriptWriter.status = "working";
          this.setData({
            agents,
            currentStep: i,
            workingMessage: "创作脚本内容中...",
          });

          const scriptManager =
            new (require("./modules/script-manager.js").ScriptManager)(this);
          const script = await scriptManager.generateScript();

          agents.scriptWriter.status = "completed";
          agents.scriptWriter.output = script;
          this.setData({ agents, progressPercent: Math.floor((i / 7) * 100) });
        } else if (i === 3) {
          agents.storyboard.status = "working";
          this.setData({
            agents,
            currentStep: i,
            workingMessage: "设计分镜画面中...",
          });

          const storyboardManager =
            new (require("./modules/storyboard-manager.js").StoryboardManager)(
              this,
            );
          const storyboard = await storyboardManager.generateStoryboard();

          agents.storyboard.status = "completed";
          agents.storyboard.output = storyboard;
          this.setData({ agents, progressPercent: Math.floor((i / 7) * 100) });
        } else if (i === 4) {
          agents.videoComposer.status = "working";
          this.setData({
            agents,
            currentStep: i,
            workingMessage: "合成视频画面中...",
          });

          const videoManager =
            new (require("./modules/video-generator.js").VideoGenerator)(this);
          await videoManager.generateVideo();

          agents.videoComposer.status = "completed";
          agents.videoComposer.output = "视频合成完成";
          this.setData({ agents, progressPercent: Math.floor((i / 7) * 100) });
        } else if (i === 5) {
          agents.qualityChecker.status = "working";
          this.setData({
            agents,
            currentStep: i,
            workingMessage: "审核质检内容中...",
          });

          const qualityManager =
            new (require("./modules/quality-detector.js").QualityDetector)(
              this,
            );
          const qualityReport = await qualityManager.checkQuality();

          agents.qualityChecker.status = "completed";
          agents.qualityChecker.output = qualityReport;
          this.setData({ agents, progressPercent: Math.floor((i / 7) * 100) });
        } else if (i === 6) {
          agents.platformAdapter.status = "working";
          this.setData({
            agents,
            currentStep: i,
            workingMessage: "适配平台规范中...",
          });

          const platformManager =
            new (require("./modules/platform-adapter.js").PlatformAdapter)(
              this,
            );
          const adaptedContent = await platformManager.adaptContent();

          agents.platformAdapter.status = "completed";
          agents.platformAdapter.output = adaptedContent;
          this.setData({ agents, progressPercent: Math.floor((i / 7) * 100) });
        } else if (i === 7) {
          agents.autoPublisher.status = "working";
          this.setData({
            agents,
            currentStep: i,
            workingMessage: "自动发布到平台中...",
          });

          const publisher =
            new (require("./modules/auto-publisher.js").AutoPublisher)(this);
          await publisher.publishContent();

          agents.autoPublisher.status = "completed";
          agents.autoPublisher.output = "发布完成";
          this.setData({ agents, progressPercent: 100, working: false });
        }
      }

      this.saveCreationHistory();
      wx.showToast({
        title: "工作流完成",
        icon: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("工作流执行失败:", error);

      const agents = this.data.agents;
      agents[agentKey].status = "error";
      this.setData({ agents, working: false });

      wx.showModal({
        title: "执行失败",
        content: error.message || "未知错误",
        showCancel: false,
      });
    }
  },

  // 简化版本 - 直接处理用户输入并生成
  async handleUserInput() {
    const input = this.data.userInput;
    if (!input || input.trim() === "") {
      wx.showToast({
        title: "请输入创作需求",
        icon: "none",
      });
      return;
    }

    this.setData({ working: true, messages: [] });

    try {
      const trendManager =
        new (require("./modules/trend-manager.js").TrendManager)(this);

      const bestTrend = await trendManager.selectBestTrend();

      if (!bestTrend) {
        wx.showToast({
          title: "未找到合适的趋势话题",
          icon: "none",
        });
        this.setData({ working: false });
        return;
      }

      this.setData({
        selectedTrend: bestTrend,
        messages: [
          {
            id: Date.now(),
            sender: "system",
            content: `已选择热点话题：${bestTrend.name}`,
            time: new Date().toLocaleTimeString(),
          },
        ],
      });

      const scriptManager =
        new (require("./modules/script-manager.js").ScriptManager)(this);
      const script = await scriptManager.generateScript();

      const storyboardManager =
        new (require("./modules/storyboard-manager.js").StoryboardManager)(
          this,
        );
      const storyboard = await storyboardManager.generateStoryboard();

      this.setData({
        messages: [
          ...this.data.messages,
          {
            id: Date.now(),
            sender: "scriptWriter",
            content: script,
            time: new Date().toLocaleTimeString(),
          },
        ],
      });

      const videoManager =
        new (require("./modules/video-generator.js").VideoGenerator)(this);
      await videoManager.generateVideo();

      const qualityManager =
        new (require("./modules/quality-detector.js").QualityDetector)(this);
      const qualityReport = await qualityManager.checkQuality();

      const platformManager =
        new (require("./modules/platform-adapter.js").PlatformAdapter)(this);
      const adaptedContent = await platformManager.adaptContent();

      const finalMessage = `脚本创作完成！\n\n质量报告：${qualityReport}\n\n平台适配：${adaptedContent}`;

      this.setData({
        messages: [
          ...this.data.messages,
          {
            id: Date.now(),
            sender: "autoPublisher",
            content: finalMessage,
            time: new Date().toLocaleTimeString(),
          },
        ],
      });

      this.saveToHistory({
        input: input,
        selectedTrend: bestTrend,
        script: script,
        storyboard: storyboard,
        result: finalMessage,
        createdAt: new Date().toISOString(),
      });

      this.setData({ working: false });

      wx.showToast({
        title: "创作完成",
        icon: "success",
      });
    } catch (error) {
      console.error("创作失败:", error);

      wx.showModal({
        title: "创作失败",
        content: error.message || "未知错误",
        showCancel: false,
      });

      this.setData({ working: false });
    }
  },

  // 保存创作到历史记录
  saveToHistory(data) {
    const history = wx.getStorageSync("creation_history") || [];

    history.unshift(data);

    if (history.length > 100) {
      history.pop();
    }

    wx.setStorageSync("creation_history", history);
  },

  // 从历史记录恢复创作
  restoreCreation(e) {
    const record = e.currentTarget.dataset.record;

    if (!record) {
      return;
    }

    this.setData({
      userInput: record.input,
      selectedTrend: record.selectedTrend,
      messages: [
        {
          id: Date.now(),
          sender: "user",
          content: record.input,
          time: new Date().toLocaleTimeString(),
        },
        {
          id: record.id + 1,
          sender: "scriptWriter",
          content: record.script,
          time: new Date().toLocaleTimeString(),
        },
        {
          id: record.id + 2,
          sender: "storyboard",
          content: record.storyboard,
          time: new Date().toLocaleTimeString(),
        },
        {
          id: record.id + 3,
          sender: "autoPublisher",
          content: record.result,
          time: new Date().toLocaleTimeString(),
        },
      ],
    });
  },

  // 删除创作记录
  deleteCreation(e) {
    const id = e.currentTarget.dataset.id;

    const history = wx.getStorageSync("creation_history") || [];

    const filteredHistory = history.filter((item) => item.id !== id);

    wx.setStorageSync("creation_history", filteredHistory);

    wx.showToast({
      title: "已删除",
      icon: "success",
    });
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: "清空历史",
      content: "确定要清空所有创作历史吗？",
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync("creation_history", []);
          this.setData({ creationHistory: [] });
          wx.showToast({
            title: "已清空",
            icon: "success",
          });
        }
      },
    });
  },

  // 保存当前创作
  saveCurrentCreation() {
    if (this.data.messages.length === 0) {
      wx.showToast({
        title: "暂无可保存的内容",
        icon: "none",
      });
      return;
    }

    const currentCreation = {
      id: Date.now(),
      input: this.data.userInput,
      selectedTrend: this.data.selectedTrend,
      script:
        this.data.messages.find((m) => m.sender === "scriptWriter")?.content ||
        "",
      storyboard:
        this.data.messages.find((m) => m.sender === "storyboard")?.content ||
        "",
      result:
        this.data.messages.find((m) => m.sender === "autoPublisher")?.content ||
        "",
      createdAt: new Date().toISOString(),
    };

    this.saveToHistory(currentCreation);

    wx.showToast({
      title: "已保存",
      icon: "success",
    });
  },

  // 加载创作历史
  loadCreationHistory() {
    const history = wx.getStorageSync("creation_history") || [];

    this.setData({ creationHistory: history });
  },

  // 加载用户额度
  loadUserCredits() {
    const credits = wx.getStorageSync("user_credits");

    if (credits) {
      this.setData({
        userCredits: credits,
        dailyUsed: credits.dailyUsed || 0,
        dailyQuota: credits.dailyQuota || 3,
      });
    } else {
      const defaultCredits = {
        dailyQuota: 3,
        dailyUsed: 0,
        coins: 100,
      };

      this.setData(defaultCredits);

      wx.setStorageSync("user_credits", defaultCredits);
    }
  },

  // 刷新用户额度
  loadUserCredits() {
    wx.showModal({
      title: "刷新额度",
      content: "确定要刷新用户额度吗？",
      success: (res) => {
        if (res.confirm) {
          this.loadUserCredits();
        }
      },
    });
  },

  // 切换智能体开关
  toggleAgent(e) {
    const key = e.currentTarget.dataset.key;
    const agents = this.data.agents;

    if (agents[key]) {
      agents[key].enabled = !agents[key].enabled;
      this.setData({ agents });
    }

    const configs = this.data.agentsConfig;
    configs[key].enabled = agents[key].enabled;
    wx.setStorageSync("agents_custom_config", JSON.stringify(configs));
  },

  // 加载智能体配置
  loadAgentConfigs() {
    try {
      const configs = wx.getStorageSync("agents_custom_config");

      if (configs) {
        const parsed = JSON.parse(configs);

        this.setData({ agentsConfig: parsed });

        const agents = this.data.agents;
        for (const key in parsed) {
          if (parsed[key] && agents[key]) {
            agents[key].enabled = parsed[key].enabled;
            if (parsed[key].config) {
              agents[key].config = parsed[key].config;
            }
          }
        }
      }
    } catch (error) {
      console.error("加载配置失败:", error);
    }
  },

  // 更新工作区显示
  updateWorkspaceDisplay() {
    this.agentWorkspace = Object.values(this.data.agents).filter(
      (agent) => agent.enabled,
    );
    this.page.setData({ agentWorkspace: this.agentWorkspace });
  },

  formatTitle(item) {
    return item.input || item.selectedTrend?.name || "未命名创作";
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  },

  // 打开设置面板
  toggleSettings() {
    this.setData({ showSettings: !this.data.showSettings });
  },

  // 关闭设置面板
  closeSettings() {
    this.setData({ showSettings: false });
  },

  // 选择平台
  selectPlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    this.setData({ selectedPlatform: platform });
  },

  // 热点面板开关
  toggleTrendPanel() {
    const currentShow = !this.data.showTrendPanel;
    this.setData({ showTrendPanel: currentShow });
    if (currentShow) {
      this.loadTrends();
    }
  },

  // 刷新热点趋势
  async refreshTrends() {
    if (this.data.fetchingTrends) {
      return;
    }

    this.setData({
      fetchingTrends: true,
      hotspotDataSource: "live",
      filteredTrends: [],
    });

    try {
      const trendManager =
        new (require("./modules/trend-manager.js").TrendManager)(this);
      const trends = await trendManager.getHotspotTrends();

      this.setData({
        filteredTrends: trends,
        hotspotDataSource: "cache",
        lastHotspotFetch: new Date().toISOString(),
        fetchingTrends: false,
      });

      wx.showToast({
        title: "热点已更新",
        icon: "success",
        duration: 1500,
      });
    } catch (error) {
      console.error("刷新热点失败:", error);

      this.setData({
        hotspotDataSource: "cache-expired",
        fetchingTrends: false,
      });

      wx.showToast({
        title: "热点更新失败",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 选择热点趋势分类
  selectTrendCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedTrendCategory: category });

    if (category === "全部") {
      this.setData({ filteredTrends: this.data.trendManager?.trends || [] });
    } else {
      const trends = this.data.trendManager?.trends || [];

      const categoryMap = {
        科技: "tech",
        生活: "life",
        娱乐: "entertainment",
        美食: "food",
        旅行: "travel",
      };

      const categoryKey = categoryMap[category];
      const filtered = trends.filter((t) => t.category === categoryKey);
      this.setData({ filteredTrends: filtered });
    }
  },

  // 选择热点趋势
  selectTrendByTap(e) {
    const trend = e.currentTarget.dataset.trend;
    this.setData({ selectedTrend: trend });

    const agentWorkspaceManager =
      new (require("./modules/agent-workspace-manager.js").AgentWorkspaceManager)(
        this,
      );
    agentWorkspaceManager.setPage(this);

    const agents = this.data.agents;

    agents.trendHunter.enabled = true;
    agents.trendHunter.status = "working";
    agents.trendHunter.output = `分析热点话题：${trend.name}`;

    this.setData({ agents });
  },

  // 处理从首页传递的热点参数
  handleHotspotSelection(hotspotParam) {
    const hotspotInfo = JSON.parse(decodeURIComponent(hotspotParam));

    this.setData({
      selectedTrend: hotspotInfo,
      userInput: `请基于以下热点话题创作短视频：${hotspotInfo.name} - ${hotspotInfo.reason}`,
      hotspotCardVisible: true,
    });

    const agentWorkspaceManager =
      new (require("./modules/agent-workspace-manager.js").AgentWorkspaceManager)(
        this,
      );
    agentWorkspaceManager.setPage(this);

    const agents = this.data.agents;

    agents.trendHunter.enabled = true;
    agents.trendHunter.status = "working";
    agents.trendHunter.output = `分析热点话题：${hotspotInfo.name}`;

    this.setData({ agents });
  },

  // 输入框变化
  onInput(e) {
    this.setData({ userInput: e.detail.value });
  },

  // 聚焦输入框
  focusInput() {
    this.setData({ inputFocus: true });
  },

  // 失去焦点
  blurInput() {
    this.setData({ inputFocus: false });
  },

  // 滚动到最新消息
  scrollToNewest() {
    if (this.data.messages.length === 0) {
      return;
    }

    this.setData({ toView: "msg-latest" });
  },

  // 滚动事件处理
  onContentScroll(e) {
    this.setData({
      scrollTop: e.detail.scrollTop,
      toView: "",
    });
  },

  // 发送消息
  async sendMessage() {
    if (!this.data.userInput || this.data.userInput.trim() === "") {
      wx.showToast({
        title: "请输入创作需求",
        icon: "none",
      });
      return;
    }

    await this.handleUserInput();
  },

  // 工作流程步骤点击
  onWorkflowStepTap(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    const agentKey = e.currentTarget.dataset.agent;

    console.log(`点击工作流步骤 ${step}, 目标智能体: ${agentKey}`);

    if (this.data.working) {
      return;
    }

    const agents = this.data.agents;

    if (step === 1 && agents.trendHunter.enabled) {
      const trendManager =
        new (require("./modules/trend-manager.js").TrendManager)(this);
      trendManager.setPage(this);

      wx.navigateTo({
        url: "/pages/trend-analysis/trend-analysis",
      });
    } else if (step === 2 && agents.scriptWriter.enabled) {
      const scriptManager =
        new (require("./modules/script-manager.js").ScriptManager)(this);
      scriptManager.setPage(this);

      wx.navigateTo({
        url: "/pages/script-creation/script-creation",
      });
    } else if (step === 3 && agents.storyboard.enabled) {
      const storyboardManager =
        new (require("./modules/storyboard-manager.js").StoryboardManager)(
          this,
        );
      storyboardManager.setPage(this);

      wx.navigateTo({
        url: "/pages/storyboard/storyboard",
      });
    } else if (step === 4 && agents.videoComposer.enabled) {
      const videoManager =
        new (require("./modules/video-generator.js").VideoGenerator)(this);
      videoManager.setPage(this);

      wx.navigateTo({
        url: "/pages/video-generation/video-generation",
      });
    } else if (step === 5 && agents.qualityChecker.enabled) {
      const qualityManager =
        new (require("./modules/quality-detector.js").QualityDetector)(this);
      qualityManager.setPage(this);

      wx.navigateTo({
        url: "/pages/quality-check/quality-check",
      });
    } else if (step === 6 && agents.platformAdapter.enabled) {
      const platformManager =
        new (require("./modules/platform-adapter.js").PlatformAdapter)(this);
      platformManager.setPage(this);

      wx.navigateTo({
        url: "/pages/platform-adapter/platform-adapter",
      });
    } else if (step === 7 && agents.autoPublisher.enabled) {
      const publisher =
        new (require("./modules/auto-publisher.js").AutoPublisher)(this);
      publisher.setPage(this);

      wx.navigateTo({
        url: "/pages/auto-publish/auto-publish",
      });
    }
  },

  // 格式化JSON输出
  formatJSON(jsonStr) {
    if (!jsonStr) {
      return "";
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonStr;
    }
  },

  // 点击智能体图标（显示工作区或弹窗）
  onAgentTap(e) {
    const agentKey = e.currentTarget.dataset.agent;
    const agents = this.data.agents || this.agents;
    const agent = agents[agentKey];
    if (!agent) {
      console.warn(
        "Agent not found:",
        agentKey,
        "available keys:",
        Object.keys(agents),
      );
      return;
    }

    console.log(
      `🎯 点击智能体: ${agentKey}, 状态: ${agent.status}, 有输出: ${!!agent.output}`,
    );

    if (agent.status === "working" || agent.status === "completed") {
      console.log(`✅ 智能体状态: ${agent.status}, 滚动到工作区`);
      const targetKey = agent.key || agentKey;
      this.setData({
        toViewWorkspace: `agent-${targetKey}`,
      });

      if (agent.status === "completed" && agent.output) {
        console.log("🗑️ 清空旧输出，准备接收新工作");
        agent.output = "";
        this.setData({ agents });
      }
    } else if (agent.output) {
      console.log("💬 显示智能体输出弹窗");
      wx.showModal({
        title: agent.name,
        content: agent.output,
        showCancel: false,
      });
    } else {
      wx.showToast({
        title: "该智能体尚未开始工作",
        icon: "none",
        duration: 1500,
      });
    }
  },

  // 切换卡片展开/折叠状态
  toggleAgentCard(e) {
    const agentKey = e.currentTarget.dataset.agent;
    const agentWorkspace = this.data.agentWorkspace || [];

    const agent = agentWorkspace.find((item) => item.key === agentKey);
    if (agent) {
      agent.collapsed = !agent.collapsed;
      this.setData({ agentWorkspace });
    }
  },

  // 获取页面数据
  getPageData() {
    return {
      agents: this.data.agents,
      agentWorkspace: this.data.agentWorkspace,
    };
  },
});
