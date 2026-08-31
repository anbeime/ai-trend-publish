// pages/preference/preference.js - 用户偏好设置
Page({
  data: {
    // 内容类型偏好
    contentTypes: [
      { id: 'hotspot', name: '热点资讯', icon: '🔥' },
      { id: 'education', name: '知识科普', icon: '📚' },
      { id: 'entertainment', name: '娱乐八卦', icon: '🎬' },
      { id: 'lifestyle', name: '生活技巧', icon: '💡' }
    ],
    selectedContentTypes: [],

    // 视频时长偏好
    videoDuration: 60, // 秒

    // 风格偏好
    stylePreference: 'modern', // modern, retro, minimal, cinematic

    // 语言偏好
    languagePreference: 'chinese', // chinese, bilingual

    // 自动保存设置
    autoSave: true
  },

  onLoad() {
    this.loadPreferences()
  },

  // 加载偏好设置
  loadPreferences() {
    const saved = wx.getStorageSync('userPreferences')
    if (saved) {
      this.setData({
        selectedContentTypes: saved.selectedContentTypes || [],
        videoDuration: saved.videoDuration || 60,
        stylePreference: saved.stylePreference || 'modern',
        languagePreference: saved.languagePreference || 'chinese',
        autoSave: saved.autoSave !== undefined ? saved.autoSave : true
      })
    }
  },

  // 切换内容类型
  toggleContentType(e) {
    const type = e.currentTarget.dataset.type
    const selected = this.data.selectedContentTypes

    const index = selected.indexOf(type)
    if (index === -1) {
      selected.push(type)
    } else {
      selected.splice(index, 1)
    }

    this.setData({ selectedContentTypes: selected })

    if (this.data.autoSave) {
      this.savePreferences()
    }
  },

  // 设置视频时长
  setVideoDuration(e) {
    this.setData({ videoDuration: e.detail.value })

    if (this.data.autoSave) {
      this.savePreferences()
    }
  },

  // 设置风格偏好
  setStylePreference(e) {
    this.setData({ stylePreference: e.detail.value })

    if (this.data.autoSave) {
      this.savePreferences()
    }
  },

  // 设置语言偏好
  setLanguagePreference(e) {
    this.setData({ languagePreference: e.detail.value })

    if (this.data.autoSave) {
      this.savePreferences()
    }
  },

  // 切换自动保存
  toggleAutoSave() {
    this.setData({ autoSave: !this.data.autoSave })
    this.savePreferences()
  },

  // 保存偏好设置
  savePreferences() {
    const preferences = {
      selectedContentTypes: this.data.selectedContentTypes,
      videoDuration: this.data.videoDuration,
      stylePreference: this.data.stylePreference,
      languagePreference: this.data.languagePreference,
      autoSave: this.data.autoSave
    }

    wx.setStorageSync('userPreferences', preferences)
    console.log('偏好设置已保存:', preferences)
  },

  // 重置偏好
  resetPreferences() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有偏好设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            selectedContentTypes: [],
            videoDuration: 60,
            stylePreference: 'modern',
            languagePreference: 'chinese',
            autoSave: true
          })
          this.savePreferences()
          wx.showToast({
            title: '已重置',
            icon: 'success'
          })
        }
      }
    })
  }
})
