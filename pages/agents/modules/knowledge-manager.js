// modules/knowledge-manager.js
// 智能体知识库管理模块 - 轻量级本地存储 + 云端备份

const KnowledgeManager = {
  /**
   * 保存成功案例到知识库
   */
  async saveSuccessCaseToKnowledge(agentKey, input, output, rating = 5) {
    const caseItem = {
      id: `case_${Date.now()}`,
      input,
      output,
      rating,
      useCount: 0,
      createdAt: new Date().toISOString(),
      tags: this.extractTags(input),
    };

    console.log(`【知识库】保存成功案例到 ${agentKey}:`, caseItem);

    // 1. 保存到本地（轻量）
    this.saveToLocalKnowledge(agentKey, caseItem);

    // 2. 异步保存到云端（完整）
    this.saveToCloudKnowledge(agentKey, caseItem);

    // 3. 更新学习进度
    const progress = this.updateLearningProgress(agentKey, 10); // 每个案例+10 XP
    return progress;
  },

  /**
   * 从知识库加载相关案例
   */
  async loadAgentKnowledge(agentKey, input) {
    // 1. 先从本地加载
    const localCases = this.loadFromLocalKnowledge(agentKey);
    const tags = this.extractTags(input);

    // 2. 筛选相关案例
    const relevantCases = localCases
      .filter((c) => {
        return this.calculateRelevance(c, tags) > 0.3;
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3); // 最多返回3个相关案例

    console.log(`【知识库】从本地加载 ${relevantCases.length} 个相关案例`);

    // 3. 如果本地不够，从云端查询
    if (relevantCases.length < 3) {
      try {
        const cloudCases = await this.loadFromCloudKnowledge(agentKey, tags);
        console.log(`【知识库】从云端加载 ${cloudCases.length} 个相关案例`);
        return {
          recentCases: [
            ...relevantCases,
            ...cloudCases.slice(0, 3 - relevantCases.length),
          ],
        };
      } catch (error) {
        console.error("【知识库】从云端加载失败:", error);
        return { recentCases: relevantCases };
      }
    }

    return { recentCases: relevantCases };
  },

  /**
   * 手动添加知识条目
   */
  async addKnowledgeItem(agentKey, item) {
    const knowledgeItem = {
      id: `manual_${Date.now()}`,
      type: "manual",
      input: item.input || "",
      output: item.output || "",
      rating: item.rating || 5,
      tags: item.tags || [],
      createdAt: new Date().toISOString(),
    };

    console.log(`【知识库】手动添加知识到 ${agentKey}:`, knowledgeItem);

    // 保存到云端
    await this.saveToCloudKnowledge(agentKey, knowledgeItem);

    // 更新学习进度
    this.updateLearningProgress(agentKey, 5);

    return { success: true };
  },

  /**
   * 清理过期/低频数据
   */
  cleanUpLocalKnowledge() {
    console.log("【知识库】开始清理本地数据");

    const agentKeys = ["scriptWriter", "storyboard", "videoComposer"];

    agentKeys.forEach((agentKey) => {
      const key = `knowledge_${agentKey}`;
      try {
        const knowledge = wx.getStorageSync(key);
        if (!knowledge || !knowledge.recentCases) {
          return;
        }

        // 按使用频率排序
        knowledge.recentCases.sort((a, b) => b.useCount - a.useCount);

        // 保留前20条
        if (knowledge.recentCases.length > 20) {
          knowledge.recentCases = knowledge.recentCases.slice(0, 20);
        }

        // 删除30天未使用的数据
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        knowledge.recentCases = knowledge.recentCases.filter((c) => {
          return new Date(c.createdAt).getTime() > thirtyDaysAgo;
        });

        wx.setStorageSync(key, knowledge);
        console.log(
          `【知识库】${agentKey} 清理完成，保留 ${knowledge.recentCases.length} 条`,
        );
      } catch (error) {
        console.error(`【知识库】${agentKey} 清理失败:`, error);
      }
    });
  },

  /**
   * 提取标签
   */
  extractTags(input) {
    const keywords = [
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
      "美食",
      "做饭",
      "烹饪",
      "菜谱",
      "料理",
      "餐厅",
      "探店",
      "旅行",
      "旅游",
      "风景",
      "景点",
      "出游",
      "度假",
      "游戏",
      "创意",
      "爆款",
      "youtube",
      "抖音",
      "B站",
      "vlog",
      "教程",
      "测评",
      "介绍",
      "宣传",
      "广告",
      "生活",
      "技巧",
      "实用",
      "家居",
      "日常",
      "娱乐",
      "音乐",
      "短剧",
      "明星",
      "电影",
      "电视",
    ];

    const found = [];
    keywords.forEach((k) => {
      if (input && input.toLowerCase().includes(k.toLowerCase())) {
        found.push(k);
      }
    });

    return found;
  },

  /**
   * 计算相关性
   */
  calculateRelevance(caseItem, tags) {
    const caseTags = caseItem.tags || [];
    if (tags.length === 0) return 0.5; // 没有标签时返回中等相关性

    const intersection = caseTags.filter((t) => tags.includes(t));
    return intersection.length / Math.max(caseTags.length, tags.length);
  },

  /**
   * 本地存储
   */
  saveToLocalKnowledge(agentKey, caseItem) {
    const key = `knowledge_${agentKey}`;
    let knowledge = wx.getStorageSync(key) || { recentCases: [] };

    // 添加新案例
    knowledge.recentCases.unshift(caseItem);

    // 限制数量（每人最多20条）
    if (knowledge.recentCases.length > 20) {
      knowledge.recentCases = knowledge.recentCases.slice(0, 20);
    }

    wx.setStorageSync(key, knowledge);
    console.log(`【知识库】已保存到本地: ${agentKey}`);
  },

  loadFromLocalKnowledge(agentKey) {
    const key = `knowledge_${agentKey}`;
    const knowledge = wx.getStorageSync(key);
    return knowledge?.recentCases || [];
  },

  /**
   * 云端存储
   */
  async saveToCloudKnowledge(agentKey, item) {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      console.log("【知识库】云开发未初始化，跳过云端保存");
      return;
    }

    try {
      const db = wx.cloud.database();
      await db.collection("agent_knowledge").add({
        data: {
          agentKey,
          ...item,
          createdAt: db.serverDate(),
        },
      });
      console.log("【知识库】已保存到云端");
    } catch (error) {
      console.error("【知识库】保存到云端失败:", error);
    }
  },

  async loadFromCloudKnowledge(agentKey, tags) {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      return [];
    }

    try {
      const db = wx.cloud.database();
      const res = await db
        .collection("agent_knowledge")
        .where({
          agentKey,
        })
        .limit(10)
        .get();

      return res.data.map((item) => ({
        id: item._id,
        input: item.input,
        output: item.output,
        tags: item.tags,
      }));
    } catch (error) {
      console.error("【知识库】从云端加载失败:", error);
      return [];
    }
  },

  /**
   * 更新学习进度
   */
  updateLearningProgress(agentKey, xpGain) {
    const key = `learning_${agentKey}`;
    let progress = wx.getStorageSync(key) || { level: 1, xp: 0 };

    progress.xp += xpGain;

    // 升级
    if (progress.xp >= 100) {
      progress.level += 1;
      progress.xp = progress.xp % 100;
    }

    wx.setStorageSync(key, progress);
    console.log(
      `【知识库】${agentKey} 学习进度更新: LV${progress.level}, XP: ${progress.xp}`,
    );

    // 返回是否升级
    return progress.xp < xpGain
      ? { leveledUp: true, newLevel: progress.level }
      : {};
  },

  /**
   * 获取学习进度
   */
  getLearningProgress(agentKey) {
    const key = `learning_${agentKey}`;
    const progress = wx.getStorageSync(key);
    return progress || { level: 1, xp: 0 };
  },

  /**
   * 初始化所有知识库
   */
  initAllKnowledge() {
    console.log("【知识库】初始化所有知识库");

    const agentKeys = ["scriptWriter", "storyboard", "videoComposer"];

    agentKeys.forEach((agentKey) => {
      const key = `knowledge_${agentKey}`;
      const learningKey = `learning_${agentKey}`;

      // 初始化知识库
      if (!wx.getStorageSync(key)) {
        wx.setStorageSync(key, { recentCases: [] });
      }

      // 初始化学习进度
      if (!wx.getStorageSync(learningKey)) {
        wx.setStorageSync(learningKey, { level: 1, xp: 0 });
      }
    });

    // 初始化全局配置
    if (!wx.getStorageSync("knowledge_config")) {
      wx.setStorageSync("knowledge_config", {
        maxLocalCases: 20,
        maxCloudCases: 1000,
        autoCleanup: true,
        lastCleanup: new Date().toISOString(),
      });
    }

    console.log("【知识库】初始化完成");
  },
};

module.exports = KnowledgeManager;
