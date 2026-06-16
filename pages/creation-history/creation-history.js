// pages/creation-history/creation-history.js
const CreationHistoryManager = require('../agents/modules/creation-history-manager.js');

Page({
  data: {
    currentTab: 'all',
    allHistory: [],
    displayedHistory: [],
    loading: false
  },

  onLoad() {
    this.creationHistoryManager = new CreationHistoryManager(this);
    this.loadHistory();
  },

  onShow() {
    // 每次显示页面时重新加载，确保数据最新
    this.loadHistory();
  },

  // 加载历史记录
  async loadHistory() {
    this.setData({ loading: true });

    // 从本地加载（统一从 creation_history 加载）
    const localCreationHistory = wx.getStorageSync('creation_history') || [];

    // 按时间排序
    const allHistory = localCreationHistory
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      .map(item => ({
        ...item,
        contentType: typeof item.content === 'string' ? 'string' : 'object',
        createTime: this.formatTime(item.createTime)
      }));

    this.setData({
      allHistory: allHistory,
      displayedHistory: allHistory
    });

    // 从云端加载更多历史（后台异步）
    if (wx.cloud) {
      try {
        const result = await this.creationHistoryManager.getCreationHistoryList({ limit: 50 });
        if (result.success && result.data) {
          // 转换云端数据格式为本地格式
          const cloudHistory = result.data.map(item => ({
            id: item._id,
            hotspot: { title: item.prompt, name: item.agentName },
            type: item.agentName,
            content: item.content,
            contentType: typeof item.content === 'string' ? 'string' : 'object',
            createTime: this.formatTime(item.createdAt),
            status: item.status,
            fromCloud: true
          }));

          // 合并本地和云端历史（去重）
          const mergedHistory = [...cloudHistory, ...allHistory]
            .filter((item, index, self) =>
              self.findIndex(i => (i.id === item.id || (i.fromCloud && item.id === item._id))) === index
            )
            .sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0));

          this.setData({
            allHistory: mergedHistory,
            displayedHistory: mergedHistory
          });
        }
      } catch (error) {
        console.error('加载云端历史失败:', error);
        // 失败不影响本地历史显示
      }
    }

    this.setData({ loading: false });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });

    if (tab === 'all') {
      this.setData({ displayedHistory: this.data.allHistory });
    } else {
      const filtered = this.data.allHistory.filter(item => item.status === tab);
      this.setData({ displayedHistory: filtered });
    }
  },

  // 查看详情
  viewDetail(e) {
    const item = e.currentTarget.dataset.item;
    const content = typeof item.content === 'string' ? item.content : item.content.content || '';
    const title = typeof item.content === 'string' ? '' : item.content.title || '';

    wx.showModal({
      title: title || (item.hotspot.title || item.hotspot.name),
      content: content,
      showCancel: false,
      confirmText: '关闭'
    });
  },

  // 复制内容
  copyContent(e) {
    const content = e.currentTarget.dataset.content;
    const textToCopy = typeof content === 'string' ? content : content.content || '';

    wx.setClipboardData({
      data: textToCopy,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 删除记录
  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          this.doDelete(id);
        }
      }
    });
  },

  // 执行删除
  doDelete(id) {
    // 从 creation_history 中删除
    let creationHistory = wx.getStorageSync('creation_history') || [];
    creationHistory = creationHistory.filter(item => item.id !== id);
    wx.setStorageSync('creation_history', creationHistory);

    wx.showToast({
      title: '已删除',
      icon: 'success'
    });

    // 重新加载
    this.loadHistory();
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '将清空所有历史记录，此操作无法恢复',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('creation_history');

          this.setData({
            allHistory: [],
            displayedHistory: []
          });

          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 格式化时间
  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    // 1分钟内
    if (diff < 60000) {
      return '刚刚';
    }
    // 1小时内
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return `今天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    // 其他
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 开始创作
  goToCreate() {
    wx.navigateTo({
      url: '/pages/content-creator/content-creator'
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
