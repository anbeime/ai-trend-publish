// API配置检查和引导工具
class ApiConfigHelper {
  constructor() {
    this.storageKey = 'glm_api_key';
  }

  /**
   * 检查API是否已配置
   */
  isConfigured() {
    try {
      const apiKey = wx.getStorageSync(this.storageKey);
      return !!(apiKey && apiKey.trim());
    } catch (error) {
      console.error('检查API配置失败:', error);
      return false;
    }
  }

  /**
   * 获取API密钥
   */
  getApiKey() {
    try {
      return wx.getStorageSync(this.storageKey) || '';
    } catch (error) {
      console.error('获取API密钥失败:', error);
      return '';
    }
  }

  /**
   * 保存API密钥
   */
  saveApiKey(apiKey) {
    try {
      wx.setStorageSync(this.storageKey, apiKey.trim());
      return true;
    } catch (error) {
      console.error('保存API密钥失败:', error);
      return false;
    }
  }

  /**
   * 验证API密钥格式
   */
  validateApiKey(apiKey) {
    if (!apiKey || !apiKey.trim()) {
      return {
        valid: false,
        message: 'API密钥不能为空'
      };
    }

    // GLM API密钥格式：sk- 开头
    if (!apiKey.startsWith('sk-')) {
      return {
        valid: false,
        message: 'API密钥格式错误，应以 sk- 开头'
      };
    }

    if (apiKey.length < 20) {
      return {
        valid: false,
        message: 'API密钥长度不足'
      };
    }

    return {
      valid: true,
      message: 'API密钥格式正确'
    };
  }

  /**
   * 显示配置引导
   * @param {Object} options - 配置选项
   * @param {Boolean} options.force - 是否强制显示（即使已配置）
   * @param {Function} options.onSuccess - 配置成功回调
   * @param {Function} options.onCancel - 取消回调
   */
  showConfigGuide(options = {}) {
    const { force = false, onSuccess, onCancel } = options;

    // 如果已配置且不强制显示，直接返回
    if (!force && this.isConfigured()) {
      if (onSuccess) onSuccess();
      return;
    }

    wx.showModal({
      title: '配置 GLM API 密钥',
      content: '使用分镜图片生成功能需要配置 GLM API 密钥。\n\n1. 访问智谱AI开放平台\n2. 注册/登录账号\n3. 创建API Key\n\n是否现在配置？',
      confirmText: '去配置',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          this.navigateToConfig(onSuccess);
        } else {
          if (onCancel) onCancel();
        }
      }
    });
  }

  /**
   * 跳转到配置页面
   */
  navigateToConfig(callback) {
    wx.navigateTo({
      url: '/pages/api-config/api-config',
      events: {
        // 监听配置成功事件
        configSuccess: (data) => {
          if (callback) callback(data);
        }
      }
    });
  }

  /**
   * 显示快速配置对话框
   */
  showQuickConfig(callback) {
    wx.showModal({
      title: '配置 API 密钥',
      editable: true,
      placeholderText: '请输入 GLM API Key (sk-...)',
      success: (res) => {
        if (res.confirm && res.content) {
          const apiKey = res.content.trim();
          const validation = this.validateApiKey(apiKey);

          if (!validation.valid) {
            wx.showToast({
              title: validation.message,
              icon: 'none',
              duration: 5000
            });
            // 验证失败，重新显示对话框
            setTimeout(() => {
              this.showQuickConfig(callback);
            }, 5000);
            return;
          }

          // 保存API密钥
          if (this.saveApiKey(apiKey)) {
            wx.showToast({
              title: '配置成功',
              icon: 'success'
            });
            if (callback) callback(apiKey);
          } else {
            wx.showToast({
              title: '保存失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  }

  /**
   * 检查并引导配置（在需要使用API时调用）
   * @param {Function} onConfigured - 配置完成后的回调
   * @param {Function} onCancel - 取消配置的回调
   */
  async checkAndGuide(onConfigured, onCancel) {
    if (this.isConfigured()) {
      if (onConfigured) onConfigured();
      return true;
    }

    return new Promise((resolve) => {
      wx.showModal({
        title: '需要配置 API 密钥',
        content: '分镜图片生成功能需要配置 GLM API 密钥才能使用。\n\n您可以：\n1. 快速配置（输入密钥）\n2. 详细配置（查看教程）',
        confirmText: '快速配置',
        cancelText: '详细配置',
        success: (res) => {
          if (res.confirm) {
            // 快速配置
            this.showQuickConfig((apiKey) => {
              if (onConfigured) onConfigured(apiKey);
              resolve(true);
            });
          } else if (res.cancel) {
            // 详细配置
            this.navigateToConfig((data) => {
              if (onConfigured) onConfigured(data);
              resolve(true);
            });
          }
        }
      });
    });
  }

  /**
   * 显示配置教程
   */
  showTutorial() {
    wx.showModal({
      title: '如何获取 API 密钥',
      content: '1. 访问：https://open.bigmodel.cn/\n\n2. 注册/登录账号\n\n3. 进入"API Keys"页面\n\n4. 点击"创建新的API Key"\n\n5. 复制生成的密钥（sk-开头）\n\n6. 返回小程序粘贴配置',
      confirmText: '我知道了',
      showCancel: false
    });
  }

  /**
   * 清除API配置
   */
  clearConfig() {
    try {
      wx.removeStorageSync(this.storageKey);
      return true;
    } catch (error) {
      console.error('清除API配置失败:', error);
      return false;
    }
  }
}

// 创建单例
const apiConfigHelper = new ApiConfigHelper();

module.exports = apiConfigHelper;
