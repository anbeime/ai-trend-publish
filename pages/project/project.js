// pages/project/project.js
const CreationHistoryManager = require('../agents/modules/creation-history-manager.js');

Page({
  data: {
    projectId: '',
    project: {},
    projects: [], // 项目列表
    showProjectList: false, // 是否显示项目列表
    activeTab: 'script',
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

  // 加载项目历史记录
  async loadProjectHistory(projectId) {
    console.log('=== 开始加载项目历史 ===');
    console.log('projectId:', projectId);
    this.setData({ loadingHistory: true });

    try {
      // 先尝试查询所有历史记录（用于调试）
      const allResult = await this.creationHistoryManager.getCreationHistoryList({ 
        limit: 100
      });
      console.log('所有历史记录:', allResult);

      // 获取当前用户的所有历史记录
      const userId = wx.getStorageSync("openid") || "unknown";
      console.log('当前用户ID:', userId);
      
      const result = await this.creationHistoryManager.getCreationHistoryList({ 
        limit: 100,
        userId: userId
      });

      console.log('用户历史记录查询结果:', result);

      if (result.success && result.data) {
        console.log('查询到的历史记录数量:', result.data.length);
        console.log('历史记录详情:', result.data);
        
        const formattedHistory = result.data.map(item => ({
          ...item,
          createTime: this.formatTime(item.createdAt)
        }));

        // 按agentId分类历史记录
        const scriptHistory = formattedHistory.filter(item => 
          item.agentId && (
            item.agentId.includes('script') || 
            item.agentId.includes('text') ||
            item.agentName && item.agentName.includes('脚本')
          )
        );
        const storyboardHistory = formattedHistory.filter(item => 
          item.agentId && (
            item.agentId.includes('storyboard') || 
            item.agentId.includes('shot') ||
            item.agentId.includes('image') ||
            item.mediaType === 'image' ||
            item.agentName && (item.agentName.includes('分镜') || item.agentName.includes('镜头') || item.agentName.includes('图片'))
          )
        );
        const videoHistory = formattedHistory.filter(item => 
          item.agentId && (
            item.agentId.includes('video') || 
            item.mediaType === 'video' ||
            item.agentName && item.agentName.includes('视频')
          )
        );

        console.log('分类结果:', {
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

        console.log('历史记录加载完成:', {
          total: formattedHistory.length,
          script: scriptHistory.length,
          storyboard: storyboardHistory.length,
          video: videoHistory.length
        });
      } else {
        console.error('加载项目历史失败:', result.error);
        this.setData({ 
          loadingHistory: false,
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

  // 查看历史详情
  viewHistoryDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: item.prompt || '创作记录',
      content: item.content || '暂无内容',
      showCancel: false,
      confirmText: '关闭'
    });
  },

  // 复制历史内容
  copyHistoryContent(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  }
})
