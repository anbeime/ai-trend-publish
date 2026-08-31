const cloud = require("wx-server-sdk");
cloud.init();

const db = cloud.database();

/**
 * 链接解析云函数
 * 支持抖音、快手、B站、微信公众号、知乎链接解析
 */
exports.main = async (event, context) => {
  console.log("链接解析云函数被调用:", event);

  const { action, url, linkType } = event;

  try {
    // 验证参数
    if (!action || !url) {
      return {
        success: false,
        message: "缺少必要参数：action 和 url",
      };
    }

    console.log(`开始解析链接：action=${action}, url=${url}`);

    switch (action) {
      case "parse":
        const parseResult = await parseUrl(url);
        return {
          success: true,
          ...parseResult,
        };

      default:
        return {
          success: false,
          message: `未知action: ${action}`,
        };
    }
  } catch (error) {
    console.error("链接解析失败:", error);
    return {
      success: false,
      error: error.message,
      message: "链接解析失败",
    };
  }
};

/**
 * 解析链接
 */
async function parseUrl(url) {
  console.log("解析URL:", url);

  // 识别链接类型
  const linkInfo = identifyLinkType(url);
  console.log("识别的链接类型:", linkInfo.type);

  try {
    let result;

    switch (linkInfo.type) {
      case "douyin":
        result = await parseDouyinUrl(url);
        break;
      case "kuaishou":
        result = await parseKuaishouUrl(url);
        break;
      case "bilibili":
        result = await parseBilibiliUrl(url);
        break;
      case "weixin":
        result = await parseWeixinUrl(url);
        break;
      case "zhihu":
        result = await parseZhihuUrl(url);
        break;
      default:
        throw new Error(`不支持的链接类型: ${linkInfo.type}`);
    }

    console.log("解析结果:", result);

    // 返回标准格式
    return {
      success: true,
      type: linkInfo.type,
      title: result.title,
      content: result.content,
      description: result.description || "",
      keywords: result.keywords || [],
      source: result.source,
      originalUrl: url,
      imageUrl: result.imageUrl || "",
      author: result.author || "",
      publishTime: result.publishTime || "",
    };
  } catch (error) {
    console.error("解析失败:", error);
    throw error;
  }
}

/**
 * 识别链接类型
 */
function identifyLinkType(url) {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("douyin.com") || lowerUrl.includes("iesdouyin.com")) {
    return { type: "douyin", name: "抖音" };
  } else if (
    lowerUrl.includes("kuaishou.com") ||
    lowerUrl.includes("chenzhongtech.com")
  ) {
    return { type: "kuaishou", name: "快手" };
  } else if (lowerUrl.includes("bilibili.com")) {
    return { type: "bilibili", name: "B站" };
  } else if (
    lowerUrl.includes("mp.weixin.qq.com") ||
    lowerUrl.includes("weixin.qq.com")
  ) {
    return { type: "weixin", name: "微信" };
  } else if (lowerUrl.includes("zhihu.com")) {
    return { type: "zhihu", name: "知乎" };
  } else {
    return { type: "unknown", name: "未知" };
  }
}

/**
 * 解析抖音链接（模拟）
 */
async function parseDouyinUrl(url) {
  console.log("解析抖音链接");

  // 尝试提取分享码
  const shareCodeMatch = url.match(/\/(\d+)/);

  if (shareCode) {
    return {
      title: `抖音视频 ${shareCode[1]}`,
      content: "抖音短视频内容",
      description: "来自抖音的热点短视频",
      keywords: ["抖音", "短视频", "热门"],
      source: "douyin",
      imageUrl: "",
      author: "",
      publishTime: new Date().toISOString(),
    };
  }

  throw new Error("无法解析抖音链接");
}

/**
 * 解析快手链接（模拟）
 */
async function parseKuaishouUrl(url) {
  console.log("解析快手链接");

  const shareCodeMatch = url.match(/\/(\d+)/);

  if (shareCode) {
    return {
      title: `快手视频 ${shareCode[1]}`,
      content: "快手短视频内容",
      description: "来自快手的热点短视频",
      keywords: ["快手", "短视频"],
      source: "kuaishou",
      imageUrl: "",
      author: "",
      publishTime: new Date().toISOString(),
    };
  }

  throw new Error("无法解析快手链接");
}

/**
 * 解析B站链接（模拟）
 */
async function parseBilibiliUrl(url) {
  console.log("解析B站链接");

  // 匹配BV号
  const bvMatch = url.match(/(BV[a-zA-Z0-9]{10})/);

  if (bvMatch) {
    return {
      title: `B站视频 ${bvMatch[1]}`,
      content: "B站视频内容",
      description: "来自B站的视频内容",
      keywords: ["B站", "视频", "UP主"],
      source: "bilibili",
      imageUrl: "",
      author: "",
      publishTime: new Date().toISOString(),
    };
  }

  throw new Error("无法解析B站链接");
}

/**
 * 解析微信文章链接（模拟）
 */
async function parseWeixinUrl(url) {
  console.log("解析微信文章链接");

  // 尝试提取文章信息
  return {
    title: "微信文章",
    content: "微信公众号文章内容",
    description: "来自微信公众号的文章",
    keywords: ["微信", "公众号", "文章"],
    source: "weixin",
    imageUrl: "",
    author: "",
    publishTime: new Date().toISOString(),
  };
}

/**
 * 解析知乎链接（模拟）
 */
async function parseZhihuUrl(url) {
  console.log("解析知乎链接");

  const questionMatch = url.match(/question\/(\d+)/);

  if (questionMatch) {
    return {
      title: `知乎问题 ${questionMatch[1]}`,
      content: "知乎问答内容",
      description: "来自知乎的高质量问答",
      keywords: ["知乎", "问答", "知识"],
      source: "zhihu",
      imageUrl: "",
      author: "",
      publishTime: new Date().toISOString(),
    };
  }

  throw new Error("无法解析知乎链接");
}

/**
 * 内容改写功能
 */
exports.rewrite = async (event, context) => {
  console.log("内容改写云函数被调用:", event);

  const { originalContent, targetAudience, style, platform } = event;

  try {
    if (!originalContent) {
      return {
        success: false,
        message: "缺少原始内容",
      };
    }

    console.log("开始改写内容");

    // 调用AI进行内容改写
    const aiRes = await cloud.callFunction({
      name: "agentAI",
      data: {
        agentType: "textRewriter",
        userMessage: `请将以下内容改写为${style}风格的短视频文案：\n\n${originalContent}`,
        conversationHistory: [],
      },
    });

    if (!aiRes.result || !aiRes.result.success) {
      throw new Error("AI改写失败");
    }

    const rewrittenContent = aiRes.result.reply;

    console.log("改写完成");

    return {
      success: true,
      originalContent,
      rewrittenContent,
      style,
      targetAudience,
      platform,
    };
  } catch (error) {
    console.error("内容改写失败:", error);
    return {
      success: false,
      error: error.message,
      message: "内容改写失败",
    };
  }
};
