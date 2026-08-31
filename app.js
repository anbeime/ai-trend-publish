// app.js
const AGENTS_CONFIG = require('./config/agents-config.js');
const { install: installCloudShim } = require('./utils/cloud-shim.js');

App({
  onLaunch() {
    // 尝试初始化云开发（可选）
    if (typeof wx.cloud !== 'undefined' && wx.cloud) {
      try {
        wx.cloud.init({
          env: 'topgo-d4gw272cge9c2e3f9',
          traceUser: true
        })
        console.log('云开发初始化成功（可选）')
        this.globalData.cloudInitialized = true
      } catch (error) {
        console.warn('云开发初始化失败（不影响使用）:', error)
        this.globalData.cloudInitialized = false
      }
    } else {
      this.globalData.cloudInitialized = false
    }

    // 安装云函数兼容层
    // 即使云环境不可用，也能自动将 wx.cloud.callFunction 路由到 wx.request 方案
    installCloudShim();

    // 获取用户信息
    try {
      this.getUserInfo()
    } catch (error) {
      console.warn('获取用户信息失败:', error)
    }

    // 注册隐私协议授权监听
    this.initPrivacyAuthorize();

    // 监听小程序启动
    console.log('AI热点自动发布系统启动')
  },

  /**
   * 初始化隐私协议授权
   * 当用户调用隐私接口时，微信会触发此回调
   * 在此弹出隐私协议授权弹窗，用户同意后隐私接口可正常调用
   */
  initPrivacyAuthorize() {
    if (typeof wx.onNeedPrivacyAuthorization !== 'function') {
      console.log('当前基础库版本不支持隐私授权监听，跳过');
      return;
    }

    wx.onNeedPrivacyAuthorization((resolve, eventInfo) => {
      // 当用户触发隐私接口时，弹出隐私协议说明
      wx.showModal({
        title: '隐私保护提示',
        content: '为了使用保存图片到相册、复制内容到剪切板、选择相册图片等功能，需要您同意《用户隐私保护指引》。',
        confirmText: '同意',
        cancelText: '拒绝',
        success: (modalRes) => {
          if (modalRes.confirm) {
            // 用户同意，调用 resolve 告知平台用户已授权
            resolve({ buttonId: 'agree', event: 'agree' });
          } else {
            // 用户拒绝
            resolve({ event: 'disagree' });
          }
        }
      });
    });
  },

  getUserInfo() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  },

  globalData: {
    userInfo: null,
    currentProject: null,
    cloudInitialized: false,
    // 使用统一的智能体配置
    agentsConfig: AGENTS_CONFIG,
    // 兼容旧版本的agents对象（逐步废弃）
    agents: AGENTS_CONFIG.agents.reduce((acc, agent) => {
      acc[agent.key] = {
        name: agent.name,
        icon: agent.icon,
        color: agent.color,
        description: agent.description,
        status: 'idle',
        enabled: true
      };
      return acc;
    }, {})
  }
})
