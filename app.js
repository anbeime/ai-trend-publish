// app.js
const AGENTS_CONFIG = require('./config/agents-config.js');

App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      this.globalData.cloudInitialized = false
    } else {
      try {
        wx.cloud.init({
          env: 'invideo-6gidgilyee392cc8',
          traceUser: true
        })
        console.log('云开发初始化成功')
        this.globalData.cloudInitialized = true
      } catch (error) {
        console.error('云开发初始化失败:', error)
        // 游客模式下会失败，这是正常的
        this.globalData.cloudInitialized = false
        console.warn('游客模式下云开发不可用，部分功能受限')
      }
    }

    // 获取用户信息（游客模式下可能失败，不影响主流程）
    try {
      this.getUserInfo()
    } catch (error) {
      console.warn('获取用户信息失败（游客模式）:', error)
    }

    // 监听小程序启动
    console.log('AI短视频创作小程序启动')
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
    cloudInitialized: true, // 默认认为云开发已初始化，在onLaunch中根据实际初始化结果可能被设置为false
    // 使用统一的智能体配置
    agentsConfig: AGENTS_CONFIG,
    // 兼容旧版本的agents对象（逐步废弃）
    agents: AGENTS_CONFIG.agents.reduce((acc, agent) => {
      acc[agent.key] = {
        name: agent.name,
        icon: agent.icon,
        color: agent.color,
        description: agent.description,
        status: 'idle', // 添加状态：idle, working, completed, error
        enabled: true   // 是否启用
      };
      return acc;
    }, {})
  }
})
