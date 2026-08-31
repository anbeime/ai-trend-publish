// pages/project/project.js
const CreationHistoryManager = require('../agents/modules/creation-history-manager.js');

Page({
  data: {
    projectId: '',
    project: {},
    projects: [], // 项目列表
    showProjectList: false, // 是否显示项目列表
    activeTab: 'all',
    editing: false,
    editTitle: '',
    editDescription: '',
    editStatus: 'working',
    loading: false,
    loadingProjects: false,
    errorMessage: '',
    // 历史记录相关
    projectHistory: [],
    scriptHistory: [],
    storyboardHistory: [],
    videoHistory: [],
    loadingHistory: false
  },

  onLoad(options) {
    // 初始化历史管理器
    this.creationHistoryManager = new CreationHistoryManager(this);
    
    if (options.id) {
      this.setData({ projectId: options.id, showProjectList: false })
      this.loadProject(options.id)
      this.loadProjectHistory(options.id)
    } else {
      // 没有 id 参数，显示项目列表
      this.setData({ showProjectList: true })
      this.loadProjectsList()
    }
  },

  // 加载项目
  loadProject(projectId) {
    this.setData({ loading: true, errorMessage: '' })
    wx.cloud.callFunction({
      name: 'project-manager',
      data: {
        action: 'get',
        projectId: projectId
      }
    })
    .then(res => {
      if (res.result.success) {
        this.setData({
          project: res.result.data,
          loading: false
        })
      } else {
        console.error('加载项目失败:', res.result.error)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({
          loading: false,
          errorMessage: res.result.error || '加载失败，请检查网络连接'
        })
      }
    })
    .catch(err => {
      console.error('加载项目失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({
        loading: false,
        errorMessage: '加载失败，请检查网络连接'
      })
    })
  },

  // 加载项目列表
  loadProjectsList() {
    this.setData({ loadingProjects: true, errorMessage: '' })

    wx.cloud.callFunction({
      name: 'project-manager',
      data: {
        action: 'list',
        options: {
          page: 1,
          pageSize: 50
        }
      }
    })
    .then(res => {
      if (res.result.success) {
        this.setData({
          projects: res.result.data || [],
          loadingProjects: false
        })
        if (res.result.data.length === 0) {
          this.setData({ errorMessage: '暂无项目，快去创建吧' })
        }
      } else {
        console.error('加载项目列表失败:', res.result.error)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({
          loadingProjects: false,
          errorMessage: res.result.error || '加载项目列表失败'
        })
      }
    })
    .catch(err => {
      console.error('加载项目列表失败:', err)

      // 特殊处理数据库权限错误
      if (err.errCode === -502003 || err.errMsg && err.errMsg.includes('permission denied')) {
        this.setData({
          loadingProjects: false,
          errorMessage: '数据库权限不足。请检查：1) 云函数是否已部署 2) 数据库安全规则是否正确 3) 云开发环境是否已开通'
        })
        wx.showModal({
          title: '数据库权限错误',
          content: '请检查以下设置：\n1. 云函数project-manager是否已上传部署\n2. 云开发环境是否已初始化\n3. 数据库集合projects是否存在\n4. 数据库安全规则是否配置正确',
          showCancel: false,
          confirmText: '知道了'
        })
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({
          loadingProjects: false,
          errorMessage: err.message || '加载项目列表失败'
        })
      }
    })
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 点击项目
  onProjectClick(e) {
    const projectId = e.currentTarget.dataset.id
    if (projectId) {
      wx.navigateTo({
        url: `/pages/project/project?id=${projectId}`
      })
    }
  },

  // 进入编辑模式
  enterEditMode() {
    const { project } = this.data
    this.setData({
      editing: true,
      editTitle: project.title || '',
      editDescription: project.description || '',
      editStatus: project.status || 'working'
    })
  },

  // 取消编辑
  cancelEdit() {
    this.setData({
      editing: false,
      editTitle: '',
      editDescription: '',
      editStatus: 'working'
    })
  },

  // 保存编辑
  async saveEdit() {
    const { projectId, editTitle, editDescription, editStatus } = this.data
    
    if (!editTitle.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true, errorMessage: '' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'project-manager',
        data: {
          action: 'update',
          projectId: projectId,
          updateData: {
            title: editTitle.trim(),
            description: editDescription.trim(),
            status: editStatus
          }
        }
      })

      if (res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        // 重新加载项目数据
        this.loadProject(projectId)
        this.setData({ editing: false })
      } else {
        wx.showToast({
          title: res.result.error || '保存失败',
          icon: 'none'
        })
        this.setData({ 
          errorMessage: res.result.error || '保存失败' 
        })
      }
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
      this.setData({ 
        errorMessage: error.message || '保存失败' 
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 删除项目
  deleteProject() {
    const { projectId } = this.data
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个项目吗？删除后无法恢复。',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true, errorMessage: '' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'project-manager',
              data: {
                action: 'delete',
                projectId: projectId
              }
            })

            if (result.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              // 返回上一页
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({
                title: result.result.error || '删除失败',
                icon: 'none'
              })
              this.setData({ 
                errorMessage: result.result.error || '删除失败' 
              })
            }
          } catch (error) {
            console.error('删除失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
            this.setData({ 
              errorMessage: error.message || '删除失败' 
            })
          } finally {
            this.setData({ loading: false })
          }
        }
      }
    })
  },

  // 导出脚本
  exportScript() {
    if (!this.data.project.script) {
      wx.showToast({
        title: '脚本还未生成',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: this.data.project.script,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  // 分享项目
  shareProject() {
    // 显示分享菜单，允许用户分享给好友或群
    wx.showShareMenu({
      withShareTicket: true,
      success: () => {
        wx.showToast({
          title: '分享功能已启用',
          icon: 'success',
          duration: 5000
        })
      },
      fail: (err) => {
        console.error('开启分享失败:', err)
        wx.showToast({
          title: '分享功能开启失败',
          icon: 'none'
        })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    return {
      title: this.data.project.title || 'AI短视频创作',
      path: `/pages/project/project?id=${this.data.projectId}`
    }
  },

  // 前往分镜编辑
  goToStoryboard() {
    const { projectId } = this.data
    if (projectId) {
      wx.navigateTo({
        url: `/pages/agents/agents-detail?id=${projectId}`
      })
    } else {
      wx.showToast({
        title: '项目ID不存在',
        icon: 'none'
      })
    }
  },

  // 前往视频编辑
  goToVideo() {
    const { projectId } = this.data
    if (projectId) {
      wx.navigateTo({
        url: `/pages/agents/agents-detail?id=${projectId}&mode=video`
      })
    } else {
      wx.showToast({
        title: '项目ID不存在',
        icon: 'none'
      })
    }
  },

  // 输入框变化事件
  onTitleInput(e) {
    this.setData({ editTitle: e.detail.value })
  },

  onDescriptionInput(e) {
    this.setData({ editDescription: e.detail.value })
  },

  onStatusChange(e) {
    this.setData({ editStatus: e.detail.value })
  },

  // 判断历史记录属于哪个分类
  _classifyHistoryItem(item) {
    const agentId = (item.agentId || '').toLowerCase();
    const agentName = (item.agentName || '').toLowerCase();
    const mediaType = (item.mediaType || '').toLowerCase();
    const prompt = (item.prompt || item.character || '').toLowerCase();
    const type = (item.type || '').toLowerCase();

    // 组合所有可用的文本字段用于匹配
    const allText = `${agentId} ${agentName} ${mediaType} ${prompt} ${type}`;

    if (allText.includes('video') || mediaType === 'video') {
      return 'video';
    }
    if (allText.includes('storyboard') || allText.includes('shot') || allText.includes('image') ||
        allText.includes('分镜') || allText.includes('镜头') || allText.includes('图片') || mediaType === 'image') {
      return 'storyboard';
    }
    // 文章/脚本/内容创作 归入脚本类（这是最常见的类型）
    if (allText.includes('script') || allText.includes('text') || allText.includes('article') ||
        allText.includes('content') || allText.includes('脚本') || allText.includes('文章') ||
        allText.includes('自媒体') || agentId === 'content-creator' || mediaType === 'article' || type === 'article') {
      return 'script';
    }

    // 默认归入脚本（兼容未知类型）
    return 'script';
  },

  // 加载项目历史记录
  async loadProjectHistory(projectId) {
    console.log('=== 开始加载项目历史 ===');
    console.log('projectId:', projectId);
    this.setData({ loadingHistory: true });

    try {
      // 同时从云端和本地获取
      const cloudResult = await this.creationHistoryManager.getCreationHistoryList({ 
        limit: 100
      });
      console.log('云端历史记录结果:', cloudResult);

      // 也读取本地存储作为补充
      const localHistory = wx.getStorageSync('creation_history') || [];
      console.log('本地历史记录数量:', localHistory.length);

      let allData = [];

      if (cloudResult.success && cloudResult.data && cloudResult.data.length > 0) {
        allData = cloudResult.data;
      }

      // 合并本地数据（去重）
      if (localHistory.length > 0) {
        const seenIds = new Set(allData.map(item => item._id || item.id));
        localHistory.forEach(item => {
          const id = item._id || item.id;
          if (!id || !seenIds.has(id)) {
            allData.push(item);
            if (id) seenIds.add(id);
          }
        });
      }

      console.log('合并后总历史记录数:', allData.length);
      if (allData.length > 0) {
        console.log('样例记录:', JSON.stringify(allData[0]).substring(0, 200));
      }

      if (allData.length > 0) {
        // 格式化 + 分类
        const formattedHistory = allData.map(item => ({
          ...item,
          createTime: this.formatTime(item.createdAt),
          category: this._classifyHistoryItem(item)
        }));

        // 按分类归组
        const scriptHistory = formattedHistory.filter(item => item.category === 'script');
        const storyboardHistory = formattedHistory.filter(item => item.category === 'storyboard');
        const videoHistory = formattedHistory.filter(item => item.category === 'video');

        console.log('分类结果:', {
          total: formattedHistory.length,
          script: scriptHistory.length,
          storyboard: storyboardHistory.length,
          video: videoHistory.length
        });

        this.setData({
          projectHistory: formattedHistory,
          scriptHistory: scriptHistory,
          storyboardHistory: storyboardHistory,
          videoHistory: videoHistory,
          loadingHistory: false
        });
      } else {
        console.log('无历史记录数据');
        this.setData({ 
          loadingHistory: false,
          projectHistory: [],
          scriptHistory: [],
          storyboardHistory: [],
          videoHistory: []
        });
      }
    } catch (error) {
      console.error('加载项目历史异常:', error);
      this.setData({ 
        loadingHistory: false,
        scriptHistory: [],
        storyboardHistory: [],
        videoHistory: []
      });
    }
  },

  // 格式化时间
  formatTime(isoString) {
    if (!isoString) return '';
    
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
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 提取可显示的内容文本
  extractDisplayContent(content) {
    if (!content) return '暂无内容';
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.content && typeof parsed.content === 'string') return parsed.content;
          if (parsed.description) return parsed.description;
          if (parsed.title) return parsed.title;
          if (parsed.text) return parsed.text;
        } catch (e) {}
      }
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
    if (typeof content === 'object') {
      if (content.content && typeof content.content === 'string') return content.content;
      if (content.description) return content.description;
      if (content.title) return content.title;
      if (content.text) return content.text;
      return JSON.stringify(content).substring(0, 100) + '...';
    }
    return String(content);
  },

  // 查看历史详情
  viewHistoryDetail(e) {
    const item = e.currentTarget.dataset.item;
    const displayContent = this.extractDisplayContent(item.content);
    wx.showModal({
      title: item.prompt || '创作记录',
      content: displayContent.length > 500 ? displayContent.substring(0, 500) + '...' : displayContent,
      showCancel: false,
      confirmText: '关闭'
    });
  },

  // 复制历史内容
  copyHistoryContent(e) {
    const content = e.currentTarget.dataset.content;
    const displayContent = this.extractDisplayContent(content);
    wx.setClipboardData({
      data: displayContent,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  }
})
