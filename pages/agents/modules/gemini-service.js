// gemini-service.js
// Gemini API服务模块（VIP功能）
const GEMINI_CONFIG_KEY = "ai_gemini_config";

// 默认配置
const DEFAULT_GEMINI_CONFIG = {
  apiKey: "",
  endpoint: "http://localhost:8000/v1/chat/completions",
  enabled: false, // 默认禁用，VIP用户可启用
  model: "gemini-2.5-flash",
  supportedAgents: ["scriptWriter", "trendHunter", "qualityChecker", "platformAdapter"],
};

class GeminiService {
  constructor(pageContext) {
    this.page = pageContext;
    this.config = null;
  }

  /**
   * 初始化服务，加载配置
   */
  init() {
    this.loadConfig();
  }

  /**
   * 加载Gemini配置
   */
  loadConfig() {
    try {
      const config = wx.getStorageSync(GEMINI_CONFIG_KEY);
      if (config && config.apiKey !== undefined) {
        this.config = config;
        this.page.setData({ geminiConfig: config });
        console.log("✅ Gemini配置加载成功");
      } else {
        // 使用默认配置
        this.config = { ...DEFAULT_GEMINI_CONFIG };
        this.page.setData({ geminiConfig: this.config });
        console.log("📋 使用默认Gemini配置");
      }
    } catch (error) {
      console.error("❌ 加载Gemini配置失败:", error);
      this.config = { ...DEFAULT_GEMINI_CONFIG };
      this.page.setData({ geminiConfig: this.config });
    }
  }

  /**
   * 保存Gemini配置
   * @param {Object} config - 配置对象
   */
  saveConfig(config) {
    try {
      wx.setStorageSync(GEMINI_CONFIG_KEY, config);
      this.config = config;
      this.page.setData({ geminiConfig: config });
      
      wx.showToast({
        title: "Gemini配置已保存",
        icon: "success",
      });
      
      console.log("✅ Gemini配置保存成功");
      return true;
    } catch (error) {
      console.error("❌ 保存Gemini配置失败:", error);
      wx.showToast({
        title: "保存配置失败",
        icon: "error",
      });
      return false;
    }
  }

  /**
   * 检查是否启用Gemini服务
   * @returns {Boolean}
   */
  isEnabled() {
    return this.config && this.config.enabled === true;
  }

  /**
   * 检查智能体是否支持Gemini备用
   * @param {String} agentType - 智能体类型
   * @returns {Boolean}
   */
  isAgentSupported(agentType) {
    if (!this.config || !this.config.supportedAgents) {
      return false;
    }
    return this.config.supportedAgents.includes(agentType);
  }

  /**
   * 调用Gemini文本生成API
   * @param {String} agentType - 智能体类型
   * @param {String} userMessage - 用户消息
   * @param {Array} context - 上下文消息数组
   * @param {Object} mediaInfo - 媒体信息
   * @returns {Promise}
   */
  callTextAPI(agentType, userMessage, context, mediaInfo) {
    if (!this.isEnabled()) {
      return Promise.reject(new Error("Gemini服务未启用"));
    }

    if (!this.isAgentSupported(agentType)) {
      return Promise.reject(new Error(`智能体 ${agentType} 不支持Gemini备用`));
    }

    console.log(`🔮 调用Gemini API - 智能体: ${agentType}, 模型: ${this.config.model}`);

    // 构建消息数组
    const messages = [...context, { role: "user", content: userMessage }];

    return new Promise((resolve, reject) => {
      wx.request({
        url: this.config.endpoint,
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Authorization": this.config.apiKey ? `Bearer ${this.config.apiKey}` : "",
        },
        data: {
          model: this.config.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 5000,
        },
        timeout: 60000,
        success: (res) => {
          console.log("🔮 Gemini API响应:", { statusCode: res.statusCode, hasData: !!res.data });

          if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
            console.log("✅ Gemini文本生成成功");
            resolve({
              content: res.data.choices[0].message.content,
              model: this.config.model,
              provider: "gemini",
            });
          } else {
            const errorMsg = res.data?.error?.message || "Gemini API调用失败";
            console.error("❌ Gemini API失败:", errorMsg);
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error("❌ Gemini API请求失败:", err);
          reject(new Error(`Gemini API请求失败: ${err.errMsg || "网络错误"}`));
        },
      });
    });
  }

  /**
   * 切换Gemini启用状态
   */
  toggleEnabled() {
    if (!this.config) {
      console.error("❌ Gemini配置未初始化");
      return;
    }

    const newEnabled = !this.config.enabled;
    const newConfig = { ...this.config, enabled: newEnabled };
    
    this.saveConfig(newConfig);
    
    wx.showToast({
      title: newEnabled ? "Gemini已启用" : "Gemini已禁用",
      icon: "success",
    });
  }

  /**
   * 切换Gemini模型
   */
  switchModel() {
    if (!this.config) {
      console.error("❌ Gemini配置未初始化");
      return;
    }

    const currentModel = this.config.model;
    const newModel = currentModel === "gemini-2.5-flash" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    const modelName = newModel === "gemini-2.5-flash" ? "Gemini 2.5 Flash (快速)" : "Gemini 2.5 Pro (高级)";

    const newConfig = { ...this.config, model: newModel };
    this.saveConfig(newConfig);

    wx.showToast({
      title: `已切换到${modelName}`,
      icon: "success",
    });
  }

  /**
   * 显示Gemini配置对话框
   */
  showConfigDialog() {
    if (!this.config) {
      console.error("❌ Gemini配置未初始化");
      return;
    }

    const statusText = this.config.enabled ? "已启用" : "未启用";
    const modelName = this.config.model === "gemini-2.5-flash" 
      ? "Gemini 2.5 Flash (快速)" 
      : "Gemini 2.5 Pro (高级)";

    wx.showModal({
      title: "Gemini配置 (VIP功能)",
      content: `状态: ${statusText}\n模型: ${modelName}\n端点: ${this.config.endpoint}`,
      showCancel: true,
      cancelText: "取消",
      confirmText: "切换状态",
      success: (res) => {
        if (res.confirm) {
          this.toggleEnabled();
        }
      },
    });
  }

  /**
   * 获取当前配置
   * @returns {Object}
   */
  getConfig() {
    return this.config ? { ...this.config } : { ...DEFAULT_GEMINI_CONFIG };
  }
}

module.exports = GeminiService;
