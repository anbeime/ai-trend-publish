// config.js - 配置管理模块
const API_CONFIG_KEY = "ai_api_config";
const QWEN_CONFIG_KEY = "qwen_config";

// 智谱AI的GLM模型列表
const GLM_MODELS = [
  {
    id: "glm-4.7-flash",
    name: "glm-4.7-flash",
    desc: "最新超快速模型，推荐日常使用",
    free: true,
    speed: "极快",
    quality: "优秀",
    multimodal: false,
    recommended: true
  },
  {
    id: "glm-4.6v-flash",
    name: "glm-4.6v-flash",
    desc: "多模态理解模型，支持图像理解",
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
];

// 图像生成模型配置
const IMAGE_MODELS = [
  {
    id: "cogview-3-flash",
    name: "cogview-3-flash",
    desc: "高速图像生成模型，免费额度",
    free: true,
    quality: "优秀",
    speed: "中等",
    recommended: true
  },
];

// 视频生成模型配置（阿里云通义万相）
const VIDEO_MODELS = [
  {
    id: "wan2.6-i2v",
    name: "wan2.6-i2v",
    desc: "图生视频，支持参考图片和音频",
    free: false,
    quality: "优秀",
    supportsImage: true,
    supportsAudio: true,
    recommended: true
  },
  {
    id: "wan2.6-t2v",
    name: "wan2.6-t2v",
    desc: "文生视频，纯文本生成",
    free: false,
    quality: "优秀",
    supportsImage: false,
    supportsAudio: false,
  },
  {
    id: "wan2.6-r2v-flash",
    name: "wan2.6-r2v-flash",
    desc: "快速文生视频",
    free: false,
    quality: "良好",
    supportsImage: false,
    supportsAudio: true,
  },
];

// TTS 音色配置
const TTS_VOICES = [
  { id: "longanyang", name: "龙昂扬", desc: "通用音色", gender: "neutral", recommended: true },
  { id: "longxiaochun_v2", name: "龙小春v2", desc: "温柔女声", gender: "female" },
  { id: "longwan_v2", name: "龙婉v2", desc: "知性女声", gender: "female" },
  { id: "longshuo_v2", name: "龙硕v2", desc: "磁性男声", gender: "male" },
  { id: "longteng_v2", name: "龙腾v2", desc: "活力男声", gender: "male" },
];

// 默认模型
const DEFAULT_TEXT_MODEL = "glm-4.7-flash";
const DEFAULT_IMAGE_MODEL = "cogview-3-flash";
const DEFAULT_MULTIMODAL_MODEL = "glm-4.6v-flash";
const DEFAULT_VIDEO_MODEL = "wan2.6-i2v";
const DEFAULT_TTS_VOICE = "longanyang";

class ConfigManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.glmModels = GLM_MODELS;
    this.imageModels = IMAGE_MODELS;
    this.videoModels = VIDEO_MODELS;
    this.ttsVoices = TTS_VOICES;
  }

  /**
   * 加载 GLM API 配置
   */
  loadAPIConfig() {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};

    // 设置默认值
    if (!apiConfig.glmModel) {
      apiConfig.glmModel = DEFAULT_TEXT_MODEL;
    }
    if (!apiConfig.imageModel) {
      apiConfig.imageModel = DEFAULT_IMAGE_MODEL;
    }
    if (!apiConfig.multimodalModel) {
      apiConfig.multimodalModel = DEFAULT_MULTIMODAL_MODEL;
    }

    return apiConfig;
  }

  /**
   * 加载阿里云 DashScope API 配置（用于视频生成和TTS）
   */
  loadQwenConfig() {
    const qwenConfig = wx.getStorageSync(QWEN_CONFIG_KEY) || {};

    // 设置默认值
    if (!qwenConfig.videoModel) {
      qwenConfig.videoModel = DEFAULT_VIDEO_MODEL;
    }
    if (!qwenConfig.ttsVoice) {
      qwenConfig.ttsVoice = DEFAULT_TTS_VOICE;
    }

    return qwenConfig;
  }

  /**
   * 保存 GLM API 配置
   */
  saveAPIConfig(config) {
    wx.setStorageSync(API_CONFIG_KEY, config);
    console.log("[Config] GLM 配置已保存");
  }

  /**
   * 保存阿里云 DashScope 配置
   */
  saveQwenConfig(config) {
    wx.setStorageSync(QWEN_CONFIG_KEY, config);
    console.log("[Config] DashScope 配置已保存");
  }

  /**
   * 检查是否已配置 GLM API Key
   */
  isGLMConfigured() {
    const config = this.loadAPIConfig();
    return !!config.glmApiKey;
  }

  /**
   * 检查是否已配置 DashScope API Key
   */
  isQwenConfigured() {
    const config = this.loadQwenConfig();
    return !!config.apiKey;
  }

  /**
   * 获取 GLM API Key
   */
  getGLMApiKey() {
    const config = this.loadAPIConfig();
    return config.glmApiKey || "";
  }

  /**
   * 获取 DashScope API Key
   */
  getQwenApiKey() {
    const config = this.loadQwenConfig();
    return config.apiKey || "";
  }

  /**
   * 显示配置对话框 - 统一入口
   */
  showConfigDialog() {
    const items = [
      "智谱 GLM API 配置",
      "阿里云 DashScope API 配置",
      "查看当前配置",
    ];

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.showGLMConfigDialog();
            break;
          case 1:
            this.showQwenConfigDialog();
            break;
          case 2:
            this.showCurrentConfig();
            break;
        }
      },
    });
  }

  /**
   * 显示 GLM 配置对话框
   */
  showGLMConfigDialog() {
    const config = this.loadAPIConfig();
    const currentKey = config.glmApiKey || "";
    const maskedKey = currentKey ? `${currentKey.substring(0, 8)}...${currentKey.substring(currentKey.length - 4)}` : "未配置";

    wx.showModal({
      title: "智谱 GLM API 配置",
      editable: true,
      placeholderText: "请输入 API Key (如: 4db0d992xxx...)",
      content: `当前状态: ${currentKey ? "已配置 " + maskedKey : "未配置"}\n\n获取方式:\n1. 访问 https://open.bigmodel.cn/\n2. 注册/登录账号\n3. 进入控制台获取 API Key\n\n支持模型:\n- glm-4.7-flash (文本)\n- glm-4.6v-flash (多模态)\n- cogview-3-flash (图像)`,
      success: (res) => {
        if (res.confirm && res.content) {
          const newKey = res.content.trim();
          this.saveAPIConfig({
            ...config,
            glmApiKey: newKey,
          });
          wx.showToast({ title: "GLM 配置已保存", icon: "success" });
        }
      },
    });
  }

  /**
   * 显示阿里云 DashScope 配置对话框
   */
  showQwenConfigDialog() {
    const config = this.loadQwenConfig();
    const currentKey = config.apiKey || "";
    const maskedKey = currentKey ? `${currentKey.substring(0, 8)}...${currentKey.substring(currentKey.length - 4)}` : "未配置";

    wx.showModal({
      title: "阿里云 DashScope API 配置",
      editable: true,
      placeholderText: "请输入 API Key (如: sk-xxx...)",
      content: `当前状态: ${currentKey ? "已配置 " + maskedKey : "未配置"}\n\n获取方式:\n1. 访问 https://dashscope.console.aliyun.com/\n2. 开通 DashScope 服务\n3. 创建 API Key\n\n支持功能:\n- 通义万相视频生成\n- CosyVoice TTS配音`,
      success: (res) => {
        if (res.confirm && res.content) {
          const newKey = res.content.trim();
          this.saveQwenConfig({
            ...config,
            apiKey: newKey,
          });
          wx.showToast({ title: "DashScope 配置已保存", icon: "success" });
        }
      },
    });
  }

  /**
   * 显示当前配置
   */
  showCurrentConfig() {
    const glmConfig = this.loadAPIConfig();
    const qwenConfig = this.loadQwenConfig();

    const glmStatus = glmConfig.glmApiKey ? "已配置" : "未配置";
    const qwenStatus = qwenConfig.apiKey ? "已配置" : "未配置";

    wx.showModal({
      title: "当前配置",
      content: `智谱 GLM API: ${glmStatus}\n模型: ${glmConfig.glmModel || DEFAULT_TEXT_MODEL}\n\n阿里云 DashScope: ${qwenStatus}\n视频模型: ${qwenConfig.videoModel || DEFAULT_VIDEO_MODEL}\nTTS音色: ${qwenConfig.ttsVoice || DEFAULT_TTS_VOICE}`,
      confirmText: "修改配置",
      cancelText: "关闭",
      success: (res) => {
        if (res.confirm) {
          this.showConfigDialog();
        }
      },
    });
  }

  /**
   * 获取当前文本模型
   */
  getCurrentModel() {
    const config = this.loadAPIConfig();
    return this.glmModels.find(m => m.id === config.glmModel) || this.glmModels[0];
  }

  /**
   * 获取当前图像模型
   */
  getCurrentImageModel() {
    const config = this.loadAPIConfig();
    return this.imageModels.find(m => m.id === config.imageModel) || this.imageModels[0];
  }

  /**
   * 获取当前视频模型
   */
  getCurrentVideoModel() {
    const config = this.loadQwenConfig();
    return this.videoModels.find(m => m.id === config.videoModel) || this.videoModels[0];
  }

  /**
   * 显示模型选择器
   */
  showModelSelector() {
    const config = this.loadAPIConfig();
    const currentModel = config.glmModel || DEFAULT_TEXT_MODEL;

    const items = this.glmModels.map(m =>
      `${m.name}${m.free ? " [免费]" : ""}${m.recommended ? " 推荐" : ""}`
    );

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selected = this.glmModels[res.tapIndex];
        if (selected.id !== currentModel) {
          this.saveAPIConfig({
            ...config,
            glmModel: selected.id,
          });
          wx.showToast({ title: `已切换到 ${selected.name}`, icon: "success" });
        }
      },
    });
  }

  /**
   * 显示视频模型选择器
   */
  showVideoModelSelector() {
    const config = this.loadQwenConfig();
    const currentModel = config.videoModel || DEFAULT_VIDEO_MODEL;

    const items = this.videoModels.map(m =>
      `${m.name}${m.recommended ? " 推荐" : ""} - ${m.desc}`
    );

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selected = this.videoModels[res.tapIndex];
        if (selected.id !== currentModel) {
          this.saveQwenConfig({
            ...config,
            videoModel: selected.id,
          });
          wx.showToast({ title: `已切换到 ${selected.name}`, icon: "success" });
        }
      },
    });
  }

  /**
   * 显示 TTS 音色选择器
   */
  showTTSVoiceSelector() {
    const config = this.loadQwenConfig();
    const currentVoice = config.ttsVoice || DEFAULT_TTS_VOICE;

    const items = this.ttsVoices.map(v =>
      `${v.name}${v.recommended ? " 推荐" : ""} - ${v.desc}`
    );

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selected = this.ttsVoices[res.tapIndex];
        if (selected.id !== currentVoice) {
          this.saveQwenConfig({
            ...config,
            ttsVoice: selected.id,
          });
          wx.showToast({ title: `已切换到 ${selected.name}`, icon: "success" });
        }
      },
    });
  }
}

// 导出常量和类
module.exports = ConfigManager;
module.exports.API_CONFIG_KEY = API_CONFIG_KEY;
module.exports.QWEN_CONFIG_KEY = QWEN_CONFIG_KEY;
module.exports.DEFAULT_TEXT_MODEL = DEFAULT_TEXT_MODEL;
module.exports.DEFAULT_IMAGE_MODEL = DEFAULT_IMAGE_MODEL;
module.exports.DEFAULT_VIDEO_MODEL = DEFAULT_VIDEO_MODEL;
module.exports.DEFAULT_TTS_VOICE = DEFAULT_TTS_VOICE;
