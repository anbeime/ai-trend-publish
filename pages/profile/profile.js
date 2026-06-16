// pages/profile/profile.js
Page({
  data: {
    userInfo: {},
    projectCount: 0,
    completedCount: 0,
    workingCount: 0,
    userCredits: 0,
    dailyUsed: 0,
    dailyQuota: 3,
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStats();
    this.loadUserCredits();
  },

  onShow() {
    this.loadStats();
    this.loadUserCredits();
  },

  async loadUserCredits() {
    try {
      const res = await wx.cloud.callFunction({
        name: "credit-manager",
        data: { action: "get" },
      });

      if (res.result && res.result.success) {
        this.setData({
          userCredits: res.result.credits,
          dailyUsed: res.result.dailyUsed,
          dailyQuota: res.result.dailyQuota,
        });
        console.log("用户额度加载成功:", res.result);
      }
    } catch (error) {
      console.error("加载用户额度失败:", error);
    }
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
    }
  },

  // 加载统计数据
  loadStats() {
    wx.cloud
      .database()
      .collection("projects")
      .where({
        _openid: "{openid}",
      })
      .count()
      .then((res) => {
        this.setData({ projectCount: res.total });

        // 获取各状态项目数
        return Promise.all([
          wx.cloud
            .database()
            .collection("projects")
            .where({ _openid: "{openid}", status: "completed" })
            .count(),
          wx.cloud
            .database()
            .collection("projects")
            .where({ _openid: "{openid}", status: "working" })
            .count(),
        ]);
      })
      .then(([completed, working]) => {
        this.setData({
          completedCount: completed.total,
          workingCount: working.total,
        });
      })
      .catch((err) => {
        console.error("加载统计失败:", err);
      });
  },

  // 获取用户信息
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      const app = getApp();
      app.globalData.userInfo = e.detail.userInfo;
      this.setData({ userInfo: e.detail.userInfo });

      wx.showToast({
        title: "登录成功",
        icon: "success",
      });
    }
  },

  // 查看全部项目
  viewAllProjects() {
    wx.switchTab({
      url: "/pages/index/index",
    });
  },

  // 查看模板
  viewTemplates() {
    wx.showToast({
      title: "功能开发中",
      icon: "none",
    });
  },

  // 查看历史
  viewHistory() {
    wx.navigateTo({
      url: "/pages/creation-history/creation-history",
    });
  },

  // 打开设置
  openSettings() {
    wx.showToast({
      title: "功能开发中",
      icon: "none",
    });
  },

  // 打开帮助
  openHelp() {
    wx.showModal({
      title: "帮助",
      content: "如有问题，请联系客服或查看使用文档",
      showCancel: false,
    });
  },

  // 关于
  openAbout() {
    wx.showModal({
      title: "关于",
      content: "AI短视频创作小程序 v1.0\n多智能体协作，轻松创作爆款短视频",
      showCancel: false,
    });
  },
});
