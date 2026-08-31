// video-generator.js - 视频生成模块（支持 Qwen/通义万相）
const API_CONFIG_KEY = "ai_api_config";
const QWEN_CONFIG_KEY = "qwen_config";
const QWEN_API_BASE = "https://dashscope.aliyuncs.com/api/v1";

// 内置默认 API Key（供免费试用）
const DEFAULT_API_KEY = "sk-1c6db0bc6d747339e8e6ea1ec88c84c";

// 获取Qwen配置中的API Key
function getQwenApiKey() {
  const qwenConfig = wx.getStorageSync(QWEN_CONFIG_KEY);
  // 优先使用用户配置的API Key，否则使用内置默认Key
  return qwenConfig?.apiKey || DEFAULT_API_KEY;
}

/**
 * 支持的视频模型
 * - wan2.6-i2v: 图生视频模型，支持参考图片和音频输入
 * - wan2.6-t2v: 文生视频模型，纯文本生成视频
 * - wan2.6-r2v-flash: 快速文生视频模型
 */
const VIDEO_MODELS = {
  "wan2.6-i2v": {
    name: "图生视频",
    description: "支持参考图片和音频输入",
    supportsImage: true,
    supportsAudio: true,
  },
  "wan2.6-t2v": {
    name: "文生视频",
    description: "纯文本生成视频",
    supportsImage: false,
    supportsAudio: false,
  },
  "wan2.6-r2v-flash": {
    name: "快速文生视频",
    description: "快速文本生成视频",
    supportsImage: false,
    supportsAudio: true,
  },
};

class VideoGenerator {
  constructor(pageContext) {
    this.page = pageContext;
  }

  /**
   * 获取支持的视频模型列表
   */
  getSupportedModels() {
    return VIDEO_MODELS;
  }

  // ========== Qwen/通义万相 视频生成 ==========
  /**
   * 生成视频 - 统一入口
   * @param {string} prompt - 视频描述提示词
   * @param {Object} options - 配置选项
   * @param {string} options.model - 模型名称 (wan2.6-i2v, wan2.6-t2v, wan2.6-r2v-flash)
   * @param {string} options.img_url - 参考图片URL (仅 wan2.6-i2v)
   * @param {string} options.audio_url - 音频URL (wan2.6-i2v 和 wan2.6-r2v-flash)
   * @param {string} options.resolution - 分辨率 (720P, 1080P)
   * @param {number} options.duration - 视频时长 (5-10秒)
   * @param {boolean} options.prompt_extend - 是否扩展提示词
   * @param {string} options.shot_type - 镜头类型 (single, multi)
   * @param {boolean} options.audio - 是否生成音频
   */
  generateVideoQwen(prompt, options = {}) {
    const {
      model = "wan2.6-i2v",
      img_url = "",
      audio_url = "",
      resolution = "720P",
      duration = 10,
      prompt_extend = true,
      shot_type = "multi",
      audio = true,
    } = options;

    console.log("[Video] 开始视频生成:", {
      model,
      prompt: prompt.substring(0, 50) + "...",
      hasImage: !!img_url,
      hasAudio: !!audio_url,
      resolution,
      duration,
    });

    return new Promise((resolve, reject) => {
      // 构建 input 对象
      const input = {
        prompt: prompt,
      };

      // 根据模型类型添加额外参数
      if (model === "wan2.6-i2v") {
        // 图生视频模型支持图片和音频
        if (img_url) {
          input.img_url = img_url;
        }
        if (audio_url) {
          input.audio_url = audio_url;
        }
      }

      // 构建 parameters 对象
      const parameters = {
        resolution: resolution,
        duration: duration,
        prompt_extend: prompt_extend,
        shot_type: shot_type,
      };

      // 音频参数（仅支持音频的模型）
      if (audio && (model === "wan2.6-i2v" || model === "wan2.6-r2v-flash")) {
        parameters.audio = true;
      }

      wx.request({
        url: `${QWEN_API_BASE}/services/aigc/video-generation/video-synthesis`,
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getQwenApiKey()}`,
          "X-DashScope-Async": "enable", // 异步模式
        },
        data: {
          model: model,
          input: input,
          parameters: parameters,
        },
        timeout: 30000,
        success: (res) => {
          console.log("[Video] API响应:", {
            statusCode: res.statusCode,
            data: res.data,
          });

          if (
            res.statusCode === 200 &&
            res.data &&
            res.data.output &&
            res.data.output.task_id
          ) {
            const taskId = res.data.output.task_id;
            console.log("[Video] 任务ID:", taskId);

            // 轮询获取视频生成结果
            this.pollQwenVideoResult(taskId, resolve, reject);
          } else if (res.statusCode === 400) {
            reject(new Error(res.data?.message || "视频参数错误"));
          } else if (res.statusCode === 401) {
            reject(new Error("API Key 无效或已过期"));
          } else if (res.statusCode === 429) {
            reject(new Error("请求过于频繁，请稍后重试"));
          } else {
            reject(new Error(res.data?.message || "视频生成失败"));
          }
        },
        fail: (err) => {
          console.error("[Video] API调用失败:", err);
          reject(new Error(`视频生成失败: ${err.errMsg}`));
        },
      });
    });
  }

  // 轮询Qwen视频生成结果
  pollQwenVideoResult(taskId, resolve, reject, attempt = 1, maxAttempts = 120) {
    wx.request({
      url: `${QWEN_API_BASE}/tasks/${taskId}`,
      method: "GET",
      header: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getQwenApiKey()}`,
      },
      success: (res) => {
        console.log(`[Video] 轮询结果 (第${attempt}次):`, res.data);

        if (res.statusCode === 200 && res.data) {
          const taskStatus = res.data.task_status;

          if (taskStatus === "SUCCEEDED") {
            // 生成成功
            const output = res.data.output;
            if (output && output.video_url) {
              resolve({
                success: true,
                videoUrl: output.video_url,
                coverUrl: output.cover_url || output.video_url + "?cover=1",
                duration: output.duration || 0,
                model: res.data.model || "wan2.6-i2v",
              });
            } else {
              reject(new Error("视频生成成功但未返回URL"));
            }
          } else if (taskStatus === "FAILED") {
            // 生成失败
            const error = res.data.message || res.data.code || "视频生成失败";
            reject(new Error(error));
          } else if (taskStatus === "PENDING" || taskStatus === "RUNNING") {
            // 仍在处理中，继续轮询
            if (attempt < maxAttempts) {
              setTimeout(() => {
                this.pollQwenVideoResult(
                  taskId,
                  resolve,
                  reject,
                  attempt + 1,
                  maxAttempts,
                );
              }, 3000); // 每3秒轮询一次
            } else {
              reject(new Error("视频生成超时"));
            }
          } else {
            reject(new Error(`未知状态: ${taskStatus}`));
          }
        } else {
          reject(new Error("查询视频状态失败"));
        }
      },
      fail: (err) => {
        console.error("[Video] 轮询失败:", err);
        reject(new Error(`查询视频状态失败: ${err.errMsg}`));
      },
    });
  }

  // ========== GLM 视频生成（保留备选） ==========
  generateVideoGLM(prompt) {
    console.log("[Video] 开始GLM视频生成:", prompt);
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
          console.log("[Video] GLM API响应:", {
            statusCode: res.statusCode,
            data: res.data,
          });

          if (
            res.statusCode === 200 &&
            res.data &&
            res.data.data &&
            res.data.data[0]
          ) {
            // GLM视频API返回的是任务ID，需要轮询获取结果
            const taskId = res.data.data[0].id;
            console.log("[Video] GLM任务ID:", taskId);

            // 轮询获取视频生成结果
            this.pollGLMVideoResult(taskId, resolve, reject);
          } else {
            reject(new Error(res.data?.error?.message || "GLM视频生成失败"));
          }
        },
        fail: (err) => {
          console.error("[Video] GLM API调用失败:", err);
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
        console.log(`[Video] GLM轮询结果 (第${attempt}次):`, res.data);

        if (res.statusCode === 200 && res.data) {
          const status = res.data.task_status;

          if (status === "SUCCESS") {
            // 生成成功
            if (res.data.video_result && res.data.video_result.url) {
              resolve({
                success: true,
                videoUrl: res.data.video_result.url,
                coverUrl:
                  res.data.video_result.cover_url || res.data.video_result.url,
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
                this.pollGLMVideoResult(
                  taskId,
                  resolve,
                  reject,
                  attempt + 1,
                  maxAttempts,
                );
              }, 5000); // 每5秒轮询一次
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
        console.error("[Video] GLM轮询失败:", err);
        reject(new Error(`查询视频状态失败: ${err.errMsg}`));
      },
    });
  }

  // 统一的视频生成入口
  generateVideo(prompt, options = {}) {
    const { useQwen = true, useGLM = false, ...qwenOptions } = options;

    // 优先使用 Qwen/通义万相
    if (useQwen) {
      console.log("[Video] 使用Qwen通义万相生成视频");
      return this.generateVideoQwen(prompt, qwenOptions);
    }

    // 备选 GLM
    if (useGLM) {
      console.log("[Video] 使用GLM生成视频");
      return this.generateVideoGLM(prompt);
    }

    return Promise.reject(
      new Error("请选择视频生成模型: useQwen=true 或 useGLM=true"),
    );
  }

  /**
   * 图生视频 - 便捷方法
   * @param {string} prompt - 视频描述
   * @param {string} imgUrl - 参考图片URL
   * @param {Object} options - 其他选项
   */
  generateFromImage(prompt, imgUrl, options = {}) {
    return this.generateVideo(prompt, {
      ...options,
      model: "wan2.6-i2v",
      img_url: imgUrl,
      useQwen: true,
    });
  }

  /**
   * 图生视频（带音频）- 便捷方法
   * @param {string} prompt - 视频描述
   * @param {string} imgUrl - 参考图片URL
   * @param {string} audioUrl - 音频URL
   * @param {Object} options - 其他选项
   */
  generateFromImageWithAudio(prompt, imgUrl, audioUrl, options = {}) {
    return this.generateVideo(prompt, {
      ...options,
      model: "wan2.6-i2v",
      img_url: imgUrl,
      audio_url: audioUrl,
      useQwen: true,
    });
  }

  /**
   * 纯文本生成视频
   * @param {string} prompt - 视频描述
   * @param {Object} options - 其他选项
   */
  generateFromText(prompt, options = {}) {
    return this.generateVideo(prompt, {
      ...options,
      model: "wan2.6-t2v",
      useQwen: true,
    });
  }
}

module.exports = VideoGenerator;
