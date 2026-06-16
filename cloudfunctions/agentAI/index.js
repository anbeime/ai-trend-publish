// cloudfunctions/agentAI/index.js
const cloud = require('wx-server-sdk')
const request = require('request-promise')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 智谱AI API配置
const ZHIPU_API_CONFIG = {
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: '4db0d99270664530b2ec62e4862f0f8e.STEfVsL3x4M4m7Jn' // 智谱AI API密钥
}

exports.main = async (event, context) => {
  const { agentType, userMessage, conversationHistory, useZhipuAI = true } = event
  const { OPENID } = cloud.getWXContext()

  console.log('智能体AI请求:', { agentType, userMessage, useZhipuAI, OPENID })

  try {
    // 根据智能体类型构建不同的system prompt
    const systemPrompts = {
      trendHunter: `你是一个热点追踪专家，擅长分析当前平台的热门趋势。

你的任务：
1. 分析用户的短视频创作需求
2. 推荐2-3个热门选题方向
3. 为每个选题提供：
   - 热度值（0-100）
   - 趋势分析（上升/下降/稳定）
   - 为什么推荐这个选题

输出格式：
🔥 **热点追踪结果**

我为您分析了当前平台的热门趋势：

1. [选题名称]
   热度值: [数值]
   趋势: [趋势图标] [趋势描述]
   说明: [推荐理由]

2. [选题名称]
   热度值: [数值]
   趋势: [趋势图标] [趋势描述]
   说明: [推荐理由]

💡 **推荐选题**: 基于您的需求，建议选择"[最佳选题]"，这个话题热度高且与您的定位匹配。`,

      scriptWriter: `你是一个专业的短视频脚本创作者。

你的任务：
1. 根据用户的需求，创作结构完整的短视频脚本
2. 脚本时长控制在60秒左右
3. 包含详细的分镜规划

输出格式：
 **脚本创作完成**

**标题**: [吸引人的标题]

**脚本结构**:

🎯 **开场钩子** (0-3秒):
"[有冲击力的开场白]"

📖 **核心内容** (3-45秒):
1. [要点1]
2. [要点2]
3. [要点3]

💡 **结尾引导** (45-60秒):
"[行动号召，引导点赞关注]"

**分镜规划**:
- 开场: [拍摄方式，景别]
- 内容: [拍摄方式，景别]
- 结尾: [拍摄方式，景别]

预计时长: [X]秒
节奏: [快/中/慢]节奏，平均每个镜头X-X秒`,

      videoProducer: `你是一个视频制作专家，擅长短视频制作和数字人应用。

你的任务：
1. 根据脚本内容，提供视频制作方案
2. 包括数字人选择、素材匹配、配音方案
3. 考虑不同平台的特点

输出格式：
🎬 **视频制作方案**

**数字人选择**:
- 角色: [年龄/性别，风格特点]
- 音色: [声音特点，语速]
- 服装: [着装风格，专业形象]

**素材匹配**:
- 开场素材: [场景描述]
- 功能展示: [内容描述]
- 对比素材: [内容描述]
- 结尾素材: [内容描述]

**配音方案**:
- 主配音: [AI/真人，声音特点]
- BGM: [音乐风格，节奏]
- 音效: [关键节点音效]

**生成进度**:
 [已完成项]
 [已完成项]
⏳ [进行中项]

预计完成时间: [X]分钟`,

      editor: `你是一个视频剪辑专家，精通短视频剪辑和平台适配。

你的任务：
1. 分析视频内容，提供剪辑建议
2. 确保视频符合平台规格
3. 提供优化建议

输出格式：
✂️ **剪辑优化完成**

**智能剪辑**:
- 镜头切分: [X]个镜头
- 平均时长: [X]秒
- 转场效果: [X]处，[类型]
- 节奏调整: [整体节奏描述]

**字幕优化**:
- 字体: [字体名称]
- 颜色: [主色+描边色]
- 字号: [X]px
- 位置: [位置描述]
- 动效: [文字动效]

**质量检测**:
 分辨率: [数值]
 帧率: [X]fps
 码率: [X]kbps
 音频: [编码/码率]
 时长: [X]秒

**平台适配**:
- 抖音: [格式] ✓/✗
- 快手: [格式] ✓/✗
- B站: [调整建议]

⚠️ **优化建议**:
- [具体建议1]
- [具体建议2]`,

      dataAnalyst: `你是一个短视频数据分析师，擅长预测视频效果和优化建议。

你的任务：
1. 预测短视频的效果指标
2. 提供发布建议
3. 设计A/B测试方案

输出格式：
📊 **数据分析报告**

**预期效果预测**:

📈 **播放量**: 预计 [范围]
- [加成因素1]: +X%
- [加成因素2]: +X%
- [加成因素3]: +X%

👀 **完播率**: 预计 [范围]
- [优化点1]: 完播率提升X%
- [优化点2]: 完播率提升X%

👍 **互动率**: 预计 [范围]
- [引导方式1]: [指标]+X%
- [引导方式2]: [指标]+X%

**发布建议**:
- 最佳发布时间: [时间段]
- 标题: "[建议标题]"
- 封面: [封面描述]
- 标签: #[标签1] #[标签2] #[标签3]

**A/B测试方案**:
- 测试组A: [版本描述]
- 测试组B: [版本描述]
- 对比指标: [指标1]、[指标2]、[指标3]`
    }

    const systemPrompt = systemPrompts[agentType] || '你是一个AI助手，帮助用户创作短视频。请根据用户需求提供专业建议。'

    // 构建消息历史
    let messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // 添加对话历史（限制为最近10条，节省token）
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10)
      messages = messages.concat(recentHistory)
    }

    // 添加当前消息
    messages.push({
      role: 'user',
      content: userMessage
    })

    let reply = ''
    
    if (useZhipuAI) {
      // 使用智谱AI API（默认使用内置API Key，无需用户配置）
      console.log('调用智谱AI，消息数量:', messages.length)
      
      // 如果event中提供了用户自定义的API Key，则使用用户Key，否则使用默认Key
      const apiKey = event.apiKey || ZHIPU_API_CONFIG.apiKey
      const model = event.model || 'glm-4.6v-flash'
      
      try {
        const result = await request({
          uri: ZHIPU_API_CONFIG.endpoint,
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.9,
            stream: false,
            thinking: {
              type: 'enabled'
            }
          }),
          json: true
        })
        
        reply = result.choices?.[0]?.message?.content || '抱歉，生成内容失败，请稍后重试。'
        console.log('智谱AI回复成功，内容长度:', reply.length)
      } catch (zhipuError) {
        console.error('智谱AI调用失败:', zhipuError)
        reply = '抱歉，智谱AI调用失败，请稍后重试。'
      }
    } else {
      // 使用混元AI
      console.log('调用混元AI，消息数量:', messages.length)
      
      try {
        const ai = cloud.ai()
        const result = await ai.generateText({
          model: 'hunyuan-lite', // 使用轻量版，免费且响应快
          messages: messages,
          temperature: 0.7,
          max_tokens: 5000
        })
        
        reply = result.data?.choices?.[0]?.message?.content || '抱歉，生成内容失败，请稍后重试。'
        console.log('混元AI回复成功，内容长度:', reply.length)
      } catch (hunyuanError) {
        console.error('混元AI调用失败:', hunyuanError)
        reply = '抱歉，混元AI调用失败，请稍后重试。'
      }
    }

    console.log('AI回复成功，内容长度:', reply.length)

    // 保存到数据库（可选）
    try {
      const db = cloud.database()
      await db.collection('messages').add({
        data: {
          _openid: OPENID,
          type: 'agent',
          agentType,
          content: userMessage.substring(0, 200),
          reply: reply.substring(0, 500),
          timestamp: new Date()
        }
      })
    } catch (dbError) {
      console.log('数据库保存失败（非关键错误）:', dbError)
    }

    return {
      success: true,
      reply: reply,
      agentType: agentType
    }

  } catch (error) {
    console.error('AI调用失败:', error)
    return {
      success: false,
      error: error.message || 'AI调用失败，请检查网络连接'
    }
  }
}
