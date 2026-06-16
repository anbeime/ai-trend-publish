// pages/dream/dream.js
const db = wx.cloud.database()

Page({
  data: {
    activeTab: 'record',
    ideaContent: '',
    dreamContent: '',
    selectedTags: [],
    selectedMood: '',
    saving: false,
    generating: false,
    analyzing: false,
    chatInput: '',
    chatHistory: [],
    chatLoading: false,
    scrollToView: '',
    showHistory: false,
    showAnalysisPanel: false,
    historyList: [],
    showImagePreview: false,
    generatedImageUrl: '',
    professionalPrompt: '',
    imageConfirmed: false,
    professionalAnalysis: {
      psychologicalInsight: '',
      symbolicMeaning: '',
      emotionalSupport: '',
      practicalAdvice: '',
      rawResponse: ''
    },
    tagClasses: {
      'chuangyi': '',
      'wennuan': '',
      'ningjing': '',
      'xiwang': '',
      'yongqi': '',
      'gandong': ''
    },
    hunyuanConfig: {
      enabled: false,
      model: 'hunyuan-lite',
      supportedAgents: []
    }
  },

  // 专业梦境解析（需先确认梦境图像）
  professionalDreamAnalysis: async function() {
    const { dreamContent, selectedMood, imageConfirmed, generatedImageUrl, professionalPrompt } = this.data
    
    if (!dreamContent.trim()) {
      wx.showToast({
        title: '请先输入梦境内容',
        icon: 'none',
        duration: 5000
      })
      return
    }
    
    // 检查是否已生成并确认梦境图像
    if (!imageConfirmed || !generatedImageUrl) {
      wx.showModal({
        title: '请先确认梦境图像',
        content: '为了更准确地解析你的梦境，请先生成梦境图像并确认这是你的梦。',
        confirmText: '去生成图像',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 切换到图像生成面板
            this.setData({ 
              activeTab: 'record',
              showImagePreview: true 
            })
            wx.showToast({
              title: '请点击"生成梦境图片"按钮',
              icon: 'none',
              duration: 5000
            })
          }
        }
      })
      return
    }
    
    this.setData({ 
      analyzing: true,
      showAnalysisPanel: true 
    })
    
    try {
      // 构建专业解析请求，融入专业提示词
      let prompt = `请对以下梦境进行专业解析：
梦境内容：${dreamContent}
梦境氛围：${selectedMood || '未指定'}`

      // 如果存在专业提示词，加入作为视觉参考
      if (professionalPrompt && professionalPrompt.trim()) {
        prompt += `\n梦境视觉描述（即梦提示词）：${professionalPrompt}`
      }

      prompt += `\n\n请按照标准格式回复，包含心理学分析、象征学解释、情绪支持和实用建议。`
      
      // 调用云函数
      const res = await wx.cloud.callFunction({
        name: 'chatDream',
        data: {
          userMessage: prompt,
          conversationHistory: []
        }
      })
      
      if (res.result && res.result.success) {
        const aiReply = res.result.reply
        
        // 解析回复内容
        const parsedAnalysis = this.parseProfessionalResponse(aiReply)
        
        this.setData({
          professionalAnalysis: {
            ...parsedAnalysis,
            rawResponse: aiReply
          }
        })
        
        wx.showToast({
          title: '解析完成',
          icon: 'success',
          duration: 1500
        })
      } else {
        throw new Error(res.result?.error || '解析失败')
      }
    } catch (error) {
      console.error('解析失败:', error)
      wx.showToast({
        title: '解析失败，请重试',
        icon: 'none',
        duration: 5000
      })
    } finally {
      this.setData({ analyzing: false })
    }
  },
  
  // 解析专业回复
  parseProfessionalResponse: function(text) {
    // 初始化各部分
    const analysis = {
      psychologicalInsight: '',
      symbolicMeaning: '',
      emotionalSupport: '',
      practicalAdvice: '',
      rawResponse: text
    }
    
    // 尝试从格式中提取
    // 模式1：心理学分析
    const psychologyPattern = /心理学分析[：:]\s*([^。]+\.?)/i
    const psychologyMatch = text.match(psychologyPattern)
    if (psychologyMatch) {
      analysis.psychologicalInsight = psychologyMatch[1].trim()
    } else {
      // 备用模式：寻找包含"心理学"的句子
      const sentences = text.split(/[。！？\.\!\?]/)
      for (const sentence of sentences) {
        if (sentence.includes('心理学') || sentence.includes('心理层面')) {
          analysis.psychologicalInsight = sentence.trim()
          break
        }
      }
    }
    
    // 模式2：象征学解释
    const symbolismPattern = /象征学解释[：:]\s*([^。]+\.?)/i
    const symbolismMatch = text.match(symbolismPattern)
    if (symbolismMatch) {
      analysis.symbolicMeaning = symbolismMatch[1].trim()
    } else {
      const sentences = text.split(/[。！？\.\!\?]/)
      for (const sentence of sentences) {
        if (sentence.includes('象征') || sentence.includes('象征学')) {
          analysis.symbolicMeaning = sentence.trim()
          break
        }
      }
    }
    
    // 模式3：情绪支持
    const emotionPattern = /情绪支持[：:]\s*([^。]+\.?)/i
    const emotionMatch = text.match(emotionPattern)
    if (emotionMatch) {
      analysis.emotionalSupport = emotionMatch[1].trim()
    } else {
      // 寻找温暖支持性语言
      const supportKeywords = ['温暖', '拥抱', '理解', '陪伴', '关爱', '支持']
      const sentences = text.split(/[。！？\.\!\?]/)
      for (const sentence of sentences) {
        for (const keyword of supportKeywords) {
          if (sentence.includes(keyword)) {
            analysis.emotionalSupport = sentence.trim()
            break
          }
        }
        if (analysis.emotionalSupport) break
      }
    }
    
    // 模式4：实用建议
    const advicePattern = /实用建议[：:]\s*([^。]+\.?)/i
    const adviceMatch = text.match(advicePattern)
    if (adviceMatch) {
      analysis.practicalAdvice = adviceMatch[1].trim()
    } else {
      // 寻找建议性语言
      const adviceKeywords = ['建议', '可以试试', '尝试', '不妨', '推荐']
      const sentences = text.split(/[。！？\.\!\?]/)
      for (const sentence of sentences) {
        for (const keyword of adviceKeywords) {
          if (sentence.includes(keyword)) {
            analysis.practicalAdvice = sentence.trim()
            break
          }
        }
        if (analysis.practicalAdvice) break
      }
    }
    
    // 如果任何部分为空，使用原始回复的前200字符作为后备
    if (!analysis.psychologicalInsight && !analysis.symbolicMeaning) {
      analysis.psychologicalInsight = text.substring(0, 200) + '...'
    }
    
    return analysis
  },
  
  // 关闭解析面板
  closeAnalysisPanel: function() {
    this.setData({
      showAnalysisPanel: false,
      professionalAnalysis: {
        psychologicalInsight: '',
        symbolicMeaning: '',
        emotionalSupport: '',
        practicalAdvice: '',
        rawResponse: ''
      }
    })
  },
  
  // 保存解析报告
  saveAnalysis: function() {
    const { professionalAnalysis } = this.data
    
    wx.showLoading({
      title: '保存中...'
    })
    
    // 保存到数据库
    const db = wx.cloud.database()
    db.collection('dream_analysis').add({
      data: {
        ...professionalAnalysis,
        createTime: db.serverDate()
      },
      success: () => {
        wx.hideLoading()
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 5000
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('保存失败:', err)
        wx.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 5000
        })
      }
    })
  },
  
  // 分享解析
  shareAnalysis: function() {
    const { professionalAnalysis } = this.data
    
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none',
      duration: 5000
    })
  },

  onLoad: function() {
    this.loadChatHistory()
    this.loadHistoryList()
    this.loadHunyuanConfig()
  },

  onShow: function() {
    this.loadHistoryList()
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    
    this.setData({ activeTab: tab })
    
    if (tab === 'chat') {
      this.loadChatHistory()
    } else if (tab === 'history') {
      this.loadHistoryList()
    }
  },

  onIdeaInput: function(e) {
    this.setData({ ideaContent: e.detail.value })
  },

  onDreamInput: function(e) {
    this.setData({ dreamContent: e.detail.value })
  },

  toggleTag: function(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = [...this.data.selectedTags]
    
    const index = selectedTags.indexOf(tag)
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      if (selectedTags.length < 3) {
        selectedTags.push(tag)
      } else {
        wx.showToast({
          title: '最多选择3个标签',
          icon: 'none',
          duration: 5000
        })
        return
      }
    }
    
    this.setData({ selectedTags })
  },

  selectMood: function(e) {
    const mood = e.currentTarget.dataset.mood
    this.setData({ selectedMood: mood })
  },

  saveIdea: async function() {
    const { ideaContent, selectedTags } = this.data
    
    if (!ideaContent.trim()) {
      wx.showToast({
        title: '请输入灵感内容',
        icon: 'none',
        duration: 5000
      })
      return
    }
    
    this.setData({ saving: true })
    
    try {
      // 保存灵感到数据库
      const res = await db.collection('dream_ideas').add({
        data: {
          content: ideaContent,
          tags: selectedTags,
          createTime: db.serverDate()
        }
      })
      
      wx.showToast({
        title: '灵感已保存',
        icon: 'success',
        duration: 5000
      })
      
      // 重置表单
      this.setData({ 
        ideaContent: '',
        selectedTags: [],
        saving: false 
      })
      
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 5000
      })
      this.setData({ saving: false })
    }
  },

  saveDream: async function() {
    const { dreamContent, selectedMood } = this.data
    
    if (!dreamContent.trim()) {
      wx.showToast({
        title: '请输入梦境内容',
        icon: 'none',
        duration: 5000
      })
      return
    }
    
    this.setData({ saving: true })
    
    try {
      // 保存梦境到数据库
      const res = await db.collection('dream_records').add({
        data: {
          content: dreamContent,
          mood: selectedMood,
          createTime: db.serverDate()
        }
      })
      
      wx.showToast({
        title: '梦境已保存',
        icon: 'success',
        duration: 5000
      })
      
      // 重置表单
      this.setData({ 
        dreamContent: '',
        selectedMood: '',
        saving: false 
      })
      
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 5000
      })
      this.setData({ saving: false })
    }
  },

  generateIdeaImage: async function() {
    const { ideaContent } = this.data
    
    if (!ideaContent.trim()) {
      wx.showToast({
        title: '请输入灵感内容',
        icon: 'none',
        duration: 5000
      })
      return
    }
    
    this.setData({ generating: true })
    
    try {
      // 调用云函数生成图像
      const res = await wx.cloud.callFunction({
        name: 'generateImage',
        data: {
          prompt: ideaContent,
          style: 'inspirational'
        }
      })
      
      if (res.result && res.result.success) {
        this.setData({
          generatedImageUrl: res.result.imageUrl,
          showImagePreview: true
        })
      } else {
        throw new Error(res.result?.error || '生成失败')
      }
    } catch (error) {
      console.error('图像生成失败:', error)
      wx.showToast({
        title: '图像生成失败',
        icon: 'none',
        duration: 5000
      })
    } finally {
      this.setData({ generating: false })
    }
  },

  generateDreamImage: async function() {
    const { dreamContent, selectedMood } = this.data
    
    if (!dreamContent.trim()) {
      wx.showToast({
        title: '请输入梦境内容',
        icon: 'none',
        duration: 5000
      })
      return
    }
    
    this.setData({ generating: true })
    
    try {
      // 构建专业提示词
      const moodText = selectedMood ? `，氛围是${selectedMood}` : ''
      const prompt = `梦境：${dreamContent}${moodText}`
      const professionalPrompt = `一幅描绘梦境的艺术作品：${dreamContent}，氛围：${selectedMood || '神秘'}`
      
      // 获取混元配置
      const { hunyuanConfig } = this.data
      
      // 调用云函数生成图像
      const res = await wx.cloud.callFunction({
        name: 'generateImage',
        data: {
          prompt: prompt,
          style: 'dreamlike',
          useHunyuan: hunyuanConfig.enabled // 使用混元配置
        }
      })
      
      if (res.result && res.result.success) {
        this.setData({
          generatedImageUrl: res.result.imageUrl,
          professionalPrompt: professionalPrompt,
          showImagePreview: true,
          imageConfirmed: false
        })
      } else {
        throw new Error(res.result?.error || '生成失败')
      }
    } catch (error) {
      console.error('图像生成失败:', error)
      wx.showToast({
        title: '图像生成失败',
        icon: 'none',
        duration: 5000
      })
    } finally {
      this.setData({ generating: false })
    }
  },

  // 加载混元配置
  loadHunyuanConfig: function() {
    try {
      const config = wx.getStorageSync("hunyuan_config") || {};
      // 如果本地存储没有配置，使用data中的默认配置
      const hunyuanConfig = {
        enabled: config.enabled !== undefined ? config.enabled : this.data.hunyuanConfig.enabled,
        model: config.model || this.data.hunyuanConfig.model,
        supportedAgents: config.supportedAgents || this.data.hunyuanConfig.supportedAgents,
      };
      this.setData({ hunyuanConfig });
      console.log('混元配置加载成功:', hunyuanConfig);
    } catch (error) {
      console.error('加载混元配置失败:', error);
    }
  },

  // 保存混元配置
  saveHunyuanConfig: function(config) {
    try {
      wx.setStorageSync("hunyuan_config", config);
      this.setData({ hunyuanConfig: config });
      console.log('混元配置保存成功:', config);
      wx.showToast({ title: '配置已保存', icon: 'success' });
    } catch (error) {
      console.error('保存混元配置失败:', error);
    }
  },

  // 显示混元配置对话框
  showHunyuanConfigDialog: function() {
    const { hunyuanConfig } = this.data;
    wx.showModal({
      title: '混元API配置',
      content: '是否启用混元API？',
      showCancel: true,
      confirmText: hunyuanConfig.enabled ? '禁用' : '启用',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const newConfig = {
            ...hunyuanConfig,
            enabled: !hunyuanConfig.enabled,
          };
          this.saveHunyuanConfig(newConfig);
        }
      }
    });
  },

  loadChatHistory: function() {
    this.setData({ chatLoading: true })
    
    db.collection('dream_chats')
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()
      .then(res => {
        this.setData({
          chatHistory: res.data.reverse(),
          scrollToView: `msg-${res.data.length - 1}`,
          chatLoading: false
        })
      })
      .catch(err => {
        console.error('加载聊天记录失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none',
          duration: 5000
        })
        this.setData({ chatLoading: false })
      })
  },

  sendMessage: function(e) {
    const { chatInput } = this.data
    
    if (!chatInput.trim()) {
      wx.showToast({
        title: '请输入消息',
        icon: 'none',
        duration: 5000
      })
      return
    }
    
    const newMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }
    
    // 添加到本地聊天历史
    const chatHistory = [...this.data.chatHistory, newMessage]
    this.setData({
      chatHistory,
      chatInput: '',
      chatLoading: true,
      scrollToView: `msg-${chatHistory.length - 1}`
    })
    
    // 调用云函数
    wx.cloud.callFunction({
      name: 'chatDream',
      data: {
        userMessage: chatInput,
        conversationHistory: chatHistory.slice(-5)
      }
    })
    .then(res => {
      if (res.result && res.result.success) {
        const aiMessage = {
          role: 'assistant',
          content: res.result.reply,
          timestamp: new Date()
        }
        
        // 更新聊天历史
        const updatedHistory = [...chatHistory, aiMessage]
        this.setData({
          chatHistory: updatedHistory,
          scrollToView: `msg-${updatedHistory.length - 1}`
        })
        
        // 保存到数据库
        db.collection('dream_chats').add({
          data: {
            messages: updatedHistory,
            createTime: db.serverDate()
          }
        })
      } else {
        throw new Error(res.result?.error || '发送失败')
      }
    })
    .catch(err => {
      console.error('发送消息失败:', err)
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none',
        duration: 5000
      })
    })
    .finally(() => {
      this.setData({ chatLoading: false })
    })
  },

  loadHistoryList: function() {
    Promise.all([
      db.collection('dream_ideas').orderBy('createTime', 'desc').limit(5).get(),
      db.collection('dream_records').orderBy('createTime', 'desc').limit(5).get(),
      db.collection('dream_analysis').orderBy('createTime', 'desc').limit(5).get()
    ])
    .then(([ideas, dreams, analysis]) => {
      const historyList = [
        ...ideas.data.map(item => ({ ...item, type: 'idea' })),
        ...dreams.data.map(item => ({ ...item, type: 'dream' })),
        ...analysis.data.map(item => ({ ...item, type: 'analysis' }))
      ]
      
      // 按时间排序
      historyList.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      
      this.setData({ historyList })
    })
    .catch(err => {
      console.error('加载历史记录失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 5000
      })
    })
  },

  closeImagePreview: function() {
    this.setData({ showImagePreview: false })
  },

  saveImage: function() {
    const { generatedImageUrl } = this.data
    
    if (!generatedImageUrl) {
      wx.showToast({
        title: '没有图片可保存',
        icon: 'none',
        duration: 5000
      })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    wx.getImageInfo({
      src: generatedImageUrl,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.path,
          success: () => {
            wx.hideLoading()
            wx.showToast({
              title: '图片已保存到相册',
              icon: 'success',
              duration: 5000
            })
          },
          fail: (err) => {
            wx.hideLoading()
            console.error('保存到相册失败:', err)
            wx.showToast({
              title: '保存失败',
              icon: 'none',
              duration: 5000
            })
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('获取图片信息失败:', err)
        wx.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 5000
        })
      }
    })
  },

  toggleHistory: function() {
    this.setData({ showHistory: !this.data.showHistory })
  },

  closeHistory: function() {
    this.setData({ showHistory: false })
  },

  viewHistory: function(e) {
    const { id, type } = e.currentTarget.dataset
    
    if (type === 'analysis') {
      // 查看详细解析报告
      db.collection('dream_analysis').doc(id).get()
        .then(res => {
          this.setData({
            professionalAnalysis: res.data,
            showAnalysisPanel: true
          })
        })
        .catch(err => {
          console.error('加载解析报告失败:', err)
          wx.showToast({
            title: '加载失败',
            icon: 'none',
            duration: 5000
          })
        })
    } else if (type === 'dream') {
      // 查看梦境详情
      db.collection('dream_records').doc(id).get()
        .then(res => {
          wx.showModal({
            title: '梦境详情',
            content: res.data.content,
            showCancel: false
          })
        })
    } else if (type === 'idea') {
      // 查看灵感详情
      db.collection('dream_ideas').doc(id).get()
        .then(res => {
          wx.showModal({
            title: '灵感详情',
            content: res.data.content,
            showCancel: false
          })
        })
    }
    
    this.setData({ showHistory: false })
  },

  onChatInput: function(e) {
    this.setData({ chatInput: e.detail.value })
  },

  // 格式化日期
  formatDate: function(date) {
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }
})