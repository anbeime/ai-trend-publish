// image-generator.js - 图片生成模块
const API_CONFIG_KEY = "ai_api_config";

// 默认GLM API Key（内置，用户无需配置）
const DEFAULT_GLM_API_KEY = "4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn";

class ImageGenerator {
  constructor(pageContext) {
    this.page = pageContext;
  }

  // GLM图片生成（cogview-3-flash）
  generateImageGLM(prompt) {
    console.log("开始GLM图片生成, prompt前100字符:", prompt.substring(0, 100));
    return new Promise((resolve, reject) => {
      const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};

      // 优先使用用户Key，否则使用默认Key
      const apiKey = apiConfig.glmApiKey || apiConfig.apiKey || DEFAULT_GLM_API_KEY;

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


  // 统一的图片生成入口（仅GLM）
  generateImage(prompt, options = {}) {
    return this.generateImageGLM(prompt);
  }

  // 双生图方法：同时生成GLM和混元两张图片
  async generateImageDual(prompt) {
    console.log("开始双生图生成，prompt前100字符:", prompt.substring(0, 100));

    try {
      // 并行生成GLM和混元图片
      const promises = [];

      // GLM生图
      promises.push(
        this.generateImageGLM(prompt)
          .then((url) => ({ model: "GLM", url }))
          .catch((error) => {
            console.warn("GLM生图失败:", error.message);
            return { model: "GLM", error: error.message };
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
