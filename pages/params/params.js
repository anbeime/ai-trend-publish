// pages/params/params.js - 参数设置页面
Page({
  data: {
    // 分享链接
    shareUrl: '',

    // 热点关键词
    hotspotKeyword: '',
    keywordMaxLength: 15,

    // 参考图片描述
    imageDescription: '',

    // 分镜数量
    sceneCount: 4,

    // 视频风格
    videoStyles: [
      { id: 'news', name: '热点资讯', desc: '快速传达热点信息' },
      { id: 'creative', name: '剧情创意', desc: '富有创意的故事表达' },
      { id: 'education', name: '知识科普', desc: '专业的知识讲解' }
    ],
    selectedVideoStyle: 'news',
    selectedVideoStyleDesc: '快速传达热点信息',

    // 电影风格
    movieStyles: [
      { id: 'none', name: '不使用' },
      { id: 'thriller', name: '悬疑惊悚' },
      { id: 'comedy', name: '轻松喜剧' },
      { id: 'romance', name: '浪漫爱情' },
      { id: 'action', name: '动作冒险' },
      { id: 'scifi', name: '科幻未来' },
      { id: 'fantasy', name: '奇幻冒险' },
      { id: 'documentary', name: '纪录片风格' },
      { id: 'anime', name: '动漫风格' }
    ],
    selectedMovieStyle: 'none',

    // 脚本创作元素
    scriptElements: [
      { id: 'emotion', name: '情感共鸣', icon: '❤️' },
      { id: 'suspense', name: '悬念反转', icon: '🎭' },
      { id: 'life', name: '生活化表达', icon: '🏠' },
      { id: 'humor', name: '幽默风趣', icon: '😄' },
      { id: 'inspiration', name: '励志向上', icon: '✨' },
      { id: 'profession', name: '专业科普', icon: '📚' }
    ],
    selectedScriptElements: [],

    // 创作额度
    quotaUsed: 0,
    quotaTotal: 3,
    coins: 50,

    // 生成状态
    isGenerating: false
  },

  onLoad(options) {
    console.log('参数设置页面加载', options)
    
    // 从上一页获取数据
    if (options.trend) {
      this.setData({
        hotspotKeyword: decodeURIComponent(options.trend)
      })
    }
    
    if (options.reason) {
      this.setData({
        imageDescription: decodeURIComponent(options.reason)
      })
    }
  },

  // 分享链接输入
  onShareUrlInput(e) {
    this.setData({
      shareUrl: e.detail.value
    })
  },

  // 解析分享链接
  async parseShareUrl() {
    if (!this.data.shareUrl) {
      wx.showToast({
        title: '请输入链接',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '解析中...'
    })

    // 调用 hotspot-collector 云函数解析链接
    try {
      const res = await wx.cloud.callFunction({
        name: 'hotspot-collector',
        data: {
          action: 'parseUrl',
          url: this.data.shareUrl
        }
      })

      wx.hideLoading()

      if (res.result && res.result.success) {
        console.log('链接解析成功:', res.result.data)

        // 将解析结果填充到输入框
        this.setData({
          hotspotKeyword: res.result.data.title || '',
          imageDescription: res.result.data.content || ''
        })

        wx.showToast({
          title: '解析成功',
          icon: 'success'
        })

        // 自动显示"已解析"状态
        const parsedUrl = res.result.data.title || ''
        if (parsedUrl) {
          this.setData({
            parsedUrl: `已解析: ${parsedUrl}`
          })
        }
      } else {
        throw new Error(res.result?.message || '解析失败')
      }
    } catch (error) {
      wx.hideLoading()
      console.error('链接解析失败:', error)

      wx.showToast({
        title: '解析失败',
        icon: 'none'
      })
    }
  },

  // 热点关键词输入
  onKeywordInput(e) {
    const value = e.detail.value
    if (value.length > this.data.keywordMaxLength) {
      wx.showToast({
        title: `最多${this.data.keywordMaxLength}个字符`,
        icon: 'none'
      })
      return
    }

    this.setData({
      hotspotKeyword: value
    })
  },

  // 参考图片描述输入
  onImageDescriptionInput(e) {
    this.setData({
      imageDescription: e.detail.value
    })
  },

  // 分镜数量增加
  onSceneCountPlus() {
    let count = this.data.sceneCount + 1
    if (count > 5) {
      count = 5
      wx.showToast({
        title: '最多5个分镜',
        icon: 'none'
      })
      return
    }
    this.setData({ sceneCount: count })
  },

  // 分镜数量减少
  onSceneCountMinus() {
    let count = this.data.sceneCount - 1
    if (count < 3) {
      count = 3
      wx.showToast({
        title: '最少3个分镜',
        icon: 'none'
      })
      return
    }
    this.setData({ sceneCount: count })
  },

  // 分镜数量变化
  onSceneCountChange(e) {
    const count = parseInt(e.detail.value)
    if (count < 3 || count > 5) {
      wx.showToast({
        title: '分镜数量3-5个',
        icon: 'none'
      })
      return
    }

    this.setData({
      sceneCount: count
    })
  },

  // 选择视频风格
  selectVideoStyle(e) {
    const styleId = e.currentTarget.dataset.id
    const videoStyles = this.data.videoStyles
    const selectedStyle = videoStyles.find(s => s.id === styleId)
    this.setData({
      selectedVideoStyle: styleId,
      selectedVideoStyleDesc: selectedStyle ? selectedStyle.desc : ''
    })
  },

  // 选择电影风格
  selectMovieStyle(e) {
    const styleId = e.currentTarget.dataset.id
    this.setData({
      selectedMovieStyle: styleId
    })
  },

  // 选择脚本创作元素
  toggleScriptElement(e) {
    const elementId = e.currentTarget.dataset.id
    const selected = this.data.selectedScriptElements
    const index = selected.indexOf(elementId)
    
    if (index > -1) {
      selected.splice(index, 1)
    } else {
      if (selected.length >= 3) {
        wx.showToast({
          title: '最多选择3个元素',
          icon: 'none'
        })
        return
      }
      selected.push(elementId)
    }
    
    this.setData({
      selectedScriptElements: selected
    })
  },

  // 检查额度
  checkQuota() {
    if (this.data.quotaUsed >= this.data.quotaTotal) {
      if (this.data.coins < 10) {
        wx.showModal({
          title: '额度不足',
          content: '今日免费额度已用完，金币不足10个',
          confirmText: '去兑换',
          success: (res) => {
            if (res.confirm) {
              wx.navigateBack()
            }
          }
        })
        return false
      }
    }
    
    return true
  },

  // 生成视频
  async generateVideo() {
    if (this.data.isGenerating) {
      return
    }

    // 验证参数
    if (!this.data.hotspotKeyword) {
      wx.showToast({
        title: '请输入热点关键词',
        icon: 'none'
      })
      return
    }

    // 检查额度
    if (!this.checkQuota()) {
      return
    }

    this.setData({ isGenerating: true })

    wx.showLoading({
      title: '生成中...'
    })

    // 构建参数
    const params = {
      keyword: this.data.hotspotKeyword,
      description: this.data.imageDescription,
      sceneCount: this.data.sceneCount,
      videoStyle: this.data.selectedVideoStyle,
      movieStyle: this.data.selectedMovieStyle,
      scriptElements: this.data.selectedScriptElements
    }

    console.log('生成视频参数:', params)

    try {
      // 跳转到agents页面进行生成
      wx.navigateTo({
        url: `/pages/agents/agents?params=${encodeURIComponent(JSON.stringify(params))}`
      })

      wx.hideLoading()
      this.setData({ isGenerating: false })
    } catch (error) {
      wx.hideLoading()
      this.setData({ isGenerating: false })
      console.error('生成失败:', error)
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      })
    }
  }
})
