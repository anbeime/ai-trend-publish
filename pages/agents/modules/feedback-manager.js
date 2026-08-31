// feedback-manager.js - 反馈管理模块
const LEARNING_DATA_KEY = "agent_learning_data";

class FeedbackManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.learningData = this.loadLearningData();
  }

  // 加载学习数据
  loadLearningData() {
    const data = wx.getStorageSync(LEARNING_DATA_KEY) || {
      likedScripts: [],
      modifiedScripts: [],
      feedbackRecords: []
    };
    this.page.setData({ learningData: data });
    return data;
  }

  // 保存学习数据
  saveLearningData() {
    wx.setStorageSync(LEARNING_DATA_KEY, this.learningData);
    this.page.setData({ learningData: this.learningData });
  }

  // 点赞消息
  likeMessage(index) {
    const messages = this.page.data.messages;
    const message = messages[index];

    // 切换点赞状态
    message.liked = !message.liked;
    message.disliked = false; // 取消不满意

    // 更新消息列表
    this.page.setData({ [`messages[${index}]`]: message });

    // 保存到学习数据
    if (message.liked) {
      this.learningData.likedScripts.push({
        content: message.content,
        agentType: message.agentType,
        timestamp: Date.now()
      });
      this.saveLearningData();
    }
  }

  // 不满意/反馈
  handleDislike(index, feedbackText) {
    const messages = this.page.data.messages;
    const message = messages[index];

    // 切换不满意状态
    message.disliked = !message.disliked;
    message.liked = false; // 取消点赞

    // 更新消息列表
    this.page.setData({ [`messages[${index}]`]: message });

    // 记录反馈
    if (message.disliked && feedbackText) {
      this.learningData.feedbackRecords.push({
        content: message.content,
        agentType: message.agentType,
        feedback: feedbackText,
        timestamp: Date.now()
      });
      this.saveLearningData();
    }
  }

  // 显示反馈菜单
  showFeedbackMenu(index) {
    const message = this.page.data.messages[index];

    wx.showActionSheet({
      itemList: ['内容不准确', '风格不符', '太简短', '太冗长', '其他问题'],
      success: (res) => {
        const feedbackOptions = ['内容不准确', '风格不符', '太简短', '太冗长', '其他问题'];
        const feedbackText = feedbackOptions[res.tapIndex];

        this.handleDislike(index, feedbackText);

        wx.showToast({
          title: '反馈已记录',
          icon: 'success'
        });
      }
    });
  }

  // 添加待处理反馈
  addPendingFeedback(agentType, feedback) {
    const pendingFeedback = this.page.data.pendingFeedback || {};
    pendingFeedback[agentType] = feedback;
    this.page.setData({ pendingFeedback });
  }

  // 获取待处理反馈
  getPendingFeedback(agentType) {
    const pendingFeedback = this.page.data.pendingFeedback || {};
    return pendingFeedback[agentType];
  }

  // 清除待处理反馈
  clearPendingFeedback(agentType) {
    const pendingFeedback = this.page.data.pendingFeedback || {};
    delete pendingFeedback[agentType];
    this.page.setData({ pendingFeedback });
  }

  // 获取反馈队列
  getFeedbackQueue() {
    const pendingFeedback = this.page.data.pendingFeedback || {};
    return Object.entries(pendingFeedback).map(([agentType, feedback]) => ({
      agentType,
      feedback
    }));
  }

  // 处理反馈队列
  processFeedbackQueue() {
    const queue = this.getFeedbackQueue();
    if (queue.length === 0) return;

    console.log("处理反馈队列:", queue);

    queue.forEach(({ agentType, feedback }) => {
      // 这里可以将反馈发送给AI，让AI根据反馈调整后续输出
      console.log(`处理 ${agentType} 的反馈:`, feedback);
    });

    // 清空反馈队列
    this.page.setData({ pendingFeedback: {} });
  }

  // 清空学习数据
  clearLearningData() {
    this.learningData = {
      likedScripts: [],
      modifiedScripts: [],
      feedbackRecords: []
    };
    this.saveLearningData();
    wx.showToast({
      title: '学习数据已清空',
      icon: 'success'
    });
  }

  // 获取AI学习提示
  getLearningPrompt(agentType) {
    const likedScripts = this.learningData.likedScripts.filter(
      item => item.agentType === agentType
    );

    if (likedScripts.length === 0) return "";

    // 从点赞的内容中提取共同特征
    const feedbacks = likedScripts.map(item => item.content).join('\n');
    
    return `\n\n【学习数据 - 用户偏好】\n用户之前点赞过的内容:\n${feedbacks}\n请参考这些偏好的风格和内容来生成新的内容。`;
  }
}

module.exports = FeedbackManager;
