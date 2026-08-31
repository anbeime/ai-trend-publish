// 社交媒体代理云函数
// 功能: 转发小程序请求到外部API服务
// 解决: 手机端无法直接请求 HTTP/IP 域名的问题
// 超时配置: config.json 中设置 timeout: 60（秒）

const cloud = require("wx-server-sdk");
const axios = require("axios");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 配置
 */
const config = {
  // 后端API服务地址（使用环境变量或默认值）
  apiBaseUrl: process.env.WECHAT_DRAFT_API_URL || "http://39.108.254.228:8003",

  // 8002端口API服务地址
  apiBaseUrlV2: process.env.WECHAT_DRAFT_API_URL_V2 || "http://39.108.254.228:8002",

  // API超时时间（毫秒）
  // 云函数超时60秒，axios超时设为50秒，留10秒余量给云函数返回结果
  timeout: parseInt(process.env.API_TIMEOUT) || 50000,

  // 是否启用调试模式
  debug: process.env.DEBUG === "true",
};

/**
 * 记录调试信息
 */
function debugLog(...args) {
  if (config.debug) {
    console.log("[social-media-proxy]", ...args);
  }
}

/**
 * 发布文章到微信公众号草稿箱（8003端口 - 单账号）
 */
async function publishToWechat(data) {
  const url = `${config.apiBaseUrl}/api/wechat/draft`;

  try {
    console.log("[publishToWechat] 开始发布, URL:", url);

    const response = await axios.post(
      url,
      {
        appId: data.appId,
        appSecret: data.appSecret,
        articles: data.articles || [
          {
            title: data.title,
            author: data.author || "",
            digest: data.digest || "",
            content: data.content,
            contentSourceUrl: data.contentSourceUrl || "",
            thumbMediaId: data.thumbMediaId || "",
            showCoverPic: !!data.thumbMediaId,
            needOpenComment: 1,
            onlyFansCanComment: 0,
          },
        ],
      },
      {
        timeout: config.timeout,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[publishToWechat] 发布成功");

    return {
      success: true,
      platform: "wechat",
      data: response.data,
    };
  } catch (error) {
    console.error("[publishToWechat] 发布失败:", error.message);

    return {
      success: false,
      platform: "wechat",
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

/**
 * 多账号发布（8003端口 - /publish-multi）
 */
async function publishMulti(data) {
  const url = `${config.apiBaseUrl}/publish-multi`;

  try {
    const requestData = {
      title: data.title,
      content: data.content,
      cover_url: data.cover_url || "",
      wechat_app_id: data.wechat_app_id,
      wechat_app_secret: data.wechat_app_secret,
      source: data.source || "小程序云函数代理",
    };

    console.log("[publishMulti] 开始发布, 标题:", requestData.title, "内容长度:", requestData.content ? requestData.content.length : 0);

    const response = await axios.post(url, requestData, {
      timeout: config.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[publishMulti] 发布成功");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("[publishMulti] 发布失败:", error.message);

    // 检查是否是超时错误
    const isTimeout = error.code === "ECONNABORTED" || error.message.includes("timeout");
    
    return {
      success: false,
      error: isTimeout ? "后端API响应超时，请稍后重试" : error.message,
      isTimeout: isTimeout,
      details: error.response?.data || null,
    };
  }
}

/**
 * 发布草稿（8002端口 - /publish-draft）
 */
async function publishDraft(data) {
  const url = `${config.apiBaseUrlV2}/publish-draft`;

  try {
    const requestData = {
      title: data.title,
      content: data.content,
      cover_url: data.cover_url || "",
    };

    console.log("[publishDraft] 开始发布, 标题:", requestData.title, "内容长度:", requestData.content ? requestData.content.length : 0);

    const response = await axios.post(url, requestData, {
      timeout: config.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[publishDraft] 发布成功");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("[publishDraft] 发布失败:", error.message);

    const isTimeout = error.code === "ECONNABORTED" || error.message.includes("timeout");

    return {
      success: false,
      error: isTimeout ? "后端API响应超时，请稍后重试" : error.message,
      isTimeout: isTimeout,
      details: error.response?.data || null,
    };
  }
}

/**
 * 测试微信公众号配置
 */
async function testWechatConfig(data) {
  const url = `${config.apiBaseUrl}/api/wechat/test`;

  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        appId: data.appId,
        appSecret: data.appSecret,
      }),
      {
        timeout: 15000,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("[testWechatConfig] 测试失败:", error.message);

    return {
      success: false,
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

/**
 * 健康检查
 */
async function healthCheck() {
  try {
    const url = `${config.apiBaseUrl}/api/health`;

    const response = await axios.get(url, {
      timeout: 8000,
    });

    return {
      success: true,
      apiAvailable: true,
      apiBaseUrl: config.apiBaseUrl,
      apiStatus: response.data,
    };
  } catch (error) {
    console.error("[healthCheck] 健康检查失败:", error.message);

    return {
      success: false,
      apiAvailable: false,
      apiBaseUrl: config.apiBaseUrl,
      error: error.message,
    };
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { action, data } = event;

  console.log("[social-media-proxy] 收到请求, action:", action);

  try {
    switch (action) {
      case "publish-wechat":
        return await publishToWechat(data);

      case "publish-multi":
        return await publishMulti(data);

      case "publish-draft":
        return await publishDraft(data);

      case "test-config":
        return await testWechatConfig(data);

      case "health":
        return await healthCheck();

      default:
        throw new Error(`未知的action: ${action}`);
    }
  } catch (error) {
    console.error("[social-media-proxy] 错误:", error.message);

    return {
      success: false,
      error: error.message,
      errorCode: error.code || "PROXY_ERROR",
    };
  }
};
