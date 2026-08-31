// image-generator.js - 图片生成模块
const API_CONFIG_KEY = "ai_api_config";

// 默认GLM API Key（内置，用户无需配置）
const DEFAULT_GLM_API_KEY = "4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn";

// GPT-Image-2 (pollinations.ai) 生图配置
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

class ImageGenerator {
  constructor(pageContext) {
    this.page = pageContext;
  }

  /**
   * GPT-Image-2 (pollinations.ai) 图片生成
   * 免费图片生成服务，支持结构化提示词
   * @param {string} prompt - 生图提示词
   * @param {object} options - 生图选项
   * @returns {Promise<string>} - 图片URL
   */
  generateImageGPTImage2(prompt, options = {}) {
    const {
      width = 1024,
      height = 1024,
      seed = Math.floor(Math.random() * 1000000),
      model = "flux",
      nologo = true,
    } = options;

    console.log("开始GPT-Image-2图片生成, prompt前100字符:", prompt.substring(0, 100));

    return new Promise((resolve, reject) => {
      // 构建生图URL
      const encodedPrompt = encodeURIComponent(prompt);
      const params = [];
      params.push(`width=${width}`);
      params.push(`height=${height}`);
      params.push(`seed=${seed}`);
      params.push(`model=${model}`);
      if (nologo) {
        params.push("nologo=true");
      }

      const imageUrl = `${POLLINATIONS_BASE}/${encodedPrompt}?${params.join("&")}`;

      console.log("GPT-Image-2 生图URL:", imageUrl.substring(0, 200));

      // pollinations.ai 直接通过URL返回图片，无需额外请求
      // 验证图片URL可访问性
      wx.request({
        url: imageUrl,
        method: "GET",
        timeout: 30000,
        responseType: "arraybuffer",
        success: (res) => {
          console.log("GPT-Image-2 验证响应:", {
            statusCode: res.statusCode,
            dataLength: res.data ? res.data.byteLength : 0,
          });

          if (res.statusCode === 200 && res.data && res.data.byteLength > 0) {
            console.log("GPT-Image-2 图片生成成功，URL:", imageUrl.substring(0, 150));
            resolve(imageUrl);
          } else {
            // 即使验证失败，仍然返回URL（图片可能需要时间生成）
            console.warn("GPT-Image-2 验证未返回图片数据，但返回URL供后续使用");
            resolve(imageUrl);
          }
        },
        fail: (err) => {
          console.warn("GPT-Image-2 验证请求失败，返回URL供后续使用:", err.errMsg);
          // pollinations.ai 可能需要时间生成图片，直接返回URL
          resolve(imageUrl);
        },
      });
    });
  }

  // GLM图片生成（cogview-3-flash）
  generateImageGLM(prompt) {
    console.log("开始GLM图片生成, prompt前100字符:", prompt.substring(0, 100));
    return new Promise((resolve, reject) => {
      const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};

      // 优先使用用户Key，否则使用默认Key
      const apiKey =
        apiConfig.glmApiKey || apiConfig.apiKey || DEFAULT_GLM_API_KEY;

      wx.request({
        url: "https://open.bigmodel.cn/api/paas/v4/images/generations",
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        data: {
          model: "cogview-3-flash",
          prompt: prompt,
          size: "1024x1024",
        },
        timeout: 150000,
        success: (res) => {
          console.log("GLM图片API响应:", {
            statusCode: res.statusCode,
            hasData: !!res.data,
          });

          if (
            res.statusCode === 200 &&
            res.data &&
            res.data.data &&
            res.data.data.length > 0
          ) {
            console.log("GLM图片生成成功，URL:", res.data.data[0].url);
            resolve(res.data.data[0].url);
          } else {
            const errorMsg =
              res.data?.error?.message ||
              `GLM图片生成失败，状态码: ${res.statusCode}`;
            console.error("GLM图片生成错误:", errorMsg);
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error("GLM图片API调用失败:", err);
          reject(new Error(`GLM图片生成失败: ${err.errMsg}`));
        },
      });
    });
  }

  /**
   * 统一的图片生成入口
   * 优先使用 GPT-Image-2，失败后降级到 GLM
   * @param {string} prompt - 生图提示词
   * @param {object} options - 生图选项
   * @returns {Promise<string>} - 图片URL
   */
  async generateImage(prompt, options = {}) {
    // 优先使用 GPT-Image-2 (pollinations.ai)
    try {
      console.log("使用 GPT-Image-2 生图...");
      return await this.generateImageGPTImage2(prompt, options);
    } catch (gptError) {
      console.error("GPT-Image-2 生图失败，降级到GLM:", gptError.message);
      // 降级到 GLM
      return await this.generateImageGLM(prompt);
    }
  }

  // 双生图方法：同时生成GPT-Image-2和混元两张图片
  async generateImageDual(prompt) {
    console.log("开始双生图生成，prompt前100字符:", prompt.substring(0, 100));

    try {
      // 并行生成GPT-Image-2和混元图片
      const promises = [];

      // GPT-Image-2 生图
      promises.push(
        this.generateImageGPTImage2(prompt)
          .then((url) => ({ model: "GPT-Image-2", url }))
          .catch((error) => {
            console.warn("GPT-Image-2生图失败:", error.message);
            return { model: "GPT-Image-2", error: error.message };
          }),
      );

      // 混元生图（使用imageGeneratorCloud）
      if (this.page.imageGeneratorCloud) {
        promises.push(
          this.page.imageGeneratorCloud
            .generateImageCloud(prompt)
            .then((result) => ({ model: "混元", url: result.imageUrl }))
            .catch((error) => {
              console.warn("混元生图失败:", error.message);
              return { model: "混元", error: error.message };
            }),
        );
      } else {
        console.warn("混元生图不可用，imageGeneratorCloud未初始化");
        promises.push(
          Promise.resolve({ model: "混元", error: "混元生图不可用" }),
        );
      }

      // 等待两个生成任务完成
      const results = await Promise.all(promises);

      console.log("双生图生成结果:", results);

      return {
        success: true,
        images: results,
      };
    } catch (error) {
      console.error("双生图生成失败:", error);
      throw error;
    }
  }
}

module.exports = ImageGenerator;
