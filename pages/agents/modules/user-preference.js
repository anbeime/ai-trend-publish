// user-preference.js - 用户偏好记忆模块
// 存储和管理用户的创作偏好、历史数据、使用习惯

const STORAGE_KEY_PREFERENCE = "user_preference";
const STORAGE_KEY_HISTORY = "creation_history";
const STORAGE_KEY_ANALYTICS = "user_usage_analytics";

/**
 * 用户偏好数据结构
 * interface UserPreference {
 *   themes: string[];           // 常用主题（科技、生活、情感等）
 *   creationType: string;         // 创作类型（短视频、漫剧、绘本）
 *   audience: string;             // 目标受众（Z世代、中老年、职场人等）
 *   preferredStyles: string[];     // 偏好风格（搞笑、温情、专业等）
 *   preferredDuration: number;     // 偏好时长（秒）
 *   frequentPlatforms: string[];    // 常用平台（抖音、快手、B站等）
 *   lastUpdateTime: string;        // 最后更新时间
 * }
 */

/**
 * UserPreferenceManager 类
 */
class UserPreferenceManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.preference = this.loadPreference();
    this.history = this.loadHistory();
    this.analytics = this.loadAnalytics();
  }

  /**
   * 加载用户偏好
   */
  loadPreference() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY_PREFERENCE);
      return (
        data || {
          themes: [],
          creationType: "短视频",
          audience: "Z世代",
          preferredStyles: [],
          preferredDuration: 30,
          frequentPlatforms: [],
          lastUpdateTime: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("加载用户偏好失败:", error);
      return null;
    }
  }

  /**
   * 保存用户偏好
   */
  savePreference() {
    try {
      this.preference.lastUpdateTime = new Date().toISOString();
      wx.setStorageSync(STORAGE_KEY_PREFERENCE, this.preference);
      console.log("用户偏好已保存:", this.preference);
      return true;
    } catch (error) {
      console.error("保存用户偏好失败:", error);
      return false;
    }
  }

  /**
   * 加载创作历史
   */
  loadHistory() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY_HISTORY);
      return data || [];
    } catch (error) {
      console.error("加载创作历史失败:", error);
      return [];
    }
  }

  /**
   * 添加创作历史记录
   * @param {object} record - 创作记录
   */
  addHistoryRecord(record) {
    const newRecord = {
      id: `history_${Date.now()}`,
      type: record.type || "创作", // 创作类型
      theme: record.theme || "", // 主题
      style: record.style || "", // 风格
      duration: record.duration || 0, // 时长
      platform: record.platform || "", // 平台
      createTime: new Date().toISOString(),
      hotspotUsed: record.hotspotUsed || null, // 使用的热点
      result: record.result || "success", // 结果（success/failed）
      ...record,
    };

    this.history.unshift(newRecord);

    // 保留最近100条记录
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    wx.setStorageSync(STORAGE_KEY_HISTORY, this.history);
    this.updateAnalytics(newRecord);
  }

  /**
   * 加载使用分析数据
   */
  loadAnalytics() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY_ANALYTICS);
      return (
        data || {
          totalCreations: 0,
          successfulCreations: 0,
          failedCreations: 0,
          themeFrequency: {}, // 主题频率
          styleFrequency: {}, // 风格频率
          platformFrequency: {}, // 平台频率
          avgDuration: 30, // 平均时长
          peakCreationTime: null, // 创作高峰时段
          lastAnalysisTime: null,
        }
      );
    } catch (error) {
      console.error("加载使用分析失败:", error);
      return null;
    }
  }

  /**
   * 更新使用分析数据
   * @param {object} record - 创作记录
   */
  updateAnalytics(record) {
    const analytics = this.analytics;

    // 更新总次数
    analytics.totalCreations++;
    if (record.result === "success") {
      analytics.successfulCreations++;
    } else {
      analytics.failedCreations++;
    }

    // 更新主题频率
    if (record.theme) {
      analytics.themeFrequency[record.theme] =
        (analytics.themeFrequency[record.theme] || 0) + 1;
    }

    // 更新风格频率
    if (record.style) {
      analytics.styleFrequency[record.style] =
        (analytics.styleFrequency[record.style] || 0) + 1;
    }

    // 更新平台频率
    if (record.platform) {
      analytics.platformFrequency[record.platform] =
        (analytics.platformFrequency[record.platform] || 0) + 1;
    }

    // 更新平均时长
    const currentTotal = analytics.avgDuration * (analytics.totalCreations - 1);
    analytics.avgDuration = Math.round(
      (currentTotal + (record.duration || 30)) / analytics.totalCreations,
    );

    // 更新创作高峰时段
    const now = new Date();
    const hour = now.getHours();
    if (!analytics.peakCreationTime) {
      analytics.peakCreationTime = {};
    }
    analytics.peakCreationTime[hour] =
      (analytics.peakCreationTime[hour] || 0) + 1;

    analytics.lastAnalysisTime = new Date().toISOString();
    wx.setStorageSync(STORAGE_KEY_ANALYTICS, analytics);
  }

  /**
   * 智能推荐：基于偏好推荐热点
   * @param {array} hotspots - 热点列表
   * @returns {array} - 推荐后的热点列表（添加matchScore字段）
   */
  recommendHotspots(hotspots) {
    if (!hotspots || hotspots.length === 0) {
      return [];
    }

    const { themes, audience } = this.preference;

    // 对每个热点进行匹配评分
    const scoredHotspots = hotspots.map((hotspot) => {
      let score = 0;

      // 1. 主题匹配（权重：40）
      if (themes.length > 0) {
        for (const theme of themes) {
          if (
            hotspot.name.includes(theme) ||
            (hotspot.reason && hotspot.reason.includes(theme))
          ) {
            score += 40;
            break;
          }
        }
      }

      // 2. 受众匹配（权重：30）
      const audienceKeywords = {
        Z世代: ["年轻", "潮流", "潮流", "时尚", "网络", "互联网"],
        中老年: ["养生", "健康", "生活", "家庭", "美食"],
        职场人: ["职场", "工作", "技能", "成长", "效率"],
        学生: ["学习", "校园", "考试", "知识", "教育"],
      };

      const keywords = audienceKeywords[audience] || [];
      for (const keyword of keywords) {
        if (
          hotspot.name.includes(keyword) ||
          (hotspot.reason && hotspot.reason.includes(keyword))
        ) {
          score += 30;
          break;
        }
      }

      // 3. 历史偏好匹配（权重：20）
      const topThemes = this.getTopThemes(5);
      for (const theme of topThemes) {
        if (hotspot.name.includes(theme)) {
          score += 20;
          break;
        }
      }

      // 4. 热度加成（权重：10）
      if (hotspot.score >= 90) {
        score += 10;
      }

      return {
        ...hotspot,
        matchScore: score,
        isRecommended: score >= 40,
      };
    });

    // 按匹配度排序，推荐的热点排在前面
    return scoredHotspots.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * 更新用户偏好（增量更新）
   * @param {object} updates - 偏好更新
   */
  updatePreference(updates) {
    this.preference = {
      ...this.preference,
      ...updates,
    };
    this.savePreference();
  }

  /**
   * 记录主题偏好
   * @param {string} theme - 主题名称
   */
  recordTheme(theme) {
    const { themes } = this.preference;

    // 如果主题不在列表中，添加它
    if (!themes.includes(theme)) {
      themes.push(theme);

      // 保留最近20个主题
      if (themes.length > 20) {
        this.preference.themes = themes.slice(-20);
      }

      this.savePreference();
    }
  }

  /**
   * 记录风格偏好
   * @param {string} style - 风格名称
   */
  recordStyle(style) {
    const { preferredStyles } = this.preference;

    // 如果风格不在列表中，添加它
    if (!preferredStyles.includes(style)) {
      preferredStyles.push(style);

      // 保留最近10个风格
      if (preferredStyles.length > 10) {
        this.preference.preferredStyles = preferredStyles.slice(-10);
      }

      this.savePreference();
    }
  }

  /**
   * 记录平台使用
   * @param {string} platform - 平台名称
   */
  recordPlatform(platform) {
    const { frequentPlatforms } = this.preference;

    // 如果平台不在列表中，添加它
    if (!frequentPlatforms.includes(platform)) {
      frequentPlatforms.push(platform);

      // 保留最近5个平台
      if (frequentPlatforms.length > 5) {
        this.preference.frequentPlatforms = frequentPlatforms.slice(-5);
      }

      this.savePreference();
    }
  }

  /**
   * 获取热门主题（基于使用频率）
   * @param {number} limit - 返回数量
   * @returns {array} - 热门主题列表
   */
  getTopThemes(limit = 10) {
    const themeFrequency = this.analytics.themeFrequency || {};

    return Object.entries(themeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([theme, count]) => ({ theme, count }));
  }

  /**
   * 获取热门风格（基于使用频率）
   * @param {number} limit - 返回数量
   * @returns {array} - 热门风格列表
   */
  getTopStyles(limit = 5) {
    const styleFrequency = this.analytics.styleFrequency || {};

    return Object.entries(styleFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([style, count]) => ({ style, count }));
  }

  /**
   * 获取热门平台（基于使用频率）
   * @returns {string} - 最热门平台
   */
  getTopPlatform() {
    const platformFrequency = this.analytics.platformFrequency || {};

    const sorted = Object.entries(platformFrequency).sort(
      ([, a], [, b]) => b - a,
    );

    return sorted.length > 0 ? sorted[0][0] : "抖音";
  }

  /**
   * 生成个性化上下文（用于智能体）
   * @returns {object} - 个性化上下文
   */
  generatePersonalizedContext() {
    const {
      themes,
      creationType,
      audience,
      preferredStyles,
      preferredDuration,
    } = this.preference;
    const topThemes = this.getTopThemes(5);
    const topStyles = this.getTopStyles(3);
    const topPlatform = this.getTopPlatform();

    return {
      userPreferences: {
        themes,
        creationType,
        audience,
        preferredStyles,
        preferredDuration,
      },
      historyInsights: {
        topThemes,
        topStyles,
        topPlatform,
        avgDuration: this.analytics.avgDuration,
        successRate:
          this.analytics.successfulCreations / this.analytics.totalCreations,
      },
      usageAnalytics: {
        totalCreations: this.analytics.totalCreations,
        peakCreationTime: this.analytics.peakCreationTime,
      },
    };
  }

  /**
   * 导出用户数据（用于云同步或分析）
   */
  exportUserData() {
    return {
      preference: this.preference,
      history: this.history,
      analytics: this.analytics,
      exportTime: new Date().toISOString(),
    };
  }

  /**
   * 导入用户数据
   * @param {object} data - 导入的数据
   */
  importUserData(data) {
    try {
      if (data.preference) {
        this.preference = data.preference;
        wx.setStorageSync(STORAGE_KEY_PREFERENCE, this.preference);
      }

      if (data.history) {
        this.history = data.history;
        wx.setStorageSync(STORAGE_KEY_HISTORY, this.history);
      }

      if (data.analytics) {
        this.analytics = data.analytics;
        wx.setStorageSync(STORAGE_KEY_ANALYTICS, this.analytics);
      }

      console.log("用户数据导入成功");
      return true;
    } catch (error) {
      console.error("用户数据导入失败:", error);
      return false;
    }
  }

  /**
   * 清空数据
   * @param {string} type - 数据类型（preference/history/analytics/all）
   */
  clearData(type = "all") {
    switch (type) {
      case "preference":
        this.preference = null;
        wx.removeStorageSync(STORAGE_KEY_PREFERENCE);
        break;
      case "history":
        this.history = [];
        wx.removeStorageSync(STORAGE_KEY_HISTORY);
        break;
      case "analytics":
        this.analytics = null;
        wx.removeStorageSync(STORAGE_KEY_ANALYTICS);
        break;
      case "all":
        this.clearData("preference");
        this.clearData("history");
        this.clearData("analytics");
        break;
    }
  }

  /**
   * 获取用户画像总结
   * @returns {string} - 用户画像描述
   */
  getUserPortrait() {
    const { themes, audience, preferredDuration } = this.preference;
    const topThemes = this.getTopThemes(3);
    const topStyles = this.getTopStyles(3);

    return `用户画像：
- 目标受众：${audience}
- 偏好时长：${preferredDuration}秒
- 常用主题：${topThemes.map((t) => t.theme).join("、")}
- 偏好风格：${topStyles.map((s) => s.style).join("、")}
- 创作次数：${this.analytics.totalCreations}次
- 成功率：${Math.round((this.analytics.successfulCreations / this.analytics.totalCreations) * 100)}%`;
  }
}

module.exports = UserPreferenceManager;
