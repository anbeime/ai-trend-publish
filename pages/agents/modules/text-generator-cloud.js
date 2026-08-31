// text-generator-cloud.js - 使用云开发AI+能力生成文本
const API_CONFIG_KEY = "ai_api_config";

class TextGeneratorCloud {
  constructor(pageContext) {
    this.page = pageContext;
    this.initialized = false;
    this.model = null;
    this.promptTemplateManager = require("./prompt-templates");
    this.userPreferenceManager = require("./user-preference");
  }

  // 初始化云开发AI
  async init() {
    if (this.initialized) return true;

    try {
      // 检查基础库版本
      const systemInfo = wx.getSystemInfoSync();
      const versionNum = parseFloat(systemInfo.SDKVersion);

      if (versionNum < 3.7) {
        console.warn(
          `当前基础库版本 ${systemInfo.SDKVersion} 不支持AI+能力，需要 >= 3.7.1`,
        );
        return false;
      }

      // 检查是否已经初始化云开发
      if (!wx.cloud.__initialized) {
        const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
        const env = apiConfig.env || "topgo-d4gw272cge9c2e3f9";

        wx.cloud.init({ env });
        wx.cloud.__initialized = true;
        console.log("云开发初始化完成，环境ID:", env);
      }

      this.initialized = true;
      console.log("云开发AI+文本生成初始化成功");
      return true;
    } catch (error) {
      console.error("云开发AI+初始化失败:", error);
      return false;
    }
  }

  // 流式生成文本（推荐）
  // 优先使用 hunyuan-exp，未启用时降级到 cloudbase（云开发自带 AI）
  async streamText(messages, options = {}) {
    const {
      model = "hunyuan-turbos-latest",
      temperature = 0.7,
      maxTokens = 5000,
      cloudbaseModel = "deepseek-v4-flash", // cloudbase 模型组中的模型 ID（需在控制台启用）
    } = options;

    // 检查混元配置是否启用
    const hunyuanConfig = this.page.data.hunyuanConfig || { enabled: false };
    if (hunyuanConfig.enabled) {
      // 使用 hunyuan-exp 模型（小程序成长计划）
      try {
        return await this._streamTextHunyuan(messages, { model, temperature, maxTokens });
      } catch (error) {
        if (error.message === "CLOUD_AI_NOT_AVAILABLE") {
          console.warn("混元不可用，尝试 cloudbase 降级...");
        } else {
          console.warn("混元流式生成失败，尝试 cloudbase 降级:", error.message);
        }
        // 继续尝试 cloudbase 降级
      }
    }

    // 降级：使用 cloudbase 模型组（Token Credits 资源包，支持 deepseek-v4-flash / glm-5 / kimi-k2.6 等）
    // 注意：cloudbase 组中的模型默认未启用，需在云开发控制台 AI 页面启用
    // 控制台地址: https://tcb.cloud.tencent.com/dev?envId={envId}#/ai
    try {
      return await this._streamTextCloudbase(messages, {
        model: cloudbaseModel,
        temperature,
        maxTokens,
      });
    } catch (cloudbaseError) {
      console.error("cloudbase 流式文本生成也失败:", cloudbaseError.message);
      throw new Error("CLOUD_AI_NOT_AVAILABLE");
    }
  }

  // 使用 hunyuan-exp 流式生成文本
  async _streamTextHunyuan(messages, options = {}) {
    const { model = "hunyuan-turbos-latest", temperature = 0.7, maxTokens = 5000 } = options;

    console.log("调用云开发AI+流式文本生成(hunyuan-exp):", {
      model,
      messageCount: messages.length,
      temperature,
    });

    try {
      if (!this.initialized) {
        const initSuccess = await this.init();
        if (!initSuccess) {
          throw new Error("CLOUD_AI_NOT_AVAILABLE");
        }
      }

      // 创建模型实例
      const aiModel = wx.cloud.extend.AI.createModel("hunyuan-exp");

      // 调用流式生成接口
      const response = await aiModel.streamText({
        data: {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
      });

      console.log("流式响应创建成功(hunyuan-exp)");

      return {
        success: true,
        textStream: response.textStream,
        eventStream: response.eventStream,
        provider: "hunyuan-exp",
      };
    } catch (error) {
      console.error("云开发流式文本生成错误(hunyuan-exp):", error);
      if (error.message === "CLOUD_AI_NOT_AVAILABLE") {
        throw error;
      }
      throw new Error(`流式文本生成失败: ${error.message}`);
    }
  }

  // 使用 cloudbase 模型组流式生成文本（TokenHub 统一管理组，支持 deepseek-v4-flash / glm-5 / kimi-k2.6 等）
  // 官方接入指引：wx.cloud.extend.AI.createModel("cloudbase")
  // 注意：模型默认未启用，需在云开发控制台 AI 页面启用目标模型
  async _streamTextCloudbase(messages, options = {}) {
    const {
      model = "deepseek-v4-flash",
      temperature = 0.7,
      maxTokens = 5000,
    } = options;

    console.log("调用云开发AI+流式文本生成(cloudbase):", {
      model,
      messageCount: messages.length,
      temperature,
    });

    try {
      // 确保云开发已初始化
      if (!wx.cloud.__initialized) {
        const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
        const env = apiConfig.env || "topgo-d4gw272cge9c2e3f9";
        wx.cloud.init({ env });
        wx.cloud.__initialized = true;
        console.log("云开发初始化完成(cloudbase)，环境ID:", env);
      }

      // 检查云开发AI+能力是否可用
      if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
        throw new Error("云开发AI+能力未启用");
      }

      // 创建 cloudbase 模型实例
      const aiModel = wx.cloud.extend.AI.createModel("cloudbase");

      // 调用流式生成接口
      const response = await aiModel.streamText({
        data: {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
      });

      console.log("流式响应创建成功(cloudbase)");

      return {
        success: true,
        textStream: response.textStream,
        eventStream: response.eventStream,
        provider: "cloudbase",
      };
    } catch (error) {
      console.error("cloudbase 流式文本生成错误:", error);
      throw new Error(`cloudbase 流式生成失败: ${error.message}`);
    }
  }

  // 非流式生成文本（支持模板系统）
  // 优先使用 hunyuan-exp，未启用时降级到 cloudbase
  async generateText(messages, options = {}) {
    const {
      model = "hunyuan-turbos-latest",
      temperature = 0.7,
      maxTokens = 5000,
      agentType = "text",
      promptVersion = "v1",
      templateVariables = {},
      customPromptExtension = "",
      cloudbaseModel = "deepseek-v4-flash", // cloudbase 模型组中的模型 ID
    } = options;

    // 如果使用了模板系统，构建完整的prompt
    if (agentType && promptVersion) {
      try {
        const templateManager =
          this.promptTemplateManager.PromptTemplateManager;
        const manager = new templateManager();

        // 构建个性化上下文
        const preferenceManager =
          this.userPreferenceManager.UserPreferenceManager;
        const prefManager = new preferenceManager(this.page);
        const personalizedContext = prefManager.generatePersonalizedContext();

        // 合并个性化变量
        const allVariables = {
          ...templateVariables,
          ...personalizedContext.userPreferences,
          ...personalizedContext.historyInsights,
        };

        // 获取模板提示词
        const templatePrompt = manager.getPrompt(
          agentType,
          allVariables,
          promptVersion,
          customPromptExtension,
        );

        // 使用模板替换原始消息
        messages = [
          {
            role: messages[messages.length - 1]?.role || "user",
            content: templatePrompt,
          },
        ];

        console.log("使用模板系统生成提示词:", agentType, promptVersion);
      } catch (error) {
        console.warn("模板系统应用失败，使用原始消息:", error);
      }
    }

    // 检查混元配置是否启用
    const hunyuanConfig = this.page.data.hunyuanConfig || { enabled: false };
    if (hunyuanConfig.enabled) {
      try {
        return await this._generateTextHunyuan(messages, { model, temperature, maxTokens });
      } catch (error) {
        if (error.message === "CLOUD_AI_NOT_AVAILABLE") {
          console.warn("混元不可用，尝试 cloudbase 降级...");
        } else {
          console.warn("混元文本生成失败，尝试 cloudbase 降级:", error.message);
        }
      }
    }

    // 降级：使用 cloudbase 模型
    try {
      return await this._generateTextCloudbase(messages, {
        model: cloudbaseModel,
        temperature,
        maxTokens,
      });
    } catch (cloudbaseError) {
      console.error("cloudbase 文本生成也失败:", cloudbaseError.message);
      throw new Error("CLOUD_AI_NOT_AVAILABLE");
    }
  }

  // 使用 hunyuan-exp 非流式生成文本
  async _generateTextHunyuan(messages, options = {}) {
    const { model = "hunyuan-turbos-latest", temperature = 0.7, maxTokens = 5000 } = options;

    console.log("调用云开发AI+文本生成(hunyuan-exp):", {
      model,
      messageCount: messages.length,
    });

    try {
      if (!this.initialized) {
        const initSuccess = await this.init();
        if (!initSuccess) {
          throw new Error("CLOUD_AI_NOT_AVAILABLE");
        }
      }

      const aiModel = wx.cloud.extend.AI.createModel("hunyuan-exp");

      const response = await aiModel.generateText({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      console.log("文本生成成功(hunyuan-exp)");

      const content = response.choices?.[0]?.message?.content || "";

      if (!content) {
        console.error("响应结构异常:", response);
        throw new Error("AI响应格式错误");
      }

      return {
        success: true,
        content: content,
        fullResponse: response,
        provider: "hunyuan-exp",
      };
    } catch (error) {
      console.error("云开发文本生成错误(hunyuan-exp):", error);
      if (error.message === "CLOUD_AI_NOT_AVAILABLE") {
        throw error;
      }
      throw new Error(`文本生成失败: ${error.message}`);
    }
  }

  // 使用 cloudbase 模型组非流式生成文本
  // 通过流式接口收集完整响应（cloudbase 不支持 generateText，使用 streamText 替代）
  // 注意：模型默认未启用，需在云开发控制台 AI 页面启用目标模型
  async _generateTextCloudbase(messages, options = {}) {
    const {
      model = "deepseek-v4-flash",
      temperature = 0.7,
      maxTokens = 5000,
    } = options;

    console.log("调用云开发AI+文本生成(cloudbase):", {
      model,
      messageCount: messages.length,
    });

    try {
      // 确保云开发已初始化
      if (!wx.cloud.__initialized) {
        const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
        const env = apiConfig.env || "topgo-d4gw272cge9c2e3f9";
        wx.cloud.init({ env });
        wx.cloud.__initialized = true;
      }

      if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
        throw new Error("云开发AI+能力未启用");
      }

      // 创建 cloudbase 模型实例
      const aiModel = wx.cloud.extend.AI.createModel("cloudbase");

      // cloudbase 使用 streamText，手动收集完整响应
      const response = await aiModel.streamText({
        data: {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
      });

      console.log("cloudbase 流式响应创建成功，开始收集完整文本...");

      // 收集流式数据为完整文本
      let fullText = "";
      let reasoningContent = "";

      for await (let event of response.eventStream) {
        try {
          if (event.data === "[DONE]") {
            break;
          }

          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

          // deepseek-r1 思维链内容
          const think = data?.choices?.[0]?.delta?.reasoning_content;
          if (think) {
            reasoningContent += think;
          }

          // 生成文本内容
          const text = data?.choices?.[0]?.delta?.content;
          if (text) {
            fullText += text;
          }
        } catch (parseError) {
          // 跳过解析失败的事件
        }
      }

      console.log("cloudbase 文本生成完成，长度:", fullText.length);
      if (reasoningContent) {
        console.log("cloudbase 思维链长度:", reasoningContent.length);
      }

      if (!fullText) {
        throw new Error("cloudbase 返回内容为空");
      }

      return {
        success: true,
        content: fullText,
        reasoningContent: reasoningContent || null,
        fullResponse: { text: fullText, reasoning: reasoningContent },
        provider: "cloudbase",
        model: model,
      };
    } catch (error) {
      console.error("cloudbase 文本生成错误:", error);
      throw new Error(`cloudbase 文本生成失败: ${error.message}`);
    }
  }

  // 流式响应处理器
  // 同时支持 hunyuan-exp（事件类型格式）和 cloudbase（SSE choices/delta 格式）
  async processStream(response, callbacks = {}) {
    const { onTextDelta, onReasoningDelta, onEvent, onComplete, onError } = callbacks;

    try {
      let fullText = "";
      let fullReasoning = "";
      const provider = response.provider || "unknown";

      // 优先使用 eventStream（更完整的数据）
      const stream = response.eventStream || response.textStream;

      if (!stream) {
        throw new Error("无效的流式响应");
      }

      for await (let event of stream) {
        try {
          // cloudbase 格式：event.data 是 JSON 字符串（SSE 格式）
          if (provider === "cloudbase" || (event.data && typeof event.data === "string")) {
            // [DONE] 标记
            if (event.data === "[DONE]") {
              if (onComplete) onComplete(fullText);
              break;
            }

            const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

            // 调用事件回调
            if (onEvent) onEvent(data);

            // deepseek-r1 思维链内容
            const think = data?.choices?.[0]?.delta?.reasoning_content;
            if (think) {
              fullReasoning += think;
              if (onReasoningDelta) onReasoningDelta(think, fullReasoning);
            }

            // 生成文本内容
            const text = data?.choices?.[0]?.delta?.content;
            if (text) {
              fullText += text;
              if (onTextDelta) onTextDelta(text, fullText);
            }

            // 检查是否结束（finish_reason）
            const finishReason = data?.choices?.[0]?.finish_reason;
            if (finishReason === "stop" || finishReason === "length") {
              if (onComplete) onComplete(fullText);
              break;
            }
          }
          // hunyuan-exp 格式：事件类型格式
          else if (response.eventStream) {
            const data = typeof event === "string" ? JSON.parse(event) : event;

            // 调用事件回调
            if (onEvent) onEvent(data);

            // 处理文本增量
            if (data.type === "TEXT_MESSAGE_DELTA" && data.delta) {
              fullText += data.delta;
              if (onTextDelta) onTextDelta(data.delta, fullText);
            }

            // 处理文本内容（非增量）
            if (data.type === "TEXT_MESSAGE_CONTENT" && data.content) {
              fullText = data.content;
              if (onTextDelta) onTextDelta(data.content, fullText);
            }

            // 处理运行完成
            if (data.type === "RUN_FINISHED") {
              if (onComplete) onComplete(fullText);
              break;
            }

            // 处理错误
            if (data.type === "RUN_ERROR") {
              if (onError) onError(data.message);
              break;
            }
          }
          // textStream 返回的是纯文本片段
          else if (response.textStream) {
            const textChunk = event;
            fullText += textChunk;

            if (onTextDelta) onTextDelta(textChunk, fullText);
          }
        } catch (parseError) {
          console.error("解析流式数据失败:", parseError);
          // 继续处理下一个事件
        }
      }

      // 如果循环正常结束但没有触发完成事件，也调用完成回调
      if (onComplete && fullText) {
        onComplete(fullText);
      }

      return { text: fullText, reasoning: fullReasoning };
    } catch (error) {
      console.error("处理流式响应失败:", error);
      if (onError) onError(error.message);
      throw error;
    }
  }

  // 延迟函数
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 检查云开发AI+是否可用
  async checkAvailability() {
    try {
      let sdkVersion = '3.0.0';
      if (typeof wx.getWindowInfo === 'function') {
        const windowInfo = wx.getWindowInfo();
        sdkVersion = windowInfo.SDKVersion || sdkVersion;
      } else if (typeof wx.getSystemInfoSync === 'function') {
        const systemInfo = wx.getSystemInfoSync();
        sdkVersion = systemInfo.SDKVersion || sdkVersion;
      }

      const versionNum = parseFloat(sdkVersion);
      if (versionNum < 3.7) {
        return {
          available: false,
          reason: `基础库版本过低 (${sdkVersion} < 3.7.1)`,
        };
      }

      if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
        return {
          available: false,
          reason: "云开发AI+能力未启用",
        };
      }

      // 检查可用的模型提供商
      const providers = [];

      // 检查 hunyuan-exp 是否可用
      try {
        wx.cloud.extend.AI.createModel("hunyuan-exp");
        providers.push("hunyuan-exp");
      } catch (e) {
        console.warn("hunyuan-exp 不可用:", e.message);
      }

      // 检查 cloudbase 是否可用
      try {
        wx.cloud.extend.AI.createModel("cloudbase");
        providers.push("cloudbase");
      } catch (e) {
        console.warn("cloudbase 不可用:", e.message);
      }

      if (providers.length === 0) {
        return {
          available: false,
          reason: "无可用 AI 模型提供商",
        };
      }

      return {
        available: true,
        version: sdkVersion,
        providers: providers,
      };
    } catch (error) {
      return {
        available: false,
        reason: error.message,
      };
    }
  }
}

module.exports = TextGeneratorCloud;
