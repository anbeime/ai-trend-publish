// history-manager.js - 创作历史管理模块
const STORAGE_KEY = "creation_history";

class HistoryManager {
  constructor(pageContext) {
    this.page = pageContext;
  }

  // 保存创作历史
  saveCreationHistory(userMessages, agentOutputs, messages = null) {
    const creationHistory = this.getCreationHistory();

    // 创建历史记录
    const userInputText = userMessages[userMessages.length - 1].content;
    const historyItem = {
      id: Date.now(),
      title:
        userInputText.length > 30
          ? userInputText.substring(0, 30) + "..."
          : userInputText,
      userInput: userInputText,
      agentOutputs: agentOutputs,
      messages: messages || this.page.data.messages, // 保存完整消息历史
      createdAt: new Date().getTime(),
      platform: this.page.data.selectedPlatform,
      style: this.page.data.selectedStyle,
    };

    // 保存到数组头部
    creationHistory.unshift(historyItem);

    // 限制历史记录数量（最多50条）
    if (creationHistory.length > 50) {
      creationHistory.pop();
    }

    wx.setStorageSync(STORAGE_KEY, creationHistory);

    console.log("创作历史保存成功:", historyItem);

    // 更新页面数据
    this.page.setData({ creationHistory });

    return historyItem;
  }

  // 获取创作历史
  getCreationHistory() {
    return wx.getStorageSync(STORAGE_KEY) || [];
  }

  // 加载创作历史
  async loadCreationHistory() {
    try {
      // 先尝试从本地存储加载
      const localHistory = this.getCreationHistory();
      console.log("本地创作历史加载成功", localHistory.length);

      // 尝试从云端加载更多历史
      if (typeof wx !== "undefined" && wx.cloud) {
        if (!app.globalData.cloudInitialized) {
          console.warn("云开发未初始化，仅使用本地历史");
          this.page.setData({ creationHistory: localHistory });
          return localHistory;
        }

        try {
          wx.showLoading({ title: "加载云端历史..." });

          const db = wx.cloud.database();
          const result = await db
            .collection("creation_history")
            .where({ _openid: "{openid}" }) // 这里应该用实际的 openid
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

          const cloudHistory = result.data || [];
          console.log("云端创作历史加载成功", cloudHistory.length);

          // 合并本地和云端历史（云端优先）
          const mergedHistory = [...cloudHistory, ...localHistory]
            .filter(
              (item, index, self) =>
                self.findIndex((i) => i.id === item.id) === index,
            )
            .slice(0, 50); // 限制总数

          this.page.setData({ creationHistory: mergedHistory });
          wx.hideLoading();
          return mergedHistory;
        } catch (error) {
          wx.hideLoading();
          // 如果是集合不存在错误，提示用户创建集合
          if (error.errCode === -502005) {
            wx.showToast({
              title: "请先在云开发创建creation_history集合",
              icon: "none",
              duration: 3000,
            });
          } else {
            wx.showToast({
              title: "加载云端历史失败，使用本地历史",
              icon: "none",
            });
          }
          console.error("加载云端创作历史失败:", error);
          this.page.setData({ creationHistory: localHistory });
          return localHistory;
        }
      } else {
        this.page.setData({ creationHistory: localHistory });
        return localHistory;
      }
    } catch (error) {
      console.error("加载创作历史失败:", error);
      this.page.setData({ creationHistory: [] });
      return [];
    }
  }

  // 删除历史记录
  deleteCreation(id) {
    let creationHistory = this.getCreationHistory();
    creationHistory = creationHistory.filter((item) => item.id !== id);
    wx.setStorageSync(STORAGE_KEY, creationHistory);
    this.page.setData({ creationHistory });
  }

  // 清空历史记录
  clearHistory() {
    wx.setStorageSync(STORAGE_KEY, []);
    this.page.setData({ creationHistory: [] });
  }

  // 恢复创作
  restoreCreation(record) {
    console.log("恢复创作:", record);

    // 恢复完整状态
    this.page.setData({
      inputValue: record.userInput,
      agentOutputs: record.agentOutputs || {},
      messages: record.messages || [],
      selectedPlatform: record.platform,
      selectedStyle: record.style,
    });
  }

  // 保存当前创作
  saveCurrentCreation() {
    if (this.page.data.messages.length === 0) {
      wx.showToast({
        title: "暂无内容可保存",
        icon: "none",
      });
      return;
    }

    const lastUserMessage = this.page.data.messages
      .filter((m) => m.sender === "user")
      .pop();
    if (!lastUserMessage) {
      wx.showToast({
        title: "暂无用户输入",
        icon: "none",
      });
      return;
    }

    this.saveCreationHistory(
      [lastUserMessage],
      this.page.data.agentOutputs,
      this.page.data.messages,
    );

    wx.showToast({
      title: "已保存到历史",
      icon: "success",
    });
  }

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 小于1分钟
    if (diff < 60000) {
      return "刚刚";
    }
    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分钟前`;
    }
    // 小于1天
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }
    // 小于7天
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}天前`;
    }

    // 显示具体日期
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${month}-${day} ${hour}:${minute}`;
  }
}

module.exports = HistoryManager;
