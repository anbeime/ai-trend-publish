// cloudfunctions/chatDream/index.js
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 系统提示词 - 专业梦境解析师（兼具心理学深度与情绪价值）
const SYSTEM_PROMPT = `# 角色设定
你是一位极具亲和力的梦境解析师，善于运用生动的动态表情动作与用户互动，同时凭借深厚的心理学与象征学知识为用户精准解析梦境。
 
## 核心技能
 
### 技能1：专业解析梦境
1. 以极大的耐心倾听用户对梦境的描述，通过巧妙的提问引导用户补充更多梦境细节
2. 充分运用心理学和象征学知识，从多个角度深入分析解读梦境
3. 用温柔亲切的语气为用户阐释梦境可能的含义，并给出切实可行的实用建议
 
### 技能2：介绍心理学和象征学知识
1. 当用户询问相关知识时，使用简洁易懂的语言介绍心理学和象征学中与梦境解析相关的概念和理论
2. 结合具体的梦境例子进行讲解，让用户更好地理解
 
## 交互风格
- 语言温暖亲和，如知心朋友般交流
- 善用生动表情符号：😊 🥰 🤔 💭 🌙 🌈 ✨ 🌸
- 通过"提问→倾听→分析→建议"的完整流程
- 每句话简短有力，避免长篇大论
 
记住：你的目标是让用户既获得专业解析，又感受到温暖的情感陪伴。`;

exports.main = async (event, context) => {
  const { userMessage, conversationHistory = [] } = event;
  const { OPENID } = cloud.getWXContext();

  console.log("对话请求:", {
    userMessage,
    historyLength: conversationHistory.length,
    OPENID,
  });

  if (!userMessage || !userMessage.trim()) {
    return {
      success: false,
      error: "消息不能为空",
    };
  }

  try {
    console.log("调用混元AI进行梦境解析...");

    // 使用云开发AI SDK
    const ai = cloud.ai();

    // 构建对话上下文
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];

    // 添加历史对话（如果有）
    if (conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // 添加用户当前消息
    messages.push({
      role: "user",
      content: userMessage,
    });

    console.log("调用AI，消息数量:", messages.length);

    // 调用混元AI（使用免费版）
    const result = await ai.generateText({
      model: "hunyuan-lite",
      messages: messages,
      temperature: 0.7, // 保持一定创造性
      max_tokens: 5000, // 限制回复长度
    });

    console.log("AI 响应成功");

    const reply =
      result.data?.choices?.[0]?.message?.content || "抱歉，没有收到AI的回复";

    console.log("AI 回复长度:", reply.length);

    // 保存到数据库（用于日志统计）
    try {
      const db = cloud.database();
      await db.collection("dream_chat_logs").add({
        data: {
          _openid: OPENID,
          userMessage: userMessage.substring(0, 200),
          aiReply: reply.substring(0, 500),
          model: "hunyuan-lite",
          timestamp: new Date(),
        },
      });
    } catch (dbError) {
      console.log("数据库保存失败（非关键错误）:", dbError);
    }

    return {
      success: true,
      reply: reply,
    };
  } catch (error) {
    console.error("对话失败:", error);

    // 返回友好的错误提示
    return {
      success: false,
      error: error.message || "对话失败，请稍后重试",
    };
  }
};
