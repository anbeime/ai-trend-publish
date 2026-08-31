// 云函数：hotspot-miyucaicai（多数据源版）
const cloud = require("wx-server-sdk");
const axios = require("axios");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 缓存键
const CACHE_KEY = "hotspot_cache_miyucaicai";
const CACHE_EXPIRY = 25 * 60 * 1000; // 25分钟（毫秒）- 确保定时器刷新前缓存有效

// ========== 数据源配置（已验证可用）==========
// 数据源定义 - 只包含经过测试确认可用的数据源
const SOURCE_CONFIG = {
  // 📱 综合热点（大众兴趣，流量大）
  general: {
    name: "综合热点",
    sources: [
      { id: "weibo", name: "微博" },
      { id: "zhihu", name: "知乎" },
      { id: "baidu", name: "百度热搜" },
      { id: "toutiao", name: "今日头条" },
      { id: "tencent-hot", name: "腾讯新闻" },
    ],
  },
  // 🎬 影视娱乐
  entertainment: {
    name: "影视娱乐",
    sources: [
      { id: "douyin", name: "抖音" },
      { id: "bilibili-hot-search", name: "B站热搜" },
      { id: "tieba", name: "百度贴吧" },
    ],
  },
  // 💻 科技数码
  tech: {
    name: "科技数码",
    sources: [
      { id: "coolapk", name: "酷安" },
      { id: "ithome", name: "IT之家" },
      { id: "v2ex-share", name: "V2EX" },
      { id: "github-trending-today", name: "GitHub" },
    ],
  },
  // 💰 财经金融
  finance: {
    name: "财经金融",
    sources: [
      { id: "wallstreetcn-hot", name: "华尔街见闻" },
      { id: "cls-hot", name: "财联社" },
      { id: "xueqiu-hotstock", name: "雪球" },
    ],
  },
  // 🏀 体育社区
  sports: {
    name: "体育社区",
    sources: [{ id: "hupu", name: "虎扑" }],
  },
};

// 数据源ID到名称的映射
const SOURCE_ID_TO_NAME = {};
Object.values(SOURCE_CONFIG).forEach((category) => {
  category.sources.forEach((s) => {
    SOURCE_ID_TO_NAME[s.id] = s.name;
  });
});

// 单平台最大热点数量
const MAX_ITEMS_PER_SOURCE = 10;

// 默认数据源列表（按优先级排序）- 财经和综合热点优先
const DEFAULT_SOURCES = [
  // ===== 综合热点（最重要，流量大）=====
  "weibo",
  "zhihu",
  "baidu",
  "toutiao",
  "tencent-hot",
  // ===== 财经金融（用户重点需求）=====
  "wallstreetcn-hot",
  "cls-hot",
  "xueqiu-hotstock",
  // ===== 科技数码 =====
  "coolapk",
  "ithome",
  "v2ex-share",
  // ===== 影视娱乐 =====
  "douyin",
  "bilibili-hot-search",
  "tieba",
  // ===== 体育社区 =====
  "hupu",
];

// 智能分类映射
function smartCategoryMapping(title, sourceName) {
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
    "显卡",
    "cpu",
    "gpu",
    "苹果",
    "华为",
    "小米",
    "特斯拉",
    "新能源",
    "电动车",
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

  // 财经类关键词
  const financeKeywords = [
    "股票",
    "基金",
    "理财",
    "投资",
    "经济",
    "金融",
    "银行",
    "利率",
    "降息",
    "通胀",
    "美联储",
    "A股",
    "港股",
    "美股",
    "比特币",
    "加密货币",
    "黄金",
    "原油",
    "石油",
  ];

  // 游戏类关键词
  const gamingKeywords = [
    "游戏",
    "手游",
    "端游",
    "Steam",
    "原神",
    "王者",
    "LOL",
    "英雄联盟",
    "绝地求生",
    "我的世界",
    "塞尔达",
    "黑神话",
    "米哈游",
    "暴雪",
  ];

  // 体育类关键词
  const sportsKeywords = [
    "NBA",
    "足球",
    "篮球",
    "中超",
    "世界杯",
    "欧冠",
    "CBA",
    "网球",
    "乒乓球",
    "羽毛球",
    "游泳",
    "田径",
  ];

  // 检查关键词匹配
  if (techKeywords.some((kw) => titleLower.includes(kw))) return "tech";
  if (foodKeywords.some((kw) => titleLower.includes(kw))) return "food";
  if (travelKeywords.some((kw) => titleLower.includes(kw))) return "travel";
  if (entertainmentKeywords.some((kw) => titleLower.includes(kw)))
    return "entertainment";
  if (financeKeywords.some((kw) => titleLower.includes(kw))) return "finance";
  if (gamingKeywords.some((kw) => titleLower.includes(kw))) return "gaming";
  if (sportsKeywords.some((kw) => titleLower.includes(kw))) return "sports";

  // 根据来源判断
  const sourceMap = {
    微博: "general",
    知乎: "general",
    百度热搜: "general",
    今日头条: "general",
    腾讯新闻: "general",
    抖音: "entertainment",
    "B站热搜": "entertainment",
    百度贴吧: "entertainment",
    酷安: "tech",
    "IT之家": "tech",
    V2EX: "tech",
    GitHub: "tech",
    "华尔街见闻": "finance",
    财联社: "finance",
    雪球: "finance",
    虎扑: "sports",
  };

  if (sourceMap[sourceName]) return sourceMap[sourceName];

  // 默认分类
  return "general";
}

// 提取关键词
function extractKeywords(title, description) {
  const text = `${title} ${description || ""}`;
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
    // 财经
    "股票",
    "基金",
    "美联储",
    "降息",
    "黄金",
    // 体育
    "NBA",
    "足球",
    "篮球",
    // 游戏
    "游戏",
    "原神",
    "Steam",
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

// 解析热点发布时间
function parsePublishTime(item, sourceId) {
  // 尝试从不同字段解析时间
  const timeFields = ['publishTime', 'publish_time', 'createTime', 'create_time', 'time', 'date', 'pubDate'];
  
  for (const field of timeFields) {
    if (item[field]) {
      const time = new Date(item[field]);
      if (!isNaN(time.getTime())) {
        return time.toISOString();
      }
    }
  }
  
  // 某些数据源可能在 extra 中包含时间
  if (item.extra) {
    if (item.extra.publishTime) {
      const time = new Date(item.extra.publishTime);
      if (!isNaN(time.getTime())) {
        return time.toISOString();
      }
    }
  }
  
  // 如果没有时间信息，返回当前时间（标记为可能过时）
  return null;
}

// 增强热点数据
function enrichHotspotData(item, sourceId, index) {
  const sourceName = SOURCE_ID_TO_NAME[sourceId] || sourceId;
  const title = item.title || item.id || "未知热点";
  const description =
    item.extra && item.extra.hover ? item.extra.hover : title;

  // 提取关键词
  const keywords = extractKeywords(title, description);

  // 智能分类
  const category = smartCategoryMapping(title, sourceName);
  
  // 解析发布时间
  const publishTime = parsePublishTime(item, sourceId);
  const now = new Date();
  const fetchTime = now.toISOString();
  
  // 计算时效性（小时）
  let hoursOld = 0;
  let freshnessScore = 100;
  if (publishTime) {
    hoursOld = (now - new Date(publishTime)) / (1000 * 60 * 60);
    // 时效性评分：0-12小时满分，12-24小时降为70%，24-48小时降为40%，48小时以上降为20%
    if (hoursOld <= 12) {
      freshnessScore = 100;
    } else if (hoursOld <= 24) {
      freshnessScore = 70;
    } else if (hoursOld <= 48) {
      freshnessScore = 40;
    } else {
      freshnessScore = 20;
    }
  }

  // 构建增强数据
  return {
    id: `${sourceId}-${index}-${Date.now()}`,
    name: title,
    title: title,
    reason: `${sourceName}热点`,
    heat: item.extra && item.extra.info ? parseHeat(item.extra.info) : 0,
    hotness: item.extra && item.extra.info ? item.extra.info : "0",
    url: item.url || item.mobileUrl || "",
    source: sourceName,
    platform: sourceId,
    sourceId: sourceId,
    index: index + 1,
    description: description,
    keywords: keywords,
    tags: [sourceName, ...keywords.slice(0, 2)],
    category: category,
    trend: "up",
    trendDirection: "up",
    suggestedAngles: generateSuggestedAngles(category, keywords),
    fetchTime: fetchTime,
    publishTime: publishTime || fetchTime,
    hoursOld: Math.round(hoursOld),
    freshnessScore: freshnessScore,
  };
}

// 生成建议角度
function generateSuggestedAngles(category, keywords) {
  const angleMap = {
    tech: ["技术解读", "应用场景分析", "未来趋势预测", "对比评测", "使用教程"],
    entertainment: ["热点解读", "幕后故事", "观点评论", "搞笑改编", "粉丝视角"],
    general: ["热点解读", "深度分析", "多方观点", "趋势预测"],
    life: ["实用技巧", "经验分享", "避坑指南", "产品推荐", "Vlog记录"],
    food: ["制作教程", "探店体验", "食材介绍", "创意改良", "美食测评"],
    travel: ["攻略分享", "景点介绍", "Vlog记录", "省钱技巧", "文化解读"],
    finance: ["行情分析", "投资建议", "政策解读", "趋势预测", "实操指南"],
    gaming: ["游戏攻略", "版本分析", "赛事解读", "玩家体验", "新手教程"],
    sports: ["赛事分析", "球员点评", "战术解读", "历史回顾", "粉丝视角"],
  };

  const baseAngles = angleMap[category] || ["热点解读", "创意改编", "话题讨论"];

  // 随机选择3个角度
  const shuffled = baseAngles.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

// 获取单个数据源的热点（带重试和单平台限制）
async function fetchSourceHotspots(sourceId, timeout = 8000, maxRetries = 1) {
  const sourceName = SOURCE_ID_TO_NAME[sourceId] || sourceId;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(
        `https://top.miyucaicai.cn/api/s?id=${sourceId}`,
        {
          timeout: timeout,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        }
      );

      if (
        response.data &&
        (response.data.status === "success" ||
          response.data.status === "cache") &&
        response.data.items &&
        response.data.items.length > 0
      ) {
        // 单平台限制最多10条
        const items = response.data.items.slice(0, MAX_ITEMS_PER_SOURCE);
        console.log(
          `[OK] ${sourceName.padEnd(12)} 获取 ${items}/${response.data.items.length} 条 (限制${MAX_ITEMS_PER_SOURCE})`
        );
        return {
          success: true,
          sourceId,
          sourceName,
          count: items.length,
          data: items.map((item, index) =>
            enrichHotspotData(item, sourceId, index)
          ),
        };
      }
      console.log(`[EMPTY] ${sourceName.padEnd(12)} 返回空数据`);
      return { success: false, sourceId, sourceName, count: 0, data: [], reason: 'empty' };
    } catch (error) {
      const isLastAttempt = attempt >= maxRetries;
      if (isLastAttempt) {
        console.warn(`[FAIL] ${sourceName.padEnd(12)} ${error.message}`);
        return { success: false, sourceId, sourceName, count: 0, data: [], reason: error.message };
      }
      console.warn(`[RETRY] ${sourceName.padEnd(12)} 第${attempt + 1}次失败: ${error.message}, 重试中...`);
    }
  }
}

// 并发获取多个数据源（返回详细状态）
async function fetchMultipleSources(sourceIds, timeout = 8000) {
  const requests = sourceIds.map((id) => fetchSourceHotspots(id, timeout));
  const results = await Promise.allSettled(requests);

  const allHotspots = [];
  const sourceStatus = {}; // 记录每个源的状态

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value) {
      const sourceResult = result.value;
      if (Array.isArray(sourceResult)) {
        // 兼容旧格式
        allHotspots.push(...sourceResult);
      } else if (sourceResult && sourceResult.data) {
        allHotspots.push(...sourceResult.data);
        sourceStatus[sourceResult.sourceName || sourceResult.sourceId] = {
          success: sourceResult.success,
          count: sourceResult.count,
          reason: sourceResult.reason || 'ok',
        };
      }
    }
  });

  return { hotspots: allHotspots, sourceStatus };
}

exports.main = async (event, context) => {
  try {
    console.log("开始获取miyucaicai热点（多数据源版）");
    console.log("触发类型:", event.triggerName ? "定时触发" : "手动调用");

    const {
      enableScoring = false,
      categories = [], // 指定要获取的分类，空数组表示获取全部
      sources = [], // 指定要获取的数据源ID，优先级高于categories
      limit = 100, // 返回数量限制
    } = event;

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
            `使用缓存数据，剩余时间：${Math.floor((expiry - now) / 1000)}秒`
          );

          let data = cachedData.data;

          // 如果启用评分且缓存数据没有评分，则进行评分
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
            fast: true,
          };
        } else {
          console.log(
            forceRefresh ? "定时触发：强制刷新" : "缓存已过期，重新获取"
          );
        }
      }
    } catch (error) {
      console.log("无缓存数据或读取失败:", error.message);
    }

    // ========== 确定要获取的数据源 ==========
    let targetSourceIds = [];

    if (sources.length > 0) {
      // 如果指定了数据源ID，直接使用
      targetSourceIds = sources;
      console.log(`使用指定的数据源: ${sources.join(", ")}`);
    } else if (categories.length > 0) {
      // 如果指定了分类，获取该分类下的所有数据源
      categories.forEach((cat) => {
        if (SOURCE_CONFIG[cat]) {
          targetSourceIds.push(...SOURCE_CONFIG[cat].sources.map((s) => s.id));
        }
      });
      console.log(`获取分类 ${categories.join(", ")} 下的数据源`);
    } else {
      // 默认使用全部数据源
      targetSourceIds = DEFAULT_SOURCES;
      console.log("使用默认数据源配置");
    }

    // 去重数据源ID
    targetSourceIds = [...new Set(targetSourceIds)];
    console.log(`共需获取 ${targetSourceIds.length} 个数据源: ${targetSourceIds.join(", ")}`);

    // ========== 分批获取数据 ==========
    const REQUEST_TIMEOUT = 8000; // 增加超时到8秒
    const BATCH_SIZE = 5; // 每批并发数

    let allHotspots = [];
    let allSourceStatus = {}; // 汇总所有源的获取状态

    // 分批请求，避免并发过高
    for (let i = 0; i < targetSourceIds.length; i += BATCH_SIZE) {
      const batch = targetSourceIds.slice(i, i + BATCH_SIZE);
      console.log(
        `正在获取第 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(targetSourceIds.length / BATCH_SIZE)} 批: [${batch.join(", ")}]`
      );

      const batchResult = await fetchMultipleSources(batch, REQUEST_TIMEOUT);
      allHotspots.push(...batchResult.hotspots);
      Object.assign(allSourceStatus, batchResult.sourceStatus);
    }

    console.log(`原始获取 ${allHotspots.length} 个热点`);

    // 按时效性+热度综合排序（时效性权重更高）
    allHotspots.sort((a, b) => {
      // 首先按时效性排序
      const freshnessDiff = (b.freshnessScore || 100) - (a.freshnessScore || 100);
      if (Math.abs(freshnessDiff) > 20) {
        return freshnessDiff;
      }
      // 时效性接近时，按热度排序
      return b.heat - a.heat;
    });

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

    // 过滤掉过时数据（超过72小时的热点标记为旧闻）
    const MAX_HOURS_OLD = 72;
    let resultData = uniqueHotspots.filter(h => {
      // 如果没有时间信息，保留（可能是实时热点）
      if (!h.hoursOld) return true;
      // 超过72小时的过滤掉
      return h.hoursOld < MAX_HOURS_OLD;
    });
    
    // 如果过滤后数据太少，放宽限制
    if (resultData.length < limit / 2) {
      console.log('时效性过滤后数据不足，保留更多数据');
      resultData = uniqueHotspots;
    }
    
    resultData = resultData.slice(0, limit);
    
    // 统计时效性分布
    const freshnessStats = {
      fresh: resultData.filter(h => (h.freshnessScore || 100) >= 70).length,
      normal: resultData.filter(h => (h.freshnessScore || 100) >= 40 && (h.freshnessScore || 100) < 70).length,
      old: resultData.filter(h => (h.freshnessScore || 100) < 40).length,
    };
    console.log('热点时效性分布:', freshnessStats);

    // 如果启用评分，调用评分云函数
    if (enableScoring) {
      console.log("启用智能评分...");
      resultData = await scoreHotspots(resultData, context);
    }

    // 统计各数据源数量
    const sourceStats = {};
    resultData.forEach((h) => {
      sourceStats[h.source] = (sourceStats[h.source] || 0) + 1;
    });
    console.log("各数据源热点数量:", sourceStats);
    console.log("各数据源获取状态:", allSourceStatus);

    const result = {
      success: true,
      data: resultData,
      count: resultData.length,
      timestamp: new Date().toISOString(),
      fromCache: false,
      triggerType: forceRefresh ? "timer" : "manual",
      sourceStats: sourceStats,
      sourceFetchStatus: allSourceStatus, // 新增：每个源的获取状态详情
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
        `热点数据已缓存，过期时间：${new Date(cacheExpiry).toLocaleString()}`
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
