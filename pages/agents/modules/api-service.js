// api-service.js
const API_CONFIG_KEY = "ai_api_config";

// 默认GLM API Key（从 secrets.js 读取）
let DEFAULT_GLM_API_KEY = "";
try {
  const secrets = require('../../../config/secrets.js');
  DEFAULT_GLM_API_KEY = secrets.zhipu?.apiKey || "";
} catch (e) {
  DEFAULT_GLM_API_KEY = "";
}

// NVIDIA MiniMax M2.7 API配置（优先级最高）
const MINIMAX_CONFIG = {
  enabled: true,
  apiKey: (() => {
try {
const secrets = require('../../../config/secrets.js');
return secrets.minimax?.apiKey || "";
} catch (e) {
return "";
}
})(),
  endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
  model: "minimaxai/minimax-m2.7",
  temperature: 1,
  top_p: 0.95,
  max_tokens: 8192,
};

class APIService {
  constructor(pageContext) {
    this.page = pageContext;
  }

  async callAIAPI(agentType, userMessage, context, mediaInfo) {
    // 优先尝试 MiniMax M2.7，失败则降级到 GLM
    if (MINIMAX_CONFIG.enabled) {
      try {
        const minimaxResult = await this.callMiniMaxTextAPI(agentType, userMessage, context, mediaInfo);
        console.log("✅ MiniMax M2.7 文本生成成功");
        return minimaxResult;
      } catch (minimaxError) {
        console.warn("⚠️ MiniMax文本生成失败，降级到GLM:", minimaxError.message);
      }
    }

    // GLM降级
    return this.callGLMTextAPI(agentType, userMessage, context, mediaInfo);
  }

  // 调用 NVIDIA MiniMax M2.7 API（优先级最高）
  callMiniMaxTextAPI(agentType, userMessage, context, mediaInfo) {
    console.log(`🚀 使用 MiniMax M2.7 模型`);

    return new Promise((resolve, reject) => {
      // 构建消息
      const messages = [];
      if (context && context.length > 0) {
        messages.push(...context);
      }
      messages.push({ role: "user", content: userMessage });

      wx.request({
        url: MINIMAX_CONFIG.endpoint,
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + MINIMAX_CONFIG.apiKey,
        },
        data: {
          model: MINIMAX_CONFIG.model,
          messages: messages,
          temperature: MINIMAX_CONFIG.temperature,
          top_p: MINIMAX_CONFIG.top_p,
          max_tokens: MINIMAX_CONFIG.max_tokens,
          stream: false,
        },
        timeout: 60000,
        success: (res) => {
          if (
            res.statusCode === 200 &&
            res.data &&
            res.data.choices &&
            res.data.choices[0]
          ) {
            console.log("MiniMax M2.7 调用成功");
            resolve({
              content: res.data.choices[0].message.content,
              model: "minimax-m2.7",
            });
          } else {
            const errorMsg = res.data?.error?.message || `MiniMax API调用失败 (状态码: ${res.statusCode})`;
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error("MiniMax M2.7 调用失败:", err);
          reject(err);
        },
      });
    });
  }

  // 直接调用GLM API进行文本生成（不使用用户Key）
  callGLMTextAPI(agentType, userMessage, context, mediaInfo) {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
    const apiKey = apiConfig.glmApiKey || DEFAULT_GLM_API_KEY; // 优先使用用户Key，否则使用默认Key
    const model = apiConfig.glmModel || "glm-4.7-flash";

    console.log(`🚀 使用文本模型: ${model}`);
    console.log(
      `🔑 使用API Key: ${apiKey ? (apiKey === DEFAULT_GLM_API_KEY ? "默认Key" : "用户Key") : "未配置"}`,
    );

    return new Promise((resolve, reject) => {
      wx.request({
        url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        data: {
          model: model,
          messages: [...context, { role: "user", content: userMessage }],
          temperature: 0.7,
          max_tokens: 5000,
        },
        timeout: 60000,
        success: (res) => {
          if (
            res.statusCode === 200 &&
            res.data &&
            res.data.choices &&
            res.data.choices[0]
          ) {
            console.log(` ${model} 调用成功`);
            resolve({
              content: res.data.choices[0].message.content,
              model: model,
            });
          } else {
            reject(new Error(res.data?.error?.message || "API调用失败"));
          }
        },
        fail: (err) => {
          console.error(` ${model} 调用失败:`, err);
          reject(err);
        },
      });
    });
  }

  // 直接调用GLM API进行图像生成（不使用用户Key）
  generateImageGLM(prompt) {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
    const apiKey = apiConfig.glmApiKey || DEFAULT_GLM_API_KEY; // 优先使用用户Key，否则使用默认Key
    const model = apiConfig.imageModel || "cogview-3-flash";

    console.log(`🎨 使用图像生成模型: ${model}`);
    console.log(
      `🔑 使用API Key: ${apiKey ? (apiKey === DEFAULT_GLM_API_KEY ? "默认Key" : "用户Key") : "未配置"}`,
    );
    console.log(` 生成提示词: ${prompt.substring(0, 50)}...`);

    return new Promise((resolve, reject) => {
      wx.request({
        url: "https://open.bigmodel.cn/api/paas/v4/images/generations",
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        data: {
          model: model,
          prompt: prompt,
        },
        timeout: 150000,
        success: (res) => {
          if (
            res.statusCode === 200 &&
            res.data &&
            res.data.data &&
            res.data.data.length > 0
          ) {
            console.log(` ${model} 图像生成成功`);
            resolve(res.data.data[0].url);
          } else {
            reject(
              new Error(
                "图像生成失败: " + (res.data?.error?.message || "未知错误"),
              ),
            );
          }
        },
        fail: (err) => {
          console.error(` ${model} 图像生成失败:`, err);
          reject(err);
        },
      });
    });
  }

  // 批量生成图像（辅助调用GLM API，不使用用户Key）
  async generateImagesInBatch(prompts, onProgress) {
    const results = [];
    const total = prompts.length;

    for (let i = 0; i < prompts.length; i++) {
      try {
        console.log(`📊 生成图像 ${i + 1}/${total}`);

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            status: "generating",
            prompt: prompts[i],
          });
        }

        const imageUrl = await this.generateImageGLM(prompts[i]);

        results.push({
          success: true,
          url: imageUrl,
          prompt: prompts[i],
          index: i,
        });

        console.log(` 图像 ${i + 1}/${total} 生成成功`);

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            status: "success",
            url: imageUrl,
          });
        }
      } catch (error) {
        console.error(` 图像 ${i + 1}/${total} 生成失败:`, error);

        results.push({
          success: false,
          error: error.message,
          prompt: prompts[i],
          index: i,
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            status: "failed",
            error: error.message,
          });
        }
      }

      // 添加延迟避免请求过快
      if (i < prompts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = APIService;
