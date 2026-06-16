// 云函数：hotspot-miyucaicai（优化版）
const cloud = require("wx-server-sdk");
const axios = require("axios");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 缓存键
const CACHE_KEY = "hotspot_cache_miyucaicai";
const CACHE_EXPIRY = 25 * 60 * 1000; // 25分钟（毫秒）- 确保定时器刷新前缓存有效

// 智能分类映射
function smartCategoryMapping(title, source) {
  const titleLower = title.toLowerCase();

  // 科技类关键词
  const techKeywords = [
    "ai",
    "人工智能",
    "芯片",
    "科技",
    "技术",
    "智能",
    "5g",
    "6g",
    "deepseek",
    "chatgpt",
    "model",
    "算法",
    "编程",
    "代码",
    "开发",
    "软件",
    "硬件",
    "电脑",
    "手机",
    "数码",
  ];

  // 美食类关键词
  const foodKeywords = [
    "美食",
    "吃",
    "餐厅",
    "咖啡",
    "奶茶",
    "火锅",
    "烧烤",
    "甜品",
    "蛋糕",
    "菜",
    "厨",
    "食",
    "味",
    "饮",
    "瑞幸",
    "库迪",
    "蜜雪",
  ];

  // 旅行类关键词
  const travelKeywords = [
    "旅行",
    "旅游",
    "景点",
    "户外",
    "露营",
    "登山",
    "徒步",
    "海边",
    "度假",
    "酒店",
    "民宿",
    "机票",
  ];

  // 娱乐类关键词
  const entertainmentKeywords = [
    "电影",
    "电视剧",
    "明星",
    "综艺",
    "娱乐",
    "演员",
    "导演",
    "音乐",
    "歌手",
    "演唱会",
    "粉丝",
    "爱豆",
    "偶像",
    "网红",
    "直播",
    "短剧",
  ];

  // 生活类关键词
  const lifeKeywords = [
    "生活",
    "家居",
    "健康",
    "养生",
    "运动",
    "健身",
    "教育",
    "学习",
    "工作",
    "职场",
    "就业",
    "考试",
    "大学生",
  ];

  // 检查关键词匹配
  if (techKeywords.some((kw) => titleLower.includes(kw))) {
    return "tech";
  }
  if (foodKeywords.some((kw) => titleLower.includes(kw))) {
    return "food";
  }
  if (travelKeywords.some((kw) => titleLower.includes(kw))) {
    return "travel";
  }
  if (entertainmentKeywords.some((kw) => titleLower.includes(kw))) {
    return "entertainment";
  }
  if (lifeKeywords.some((kw) => titleLower.includes(kw))) {
    return "life";
  }

  // 根据来源判断
  const sourceMap = {
    抖音: "entertainment",
    B站: "entertainment",
    百度: "life",
  };

  if (sourceMap[source]) {
    return sourceMap[source];
  }

  // 默认分类
  return "life";
}

// 提取关键词
function extractKeywords(title, description) {
  const text = `${title} ${description}`;
  const keywords = [];

  // 常见关键词列表
  const commonKeywords = [
    // 科技
    "AI",
    "人工智能",
    "DeepSeek",
    "ChatGPT",
    "芯片",
    "5G",
    "智能",
    "科技",
    "技术",
    // 美食
    "美食",
    "咖啡",
    "奶茶",
    "火锅",
    "烧烤",
    "瑞幸",
    "库迪",
    "蜜雪冰城",
    // 娱乐
    "电影",
    "电视剧",
    "明星",
    "综艺",
    "短剧",
    "网红",
    "直播",
    // 生活
    "生活",
    "健康",
    "运动",
    "教育",
    "工作",
    "职场",
    "就业",
    // 旅行
    "旅行",
    "旅游",
    "景点",
    "露营",
    "户外",
  ];

  // 提取匹配的关键词
  commonKeywords.forEach((kw) => {
    if (text.includes(kw) && !keywords.includes(kw)) {
      keywords.push(kw);
    }
  });

  // 如果没有关键词，尝试从标题提取
  if (keywords.length === 0) {
    const words = title
      .replace(/[，。！？、；：""''（）《》【】]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && w.length <= 6);
    keywords.push(...words.slice(0, 3));
  }

  return keywords.slice(0, 5);
}

// 增强热点数据
function enrichHotspotData(item, source, index) {
  const sourceNames = {
    weibo: "微博",
    zhihu: "知乎",
    baidu: "百度",
    douyin: "抖音",
    bilibili: "B站",
  };

  const sourceName = sourceNames[source] || source;
  const title = item.title || item.id || "未知热点";
  const description = item.extra && item.extra.hover ? item.extra.hover : title;

  // 提取关键词
  const keywords = extractKeywords(title, description);

  // 智能分类
  const category = smartCategoryMapping(title, sourceName);

  // 构建增强数据
  return {
    id: `${source}-${index}-${Date.now()}`,
    name: title,
    title: title,
    reason: `${sourceName}热点`,
    heat: item.extra && item.extra.info ? parseHeat(item.extra.info) : 0,
    hotness: item.extra && item.extra.info ? item.extra.info : "0",
    url: item.url || item.mobileUrl || "",
    source: sourceName,
    platform: source,
    index: index + 1,
    description: description,
    keywords: keywords,
    tags: [sourceName, ...keywords.slice(0, 2)],
    category: category,
    trend: "up",
    trendDirection: "up",
    suggestedAngles: generateSuggestedAngles(category, keywords),
    fetchTime: new Date().toISOString(),
    publishTime: new Date().toISOString(), // 假设发布时间为当前时间
  };
}

// 生成建议角度
function generateSuggestedAngles(category, keywords) {
  const angleMap = {
    tech: ["技术解读", "应用场景分析", "未来趋势预测", "对比评测", "使用教程"],
    entertainment: ["热点解读", "幕后故事", "观点评论", "搞笑改编", "粉丝视角"],
    life: ["实用技巧", "经验分享", "避坑指南", "产品推荐", "Vlog记录"],
    food: ["制作教程", "探店体验", "食材介绍", "创意改良", "美食测评"],
    travel: ["攻略分享", "景点介绍", "Vlog记录", "省钱技巧", "文化解读"],
  };

  const baseAngles = angleMap[category] || ["热点解读", "创意改编", "话题讨论"];

  // 随机选择3个角度
  const shuffled = baseAngles.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

exports.main = async (event, context) => {
  try {
    console.log("开始获取miyucaicai热点");
    console.log("触发类型:", event.triggerName ? "定时触发" : "手动调用");

    const { enableScoring = false } = event; // 是否启用智能评分

    // 定时触发时，强制刷新缓存（跳过缓存检查）
    const forceRefresh = event.triggerName === "autoRefreshHotspot";

    // 检查缓存（定时触发时跳过）
    const db = cloud.database();
    try {
      const cacheResult = await db
        .collection("system_cache")
        .doc(CACHE_KEY)
        .get();
      const cachedData = cacheResult.data;

      if (cachedData && cachedData.data && cachedData.expiry) {
        const now = Date.now();
        const expiry = cachedData.expiry;

        if (now < expiry && !forceRefresh) {
          // 缓存有效，直接返回
          console.log(
            `使用缓存数据，剩余时间：${Math.floor((expiry - now) / 1000)}秒`,
          );

          // 如果启用评分且缓存数据没有评分，则进行评分
          let data = cachedData.data;
          if (enableScoring && data.length > 0 && !data[0].fitScore) {
            console.log("缓存数据未评分，执行评分...");
            data = await scoreHotspots(data, context);
          }

          return {
            success: true,
            data: data,
            count: data.length,
            timestamp: cachedData.timestamp,
            fromCache: true,
            fast: true, // 标记为快速响应
          };
        } else {
          console.log(
            forceRefresh ? "定时触发：强制刷新" : "缓存已过期，重新获取",
          );
        }
      }
    } catch (error) {
      console.log("无缓存数据或读取失败:", error.message);
    }

    // 支持的数据源：微博、知乎、百度、抖音、B站等
    const primarySources = ["weibo", "zhihu"]; // 主要数据源（2个）
    const secondarySources = ["baidu", "douyin"]; // 次要数据源（2个）
    const allHotspots = [];

    // 设置请求超时时间（增加到8秒避免baidu超时导致整体超时）
    const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || "8000");

    // 先获取主要数据源
    const requests = primarySources.map(async (source) => {
      try {
        const response = await axios.get(
          `https://top.miyucaicai.cn/api/s?id=${source}`,
          {
            timeout: REQUEST_TIMEOUT,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          },
        );

        if (
          response.data &&
          response.data.status === "success" &&
          response.data.items
        ) {
          console.log(`${source} 获取到 ${response.data.items.length} 个热点`);
          return response.data.items.map((item, index) =>
            enrichHotspotData(item, source, index),
          );
        }
        return [];
      } catch (error) {
        console.warn(`获取 ${source} 热点失败:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(requests);
    results.forEach((items) => allHotspots.push(...items));

    // 按热度排序
    allHotspots.sort((a, b) => b.heat - a.heat);

    console.log(`成功获取 ${allHotspots.length} 个热点`);

    // 如果主要数据源获取到的热点不足20条，尝试获取次要数据源
    if (allHotspots.length < 20) {
      console.log(`热点数量不足(${allHotspots.length}条)，尝试获取次要数据源`);

      const secondaryRequests = secondarySources.map(async (source) => {
        try {
          const response = await axios.get(
            `https://top.miyucaicai.cn/api/s?id=${source}`,
            {
              timeout: 2000,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            },
          );

          if (
            response.data &&
            response.data.status === "success" &&
            response.data.items
          ) {
            console.log(
              `${source} 获取到 ${response.data.items.length} 个热点`,
            );
            return response.data.items.map((item, index) =>
              enrichHotspotData(item, source, index),
            );
          }
          return [];
        } catch (error) {
          console.warn(`${source} 获取失败:`, error.message);
          return [];
        }
      });

      const secondaryResults = await Promise.all(secondaryRequests);
      secondaryResults.forEach((result) => {
        allHotspots.push(...result);
      });

      console.log(`补充次要数据源后，共 ${allHotspots.length} 个热点`);
    }

    // 去重：按标题去重
    const uniqueHotspots = [];
    const seenTitles = new Set();
    allHotspots.forEach((hotspot) => {
      const title = hotspot.title || hotspot.name;
      if (!seenTitles.has(title)) {
        seenTitles.add(title);
        uniqueHotspots.push(hotspot);
      }
    });

    console.log(`去重后共 ${uniqueHotspots.length} 个热点`);

    let resultData = uniqueHotspots.slice(0, 50);

    // 如果启用评分，调用评分云函数
    if (enableScoring) {
      console.log("启用智能评分...");
      resultData = await scoreHotspots(resultData, context);
    }

    const result = {
      success: true,
      data: resultData,
      count: resultData.length,
      timestamp: new Date().toISOString(),
      fromCache: false,
      triggerType: forceRefresh ? "timer" : "manual",
    };

    // 保存到缓存（异步，不阻塞返回结果）
    try {
      const cacheExpiry = Date.now() + CACHE_EXPIRY;
      await db.collection("system_cache").doc(CACHE_KEY).set({
        data: resultData,
        expiry: cacheExpiry,
        timestamp: result.timestamp,
      });
      console.log(
        `热点数据已缓存，过期时间：${new Date(cacheExpiry).toLocaleString()}`,
      );
    } catch (cacheError) {
      console.warn("缓存失败:", cacheError.message);
    }

    return result;
  } catch (error) {
    console.error("获取热点失败:", error);

    // 即使失败，也尝试返回缓存数据
    const db = cloud.database();
    try {
      const cacheResult = await db
        .collection("system_cache")
        .doc(CACHE_KEY)
        .get();
      const cachedData = cacheResult.data;

      if (cachedData && cachedData.data && cachedData.data.length > 0) {
        console.log("获取失败，返回缓存数据作为降级方案");
        return {
          success: true,
          data: cachedData.data,
          count: cachedData.data.length,
          timestamp: cachedData.timestamp,
          fromCache: true,
          degraded: true,
        };
      }
    } catch (cacheError) {
      console.warn("读取缓存失败:", cacheError.message);
    }

    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// 调用评分云函数
async function scoreHotspots(hotspots, context) {
  try {
    const scorerResult = await cloud.callFunction({
      name: "hotspot-scorer",
      data: {
        hotspots: hotspots,
      },
    });

    if (scorerResult.result && scorerResult.result.success) {
      console.log("评分成功");
      return scorerResult.result.data;
    } else {
      console.warn("评分失败，返回原始数据");
      return hotspots;
    }
  } catch (error) {
    console.error("调用评分云函数失败:", error);
    return hotspots;
  }
}

// 解析热度值
function parseHeat(info) {
  if (!info || typeof info !== "string") return 0;

  // 匹配 "955 万热度" 或 "100 万" 等格式
  const match = info.match(/(\d+(?:\.\d+)?)\s*万/);
  if (match) {
    return Math.floor(parseFloat(match[1]) * 10000);
  }

  // 尝试直接解析数字
  const numMatch = info.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }

  return 0;
}
