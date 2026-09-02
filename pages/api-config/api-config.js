// pages/api-config/api-config.js
// 管理员 API/模型配置页面
// 复用 ConfigManager 框架 + 扩展 FreeSwitch/混元/MiniMax 配置

const ConfigManager = require('./config-manager-extended.js');

// 尝试加载 secrets.js 中的默认值
let secretsDefaults = {};
try {
  secretsDefaults = require('../../config/secrets.js');
} catch (e) {
  console.warn('[API-Config] secrets.js 加载失败，使用空默认值', e.message);
}

Page({
  data: {
    // 当前激活的标签页
    activeTab: 'freeswitch',

    // ---- 密码可见性 ----
    showFreeswitchToken: false,
    showZhipuKey: false,
    showHunyuanId: false,
    showHunyuanKey: false,
    showMinimaxKey: false,

    // ---- 测试状态 ----
    testingFreeswitch: false,
    testingZhipu: false,
    testingMinimax: false,
    freeswitchTestResult: null,
    zhipuTestResult: null,
    minimaxTestResult: null,

    // ---- FreeSwitch 配置 ----
    freeswitchConfig: {
      gatewayUrl: '',
      primaryModel: 'auto',
      fallbackModel: 'auto',
      freeModel: 'auto',
      userToken: '',
    },

    // ---- 智谱 GLM 配置 ----
    zhipuConfig: {
      apiKey: '',
      glmModel: 'glm-4.7-flash',
      imageModel: 'cogview-3-flash',
    },

    // ---- 混元 AI 配置 ----
    hunyuanConfig: {
      secretId: '',
      secretKey: '',
      enabled: false,
    },

    // ---- MiniMax 配置 ----
    minimaxConfig: {
      apiKey: '',
      groupId: '',
      endpoint: '',
      model: 'MiniMax-Text-01',
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
    },

    // ---- 模型列表 ----
    glmModels: [],
    imageModels: [],
    videoModels: [],
    ttsVoices: [],

    // ---- Qwen (视频/TTS) 配置 ----
    qwenConfig: {
      videoModel: 'wan2.6-i2v',
      ttsVoice: 'longanyang',
    },
  },

  onLoad() {
    this.configManager = new ConfigManager();
    this.loadAllConfig();
  },

  // ========== 加载配置 ==========
  loadAllConfig() {
    const cm = this.configManager;

    // FreeSwitch
    const fsConfig = cm.loadFreeSwitchConfig();
    // 智谱 GLM
    const glmConfig = cm.loadAPIConfig();
    // 混元
    const hyConfig = cm.loadHunyuanConfig();
    // MiniMax
    const mmConfig = cm.loadMinimaxConfig();
    // Qwen (视频/TTS)
    const qwConfig = cm.loadQwenConfig();

    this.setData({
      freeswitchConfig: {
        gatewayUrl: fsConfig.gatewayUrl || (secretsDefaults.freeswitch && secretsDefaults.freeswitch.gatewayUrl) || '',
        primaryModel: fsConfig.primaryModel || (secretsDefaults.freeswitch && secretsDefaults.freeswitch.primaryModel) || 'auto',
        fallbackModel: fsConfig.fallbackModel || (secretsDefaults.freeswitch && secretsDefaults.freeswitch.fallbackModel) || 'auto',
        freeModel: fsConfig.freeModel || (secretsDefaults.freeswitch && secretsDefaults.freeswitch.freeModel) || 'auto',
        userToken: fsConfig.userToken || (secretsDefaults.freeswitch && secretsDefaults.freeswitch.userToken) || '',
      },
      zhipuConfig: {
        apiKey: glmConfig.glmApiKey || (secretsDefaults.zhipu && secretsDefaults.zhipu.apiKey) || '',
        glmModel: glmConfig.glmModel || 'glm-4.7-flash',
        imageModel: glmConfig.imageModel || 'cogview-3-flash',
      },
      hunyuanConfig: {
        secretId: hyConfig.secretId || (secretsDefaults.hunyuan && secretsDefaults.hunyuan.secretId) || '',
        secretKey: hyConfig.secretKey || (secretsDefaults.hunyuan && secretsDefaults.hunyuan.secretKey) || '',
        enabled: hyConfig.enabled !== undefined ? hyConfig.enabled : true,
      },
      minimaxConfig: {
        apiKey: mmConfig.apiKey || (secretsDefaults.minimax && secretsDefaults.minimax.apiKey) || '',
        groupId: mmConfig.groupId || (secretsDefaults.minimax && secretsDefaults.minimax.groupId) || '',
        endpoint: mmConfig.endpoint || (secretsDefaults.minimax && secretsDefaults.minimax.endpoint) || '',
        model: mmConfig.model || (secretsDefaults.minimax && secretsDefaults.minimax.model) || 'MiniMax-Text-01',
        temperature: mmConfig.temperature !== undefined ? mmConfig.temperature : 1,
        top_p: mmConfig.top_p !== undefined ? mmConfig.top_p : 0.95,
        max_tokens: mmConfig.max_tokens !== undefined ? mmConfig.max_tokens : 8192,
      },
      qwenConfig: {
        videoModel: qwConfig.videoModel || 'wan2.6-i2v',
        ttsVoice: qwConfig.ttsVoice || 'longanyang',
      },
      // 模型列表
      glmModels: cm.glmModels,
      imageModels: cm.imageModels,
      videoModels: cm.videoModels,
      ttsVoices: cm.ttsVoices,
    });

    console.log('[API-Config] 配置加载完成');
  },

  // ========== 标签页切换 ==========
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // ========== 密码可见性切换 ==========
  toggleShowToken(e) {
    const field = e.currentTarget.dataset.field;
    const keyMap = {
      freeswitch: 'showFreeswitchToken',
      zhipu: 'showZhipuKey',
      hunyuanId: 'showHunyuanId',
      hunyuanKey: 'showHunyuanKey',
      minimaxKey: 'showMinimaxKey',
    };
    const dataKey = keyMap[field];
    if (dataKey) {
      this.setData({ [dataKey]: !this.data[dataKey] });
    }
  },

  // ========== FreeSwitch 配置 ==========
  onInputFreeswitch(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`freeswitchConfig.${field}`]: e.detail.value,
    });
  },

  saveFreeswitchConfig() {
    const cfg = this.data.freeswitchConfig;
    if (!cfg.gatewayUrl) {
      wx.showToast({ title: '请填写网关地址', icon: 'none' });
      return;
    }
    this.configManager.saveFreeSwitchConfig(cfg);
    wx.showToast({ title: 'FreeSwitch 配置已保存', icon: 'success' });
    console.log('[API-Config] FreeSwitch 配置已保存', cfg);
  },

  async testFreeswitch() {
    const cfg = this.data.freeswitchConfig;
    if (!cfg.gatewayUrl) {
      wx.showToast({ title: '请先填写网关地址', icon: 'none' });
      return;
    }
    this.setData({ testingFreeswitch: true, freeswitchTestResult: null });

    try {
      const url = cfg.gatewayUrl.replace(/\/$/, '') + '/chat/completions';
      const header = { 'Content-Type': 'application/json' };
      if (cfg.userToken) {
        header['Authorization'] = `Bearer ${cfg.userToken}`;
      }

      const result = await new Promise((resolve) => {
        wx.request({
          url: url,
          method: 'POST',
          header: header,
          data: {
            model: cfg.primaryModel || 'auto',
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 50,
            stream: false,
          },
          timeout: 30000,
          success: (res) => {
            if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
              const reply = res.data.choices[0].message?.content || '';
              const model = res.data.model || 'unknown';
              resolve({ success: true, message: `模型: ${model} | 回复: ${reply.substring(0, 80)}` });
            } else {
              resolve({ success: false, error: true, message: `HTTP ${res.statusCode}: ${JSON.stringify(res.data).substring(0, 120)}` });
            }
          },
          fail: (err) => {
            resolve({ success: false, error: true, message: err.errMsg || '请求失败' });
          },
        });
      });

      this.setData({ freeswitchTestResult: result, testingFreeswitch: false });
    } catch (err) {
      this.setData({
        freeswitchTestResult: { success: false, error: true, message: err.message || '未知错误' },
        testingFreeswitch: false,
      });
    }
  },

  // ========== 智谱 GLM 配置 ==========
  onInputZhipu(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`zhipuConfig.${field}`]: e.detail.value,
    });
  },

  selectGLMModel(e) {
    const modelId = e.currentTarget.dataset.modelId;
    this.setData({ 'zhipuConfig.glmModel': modelId });
  },

  selectImageModel(e) {
    const modelId = e.currentTarget.dataset.modelId;
    this.setData({ 'zhipuConfig.imageModel': modelId });
  },

  saveZhipuConfig() {
    const cfg = this.data.zhipuConfig;
    this.configManager.saveAPIConfig({
      glmApiKey: cfg.apiKey,
      glmModel: cfg.glmModel,
      imageModel: cfg.imageModel,
    });
    wx.showToast({ title: '智谱配置已保存', icon: 'success' });
    console.log('[API-Config] 智谱配置已保存', cfg);
  },

  async testZhipu() {
    const cfg = this.data.zhipuConfig;
    if (!cfg.apiKey) {
      wx.showToast({ title: '请先填写 API Key', icon: 'none' });
      return;
    }
    this.setData({ testingZhipu: true, zhipuTestResult: null });

    try {
      const result = await new Promise((resolve) => {
        wx.request({
          url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfg.apiKey}`,
          },
          data: {
            model: cfg.glmModel || 'glm-4.7-flash',
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 50,
          },
          timeout: 30000,
          success: (res) => {
            if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
              const reply = res.data.choices[0].message?.content || '';
              resolve({ success: true, message: `回复: ${reply.substring(0, 80)}` });
            } else {
              resolve({ success: false, error: true, message: `HTTP ${res.statusCode}: ${JSON.stringify(res.data).substring(0, 120)}` });
            }
          },
          fail: (err) => {
            resolve({ success: false, error: true, message: err.errMsg || '请求失败' });
          },
        });
      });

      this.setData({ zhipuTestResult: result, testingZhipu: false });
    } catch (err) {
      this.setData({
        zhipuTestResult: { success: false, error: true, message: err.message || '未知错误' },
        testingZhipu: false,
      });
    }
  },

  // ========== 混元 AI 配置 ==========
  onInputHunyuan(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`hunyuanConfig.${field}`]: e.detail.value,
    });
  },

  toggleHunyuanEnabled(e) {
    this.setData({ 'hunyuanConfig.enabled': e.detail.value });
  },

  saveHunyuanConfig() {
    const cfg = this.data.hunyuanConfig;
    this.configManager.saveHunyuanConfig(cfg);
    wx.showToast({ title: '混元配置已保存', icon: 'success' });
    console.log('[API-Config] 混元配置已保存', cfg);
  },

  // ========== MiniMax 配置 ==========
  onInputMinimax(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;
    // 数值字段转换
    if (field === 'temperature' || field === 'top_p') {
      value = parseFloat(value) || 0;
    } else if (field === 'max_tokens') {
      value = parseInt(value, 10) || 0;
    }
    this.setData({
      [`minimaxConfig.${field}`]: value,
    });
  },

  saveMinimaxConfig() {
    const cfg = this.data.minimaxConfig;
    this.configManager.saveMinimaxConfig(cfg);
    wx.showToast({ title: 'MiniMax 配置已保存', icon: 'success' });
    console.log('[API-Config] MiniMax 配置已保存', cfg);
  },

  async testMinimax() {
    const cfg = this.data.minimaxConfig;
    if (!cfg.apiKey) {
      wx.showToast({ title: '请先填写 API Key', icon: 'none' });
      return;
    }
    this.setData({ testingMinimax: true, minimaxTestResult: null });

    try {
      const endpoint = cfg.endpoint || 'https://api.minimax.chat/v1/text/chatcompletion_v2';
      const result = await new Promise((resolve) => {
        wx.request({
          url: endpoint,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfg.apiKey}`,
          },
          data: {
            model: cfg.model || 'MiniMax-Text-01',
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 50,
          },
          timeout: 30000,
          success: (res) => {
            if (res.statusCode === 200) {
              const reply = res.data.choices?.[0]?.message?.content || res.data.reply || '';
              resolve({ success: true, message: `回复: ${reply.substring(0, 80)}` });
            } else {
              resolve({ success: false, error: true, message: `HTTP ${res.statusCode}: ${JSON.stringify(res.data).substring(0, 120)}` });
            }
          },
          fail: (err) => {
            resolve({ success: false, error: true, message: err.errMsg || '请求失败' });
          },
        });
      });

      this.setData({ minimaxTestResult: result, testingMinimax: false });
    } catch (err) {
      this.setData({
        minimaxTestResult: { success: false, error: true, message: err.message || '未知错误' },
        testingMinimax: false,
      });
    }
  },

  // ========== 视频/TTS 模型选择 ==========
  selectVideoModel(e) {
    const modelId = e.currentTarget.dataset.modelId;
    this.setData({ 'qwenConfig.videoModel': modelId });
  },

  selectTTSVoice(e) {
    const voiceId = e.currentTarget.dataset.voiceId;
    this.setData({ 'qwenConfig.ttsVoice': voiceId });
  },

  saveAllModels() {
    const cm = this.configManager;
    // 保存 GLM 模型
    const glmConfig = cm.loadAPIConfig();
    cm.saveAPIConfig({
      ...glmConfig,
      glmModel: this.data.zhipuConfig.glmModel,
      imageModel: this.data.zhipuConfig.imageModel,
    });
    // 保存 Qwen 模型
    const qwConfig = cm.loadQwenConfig();
    cm.saveQwenConfig({
      ...qwConfig,
      videoModel: this.data.qwenConfig.videoModel,
      ttsVoice: this.data.qwenConfig.ttsVoice,
    });
    wx.showToast({ title: '所有模型选择已保存', icon: 'success' });
    console.log('[API-Config] 所有模型选择已保存');
  },

  // ========== 配置导出/恢复 ==========
  exportConfig() {
    const allConfig = {
      freeswitch: this.data.freeswitchConfig,
      zhipu: this.data.zhipuConfig,
      hunyuan: this.data.hunyuanConfig,
      minimax: this.data.minimaxConfig,
      qwen: this.data.qwenConfig,
      exportTime: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(allConfig, null, 2);
    wx.setClipboardData({
      data: jsonStr,
      success: () => {
        wx.showModal({
          title: '配置已导出',
          content: '配置 JSON 已复制到剪贴板，可粘贴保存。\n\n如需导入，将 JSON 粘贴到剪贴板后点击"恢复默认"上方的导入按钮。',
          showCancel: false,
          confirmText: '知道了',
        });
      },
    });
  },

  resetConfig() {
    wx.showModal({
      title: '恢复默认配置',
      content: '将清除所有自定义配置，恢复到 secrets.js 中的默认值。确定继续？',
      confirmText: '确定恢复',
      cancelText: '取消',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('ai_api_config');
          wx.removeStorageSync('qwen_config');
          wx.removeStorageSync('freeswitch_config');
          wx.removeStorageSync('hunyuan_config');
          wx.removeStorageSync('minimax_config');

          // 重新加载（会从 secrets.js 取默认值）
          this.loadAllConfig();
          wx.showToast({ title: '已恢复默认配置', icon: 'success' });
        }
      },
    });
  },
});
