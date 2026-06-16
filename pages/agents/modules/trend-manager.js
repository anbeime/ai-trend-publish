// trend-manager.js - 热点趋势管理模块（简化版）

class TrendManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.trends = [];
    this.hotTopics = [];
    this.CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
    this.CLOUD_FUNCTION_TIMEOUT = 18000; // 18秒超时
  }

  // 获取热点趋势
  async fetchTrends(options) {
    options = options || {};
    const enableSmartFilter = options.enableSmartFilter || false;
    const keywords = options.keywords || [];
    const minScore = options.minScore || 7;

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

        // 如果启用智能筛选，调用 topic-scorer 云函数
        if (enableSmartFilter && allHotspots.length > 0) {
          try {
            console.log(
              "[智能筛选]开始评分, 关键词:",
              keywords,
              "最低分数:",
              minScore,
            );
            const scorerResult = await wx.cloud.callFunction({
              name: "topic-scorer",
              data: {
                items: allHotspots,
                keywords: keywords,
                minScore: minScore,
                showAll: false, // 只返回推荐的选题
              },
            });

            if (scorerResult.result && scorerResult.result.success) {
              const recommendedTopics = scorerResult.result.recommended || [];
              console.log(
                "[智能筛选]评分完成, 推荐选题数:",
                recommendedTopics.length,
              );

              // 使用推荐的选题
              allHotspots = recommendedTopics;

              // 显示筛选统计信息
              const stats = scorerResult.result.statistics || {};
              console.log(
                "[智能筛选]统计 - 总数:",
                stats.total,
                "推荐:",
                stats.recommended,
                "拒绝:",
                stats.rejected,
              );
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

      // 计算热度分数
      const hotness = item.hotness || item.heat || 0;
      const score = Math.min(Math.floor(hotness / 10), 100);

      return {
        id: "trend_" + Date.now() + "_" + index,
        name: item.title || item.name || "",
        icon: categoryIcons[category] || "🔥",
        category: category,
        score: score,
        reason:
          item.reason || (sourceMap[item.source] || "热点") + " 热度" + score,
        tag: item.category || category,
        source: item.source || "",
        url: item.url || "",
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

    // 自动选择第一个热点到输入框
    if (
      filtered.length > 0 &&
      !this.page.data.selectedHotspot &&
      !this.page.data.inputValue
    ) {
      const firstTrend = filtered[0];
      console.log("自动选择第一个热点:", firstTrend);

      const selectedHotspot = {
        name: firstTrend.name,
        reason: firstTrend.reason,
        score: firstTrend.score,
        source: firstTrend.source || "未知",
        category: firstTrend.category || "全部",
      };

      const inputValue = firstTrend.reason || firstTrend.name || "";

      this.page.setData({
        selectedHotspot: selectedHotspot,
        inputValue: inputValue,
        hotspotCardVisible: true,
        hotspotCardCollapsed: false,
      });
    }
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
      selectedTrend.reason +
      "\n请结合这个热点话题来生成内容。"
    );
  }
}

module.exports = TrendManager;
