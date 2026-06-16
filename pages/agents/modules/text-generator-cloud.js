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
        const env = apiConfig.env || "invideo-6gidgilyee392cc8";

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
  async streamText(messages, options = {}) {
    // 检查混元配置是否启用
    const hunyuanConfig = this.page.data.hunyuanConfig || { enabled: false };
    if (!hunyuanConfig.enabled) {
      console.log("混元API未启用，降级到其他模型...");
      throw new Error("CLOUD_AI_NOT_AVAILABLE");
    }

    const {
      model = "hunyuan-turbos-latest",
      temperature = 0.7,
      maxTokens = 5000,
    } = options;

    console.log("调用云开发AI+流式文本生成:", {
      model,
      messageCount: messages.length,
      temperature,
    });

    try {
      // 检查模型是否已初始化
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

      console.log("流式响应创建成功");

      // 返回流式迭代器
      return {
        success: true,
        textStream: response.textStream,
        eventStream: response.eventStream,
      };
    } catch (error) {
      console.error("云开发流式文本生成错误:", error);

      if (error.message === "CLOUD_AI_NOT_AVAILABLE") {
        throw error; // 让调用方处理降级
      }

      throw new Error(`流式文本生成失败: ${error.message}`);
    }
  }

  // 非流式生成文本（支持模板系统）
  async generateText(messages, options = {}) {
    // 检查混元配置是否启用
    const hunyuanConfig = this.page.data.hunyuanConfig || { enabled: false };
    if (!hunyuanConfig.enabled) {
      console.log("混元API未启用，降级到其他模型...");
      throw new Error("CLOUD_AI_NOT_AVAILABLE");
    }

    const {
      model = "hunyuan-turbos-latest",
      temperature = 0.7,
      maxTokens = 5000,
      agentType = "text",
      promptVersion = "v1",
      templateVariables = {},
      customPromptExtension = "",
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
        // 降级使用原始消息
      }
    }

    console.log("调用云开发AI+文本生成:", {
      model,
      messageCount: messages.length,
    });

    try {
      // 检查模型是否已初始化
      if (!this.initialized) {
        const initSuccess = await this.init();
        if (!initSuccess) {
          throw new Error("CLOUD_AI_NOT_AVAILABLE");
        }
      }

      // 创建模型实例
      const aiModel = wx.cloud.extend.AI.createModel("hunyuan-exp");

      // 调用生成接口
      const response = await aiModel.generateText({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      console.log("文本生成成功");

      // 检查响应结构
      const content = response.choices?.[0]?.message?.content || "";

      if (!content) {
        console.error("响应结构异常:", response);
        throw new Error("AI响应格式错误");
      }

      return {
        success: true,
        content: content,
        fullResponse: response,
      };
    } catch (error) {
      console.error("云开发文本生成错误:", error);

      if (error.message === "CLOUD_AI_NOT_AVAILABLE") {
        throw error; // 让调用方处理降级
      }

      throw new Error(`文本生成失败: ${error.message}`);
    }
  }

  // 流式响应处理器（简化版）
  async processStream(response, callbacks = {}) {
    const { onTextDelta, onEvent, onComplete, onError } = callbacks;

    try {
      let fullText = "";

      // 优先使用 eventStream（更完整的数据）
      const stream = response.eventStream || response.textStream;

      if (!stream) {
        throw new Error("无效的流式响应");
      }

      for await (let event of stream) {
        try {
          // eventStream 返回的是完整事件对象
          if (response.eventStream) {
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

      // 如果循环正常结束但没有触发RUN_FINISHED，也调用完成回调
      if (onComplete && fullText) {
        onComplete(fullText);
      }

      return fullText;
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
      const systemInfo = wx.getSystemInfoSync();
      const versionNum = parseFloat(systemInfo.SDKVersion);

      if (versionNum < 3.7) {
        return {
          available: false,
          reason: `基础库版本过低 (${systemInfo.SDKVersion} < 3.7.1)`,
        };
      }

      if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
        return {
          available: false,
          reason: "云开发AI+能力未启用",
        };
      }

      return {
        available: true,
        version: systemInfo.SDKVersion,
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
