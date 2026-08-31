// pages/creation-history/creation-history.js
const CreationHistoryManager = require("../agents/modules/creation-history-manager.js");

Page({
  data: {
    currentTab: "all",
    allHistory: [],
    displayedHistory: [],
    loading: false,
  },

  onLoad() {
    this.creationHistoryManager = new CreationHistoryManager(this);
    this.loadHistory();
  },

  onShow() {
    // 每次显示页面时重新加载，确保数据最新
    this.loadHistory();
  },

  // 合并云端和本地历史记录（云端优先，保留本地完整字段）
  mergeHistory(cloudHistory, localHistory) {
    const seenIds = new Set();
    const merged = [];

    // 先添加云端记录（保留完整字段）
    cloudHistory.forEach((item) => {
      const itemId = item._id || item.id;
      if (itemId) seenIds.add(itemId);
      merged.push(item);
    });

    // 再补充本地独有的记录（云端没有的）
    localHistory.forEach((item) => {
      const itemId = item._id || item.id;
      if (!itemId || !seenIds.has(itemId)) {
        merged.push(item);
        if (itemId) seenIds.add(itemId);
      }
    });

    // 按时间倒序排序
    merged.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.createTime || 0).getTime();
      const timeB = new Date(b.createdAt || b.createTime || 0).getTime();
      return timeB - timeA;
    });

    return merged.slice(0, 100);
  },

  // 加载历史记录
  async loadHistory() {
    this.setData({ loading: true });
    console.log("=== 开始加载创作历史 ===");

    // 先尝试从云端加载（优先）
    let cloudHistory = [];
    let loadError = null;

    // 同时读取本地数据（不管云端结果如何都需要）
    const localCreationHistory = wx.getStorageSync("creation_history") || [];
    console.log("本地历史记录数量:", localCreationHistory.length);

    if (wx.cloud) {
      try {
        console.log("尝试从云端加载历史...");
        const result = await this.creationHistoryManager.getCreationHistoryList(
          { limit: 50 },
        );
        console.log("云端返回结果:", result);

        if (result.success && result.data && result.data.length > 0) {
          console.log("云端历史记录数量:", result.data.length);

          // 转换云端数据格式为本地格式（保留完整字段，不丢失信息）
          cloudHistory = result.data.map((item) => ({
            id: item._id || item.id,
            _id: item._id || item.id,
            hotspot: {
              title: item.prompt || item.character || "创作内容",
              name: item.agentName || "自媒体创作",
            },
            type: item.type || item.agentName || item.mediaType || "自媒体创作",
            content: item.content,
            contentType: typeof item.content === "string" ? "string" : "object",
            createdAt: item.createdAt,
            createTime: this.formatTime(item.createdAt),
            status: item.status || "completed",
            fromCloud: true,
            // 保留原始字段用于恢复
            inputValue: item.inputValue || item.prompt || item.character || null,
            prompt: item.prompt || null,
            character: item.character || null,
            agentName: item.agentName || null,
            messages: item.messages || null,
            style: item.style || null,
            platform: item.platform || null,
          }));

          console.log("转换后云端历史记录:", cloudHistory.length, "条");
        } else {
          loadError = result.error || "云端无数据";
          console.log("云端无数据或请求失败:", loadError);
        }
      } catch (error) {
        loadError = error.message;
        console.error("加载云端历史失败:", error);
      }
    } else {
      loadError = "云开发未初始化";
      console.log("wx.cloud 不可用");
    }

    // 合并云端和本地数据
    let finalHistory;
    if (cloudHistory.length > 0 && localCreationHistory.length > 0) {
      finalHistory = this.mergeHistory(cloudHistory, localCreationHistory);
      console.log("合并后历史记录:", finalHistory.length, "条");
    } else if (cloudHistory.length > 0) {
      finalHistory = cloudHistory;
      console.log("使用云端数据:", finalHistory.length, "条");
    } else if (localCreationHistory.length > 0) {
      finalHistory = localCreationHistory;
      console.log("使用本地数据:", finalHistory.length, "条");
    } else {
      finalHistory = [];
      console.log("无任何历史记录");
      if (loadError) {
        wx.showToast({
          title: loadError || "暂无历史记录",
          icon: "none",
        });
      }
    }

    // 标准化每条记录的字段
    finalHistory = finalHistory.map((item) => ({
      ...item,
      contentType: typeof item.content === "string" ? "string" : "object",
      createTime: item.createTime || this.formatTime(item.createdAt || item.createTime),
    }));

    console.log("最终显示的历史记录数量:", finalHistory.length);

    this.setData({
      allHistory: finalHistory,
      displayedHistory: finalHistory,
      loading: false,
    });

    // 更新本地缓存（用合并后的完整数据，不再覆盖丢失字段）
    if (finalHistory.length > 0) {
      wx.setStorageSync("creation_history", finalHistory);
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });

    if (tab === "all") {
      this.setData({ displayedHistory: this.data.allHistory });
    } else {
      const filtered = this.data.allHistory.filter(
        (item) => item.status === tab,
      );
      this.setData({ displayedHistory: filtered });
    }
  },

  // 提取可显示的内容文本
  extractDisplayContent(content) {
    if (!content) return "暂无内容";
    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.content && typeof parsed.content === "string") return parsed.content;
          if (parsed.description) return parsed.description;
          if (parsed.title) return parsed.title;
          if (parsed.text) return parsed.text;
        } catch (e) {}
      }
      return content.length > 500 ? content.substring(0, 500) + "..." : content;
    }
    if (typeof content === "object") {
      if (content.content && typeof content.content === "string") return content.content;
      if (content.description) return content.description;
      if (content.title) return content.title;
      if (content.text) return content.text;
      return JSON.stringify(content).substring(0, 500) + "...";
    }
    return String(content);
  },

  // 提取标题
  extractTitle(content) {
    if (!content) return "";
    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return parsed.title || "";
        } catch (e) {}
      }
      return "";
    }
    if (typeof content === "object") {
      return content.title || "";
    }
    return "";
  },

  // 查看详情
  viewDetail(e) {
    const item = e.currentTarget.dataset.item;
    const displayContent = this.extractDisplayContent(item.content);
    const title = this.extractTitle(item.content) || item.hotspot?.title || item.hotspot?.name || "创作内容";

    wx.showModal({
      title: title,
      content: displayContent.length > 500 ? displayContent.substring(0, 500) + "..." : displayContent,
      showCancel: false,
      confirmText: "关闭",
    });
  },

  // 复制内容
  copyContent(e) {
    const content = e.currentTarget.dataset.content;
    const textToCopy = this.extractDisplayContent(content);

    wx.setClipboardData({
      data: textToCopy,
      success: () => {
        wx.showToast({
          title: "已复制",
          icon: "success",
        });
      },
    });
  },

  // 删除记录
  deleteItem(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: "确认删除",
      content: "删除后无法恢复，确定要删除吗？",
      success: (res) => {
        if (res.confirm) {
          this.doDelete(id);
        }
      },
    });
  },

  // 执行删除
  async doDelete(id) {
    // 从 creation_history 中删除
    let creationHistory = wx.getStorageSync("creation_history") || [];
    const itemToDelete = creationHistory.find(
      (item) => item.id === id || item._id === id,
    );

    // 如果是云端数据，调用云函数删除
    if (itemToDelete && itemToDelete.fromCloud) {
      try {
        await this.creationHistoryManager.deleteCreationHistory(id);
      } catch (error) {
        console.error("删除云端记录失败:", error);
      }
    }

    // 从本地删除
    creationHistory = creationHistory.filter(
      (item) => item.id !== id && item._id !== id,
    );
    wx.setStorageSync("creation_history", creationHistory);

    wx.showToast({
      title: "已删除",
      icon: "success",
    });

    // 重新加载
    this.loadHistory();
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: "确认清空",
      content: "将清空所有历史记录，此操作无法恢复",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync("creation_history");

          this.setData({
            allHistory: [],
            displayedHistory: [],
          });

          wx.showToast({
            title: "已清空",
            icon: "success",
          });
        }
      },
    });
  },

  // 格式化时间
  formatTime(isoString) {
    if (!isoString) return "未知时间";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "未知时间";
    
    const now = new Date();
    const diff = now - date;

    // 1分钟内
    if (diff < 60000) {
      return "刚刚";
    }
    // 1小时内
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return `今天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    // 其他
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 开始创作
  goToCreate() {
    wx.navigateTo({
      url: "/pages/content-creator/content-creator",
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },
});
