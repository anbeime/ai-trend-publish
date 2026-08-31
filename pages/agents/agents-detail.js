// pages/agents/agents-detail.js - 分镜详情编辑页面
Page({
  data: {
    loading: false,
    storyboardId: '',
    storyboard: {
      id: '',
      title: 'AI工具测评视频分镜',
      description: '展示AI工具的核心功能和使用效果，适合科技类账号',
      duration: 60,
      scenes: 5,
      consistencyStatus: 'good',
      statusText: '一致性良好',
      previewImage: 'https://picsum.photos/seed/storyboard-1/750/420.jpg'
    },
    selectedScene: {
      id: 'indoor-tech',
      name: '室内科技场景',
      desc: '适合展示科技产品和工具'
    },
    sceneOptions: [
      {
        id: 'indoor-tech',
        name: '室内科技场景',
        desc: '适合展示科技产品和工具'
      },
      {
        id: 'outdoor-nature',
        name: '户外自然场景',
        desc: '适合旅行、生活类内容'
      },
      {
        id: 'studio-bg',
        name: '专业影棚背景',
        desc: '适合美妆、教程类内容'
      },
      {
        id: 'home-environment',
        name: '居家环境',
        desc: '适合生活、家庭类内容'
      }
    ],
    availableTags: [
      { id: 'ai-tech', name: 'AI科技', selected: true },
      { id: 'software', name: '软件工具', selected: true },
      { id: 'tutorial', name: '教程', selected: false },
      { id: 'product-review', name: '产品测评', selected: true },
      { id: 'comparison', name: '对比评测', selected: false },
      { id: 'efficiency', name: '效率提升', selected: true },
      { id: 'future', name: '未来科技', selected: false },
      { id: 'innovation', name: '创新', selected: true }
    ],
    showSceneSelector: false,
    applyToAll: false,
    isEditing: false,
    originalData: null
  },

  onLoad(options) {
    console.log('分镜详情页面加载', options)
    
    if (options.id) {
      this.setData({ storyboardId: options.id })
      this.loadStoryboard(options.id)
    }
    
    // 如果没有传入ID，则是创建新分镜
    if (options.mode === 'create') {
      this.setData({
        isEditing: true,
        storyboard: {
          id: 'new',
          title: '',
          description: '',
          duration: 45,
          scenes: 1,
          consistencyStatus: 'warning',
          statusText: '新建分镜',
          previewImage: ''
        },
        originalData: null
      })
    }
  },

  // 加载分镜数据
  async loadStoryboard(id) {
    this.setData({ loading: true })
    
    try {
      // 这里应该调用云函数获取分镜详情
      // 暂时使用模拟数据
      const mockStoryboard = {
        id: id,
        title: 'AI工具测评视频分镜',
        description: '展示AI工具的核心功能和使用效果，适合科技类账号',
        duration: 60,
        scenes: 5,
        consistencyStatus: 'good',
        statusText: '一致性良好',
        previewImage: 'https://picsum.photos/seed/storyboard-1/750/420.jpg'
      }
      
      this.setData({
        storyboard: mockStoryboard,
        loading: false,
        originalData: { ...mockStoryboard }
      })
      
    } catch (error) {
      console.error('加载分镜失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 标题变化
  onTitleChange(e) {
    this.setData({
      'storyboard.title': e.detail.value
    })
  },

  // 描述变化
  onDescriptionChange(e) {
    this.setData({
      'storyboard.description': e.detail.value
    })
  },

  // 显示场景选择器
  showSceneSelector() {
    this.setData({
      showSceneSelector: !this.data.showSceneSelector
    })
  },

  // 选择场景
  selectScene(e) {
    const scene = e.currentTarget.dataset.scene
    this.setData({
      selectedScene: scene,
      showSceneSelector: false
    })
  },

  // 切换标签选中状态
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const { availableTags } = this.data
    
    const updatedTags = availableTags.map(t => 
      t.id === tag.id ? { ...t, selected: !t.selected } : t
    )
    
    this.setData({ availableTags: updatedTags })
  },

  // 添加自定义标签
  addCustomTag() {
    wx.showModal({
      title: '添加标签',
      content: '请输入新标签名称：',
      editable: true,
      placeholderText: '标签名称',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const newTag = {
            id: `custom-${Date.now()}`,
            name: res.content.trim(),
            selected: true
          }
          
          this.setData({
            availableTags: [...this.data.availableTags, newTag]
          })
          
          wx.showToast({
            title: '标签已添加',
            icon: 'success'
          })
        }
      }
    })
  },

  // 播放预览
  playPreview() {
    const { storyboard } = this.data
    
    if (storyboard.previewImage) {
      wx.previewImage({
        urls: [storyboard.previewImage]
      })
    } else {
      wx.showToast({
        title: '暂无预览图',
        icon: 'none'
      })
    }
  },

  // 应用到所有分镜开关变化
  onApplyToAllChange(e) {
    this.setData({
      applyToAll: e.detail.value
    })
  },

  // 保存分镜
  async saveStoryboard() {
    const { storyboard, selectedScene, availableTags, applyToAll, storyboardId } = this.data
    
    // 验证输入
    if (!storyboard.title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }
    
    this.setData({ loading: true })
    
    try {
      // 构建保存数据
      const saveData = {
        title: storyboard.title.trim(),
        description: storyboard.description.trim(),
        scene: selectedScene,
        tags: availableTags.filter(tag => tag.selected).map(tag => tag.name),
        duration: storyboard.duration,
        scenes: storyboard.scenes,
        consistencyStatus: storyboard.consistencyStatus
      }
      
      console.log('保存数据:', saveData)
      
      // 调用云函数保存
      const action = storyboardId === 'new' ? 'create' : 'update'
      const res = await wx.cloud.callFunction({
        name: 'project-manager',
        data: {
          action: action,
          projectId: storyboardId === 'new' ? undefined : storyboardId,
          data: saveData,
          applyToAll: applyToAll
        }
      })
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result?.error || '保存失败',
          icon: 'none'
        })
      }
      
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 取消编辑
  cancelEdit() {
    const { originalData } = this.data
    
    if (originalData) {
      // 恢复原始数据
      this.setData({
        storyboard: originalData,
        isEditing: false
      })
    }
    
    // 返回上一页
    wx.navigateBack()
  },

  // 删除分镜
  deleteStoryboard() {
    const { storyboardId } = this.data
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个分镜吗？删除后无法恢复。',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'project-manager',
              data: {
                action: 'delete',
                projectId: storyboardId
              }
            })
            
            if (result.result && result.result.success) {
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
                title: result.result?.error || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('删除失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          } finally {
            this.setData({ loading: false })
          }
        }
      }
    })
  },

  // 复制分镜
  copyStoryboard() {
    const { storyboard } = this.data
    
    wx.setClipboardData({
      data: JSON.stringify(storyboard, null, 2),
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  // 查看历史版本
  viewHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 进入编辑模式
  enterEditMode() {
    this.setData({
      isEditing: true,
      originalData: { ...this.data.storyboard }
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})