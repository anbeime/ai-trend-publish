// config.js
const API_CONFIG_KEY = "ai_api_config";

// 智谱AI的GLM模型列表
const GLM_MODELS = [
  {
    id: "glm-4.7-flash",
    name: "glm-4.7-flash",
    desc: "🚀 最新超快速模型，推荐日常使用",
    free: true,
    speed: "极快",
    quality: "优秀",
    multimodal: false,
    recommended: true
  },
  {
    id: "glm-4.6v-flash",
    name: "glm-4.6v-flash",
    desc: " 多模态理解模型，支持图像理解",
    free: true,
    speed: "极快",
    quality: "优秀",
    multimodal: true,
    recommended: true
  },
  {
    id: "glm-4.5-air",
    name: "glm-4.5-air",
    desc: "高速生成模型，稳定输出",
    free: true,
    speed: "极快",
    quality: "良好",
    multimodal: false
  },
  {
    id: "glm-4.6v-flash",
    name: "glm-4.6v-flash",
    desc: "标准模型，兼顾速度和性能",
    free: false,
    speed: "中等",
    quality: "卓越",
    multimodal: false
  },
  {
    id: "glm-4.6v-flash",
    name: "glm-4.6v-flash",
    desc: "多模态大模型，支持图像理解",
    free: false,
    speed: "中等",
    quality: "卓越",
    multimodal: true
  },
];

// 图像生成模型配置
const IMAGE_MODELS = [
  {
    id: "cogview-3-flash",
    name: "cogview-3-flash",
    desc: "🎨 高速图像生成模型，免费额度",
    free: true,
    quality: "优秀",
    speed: "中等",
    recommended: true
  },
  {
    id: "cogview-3-flash",
    name: "cogview-3-flash",
    desc: "快速图像输出模型",
    free: true,
    quality: "良好",
    speed: "极快"
  }
];

// 默认模型（使用免费最新模型）
const DEFAULT_TEXT_MODEL = "glm-4.7-flash";
const DEFAULT_IMAGE_MODEL = "cogview-3-flash";
const DEFAULT_MULTIMODAL_MODEL = "glm-4.6v-flash";

class ConfigManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.glmModels = GLM_MODELS;
    this.imageModels = IMAGE_MODELS;
  }

  loadAPIConfig() {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};

    // 检查并升级到新免费模型
    if (!apiConfig.glmModel || apiConfig.glmModel === "4.6v-flash") {
      apiConfig.glmModel = DEFAULT_TEXT_MODEL;
      console.log("✓ 已自动升级到 glm-4.7-flash");
    }

    // 设置默认图像生成模型
    if (!apiConfig.imageModel) {
      apiConfig.imageModel = DEFAULT_IMAGE_MODEL;
    }

    // 设置默认多模态模型
    if (!apiConfig.multimodalModel) {
      apiConfig.multimodalModel = DEFAULT_MULTIMODAL_MODEL;
    }

    // 如果还未配置用户配置的API Key，则视为已配置（使用内置Key）
    if (!apiConfig.glmApiKey) {
      console.log("🔑 使用默认API Key，但用户可配置专属Key");
      this.page.setData({ apiConfigured: true, usingDefaultKey: true });
    } else {
      console.log("✓ 使用用户配置的API Key");
      this.page.setData({ apiConfigured: true, usingDefaultKey: false });
    }

    return apiConfig;
  }

  saveAPIConfig(config) {
    if (!config.glmModel) {
      config.glmModel = DEFAULT_TEXT_MODEL;
    }
    if (!config.imageModel) {
      config.imageModel = DEFAULT_IMAGE_MODEL;
    }
    if (!config.multimodalModel) {
      config.multimodalModel = DEFAULT_MULTIMODAL_MODEL;
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
      content: `API Key: ${apiConfig.glmApiKey ? "已配置" : "未配置"}\n当前模型: ${modelInfo.name}${modelInfo.free ? " (免费)" : ""}`,
      confirmText: "更换Key",
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
      placeholderText: "请输入API Key (sk-xxx...)",
      content: "🔑 当前使用默认Key，可直接使用\n如需配置专属Key：\n\n🎁 获取免费额度：https://open.bigmodel.cn/\n注册后即可获得免费额度，可以使用以下模型：\n• glm-4.7-flash (文本)\n• glm-4.6v-flash (多模态)\n• cogview-3-flash (图像)\n\n否则继续使用预设Key",
      success: (res) => {
        if (res.confirm) {
          const newKey = res.content ? res.content.trim() : "";
          this.saveAPIConfig({
            ...apiConfig,
            glmApiKey: newKey,
            glmModel: apiConfig.glmModel || DEFAULT_TEXT_MODEL,
            imageModel: apiConfig.imageModel || DEFAULT_IMAGE_MODEL,
            multimodalModel: apiConfig.multimodalModel || DEFAULT_MULTIMODAL_MODEL,
          });

          if (newKey) {
            wx.showToast({ title: "已配置专属Key", icon: "success" });
          } else {
            wx.showToast({ title: "继续使用默认Key", icon: "success" });
          }
        }
      },
    });
  }

  showModelSelector() {
    const apiConfig = this.loadAPIConfig();
    const currentModel = apiConfig.glmModel || DEFAULT_MODEL;

    const items = this.glmModels.map(m =>
      `${m.name}${m.free ? " 🆓" : "🎫"}  ${m.desc}`
    );

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selected = this.glmModels[res.tapIndex];
        if (selected.id !== currentModel) {
          this.saveAPIConfig({
            ...apiConfig,
            glmModel: selected.id,
          });
          wx.showToast({ title: `已切换到 ${selected.name}`, icon: "success" });
        }
      },
    });
  }

  showCurrentConfig() {
    const config = this.loadAPIConfig();
    const modelInfo = this.glmModels.find(m => m.id === config.glmModel) || this.glmModels[0];

    wx.showModal({
      title: "当前配置",
      content: `API Key: ${config.glmApiKey ? "已配置" : "未配置"}\n模型: ${modelInfo.name}\n描述: ${modelInfo.desc}\n速度: ${modelInfo.speed} / 质量: ${modelInfo.quality}\n${modelInfo.free ? "✓ 免费" : "🎫 付费"}`,
      confirmText: "更改",
      cancelText: "关闭",
      success: (res) => {
        if (res.confirm) {
          this.showConfigDialog();
        }
      },
    });
  }

  getCurrentModel() {
    const config = this.loadAPIConfig();
    return this.glmModels.find(m => m.id === config.glmModel) || this.glmModels[0];
  }

  getCurrentImageModel() {
    const config = this.loadAPIConfig();
    return this.imageModels.find(m => m.id === config.imageModel) || this.imageModels[0];
  }

  isUsingFreeModel() {
    return this.getCurrentModel().free;
  }

  isUsingFreeImageModel() {
    return this.getCurrentImageModel().free;
  }

  // 显示图像模型选择器
  showImageModelSelector() {
    const apiConfig = this.loadAPIConfig();
    const currentModel = apiConfig.imageModel || DEFAULT_IMAGE_MODEL;

    const items = this.imageModels.map(m =>
      `${m.name}${m.free ? " 🆓" : " 🎫"}${m.recommended ? " ⭐" : ""}  ${m.desc}`
    );

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selected = this.imageModels[res.tapIndex];
        if (selected.id !== currentModel) {
          this.saveAPIConfig({
            ...apiConfig,
            imageModel: selected.id,
          });
          wx.showToast({
            title: `图像模型已切换到 ${selected.name}`,
            icon: "success",
            duration: 5000
          });
        }
      },
    });
  }
}

module.exports = ConfigManager;
