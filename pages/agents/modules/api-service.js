// api-service.js
const API_CONFIG_KEY = "ai_api_config";

// 默认GLM API Key（内置，用户无配置时使用）
const DEFAULT_GLM_API_KEY = "4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn";

class APIService {
  constructor(pageContext) {
    this.page = pageContext;
  }

  async callAIAPI(agentType, userMessage, context, mediaInfo) {
    return this.callGLMTextAPI(agentType, userMessage, context, mediaInfo);
  }

  // 直接调用GLM API进行文本生成（不使用用户Key）
  callGLMTextAPI(agentType, userMessage, context, mediaInfo) {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
    const apiKey = apiConfig.glmApiKey || DEFAULT_GLM_API_KEY; // 优先使用用户Key，否则使用默认Key
    const model = apiConfig.glmModel || "glm-4.7-flash";

    console.log(`🚀 使用文本模型: ${model}`);
    console.log(`🔑 使用API Key: ${apiKey ? (apiKey === DEFAULT_GLM_API_KEY ? "默认Key" : "用户Key") : "未配置"}`);

    return new Promise((resolve, reject) => {
      wx.request({
        url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey,
        },
        data: {
          model: model,
          messages: [...context, { role: "user", content: userMessage }],
          temperature: 0.7,
          max_tokens: 5000,
        },
        timeout: 60000,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
            console.log(` ${model} 调用成功`);
            resolve({
              content: res.data.choices[0].message.content,
              model: model
            });
          } else {
            reject(new Error(res.data?.error?.message || "API调用失败"));
          }
        },
        fail: (err) => {
          console.error(` ${model} 调用失败:`, err);
          reject(err);
        }
      });
    });
  }

  // 直接调用GLM API进行图像生成（不使用用户Key）
  generateImageGLM(prompt) {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
    const apiKey = apiConfig.glmApiKey || DEFAULT_GLM_API_KEY; // 优先使用用户Key，否则使用默认Key
    const model = apiConfig.imageModel || "cogview-3-flash";

    console.log(`🎨 使用图像生成模型: ${model}`);
    console.log(`🔑 使用API Key: ${apiKey ? (apiKey === DEFAULT_GLM_API_KEY ? "默认Key" : "用户Key") : "未配置"}`);
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
            reject(new Error("图像生成失败: " + (res.data?.error?.message || "未知错误")));
          }
        },
        fail: (err) => {
          console.error(` ${model} 图像生成失败:`, err);
          reject(err);
        }
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
            status: 'generating',
            prompt: prompts[i]
          });
        }

        const imageUrl = await this.generateImageGLM(prompts[i]);

        results.push({
          success: true,
          url: imageUrl,
          prompt: prompts[i],
          index: i
        });

        console.log(` 图像 ${i + 1}/${total} 生成成功`);

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            status: 'success',
            url: imageUrl
          });
        }

      } catch (error) {
        console.error(` 图像 ${i + 1}/${total} 生成失败:`, error);

        results.push({
          success: false,
          error: error.message,
          prompt: prompts[i],
          index: i
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            status: 'failed',
            error: error.message
          });
        }
      }

      // 添加延迟避免请求过快
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = APIService;
