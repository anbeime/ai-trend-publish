class UIHelper {
  constructor(pageContext) {
    this.page = pageContext;
  }

  addMessage(sender, content, isTyping = false) {
    const messages = this.page.data.messages;
    messages.push({ sender: sender, content: content, timestamp: Date.now(), isTyping: isTyping });
    this.page.setData({ messages: messages, toView: "msg-" + (messages.length - 1) });
  }

  updateMessage(sender, content, isTyping = false) {
    const messages = this.page.data.messages;
    const lastIndex = messages.length - 1;
    if (lastIndex >= 0 && messages[lastIndex].sender === sender) {
      messages[lastIndex].content = content;
      messages[lastIndex].isTyping = isTyping;
      this.page.setData({ messages: messages });
    } else {
      this.addMessage(sender, content, isTyping);
    }
  }

  updateMessageWithData(sender, messageData, isTyping = false) {
    const messages = this.page.data.messages;
    const lastIndex = messages.length - 1;
    if (lastIndex >= 0 && messages[lastIndex].sender === sender) {
      messages[lastIndex] = Object.assign({}, messages[lastIndex], messageData, { isTyping: isTyping });
      this.page.setData({ messages: messages });
    }
  }

  updateAgentStatus(agentKey, status, progress) {
    const updates = {};
    updates["agents." + agentKey + ".status"] = status;
    updates["agents." + agentKey + ".progress"] = progress;
    this.page.setData(updates);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return h + ":" + m;
  }

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: [url] });
  }

  saveImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: "保存成功", icon: "success" }),
          fail: () => wx.showToast({ title: "保存失败", icon: "none" })
        });
      }
    });
  }

  copyMessage(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({ data: content, success: () => wx.showToast({ title: "已复制", icon: "success" }) });
  }

  likeMessage(e) {
    wx.showToast({ title: "已点赞", icon: "success" });
  }

  showFeedbackMenu(e) {
    const index = e.currentTarget.dataset.index;
    wx.showActionSheet({
      itemList: ["点赞", "反馈", "修改"],
      success: (res) => {
        if (res.tapIndex === 0) this.likeMessage(e);
        if (res.tapIndex === 1) this.showFeedbackDialog(index);
        if (res.tapIndex === 2) this.showModifyDialog(index);
      }
    });
  }

  showModifyDialog(index) {
    wx.showModal({
      title: "修改内容",
      editable: true,
      placeholderText: "请输入修改后的内容",
      success: (res) => {
        if (res.confirm && res.content) {
          const messages = this.page.data.messages;
          messages[index].content = res.content;
          this.page.setData({ messages: messages });
        }
      }
    });
  }

  showFeedbackDialog(index) {
    wx.showModal({
      title: "反馈",
      editable: true,
      placeholderText: "请输入反馈内容",
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: "反馈已提交", icon: "success" });
        }
      }
    });
  }

  toggleHistoryPanel() {
    const show = !this.page.data.showHistoryPanel;
    this.page.setData({ showHistoryPanel: show });
  }

  saveCurrentCreation() {
    wx.showToast({ title: "创作已保存", icon: "success" });
  }

  showAllTemplates() {
    wx.showToast({ title: "显示所有模板", icon: "none" });
  }

  toggleLearningPanel() {
    const show = !this.page.data.showLearningPanel;
    this.page.setData({ showLearningPanel: show });
  }

  clearLearningData() {
    wx.showModal({
      title: "确认清除",
      content: "确定要清除所有学习数据吗？",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync("ai_learning_data");
          wx.showToast({ title: "已清除", icon: "success" });
        }
      }
    });
  }

  showRuleLockConfig() {
    wx.showModal({ title: "规则锁定配置", content: "配置智能体规则锁定功能", showCancel: true });
  }

  selectPlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    if (platform) {
      this.page.setData({ selectedPlatform: platform });
      console.log('选择平台:', platform);
    }
  }

  toggleTrendSelectionMode() {
    const currentMode = this.page.data.trendSelectionMode || 'manual';
    const newMode = currentMode === 'manual' ? 'auto' : 'manual';
    this.page.setData({ trendSelectionMode: newMode });
    wx.showToast({
      title: `已切换到${newMode === 'auto' ? '自动' : '手动'}模式`,
      icon: 'none'
    });
  }

  selectTrend(e) {
    const trend = e.currentTarget.dataset.trend;
    if (trend) {
      this.page.setData({
        inputValue: trend,
        showTrendSelection: false
      });
      wx.showToast({
        title: '已选择热点',
        icon: 'success'
      });
    }
  }
}

module.exports = UIHelper;
