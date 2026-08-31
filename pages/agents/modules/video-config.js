// video-config.js - 视频生成配置模块
// 通义万相(Qwen) 和其他视频生成的配置管理

const QWEN_CONFIG_KEY = "qwen_config";

class VideoConfig {
  constructor(pageContext) {
    this.page = pageContext;
  }

  // 获取Qwen配置
  getQwenConfig() {
    return (
      this.page.data.qwenConfig || {
        enabled: true,
        apiKey: "",
        model: "wan2.6-r2v-flash",
      }
    );
  }

  // 加载Qwen配置
  loadQwenConfig() {
    try {
      const config = wx.getStorageSync(QWEN_CONFIG_KEY);
      if (config) {
        this.page.setData({ qwenConfig: config });
        console.log("Qwen配置加载成功:", config);
      }
    } catch (error) {
      console.error("加载Qwen配置失败:", error);
    }
  }

  // 保存Qwen配置
  saveQwenConfig(config) {
    try {
      wx.setStorageSync(QWEN_CONFIG_KEY, config);
      this.page.setData({ qwenConfig: config });
      wx.showToast({
        title: "Qwen配置已保存",
        icon: "success",
      });
    } catch (error) {
      console.error("保存Qwen配置失败:", error);
      wx.showToast({
        title: "配置保存失败",
        icon: "error",
      });
    }
  }

  // 显示Qwen配置对话框
  showQwenConfigDialog() {
    const config = this.getQwenConfig();

    const options = [
      config.enabled ? "禁用Qwen视频" : "启用Qwen视频",
      "配置API Key",
      "查看当前配置",
      "测试视频生成",
    ];

    wx.showActionSheet({
      itemList: options,
      success: async (res) => {
        if (res.tapIndex === 0) {
          // 切换启用状态
          this.saveQwenConfig({
            ...config,
            enabled: !config.enabled,
          });
        } else if (res.tapIndex === 1) {
          this.showApiKeyInput(config);
        } else if (res.tapIndex === 2) {
          this.showCurrentConfig(config);
        } else if (res.tapIndex === 3) {
          this.testVideoGeneration();
        }
      },
    });
  }

  // 输入API Key
  showApiKeyInput(config) {
    wx.showModal({
      title: "配置通义万相API Key",
      content:
        "请输入您的通义万相API Key\n\n获取地址: https://dashscope.console.aliyun.com/",
      editable: true,
      placeholderText: config.apiKey ? "已配置" : "请输入API Key",
      success: (modalRes) => {
        if (modalRes.confirm && modalRes.content) {
          this.saveQwenConfig({
            ...config,
            apiKey: modalRes.content.trim(),
          });
        }
      },
    });
  }

  // 显示当前配置
  showCurrentConfig(config) {
    const statusText = config.enabled ? "已启用" : "未启用";
    const apiKeyText = config.apiKey
      ? `已配置 (${config.apiKey.substring(0, 8)}...)`
      : "未配置";

    wx.showModal({
      title: "通义万相视频配置",
      content: `状态: ${statusText}\nAPI Key: ${apiKeyText}\n模型: ${config.model}\n\n说明: Qwen视频生成效果优于GLM，建议启用`,
      showCancel: false,
    });
  }

  // 测试视频生成
  testVideoGeneration() {
    const config = this.getQwenConfig();

    if (!config.enabled) {
      wx.showToast({ title: "请先启用Qwen视频", icon: "none" });
      return;
    }

    if (!config.apiKey) {
      wx.showToast({ title: "请先配置API Key", icon: "none" });
      return;
    }

    wx.showLoading({ title: "测试视频生成中..." });

    // 简单测试prompt
    const testPrompt = "一只可爱的小猫在草地上玩耍，阳光明媚，背景有蓝天白云";

    // 调用页面的generateVideo方法
    this.page
      .generateVideo(testPrompt, { useQwen: true })
      .then((result) => {
        wx.hideLoading();
        wx.showModal({
          title: "视频生成成功",
          content: `视频URL: ${result.videoUrl}`,
          showCancel: false,
        });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showToast({
          title: `生成失败: ${error.message}`,
          icon: "none",
          duration: 4000,
        });
      });
  }
}

module.exports = VideoConfig;
