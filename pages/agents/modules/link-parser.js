// link-parser.js - 链接解析与内容改写模块
// 支持抖音/快手/B站视频链接、公众号/知乎文章链接的解析和改写

/**
 * LinkParser 类
 */
class LinkParser {
  constructor(pageContext) {
    this.page = pageContext;
  }

  /**
   * 解析分享链接
   * @param {string} url - 链接地址
   * @returns {Promise<object>} - 解析结果
   */
  async parseShareUrl(url) {
    console.log("开始解析链接:", url);

    try {
      // 1. 识别链接类型
      const linkType = this.identifyLinkType(url);
      console.log("链接类型:", linkType);

      // 2. 调用对应的云函数解析
      const parseResult = await this.callCloudParser(url, linkType);

      if (!parseResult.success) {
        throw new Error(parseResult.message || "链接解析失败");
      }

      console.log("链接解析成功:", parseResult.data);

      return {
        success: true,
        linkType,
        data: parseResult.data,
      };
    } catch (error) {
      console.error("链接解析失败:", error);

      // 尝试使用AI智能体提取内容
      try {
        return await this.fallbackToAIParser(url);
      } catch (aiError) {
        console.error("AI解析也失败:", aiError);
        return {
          success: false,
          error: error.message || "链接解析失败",
          suggestions: [
            "请检查链接是否正确",
            "尝试复制完整的链接地址",
            "某些平台链接可能需要授权访问",
          ],
        };
      }
    }
  }

  /**
   * 识别链接类型
   * @param {string} url - 链接地址
   * @returns {string} - 链接类型（douyin/kuaishou/bilibili/weixin/zhihu/xiaohongshu/other）
   */
  identifyLinkType(url) {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("douyin.com") || lowerUrl.includes("iesdouyin.com")) {
      return "douyin";
    } else if (
      lowerUrl.includes("kuaishou.com") ||
      lowerUrl.includes("chenzhongtech.com")
    ) {
      return "kuaishou";
    } else if (lowerUrl.includes("bilibili.com")) {
      return "bilibili";
    } else if (
      lowerUrl.includes("mp.weixin.qq.com") ||
      lowerUrl.includes("weixin.qq.com")
    ) {
      return "weixin";
    } else if (lowerUrl.includes("zhihu.com")) {
      return "zhihu";
    } else if (
      lowerUrl.includes("xiaohongshu.com") ||
      lowerUrl.includes("xhslink.com")
    ) {
      return "xiaohongshu";
    } else {
      return "other";
    }
  }

  /**
      return "douyin";
    } else if (
      lowerUrl.includes("kuaishou.com") ||
      lowerUrl.includes("chenzhongtech.com")
    ) {
      return "kuaishou";
    } else if (lowerUrl.includes("bilibili.com")) {
      return "bilibili";
    } else if (
      lowerUrl.includes("mp.weixin.qq.com") ||
      lowerUrl.includes("weixin.qq.com")
    ) {
      return "weixin";
    } else if (lowerUrl.includes("zhihu.com")) {
      return "zhihu";
    } else {
      return "other";
    }
  }

   /**
   * 调用云函数解析链接
   * @param {string} url - 链接地址
   * @param {string} linkType - 链接类型
   * @returns {Promise<object>} - 解析结果
   */
  async callCloudParser(url, linkType) {
    try {
      // 对于普通网页链接，使用 url-to-markdown 云函数
      if (linkType === "other" || linkType === "webpage") {
        console.log("[callCloudParser]使用url-to-markdown解析网页");
        const res = await wx.cloud.callFunction({
          name: "url-to-markdown",
          data: {
            url: url,
            options: {
              includeFrontmatter: true
            }
          }
        });

        if (res.result && res.result.success) {
          return {
            success: true,
            data: {
              title: res.result.metadata.title || "未知标题",
              content: res.result.markdown,
              markdown: res.result.markdown,
              length: res.result.length,
              description: res.result.metadata.description || "",
              keywords: res.result.metadata.keywords || [],
              source: "url-to-markdown"
            }
          };
        } else {
          throw new Error(res.result?.message || "url-to-markdown解析失败");
        }
      }

      // 其他平台链接使用 link-parser 云函数
      const res = await wx.cloud.callFunction({
        name: "link-parser",
        data: {
          action: "parse",
          url,
          linkType,
        },
      });

      if (res.result && res.result.success) {
        return res.result;
      } else {
        throw new Error(res.result?.message || "云函数解析失败");
      }
    } catch (error) {
      console.error("云函数解析失败:", error);
      throw error;
    }
  }

  /**
   * 降级：使用AI智能体提取内容
   * @param {string} url - 链接地址
   * @returns {Promise<object>} - AI解析结果
   */
  async fallbackToAIParser(url) {
    console.log("使用AI智能体提取链接内容");

    try {
      const res = await wx.cloud.callFunction({
        name: "agentAI",
        data: {
          agentType: "contentExtractor",
          userMessage: `请从以下链接中提取核心内容：\n${url}\n\n提取要求：\n1. 提取标题\n2. 提取核心观点/主要内容（200字以内）\n3. 提取关键信息点（3-5个）\n4. 输出JSON格式`,
          conversationHistory: [],
        },
      });

      if (res.result && res.result.success) {
        // 解析AI返回的JSON
        try {
          const content = res.result.reply;
          const jsonMatch = content.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              success: true,
              linkType: "other",
              data: {
                title: parsed.title || "未知标题",
                content: parsed.content || "",
                keywords: parsed.keywords || [],
                source: "AI提取",
              },
            };
          }
        } catch (parseError) {
          throw new Error("AI提取内容解析失败");
        }
      }

      throw new Error("AI提取失败");
    } catch (error) {
      console.error("AI降级解析失败:", error);
      throw error;
    }
  }

  /**
   * 验证链接格式
   * @param {string} url - 链接地址
   * @returns {object} - 验证结果
   */
  validateLink(url) {
    const result = {
      valid: true,
      type: "other",
      message: "",
    };

    // 基本URL格式验证
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return {
        valid: false,
        type: "invalid",
        message: "链接格式不正确，请以http://或https://开头",
      };
    }

    // 识别链接类型
    result.type = this.identifyLinkType(url);

    // 平台特定验证
    if (result.type === "douyin") {
      if (!url.includes("/video/") && !url.includes("/share/")) {
        result.message = "抖音链接可能不正确，建议复制分享链接";
      }
    } else if (result.type === "bilibili") {
      if (!url.includes("/video/")) {
        result.message = "B站链接可能不正确，请使用视频链接";
      }
    }

    return result;
  }
}

/**
 * ContentRewriter 类 - 内容改写智能体
 */
class ContentRewriter {
  constructor(pageContext) {
    this.page = pageContext;
    this.promptTemplateManager = require("./prompt-templates");
  }

  /**
   * 改写内容
   * @param {object} originalContent - 原始内容
   * @param {object} rewriteParams - 改写参数
   * @returns {Promise<object>} - 改写结果
   */
  async rewriteContent(originalContent, rewriteParams = {}) {
    console.log("开始改写内容:", originalContent.title);

    try {
      // 构建改写提示词
      const prompt = this.buildRewritePrompt(originalContent, rewriteParams);

      // 调用AI智能体改写
      const res = await wx.cloud.callFunction({
        name: "agentAI",
        data: {
          agentType: "contentRewriter",
          userMessage: prompt,
          conversationHistory: [],
        },
      });

      if (res.result && res.result.success) {
        // 解析改写结果
        const rewrittenContent = this.parseRewriteResult(res.result.reply);

        console.log("内容改写成功");

        return {
          success: true,
          originalContent,
          rewrittenContent,
        };
      }

      throw new Error("内容改写失败");
    } catch (error) {
      console.error("内容改写失败:", error);
      return {
        success: false,
        error: error.message || "内容改写失败",
      };
    }
  }

  /**
   * 构建改写提示词
   * @param {object} originalContent - 原始内容
   * @param {object} params - 改写参数
   * @returns {string} - 提示词
   */
  buildRewritePrompt(originalContent, params) {
    const {
      targetAudience = "Z世代",
      style = "口语化",
      platform = "抖音",
      preserveKeyPoints = true,
      addHumor = false,
      emotionalTone = "轻松愉快",
    } = params;

    let prompt = `你是一个内容改写专家，擅长将各种内容转化为短视频脚本。

【原始内容】
标题：${originalContent.title}
内容：${originalContent.content}
关键词：${originalContent.keywords || []}

【改写要求】
- 目标受众：${targetAudience}
- 改写风格：${style}
- 目标平台：${platform}
- 情感基调：${emotionalTone}
`;

    if (preserveKeyPoints) {
      prompt += `- 保留核心信息点：是\n`;
    } else {
      prompt += `- 保留核心信息点：否（可以创新）\n`;
    }

    if (addHumor) {
      prompt += `- 增加幽默元素：是\n`;
    }

    prompt += `
【改写要求】
1. 重新组织语言，更口语化、接地气
2. 调整结构，符合短视频节奏（开场-发展-高潮-结尾）
3. 控制字数：标题15字以内，正文200字以内
4. 如果是视频链接，提取画面描述元素
5. ${preserveKeyPoints ? "保留原始内容的核心观点和信息点" : "可以创新改写，但不要偏离主题"}
6. 输出JSON格式，包含：title, content, keyPoints（3-5个）, suggestedTags（3-5个）

请改写以上内容。`;

    return prompt;
  }

  /**
   * 解析改写结果
   * @param {string} aiReply - AI返回的文本
   * @returns {object} - 改写后的内容
   */
  parseRewriteResult(aiReply) {
    try {
      // 尝试提取JSON
      const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || "",
          content: parsed.content || "",
          keyPoints: parsed.keyPoints || [],
          suggestedTags: parsed.suggestedTags || [],
        };
      }

      // 如果没有JSON，返回原始文本
      return {
        title: "",
        content: aiReply,
        keyPoints: [],
        suggestedTags: [],
      };
    } catch (error) {
      console.error("解析改写结果失败:", error);
      return {
        title: "",
        content: aiReply,
        keyPoints: [],
        suggestedTags: [],
      };
    }
  }

  /**
   * 快速改写（简化版）
   * @param {string} text - 原始文本
   * @param {string} style - 改写风格
   * @returns {Promise<object>} - 改写结果
   */
  async quickRewrite(text, style = "口语化") {
    try {
      const prompt = `请将以下内容改写为${style}风格的短视频文案（50字以内）：\n${text}`;

      const res = await wx.cloud.callFunction({
        name: "agentAI",
        data: {
          agentType: "textRewriter",
          userMessage: prompt,
          conversationHistory: [],
        },
      });

      if (res.result && res.result.success) {
        return {
          success: true,
          original: text,
          rewritten: res.result.reply,
        };
      }

      throw new Error("快速改写失败");
    } catch (error) {
      console.error("快速改写失败:", error);
      return {
        success: false,
        error: error.message || "快速改写失败",
      };
    }
  }

  /**
   * 批量改写
   * @param {array} contents - 内容数组
   * @param {object} params - 改写参数
   * @returns {Promise<object>} - 批量改写结果
   */
  async batchRewrite(contents, params = {}) {
    console.log(`开始批量改写 ${contents.length} 条内容`);

    const results = [];

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      console.log(`改写第 ${i + 1}/${contents.length} 条`);

      const result = await this.rewriteContent(content, params);
      results.push(result);

      // 添加延迟，避免请求过快
      if (i < contents.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("批量改写完成");

    return {
      success: true,
      total: contents.length,
      successCount: results.filter((r) => r.success).length,
      results,
    };
  }
}

/**
 * LinkParserManager 类 - 统一管理链接解析和内容改写
 */
class LinkParserManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.linkParser = new LinkParser(pageContext);
    this.contentRewriter = new ContentRewriter(pageContext);
  }

  /**
   * 一键解析+改写
   * @param {string} url - 链接地址
   * @param {object} rewriteParams - 改写参数
   * @returns {Promise<object>} - 完整结果
   */
  async parseAndRewrite(url, rewriteParams = {}) {
    console.log("一键解析+改写:", url);

    try {
      // 1. 解析链接
      const parseResult = await this.linkParser.parseShareUrl(url);

      if (!parseResult.success) {
        throw new Error(parseResult.error || "链接解析失败");
      }

      // 2. 改写内容
      const rewriteResult = await this.contentRewriter.rewriteContent(
        parseResult.data,
        rewriteParams,
      );

      return {
        success: true,
        parseResult,
        rewriteResult,
      };
    } catch (error) {
      console.error("一键解析+改写失败:", error);
      return {
        success: false,
        error: error.message || "操作失败",
      };
    }
  }

  /**
   * 仅解析链接
   * @param {string} url - 链接地址
   * @returns {Promise<object>} - 解析结果
   */
  async parseOnly(url) {
    return await this.linkParser.parseShareUrl(url);
  }

  /**
   * 仅改写内容
   * @param {object} content - 原始内容
   * @param {object} params - 改写参数
   * @returns {Promise<object>} - 改写结果
   */
  async rewriteOnly(content, params = {}) {
    return await this.contentRewriter.rewriteContent(content, params);
  }
}

module.exports = {
  LinkParser,
  ContentRewriter,
  LinkParserManager,
};
