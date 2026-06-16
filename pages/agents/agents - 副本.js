// pages/agents/agents.js
// 多智能体协作系统 - 与WEB版保持一致，只使用真实API
const app = getApp();
const PromptTemplates = require("./modules/prompt-templates.js");
const AgentWorkspaceManager = require("./modules/agent-workspace-manager.js");
const StyleManager = require("./modules/style-manager.js");
const CharacterConsistencyManager = require("./modules/character-consistency.js");
const CreationHistoryManager = require("./modules/creation-history-manager.js");
const TrendManager = require("./modules/trend-manager.js");
const STYLE_LIBRARY = require("../../config/styleLibrary.js");

Page({
  data: {
    working: false,
    inputValue: "",
    currentStep: 0,
    progressPercent: 0,
    inputFocus: false,
    // 用户积分
    userCredits: null,
    dailyUsed: 0,
    dailyQuota: 3,
    // 工作流步骤
    activeAgentCount: 0,
    scrollTop: 0,
    // 消息和系统状态
    messages: [],
    toView: "",
    agentOutputs: {}, // 存储每个智能体的输出，供后续智能体使用
    testMode: "workflow", // workflow: 完整流程, single: 测试单个智能体
    selectedTestAgent: "", // 当前选中的测试智能体
    apiConfigured: false, // API是否已配置
    agentsPanelCollapsed: false, // 智能体面板是否收起
    feedbackQueue: [], // 反馈队列，存储待处理的反馈
    pendingFeedback: {}, // 待处理的反馈映射 {agentKey: feedbackText}
    hunyuanConfig: {
      enabled: false,
      endpoint: "",
      appId: "",
      secretId: "",
      secretKey: "",
      model: "glm-4-flash",
    },
    // 视频合成相关
    videoComposition: {
      storyboardImages: [], // 分镜图片
      videoSegments: [], // 视频片段
      transitions: [], // 转场效果
      subtitles: [], // 字幕
      voiceover: null, // 配音
    },
    // 多平台适配配置
    platformConfigs: {
      douyin: {
        name: "抖音",
        maxDuration: 60,
        aspectRatio: "9:16",
        tags: [],
        description: "",
      },
      kuaishou: {
        name: "快手",
        maxDuration: 57,
        aspectRatio: "9:16",
        tags: [],
        description: "",
      },
      youtube: {
        name: "YouTube Shorts",
        maxDuration: 60,
        aspectRatio: "9:16",
        tags: [],
        description: "",
      },
      bilibili: {
        name: "B站",
        maxDuration: 180,
        aspectRatio: "16:9",
        tags: [],
        description: "",
      },
    },
    selectedPlatform: "douyin", // 当前选择的平台
    // 风格面板状态
    showStylePanel: false, // 风格面板是否展开
    styleArray: [], // 风格数组（供WXML循环使用）
    // 风格库配置（从模块引入）
    styleLibrary: STYLE_LIBRARY,
    selectedStyle: "anime", // 当前选择的风格
    currentStyleIcon: "🎌", // 当前风格的图标
    currentStyleName: "日系动漫", // 当前风格的名称
    // 质检智能体状态
    qualityCheckPassed: false,
    qualityCheckResults: [],
    // 规则锁配置
    ruleLocks: {
      requireConfirmation: true, // 需要用户确认
      enableTemplateFilter: true, // 启用模板过滤
      enableContentCheck: true, // 启用内容审核
      maxRetries: 3, // 最大重试次数
    },
    apiConfig: {
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions", // 智谱AI API端点（兼容OpenAI格式）
      apiKey: "4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn", // 智谱AI API密钥
    },
    hunyuanConfig: {
      enabled: false, // 是否启用混元模型
    },

    // 热点选择模式
    trendSelectionMode: "manual", // auto: 自动选择, manual: 手动选择
    availableTrends: [], // 可选热点列表
    showTrendSelection: true, // 是否显示热点选择
    selectedTrendCategory: "全部", // 当前选中的热点分类
    trendCategories: [
      "全部",
      "科技",
      "生活",
      "娱乐",
      "美食",
      "旅行",
      "财经",
      "教育",
    ], // 热点分类
    filteredTrends: [], // 筛选后的热点列表
    // 热点数据状态
    hotspotDataSource: "cache", // live: 实时数据, cache: 缓存数据, mock: 示例数据
    isSelectingTrend: false, // 是否正在选择热点（防重复点击）
    lastHotspotFetch: null, // 最后获取热点的时间
    fetchingTrends: false, // 是否正在获取热点
    // 选中的热点
    selectedHotspot: null, // 当前选中的热点对象
    hotspotCardVisible: false, // 热点卡片是否可见
    hotspotCardCollapsed: false, // 热点卡片是否折叠
    // 创作历史
    creationHistory: [], // 创作历史记录
    creationHistoryManager: null, // 创作历史管理器实例

    // AI Agent 相关状态
    aiThinking: null, // AI思考内容
    thinkingVisible: false, // 思考过程显示状态
    isStreaming: false, // 流式响应状态
    aiResponse: "", // AI响应内容
    showHistory: false, // 是否显示历史面板
    // 工作流控制
    isCancelled: false, // 是否已取消
    workflow: [
      { key: "trendHunter", name: "热点追踪", icon: "🔥", order: 1 },
      { key: "scriptWriter", name: "脚本创作", icon: "", order: 2 },
      { key: "storyboard", name: "分镜制作", icon: "🎨", order: 3 },
      { key: "videoComposer", name: "视频合成", icon: "🎬", order: 4 },
      { key: "qualityChecker", name: "质检审核", icon: "", order: 5 },
      { key: "platformAdapter", name: "平台适配", icon: "📱", order: 6 },
      { key: "autoPublisher", name: "自动发布", icon: "🚀", order: 7 },
    ],
    agentList: [],
    activeAgentCount: 0, // 活跃智能体数量
    statusText: {
      idle: "等待中",
      working: "处理中",
      completed: "已完成",
      error: "错误",
    },
    agentIcons: {
      user: "👤",
      trendHunter: "🔥",
      scriptWriter: "",
      storyboard: "🎨",
      videoComposer: "🎬",
      qualityChecker: "",
      platformAdapter: "📱",
      autoPublisher: "🚀",
    },
    settingsCollapsed: true, // 设置面板是否收起
    showTrendPanel: false, // 热点面板是否显示
    // 智能体状态（从配置和用户偏好加载，不在data中硬编码）
    agents: {}, // 在 onLoad 中初始化
    // 智能体工作区
    agentWorkspace: [],
    toViewWorkspace: "",
    // 输入框焦点
    inputFocus: false,
    // 用户积分
    userCredits: null,
    dailyUsed: 0,
    dailyQuota: 3,
    // 工作流步骤
    activeAgentCount: 0,
    progressPercent: 0,
    currentStep: 0,
    scrollTop: 0,
  },

  onLoad(options) {
    this.styleManager = new StyleManager(this);
    this.characterConsistencyManager = new CharacterConsistencyManager(this);
    this.trendManager = new TrendManager(this);
    this.creationHistoryManager = new CreationHistoryManager(this);
    this.agentWorkspaceManager = new AgentWorkspaceManager(this);
    this.agentWorkspaceManager.updateWorkspaceDisplay();

    // 加载风格库配置
    const styleArray = Object.entries(STYLE_LIBRARY).map(([key, value]) => ({
      key,
      value,
    }));

    // 加载用户选择的风
    const savedStyle = wx.getStorageSync("selected_style") || "anime";
    const currentStyle = STYLE_LIBRARY[savedStyle] || STYLE_LIBRARY.anime;

    this.setData({
      styleArray,
      selectedStyle: savedStyle,
      currentStyleIcon: currentStyle.icon || "🎌",
      currentStyleName: currentStyle.name || "日系动漫",
    });

    console.log("风格库已加载:", styleArray.length, "种风格");
    console.log("当前风格:", savedStyle);

    // 加载智能体面板偏好设置
    this.loadAgentsPanelPreference();

    // 初始化智能体列表（按执行顺序）
    const agentsConfig = app.globalData.agentsConfig;

    // 从本地存储加载智能体启用状态
    let savedAgentsConfig;
    try {
      savedAgentsConfig = wx.getStorageSync("agents_config") || {};
    } catch (error) {
      console.warn("加载智能体配置失败，使用默认值", error);
      savedAgentsConfig = {};
    }

    const agentList = agentsConfig.agents
      .map((agent) => ({
        ...agent,
        active:
          savedAgentsConfig[agent.key]?.enabled !== undefined
            ? savedAgentsConfig[agent.key].enabled
            : agent.enabled, // 优先使用保存的配置，否则使用默认值
        status: "idle",
      }))
      .sort((a, b) => a.order - b.order);

    // Initialize workflow array
    const workflow = this.data.workflow.map((item) => {
      const agent = agentList.find((a) => a.key === item.key);
      return {
        ...item,
        isActive: agent ? agent.active : false,
      };
    });

    // 计算活跃智能体数量
    const activeAgentCount = agentList.filter((a) => a.active).length;

    // 创建智能体状态对象（使用新key）
    const agents = {};
    agentList.forEach((agent) => {
      agents[agent.key] = {
        enabled: agent.active,
        status: "idle",
        key: agent.key,
        name: agent.name,
        icon: agent.icon,
      };
    });

    this.setData({
      agentList,
      workflow,
      activeAgentCount,
      agents,
    });

    // 添加旧 key 兼容（热点状态栏）
    agents.hotspot = {
      enabled: agents.trendHunter?.enabled || false,
      status: agents.trendHunter?.status || "idle",
      key: "trendHunter",
      name: "热点追踪",
      icon: "🔥",
    };

    // 添加 WXML 兼容映射（旧key -> 新key）
    agents.script = agents.scriptWriter;
    agents.editor = agents.qualityChecker;
    agents.video = agents.videoComposer;
    agents.story = agents.storyboard;
    agents.dataAnalysis = agents.platformAdapter;
    agents.roleConsistency = agents.autoPublisher;

    // 添加旧key到新key的映射（兼容旧版WXML）
    const keyMapping = {
      hotspot: "trendHunter",
      script: "scriptWriter",
      video: "videoComposer",
      editor: "qualityChecker",
    };

    Object.entries(keyMapping).forEach(([oldKey, newKey]) => {
      if (agents[newKey]) {
        agents[oldKey] = agents[newKey];
      }
    });

    // 添加可选的智能体（如果不存在则设置为禁用）
    const optionalAgents = ["dataAnalysis", "roleConsistency"];
    optionalAgents.forEach((key) => {
      if (!agents[key]) {
        agents[key] = {
          enabled: false,
          status: "idle",
          key: key,
          name: key === "dataAnalysis" ? "数据分析" : "角色一致性",
          icon: key === "dataAnalysis" ? "📊" : "👥",
        };
      }
    });

    // 处理从首页传递的热点参数（JSON格式）
    let selectedHotspot = null;
    let inputValue = "";
    let hotspotCardVisible = false;
    let hotspotCardCollapsed = false;

    if (options.hotspot) {
      try {
        const hotspotInfo = JSON.parse(decodeURIComponent(options.hotspot));
        console.log("从首页/模板库获取的热点信息:", hotspotInfo);

        // 设置选中的热点（显示在热点卡片中）
        selectedHotspot = {
          name: hotspotInfo.name || hotspotInfo.title || "未知热点",
          reason: hotspotInfo.description || `来自${hotspotInfo.source}的热点`,
          score: hotspotInfo.heat || hotspotInfo.hotness || 80,
          source: hotspotInfo.source || "未知",
        };

        // 设置输入值（优先使用热点描述）
        inputValue = hotspotInfo.description || hotspotInfo.title || "";
        hotspotCardVisible = true;
        hotspotCardCollapsed = false;

        console.log("从首页/模板库热点进入，已设置热点和输入值", {
          selectedHotspot,
          inputValue,
        });
      } catch (error) {
        console.error("解析热点参数失败:", error);
        // 如果解析失败，尝试使用旧的参数格式
        if (options.trend && options.reason) {
          const trendName = decodeURIComponent(options.trend);
          const trendReason = decodeURIComponent(options.reason);
          inputValue = `请根据热点"${trendName}"帮我创作一个短视频。${trendReason}`;
          console.log("从首页热点进入（旧格式）", inputValue);
        }
      }
    }
    // 如果有模板参数且没有热点参数（避免覆盖热点设置的 inputValue）
    else if (options.template) {
      const templateMap = {
        "ai-tool":
          "帮我制作一个关于AI工具的短视频，展示工具的核心功能和使用效果",
        "side-hustle":
          "帮我制作一个关于副业变现的短视频，教大家如何通过副业增加收入",
        "life-tips": "帮我制作一个分享生活小技巧的短视频，内容要实用易懂",
        "product-review": "帮我制作一个产品测评短视频，详细介绍产品特点和优势",
        "food-making": "帮我制作一个美食制作短视频，展示美食制作过程",
        "travel-vlog": "帮我制作一个旅行Vlog，记录旅行中的美好瞬间",
        fitness: "帮我制作一个健身教学短视频，分享健身动作和技巧",
        "music-cover": "帮我制作一个音乐翻唱短视频，演唱流行歌曲",
        "new-energy-data": "帮我制作一个关于新能源汽车数据分析的短视频",
        "financial-analysis": "帮我制作一个金融数据分析短视频，适合投资类账号",
        "game-creative":
          "帮我制作一个游戏创意内容短视频，展示游戏创意和爆款视频策划",
        "ai-application":
          "帮我制作一个鸿蒙智能应用短视频，开发鸿蒙系统智能应用",
        "intelligent-competition":
          "帮我制作一个智能大赛创意短视频，展示智能比赛和大赛内容创作",
        "code-analysis":
          "帮我制作一个开源代码分析短视频，分析和解读开源项目代码",
        "chip-analysis":
          "帮我制作一个芯片半导体分析短视频，分析芯片和半导体行业",
        "ai-content":
          "帮我制作一个AIGC内容创作短视频，AI生成内容创作和工具应用",
      };

      inputValue = templateMap[options.template] || "";
    }
    // 如果有 input 参数（从首页"开始创作"按钮进入）
    else if (options.input) {
      inputValue = decodeURIComponent(options.input);
      console.log("从首页输入框进入，输入内容:", inputValue);

      // 标记需要自动开始创作
      this.autoStartCreation = true;
    }

    // 统一设置所有数据，避免多次 setData 导致的覆盖问题
    this.setData({
      agentList,
      workflow,
      activeAgentCount,
      agents,
      selectedHotspot,
      inputValue,
      hotspotCardVisible,
      hotspotCardCollapsed,
    });

    // 🆕 同步数据到 agentWorkspaceManager
    if (this.agentWorkspaceManager) {
      this.agentWorkspaceManager.agents = agents;
      // 初始化空的工作区（智能体工作后会填充）
      this.agentWorkspaceManager.agentWorkspace = [];
      console.log("✅ agentWorkspaceManager 已初始化");
    }
  },

  onShow() {
    // 每次显示页面重新检查API配置
    this.loadAPIConfig();
    // 加载创作历史
    this.loadCreationHistory();
    // 加载热点数据
    this.trendManager.fetchTrends();

    // 如果标记了自动开始创作，则自动触发创作流程
    if (this.autoStartCreation && this.data.inputValue) {
      console.log("自动开始创作流程");
      this.autoStartCreation = false; // 清除标记，避免重复触发

      // 延迟500ms执行，确保页面完全加载
      setTimeout(() => {
        this.sendMessage();
      }, 500);
    }
  },

  getAgentOrder(key) {
    const orderMap = {
      trendHunter: 1,
      scriptWriter: 2,
      storyboard: 3,
      videoComposer: 4,
      qualityChecker: 5,
      platformAdapter: 6,
      autoPublisher: 7,
    };
    return orderMap[key] || 99;
  },

  // 加载API配置
  loadAPIConfig() {
    try {
      const config = wx.getStorageSync("ai_api_config") || {};
      // 如果本地存储没有配置，使用代码中的默认配置?
      if (!config.apiKey) {
        config.apiKey = this.data.apiConfig.apiKey;
        config.endpoint = this.data.apiConfig.endpoint;
      }
      const apiConfigured = !!(config.endpoint && config.apiKey);
      this.setData({
        apiConfig: config,
        apiConfigured,
      });
    } catch (error) {
      console.error("加载API配置失败:", error);
    }
  },

  // 加载学习数据
  loadLearningData() {
    try {
      const learningData = wx.getStorageSync("ai_learning_data") || {
        likedScripts: [],
        dislikedScripts: [],
        modifiedScripts: [],
        popularStoryboards: [],
        effectiveTags: [],
      };
      this.setData({ learningData });
      console.log("学习数据加载成功", learningData);
    } catch (error) {
      console.error("加载学习数据失败:", error);
    }
  },

  // 保存学习数据
  saveLearningData() {
    try {
      wx.setStorageSync("ai_learning_data", this.data.learningData);
      console.log("学习数据保存成功");
    } catch (error) {
      console.error("保存学习数据失败:", error);
    }
  },

  // 加载模板
  loadTemplateLibrary() {
    try {
      const templateLibrary = wx.getStorageSync("ai_template_library") || [];
      const popularTemplates = wx.getStorageSync("ai_popular_templates") || [];
      this.setData({
        templateLibrary,
        popularTemplates,
      });
      console.log("模板库加载成功", {
        templateCount: templateLibrary.length,
        popularCount: popularTemplates.length,
      });
    } catch (error) {
      console.error("加载模板库失败", error);
    }
  },

  // 保存模板
  saveTemplateLibrary() {
    try {
      wx.setStorageSync("ai_template_library", this.data.templateLibrary);
      wx.setStorageSync("ai_popular_templates", this.data.popularTemplates);
      console.log("模板库保存成功");
    } catch (error) {
      console.error("保存模板库失败", error);
    }
  },

  // 加载创作历史（从云数据库）
  async loadCreationHistory() {
    try {
      if (!app.globalData.cloudInitialized) {
        console.warn("云开发未初始化，无法加载云端历史");
        this.setData({ creationHistory: [] });
        return;
      }

      wx.showLoading({ title: "加载历史中..." });

      const db = wx.cloud.database();
      const result = await db
        .collection("creation_history")
        .where({
          _openid: "{openid}", // 自动匹配当前用户
        })
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const history = result.data || [];
      this.setData({ creationHistory: history });
      console.log("创作历史加载成功", history.length + "条");

      wx.hideLoading();
    } catch (error) {
      console.error("加载创作历史失败:", error);
      wx.hideLoading();
      wx.showToast({ title: "加载历史失败", icon: "none" });
      this.setData({ creationHistory: [] });
    }
  },

  // 保存创作历史（到云数据库）
  async saveCreationHistory() {
    try {
      if (!app.globalData.cloudInitialized) {
        wx.showToast({ title: "请先登录", icon: "none" });
        return;
      }

      const messages = this.data.messages;
      if (!messages || messages.length === 0) {
        wx.showToast({ title: "暂无内容可保存", icon: "none" });
        return;
      }

      wx.showLoading({ title: "保存中..." });

      const db = wx.cloud.database();
      const creationRecord = {
        inputValue: this.data.inputValue,
        messages: messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 如果有当前选中的热点，也一起保存
      if (this.data.selectedHotspot) {
        creationRecord.hotspot = this.data.selectedHotspot;
      }

      const result = await db.collection("creation_history").add({
        data: creationRecord,
      });

      console.log("创作历史保存成功", result._id);
      wx.hideLoading();
      wx.showToast({ title: "已保存到云端", icon: "success" });

      // 重新加载历史列表
      await this.loadCreationHistory();
    } catch (error) {
      console.error("保存创作历史失败:", error);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    }
  },

  // 加载智能体面板偏好设置
  loadAgentsPanelPreference() {
    try {
      // 检查是否是第一次访问
      const visited = wx.getStorageSync("agents_panel_visited");
      const userPreference = wx.getStorageSync("agents_panel_collapsed");

      if (!visited) {
        // 第一次访问：展开面板，并显示提示
        this.setData({ agentsPanelCollapsed: false });

        // 延迟1秒显示提示，让用户先看到界面
        setTimeout(() => {
          wx.showToast({
            title: "点击顶部可收起智能体面板",
            icon: "none",
            duration: 3000,
          });
        }, 1000);

        // 标记为已访问
        wx.setStorageSync("agents_panel_visited", true);
        console.log("首次访问，展开智能体面板");
      } else {
        // 非首次访问：使用用户偏好
        const collapsed = userPreference !== undefined ? userPreference : false;
        this.setData({ agentsPanelCollapsed: collapsed });
        console.log("加载用户偏好，面板状态：", collapsed ? "收起" : "展开");
      }
    } catch (error) {
      console.error("加载智能体面板偏好失败?", error);
      this.setData({ agentsPanelCollapsed: false });
    }
  },

  // 获取热点趋势（委托给 TrendManager）
  async fetchHotTrends() {
    return await this.trendManager.fetchTrends();
  },

  // mapHotspotsToTrends 已移至 TrendManager 模块

  // 将成功的工作流保存为模板
  async saveAsTemplate() {
    const messages = this.data.messages;
    const userMessages = messages.filter((m) => m.sender === "user");

    if (userMessages.length === 0) {
      wx.showToast({ title: "没有可保存的内容", icon: "none" });
      return;
    }

    wx.showModal({
      title: "保存为模板",
      content: "将当前成功的创作流程保存为模板，方便以后复用",
      editable: true,
      placeholderText: "输入模板名称",
      success: (res) => {
        if (res.confirm && res.content) {
          const templateName = res.content.trim();

          // 收集所有智能体的输出
          const templateData = {
            id: Date.now(),
            name: templateName,
            userInput: userMessages[0].content,
            agentOutputs: this.data.agentOutputs,
            videoComposition: this.data.videoComposition,
            platformConfigs: this.data.platformConfigs,
            createdAt: new Date().getTime(),
            likeCount: 0,
            useCount: 0,
          };

          // 保存到模板库
          const templateLibrary = [...this.data.templateLibrary, templateData];
          this.setData({ templateLibrary });
          this.saveTemplateLibrary();

          wx.showToast({
            title: "模板已保存",
            icon: "success",
          });
        }
      },
    });
  },

  // 使用模板
  useTemplate(template) {
    wx.showModal({
      title: "使用模板",
      content: `确定使用模板"${template.name}"吗？\n\n这将基于该模板的配置开始创作`,
      success: (res) => {
        if (res.confirm) {
          // 增加使用次数
          const templateLibrary = this.data.templateLibrary.map((t) => {
            if (t.id === template.id) {
              return { ...t, useCount: (t.useCount || 0) + 1 };
            }
            return t;
          });
          this.setData({ templateLibrary });
          this.saveTemplateLibrary();

          // 填充用户输入
          this.setData({ inputValue: template.userInput });

          wx.showToast({
            title: "模板已应用",
            icon: "success",
          });
        }
      },
    });
  },

  // 点赞模板
  likeTemplate(template) {
    const templateLibrary = this.data.templateLibrary.map((t) => {
      if (t.id === template.id) {
        return { ...t, likeCount: (t.likeCount || 0) + 1 };
      }
      return t;
    });

    // 更新热门模板列表（按点赞数排序）
    const popularTemplates = [...templateLibrary]
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 10);

    this.setData({
      templateLibrary,
      popularTemplates,
    });
    this.saveTemplateLibrary();

    wx.showToast({ title: "已点赞", icon: "success" });
  },

  // 记录点赞反馈到学习系
  recordLikeFeedback(message, content) {
    const learningData = this.data.learningData;
    const sender = message.sender;

    if (sender === "scriptWriter") {
      learningData.likedScripts.push({
        content,
        timestamp: new Date().getTime(),
        feedbackType: "like",
      });
    } else if (sender === "storyboard") {
      learningData.popularStoryboards.push({
        content,
        timestamp: new Date().getTime(),
        feedbackType: "like",
      });
    }

    this.setData({ learningData });
    this.saveLearningData();

    console.log(`已记录点赞反 ${sender}`, content.substring(0, 50));
  },

  // 记录不满意反馈到学习系统
  recordDislikeFeedback(message, content, feedbackText) {
    const learningData = this.data.learningData;
    const sender = message.sender;

    if (sender === "scriptWriter") {
      learningData.dislikedScripts.push({
        content,
        feedback: feedbackText,
        timestamp: new Date().getTime(),
        feedbackType: "dislike",
      });
    }

    this.setData({ learningData });
    this.saveLearningData();

    console.log(`已记录不满意反馈: ${sender}`, feedbackText);
  },

  // 记录用户修改到学习系
  recordUserModification(agentKey, originalContent, modifiedContent) {
    const learningData = this.data.learningData;

    learningData.modifiedScripts.push({
      agentKey,
      originalContent,
      modifiedContent,
      timestamp: new Date().getTime(),
      feedbackType: "modification",
    });

    this.setData({ learningData });
    this.saveLearningData();

    console.log(`已记录用户修 ${agentKey}`);
  },

  // 应用学习数据优化提示
  applyLearningToPrompt(basePrompt, agentType) {
    const learningData = this.data.learningData;
    let enhancedPrompt = basePrompt;

    // 根据智能体类型应用学习数
    if (agentType === "scriptWriter" && learningData.likedScripts.length > 0) {
      const popularPattern = this.extractPattern(learningData.likedScripts);
      if (popularPattern) {
        enhancedPrompt += `\n\n【学习建议】根据历史受欢迎内容，建议：${popularPattern}`;
      }
    } else if (
      agentType === "storyboard" &&
      learningData.popularStoryboards.length > 0
    ) {
      const popularPattern = this.extractPattern(
        learningData.popularStoryboards,
      );
      if (popularPattern) {
        enhancedPrompt += `\n\n【学习建议】根据历史受欢迎分镜，建议：${popularPattern}`;
      }
    }

    return enhancedPrompt;
  },

  // 提取受欢迎内容的模式
  extractPattern(items) {
    if (items.length < 3) return null;

    // 简单模式提取：查找常见的关键词和结
    // 在实际应用中，可以使用更复杂的NLP技
    const keywords = {};
    items.forEach((item) => {
      const words = item.content
        .split(/[\s,，。！?!]+/)
        .filter((w) => w.length > 1);
      words.forEach((word) => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    });

    // 找出出现频率最高的关键
    const sortedKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    if (sortedKeywords.length > 0) {
      return `内容应包含这些元素：${sortedKeywords.join("、")}`;
    }

    return null;
  },

  // 保存API配置
  saveAPIConfig(config) {
    try {
      wx.setStorageSync("ai_api_config", config);
      this.setData({
        apiConfig: config,
        apiConfigured: !!(config.endpoint && config.apiKey),
      });
      wx.showToast({
        title: "配置已保存",
        icon: "success",
      });
    } catch (error) {
      console.error("保存API配置失败:", error);
      wx.showToast({
        title: "配置保存失败",
        icon: "error",
      });
    }
  },

  // 加载混元配置
  loadHunyuanConfig() {
    try {
      const config = wx.getStorageSync("hunyuan_config");
      if (config) {
        this.setData({ hunyuanConfig: config });
        console.log("混元配置加载成功:", config);
      }
    } catch (error) {
      console.error("加载混元配置失败:", error);
    }
  },

  // 保存混元配置
  saveHunyuanConfig(config) {
    try {
      wx.setStorageSync("hunyuan_config", config);
      this.setData({ hunyuanConfig: config });
      wx.showToast({
        title: "混元配置已保存",
        icon: "success",
      });
    } catch (error) {
      console.error("保存混元配置失败:", error);
      wx.showToast({
        title: "配置保存失败",
        icon: "error",
      });
    }
  },

  // 显示配置对话
  showConfigDialog() {
    wx.showActionSheet({
      itemList: ["配置智谱AI (GLM)", "配置角色一致性", "查看当前配置"],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showGLMConfigDialog();
        } else if (res.tapIndex === 1) {
          this.showCharacterConsistencyConfig();
        } else if (res.tapIndex === 2) {
          this.showCurrentConfig();
        }
      },
    });
  },

  // 显示GLM配置对话框
  showGLMConfigDialog() {
    wx.showModal({
      title: "配置智谱AI API",
      content:
        "当前使用 glm-4.6v-flash 免费模型\n\n请输入您的智谱AI API密钥\n\n获取地址: https://open.bigmodel.cn/usercenter/apikeys",
      editable: true,
      placeholderText: this.data.apiConfig.apiKey || "请输入您的API密钥",
      success: (res) => {
        if (res.confirm && res.content) {
          const apiKey = res.content.trim();
          if (apiKey) {
            this.saveAPIConfig({
              endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
              apiKey,
            });
          }
        }
      },
    });
  },

  // 显示当前配置
  showCurrentConfig() {
    const glmStatus = this.data.apiConfigured ? "已配置" : "未配置";
    const hunyuanStatus = this.data.hunyuanConfig.enabled ? "已启用" : "未启用";
    const hunyuanSecretId = this.data.hunyuanConfig.secretId
      ? "已配置"
      : "未配置";
    const hunyuanSecretKey = this.data.hunyuanConfig.secretKey
      ? "已配置"
      : "未配置";

    const message =
      `【智谱AI (GLM)】\n` +
      `状态: ${glmStatus}\n` +
      `文本: glm-4.7-flash\n` +
      `图片: cogview-3-flash\n\n` +
      `【混元AI (混元)】\n` +
      `状态: ${hunyuanStatus}\n` +
      `SecretId: ${hunyuanSecretId}\n` +
      `SecretKey: ${hunyuanSecretKey}\n\n` +
      `【热点选择】\n` +
      `模式: ${this.data.trendSelectionMode}\n` +
      `分类: ${this.data.selectedTrendCategory}\n\n` +
      `【工作流程】\n` +
      `1. 优先使用GLM生图\n` +
      `2. 如启用混元，优先使用混元生图\n` +
      `3. 支持多平台适配`;

    wx.showModal({
      title: "当前配置详情",
      content: message,
      showCancel: false,
      confirmText: "知道了",
    });
  },

  // 切换测试模式
  switchTestMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      testMode: mode,
      selectedTestAgent: mode === "single" ? "" : "",
    });
  },

  // 选择测试的智能体
  selectTestAgent(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ selectedTestAgent: key });
  },

  // 切换智能体启用状
  toggleAgent(e) {
    if (this.data.working) return;

    const key = e.currentTarget.dataset.key;
    const agentList = this.data.agentList.map((agent) => {
      if (agent.key === key) {
        return { ...agent, active: !agent.active };
      }
      return agent;
    });

    // 更新workflow数组中的isActive
    const workflow = this.data.workflow.map((item) => {
      if (item.key === key) {
        const agent = agentList.find((a) => a.key === key);
        return {
          ...item,
          isActive: agent ? agent.active : false,
        };
      }
      return item;
    });

    // 计算活跃智能体数
    const activeAgentCount = agentList.filter((a) => a.active).length;

    this.setData({
      agentList,
      workflow,
      activeAgentCount,
    });
  },

  // 切换智能体面板的展开/收起
  toggleAgentsPanel() {
    const newState = !this.data.agentsPanelCollapsed;

    this.setData({
      agentsPanelCollapsed: newState,
    });

    // 保存用户偏好
    try {
      wx.setStorageSync("agents_panel_collapsed", newState);
      console.log("保存面板状态偏好", newState ? "收起" : "展开");
    } catch (error) {
      console.error("保存面板状态失败?", error);
    }

    // 显示操作提示
    wx.showToast({
      title: newState ? "已收起智能体面板" : "已展开智能体面板",
      icon: "none",
      duration: 1500,
    });
  },

  // 切换风格面板的展开/收起
  toggleStylePanel() {
    const newState = !this.data.showStylePanel;

    this.setData({
      showStylePanel: newState,
    });

    // 显示操作提示
    wx.showToast({
      title: newState ? "已收起风格面板" : "已展开风格面板",
      icon: "none",
      duration: 1500,
    });
  },

  // 输入内容
  onInput(e) {
    this.setData({
      inputValue: e.detail.value,
    });
  },

  // 发送消开始创
  async sendMessage() {
    if (this.data.working) return;

    if (!this.data.apiConfigured) {
      wx.showModal({
        title: "未配置API",
        content: "请先配置AI API密钥才能使用",
        confirmText: "去配置",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.showConfigDialog();
          }
        },
      });
      return;
    }

    if (!this.data.inputValue.trim()) {
      wx.showToast({ title: "请输入创作需求", icon: "none" });
      return;
    }

    // 添加用户消息
    this.addMessage("user", this.data.inputValue);

    // 清空输入
    const userInput = this.data.inputValue;
    this.setData({ inputValue: "" });

    // 根据测试模式执行
    if (this.data.testMode === "single") {
      // 单个智能体测
      if (!this.data.selectedTestAgent) {
        wx.showToast({ title: "请选择要测试的智能体", icon: "none" });
        return;
      }
      await this.testSingleAgent(this.data.selectedTestAgent, userInput);
    } else {
      // 完整工作
      await this.executeFullWorkflow(userInput);
    }
  },

  // 测试单个智能
  async testSingleAgent(agentKey, userInput) {
    this.setData({ working: true });

    // 更新智能体状态为工作
    this.updateAgentStatus(agentKey, "working", 10);

    // 添加"正在处理"消息
    this.addMessage(agentKey, "正在分析您的需求，稍等片刻...", true);

    try {
      // 直接调用真实API（暂不支持媒体）
      const response = await this.callAIAPI(agentKey, userInput, [], null);

      // 移除"正在处理"，添加实际回复（包含图片数据
      const imageUrlArray = (response.images || [])
        .filter((img) => img.imageUrl)
        .map((img) => img.imageUrl);
      const messageData = {
        content: response.reply,
        images: response.images || [],
        videos: response.videos || [],
        imageUrlArray: imageUrlArray,
      };
      this.updateMessageWithData(agentKey, messageData, false);

      // 保存智能体输
      const agentOutputs = this.data.agentOutputs;
      agentOutputs[agentKey] = response.reply;
      this.setData({ agentOutputs });

      // 更新智能体状态为完成
      this.updateAgentStatus(agentKey, "completed", 100);

      wx.showToast({ title: "测试完成", icon: "success" });
    } catch (error) {
      console.error("测试失败:", error);
      this.updateAgentStatus(agentKey, "error", 0);
      this.updateMessage(agentKey, `测试失败{error.message}`, false);
      wx.showToast({
        title: "测试失败",
        icon: "error",
        duration: 5000,
      });
    }

    this.setData({ working: false });
  },

  // 选择发布平台
  selectPlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    this.setData({ selectedPlatform: platform });

    const platformName = this.data.platformConfigs[platform].name;
    wx.showToast({
      title: `已选择${platformName}`,
      icon: "none",
      duration: 1500,
    });

    // 平台选择后，可以在这里更新提示词或参
    console.log(`选择发布平台: ${platform}`);
  },

  // 显示所有模
  showAllTemplates() {
    wx.navigateTo({
      url: "/pages/templates/templates",
    });
  },

  // 切换学习面板
  toggleLearningPanel() {
    this.setData({
      showLearningPanel: !this.data.showLearningPanel,
    });
  },

  // 清空学习数据
  clearLearningData() {
    wx.showModal({
      title: "确认清空",
      content: "清空后AI将失去已学习的偏好，确定要清空吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            learningData: {
              likedScripts: [],
              dislikedScripts: [],
              modifiedScripts: [],
              popularStoryboards: [],
              effectiveTags: [],
            },
          });
          this.saveLearningData();

          wx.showToast({
            title: "学习数据已清空",
            icon: "success",
          });
        }
      },
    });
  },

  // 显示规则锁配
  showRuleLockConfig() {
    const ruleLocks = this.data.ruleLocks;

    const options = [
      ruleLocks.requireConfirmation ? "条需要用户确认" : "条需要用户确认",
      ruleLocks.enableTemplateFilter ? "条启用模板过滤" : "条启用模板过滤",
      ruleLocks.enableContentCheck ? "条启用内容审核" : "条启用内容审核",
      "最大重试次数 " + ruleLocks.maxRetries,
    ];

    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const index = res.tapIndex;
        const newRuleLocks = { ...ruleLocks };

        if (index === 0) {
          newRuleLocks.requireConfirmation = !ruleLocks.requireConfirmation;
        } else if (index === 1) {
          newRuleLocks.enableTemplateFilter = !ruleLocks.enableTemplateFilter;
        } else if (index === 2) {
          newRuleLocks.enableContentCheck = !ruleLocks.enableContentCheck;
        } else if (index === 3) {
          wx.showModal({
            title: "设置最大重试次数",
            content: "请输入最大重试次数1-10)",
            editable: true,
            placeholderText: ruleLocks.maxRetries.toString(),
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                const value = parseInt(modalRes.content);
                if (value >= 1 && value <= 10) {
                  newRuleLocks.maxRetries = value;
                  this.setData({ ruleLocks: newRuleLocks });
                  wx.showToast({
                    title: "设置已保存",
                    icon: "success",
                  });
                }
              }
            },
          });
          return;
        }

        this.setData({ ruleLocks: newRuleLocks });

        wx.showToast({
          title: "规则锁已更新",
          icon: "success",
        });
      },
    });
  },

  // 执行完整工作流（多智能体协作）
  async executeFullWorkflow(userInput) {
    // 重置取消状态
    this.setData({
      working: true,
      currentStep: 0,
      progressPercent: 0,
      agentOutputs: {},
      feedbackQueue: [],
      pendingFeedback: {},
      isCancelled: false,
    });

    // 获取按顺序排列的活跃智能
    const activeAgents = this.data.agentList
      .filter((a) => a.active)
      .sort((a, b) => a.order - b.order);

    if (activeAgents.length === 0) {
      wx.showToast({ title: "请至少启用一个智能体", icon: "none" });
      this.setData({ working: false });
      return;
    }

    // 显示开始消
    this.addMessage(
      "system",
      `🚀 开始多智能体协作，${activeAgents.length} 个智能体参与`,
    );

    // 依次执行每个智能体
    for (let i = 0; i < activeAgents.length; i++) {
      // 检查是否已取消
      if (this.data.isCancelled) {
        console.log("工作流已被用户取消");
        this.addMessage("system", "⚠️ 用户取消了创作任务");
        this.setData({ working: false, currentStep: 0 });
        return;
      }

      const agent = activeAgents[i];
      const stepNumber = i + 1;

      // 更新当前步骤
      this.setData({ currentStep: stepNumber });

      // 更新智能体状态为工作
      this.updateAgentStatus(agent.key, "working", 10);

      // 添加步骤消息
      this.addMessage(
        "system",
        `步骤 ${stepNumber}/${activeAgents.length}{agent.name} 开始工作`,
      );

      // 添加"正在处理"消息
      this.addMessage(agent.key, "正在分析需求并生成内容...", true);

      try {
        // 检查是否有待处理的反馈
        const pendingFeedback = this.data.pendingFeedback[agent.key];
        let finalUserInput = userInput;

        if (pendingFeedback) {
          // 如果有反馈，将反馈添加到用户输入
          finalUserInput = `${userInput}\n\n【用户反馈${pendingFeedback}`;
          console.log(
            `使用反馈重新生成 ${agent.key}，反馈内容：`,
            pendingFeedback,
          );

          // 清除已处理的反馈
          const newPendingFeedback = { ...this.data.pendingFeedback };
          delete newPendingFeedback[agent.key];
          this.setData({ pendingFeedback: newPendingFeedback });

          // 从队列中移除该反
          const feedbackQueue = this.data.feedbackQueue.filter(
            (f) => f.agentKey !== agent.key,
          );
          this.setData({ feedbackQueue });
        }

        // 构建上下文（包含前置智能体的输出
        const context = this.buildAgentContext(agent.key);

        // 调用真实API（暂不支持媒体）
        const response = await this.callAIAPI(
          agent.key,
          finalUserInput,
          context,
          null,
        );

        // 检查是否已取消（API调用后）
        if (this.data.isCancelled) {
          console.log("工作流在API调用后被取消");
          this.addMessage("system", "⚠️ 用户取消了创作任务");
          this.setData({ working: false, currentStep: 0 });
          return;
        }

        // 移除"正在处理"，添加实际回复（包含图片/视频数据
        const imageUrlArray = (response.images || [])
          .filter((img) => img.imageUrl)
          .map((img) => img.imageUrl);
        const messageData = {
          content: response.reply,
          images: response.images || [],
          videos: response.videos || [],
          imageUrlArray: imageUrlArray,
          liked: false,
          disliked: false,
        };
        this.updateMessageWithData(agent.key, messageData, false);

        // 保存智能体输出（供后续智能体使用）
        const agentOutputs = this.data.agentOutputs;
        agentOutputs[agent.key] = {
          output: response.reply,
          timestamp: new Date().getTime(),
        };
        this.setData({ agentOutputs });

        // 🆕 更新工作区显示（保存输出到工作区卡片）
        this.saveAgentOutputToWorkspace(agent.key, response.reply);

        // 如果是scriptWriter智能体且角色一致性已启用，执行角色三视图生成
        if (
          agent.key === "scriptWriter" &&
          this.data.agents.scriptWriter &&
          this.data.agents.scriptWriter.enabled
        ) {
          // 检查是否已取消（角色三视图生成前）
          if (this.data.isCancelled) {
            console.log("工作流在角色三视图生成前被取消");
            this.addMessage("system", "⚠️ 用户取消了创作任务");
            this.setData({ working: false, currentStep: 0 });
            return;
          }

          try {
            this.addMessage("system", "🎨 开始生成角色三视图...");

            // 从脚本输出中提取角色
            const scriptOutput = response.reply;
            const characters =
              this.characterConsistencyManager.extractCharactersFromScript(
                scriptOutput,
              );

            if (characters.length > 0) {
              // 生成所有角色三视图
              await this.characterConsistencyManager.generateAllCharacterTurnarounds(
                characters,
              );

              // 检查是否已取消（角色三视图生成后）
              if (this.data.isCancelled) {
                console.log("工作流在角色三视图生成后被取消");
                this.addMessage("system", "⚠️ 用户取消了创作任务");
                this.setData({ working: false, currentStep: 0 });
                return;
              }

              this.addMessage(
                "system",
                `条已为${characters.length}个角色生成三视图，后续场景将保持人物一致性`,
              );
            } else {
              this.addMessage("system", "⚠️ 未检测到角色，跳过三视图生成");
            }
          } catch (error) {
            console.error("生成角色三视图失败?", error);
            this.addMessage(
              "system",
              `⚠️ 角色三视图生成失败：${error.message}`,
            );
          }
        }

        // 更新智能体状态为完成
        this.updateAgentStatus(agent.key, "completed", 100);

        // 添加完成消息
        this.addMessage(
          "system",
          `步骤 ${stepNumber}/${activeAgents.length}{agent.name} 工作完成`,
        );

        // 如果使用过反馈，显示提示
        if (pendingFeedback) {
          this.addMessage("system", `已根据您的反馈重新生{agent.name}的内容`);
        }

        // 更新总体进度
        const progressPercent = Math.round(
          ((i + 1) / activeAgents.length) * 100,
        );
        this.setData({ progressPercent });

        // 如果不是最后一个智能体，等待一下再继续
        if (i < activeAgents.length - 1) {
          await this.delay(1000); // 等待1
        }
      } catch (error) {
        console.error(`${agent.name} 执行失败:`, error);
        this.updateAgentStatus(agent.key, "error", 0);
        this.updateMessage(agent.key, `执行失败{error.message}`, false);
        this.addMessage(
          "system",
          `步骤 ${stepNumber}/${activeAgents.length}{agent.name} 执行失败`,
        );
        // 继续执行下一个智能体，不中断整个流程
      }
    }

    // 完成后检查是否还有未处理的反
    const remainingFeedback = this.data.feedbackQueue.filter(
      (f) => !this.data.agentOutputs[f.agentKey],
    );
    if (remainingFeedback.length > 0) {
      this.addMessage(
        "system",
        `⚠️ 还有 ${remainingFeedback.length} 个反馈将在下次生成时处理`,
      );
    }

    // 完成消息
    this.addMessage(
      "system",
      `🎉 多智能体协作完成！共完成 ${activeAgents.length} 个智能体的任务`,
    );

    // 保存创作历史
    this.saveCreationHistoryToHistory();

    this.setData({ working: false });
    wx.showToast({ title: "协作完成", icon: "success" });
  },

  // 保存创作历史记录
  saveCreationHistoryToHistory() {
    try {
      const history = this.data.creationHistory || [];

      // 获取用户输入
      const userMessages = this.data.messages.filter(
        (m) => m.sender === "user",
      );
      if (userMessages.length === 0) return;

      // 获取所有智能体的输出      const agentOutputs = this.data.agentOutputs;

      // 创建历史记录
      const historyItem = {
        id: Date.now(),
        userInput: userMessages[userMessages.length - 1].content, // 最后一条用户输出        agentOutputs: agentOutputs,
        createdAt: new Date().getTime(),
        platform: this.data.selectedPlatform,
        style: this.data.selectedStyle,
      };

      // 添加到历史记录（最多保存0条）
      const newHistory = [historyItem, ...history].slice(0, 20);
      this.setData({ creationHistory: newHistory });

      // 保存到本地存      wx.setStorageSync("ai_creation_history", newHistory);
      console.log("创作历史保存成功:", historyItem);
    } catch (error) {
      console.error("保存创作历史失败:", error);
    }
  },

  // 构建智能体上下文（包含前置智能体的输出）
  buildAgentContext(currentAgentKey) {
    const context = [];
    const agentOutputs = this.data.agentOutputs;

    // 智能体之间的依赖关系
    const dependencies = {
      scriptWriter: ["trendHunter"], // 脚本创作依赖热点追踪的输
      storyboard: ["scriptWriter"], // 分镜图片制作依赖脚本创作的输
      videoComposer: ["storyboard"], // 视频合成依赖分镜图片制作的输
      qualityChecker: ["videoComposer"], // 质检审核依赖视频合成的输
      platformAdapter: ["qualityChecker"], // 平台适配依赖质检审核的输
      autoPublisher: ["platformAdapter"], // 自动发布依赖平台适配的输
    };

    // 获取当前智能体依赖的前置智能
    const dependsOn = dependencies[currentAgentKey] || [];

    // 将前置智能体的输出加入上下文
    dependsOn.forEach((depAgentKey) => {
      if (agentOutputs[depAgentKey]) {
        context.push({
          role: "assistant",
          content: `{depAgentKey}的输出\n${agentOutputs[depAgentKey].output}`,
        });
      }
    });

    return context;
  },

  // 调用真实AI API（使用智谱AI glm-4.6v-flash 文本模型 + cogview-3-flash/cogvideox-3-flash 多模态模型）
  async callAIAPI(agentType, userMessage, context = [], mediaInfo = null) {
    console.log(
      `调用AI模型: glm-4.6v-flash, 智能 ${agentType}, 媒体类型: ${mediaInfo?.type || "text"}`,
    );

    // 检查是否优先使用混元 AI Agent
    const preferAIAgent =
      this.data.hunyuanConfig && this.data.hunyuanConfig.enabled;

    // 如果配置了混元，优先使用 AI Agent
    if (preferAIAgent) {
      console.log("🤖 使用混元 AI Agent 处理请求");
      return await this.callAIAgent(userMessage, {
        showLoading: true,
        showThinking: true,
        streamResponse: true,
        tools: [
          {
            type: "function",
            function: {
              name: "image_generation",
              description: "生成图片",
              parameters: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    description: "图片描述",
                  },
                  style: {
                    type: "string",
                    description: "图片风格",
                  },
                  size: {
                    type: "string",
                    description: "图片尺寸",
                  },
                },
              },
            },
          },
        ],
        context: context,
        threadId: `agent-thread-${Date.now()}`,
      });
    }

    // 根据智能体类型决定是否需要生成图片或视频
    const needsImageGeneration = agentType === "storyboard";
    const needsVideoGeneration = agentType === "videoComposer";

    // 如果需要生成图片，使用 cogview-3-flash
    if (needsImageGeneration) {
      return await this.callImageGenerationAPI(agentType, userMessage, context);
    }

    // 如果需要生成视频，使用 cogvideox-3-flash
    if (needsVideoGeneration) {
      return await this.callVideoGenerationAPI(agentType, userMessage, context);
    }

    // 其他智能体使用文本模glm-4.6v-flash
    return await this.callTextGenerationAPI(
      agentType,
      userMessage,
      context,
      mediaInfo,
    );
  },

  // 调用文本生成API (glm-4.6v-flash with GEMINI fallback)
  async callTextGenerationAPI(
    agentType,
    userMessage,
    context = [],
    mediaInfo = null,
  ) {
    console.log(`调用文本模型: glm-4.6v-flash, 智能体 ${agentType}`);

    // 首先尝试GLM
    try {
      const glmResponse = await this.callGLMTextAPI(
        agentType,
        userMessage,
        context,
        mediaInfo,
      );
      console.log("GLM文本生成成功");
      return glmResponse;
    } catch (glmError) {
      console.warn("GLM文本生成失败:", glmError.message);

      // 检查是否支持GEMINI备用
      const geminiConfig = this.data.geminiConfig;
      const supportedAgents = geminiConfig.supportedAgents || [];

      if (geminiConfig.enabled && supportedAgents.includes(agentType)) {
        try {
          console.log(`智能体${agentType} 支持GEMINI备用，尝试切条..`);
          const hunyuanResponse = await this.callHunyuanTextAPI(
            agentType,
            userMessage,
            systemPrompt,
          );
          throw new Error(
            `文本生成失败 - GLM: ${glmError.message}, 混元模型: ${hunyuanError.message}`,
          );
          console.log("GEMINI文本生成成功");
          return geminiResponse;
        } catch (geminiError) {
          console.error("GEMINI文本生成也失败?", geminiError.message);
          throw new Error(
            `文本生成失败 - GLM: ${glmError.message}, GEMINI: ${geminiError.message}`,
          );
        }
        // 混元模型 - 首选使用混元模型（GEMINI）
      } else {
        // GEMINI未启用或该智能体不支持
        throw glmError;
      }
    }
  },

  // 调用GLM文本API
  callGLMTextAPI(agentType, userMessage, context = [], mediaInfo = null) {
    const systemPrompt = this.getSystemPrompt(agentType);

    const messages = [{ role: "system", content: systemPrompt }];

    // 添加上下文（前置智能体的输出
    if (context && context.length > 0) {
      messages.push(...context);
    }

    // 添加当前用户消息
    messages.push({
      role: "user",
      content: userMessage,
    });

    return new Promise((resolve, reject) => {
      const config = this.data.apiConfig;

      wx.request({
        url: config.endpoint,
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        data: {
          model: "glm-4.6v-flash",
          messages: messages,
          temperature: 0.7,
          max_tokens: 5000,
        },
        timeout: 60000,
        success: (res) => {
          console.log("GLM文本API响应:", {
            statusCode: res.statusCode,
            hasData: !!res.data,
          });

          if (res.statusCode === 200 && res.data) {
            const reply =
              res.data.choices?.[0]?.message?.content || "未收到有效回复";
            resolve({
              success: true,
              reply: reply,
              agentType,
              type: "text",
              model: "glm-4.6v-flash",
            });
          } else {
            reject(new Error(res.data?.error?.message || "GLM文本生成失败"));
          }
        },
        fail: (err) => {
          console.error("GLM文本API调用失败:", err);
          reject(new Error(`GLM API调用失败: ${err.errMsg}`));
        },
      });
    });
  },

  // 调用GEMINI文本API (通过cursorweb2api)
  callGeminiTextAPI(agentType, userMessage, context = [], mediaInfo = null) {
    const systemPrompt = this.getSystemPrompt(agentType);

    const messages = [{ role: "system", content: systemPrompt }];

    // 添加上下
    if (context && context.length > 0) {
      messages.push(...context);
    }

    // 添加当前用户消息
    messages.push({
      role: "user",
      content: userMessage,
    });

    return new Promise((resolve, reject) => {
      const config = this.data.hunyuanConfig;

      wx.request({
        url: config.endpoint,
        method: "POST",
        header: {
          "Content-Type": "application/json",
        },
        data: {
          model: config.model, // gemini-2.5-flash 条gemini-2.5-pro
          messages: messages,
          temperature: 0.7,
          max_tokens: 5000,
          stream: false,
        },
        timeout: 60000,
        success: (res) => {
          console.log("GEMINI文本API响应:", {
            statusCode: res.statusCode,
            hasData: !!res.data,
          });

          if (res.statusCode === 200 && res.data) {
            const reply =
              res.data.choices?.[0]?.message?.content || "未收到有效回";
            resolve({
              success: true,
              reply: reply,
              agentType,
              type: "text",
              model: config.model,
            });
          } else {
            reject(new Error(res.data?.error?.message || "GEMINI文本生成失败"));
          }
        },
        fail: (err) => {
          console.error("GEMINI文本API调用失败:", err);
          reject(new Error(`GEMINI API调用失败: ${err.errMsg}`));
        },
      });
    });
  },

  // 调用图片生成API (cogview-3-flash)
  async callImageGenerationAPI(agentType, userMessage, context = []) {
    console.log(`===== 开始图片生成流=====`);
    console.log(`调用图片生成模型: cogview-3-flash, 智能 ${agentType}`);

    const systemPrompt = this.getSystemPrompt(agentType);
    console.log(`System Prompt 长度: ${systemPrompt.length}`);

    // 首先调用文本模型获取画面描述和prompt
    const textResponse = await this.callTextGenerationAPI(
      agentType,
      userMessage,
      context,
    );

    console.log(`文本模型回复长度: ${textResponse.reply.length}`);
    console.log(`文本回复00字符:`, textResponse.reply.substring(0, 200));

    // 从文本回复中提取AI绘画prompt
    const prompts = this.extractImagePrompts(textResponse.reply);

    console.log(`提取结果: ${prompts.length} 个prompt`);

    if (prompts.length === 0) {
      console.warn(`警告: 未提取到任何图片prompt`);
      console.log(`完整文本回复:`, textResponse.reply);
      return {
        success: true,
        reply:
          textResponse.reply +
          "\n\n⚠️ 注意: 未检测到AI绘画prompt，无法生成图片。请确保AI返回包含【AI绘画Prompt:】字段的格式。",
        agentType,
        type: "text",
        note: "未提取到有效的图片prompt，仅返回画面描述",
      };
    }

    console.log(`提取${prompts.length} 个图片prompt，开始逐张生成...`);

    // cogview-3-flash 不支batch API，但可以逐张生成
    // 一张一张调API，完成所有图片的生成
    const imageResults = [];

    for (let i = 0; i < prompts.length; i++) {
      try {
        console.log(`正在生成${i + 1}/${prompts.length} 张图..`);
        const imageUrl = await this.generateImage(prompts[i]);
        imageResults.push({
          index: i + 1,
          prompt: prompts[i],
          imageUrl: imageUrl,
        });
        console.log(`图片 ${i + 1}/${prompts.length} 生成成功`);

        // 避免请求过快，等待一
        if (i < prompts.length - 1) {
          await this.delay(5000); // 每张图片间隔2
        }
      } catch (error) {
        console.error(`图片 ${i + 1} 生成失败:`, error);
        imageResults.push({
          index: i + 1,
          prompt: prompts[i],
          error: error.message,
        });

        // 即使失败也继续生成下一
        if (i < prompts.length - 1) {
          await this.delay(1000);
        }
      }
    }

    // 构建包含图片结果的回
    let enhancedReply = textResponse.reply;

    if (imageResults.length > 0) {
      enhancedReply += "\n\n🖼条**生成的图片：**\n\n";
      imageResults.forEach((img) => {
        if (img.imageUrl) {
          enhancedReply += `[图片${img.index}] ${img.imageUrl}\n`;
        } else {
          enhancedReply += `[图片${img.index}] 生成失败: ${img.error}\n`;
        }
      });

      // 统计生成结果
      const successCount = imageResults.filter((img) => img.imageUrl).length;
      const failCount = imageResults.length - successCount;
      enhancedReply += `\n成功: ${successCount} | 失败: ${failCount} 张`;
    }

    // 保存图片创作历史
    this.saveImageCreationHistory(
      userMessage,
      imageResults,
      textResponse.reply,
    );

    return {
      success: true,
      reply: enhancedReply,
      agentType,
      type: "image",
      images: imageResults,
    };
  },

  // 调用视频生成API (cogvideox-3-flash)
  async callVideoGenerationAPI(agentType, userMessage, context = []) {
    console.log(`调用视频生成模型: cogvideox-3-flash, 智能 ${agentType}`);

    // 首先调用文本模型获取视频制作方案
    const textResponse = await this.callTextGenerationAPI(
      agentType,
      userMessage,
      context,
    );

    // 从回复中提取多个视频生成prompt
    const videoPrompts = this.extractVideoPrompts(
      userMessage,
      textResponse.reply,
    );

    if (videoPrompts.length === 0) {
      return {
        success: true,
        reply: textResponse.reply,
        agentType,
        type: "text",
        note: "未提取到有效的视频prompt，仅返回制作方案",
      };
    }

    console.log(`提取${videoPrompts.length} 个视频prompt，开始逐个生成...`);

    // cogvideox-3-flash 不支batch API，但可以逐个生成
    // 一个一个调API，完成所有视频的生成
    const videoResults = [];

    for (let i = 0; i < videoPrompts.length; i++) {
      try {
        console.log(`正在生成${i + 1}/${videoPrompts.length} 个视..`);
        const videoResult = await this.generateVideo(videoPrompts[i]);
        videoResults.push({
          index: i + 1,
          prompt: videoPrompts[i],
          videoUrl: videoResult.videoUrl,
          coverUrl: videoResult.coverUrl,
        });
        console.log(`视频 ${i + 1}/${videoPrompts.length} 生成成功`);

        // 避免请求过快，等待一
        if (i < videoPrompts.length - 1) {
          await this.delay(3000); // 每个视频间隔3
        }
      } catch (error) {
        console.error(`视频 ${i + 1} 生成失败:`, error);
        videoResults.push({
          index: i + 1,
          prompt: videoPrompts[i],
          error: error.message,
        });

        // 即使失败也继续生成下一
        if (i < videoPrompts.length - 1) {
          await this.delay(5000);
        }
      }
    }

    // 构建包含视频结果的回
    let enhancedReply = textResponse.reply;

    if (videoResults.length > 0) {
      enhancedReply += "\n\n🎬 **生成的视频：**\n\n";
      videoResults.forEach((vid) => {
        if (vid.videoUrl) {
          enhancedReply += `[视频${vid.index}]\n`;
          enhancedReply += `视频URL: ${vid.videoUrl}\n`;
          enhancedReply += `封面URL: ${vid.coverUrl}\n\n`;
        } else {
          enhancedReply += `[视频${vid.index}] 生成失败: ${vid.error}\n\n`;
        }
      });

      // 统计生成结果
      const successCount = videoResults.filter((vid) => vid.videoUrl).length;
      const failCount = videoResults.length - successCount;
      enhancedReply += `成功: ${successCount} | 失败: ${failCount} 个`;
    }

    // 保存创作历史
    this.saveVideoCreationHistory(
      userMessage,
      videoResults,
      textResponse.reply,
    );

    return {
      success: true,
      reply: enhancedReply,
      agentType,
      type: "video",
      videos: videoResults,
    };
  },

  // 生成单张图片（支持GLM和混元模型）
  async generateImage(prompt) {
    // 优先使用混元模型，如果配置了的话
    const hunyuanConfig = this.data.hunyuanConfig;
    if (
      hunyuanConfig &&
      hunyuanConfig.enabled &&
      hunyuanConfig.secretId &&
      hunyuanConfig.secretKey
    ) {
      console.log("使用混元模型生成图片");
      try {
        return await this.generateImageHunyuan(prompt);
      } catch (error) {
        console.error("混元模型生成失败，降级到GLM:", error);
        // 降级到GLM
        return await this.generateImageGLM(prompt);
      }
    }

    // 使用GLM模型
    return await this.generateImageGLM(prompt);
  },

  // 混元模型图片生成
  async generateImageHunyuan(prompt) {
    const config = this.data.hunyuanConfig;

    try {
      console.log("调用混元生图云函数 generateImage...");

      // 使用 generateImage 云函数调用混元AI画图
      const response = await wx.cloud.callFunction({
        name: "generateImage",
        data: {
          prompt: prompt,
          size: "1024x1024",
          useHunyuan: true, // 使用混元模型
        },
      });

      if (response.result && response.result.success) {
        console.log("混元模型图片生成成功:", response.result.imageUrl);
        return response.result.imageUrl;
      } else {
        throw new Error(
          response.result?.message ||
            response.result?.error ||
            "混元模型图片生成失败",
        );
      }
    } catch (error) {
      console.error("混元模型图片生成失败:", error);
      throw error;
    }
  },

  // GLM图片生成（原generateImage逻辑
  generateImageGLM(prompt) {
    return new Promise((resolve, reject) => {
      const config = this.data.apiConfig;

      wx.request({
        url: "https://open.bigmodel.cn/api/paas/v4/images/generations",
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        data: {
          model: "cogview-3-flash",
          prompt: prompt,
          size: "1024x1024",
        },
        timeout: 60000,
        success: (res) => {
          console.log("GLM图片API响应:", { statusCode: res.statusCode });

          if (
            res.statusCode === 200 &&
            res.data &&
            res.data.data &&
            res.data.data[0]
          ) {
            resolve(res.data.data[0].url);
          } else {
            reject(new Error(res.data?.error?.message || "GLM图片生成失败"));
          }
        },
        fail: (err) => {
          console.error("GLM图片API调用失败:", err);
          reject(new Error(`GLM图片生成失败: ${err.errMsg}`));
        },
      });
    });
  },

  // 生成视频（GLM cogvideox-3-flash）- 开发中
  async generateVideo(prompt) {
    // 视频生成功能正在开发中，暂不支持
    throw new Error("视频生成功能正在开发中，暂不可用");
  },

  // 从文本回复中提取视频生成prompt（支持多个视频）
  extractVideoPrompts(userMessage, scriptReply) {
    const prompts = [];

    // 尝试从脚本中提取不同的场景或片段
    const lines = scriptReply.split("\n");
    let currentPrompt = "";
    let promptIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测新的分镜或场景标记
      if (line.match(/^条*】|^\d+\./) && currentPrompt.length > 50) {
        prompts.push(currentPrompt.trim());
        currentPrompt = "";
        promptIndex++;
      }

      // 如果已经提取了足够的prompt（最个），停
      if (prompts.length >= 3) {
        break;
      }

      // 收集当前prompt内容
      currentPrompt += line + " ";
    }

    // 添加最后一个prompt
    if (currentPrompt.trim().length > 50 && prompts.length < 3) {
      prompts.push(currentPrompt.trim());
    }

    // 如果没有提取到多个prompt，至少返回一个基于用户需求的
    if (prompts.length === 0) {
      prompts.push(`${userMessage}\n\n${scriptReply}`.substring(0, 300));
    }

    console.log(`提取${prompts.length} 个视频prompt`);
    return prompts;
  },

  // 从文本回复中提取AI绘画prompt
  extractImagePrompts(reply) {
    const prompts = [];
    const lines = reply.split("\n");

    // 第一步：查找带标记的prompt字段
    for (const line of lines) {
      // 匹配 "AI绘画Prompt:" "视频Prompt:" "视频生成提示词" "prompt:" "Prompt:" "风格:" 等各种格式
      const promptMatch = line.match(
        /(?:-\s*)?(?:AI绘画Prompt|视频Prompt|视频生成提示词|prompt|Prompt|风格|Style)\s*[:：]\s*(.+?)$/,
      );
      if (promptMatch && promptMatch[1]) {
        const prompt = promptMatch[1].trim();
        // 提取完整的prompt
        const cleanPrompt = prompt.replace(/[,，]$/, "").trim();
        // 降低最小长度要求，因为有些prompt可能较短
        if (cleanPrompt.length > 10) {
          // 过滤过短的prompt
          prompts.push(cleanPrompt);
        }
      }
    }

    // 第二步：如果没有找到标记的prompt，在【镜头头X】行之后查找英文描述
    if (prompts.length === 0) {
      let currentLens = null;
      let lensMatch = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 检测镜头标记
        lensMatch = line.match(/【镜头\d+】/);
        if (lensMatch) {
          currentLens = lensMatch[0];
          continue;
        }

        // 在镜头行之后，查找包含大量英文的
        if (currentLens) {
          const englishText = line.match(/[a-zA-Z\s,;\-\.]{40,}/);
          if (englishText) {
            const cleanPrompt = englishText[0].trim();
            // 确保包含质量关键词
            const hasQualityKeywords =
              /8K|ultra\s+HD|highly\s+detailed|photorealistic|cinematic|professional|sharp\s+focus/i.test(
                cleanPrompt,
              );
            if (cleanPrompt.length > 30 && hasQualityKeywords) {
              prompts.push(cleanPrompt);
              currentLens = null; // 重置，避免重复提取
            }
          }
        }
      }
    }

    // 第三步：最后尝试提取所有长英文文本
    if (prompts.length === 0) {
      const englishMatches = reply.match(/[a-zA-Z\s,;\-\.]{60,}/g);
      if (englishMatches) {
        englishMatches.forEach((match) => {
          const cleanPrompt = match.trim();
          const hasQualityKeywords =
            /8K|ultra\s+HD|highly\s+detailed|photorealistic|cinematic|professional|sharp\s+focus|photography|detailed/i.test(
              cleanPrompt,
            );
          if (cleanPrompt.length > 40 && hasQualityKeywords) {
            prompts.push(cleanPrompt);
          }
        });
      }
    }

    console.log(`提取${prompts.length} 个图片prompt:`, prompts);
    return prompts;
  },

  // 从上下文中提取视频生成prompt
  extractVideoPrompt(userMessage, scriptReply) {
    // 简单实现：使用用户消息+脚本内容作为视频prompt
    // 实际应用中可以更智能地提取关键信
    return `${userMessage}\n\n${scriptReply}`.substring(0, 200);
  },

  // 添加消息
  addMessage(sender, content, isTyping = false) {
    const message = {
      id: Date.now(),
      sender,
      senderName:
        sender === "user"
          ? "用户"
          : app.globalData.agents[sender]?.name || sender,
      content,
      timestamp: new Date().getTime(),
      timeStr: this.formatTime(new Date().getTime()),
      isTyping,
    };

    this.setData({
      messages: [...this.data.messages, message],
      toView: `msg-${this.data.messages.length}`,
    });
  },

  // 更新消息（支持附加数据）
  updateMessage(sender, content, isTyping = false) {
    const messages = this.data.messages.map((msg) => {
      if (msg.sender === sender && msg.isTyping) {
        return { ...msg, content, isTyping };
      }
      return msg;
    });

    this.setData({ messages });
  },

  // 更新消息（带图片/视频数据
  updateMessageWithData(sender, messageData, isTyping = false) {
    const messages = this.data.messages.map((msg) => {
      if (msg.sender === sender && msg.isTyping) {
        return {
          ...msg,
          content: messageData.content,
          images: messageData.images || [],
          videos: messageData.videos || [],
          isTyping,
        };
      }
      return msg;
    });

    this.setData({ messages });
  },

  // 更新智能体状
  updateAgentStatus(agentKey, status, progress) {
    const agentList = this.data.agentList.map((agent) => {
      if (agent.key === agentKey) {
        return { ...agent, status, progress };
      }
      return agent;
    });

    this.setData({ agentList });
  },

  // 延迟函数
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // 格式化时
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls;

    wx.previewImage({
      current: url,
      urls: urls,
    });
  },

  // 保存图片到相
  saveImage(e) {
    const url = e.currentTarget.dataset.url;

    wx.showLoading({
      title: "下载..",
    });

    // 先下载图
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: "保存成功",
                icon: "success",
              });
            },

            // 测试混元模型
            async testHunyuanModel() {
              const config = this.data.hunyuanConfig;

              if (!config.enabled || !config.secretId || !config.secretKey) {
                wx.showModal({
                  title: "配置不完整",
                  content: "请先启用混元模型并配置SecretId和SecretKey",
                  showCancel: false,
                });
                return;
              }

              wx.showLoading({ title: "测试中...", mask: true });

              try {
                console.log("测试混元生图模型...");

                const response = await wx.cloud.callFunction({
                  name: "generateImage",
                  data: {
                    prompt: "一只可爱的小猫，卡通风格，明亮色彩",
                    size: "1024x1024",
                    useHunyuan: true,
                  },
                });

                if (response.result && response.result.success) {
                  wx.hideLoading();
                  wx.showModal({
                    title: "测试成功",
                    content: `混元模型调用成功！\n\n生成的图片URL：\n${response.result.imageUrl.substring(0, 60)}...`,
                    showCancel: false,
                    success: () => {
                      // 预览图片
                      wx.previewImage({
                        urls: [response.result.imageUrl],
                        current: 0,
                      });
                    },
                  });
                } else {
                  throw new Error(
                    response.result?.message ||
                      response.result?.error ||
                      "测试失败",
                  );
                }
              } catch (error) {
                wx.hideLoading();
                console.error("混元模型测试失败:", error);
                wx.showModal({
                  title: "测试失败",
                  content: `混元模型测试失败：\n${error.message || error.errMsg || "未知错误"}`,
                  showCancel: false,
                });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              console.error("保存图片失败:", err);

              // 检查是否是权限问题
              if (err.errMsg.includes("auth deny")) {
                wx.showModal({
                  title: "需要相册权",
                  content: "请授权访问相册以保存图片",
                  confirmText: "去授",
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
                  },
                });
              } else {
                wx.showToast({
                  title: "保存失败",
                  icon: "error",
                });
              }
            },
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: "下载失败",
            icon: "error",
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("下载图片失败:", err);
        wx.showToast({
          title: "下载失败",
          icon: "error",
        });
      },
    });
  },

  // 复制消息内容
  copyMessage(e) {
    const index = e.currentTarget.dataset.index;
    const message = this.data.messages[index];

    if (!message) return;

    wx.setClipboardData({
      data: message.content,
      success: () => {
        wx.showToast({
          title: "已复制到剪贴",
          icon: "success",
          duration: 1500,
        });
      },
      fail: (err) => {
        console.error("复制失败:", err);
        wx.showToast({
          title: "复制失败",
          icon: "error",
        });
      },
    });
  },

  // 点赞消息
  likeMessage(e) {
    const index = e.currentTarget.dataset.index;
    const messages = [...this.data.messages];

    if (!messages[index]) return;

    const message = messages[index];
    const wasLiked = message.liked;

    // 切换点赞    message.liked = !wasLiked;
    message.disliked = false; // 取消不满意的反馈

    this.setData({
      messages,
    });

    if (!wasLiked) {
      // 记录点赞反馈到学习系
      this.recordLikeFeedback(message, message.content);

      wx.showToast({
        title: "已点赞",
        icon: "success",
        duration: 1500,
      });
    }

    // 可以在这里调用后端API记录点赞
    console.log(`消息 ${index} 点赞状`, message.liked);
  },

  // 显示反馈菜单（不满意时的操作选项
  showFeedbackMenu(e) {
    const index = e.currentTarget.dataset.index;
    const message = this.data.messages[index];

    if (!message) return;

    const agentKey = message.sender;
    const agentName = app.globalData.agents[agentKey]?.name || agentKey;

    wx.showActionSheet({
      itemList: ["重新生成", "修改要求并重新生成", "提供详细反馈"],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 重新生成
          this.regenerateAgentMessage(index, agentKey);
        } else if (res.tapIndex === 1) {
          // 修改要求并重新生
          this.showModifyDialog(index, agentKey, agentName);
        } else if (res.tapIndex === 2) {
          // 提供详细反馈
          this.showFeedbackDialog(index, agentKey, agentName);
        }
      },
    });
  },

  // 重新生成智能体消
  async regenerateAgentMessage(messageIndex, agentKey) {
    if (this.data.working) {
      wx.showToast({ title: "当前有任务正在执", icon: "none" });
      return;
    }

    wx.showModal({
      title: "确认重新生成",
      content: "将使用相同的输入重新生成该智能体的内容，确认吗？",
      success: async (res) => {
        if (!res.confirm) return;

        this.setData({ working: true });

        // 更新消息正在处理"
        this.updateMessage(agentKey, "正在重新生成内容...", true);

        try {
          // 获取原始用户输入
          const messages = this.data.messages;
          const userMessage =
            messages.find((m) => m.sender === "user")?.content || "";

          if (!userMessage) {
            throw new Error("未找到原始用户输入");
          }

          // 重新构建上下
          const context = this.buildAgentContext(agentKey);

          // 调用AI API重新生成
          const response = await this.callAIAPI(
            agentKey,
            userMessage,
            context,
            null,
          );

          // 更新消息内容
          const imageUrlArray = (response.images || [])
            .filter((img) => img.imageUrl)
            .map((img) => img.imageUrl);
          const messageData = {
            content: response.reply,
            images: response.images || [],
            videos: response.videos || [],
            imageUrlArray: imageUrlArray,
            liked: false,
            disliked: false,
          };
          this.updateMessageWithData(agentKey, messageData, false);

          // 更新智能体输
          const agentOutputs = this.data.agentOutputs;
          agentOutputs[agentKey] = response.reply;
          this.setData({ agentOutputs });

          wx.showToast({ title: "重新生成成功", icon: "success" });
        } catch (error) {
          console.error("重新生成失败:", error);
          this.updateMessage(agentKey, `重新生成失败{error.message}`, false);
          wx.showToast({
            title: "重新生成失败",
            icon: "error",
            duration: 5000,
          });
        }

        this.setData({ working: false });
      },
    });
  },

  // 显示修改要求对话
  showModifyDialog(messageIndex, agentKey, agentName) {
    wx.showModal({
      title: `修改${agentName}的要求`,
      content: "请输入您希望调整的具体要",
      editable: true,
      placeholderText: "例如：希望内容更简洁，或者增加某个方面的分析",
      success: async (res) => {
        if (res.confirm && res.content) {
          const modifyPrompt = res.content.trim();
          if (modifyPrompt) {
            await this.regenerateWithModify(agentKey, modifyPrompt);
          }
        }
      },
    });
  },

  // 根据修改重新生成
  async regenerateWithModify(agentKey, modifyPrompt) {
    if (this.data.working) {
      wx.showToast({ title: "当前有任务正在执", icon: "none" });
      return;
    }

    this.setData({ working: true });

    // 更新消息正在处理"
    this.updateMessage(agentKey, "正在根据您的要求重新调整...", true);

    try {
      // 获取原始用户输入
      const messages = this.data.messages;
      const userMessage =
        messages.find((m) => m.sender === "user")?.content || "";

      if (!userMessage) {
        throw new Error("未找到原始用户输入");
      }

      // 重新构建上下
      const context = this.buildAgentContext(agentKey);

      // 构建修改后的用户消息
      const modifiedUserMessage = `${userMessage}\n\n【用户调整要条${modifyPrompt}`;

      // 调用AI API重新生成
      const response = await this.callAIAPI(
        agentKey,
        modifiedUserMessage,
        context,
        null,
      );

      // 更新消息内容
      const imageUrlArray = (response.images || [])
        .filter((img) => img.imageUrl)
        .map((img) => img.imageUrl);
      const messageData = {
        content: response.reply,
        images: response.images || [],
        videos: response.videos || [],
        imageUrlArray: imageUrlArray,
        liked: false,
        disliked: false,
      };
      this.updateMessageWithData(agentKey, messageData, false);

      // 更新智能体输
      const agentOutputs = this.data.agentOutputs;
      agentOutputs[agentKey] = response.reply;
      this.setData({ agentOutputs });

      wx.showToast({ title: "调整成功", icon: "success" });
    } catch (error) {
      console.error("调整失败:", error);
      this.updateMessage(agentKey, `调整失败{error.message}`, false);
      wx.showToast({
        title: "调整失败",
        icon: "error",
        duration: 5000,
      });
    }

    this.setData({ working: false });
  },

  // 选择发布平台
  selectPlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    this.setData({ selectedPlatform: platform });

    const platformName = this.data.platformConfigs[platform].name;
    wx.showToast({
      title: `已选择${platformName}`,
      icon: "none",
      duration: 1500,
    });

    // 平台选择后，可以在这里更新提示词或参
    console.log(`选择发布平台: ${platform}`);
  },

  // 显示所有模
  showAllTemplates() {
    wx.navigateTo({
      url: "/pages/templates/templates",
    });
  },

  // 切换学习面板
  toggleLearningPanel() {
    this.setData({
      showLearningPanel: !this.data.showLearningPanel,
    });
  },

  // 清空学习数据
  clearLearningData() {
    wx.showModal({
      title: "确认清空",
      content: "清空后AI将失去已学习的偏好，确定要清空吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            learningData: {
              likedScripts: [],
              dislikedScripts: [],
              modifiedScripts: [],
              popularStoryboards: [],
              effectiveTags: [],
            },
          });
          this.saveLearningData();

          wx.showToast({
            title: "学习数据已清空",
            icon: "success",
          });
        }
      },
    });
  },

  // 显示规则锁配
  showRuleLockConfig() {
    const ruleLocks = this.data.ruleLocks;

    const options = [
      ruleLocks.requireConfirmation ? "条需要用户确认" : "条需要用户确认",
      ruleLocks.enableTemplateFilter ? "条启用模板过滤" : "条启用模板过滤",
      ruleLocks.enableContentCheck ? "条启用内容审核" : "条启用内容审核",
      "最大重试次数 " + ruleLocks.maxRetries,
    ];

    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const index = res.tapIndex;
        const newRuleLocks = { ...ruleLocks };

        if (index === 0) {
          newRuleLocks.requireConfirmation = !ruleLocks.requireConfirmation;
        } else if (index === 1) {
          newRuleLocks.enableTemplateFilter = !ruleLocks.enableTemplateFilter;
        } else if (index === 2) {
          newRuleLocks.enableContentCheck = !ruleLocks.enableContentCheck;
        } else if (index === 3) {
          wx.showModal({
            title: "设置最大重试次数",
            content: "请输入最大重试次数1-10)",
            editable: true,
            placeholderText: ruleLocks.maxRetries.toString(),
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                const value = parseInt(modalRes.content);
                if (value >= 1 && value <= 10) {
                  newRuleLocks.maxRetries = value;
                  this.setData({ ruleLocks: newRuleLocks });
                  wx.showToast({
                    title: "设置已保存",
                    icon: "success",
                  });
                }
              }
            },
          });
          return;
        }

        this.setData({ ruleLocks: newRuleLocks });

        wx.showToast({
          title: "规则锁已更新",
          icon: "success",
        });
      },
    });
  },

  // 显示详细反馈对话
  showFeedbackDialog(messageIndex, agentKey, agentName) {
    const message = this.data.messages[messageIndex];
    const isWorking = this.data.working;

    // 构建提示内容
    let content = "请告诉我们哪里不满意，帮助我们改进";
    if (isWorking) {
      content +=
        "\n\n⚠️ 当前有任务正在执行，您的反馈将在该智能体下次执行时自动应用";
    }

    wx.showModal({
      title: `反馈${agentName}的输出`,
      content: content,
      editable: true,
      placeholderText: "例如：内容不够详细、方向偏了、缺少某些信息等",
      success: (res) => {
        if (res.confirm && res.content) {
          const feedbackText = res.content.trim();

          // 标记消息为不满意
          const messages = [...this.data.messages];
          messages[messageIndex].disliked = true;
          messages[messageIndex].liked = false;
          messages[messageIndex].feedbackText = feedbackText;
          this.setData({ messages });

          // 记录不满意反馈到学习系统
          this.recordDislikeFeedback(message, message.content, feedbackText);

          // 添加到反馈队
          const feedbackQueue = this.data.feedbackQueue || [];
          feedbackQueue.push({
            agentKey,
            agentName,
            feedbackText,
            messageIndex,
            timestamp: new Date().getTime(),
          });
          this.setData({ feedbackQueue });

          // 添加到待处理映射
          const pendingFeedback = this.data.pendingFeedback || {};
          pendingFeedback[agentKey] = feedbackText;
          this.setData({ pendingFeedback });

          // 显示确认提示
          if (isWorking) {
            wx.showModal({
              title: "反馈已记",
              content: `您的反馈"${feedbackText}"\n\n将在${agentName}执行时自动应用`,
              showCancel: false,
              confirmText: "我知道了",
            });
          } else {
            wx.showModal({
              title: "反馈已记",
              content: `感谢您的反馈：\n"${feedbackText}"\n\n是否要根据您的反馈重新生成？`,
              confirmText: "重新生成",
              cancelText: "暂不",
              success: (confirmRes) => {
                if (confirmRes.confirm) {
                  // 根据反馈重新生成（单智能体模式）
                  this.regenerateWithFeedback(agentKey, feedbackText);
                }
              },
            });
          }

          // 可以在这里调用后端API保存反馈
          console.log(`收到${agentName}的反`, feedbackText);
        }
      },
    });
  },

  // 根据反馈重新生成
  async regenerateWithFeedback(agentKey, feedbackText) {
    if (this.data.working) {
      wx.showToast({ title: "当前有任务正在执", icon: "none" });
      return;
    }

    this.setData({ working: true });

    // 更新消息正在处理"
    this.updateMessage(agentKey, "正在根据您的反馈重新生成...", true);

    try {
      // 获取原始用户输入
      const messages = this.data.messages;
      const userMessage =
        messages.find((m) => m.sender === "user")?.content || "";

      if (!userMessage) {
        throw new Error("未找到原始用户输入");
      }

      // 重新构建上下
      const context = this.buildAgentContext(agentKey);

      // 构建包含反馈的用户消
      const modifiedUserMessage = `${userMessage}\n\n【用户反馈\n${feedbackText}\n\n请根据以上反馈优化您的输出。`;

      // 调用AI API重新生成
      const response = await this.callAIAPI(
        agentKey,
        modifiedUserMessage,
        context,
        null,
      );

      // 更新消息内容
      const imageUrlArray = (response.images || [])
        .filter((img) => img.imageUrl)
        .map((img) => img.imageUrl);
      const messageData = {
        content: response.reply,
        images: response.images || [],
        videos: response.videos || [],
        imageUrlArray: imageUrlArray,
        liked: false,
        disliked: false,
        feedbackText: null, // 清除反馈标记
      };
      this.updateMessageWithData(agentKey, messageData, false);

      // 更新智能体输
      const agentOutputs = this.data.agentOutputs;
      agentOutputs[agentKey] = response.reply;
      this.setData({ agentOutputs });

      wx.showToast({ title: "重新生成成功", icon: "success" });
    } catch (error) {
      console.error("根据反馈重新生成失败:", error);
      this.updateMessage(agentKey, `重新生成失败{error.message}`, false);
      wx.showToast({
        title: "重新生成失败",
        icon: "error",
        duration: 5000,
      });
    }

    this.setData({ working: false });
  },

  // 显示角色三视图详细配置?
  showCharacterConsistencyDetail() {
    const config = this.data.characterConsistency;
    const sheets = this.data.characterSheets;
    const sheetCount = Object.keys(sheets).length;

    wx.showModal({
      title: "角色三视图详情",
      content: `已生成角色数: ${sheetCount}\n\n【当前角色】\n${Object.values(
        sheets,
      )
        .map((s) => `- ${s.name}: ${s.status}`)
        .join(
          "\n",
        )}\n\n【自动生成】\n${config.autoGenerate ? "✓ 剧本生成后自动生成三视图" : "✗ 需要手动触发"}`,
      confirmText: config.autoGenerate ? "关闭自动生成" : "开启自动生成",
      cancelText: "清除缓存",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            "characterConsistency.autoGenerate": !config.autoGenerate,
          });
          wx.showToast({
            title: "已更新",
            icon: "success",
          });
        } else {
          // 清除角色缓存
          wx.showModal({
            title: "确认清除",
            content: "清除后需要重新生成角色三视图，确定吗？",
            success: (confirmRes) => {
              if (confirmRes.confirm) {
                this.setData({ characterSheets: {} });
                wx.showToast({
                  title: "缓存已清空",
                  icon: "success",
                });
              }
            },
          });
        }
      },
    });
  },

  // 加载风格库配置?
  loadStyleLibrary() {
    try {
      const savedStyle = wx.getStorageSync("ai_selected_style");
      const styleLibrary = wx.getStorageSync("ai_style_library");

      if (savedStyle) {
        this.setData({ selectedStyle: savedStyle });
      }
      if (styleLibrary) {
        this.setData({ styleLibrary });
      }

      console.log("风格库加载成功?", {
        selectedStyle: this.data.selectedStyle,
        stylesCount: Object.keys(this.data.styleLibrary || {}).length,
      });
    } catch (error) {
      console.error("加载风格库失败?", error);
    }
  },

  // 转换风格库为数组供WXML使用
  convertStyleLibraryToArray() {
    const styleLibrary = this.data.styleLibrary;
    const styleArray = Object.keys(styleLibrary).map((key) => ({
      key: key,
      value: styleLibrary[key],
    }));
    this.setData({ styleArray });
    console.log("风格库数组转换完", styleArray.length, "个风格");
  },

  // 保存风格库配置?
  saveStyleLibrary() {
    try {
      wx.setStorageSync("ai_selected_style", this.data.selectedStyle);
      wx.setStorageSync("ai_style_library", this.data.styleLibrary);
      console.log("风格库保存成功?", this.data.selectedStyle);
    } catch (error) {
      console.error("保存风格库失败?", error);
      wx.showToast({
        title: "保存失败",
        icon: "error",
      });
    }
  },

  // 选择风格
  selectStyle(e) {
    const styleKey = e.currentTarget.dataset.key;
    const style = this.data.styleLibrary[styleKey];

    this.setData({
      selectedStyle: styleKey,
      currentStyleIcon: style.icon || "🎌",
      currentStyleName: style.name || "日系动漫",
    });

    // 保存到本地存    this.saveStyleLibrary();

    wx.showToast({
      title: `已切换到 ${style.name}`,
      icon: "success",
      duration: 1500,
    });

    console.log("选择风格:", styleKey, style.name);
  },

  // 根据用户输入推荐最适合的风格
  getRecommendedStyle(userInput) {
    if (!userInput || typeof userInput !== "string") {
      return "anime"; // 默认返回动漫风格
    }

    const input = userInput.toLowerCase();
    const styleKeys = Object.keys(this.data.styleLibrary);

    // 关键词匹配表
    const keywordsMap = {
      anime: [
        "动漫",
        "二次元",
        "漫画",
        "可爱",
        "萌",
        "日系",
        "kawaii",
        "anime",
        "manga",
      ],
      guofeng: [
        "历史",
        "古代",
        "古装",
        "武侠",
        "传统文化",
        "李白",
        "古代",
        "guofeng",
      ],
      modern: [
        "产品",
        "商业",
        "科技",
        "现代",
        "写实",
        "介绍",
        "广告",
        "modern",
      ],
      cyberpunk: ["未来", "科幻", "赛博", "未来", "AI", "科技", "cyberpunk"],
      watercolor: [
        "艺术",
        "文艺",
        "治愈",
        "情感",
        "水彩",
        "艺术",
        "治愈",
        "watercolor",
      ],
      retro: ["游戏", "怀旧", "复古", "像素", "8-bit", "游戏", "复古", "retro"],
      minimal: ["简约", "简洁", "高端", "品牌", "minimal", "clean"],
      cinematic: ["电影", "大片", "史诗", "好莱坞", "电影感", "cinematic"],
    };

    // 匹配关键
    for (const styleKey of styleKeys) {
      const style = this.data.styleLibrary[styleKey];
      const keywords = keywordsMap[styleKey] || [];

      // 检查推荐场景中是否有匹
      for (const scenario of style.recommendedFor) {
        if (input.includes(scenario.toLowerCase())) {
          return styleKey;
        }
      }

      // 检查关键词匹配
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          return styleKey;
        }
      }
    }

    // 默认返回动漫风格
    return "anime";
  },

  // 保存视频创作历史
  async saveVideoCreationHistory(userMessage, videoResults, scriptReply) {
    try {
      console.log("开始保存视频创作历史...");

      const successCount = videoResults.filter((vid) => vid.videoUrl).length;
      const failCount = videoResults.length - successCount;

      const creationData = {
        userId: wx.getStorageSync("openid") || "unknown",
        agentId: "video_generation",
        agentName: "视频生成",
        character: "",
        prompt: userMessage,
        content: `生成了${videoResults.length}个视频：${scriptReply.substring(0, 200)}...`,
        mediaType: "video",
        mediaUrl: successCount > 0 ? videoResults[0].videoUrl : "",
        duration: 0, // 可以从视频元数据获取
        status: successCount > 0 ? "completed" : "failed",
      };

      // 异步保存，不阻塞主流程
      this.creationHistoryManager.saveVideoCreation(creationData);
      console.log("视频创作历史保存已触发");
    } catch (error) {
      console.error("保存视频创作历史失败（不影响主流程）:", error);
    }
  },

  // 保存图片创作历史
  async saveImageCreationHistory(userMessage, imageResults, textReply) {
    try {
      console.log("开始保存图片创作历史...");

      const successCount = imageResults.filter((img) => img.imageUrl).length;

      const creationData = {
        userId: wx.getStorageSync("openid") || "unknown",
        agentId: "image_generation",
        agentName: "图片生成",
        character: "",
        prompt: userMessage,
        content: `生成了${imageResults.length}张图片：${textReply.substring(0, 200)}...`,
        mediaType: "image",
        mediaUrl: successCount > 0 ? imageResults[0].imageUrl : "",
        duration: 0,
        status: successCount > 0 ? "completed" : "failed",
      };

      // 异步保存，不阻塞主流程
      this.creationHistoryManager.saveImageCreation(creationData);
      console.log("图片创作历史保存已触发");
    } catch (error) {
      console.error("保存图片创作历史失败（不影响主流程）:", error);
    }
  },

  // 保存角色创作历史
  async saveCharacterCreationHistory(userMessage, characterSheets) {
    try {
      console.log("开始保存角色创作历史...");

      const successCount = Object.keys(characterSheets).length;

      // 构建角色名称列表
      const characterNames = Object.values(characterSheets)
        .map((sheet) => sheet.name || "未知角色")
        .join("、");

      const creationData = {
        userId: wx.getStorageSync("openid") || "unknown",
        agentId: "character_consistency",
        agentName: "角色三视图",
        character: characterNames,
        prompt: userMessage,
        content: `生成了${successCount}个角色三视图：${characterNames}`,
        mediaType: "image",
        mediaUrl:
          successCount > 0
            ? Object.values(characterSheets)[0].combinedViewUrl
            : "",
        duration: 0,
        status: successCount > 0 ? "completed" : "failed",
      };

      // 异步保存，不阻塞主流程
      this.creationHistoryManager.saveCharacterCreation(creationData);
      console.log("角色创作历史保存已触发");
    } catch (error) {
      console.error("保存角色创作历史失败（不影响主流程）:", error);
    }
  },

  // 应用风格到提示词（委托给StyleManager）
  applyStyleToPrompt(basePrompt, styleKey) {
    if (this.styleManager) {
      return this.styleManager.applyStyleToPrompt(basePrompt, styleKey);
    }

    // 降级方案：返回基础提示
    return {
      prompt: basePrompt,
      negativePrompt: "",
    };
  },

  // 获取系统提示词（使用PromptTemplates模块）
  getSystemPrompt(agentType) {
    if (PromptTemplates) {
      const template = PromptTemplates.PROMPT_TEMPLATES[agentType];
      if (template) {
        return template.base || template;
      }
    }

    // 智能体类型映射：agents.js使用的名称 -> prompt-templates.js中的名称
    const agentTypeMap = {
      trendHunter: "hotspot", // 热点追踪 -> 热点采集
      scriptWriter: "script", // 脚本创作 -> 脚本创作
      storyboard: "storyboard", // 分镜 -> 分镜生成
      videoComposer: "video", // 视频合成 -> 需要添加video模板
      qualityChecker: "quality", // 质检 -> 需要添加quality模板
      platformAdapter: "platform", // 平台适配 -> 需要添加platform模板
      autoPublisher: "publish", // 自动发布 -> 需要添加publish模板
      editor: "edit", // 剪辑 -> 需要添加edit模板
      dataAnalyst: "analysis", // 数据分析 -> 需要添加analysis模板
    };

    const mappedType = agentTypeMap[agentType];
    if (mappedType && PromptTemplates.PROMPT_TEMPLATES[mappedType]) {
      const template = PromptTemplates.PROMPT_TEMPLATES[mappedType];
      return template.base || template;
    }

    // 降级方案：返回基础提示
    const basePrompts = {
      trendHunter: "你是一个热点追踪专家，分析热门趋势并推荐选题。",
      scriptWriter: "你是一个专业的短视频脚本创作专家。",
      storyboard: "你是一个专业的分镜画面设计师和AI绘画专家。",
      videoComposer: "你是一个专业的视频合成专家。",
      qualityChecker: "你是一个严格的质检审核专家。",
      platformAdapter: "你是一个多平台适配专家。",
      autoPublisher: "你是一个自动化发布专家。",
      editor: "你是一个视频剪辑专家。",
      dataAnalyst: "你是一个短视频数据分析师。",
    };

    return basePrompts[agentType] || "你是一个AI助手，帮助用户创作短视频。";
  },

  // 应用风格到提示词（委托给StyleManager）
  applyStyleToPrompt(basePrompt, styleKey) {
    if (this.styleManager) {
      return this.styleManager.applyStyleToPrompt(basePrompt, styleKey);
    }

    // 降级方案：返回基础提示
    return {
      prompt: basePrompt,
      negativePrompt: "",
    };
  },

  // ========== 切换历史面板
  toggleHistoryPanel() {
    this.setData({
      showHistory: !this.data.showHistory,
    });
  },

  // 保存当前创作到历
  saveCurrentCreation() {
    const messages = this.data.messages;
    const agentOutputs = this.data.agentOutputs;

    if (messages.length === 0) {
      wx.showToast({ title: "没有可保存的内容", icon: "none" });
      return;
    }

    // 获取用户输入
    const userMessage =
      messages.find((m) => m.sender === "user")?.content || "未命名创作";

    const creationRecord = {
      id: Date.now(),
      title:
        userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : ""),
      userInput: userMessage,
      agentOutputs: agentOutputs,
      messages: messages,
      platform: this.data.selectedPlatform,
      createdAt: new Date().getTime(),
    };

    const history = [creationRecord, ...this.data.creationHistory].slice(0, 50); // 只保留最条0    this.setData({ creationHistory: history });
    this.saveCreationHistory();

    wx.showToast({ title: "已保存到创作历史", icon: "success" });
  },

  // 从历史记录恢复创
  restoreCreation(record) {
    wx.showModal({
      title: "确认恢复",
      content: `是否恢复创作条${record.title}"？`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            inputValue: record.userInput,
            agentOutputs: record.agentOutputs,
            messages: record.messages,
          });

          wx.showToast({ title: "已恢复创", icon: "success" });
        }
      },
    });
  },

  // 删除历史记录
  deleteCreation(recordId) {
    const history = this.data.creationHistory.filter((r) => r.id !== recordId);
    this.setData({ creationHistory: history });
    this.saveCreationHistory();

    wx.showToast({ title: "已删", icon: "success" });
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: "确认清空",
      content: "清空后所有历史记录将被删除，确定要清空吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({ creationHistory: [] });
          this.saveCreationHistory();

          wx.showToast({ title: "历史已清空", icon: "success" });
        }
      },
    });
  },

  // ========== 热点选择功能 ==========

  // 切换热点选择模式
  toggleTrendSelectionMode() {
    const modes = ["auto", "manual"];
    const currentIndex = modes.indexOf(this.data.trendSelectionMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    this.setData({ trendSelectionMode: nextMode });

    wx.showToast({
      title: nextMode === "auto" ? "自动选择热点" : "手动选择热点",
      icon: "none",
    });
  },

  // 显示热点选择对话框
  showTrendSelectionDialog() {
    const trends = this.data.availableTrends;

    if (trends.length === 0) {
      wx.showToast({ title: "暂无热点数据", icon: "none" });
      return;
    }

    const trendItems = trends.map(
      (t) => `${t.icon} ${t.name} (热度${t.score})`,
    );

    wx.showActionSheet({
      itemList: trendItems,
      success: (res) => {
        const selectedTrend = trends[res.tapIndex];
        if (selectedTrend) {
          this.selectTrend(selectedTrend);
        }
      },
    });
  },

  // 选择热点
  selectTrend(trend) {
    // 更新选中的热点（显示在热点卡片中）
    const selectedHotspot = {
      name: trend.name,
      reason: trend.reason,
      score: trend.score,
      source: trend.source || "未知",
      category: trend.category || "全部",
    };

    // 更新输入框内容
    this.setData({
      inputValue: `请根据热点"${trend.name}"帮我创作一个短视频。${trend.reason}`,
      selectedHotspot: selectedHotspot,
      hotspotCardVisible: true,
      hotspotCardCollapsed: false,
    });

    wx.showToast({
      title: `已选择${trend.name}`,
      icon: "success",
    });
  },

  // 切换风格面板
  toggleStylePanel() {
    this.setData({
      showStylePanel: !this.data.showStylePanel,
    });
  },

  // 切换历史面板
  toggleHistoryPanel() {
    this.setData({
      showHistory: !this.data.showHistory,
    });
  },

  // 切换热点面板
  toggleTrendPanel() {
    const newState = !this.data.showTrendPanel;
    this.setData({
      showTrendPanel: newState,
    });

    // 如果面板打开且没有热点数据，则获取热点
    if (
      newState &&
      this.data.availableTrends.length === 0 &&
      !this.data.fetchingTrends
    ) {
      this.fetchHotTrends();
    }
  },

  // 切换设置面板
  toggleSettings() {
    this.setData({
      settingsCollapsed: !this.data.settingsCollapsed,
    });
  },

  // 切换热点卡片
  toggleHotspotCard() {
    this.setData({
      hotspotCardCollapsed: !this.data.hotspotCardCollapsed,
    });
  },

  // 移除热点显示
  removeHotspotDisplay() {
    this.setData({
      selectedHotspot: null,
      hotspotCardVisible: false,
    });
  },

  // 阻止事件冒泡
  stopPropagation(e) {
    // 空方法，仅用于阻止冒泡
  },

  // 隐藏热点显示
  removeHotspotDisplay() {
    this.setData({
      selectedHotspot: null,
      hotspotCardVisible: false,
    });
  },

  // 查看智能体详情
  viewAgentDetail(e) {
    const agentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/agentDetail/agentDetail?id=${agentId}`,
    });
  },

  // 监听滚动
  onContentScroll(e) {
    const scrollTop = e.detail.scrollTop;
    this.setData({
      scrollTop: scrollTop,
    });
  },

  // 选择热点
  selectTrendByTap(e) {
    const trend = e.currentTarget.dataset.trend;
    if (!trend) {
      console.warn("热点数据为空");
      return;
    }

    console.log("选择热点:", trend);

    // 设置选中的热点（显示在热点卡片中）
    const selectedHotspot = {
      name: trend.name,
      reason: trend.reason,
      score: trend.score,
      source: trend.source || "未知",
      category: trend.category || "全部",
    };

    // 设置输入值为热点描述
    const inputValue = trend.reason || trend.name || "";

    this.setData({
      selectedHotspot: selectedHotspot,
      inputValue: inputValue,
      hotspotCardVisible: true,
      hotspotCardCollapsed: false,
      showTrendPanel: false, // 关闭热点面板
    });

    console.log("已选择热点，关闭热点面板", {
      selectedHotspot,
      inputValue,
    });

    wx.showToast({
      title: `已选择: ${trend.name}`,
      icon: "success",
      duration: 1500,
    });
  },

  // 点击智能体图标查看工作详情
  onAgentTap(e) {
    // 委托给智能体工作区管理器处理
    if (this.agentWorkspaceManager) {
      this.agentWorkspaceManager.onAgentTap(e);
    }
  },

  // 切换智能体卡片展开/折叠
  toggleAgentCard(e) {
    if (this.agentWorkspaceManager) {
      this.agentWorkspaceManager.toggleAgentCard(e);
    }
  },

  // 跳转到首页
  goToIndex() {
    wx.switchTab({
      url: "/pages/index/index",
    });
  },

  // 聚焦输入框
  focusInput() {
    this.setData({ inputFocus: true });
    setTimeout(() => {
      this.setData({ inputFocus: false });
    }, 100);
  },

  // 发送消息
  async sendMessage() {
    const inputValue = this.data.inputValue.trim();
    if (!inputValue) {
      wx.showToast({
        title: "请输入内容",
        icon: "none",
      });
      return;
    }

    if (this.data.working) {
      return;
    }

    // 执行完整工作流
    await this.executeFullWorkflow(inputValue);
  },

  // 取消任务
  cancelWorkflow() {
    wx.showModal({
      title: "确认取消",
      content: "确定要取消当前任务吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({ isCancelled: true });
          wx.showToast({
            title: "任务已取消",
            icon: "none",
          });
        }
      },
    });
  },

  // 选择平台
  selectPlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    this.setData({ selectedPlatform: platform });
  },

  // 切换智能体开关
  toggleAgent(e) {
    const key = e.currentTarget.dataset.key;
    const agents = this.data.agents;
    if (agents[key]) {
      agents[key].enabled = !agents[key].enabled;
      this.setData({ agents });
      wx.setStorageSync("agents_config", agents);
    }
  },

  // 显示混元API配置对话框
  showHunyuanConfigDialog() {
    const config = this.data.hunyuanConfig || {
      enabled: false,
      secretId: "",
      secretKey: "",
    };

    const options = [
      config.enabled ? "禁用混元模型" : "启用混元模型",
      "配置SecretId",
      "配置SecretKey",
      "查看当前配置",
      "测试混元模型",
    ];

    wx.showActionSheet({
      itemList: options,
      success: async (res) => {
        if (res.tapIndex === 0) {
          // 切换启用状态
          const newConfig = {
            ...config,
            enabled: !config.enabled,
          };
          this.saveHunyuanConfig(newConfig);
        } else if (res.tapIndex === 1) {
          // 配置SecretId
          wx.showModal({
            title: "配置SecretId",
            content: "请输入腾讯云SecretId",
            editable: true,
            placeholderText: config.secretId,
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                this.saveHunyuanConfig({
                  ...config,
                  secretId: modalRes.content.trim(),
                });
              }
            },
          });
        } else if (res.tapIndex === 2) {
          // 配置SecretKey
          wx.showModal({
            title: "配置SecretKey",
            content: "请输入腾讯云SecretKey",
            editable: true,
            placeholderText: "请输入密钥（只显示长度）",
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                this.saveHunyuanConfig({
                  ...config,
                  secretKey: modalRes.content.trim(),
                });
              }
            },
          });
        } else if (res.tapIndex === 3) {
          // 查看当前配置
          const statusText = config.enabled ? "已启用" : "未启用";
          const appIdText = config.appId ? "已配置" : "未配置";
          const secretIdText = config.secretId ? "已配置" : "未配置";
          const secretKeyText = config.secretKey ? "已配置" : "未配置";

          wx.showModal({
            title: "混元模型配置",
            content: `状态: ${statusText}\nSecretId: ${secretIdText}\nSecretKey: ${secretKeyText}\n\n图片生成优先使用混元模型，配置失败时自动降级到GLM模型`,
            showCancel: false,
          });
        } else if (res.tapIndex === 4) {
          // 测试混元模型
          await this.testHunyuanModel();
        }
      },
    });
  },

  // 切换测试模式
  switchTestMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      testMode: mode,
      selectedTestAgent: "",
    });
  },

  // 选择测试智能体
  selectTestAgent(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      selectedTestAgent: key,
    });
  },

  // 选择风格
  selectStyle(e) {
    const key = e.currentTarget.dataset.key;
    const style = this.data.styleLibrary[key] || this.data.styleLibrary.anime;
    this.setData({
      selectedStyle: key,
      currentStyleIcon: style.icon || "🎌",
      currentStyleName: style.name || "日系动漫",
    });
    wx.setStorageSync("selected_style", key);
  },

  // 保存当前创作
  saveCurrentCreation() {
    const messages = this.data.messages;
    if (!messages || messages.length === 0) {
      wx.showToast({
        title: "暂无内容可保存",
        icon: "none",
      });
      return;
    }

    const creationHistory = this.data.creationHistory || [];
    const newCreation = {
      id: Date.now(),
      inputValue: this.data.inputValue,
      messages: messages,
      createdAt: Date.now(),
    };

    creationHistory.unshift(newCreation);
    if (creationHistory.length > 50) {
      creationHistory.pop();
    }

    this.setData({ creationHistory });
    wx.setStorageSync("creation_history", creationHistory);

    wx.showToast({
      title: "已保存",
      icon: "success",
    });
  },

  // 清空历史（从云数据库）
  async clearHistory() {
    wx.showModal({
      title: "确认清空",
      content: "确定要清空所有云端历史记录吗？",
      success: async (res) => {
        if (res.confirm) {
          try {
            if (!app.globalData.cloudInitialized) {
              wx.showToast({ title: "请先登录", icon: "none" });
              return;
            }

            wx.showLoading({ title: "清空中..." });

            const db = wx.cloud.database();
            // 删除当前用户的所有历史记录
            await db
              .collection("creation_history")
              .where({ _openid: "{openid}" })
              .remove();

            this.setData({ creationHistory: [] });
            wx.hideLoading();
            wx.showToast({ title: "已清空云端历史", icon: "success" });
          } catch (error) {
            console.error("清空历史失败:", error);
            wx.hideLoading();
            wx.showToast({ title: "清空失败", icon: "none" });
          }
        }
      },
    });
  },

  // 删除创作（从云数据库）
  async deleteCreation(e) {
    const id = e.currentTarget.dataset.id;

    try {
      if (!app.globalData.cloudInitialized) {
        wx.showToast({ title: "请先登录", icon: "none" });
        return;
      }

      wx.showLoading({ title: "删除中..." });

      const db = wx.cloud.database();
      await db.collection("creation_history").doc(id).remove();

      // 更新本地列表
      const creationHistory = this.data.creationHistory.filter(
        (item) => item._id !== id,
      );
      this.setData({ creationHistory });

      wx.hideLoading();
      wx.showToast({ title: "已删除", icon: "success" });
    } catch (error) {
      console.error("删除创作失败:", error);
      wx.hideLoading();
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  },

  // 恢复创作（从云数据库加载完整数据）
  async restoreCreation(e) {
    const record = e.currentTarget.dataset.record;
    if (!record) return;

    wx.showModal({
      title: "确认恢复",
      content: "确定要恢复这条创作吗？",
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: "恢复中..." });

            const db = wx.cloud.database();
            // 从云端获取完整记录
            const result = await db
              .collection("creation_history")
              .doc(record._id)
              .get();
            const fullRecord = result.data;

            this.setData({
              inputValue: fullRecord.inputValue || "",
              messages: fullRecord.messages || [],
              selectedHotspot: fullRecord.hotspot || null,
            });

            this.toggleHistoryPanel();
            wx.hideLoading();
            wx.showToast({ title: "已恢复", icon: "success" });
          } catch (error) {
            console.error("恢复创作失败:", error);
            wx.hideLoading();
            wx.showToast({ title: "恢复失败", icon: "none" });
          }
        }
      },
    });
  },

  // 格式化标题
  formatTitle(item) {
    const inputValue = item.inputValue || "未命名创作";
    return inputValue.length > 20
      ? inputValue.substring(0, 20) + "..."
      : inputValue;
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return Math.floor(diff / 60000) + "分钟前";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "小时前";
    return Math.floor(diff / 86400000) + "天前";
  },

  // 格式化获取时间
  formatFetchTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  },

  // 格式化JSON输出
  formatJSON(obj) {
    if (!obj) return "";
    try {
      if (typeof obj === "string") {
        return obj;
      }
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  },

  // 打开参数设置
  openParams() {
    this.toggleStylePanel();
    setTimeout(() => {
      wx.switchTab({
        url: "/pages/params/params",
      });
    }, 300);
  },

  // 刷新热点
  async refreshTrends() {
    if (this.data.fetchingTrends) {
      return;
    }

    this.setData({ fetchingTrends: true });

    try {
      // 调用云函数获取热点（与热点页面使用相同的云函数）
      const cloudCall = wx.cloud.callFunction({
        name: "hotspot-miyucaicai",
        data: {},
      });

      // 18秒超时（云函数20秒超时，留2秒余量）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("请求超时")), 18000);
      });

      const res = await Promise.race([cloudCall, timeoutPromise]);

      if (res.result && res.result.success) {
        const allHotspots = res.result.data || [];
        console.log(`获取到 ${allHotspots.length} 条热点`);

        // 转换为agents页面需要的格式
        const trends = this.trendManager.mapHotspotsToTrends(allHotspots);

        this.setData(
          {
            availableTrends: trends,
            hotspotDataSource: "live",
            lastHotspotFetch: new Date(),
            fetchingTrends: false,
          },
          () => {
            // 更新筛选后的热点列表
            this.updateFilteredTrends();
          },
        );

        // 保存到缓存
        wx.setStorageSync("trend_data", {
          trends: trends,
          timestamp: Date.now(),
        });

        wx.showToast({
          title: `已更新${trends.length}条热点`,
          icon: "success",
        });
      } else {
        throw new Error(res.result?.error || "获取热点失败");
      }
    } catch (error) {
      console.error("刷新热点失败:", error);

      // 尝试从缓存加载
      const cached = wx.getStorageSync("trend_data");
      if (cached && cached.trends && cached.trends.length > 0) {
        console.log("刷新失败，使用缓存数据:", cached.trends.length, "条");
        this.setData(
          {
            availableTrends: cached.trends,
            hotspotDataSource: "cache",
            lastHotspotFetch: new Date(cached.timestamp),
            fetchingTrends: false,
          },
          () => {
            this.updateFilteredTrends();
          },
        );

        wx.showToast({
          title: "使用缓存数据",
          icon: "none",
        });
      } else {
        // 没有缓存，设置空数组
        this.setData(
          {
            availableTrends: [],
            hotspotDataSource: "mock",
            fetchingTrends: false,
          },
          () => {
            this.updateFilteredTrends();
          },
        );

        wx.showToast({
          title: "热点加载失败",
          icon: "none",
        });
      }
    }
  },

  // 切换热点分类
  selectTrendCategory(e) {
    const category = e.currentTarget.dataset.category;
    console.log("选择热点分类:", category);
    this.setData({ selectedTrendCategory: category }, () => {
      // 更新筛选后的热点列表
      this.updateFilteredTrends();
    });
  },

  // 更新筛选后的热点列表（委托给 TrendManager）
  updateFilteredTrends() {
    this.trendManager.updateFilteredTrends();
  },

  // 内容滚动
  onContentScroll(e) {
    // 记录滚动位置，但不阻止滚动
    // this.setData({ scrollTop: e.detail.scrollTop });
  },

  // 点击工作流步骤
  onWorkflowStepTap(e) {
    const step = e.currentTarget.dataset.step;
    const agent = e.currentTarget.dataset.agent;

    // 如果该步骤已完成，可以跳转
    if (this.data.currentStep >= step) {
      console.log("跳转到步骤", step, "智能体", agent);

      // 查找对应的消息并滚动到该位置
      const messages = this.data.messages;
      const targetIndex = messages.findIndex((msg) => msg.sender === agent);

      if (targetIndex >= 0) {
        this.setData({
          toView: `msg-${targetIndex}`,
        });
        console.log(`滚动到消息: msg-${targetIndex}`);
      } else {
        // 如果没有找到对应消息，尝试滚动到工作区
        this.setData({
          toViewWorkspace: `agent-${agent}`,
        });
        console.log(`滚动到工作区: agent-${agent}`);
      }

      wx.showToast({
        title: `查看${agent}的输出`,
        icon: "none",
        duration: 1500,
      });
    } else {
      // 步骤未完成，提示用户
      wx.showToast({
        title: "请先完成前面步骤",
        icon: "none",
        duration: 1500,
      });
    }
  },

  // 空方法，防止事件穿透
  noop() {},

  // 切换历史面板
  toggleHistoryPanel() {
    this.setData({
      showHistory: !this.data.showHistory,
    });
  },

  // 切换设置面板
  toggleSettings() {
    this.setData({
      settingsCollapsed: !this.data.settingsCollapsed,
    });
  },

  // 切换热点面板
  toggleTrendPanel() {
    this.setData({
      showTrendPanel: !this.data.showTrendPanel,
    });
  },

  // 切换风格面板
  toggleStylePanel() {
    this.setData({
      showStylePanel: !this.data.showStylePanel,
    });
  },

  // 调用AI智能体（支持流式响应和思考过程）
  async callAIAgent(message, options = {}) {
    try {
      console.log("🤖 调用AI智能体:", message);

      const {
        showLoading = true,
        showThinking = false,
        streamResponse = false,
        threadId = null,
      } = options;

      // 显示加载提示
      if (showLoading) {
        wx.showLoading({
          title: "AI思考中...",
          mask: true,
        });
      }

      // 准备API请求参数
      const apiConfig = this.data.hunyuanConfig?.enabled
        ? {
            endpoint: this.data.hunyuanConfig.appId || "", // 混元使用appId作为标识
            secretId: this.data.hunyuanConfig.secretId,
            secretKey: this.data.hunyuanConfig.secretKey,
            model: "hunyuan-lite",
            isHunyuan: true,
          }
        : {
            endpoint: this.data.apiConfig?.endpoint || "",
            apiKey: this.data.apiConfig?.apiKey,
            model: "glm-4",
            isHunyuan: false,
          };

      // 验证API配置
      if (!apiConfig.endpoint) {
        throw new Error("API配置不完整，请先配置API");
      }

      // 调用云函数代理请求
      const functionName = "glm-api";
      console.log("调用云函数:", functionName);

      const res = await wx.cloud.callFunction({
        name: functionName,
        data: {
          action: "chat",
          endpoint: "chat/completions",
          apiKey: apiConfig.secretKey || this.data.apiConfig?.apiKey || "",
          data: {
            model: apiConfig.model || "glm-4",
            messages: [
              {
                role: "user",
                content: message,
              },
            ],
          },
        },
      });

      console.log("云函数响应:", res.result);

      // 隐藏加载状态
      wx.hideLoading();

      // 检查响应是否成功
      if (!res.result || !res.result.success) {
        const errorMsg = res.result?.error || "AI服务返回错误";
        console.error("❌ AI响应错误:", errorMsg);
        wx.showToast({
          title: errorMsg,
          icon: "none",
          duration: 3000,
        });
        throw new Error(errorMsg);
      }

      // 获取响应内容
      const responseData = res.result.data;
      let fullResponse = "";

      console.log("GLM API 原始响应:", JSON.stringify(responseData, null, 2));

      // 解析 GLM API 响应格式（支持多种格式）
      if (responseData) {
        // 标准OpenAI格式
        if (
          responseData.choices &&
          responseData.choices.length > 0 &&
          responseData.choices[0].message?.content
        ) {
          fullResponse = responseData.choices[0].message.content;
        }
        // GLM API 直接格式（有时直接返回 content）
        else if (responseData.content) {
          fullResponse = responseData.content;
        }
        // GLM 旧格式（data.content）
        else if (responseData.data && responseData.data.content) {
          fullResponse = responseData.data.content;
        }
        // 字符串直接返回
        else if (typeof responseData === "string") {
          fullResponse = responseData;
        }
      }

      console.log("✅ AI智能体调用完成");
      console.log("💬 AI回复:", fullResponse);

      return {
        success: true,
        reply: fullResponse,
        response: fullResponse,
        hasThinking: false,
        messageId: res.requestId,
        isStreaming: false,
      };
    } catch (error) {
      console.error("❌ AI智能体调用失败:", error);
      wx.hideLoading();

      // 显示用户友好的错误提示
      let errorMessage = "AI服务暂时不可用";
      if (error.message) {
        errorMessage = error.message;
      }

      wx.showToast({
        title: errorMessage,
        icon: "none",
        duration: 2000,
      });

      return {
        success: false,
        error: error.message || errorMessage,
      };
    }
  },

  // 测试AI Agent功能
  async testAIAgent() {
    try {
      console.log("🧪 开始测试AI Agent功能...");

      // 测试消息
      const testMessage = "你好，这是一个测试消息，请简单回复确认功能正常";

      // 调用AI Agent
      const result = await this.callAIAgent(testMessage, {
        showLoading: true,
        showThinking: true,
        streamResponse: true,
        threadId: "test-thread-" + Date.now(),
      });

      if (result.success) {
        console.log("✅ AI Agent测试成功!");
        console.log("📝 完整响应:", result.response);
        console.log("🧠 是否包含思考:", result.hasThinking);
        console.log("📋 消息ID:", result.messageId);

        wx.showModal({
          title: "AI Agent测试结果",
          content: `功能正常！\n\n响应长度: ${result.response.length}\n包含思考: ${result.hasThinking ? "是" : "否"}\n\n是否要查看完整回复？`,
          showCancel: false,
          confirmText: "查看回复",
          cancelText: "关闭",
          success: (res) => {
            if (res.confirm) {
              console.log("用户选择查看完整回复");
              // 可以在这里显示更详细的信息
              wx.showModal({
                title: "完整AI回复",
                content: result.response || "无回复内容",
                showCancel: false,
                confirmText: "确定",
              });
            }
          },
        });

        return result;
      } else {
        console.error("❌ AI Agent测试失败:", result.error);

        wx.showModal({
          title: "测试失败",
          content: `错误信息: ${result.error || "未知错误"}`,
          showCancel: false,
          confirmText: "确定",
        });

        return result;
      }
    } catch (error) {
      console.error("❌ 测试过程中发生错误:", error);

      wx.showModal({
        title: "测试异常",
        content: `测试异常: ${error.message || "未知异常"}`,
        showCancel: false,
        confirmText: "确定",
      });

      return {
        success: false,
        error: error.message || "测试异常",
      };
    }
  },

  // === 热点面板相关方法 ===

  // 切换热点面板显示
  toggleTrendPanel() {
    const current = this.data.showTrendPanel;
    this.setData({ showTrendPanel: !current });
  },

  // 刷新热点数据
  async refreshTrends() {
    console.log("刷新热点数据");
    if (this.data.fetchingTrends) {
      wx.showToast({ title: "正在刷新中...", icon: "none" });
      return;
    }

    try {
      this.setData({ fetchingTrends: true });
      await this.trendManager.refreshTrends();
      this.setData({ fetchingTrends: false });
    } catch (error) {
      console.error("刷新热点失败:", error);
      this.setData({ fetchingTrends: false });
      wx.showToast({ title: "刷新失败", icon: "none" });
    }
  },

  // 选择热点分类
  selectTrendCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData(
      {
        selectedTrendCategory: category,
      },
      () => {
        this.trendManager.updateFilteredTrends();
      },
    );
  },

  // 格式化获取时间
  formatFetchTime(time) {
    if (!time) return "";
    const now = new Date();
    const fetchTime = new Date(time);
    const diff = now - fetchTime;

    if (diff < 60000) {
      return "刚刚";
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return `${Math.floor(diff / 86400000)}天前`;
    }
  },

  // 聚焦输入框
  focusInput() {
    this.setData({ inputFocus: true });
    setTimeout(() => {
      this.setData({ inputFocus: false });
    }, 300);
  },

  // 切换风格面板
  toggleStylePanel() {
    this.setData({
      showStylePanel: !this.data.showStylePanel,
    });
    console.log("切换风格面板:", !this.data.showStylePanel);
  },

  // 选择风格
  selectStyle(e) {
    const styleKey = e.currentTarget.dataset.key;
    console.log("选择风格:", styleKey);

    const style =
      this.data.styleLibrary[styleKey] || this.data.styleLibrary.anime;

    this.setData({
      selectedStyle: styleKey,
      currentStyleIcon: style.icon || "🎌",
      currentStyleName: style.name || "日系动漫",
      showStylePanel: false,
    });

    // 保存到本地存储
    wx.setStorageSync("selected_style", styleKey);

    wx.showToast({
      title: `已选择: ${style.name}`,
      icon: "success",
      duration: 1500,
    });
  },

  // 打开参数设置
  openParams() {
    wx.showModal({
      title: "参数设置",
      content: "参数设置功能正在开发中...",
      showCancel: false,
    });
  },

  // 刷新用户额度
  loadUserCredits() {
    wx.showLoading({ title: "刷新中..." });

    setTimeout(() => {
      this.setData({
        userCredits: Math.floor(Math.random() * 100),
        dailyUsed: Math.floor(Math.random() * 3),
      });
      wx.hideLoading();
      wx.showToast({ title: "已刷新", icon: "success" });
    }, 500);
  },
});
