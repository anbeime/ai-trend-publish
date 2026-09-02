// config-manager-extended.js
// 基于 pages/agents/modules/config.js 的 ConfigManager 框架
// 扩展支持 FreeSwitch / 混元 / MiniMax 配置的本地存储

// ========== 存储键 ==========
const API_CONFIG_KEY = 'ai_api_config';
const QWEN_CONFIG_KEY = 'qwen_config';
const FREESWITCH_CONFIG_KEY = 'freeswitch_config';
const HUNYUAN_CONFIG_KEY = 'hunyuan_config';
const MINIMAX_CONFIG_KEY = 'minimax_config';

// ========== 模型列表（与 config.js 保持一致） ==========

const GLM_MODELS = [
  {
    id: 'glm-4.7-flash',
    name: 'glm-4.7-flash',
    desc: '最新超快速模型，推荐日常使用',
    free: true,
    speed: '极快',
    quality: '优秀',
    multimodal: false,
    recommended: true,
  },
  {
    id: 'glm-4.6v-flash',
    name: 'glm-4.6v-flash',
    desc: '多模态理解模型，支持图像理解',
    free: true,
    speed: '极快',
    quality: '优秀',
    multimodal: true,
    recommended: true,
  },
  {
    id: 'glm-4.5-air',
    name: 'glm-4.5-air',
    desc: '高速生成模型，稳定输出',
    free: true,
    speed: '极快',
    quality: '良好',
    multimodal: false,
  },
];

const IMAGE_MODELS = [
  {
    id: 'cogview-3-flash',
    name: 'cogview-3-flash',
    desc: '高速图像生成模型，免费额度',
    free: true,
    quality: '优秀',
    speed: '中等',
    recommended: true,
  },
];

const VIDEO_MODELS = [
  {
    id: 'wan2.6-i2v',
    name: 'wan2.6-i2v',
    desc: '图生视频，支持参考图片和音频',
    free: false,
    quality: '优秀',
    supportsImage: true,
    supportsAudio: true,
    recommended: true,
  },
  {
    id: 'wan2.6-t2v',
    name: 'wan2.6-t2v',
    desc: '文生视频，纯文本生成',
    free: false,
    quality: '优秀',
    supportsImage: false,
    supportsAudio: false,
  },
  {
    id: 'wan2.6-r2v-flash',
    name: 'wan2.6-r2v-flash',
    desc: '快速文生视频',
    free: false,
    quality: '良好',
    supportsImage: false,
    supportsAudio: true,
  },
];

const TTS_VOICES = [
  { id: 'longanyang', name: '龙昂扬', desc: '通用音色', gender: 'neutral', recommended: true },
  { id: 'longxiaochun_v2', name: '龙小春v2', desc: '温柔女声', gender: 'female' },
  { id: 'longwan_v2', name: '龙婉v2', desc: '知性女声', gender: 'female' },
  { id: 'longshuo_v2', name: '龙硕v2', desc: '磁性男声', gender: 'male' },
  { id: 'longteng_v2', name: '龙腾v2', desc: '活力男声', gender: 'male' },
];

// ========== 默认值 ==========
const DEFAULT_TEXT_MODEL = 'glm-4.7-flash';
const DEFAULT_IMAGE_MODEL = 'cogview-3-flash';
const DEFAULT_MULTIMODAL_MODEL = 'glm-4.6v-flash';
const DEFAULT_VIDEO_MODEL = 'wan2.6-i2v';
const DEFAULT_TTS_VOICE = 'longanyang';

/**
 * 扩展配置管理器
 * 支持本地存储 FreeSwitch / 智谱 / 混元 / MiniMax / Qwen 配置
 * 小程序运行时优先读取本地存储，fallback 到 secrets.js
 */
class ConfigManager {
  constructor() {
    this.glmModels = GLM_MODELS;
    this.imageModels = IMAGE_MODELS;
    this.videoModels = VIDEO_MODELS;
    this.ttsVoices = TTS_VOICES;
  }

  // ====== FreeSwitch ======
  loadFreeSwitchConfig() {
    return wx.getStorageSync(FREESWITCH_CONFIG_KEY) || {};
  }

  saveFreeSwitchConfig(config) {
    wx.setStorageSync(FREESWITCH_CONFIG_KEY, config);
    console.log('[Config] FreeSwitch 配置已保存');
  }

  // ====== 智谱 GLM ======
  loadAPIConfig() {
    const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
    if (!apiConfig.glmModel) apiConfig.glmModel = DEFAULT_TEXT_MODEL;
    if (!apiConfig.imageModel) apiConfig.imageModel = DEFAULT_IMAGE_MODEL;
    if (!apiConfig.multimodalModel) apiConfig.multimodalModel = DEFAULT_MULTIMODAL_MODEL;
    return apiConfig;
  }

  saveAPIConfig(config) {
    wx.setStorageSync(API_CONFIG_KEY, config);
    console.log('[Config] GLM 配置已保存');
  }

  // ====== 混元 ======
  loadHunyuanConfig() {
    return wx.getStorageSync(HUNYUAN_CONFIG_KEY) || {};
  }

  saveHunyuanConfig(config) {
    wx.setStorageSync(HUNYUAN_CONFIG_KEY, config);
    console.log('[Config] 混元配置已保存');
  }

  // ====== MiniMax ======
  loadMinimaxConfig() {
    return wx.getStorageSync(MINIMAX_CONFIG_KEY) || {};
  }

  saveMinimaxConfig(config) {
    wx.setStorageSync(MINIMAX_CONFIG_KEY, config);
    console.log('[Config] MiniMax 配置已保存');
  }

  // ====== Qwen (视频/TTS) ======
  loadQwenConfig() {
    const qwenConfig = wx.getStorageSync(QWEN_CONFIG_KEY) || {};
    if (!qwenConfig.videoModel) qwenConfig.videoModel = DEFAULT_VIDEO_MODEL;
    if (!qwenConfig.ttsVoice) qwenConfig.ttsVoice = DEFAULT_TTS_VOICE;
    return qwenConfig;
  }

  saveQwenConfig(config) {
    wx.setStorageSync(QWEN_CONFIG_KEY, config);
    console.log('[Config] DashScope 配置已保存');
  }
}

module.exports = ConfigManager;
module.exports.API_CONFIG_KEY = API_CONFIG_KEY;
module.exports.QWEN_CONFIG_KEY = QWEN_CONFIG_KEY;
module.exports.FREESWITCH_CONFIG_KEY = FREESWITCH_CONFIG_KEY;
module.exports.HUNYUAN_CONFIG_KEY = HUNYUAN_CONFIG_KEY;
module.exports.MINIMAX_CONFIG_KEY = MINIMAX_CONFIG_KEY;
module.exports.DEFAULT_TEXT_MODEL = DEFAULT_TEXT_MODEL;
module.exports.DEFAULT_IMAGE_MODEL = DEFAULT_IMAGE_MODEL;
module.exports.DEFAULT_VIDEO_MODEL = DEFAULT_VIDEO_MODEL;
module.exports.DEFAULT_TTS_VOICE = DEFAULT_TTS_VOICE;
