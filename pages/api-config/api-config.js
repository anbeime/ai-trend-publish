// pages/api-config/api-config.js - 简化版（显示API已可用）
Page({
  data: {
    apiConfigured: true,
    message: "API已默认可用，无需配置"
  },

  onLoad() {
    console.log("API配置页面加载 - 已使用默认GLM API");
    
    // 延迟1.5秒后自动返回
    setTimeout(() => {
      wx.navigateBack({
        fail: () => {
          // 如果没有上一页，跳转到首页
          wx.switchTab({
            url: '/pages/index/index',
            fail: () => {
              wx.redirectTo({
                url: '/pages/index/index'
              });
            }
          });
        }
      });
    }, 1500);
  },

  onUnload() {
    console.log("API配置页面卸载");
  }
});
