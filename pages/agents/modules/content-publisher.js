// modules/content-publisher.js
// 内容发布模块 - 微信公众号/小红书/B站内容生成与发布（增强版）

const ContentPublisher = {
  /**
   * 切换到内容发布模式
   */
  switchToPublishMode(pageContext) {
    pageContext.setData({
      creationMode: "content", // 'video' or 'content'
      contentStep: 0, // 当前步骤（0=热点, 1=微信, 2=小红书, 3=发布）
      contentStepData: {
        0: { selectedHotspot: null, suggestions: [] },
        1: {
          wechatTitle: "",
          wechatHTML: "",
          wechatDigest: "",
          coverImage: "",
          contentImages: [],
          tags: [],
        },
        2: {
          xiaohongshuTitle: "",
          xiaohongshuContent: "",
          xiaohongshuImages: [],
        },
        3: { publishResults: {} },
      },
    });

    console.log("[内容发布]已切换到内容发布模式");
    pageContext.UIHelper &&
      pageContext.UIHelper.addMessage({
        sender: "system",
        content:
          "[内容发布]已启用内容发布模式\n\n当前功能:\n- 微信公众号爆款文生成\n- 小红书图文生成(5+张图)\n- 一键复制到剪贴板",
      });
  },

  /**
   * 切换回视频创作模式
   */
  switchToVideoMode(pageContext) {
    pageContext.setData({
      creationMode: "video",
      contentStep: 0,
    });

    console.log("[内容发布]已切换回视频创作模式");
    pageContext.UIHelper &&
      pageContext.UIHelper.addMessage({
        sender: "system",
        content: "[内容发布]已切换回视频创作模式",
      });
  },

  /**
   * 执行当前内容发布步骤
   */
  async executeCurrentContentStep(pageContext, userInput) {
    const step = pageContext.data.contentStep;

    switch (step) {
      case 0:
        await this.executeHotspotStep(pageContext, userInput);
        break;
      case 1:
        await this.executeWechatArticleStep(pageContext, userInput);
        break;
      case 2:
        await this.executeXiaohongshuStep(pageContext, userInput);
        break;
      case 3:
        await this.executePublishStep(pageContext, userInput);
        break;
    }
  },

  /**
   * 步骤0：热点分析（复用现有热点采集）
   */
  async executeHotspotStep(pageContext, userInput) {
    console.log("[内容发布]步骤0：热点分析");

    // 如果用户已选择热点，直接使用
    if (pageContext.data.selectedHotspot) {
      pageContext.setData({
        "contentStepData[0].selectedHotspot": pageContext.data.selectedHotspot,
      });

      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content:
            "[内容发布]已选择热点：" + pageContext.data.selectedHotspot.name,
        });

      return;
    }

    // 调用热点智能体分析
    try {
      const response = await pageContext.callAIAPI(
        "trendHunter",
        userInput,
        [],
        null,
        { maxTokens: 300 },
      );

      pageContext.setData({
        "contentStepData[0].aiAnalysis": response.reply,
      });

      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content: "[内容发布]热点分析完成\n\n" + response.reply,
        });
    } catch (error) {
      console.error("[内容发布]热点分析失败:", error);
      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content: "[内容发布]热点分析失败：" + error.message,
        });
    }
  },

  /**
   * 步骤1：微信公众号爆款文生成（增强版）
   */
  async executeWechatArticleStep(pageContext, userInput) {
    console.log("[内容发布]步骤1：微信公众号文生成");

    const hotspot =
      pageContext.data.selectedHotspot ||
      pageContext.data.contentStepData[0].selectedHotspot;
    const hotAnalysis = pageContext.data.contentStepData[0].aiAnalysis;

    // 构建上下文
    const context = [];
    if (hotspot) {
      context.push({
        role: "assistant",
        content:
          "热点信息：" +
          hotspot.name +
          "，来源：" +
          hotspot.source +
          "，热度：" +
          hotspot.heat,
      });
    }
    if (hotAnalysis) {
      context.push({
        role: "assistant",
        content: "热点分析：" + hotAnalysis,
      });
    }

    // 生成公众号文章（使用爆款模板）
    try {
      const prompt = this.buildWechatArticlePrompt(userInput, hotspot);

      const response = await pageContext.callAIAPI(
        "scriptWriter",
        prompt,
        context,
        null,
        { maxTokens: 5000 },
      );

      // 解析响应
      const articleData = this.parseWechatArticle(response.reply);

      pageContext.setData({
        "contentStepData[1].wechatTitle": articleData.title,
        "contentStepData[1].wechatHTML": articleData.html,
        "contentStepData[1].wechatDigest": articleData.digest,
        "contentStepData[1].coverImage": articleData.coverImage,
        "contentStepData[1].contentImages": articleData.contentImages,
        "contentStepData[1].tags": articleData.tags,
      });

      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content:
            "[内容发布]微信公众号文生成完成\n\n" +
            "标题：" +
            articleData.title +
            "\n" +
            "摘要：" +
            articleData.digest +
            "\n" +
            "封面图：" +
            articleData.coverImage +
            "\n" +
            "配图数量：" +
            articleData.contentImages.length +
            "张\n" +
            "标签：" +
            articleData.tags.join(", ") +
            "\n\n" +
            "预览HTML内容（前500字符）：\n" +
            articleData.html.substring(0, 500) +
            "...",
        });

      // 如果知识库可用，保存成功案例
      if (pageContext.KnowledgeManager) {
        await pageContext.KnowledgeManager.saveSuccessCaseToKnowledge(
          "contentPublisher",
          userInput,
          articleData,
          5,
        );
      }
    } catch (error) {
      console.error("[内容发布]微信公众号文生成失败:", error);
      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content: "[内容发布]微信公众号文生成失败：" + error.message,
        });
    }
  },

  /**
   * 构建微信文章生成提示词（使用爆款模板）
   */
  buildWechatArticlePrompt(userInput, hotspot) {
    return `根据热点生成微信公众号爆款文章，要求：

【标题要求】
- 使用爆款标题模板（数字型、疑问型、感叹型、对比型）
- 吸引眼球，引发好奇
- 15-30字为宜

【内容要求】
1. 字数：1200-2000字，深度专业
2. 结构分层：
   - 一级标题（h2）：核心观点
   - 二级标题（h3）：分论点
   - 三级标题（h4）：细节展开
3. 局部划线：仅对关键短语/核心信息划线，不超过全文20%
4. 颜色规范：浅黄(#fff3cd)、浅绿(#d4edda)、浅红(#f8d7da)、浅蓝(#e8f4f8)

【封面图】
- 比例：2.35:1（1080x459像素）
- 高质量配图
- 提供图片搜索关键词

【内文配图】
- 3-5张高质量图片
- 插入到合适位置
- 每张图片包含简短描述

【热点标签】
- 3-5个热点标签
- 格式：#标签1 #标签2 #标签3
- 放在文末

【HTML排版】
- 可预览可复制
- 不包含作者信息、制作信息
- 纯净输出

【爆款风格】（选择一种）
1. 高价值干货类：数字开头，清单结构，实用性强
2. 犀利观点类：反常识，观点鲜明，引发讨论
3. 热点评论类：快速反应，独特角度
4. 故事洞察类：具体场景，情节转折，金句总结
5. 技术解析类：原理拆解，深入浅出，类比解释

用户需求：${userInput}

请生成完整的文章内容，包括：
1. 标题
2. 摘要（50-100字）
3. 封面图搜索关键词
4. 完整HTML内容（包含内文配图）
5. 热点标签

输出格式：
\`\`\`json
{
  "title": "文章标题",
  "digest": "文章摘要",
  "coverImageKeyword": "封面图搜索关键词",
  "html": "<html完整内容>",
  "contentImageKeywords": ["图1关键词", "图2关键词", "图3关键词"],
  "tags": ["标签1", "标签2", "标签3"]
}
\`\`\``;
  },

  /**
   * 步骤2：小红书图文生成（5+张图）
   */
  async executeXiaohongshuStep(pageContext, userInput) {
    console.log("[内容发布]步骤2：小红书图文生成");

    const wechatArticle = pageContext.data.contentStepData[1].wechatHTML;
    const hotspot =
      pageContext.data.selectedHotspot ||
      pageContext.data.contentStepData[0].selectedHotspot;

    // 构建上下文
    const context = [];
    if (wechatArticle) {
      context.push({
        role: "assistant",
        content: "参考微信文章：" + wechatArticle.substring(0, 500),
      });
    }
    if (hotspot) {
      context.push({
        role: "assistant",
        content: "热点信息：" + hotspot.name,
      });
    }

    // 生成小红书图文笔记
    try {
      const response = await pageContext.callAIAPI(
        "scriptWriter",
        "根据热点生成小红书图文笔记，要求：\n" +
          "1. 标题：爆款风格，数字型或感叹型\n" +
          "2. 内容：800-1200字，活泼有吸引力，带emoji\n" +
          "3. 配图：5-7张高质量图片，插入到合适位置\n" +
          "4. 分段清晰，每段2-3行\n" +
          "5. 结尾有行动号召或互动引导\n\n" +
          userInput,
        context,
        null,
        { maxTokens: 1500 },
      );

      const xiaohongshuData = this.parseXiaohongshuContent(response.reply);

      pageContext.setData({
        "contentStepData[2].xiaohongshuTitle": xiaohongshuData.title,
        "contentStepData[2].xiaohongshuContent": xiaohongshuData.content,
        "contentStepData[2].xiaohongshuImages": xiaohongshuData.images,
      });

      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content:
            "[内容发布]小红书图文生成完成\n\n" +
            "标题：" +
            xiaohongshuData.title +
            "\n" +
            "配图数量：" +
            xiaohongshuData.images.length +
            "张",
        });
    } catch (error) {
      console.error("[内容发布]小红书图文生成失败:", error);
      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content: "[内容发布]小红书图文生成失败：" + error.message,
        });
    }
  },

  /**
   * 步骤3：多平台发布（复制到剪贴板，手动发布）
   */
  async executePublishStep(pageContext, userInput) {
    console.log("[内容发布]步骤3：准备复制内容");

    const wechatData = pageContext.data.contentStepData[1];
    const xiaohongshuData = pageContext.data.contentStepData[2];

    const publishResults = {};

    // 准备微信公众号内容（复制到剪贴板）
    if (wechatData.wechatHTML) {
      try {
        const wechatResult = await this.copyToWechat(pageContext, wechatData);
        publishResults.wechat = wechatResult;
        console.log("[内容发布]微信内容已复制");
      } catch (error) {
        console.error("[内容发布]微信内容复制失败:", error);
        publishResults.wechat = {
          success: false,
          message: "复制失败：" + error.message,
        };
      }
    }

    // 准备小红书内容（复制到剪贴板）
    if (xiaohongshuData.xiaohongshuContent) {
      try {
        const xiaohongshuResult = await this.copyToXiaohongshu(
          pageContext,
          xiaohongshuData,
        );
        publishResults.xiaohongshu = xiaohongshuResult;
        console.log("[内容发布]小红书内容已复制");
      } catch (error) {
        console.error("[内容发布]小红书内容复制失败:", error);
        publishResults.xiaohongshu = {
          success: false,
          message: "复制失败：" + error.message,
        };
      }
    }

    pageContext.setData({
      "contentStepData[3].publishResults": publishResults,
    });

    // 显示发布结果
    let resultMsg = "📋 内容已准备完成！\n\n";
    for (const [platform, result] of Object.entries(publishResults)) {
      const status = result.success ? "✅ [已复制]" : "❌ [失败]";
      const platformName =
        platform === "wechat"
          ? "微信公众号"
          : platform === "xiaohongshu"
            ? "小红书"
            : platform;
      resultMsg +=
        platformName + "：" + status + "\n" + result.message + "\n\n";
    }

    resultMsg += "💡 提示：已为您复制内容，请到相应平台粘贴发布！";

    pageContext.UIHelper &&
      pageContext.UIHelper.addMessage({
        sender: "system",
        content: resultMsg,
      });
  },

  /**
   * 复制微信内容到剪贴板
   */
  async copyToWechat(pageContext, wechatData) {
    try {
      console.log("[copyToWechat]准备复制微信内容");

      // 格式化复制内容
      const copyContent = `【文章标题】
${wechatData.wechatTitle}

【文章摘要】
${wechatData.wechatDigest || wechatData.wechatTitle.substring(0, 100)}

【完整HTML内容】
${wechatData.wechatHTML}

---

💡 使用提示：
1. 打开微信公众号后台 https://mp.weixin.qq.com
2. 点击「新建图文」
3. 复制标题和摘要
4. 粘贴HTML内容到正文
5. 上传封面图
6. 保存为草稿或直接发布`;

      // 复制到剪贴板
      wx.setClipboardData({
        data: copyContent,
        success: () => {
          console.log("[copyToWechat]复制成功");
          wx.showToast({
            title: "已复制到剪贴板",
            icon: "success",
          });

          // 显示使用提示
          pageContext.UIHelper &&
            pageContext.UIHelper.addMessage({
              sender: "system",
              content:
                "📋 微信公众号内容已复制\n\n" +
                "【使用步骤】\n" +
                "1️⃣ 打开公众号后台 https://mp.weixin.qq.com\n" +
                "2️⃣ 点击「新建图文」\n" +
                "3️⃣ 复制标题和摘要\n" +
                "4️⃣ 粘贴HTML内容到正文\n" +
                "5️⃣ 上传封面图\n" +
                "6️⃣ 保存或发布",
            });
        },
        fail: (error) => {
          console.error("[copyToWechat]复制失败:", error);
          throw new Error("复制失败，请重试");
        },
      });

      return {
        success: true,
        message: "内容已复制，请手动发布到微信公众号",
      };
    } catch (error) {
      console.error("[copyToWechat]操作失败:", error);
      throw error;
    }
  },

  /**
   * 格式化优化
   */
  async optimizeFormat(pageContext, content, options = {}) {
    try {
      console.log("[optimizeFormat]开始格式化优化");

      const result = await wx.cloud.callFunction({
        name: "content-optimizer",
        data: {
          action: "format",
          content: content,
          options: {
            title: options.title,
            slug: options.slug,
            addFrontmatter: options.addFrontmatter !== false,
          },
        },
      });

      console.log("[optimizeFormat]云函数调用结果:", result);

      if (result.result && result.result.success) {
        pageContext.UIHelper &&
          pageContext.UIHelper.addMessage({
            sender: "system",
            content:
              "📝 格式化优化完成\n\n" +
              "标题: " +
              result.result.metadata.title +
              "\n" +
              "Slug: " +
              result.result.metadata.slug +
              "\n" +
              "格式化内容（前200字符）：\n" +
              result.result.content.substring(0, 200) +
              "...",
          });

        return {
          success: true,
          formattedContent: result.result.content,
          metadata: result.result.metadata,
        };
      } else {
        throw new Error(result.result?.error || "格式化失败");
      }
    } catch (error) {
      console.error("[optimizeFormat]格式化失败:", error);
      throw error;
    }
  },

  /**
   * SEO优化
   */
  async optimizeSEO(pageContext, content, options = {}) {
    try {
      console.log("[optimizeSEO]开始SEO优化");

      const result = await wx.cloud.callFunction({
        name: "content-optimizer",
        data: {
          action: "seo",
          content: content,
          options: options,
        },
      });

      console.log("[optimizeSEO]云函数调用结果:", result);

      if (result.result && result.result.success) {
        const seo = result.result.seo;
        pageContext.UIHelper &&
          pageContext.UIHelper.addMessage({
            sender: "system",
            content:
              "🔍 SEO优化完成\n\n" +
              "关键词 (" +
              seo.keywords.length +
              "个): " +
              seo.keywords.map((k) => k.word).join(", ") +
              "\n" +
              "优化后标题: " +
              seo.optimizedTitle +
              "\n" +
              "描述: " +
              seo.description +
              "\n" +
              "关键词密度分析:\n" +
              seo.keywordDensity
                .map((k) => `${k.word}: ${k.density}`)
                .join("\n"),
          });

        return {
          success: true,
          keywords: seo.keywords,
          optimizedTitle: seo.optimizedTitle,
          description: seo.description,
          internalLinks: seo.internalLinks,
          keywordDensity: seo.keywordDensity,
        };
      } else {
        throw new Error(result.result?.error || "SEO优化失败");
      }
    } catch (error) {
      console.error("[optimizeSEO]SEO优化失败:", error);
      throw error;
    }
  },

  /**
   * 智能配图规划
   */
  async planIllustrations(pageContext, content, options = {}) {
    try {
      console.log("[planIllustrations]开始智能配图规划");

      const result = await wx.cloud.callFunction({
        name: "content-optimizer",
        data: {
          action: "illustration",
          content: content,
          options: options,
        },
      });

      console.log("[planIllustrations]云函数调用结果:", result);

      if (result.result && result.result.success) {
        const plans = result.result.plans;
        pageContext.UIHelper &&
          pageContext.UIHelper.addMessage({
            sender: "system",
            content:
              "🖼️ 智能配图规划完成\n\n" +
              "共识别到 " +
              plans.length +
              " 个配图位置\n\n" +
              "配图计划:\n" +
              plans
                .map(
                  (p, i) =>
                    `${i + 1}. ${p.position}\n` +
                    `   目的: ${p.purpose}\n` +
                    `   视觉内容: ${p.visualContent}\n` +
                    `   风格: ${p.style}`,
                )
                .join("\n"),
          });

        return {
          success: true,
          count: plans.length,
          plans: plans,
        };
      } else {
        throw new Error(result.result?.error || "配图规划失败");
      }
    } catch (error) {
      console.error("[planIllustrations]配图规划失败:", error);
      throw error;
    }
  },

  /**
   * 统一内容优化入口
   */
  async executeContentOptimization(pageContext, content, options = {}) {
    console.log("[executeContentOptimization]开始内容优化");

    const results = {};

    try {
      // 1. 格式化优化
      if (options.format !== false) {
        const formatResult = await this.optimizeFormat(
          pageContext,
          content,
          options.formatOptions,
        );
        results.format = formatResult;
      }

      // 2. SEO优化
      if (options.seo !== false) {
        const seoResult = await this.optimizeSEO(
          pageContext,
          content,
          options.seoOptions,
        );
        results.seo = seoResult;
      }

      // 3. 智能配图
      if (options.illustration !== false) {
        const illustrationResult = await this.planIllustrations(
          pageContext,
          content,
          options.illustrationOptions,
        );
        results.illustration = illustrationResult;
      }

      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content:
            "✅ 内容优化全部完成！\n\n" +
            (results.format ? "📝 格式化: 成功\n" : "") +
            (results.seo ? "🔍 SEO优化: 成功\n" : "") +
            (results.illustration ? "🖼️ 智能配图: 成功\n" : ""),
        });

      return {
        success: true,
        results: results,
      };
    } catch (error) {
      console.error("[executeContentOptimization]内容优化失败:", error);
      pageContext.UIHelper &&
        pageContext.UIHelper.addMessage({
          sender: "system",
          content: "❌ 内容优化失败: " + error.message,
        });

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 复制微信内容到剪贴板
   */
  async copyToXiaohongshu(pageContext, xiaohongshuData) {
    try {
      console.log("[copyToXiaohongshu]准备复制小红书内容");

      // 格式化复制内容
      const copyContent = `【标题】
${xiaohongshuData.xiaohongshuTitle}

【正文】
${xiaohongshuData.xiaohongshuContent}

【标签】
#AI创作 #热门话题 #内容分享

---

💡 使用提示：
1. 打开小红书App
2. 点击发布笔记
3. 粘贴以上内容
4. 上传5-7张配图
5. 选择话题并发布`;

      // 复制到剪贴板
      wx.setClipboardData({
        data: copyContent,
        success: () => {
          console.log("[copyToXiaohongshu]复制成功");
          wx.showToast({
            title: "已复制到剪贴板",
            icon: "success",
          });

          // 显示使用提示
          pageContext.UIHelper &&
            pageContext.UIHelper.addMessage({
              sender: "system",
              content:
                "📋 小红书内容已复制\n\n" +
                "【使用步骤】\n" +
                "1️⃣ 打开小红书App\n" +
                "2️⃣ 点击发布笔记\n" +
                "3️⃣ 粘贴内容\n" +
                "4️⃣ 上传5-7张配图\n" +
                "5️⃣ 添加话题标签并发布",
            });
        },
        fail: (error) => {
          console.error("[copyToXiaohongshu]复制失败:", error);
          throw new Error("复制失败，请重试");
        },
      });

      return {
        success: true,
        message: "内容已复制，请手动发布到小红书",
      };
    } catch (error) {
      console.error("[copyToXiaohongshu]操作失败:", error);
      throw error;
    }
  },

  /**
   * 内容下一步
   */
  nextContentStep(pageContext) {
    const current = pageContext.data.contentStep;
    const maxStep = 3;

    if (current < maxStep) {
      const nextStep = current + 1;
      pageContext.setData({ contentStep: nextStep });
      this.executeCurrentContentStep(pageContext, "");
    } else {
      wx.showToast({
        title: "[内容发布]发布完成",
        icon: "success",
      });
    }
  },

  /**
   * 重新执行当前步骤
   */
  retryCurrentContentStep(pageContext) {
    this.executeCurrentContentStep(pageContext, "");
  },

  /**
   * 跳过当前步骤
   */
  skipCurrentContentStep(pageContext) {
    const current = pageContext.data.contentStep;
    const maxStep = 3;

    if (current < maxStep) {
      this.nextContentStep(pageContext);
    }
  },

  /**
   * 解析微信公众号文章响应
   */
  parseWechatArticle(response) {
    try {
      // 尝试从JSON代码块中提取
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        return {
          title: data.title || "AI生成文章",
          digest: data.digest || data.title?.substring(0, 50) || "",
          html: data.html || response,
          coverImage: data.coverImageKeyword || "AI technology",
          contentImages: data.contentImageKeywords || [],
          tags: data.tags || ["AI", "科技", "创新"],
        };
      }

      // 如果没有JSON，使用默认解析
      return {
        title: "AI时代的内容创作指南",
        digest: "探索AI如何改变内容创作的方式",
        html: response,
        coverImage: "AI content creation",
        contentImages: ["AI tools", "content strategy", "digital marketing"],
        tags: ["AI", "内容创作", "效率提升"],
      };
    } catch (error) {
      console.error("[parseWechatArticle]解析失败:", error);
      return {
        title: "AI生成文章",
        digest: "AI智能生成的内容",
        html: response,
        coverImage: "AI technology",
        contentImages: [],
        tags: ["AI"],
      };
    }
  },

  /**
   * 解析小红书内容响应
   */
  parseXiaohongshuContent(response) {
    try {
      // 尝试从JSON代码块中提取
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        return {
          title: data.title || "5个让你效率翻倍的AI工具",
          content: data.content || response,
          images: data.images || [],
        };
      }

      // 默认解析
      return {
        title: "5个让你效率翻倍的AI工具",
        content: response,
        images: [
          "AI tools overview",
          "productivity tips",
          "workflow automation",
          "content creation",
          "time management",
        ],
      };
    } catch (error) {
      console.error("[parseXiaohongshuContent]解析失败:", error);
      return {
        title: "AI工具分享",
        content: response,
        images: [],
      };
    }
  },
};

module.exports = ContentPublisher;
