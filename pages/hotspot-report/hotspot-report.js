// pages/hotspot-report/hotspot-report.js
Page({
  data: {
    report: null,
    loading: true,
    selectedTab: 'short', // short/mid/long
    currentPrediction: null,
    painPointLevels: [],
  },

  onLoad(options) {
    this.loadReport();
  },

  loadReport() {
    const app = getApp();
    const report = app.globalData.hotspotReport;
    
    if (!report) {
      wx.showToast({
        title: '报告数据加载失败',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 处理痛点数据
    const painPointLevels = this.processPainPoints(report.demand.painPoints);
    
    this.setData({
      report: report,
      loading: false,
      currentPrediction: report.prediction.shortTerm,
      painPointLevels: painPointLevels,
    });
  },

  // 处理痛点数据
  processPainPoints(painPoints) {
    return [
      {
        level: 'value',
        title: '价值迷茫（顶层）',
        points: painPoints.value || [],
        color: '#EF4444',
      },
      {
        level: 'identity',
        title: '身份焦虑',
        points: painPoints.identity || [],
        color: '#F59E0B',
      },
      {
        level: 'trust',
        title: '信任危机',
        points: painPoints.trust || [],
        color: '#3B82F6',
      },
      {
        level: 'cognitive',
        title: '认知焦虑（底层）',
        points: painPoints.cognitive || [],
        color: '#10B981',
      },
    ];
  },

  // 切换预测标签
  selectTab(e) {
    const tab = e.currentTarget.dataset.tab;
    const predictionMap = {
      short: this.data.report.prediction.shortTerm,
      mid: this.data.report.prediction.midTerm,
      long: this.data.report.prediction.longTerm,
    };
    
    this.setData({
      selectedTab: tab,
      currentPrediction: predictionMap[tab],
    });
  },

  // 分享报告
  shareReport() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: `热点深度分析报告 - ${this.data.report.category}类`,
      path: '/pages/hotspot/hotspot',
    };
  },
});
