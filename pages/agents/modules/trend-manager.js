// trend-manager.js - 热点趋势管理模块（增强版）
// 支持 topic-scorer v2.0 增强功能：多维度评分、趋势分析、推荐解释

class TrendManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.trends = [];
    this.hotTopics = [];
    this.CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
    this.CLOUD_FUNCTION_TIMEOUT = 18000; // 18秒超时
    
    // 智能筛选配置
    this.smartFilterConfig = {
      enabled: false,
      keywords: [],
      minScore: 7,
      targetPlatform: 'general',  // general, douyin, xiaohongshu, wechat, bilibili
      sortBy: 'score',            // score, timeliness, heat, controversy, value
      maxResults: 0               // 0表示不限制
    };
  }

  // 获取热点趋势
  async fetchTrends(options) {
    options = options || {};
    const enableSmartFilter = options.enableSmartFilter || this.smartFilterConfig.enabled;
    const keywords = options.keywords || this.smartFilterConfig.keywords || [];
    const minScore = options.minScore || this.smartFilterConfig.minScore || 7;
    const targetPlatform = options.targetPlatform || this.smartFilterConfig.targetPlatform || 'general';
    const sortBy = options.sortBy || this.smartFilterConfig.sortBy || 'score';

    try {
      // 检查云开发是否初始化
      const app = getApp();
      if (!app.globalData.cloudInitialized) {
        console.log("云开发未初始化，无法获取热点");
        this.page.setData({
          availableTrends: [],
          hotspotDataSource: "mock",
          fetchingTrends: false,
        });
        this.updateFilteredTrends();
        return [];
      }

      this.page.setData({ fetchingTrends: true });

      // 调用热点云函数
      const cloudCall = wx.cloud.callFunction({
        name: "hotspot-miyucaicai",
        data: {},
      });

      // 18秒超时
      const timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error("请求超时"));
        }, 18000);
      });

      const res = await Promise.race([cloudCall, timeoutPromise]);

      if (res.result && res.result.success) {
        let allHotspots = res.result.data || [];
        const fromCache = res.result.fromCache || false;
        console.log(
          "获取到 " +
            allHotspots.length +
            " 条热点, 来源: " +
            (fromCache ? "缓存" : "实时"),
        );

        // 如果启用智能筛选，调用 topic-scorer 云函数（支持v2.0增强功能）
        if (enableSmartFilter && allHotspots.length > 0) {
          try {
            console.log(
              "[智能筛选]开始评分(v2), 关键词:",
              keywords,
              "最低分数:",
              minScore,
              "目标平台:",
              targetPlatform,
              "排序方式:",
              sortBy,
            );
            const scorerResult = await wx.cloud.callFunction({
              name: "topic-scorer",
              data: {
                items: allHotspots,
                keywords: keywords,
                minScore: minScore,
                showAll: false,
                targetPlatform: targetPlatform,
                sortBy: sortBy,
                maxResults: this.smartFilterConfig.maxResults || 0,
              },
            });

            if (scorerResult.result && scorerResult.result.success) {
              const recommendedTopics = scorerResult.result.recommended || [];
              const version = scorerResult.result.version || '1.0';
              console.log(
                "[智能筛选]评分完成(v" + version + "), 推荐选题数:",
                recommendedTopics.length,
              );

              // 使用推荐的选题
              allHotspots = recommendedTopics;

              // 显示筛选统计信息（v2.0 增强统计）
              const stats = scorerResult.result.statistics || {};
              console.log(
                "[智能筛选]统计 - 总数:",
                stats.total,
                "推荐:",
                stats.recommended,
                "拒绝:",
                stats.rejected,
                "平均分:",
                stats.avgScore,
              );

              // 保存评分结果到页面数据（用于展示推荐理由）
              if (this.page) {
                this.page.setData({
                  scorerStatistics: stats,
                  scorerVersion: version,
                  scoringGuide: scorerResult.result.scoringGuide || null,
                });
              }
            }
          } catch (scorerError) {
            console.error("[智能筛选]评分失败，使用原始热点:", scorerError);
            // 评分失败不影响，继续使用原始热点
          }
        }

        // 转换为agents页面需要的格式
        const trends = this.mapHotspotsToTrends(allHotspots);

        // 保存到本地缓存
        if (!fromCache) {
          wx.setStorageSync("trend_data", {
            trends: trends,
            timestamp: Date.now(),
          });
        }

        this.page.setData({
          availableTrends: trends,
          hotspotDataSource: fromCache ? "cache" : "live",
          lastHotspotFetch: new Date(),
          fetchingTrends: false,
        });

        this.updateFilteredTrends();
        return trends;
      } else {
        throw new Error((res.result && res.result.error) || "获取热点失败");
      }
    } catch (error) {
      console.error("获取热点趋势失败:", error);

      // 尝试从本地缓存加载
      const cached = wx.getStorageSync("trend_data");
      if (cached && cached.trends && cached.trends.length > 0) {
        console.log("使用本地缓存:", cached.trends.length, "条");
        this.page.setData({
          availableTrends: cached.trends,
          hotspotDataSource: "cache",
          lastHotspotFetch: new Date(cached.timestamp),
          fetchingTrends: false,
        });
        this.updateFilteredTrends();
        return cached.trends;
      }

      // 没有缓存，返回空数组
      this.page.setData({
        availableTrends: [],
        hotspotDataSource: "mock",
        fetchingTrends: false,
      });
      this.updateFilteredTrends();
      return [];
    }
  }

  // 将热点数据映射为趋势格式
  mapHotspotsToTrends(hotspots) {
    const categoryIcons = {
      科技: "🤖",
      生活: "🏠",
      娱乐: "🎬",
      美食: "🍜",
      旅行: "✈️",
      财经: "💰",
      教育: "📚",
      全部: "🔥",
    };

    const sourceMap = {
      v2ex: "V2EX",
      weibo: "微博",
      zhihu: "知乎",
      baidu: "百度",
      douyin: "抖音",
      bilibili: "B站",
    };

    const self = this;
    return hotspots.map(function (item, index) {
      // 自动判断分类
      let category = item.category || "全部";
      if (category === "全部") {
        const title = (item.title || item.name || "").toLowerCase();
        const source = item.source || "";

        // 根据标题关键词判断分类
        if (
          title.indexOf("科技") > -1 ||
          title.indexOf("ai") > -1 ||
          title.indexOf("芯片") > -1 ||
          title.indexOf("智能") > -1 ||
          source.indexOf("科技") > -1
        ) {
          category = "科技";
        } else if (
          title.indexOf("美食") > -1 ||
          title.indexOf("吃") > -1 ||
          title.indexOf("餐厅") > -1 ||
          title.indexOf("咖啡") > -1
        ) {
          category = "美食";
        } else if (
          title.indexOf("旅行") > -1 ||
          title.indexOf("旅游") > -1 ||
          title.indexOf("景点") > -1 ||
          title.indexOf("户外") > -1
        ) {
          category = "旅行";
        } else if (
          title.indexOf("电影") > -1 ||
          title.indexOf("电视剧") > -1 ||
          title.indexOf("明星") > -1 ||
          title.indexOf("综艺") > -1 ||
          source.indexOf("娱乐") > -1 ||
          source.indexOf("抖音") > -1
        ) {
          category = "娱乐";
        } else if (
          title.indexOf("生活") > -1 ||
          title.indexOf("家居") > -1 ||
          title.indexOf("健康") > -1
        ) {
          category = "生活";
        } else if (
          title.indexOf("股票") > -1 ||
          title.indexOf("基金") > -1 ||
          title.indexOf("财经") > -1 ||
          title.indexOf("投资") > -1
        ) {
          category = "财经";
        } else if (
          title.indexOf("教育") > -1 ||
          title.indexOf("学校") > -1 ||
          title.indexOf("考试") > -1 ||
          title.indexOf("学习") > -1
        ) {
          category = "教育";
        }
      }

      // 计算热度分数 - 支持多种热度字段格式
      let hotness = 0;
      if (item.hotness) {
        // 处理hotness字段（可能是数字或字符串）
        hotness = parseInt(item.hotness, 10) || 0;
      } else if (item.heat) {
        // 处理heat字段（可能是数字或字符串）
        hotness = parseInt(item.heat, 10) || 0;
      } else if (item.score) {
        // 直接使用已有的score字段
        hotness = parseInt(item.score, 10) || 0;
      } else if (item.heat || item.hotness === 0 || item.heat === 0) {
        // 明确的0值
        hotness = 0;
      } else {
        // 默认热度
        hotness = 50; // 默认中等热度
      }

      // 限制热度分数在0-100之间
      const score = Math.min(Math.max(Math.floor(hotness), 0), 100);

      // 构建推荐理由（优先使用topic-scorer v2.0返回的推荐理由）
      let recommendReason = item.reason || "";
      if (item.recommendation && item.recommendation.summary) {
        recommendReason = item.recommendation.summary;
      } else if (item.totalScore && item.scores) {
        // 如果有评分数据但没有推荐理由，生成简单的
        recommendReason = "综合评分: " + item.totalScore + "分";
        if (item.trendAnalysis && item.trendAnalysis.direction === 'rising') {
          recommendReason += " 📈热度上升中";
        }
      }
      if (!recommendReason) {
        recommendReason = (sourceMap[item.source] || "热点") + " 热度" + score;
      }

      return {
        id: "trend_" + Date.now() + "_" + index,
        name: item.title || item.name || "",
        icon: categoryIcons[category] || "🔥",
        category: category,
        score: score,
        // 使用topic-scorer的评分（如果有的话）
        totalScore: item.totalScore || score,
        reason: recommendReason,
        recommendReason: recommendReason,  // 单独字段供展示使用
        tag: item.category || category,
        source: item.source || "",
        url: item.url || item.link || "",
        // topic-scorer v2.0 增强字段
        scores: item.scores || null,           // 各维度评分
        recommendation: item.recommendation || null,  // 推荐理由详情
        trendAnalysis: item.trendAnalysis || null,    // 趋势分析
        recommendLevel: item.recommendLevel || null,   // 推荐等级
        rank: item.rank || 0,
      };
    });
  }

  // 更新筛选后的趋势
  updateFilteredTrends() {
    const selectedTrendCategory = this.page.data.selectedTrendCategory;
    const availableTrends = this.page.data.availableTrends;
    let filtered = availableTrends;

    if (selectedTrendCategory !== "全部") {
      filtered = availableTrends.filter(function (trend) {
        return trend.category === selectedTrendCategory;
      });
    }

    this.page.setData({
      filteredTrends: filtered,
    });

    // 不再自动选择第一个热点，等待用户手动选择
    // 这样可以避免误操作和用户困扰
  }

  // 刷新趋势
  async refreshTrends() {
    wx.showLoading({ title: "刷新热点..." });

    try {
      // 检查缓存是否存在且未过期（30分钟）
      const cached = wx.getStorageSync("trend_data");
      const now = Date.now();
      const isCacheValid =
        cached &&
        cached.trends &&
        cached.trends.length > 0 &&
        cached.timestamp &&
        now - cached.timestamp < this.CACHE_DURATION;

      // 如果缓存有效，先使用缓存，同时后台更新
      if (isCacheValid) {
        console.log(
          "使用缓存数据，缓存剩余时间：",
          Math.floor(
            (this.CACHE_DURATION - (now - cached.timestamp)) / 1000,
            "秒",
          ),
        );

        this.page.setData({
          availableTrends: cached.trends,
          hotspotDataSource: "cache",
          lastHotspotFetch: new Date(cached.timestamp),
          fetchingTrends: false,
        });
        this.updateFilteredTrends();

        wx.hideLoading();
        wx.showToast({
          title: "热点已更新（缓存）",
          icon: "success",
        });

        // 后台静默更新（不阻塞）
        this.fetchTrends().catch((err) => {
          console.warn("后台更新热点失败:", err);
        });

        return cached.trends;
      } else {
        // 缓存不存在或已过期，清除缓存并重新获取
        if (cached) {
          wx.removeStorageSync("trend_data");
          console.log("缓存已过期，清除并重新获取");
        }

        const newTrends = await this.fetchTrends();
        wx.hideLoading();
        wx.showToast({
          title: "热点已更新",
          icon: "success",
        });
        return newTrends;
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: "刷新失败",
        icon: "none",
      });
      return [];
    }
  }

  // 获取当前趋势列表
  getCurrentTrends() {
    return this.page.data.availableTrends || [];
  }

  // 搜索热点
  searchHotspots(keyword) {
    const trends = this.getCurrentTrends();
    const keywordLower = keyword.toLowerCase();

    return trends.filter(function (trend) {
      return (
        trend.name.toLowerCase().indexOf(keywordLower) > -1 ||
        trend.reason.toLowerCase().indexOf(keywordLower) > -1 ||
        trend.source.toLowerCase().indexOf(keywordLower) > -1
      );
    });
  }

  // 获取当前趋势上下文
  getTrendContext() {
    const selectedTrend = this.page.data.selectedTrend;
    if (!selectedTrend) {
      return "";
    }

    return (
      "\n\n【当前热点话题】\n话题：" +
      selectedTrend.name +
      "\n类型：" +
      selectedTrend.category +
      "\n推荐理由：" +
      (selectedTrend.recommendReason || selectedTrend.reason || "") +
      "\n请结合这个热点话题来生成内容。"
    );
  }

  // ==================== 智能筛选配置方法 ====================

  /**
   * 配置智能筛选参数
   * @param {Object} config - 筛选配置
   */
  configureSmartFilter(config) {
    if (!config) return;
    
    if (typeof config.enabled === 'boolean') {
      this.smartFilterConfig.enabled = config.enabled;
    }
    if (Array.isArray(config.keywords)) {
      this.smartFilterConfig.keywords = config.keywords;
    }
    if (typeof config.minScore === 'number') {
      this.smartFilterConfig.minScore = config.minScore;
    }
    if (config.targetPlatform) {
      this.smartFilterConfig.targetPlatform = config.targetPlatform;
    }
    if (config.sortBy) {
      this.smartFilterConfig.sortBy = config.sortBy;
    }
    if (typeof config.maxResults === 'number') {
      this.smartFilterConfig.maxResults = config.maxResults;
    }

    console.log('[TrendManager] 智能筛选配置已更新:', this.smartFilterConfig);
  }

  /**
   * 获取当前智能筛选配置
   */
  getSmartFilterConfig() {
    return { ...this.smartFilterConfig };
  }

  /**
   * 启用/禁用智能筛选
   */
  setSmartFilterEnabled(enabled) {
    this.smartFilterConfig.enabled = !!enabled;
    console.log('[TrendManager] 智能筛选:', enabled ? '已启用' : '已禁用');
  }

  /**
   * 设置目标平台（影响评分权重）
   * @param {string} platform - general | douyin | xiaohongshu | wechat | bilibili
   */
  setTargetPlatform(platform) {
    const validPlatforms = ['general', 'douyin', 'xiaohongshu', 'wechat', 'bilibili'];
    if (validPlatforms.includes(platform)) {
      this.smartFilterConfig.targetPlatform = platform;
      console.log('[TrendManager] 目标平台设置为:', platform);
    } else {
      console.warn('[TrendManager] 无效平台:', platform, '，使用 general');
      this.smartFilterConfig.targetPlatform = 'general';
    }
  }
}

module.exports = TrendManager;
