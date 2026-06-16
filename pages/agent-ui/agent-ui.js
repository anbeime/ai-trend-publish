// pages/agent-ui/agent-ui.js
Page({
  data: {
    // Agent-UI 配置
    env: 'invideo-6gidgilyee392cc8', // 云开发环境ID
    botId: '', // Agent Bot ID
    // 预配置的Bot ID：agent-zhinenkaifa-6ejbei4d6ae288
    // 点击页面"配置"按钮可快速使用预配置的Bot ID
    
    // 聊天状态
    messages: [],
    inputValue: '',
    isTyping: false,
    sending: false,
    initialized: false,
    threadId: null,
    
    // 云开发AI能力
    ai: null
  },

  onLoad() {
    console.log('Agent-UI 页面加载')
    this.initAgentUI()
  },

  onShow() {
    // 检查基础库版本
    const systemInfo = wx.getSystemInfoSync()
    const SDKVersion = systemInfo.SDKVersion
    console.log('基础库版本:', SDKVersion)
    
    // 检查是否支持 AI 能力
    if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
      console.warn('当前基础库版本不支持 AI 能力')
      this.showNotSupportTip()
    }
  },

  // 初始化 Agent-UI
  initAgentUI() {
    try {
      // 检查botId是否配置
      if (!this.data.botId || this.data.botId.trim() === '') {
        this.showConfigDialog()
        return
      }

      // 检查是否已经初始化过云开发
      if (!wx.cloud.__initialized) {
        console.log('初始化云开发...')
        wx.cloud.init({
          env: this.data.env,
          traceUser: true
        })
        wx.cloud.__initialized = true
      }

      // 获取 AI 实例
      const ai = wx.cloud.extend.AI
      if (!ai) {
        throw new Error('AI 能力不可用')
      }

      // 生成线程ID
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

      this.setData({
        ai,
        threadId,
        initialized: true
      })

      console.log('Agent-UI 初始化成功')
      console.log('线程ID:', threadId)
      console.log('Bot ID:', this.data.botId)

      // 添加欢迎消息
      this.addMessage('assistant', '你好！我是微信 Agent-UI 助手。请输入你的问题或创作需求。')

    } catch (error) {
      console.error('Agent-UI 初始化失败:', error)
      this.addMessage('system', `初始化失败: ${error.message}\n\n请确保：\n1. 基础库版本 >= 3.7.1\n2. 环境ID 和 BotID 配置正确\n3. 已在云开发控制台创建Agent`)
    }
  },

  // 显示配置对话框
  showConfigDialog() {
    wx.showModal({
      title: '配置Agent-UI',
      content: '云开发环境已预配置"智能开发"Agent，您可以直接使用！\n\n配置方式：\n1. 使用预配置Bot ID（推荐）\n2. 前往控制台获取Bot ID\n\n预配置Bot ID：\nagent-zhinenkaifa-6ejbei4d6ae288',
      confirmText: '使用预配置',
      cancelText: '前往控制台',
      success: (res) => {
        if (res.confirm) {
          // 使用预配置的Bot ID
          this.setData({
            botId: 'agent-zhinenkaifa-6ejbei4d6ae288'
          })
          this.initAgentUI()
          wx.showToast({
            title: '配置成功',
            icon: 'success'
          })
        } else if (res.cancel) {
          // 前往控制台
          wx.showModal({
            title: '打开云开发控制台',
            content: '请在浏览器中访问以下链接：\n\nhttps://console.cloud.tencent.com/tcb\n\n然后找到"智能开发"Agent，获取Bot ID',
            confirmText: '已复制链接',
            cancelText: '手动输入',
            success: (navigateRes) => {
              if (navigateRes.confirm) {
                // 提示用户如何继续
                wx.showToast({
                  title: '请在浏览器打开',
                  icon: 'none',
                  duration: 5000
                })
              } else {
                // 手动输入Bot ID
                wx.showModal({
                  title: '输入Bot ID',
                  editable: true,
                  placeholderText: '格式：agent-xxxx-xxxxxxxxxx',
                  success: (inputRes) => {
                    if (inputRes.confirm && inputRes.content && inputRes.content.trim()) {
                      const botId = inputRes.content.trim()
                      // 简单验证Bot ID格式
                      if (botId.startsWith('agent-')) {
                        this.setData({
                          botId: botId
                        })
                        this.initAgentUI()
                        wx.showToast({
                          title: '配置成功',
                          icon: 'success'
                        })
                      } else {
                        wx.showToast({
                          title: 'Bot ID格式不正确',
                          icon: 'none'
                        })
                      }
                    }
                  }
                })
              }
            }
          })
        }
      }
    })
  },

  // 显示不支持提示
  showNotSupportTip() {
    wx.showModal({
      title: '提示',
      content: '当前微信版本或基础库不支持 Agent-UI 功能，请确保：\n1. 微信已更新到最新版\n2. 开发者工具基础库 >= 3.7.1',
      showCancel: false
    })
  },

  // 输入框变化
  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  // 发送消息
  async sendMessage() {
    const { inputValue, ai, botId, threadId, sending } = this.data
    
    if (!inputValue.trim() || sending) {
      return
    }
    
    if (!ai) {
      wx.showToast({
        title: 'AI 未初始化',
        icon: 'none'
      })
      return
    }
    
    const userMessage = inputValue.trim()
    
    // 添加用户消息
    this.addMessage('user', userMessage)
    
    // 清空输入框
    this.setData({
      inputValue: '',
      isTyping: true,
      sending: true
    })
    
    try {
      console.log('发送消息:', userMessage)
      console.log('线程ID:', threadId)
      console.log('BotID:', botId)

      // 构建消息数据
      const messageData = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: userMessage
      }

      // 调用 Agent-UI API
      const res = await ai.bot.sendMessage({
        data: {
          botId: botId,
          threadId: threadId,
          runId: `run_${Date.now()}`,
          messages: [messageData],
          tools: [],
          context: [],
          state: {},
          forwardedProps: {}
        }
      })

      console.log('API 调用成功，开始接收流式响应...')

      // 处理流式响应
      await this.handleStreamResponse(res)

    } catch (error) {
      console.error('发送消息失败:', error)

      // 提供详细的错误信息和解决建议
      let errorMsg = `消息发送失败: ${error.message}`

      if (error.message.includes('botId') || error.message.includes('Bot ID')) {
        errorMsg += '\n\n可能原因：Bot ID 未配置或无效\n解决方法：点击页面右上角「配置」按钮输入正确的Bot ID'
      } else if (error.message.includes('env') || error.message.includes('environment')) {
        errorMsg += '\n\n可能原因：云开发环境ID不正确\n解决方法：请检查云开发环境配置'
      } else if (error.message.includes('permission') || error.message.includes('auth')) {
        errorMsg += '\n\n可能原因：权限不足\n解决方法：请在云开发控制台检查Agent权限设置'
      } else {
        errorMsg += '\n\n请检查：\n1. 云开发环境是否正常运行\n2. Agent是否已在控制台创建\n3. Bot ID是否正确\n4. 网络连接是否正常'
      }

      this.addMessage('assistant', errorMsg)

      // 添加配置按钮的提示
      this.setData({
        needConfig: true
      })
    } finally {
      this.setData({
        isTyping: false,
        sending: false
      })
    }
  },

  // 处理流式响应
  async handleStreamResponse(res) {
    try {
      let fullText = ''
      let hasContent = false
      
      for await (let event of res.eventStream) {
        const data = JSON.parse(event.data)
        console.log('收到事件:', data.type)
        
        switch (data.type) {
          case 'TEXT_MESSAGE_DELTA':
          case 'TEXT_MESSAGE_CONTENT':
            // 收到文本内容
            const delta = data.delta || ''
            fullText += delta
            hasContent = true
            
            // 更新最后一条助手消息（或创建新消息）
            this.updateOrAddAssistantMessage(fullText)
            break
            
          case 'RUN_ERROR':
            // 运行出错
            console.error('Agent 运行出错:', data.message)
            this.addMessage('assistant', `运行出错: ${data.message}`)
            break
            
          case 'RUN_FINISHED':
            // 运行结束
            console.log('Agent 运行结束')
            if (!hasContent) {
              this.addMessage('assistant', '(Agent 运行完成，但未返回内容)')
            }
            break
            
          case 'TOOL_CALL':
            // 工具调用
            console.log('工具调用:', data.tool)
            this.addMessage('system', `正在调用工具: ${data.tool.name}`)
            break
            
          default:
            // 其他事件类型
            console.log('其他事件:', data.type, data)
        }
      }
      
      console.log('流式响应处理完成')
      
    } catch (error) {
      console.error('处理流式响应失败:', error)
      this.addMessage('assistant', `响应处理失败: ${error.message}`)
    }
  },

  // 添加消息
  addMessage(role, content) {
    const messages = this.data.messages
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      role: role,
      content: content,
      timestamp: Date.now()
    }
    
    messages.push(newMessage)
    
    this.setData({
      messages: messages,
      toView: `msg-${messages.length - 1}`
    })
    
    return newMessage
  },

  // 更新或添加助手消息（用于流式响应）
  updateOrAddAssistantMessage(content) {
    const messages = this.data.messages
    const lastMessage = messages[messages.length - 1]
    
    // 如果最后一条消息是助手消息，更新它
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.content = content
      this.setData({ messages: messages })
    } else {
      // 否则添加新消息
      this.addMessage('assistant', content)
    }
  },

  // 页面卸载时清理
  onUnload() {
    console.log('Agent-UI 页面卸载')
  }
})
