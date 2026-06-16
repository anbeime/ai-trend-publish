// video-generator.js - 视频生成模块（仅GLM）
const API_CONFIG_KEY = "ai_api_config";

class VideoGenerator {
  constructor(pageContext) {
    this.page = pageContext;
  }

  // GLM视频生成（cogvideox-3-flash）
  generateVideoGLM(prompt) {
    console.log('开始GLM视频生成:', prompt);
    return new Promise((resolve, reject) => {
      const config = wx.getStorageSync(API_CONFIG_KEY) || {};

      wx.request({
        url: "https://open.bigmodel.cn/api/paas/v4/videos/generations",
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        data: {
          model: "cogvideox-3-flash",
          prompt: prompt,
        },
        timeout: 150000,
        success: (res) => {
          console.log("GLM视频API响应:", { statusCode: res.statusCode, data: res.data });

          if (res.statusCode === 200 && res.data && res.data.data && res.data.data[0]) {
            // GLM视频API返回的是任务ID，需要轮询获取结果
            const taskId = res.data.data[0].id;
            console.log("GLM视频任务ID:", taskId);
            
            // 轮询获取视频生成结果
            this.pollGLMVideoResult(taskId, resolve, reject);
          } else {
            reject(new Error(res.data?.error?.message || "GLM视频生成失败"));
          }
        },
        fail: (err) => {
          console.error("GLM视频API调用失败:", err);
          reject(new Error(`GLM视频生成失败: ${err.errMsg}`));
        },
      });
    });
  }

  // 轮询GLM视频生成结果
  pollGLMVideoResult(taskId, resolve, reject, attempt = 1, maxAttempts = 60) {
    const config = wx.getStorageSync(API_CONFIG_KEY) || {};
    
    wx.request({
      url: `https://open.bigmodel.cn/api/paas/v4/videos/generations/${taskId}`,
      method: "GET",
      header: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      success: (res) => {
        console.log(`轮询GLM视频结果 (第${attempt}次):`, res.data);

        if (res.statusCode === 200 && res.data) {
          const status = res.data.task_status;
          
          if (status === "SUCCESS") {
            // 生成成功
            if (res.data.video_result && res.data.video_result.url) {
              resolve({
                videoUrl: res.data.video_result.url,
                coverUrl: res.data.video_result.cover_url || res.data.video_result.url,
              });
            } else {
              reject(new Error("视频生成成功但未返回URL"));
            }
          } else if (status === "FAILED") {
            // 生成失败
            reject(new Error(res.data.error?.message || "GLM视频生成失败"));
          } else if (status === "PROCESSING" || status === "PENDING") {
            // 仍在处理中，继续轮询
            if (attempt < maxAttempts) {
              setTimeout(() => {
                this.pollGLMVideoResult(taskId, resolve, reject, attempt + 1, maxAttempts);
              }, 5000); // 每2秒轮询一次
            } else {
              reject(new Error("GLM视频生成超时"));
            }
          } else {
            reject(new Error(`未知状态: ${status}`));
          }
        } else {
          reject(new Error("查询视频状态失败"));
        }
      },
      fail: (err) => {
        console.error("轮询GLM视频结果失败:", err);
        reject(new Error(`查询视频状态失败: ${err.errMsg}`));
      },
    });
  }

  // 统一的视频生成入口（仅GLM）
  generateVideo(prompt, options = {}) {
    const { useGLM = true } = options;

    if (!useGLM) {
      return Promise.reject(new Error("没有可用的视频生成模型"));
    }

    return this.generateVideoGLM(prompt);
  }
}

module.exports = VideoGenerator;
