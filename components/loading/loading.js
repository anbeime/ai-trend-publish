// 加载状态管理组件
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      value: 'default' // default, script, image, video
    },
    progress: {
      type: Number,
      value: 0
    },
    message: {
      type: String,
      value: ''
    }
  },

  data: {
    loadingMessages: {
      default: [
        '正在处理中...',
        '请稍候...',
        '马上就好...'
      ],
      script: [
        ' AI正在分析您的需求...',
        ' 正在生成视频脚本...',
        '🎬 正在规划分镜内容...',
        '✨ 即将完成...'
      ],
      image: [
        '🎨 AI正在绘制分镜画面...',
        ' 正在生成高质量图片...',
        '✨ 正在优化图片细节...',
        '🎉 即将完成...'
      ],
      video: [
        '🎥 正在合成视频...',
        '🎬 正在添加转场效果...',
        '🎵 正在处理音频...',
        '✨ 正在导出视频...'
      ]
    },
    currentMessageIndex: 0,
    currentMessage: '',
    estimatedTime: ''
  },

  lifetimes: {
    attached() {
      this.startMessageRotation();
      this.calculateEstimatedTime();
    },
    detached() {
      this.stopMessageRotation();
    }
  },

  observers: {
    'show': function(show) {
      if (show) {
        this.startMessageRotation();
        this.calculateEstimatedTime();
      } else {
        this.stopMessageRotation();
      }
    },
    'type': function(type) {
      this.updateMessage();
      this.calculateEstimatedTime();
    }
  },

  methods: {
    // 开始消息轮播
    startMessageRotation() {
      if (this.messageTimer) return;
      
      this.updateMessage();
      this.messageTimer = setInterval(() => {
        this.updateMessage();
      }, 3000);
    },

    // 停止消息轮播
    stopMessageRotation() {
      if (this.messageTimer) {
        clearInterval(this.messageTimer);
        this.messageTimer = null;
      }
    },

    // 更新消息
    updateMessage() {
      const type = this.data.type;
      const messages = this.data.loadingMessages[type] || this.data.loadingMessages.default;
      const index = this.data.currentMessageIndex % messages.length;
      
      this.setData({
        currentMessage: this.data.message || messages[index],
        currentMessageIndex: index + 1
      });
    },

    // 计算预计时间
    calculateEstimatedTime() {
      const type = this.data.type;
      let time = '';
      
      switch(type) {
        case 'script':
          time = '预计 10-30 秒';
          break;
        case 'image':
          time = '预计 30-60 秒';
          break;
        case 'video':
          time = '预计 1-3 分钟';
          break;
        default:
          time = '请稍候';
      }
      
      this.setData({ estimatedTime: time });
    },

    // 取消操作
    onCancel() {
      this.triggerEvent('cancel');
    }
  }
});
