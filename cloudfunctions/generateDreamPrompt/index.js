const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 系统提示词 - 即梦视频生成提示词专家
const SYSTEM_PROMPT = `# 角色设定
你是一位专业的即梦视频生成提示词专家。请根据用户的输入和氛围描述，生成一个详细的即梦提示词。

## 提示词公式
提示词 = 主体（主体描述）+ 运动 + 场景（场景描述）+（镜头语言 + 光影 + 氛围）

## 详细要求
1. 主体：
   - 主要表现对象（人、动物、植物、物体等）
   - 主体描述（外貌细节、肢体姿态等）
   - 运动表现、发型发色、服饰穿搭、五官形态等

2. 运动：
   - 主体运动状态
   - 运动复杂度要适合5s视频展现
   - 保持动作的连贯性

3. 场景：
   - 主体所处的环境
   - 前景和背景描述
   - 场景细节要适合5s视频展现

4. 镜头语言（可选）：
   - 超大远景拍摄
   - 背景虚化
   - 特写
   - 长焦镜头拍摄
   - 地面拍摄
   - 顶部拍摄
   - 航拍
   - 景深等

## 氛围处理
- 如果提供了氛围描述（如：梦幻、恐怖、温馨等），请将其融入提示词的整体氛围中
- 如果没有提供氛围，则根据用户输入的内容推断合适的氛围

## 输出要求
- 结构清晰，符合公式要求
- 描述具体且适合短视频
- 保持逻辑性和连贯性
- 突出主体和动作
- 总字数不超过500字
- 使用中文输出
- 不需要额外解释，直接输出生成的提示词

## 示例
用户输入：一只狐狸在森林里奔跑
氛围：神秘
生成提示词：一只橘红色的狐狸（毛发蓬松，尾巴竖起，眼睛明亮）在森林中快速奔跑（四肢协调，动作轻盈，速度适中），环境是茂密的针叶林（前景有苔藓和落叶，背景是深绿的树木），使用地面拍摄视角（低角度，增强速度感），光影为晨间柔和光线（穿过树叶形成光斑），氛围是神秘而活泼。`

exports.main = async (event, context) => {
  const { userInput, mood = '' } = event
  const { OPENID } = cloud.getWXContext()

  console.log('提示词生成请求:', { userInput, mood, OPENID })

  if (!userInput || !userInput.trim()) {
    return {
      code: 400,
      message: '用户输入不能为空'
    }
  }

  try {
    // 构建用户消息，包含氛围信息
    let userMessage = userInput
    if (mood && mood.trim()) {
      userMessage = `梦境描述：${userInput}\n氛围：${mood}`
    }

    // 使用混元AI生成提示词
    const ai = cloud.ai()
    const result = await ai.generateText({
      model: 'hunyuan-lite',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    })

    console.log('AI调用成功')

    let generatedPrompt = ''
    if (result.data && result.data.choices && result.data.choices[0]) {
      generatedPrompt = result.data.choices[0].message.content
    }

    if (!generatedPrompt) {
      throw new Error('AI返回内容为空')
    }

    console.log('提示词生成成功，内容长度:', generatedPrompt.length)

    // 保存到数据库（用于日志统计）
    try {
      const db = cloud.database()
      await db.collection('dream_records').add({
        data: {
          _openid: OPENID,
          type: 'prompt',
          content: userInput.substring(0, 200),
          mood: mood || '',
          generatedPrompt: generatedPrompt.substring(0, 500),
          timestamp: new Date()
        }
      })
    } catch (dbError) {
      console.log('数据库保存失败（非关键错误）:', dbError)
    }

    return {
      code: 0,
      message: '生成成功',
      prompt: generatedPrompt
    }

  } catch (error) {
    console.error('提示词生成失败:', error)

    // 返回详细的错误信息
    return {
      code: 500,
      message: error.message || '提示词生成失败，请稍后重试',
      error: error.toString()
    }
  }
}