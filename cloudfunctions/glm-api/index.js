// 云函数入口文件
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 智谱GLM API配置 - 优先从环境变量读取，否则使用备用配置
// 注意：建议在云开发控制台设置环境变量 GLM_API_KEY
const GLM_API_KEY = process.env.GLM_API_KEY || "";
const GLM_API_BASE = "https://open.bigmodel.cn/api/paas/v4";

// GPT-Image-2 (pollinations.ai) 免费图片生成API
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

// 配置检查
if (!GLM_API_KEY) {
  console.warn("⚠️ GLM_API_KEY 环境变量未配置，请在云开发控制台设置");
  console.warn("⚠️ 请在云开发控制台 -> 设置 -> 环境变量 中添加 GLM_API_KEY");
}

const https = require("https");

/**
 * 调用智谱GLM API（带超时处理）
 * @param {string} endpoint - API端点 (chat/completions 或 images/generations)
 * @param {object} data - 请求数据
 * @param {string} userApiKey - 用户自定义的API Key（可选）
 * @param {number} timeout - 超时时间（毫秒），默认60秒
 */
async function callGLMAPI(endpoint, data, userApiKey, timeout = 60000) {
  const apiKey = userApiKey || GLM_API_KEY;
  
  // 检查 API Key
  if (!apiKey) {
    return {
      success: false,
      error: "API Key未配置，请在云开发控制台设置 GLM_API_KEY 环境变量",
    };
  }
  
  const url = new URL(`${GLM_API_BASE}/${endpoint}`);

  return new Promise((resolve, reject) => {
    // 设置超时定时器
    const timeoutId = setTimeout(() => {
      req.destroy(); // 超时时销毁请求
      resolve({
        success: false,
        error: "API调用超时，请稍后重试",
        timeout: true,
      });
    }, timeout);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    };

    console.log(`🌐 请求 GLM API: ${endpoint}, 超时: ${timeout}ms`);
    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        console.log(`✅ GLM API 响应: ${res.statusCode}, 耗时: ${duration}ms`);
        
        // 检查HTTP状态码
        if (res.statusCode !== 200) {
          console.error("❌ HTTP错误:", res.statusCode, responseData.substring(0, 200));
          resolve({
            success: false,
            error: `API返回错误 (${res.statusCode}): ${responseData.substring(0, 100)}`,
          });
          return;
        }
        
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            success: true,
            data: parsedData,
            duration: duration,
          });
        } catch (error) {
          console.error("❌ JSON解析失败:", error.message);
          resolve({
            success: false,
            error: "响应解析失败: " + error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      clearTimeout(timeoutId);
      console.error("❌ GLM API调用失败:", error);
      resolve({
        success: false,
        error: error.message || "调用失败",
      });
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * 调用 GPT-Image-2 (pollinations.ai) 生图 API
 * 免费图片生成服务，支持结构化提示词
 * @param {object} data - 生图数据 { prompt, width, height, seed, model, nologo }
 * @returns {object} - 生图结果
 */
async function callGPTImage2(data) {
  const {
    prompt,
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    model = "flux",
    nologo = true,
  } = data;

  if (!prompt) {
    return {
      success: false,
      error: "prompt 不能为空",
    };
  }

  // 构建生图URL
  const encodedPrompt = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    model: model,
  });

  if (nologo) {
    params.append("nologo", "true");
  }

  const imageUrl = `${POLLINATIONS_BASE}/${encodedPrompt}?${params.toString()}`;

  console.log("GPT-Image-2 (pollinations) 生图URL:", imageUrl.substring(0, 200));

  // 返回图片URL（pollinations.ai 直接通过URL返回图片）
  return {
    success: true,
    data: {
      created: Date.now(),
      data: [{ url: imageUrl }],
      model: "gpt-image-2",
    },
    duration: 0,
  };
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, endpoint, data, apiKey, timeout } = event;

  console.log("📋 GLM API云函数调用:", { action, endpoint, hasApiKey: !!apiKey });

  try {
    switch (action) {
      case "chat":
        // 聊天补全
        return await callGLMAPI("chat/completions", data, apiKey, timeout || 60000);

      case "image":
        // 智谱图像生成（需要更长时间）
        return await callGLMAPI("images/generations", data, apiKey, timeout || 60000);

      case "gpt-image":
        // GPT-Image-2 (pollinations.ai) 图像生成
        return await callGPTImage2(data || {});

      case "custom":
        // 自定义端点
        return await callGLMAPI(endpoint, data, apiKey, timeout);

      default:
        return {
          success: false,
          error: "不支持的操作类型: " + action,
        };
    }
  } catch (error) {
    console.error("❌ 云函数执行失败:", error);
    return {
      success: false,
      error: error.message || "执行失败",
    };
  }
};
