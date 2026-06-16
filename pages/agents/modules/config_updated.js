// pages/agents/modules/config.js - 配置管理模块（添加glm-4.7-flash支持）
const API_CONFIG_KEY = "ai_api_config";

class ConfigManager {
  constructor(pageContext) {
    this.page = pageContext;
    
    // 支持的GLM模型列表
    this.glmModels = [
      {
        id: "glm-4.7-flash",
        name: "glm-4.7-flash",
        desc: "免费高速模型，适合日常使用",
        free: true,
        speed: "极快",
        quality: "良好",
      },
      {
        id: "glm-4.6v-flash",
        name: "glm-4.6v-flash",
        desc: "高性能模型，效果更好",
        free: false,
        speed: "快",
        quality: "优秀",
      },
      {
        id: "glm-4.6v-flash",
        name: "glm-4.6v-flash",
        desc: "标准模型，平衡性能和效果",
        free: false,
        speed: "中等",
        quality: "优秀",
      },
    ];
  }

  loadAPIConfig() {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};

    // 如果没有配置模型，默认使用免费的glm-4.7-flash
    if (!apiConfig.glmModel) {
      apiConfig.glmModel = "glm-4.6v-flash";
    }

    // 检查API Key是否配置
    if (!apiConfig.glmApiKey) {
      this.page.setData({ apiConfigured: false });
      console.warn("GLM API Key未配置");
      return apiConfig;
    }

    this.page.setData({ apiConfigured: true });
    return apiConfig;
  }

  saveAPIConfig(config) {
    // 确保有默认模型
    if (!config.glmModel) {
      config.glmModel = "glm-4.6v-flash";
    }
    
    wx.setStorageSync(API_CONFIG_KEY, config);
    this.page.setData({ apiConfigured: true });
    wx.showToast({ title: "配置已保存", icon: "success" });
  }

  showConfigDialog() {
    const apiConfig = this.loadAPIConfig();
    const modelInfo = this.glmModels.find(m => m.id === apiConfig.glmModel) || this.glmModels[0];
    
    wx.showModal({
      title: "API配置",
      content: `当前配置: ${apiConfig.glmApiKey ? "已配置" : "未配置"}\n当前模型: ${modelInfo.name}${modelInfo.free ? " (免费)" : ""}`,
      confirmText: "修改配置",
      cancelText: "切换模型",
      success: (res) => {
        if (res.confirm) {
          this.showGLMConfigDialog();
        } else if (res.cancel) {
          this.showModelSelector();
        }
      },
    });
  }

  showGLMConfigDialog() {
    const apiConfig = this.loadAPIConfig();
    
    wx.showModal({
      title: "智谱GLM配置",
      editable: true,
      placeholderText: "请输入API Key",
      content: `请输入您的智谱AI API Key\n\n获取地址：https://open.bigmodel.cn/\n注册后即可获得免费额度\n\n推荐使用免费的glm-4.7-flash模型`,
      success: (res) => {
        if (res.confirm && res.content) {
          const newConfig = {
            ...apiConfig,
            glmApiKey: res.content.trim(),
            glmModel: apiConfig.glmModel || "glm-4.6v-flash",
          };
          this.saveAPIConfig(newConfig);
          
          // 提示用户可以切换模型
          setTimeout(() => {
            wx.showModal({
              title: "配置成功",
              content: `已保存API Key\n当前模型：${newConfig.glmModel}\n\n是否要切换模型？`,
              confirmText: "切换模型",
              cancelText: "稍后再说",
              success: (res2) => {
                if (res2.confirm) {
                  this.showModelSelector();
                }
              }
            });
          }, 500);
        }
      },
    });
  }

  showModelSelector() {
    const apiConfig = this.loadAPIConfig();
    const currentModel = apiConfig.glmModel || "glm-4.6v-flash";
    
    const items = this.glmModels.map(m => 
      `${m.name}${m.free ? " 🆓" : ""}\n${m.desc}\n速度:${m.speed} 质量:${m.quality}`
    );
    
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selectedModel = this.glmModels[res.tapIndex];
        if (selectedModel.id !== currentModel) {
          const newConfig = {
            ...apiConfig,
            glmModel: selectedModel.id,
          };
          this.saveAPIConfig(newConfig);
          
          wx.showToast({
            title: `已切换到${selectedModel.name}`,
            icon: "success",
          });
        }
      },
    });
  }

  showCurrentConfig() {
    const config = this.loadAPIConfig();
    const modelInfo = this.glmModels.find(m => m.id === config.glmModel) || this.glmModels[0];
    
    wx.showModal({
      title: "当前配置",
      content: `API Key: ${config.glmApiKey ? "已配置" : "未配置"}\n\n模型: ${modelInfo.name}\n描述: ${modelInfo.desc}\n速度: ${modelInfo.speed}\n质量: ${modelInfo.quality}\n${modelInfo.free ? " 免费模型" : "💎 付费模型"}`,
      confirmText: "修改",
      cancelText: "关闭",
      success: (res) => {
        if (res.confirm) {
          this.showConfigDialog();
        }
      }
    });
  }

  // 获取当前模型信息
  getCurrentModel() {
    const config = this.loadAPIConfig();
    return this.glmModels.find(m => m.id === config.glmModel) || this.glmModels[0];
  }

  // 检查是否使用免费模型
  isUsingFreeModel() {
    const model = this.getCurrentModel();
    return model.free;
  }
}

module.exports = ConfigManager;
