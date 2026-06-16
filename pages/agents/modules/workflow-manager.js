// modules/workflow-manager.js
// 多智能体工作流管理模块（增强版，支持新功能）

const WorkflowManager = {
  /**
   * 启动创作流程（sendMessage的逻辑）
   * @param {object} pageContext - 页面上下文
   * @param {object} options - 选项参数
   *   - {boolean} enablePreference - 是否启用用户偏好（默认true）
   *   - {boolean} enableQualityCheck - 是否启用质量检测（默认false）
   *   - {boolean} autoOptimize - 是否自动优化低分内容（默认false）
   *   - {string} linkUrl - 要解析的链接
   *   - {boolean} stepByStep - 是否启用分步模式（默认false）
   */
  async startCreation(pageContext, options = {}) {
    if (pageContext.data.working) return;

    const {
      enablePreference = true,
      enableQualityCheck = false,
      autoOptimize = false,
      linkUrl = null,
    } = options;

    // 如果提供了链接，先解析
    if (linkUrl) {
      try {
        const LinkParserManager = require("./link-parser").LinkParserManager;
        const linkManager = new LinkParserManager(pageContext);

        const parseResult = await linkManager.parseAndRewrite(linkUrl, {
          targetAudience: pageContext.data.userPreference?.audience || "Z世代",
        });

        if (parseResult.success) {
          // 将解析内容注入到输入框
          const parsedContent =
            parseResult.rewriteResult || parseResult.parseResult?.data;
          pageContext.setData({
            inputValue: parsedContent?.title || parsedContent?.content || "",
          });

          this.addMessage(
            pageContext,
            "system",
            "✓ 链接解析成功：" + (parsedContent?.title || ""),
          );
        }
      } catch (error) {
        console.error("链接解析失败:", error);
        wx.showToast({ title: "链接解析失败", icon: "none" });
      }
    }

    if (!pageContext.data.inputValue.trim()) {
      wx.showToast({ title: "请输入创作需求", icon: "none" });
      return;
    }

    this.addMessage(pageContext, "user", pageContext.data.inputValue);
    const userInput = pageContext.data.inputValue;
    pageContext.setData({ inputValue: "" });

    if (pageContext.data.testMode === "single") {
      if (!pageContext.data.selectedTestAgent) {
        wx.showToast({ title: "请选择要测试的智能体", icon: "none" });
        return;
      }
      await this.testSingleAgent(
        pageContext,
        pageContext.data.selectedTestAgent,
        userInput,
      );
    } else {
      await this.executeFullWorkflow(pageContext, userInput);
    }
  },

  /**
   * 测试单个智能体
   */
  async testSingleAgent(pageContext, agentKey, userInput) {
    pageContext.setData({ working: true });
    this.updateAgentStatus(pageContext, agentKey, "working", 10);
    this.addMessage(
      pageContext,
      agentKey,
      "正在分析您的需求，稍等片刻...",
      true,
    );

    try {
      const response = await pageContext.callAIAPI(
        agentKey,
        userInput,
        [],
        null,
      );

      // 构建图片URL数组（兼容新旧格式）
      const imageUrlArray = [];
      (response.images || []).forEach((img) => {
        // 新格式：双生图
        if (img.glmImageUrl) imageUrlArray.push(img.glmImageUrl);
        if (img.hunyuanImageUrl) imageUrlArray.push(img.hunyuanImageUrl);
        // 旧格式：单张图片
        if (img.imageUrl && !img.glmImageUrl && !img.hunyuanImageUrl)
          imageUrlArray.push(img.imageUrl);
      });

      const messageData = {
        content: response.reply,
        images: response.images || [],
        videos: response.videos || [],
        imageUrlArray: imageUrlArray,
      };
      this.updateMessageWithData(pageContext, agentKey, messageData, false);

      const agentOutputs = pageContext.data.agentOutputs;
      agentOutputs[agentKey] = {
        output: response.reply,
        timestamp: new Date().getTime(),
        images: response.images || [],
        videos: response.videos || [],
      };
      pageContext.setData({ agentOutputs });

      this.updateAgentStatus(pageContext, agentKey, "completed", 100);
      wx.showToast({ title: "测试完成", icon: "success" });
    } catch (error) {
      console.error("测试失败:", error);
      this.updateAgentStatus(pageContext, agentKey, "error", 0);
      this.updateMessage(
        pageContext,
        agentKey,
        "测试失败: " + error.message,
        false,
      );
      wx.showToast({ title: "测试失败", icon: "error", duration: 5000 });
    }

    pageContext.setData({ working: false });
  },
  /**
   * 执行完整工作流
   */
  async executeFullWorkflow(pageContext, userInput) {
    pageContext.setData({
      working: true,
      currentStep: 0,
      progressPercent: 0,
      agentOutputs: {},
      feedbackQueue: [],
      pendingFeedback: {},
      isCancelled: false,
    });

    const activeAgents = pageContext.data.agentList
      .filter((a) => a.active)
      .sort((a, b) => a.order - b.order);

    if (activeAgents.length === 0) {
      wx.showToast({ title: "请至少启用一个智能体", icon: "none" });
      pageContext.setData({ working: false });
      return;
    }

    this.addMessage(
      pageContext,
      "system",
      "🚀 开始多智能体协作，" + activeAgents.length + " 个智能体参与",
    );

    for (let i = 0; i < activeAgents.length; i++) {
      if (pageContext.data.isCancelled) {
        console.log("工作流已被用户取消");
        this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
        pageContext.setData({ working: false, currentStep: 0 });
        return;
      }

      const agent = activeAgents[i];
      const stepNumber = i + 1;

      pageContext.setData({ currentStep: stepNumber });
      this.updateAgentStatus(pageContext, agent.key, "working", 10);
      this.addMessage(
        pageContext,
        "system",
        "步骤 " +
          stepNumber +
          "/" +
          activeAgents.length +
          ": " +
          agent.name +
          " 开始工作",
      );
      this.addMessage(
        pageContext,
        agent.key,
        "正在分析需求并生成内容...",
        true,
      );

      try {
        const pendingFeedback = pageContext.data.pendingFeedback[agent.key];
        let finalUserInput = userInput;

        if (pendingFeedback) {
          finalUserInput = userInput + "\n\n【用户反馈】: " + pendingFeedback;
          console.log(
            "使用反馈重新生成 " + agent.key + "，反馈内容：",
            pendingFeedback,
          );

          const newPendingFeedback = { ...pageContext.data.pendingFeedback };
          delete newPendingFeedback[agent.key];
          pageContext.setData({ pendingFeedback: newPendingFeedback });

          const feedbackQueue = pageContext.data.feedbackQueue.filter(
            (f) => f.agentKey !== agent.key,
          );
          pageContext.setData({ feedbackQueue });
        }

        const context = pageContext.buildAgentContext(agent.key);
        const response = await pageContext.callAIAPI(
          agent.key,
          finalUserInput,
          context,
          null,
        );

        if (pageContext.data.isCancelled) {
          console.log("工作流在API调用后被取消");
          this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
          pageContext.setData({ working: false, currentStep: 0 });
          return;
        }

        // 构建图片URL数组（兼容新旧格式）
        const imageUrlArray = [];
        (response.images || []).forEach((img) => {
          // 新格式：双生图
          if (img.glmImageUrl) imageUrlArray.push(img.glmImageUrl);
          if (img.hunyuanImageUrl) imageUrlArray.push(img.hunyuanImageUrl);
          // 旧格式：单张图片
          if (img.imageUrl && !img.glmImageUrl && !img.hunyuanImageUrl)
            imageUrlArray.push(img.imageUrl);
        });

        const messageData = {
          content: response.reply,
          images: response.images || [],
          videos: response.videos || [],
          imageUrlArray: imageUrlArray,
          liked: false,
          disliked: false,
        };
        this.updateMessageWithData(pageContext, agent.key, messageData, false);

        const agentOutputs = pageContext.data.agentOutputs;
        agentOutputs[agent.key] = {
          output: response.reply,
          timestamp: new Date().getTime(),
          images: response.images || [], // 存储生成的图片（包含提示词）
          videos: response.videos || [], // 存储生成的视频
        };
        pageContext.setData({ agentOutputs });

        // 【重要】如果当前是storyboard，立即为每个分镜生成视频
        if (
          agent.key === "storyboard" &&
          response.images &&
          response.images.length > 0
        ) {
          if (pageContext.data.isCancelled) {
            console.log("工作流在分镜视频生成前被取消");
            this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
            pageContext.setData({ working: false, currentStep: 0 });
            return;
          }

          try {
            this.addMessage(pageContext, "system", "🎬 开始为分镜生成视频...");
            const storyboardImages = response.images;
            const videoResults = [];

            // 为每个分镜生成视频
            for (let j = 0; j < storyboardImages.length; j++) {
              const storyboardImg = storyboardImages[j];
              const imagePrompt = storyboardImg.prompt || "";
              const imageUrl =
                storyboardImg.glmImageUrl ||
                storyboardImg.hunyuanImageUrl ||
                storyboardImg.imageUrl;

              if (!imageUrl) {
                console.warn(`分镜${j + 1}没有成功生成的图片，跳过视频生成`);
                continue;
              }

              try {
                console.log(
                  `正在为分镜${j + 1}/${storyboardImages.length}生成视频，参考图: ${imageUrl.substring(0, 50)}...`,
                );

                // 将图片提示词改写成动态视频提示词
                const videoPrompt = this.convertImagePromptToVideoPrompt(
                  imagePrompt,
                  j + 1,
                  storyboardImages.length,
                );

                // 生成视频（使用GLM cogvideox-3-flash，暂不支持参考图，只能通过prompt描述）
                const videoResult =
                  await pageContext.generateVideo(videoPrompt);

                videoResults.push({
                  index: j + 1,
                  prompt: videoPrompt,
                  referenceImageUrl: imageUrl,
                  videoUrl: videoResult.videoUrl,
                  coverUrl: videoResult.coverUrl,
                });

                console.log(
                  `分镜${j + 1}视频生成成功: ${videoResult.videoUrl.substring(0, 50)}...`,
                );

                // 避免请求过快
                if (j < storyboardImages.length - 1) {
                  await this.delay(3000); // 每个视频间隔3秒
                }
              } catch (error) {
                console.error(`分镜${j + 1}视频生成失败:`, error);
                videoResults.push({
                  index: j + 1,
                  prompt: storyboardImg.prompt,
                  referenceImageUrl: imageUrl,
                  error: error.message,
                });
              }
            }

            // 将生成的视频添加到storyboard的输出中
            agentOutputs.storyboard.videos = videoResults;
            pageContext.setData({ agentOutputs });

            // 在storyboard消息中添加视频信息
            const messages = pageContext.data.messages.map((msg) => {
              if (msg.sender === "storyboard" && !msg.isTyping) {
                let videoInfo = "\n\n🎬 **生成的视频：**\n\n";
                videoResults.forEach((vid) => {
                  if (vid.videoUrl) {
                    videoInfo += `【分镜${vid.index}】\n`;
                    videoInfo += `  参考图: ${vid.referenceImageUrl.substring(0, 50)}...\n`;
                    videoInfo += `  视频URL: ${vid.videoUrl}\n`;
                    videoInfo += `  封面URL: ${vid.coverUrl}\n\n`;
                  } else {
                    videoInfo += `【分镜${vid.index}】生成失败: ${vid.error}\n\n`;
                  }
                });

                const successCount = videoResults.filter(
                  (v) => v.videoUrl,
                ).length;
                videoInfo += ` 成功: ${successCount} / 共 ${videoResults.length} 个视频`;

                return {
                  ...msg,
                  content: msg.content + videoInfo,
                  videos: videoResults,
                };
              }
              return msg;
            });
            pageContext.setData({ messages });

            this.addMessage(
              pageContext,
              "system",
              ` 已为${videoResults.length}个分镜生成视频，视频可直接使用分镜图片作为参考`,
            );

            if (pageContext.data.isCancelled) {
              console.log("工作流在分镜视频生成后被取消");
              this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
              pageContext.setData({ working: false, currentStep: 0 });
              return;
            }
          } catch (error) {
            console.error("生成分镜视频失败:", error);
            this.addMessage(
              pageContext,
              "system",
              "⚠️ 分镜视频生成失败：" + error.message + "，将继续后续流程",
            );
          }
        }

        if (
          agent.key === "scriptWriter" &&
          pageContext.data.characterConsistency.enabled
        ) {
          if (pageContext.data.isCancelled) {
            console.log("工作流在角色三视图生成前被取消");
            this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
            pageContext.setData({ working: false, currentStep: 0 });
            return;
          }

          try {
            this.addMessage(pageContext, "system", "🎨 开始生成角色三视图...");
            const scriptOutput = response.reply;
            const characters =
              pageContext.extractCharactersFromScript(scriptOutput);

            if (characters.length > 0) {
              await pageContext.generateAllCharacterTurnarounds(characters);

              if (pageContext.data.isCancelled) {
                console.log("工作流在角色三视图生成后被取消");
                this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
                pageContext.setData({ working: false, currentStep: 0 });
                return;
              }

              this.addMessage(
                pageContext,
                "system",
                " 已为" +
                  characters.length +
                  "个角色生成三视图，后续场景将保持人物一致性",
              );
            } else {
              this.addMessage(
                pageContext,
                "system",
                "⚠️ 未检测到角色，跳过三视图生成",
              );
            }
          } catch (error) {
            console.error("生成角色三视图失败:", error);
            this.addMessage(
              pageContext,
              "system",
              "⚠️ 角色三视图生成失败：" + error.message,
            );
          }
        }

        this.updateAgentStatus(pageContext, agent.key, "completed", 100);
        this.addMessage(
          pageContext,
          "system",
          " 步骤 " +
            stepNumber +
            "/" +
            activeAgents.length +
            ": " +
            agent.name +
            " 工作完成",
        );

        // AutoGLM发布功能已禁用

        if (pendingFeedback) {
          this.addMessage(
            pageContext,
            "system",
            " 已根据您的反馈重新生成 " + agent.name + " 的内容",
          );
        }

        const progressPercent = Math.round(
          ((i + 1) / activeAgents.length) * 100,
        );
        pageContext.setData({ progressPercent });

        if (i < activeAgents.length - 1) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(agent.name + " 执行失败:", error);
        this.updateAgentStatus(pageContext, agent.key, "error", 0);
        this.updateMessage(
          pageContext,
          agent.key,
          "执行失败: " + error.message,
          false,
        );
        this.addMessage(
          pageContext,
          "system",
          " 步骤 " +
            stepNumber +
            "/" +
            activeAgents.length +
            ": " +
            agent.name +
            " 执行失败",
        );
      }
    }

    const remainingFeedback = pageContext.data.feedbackQueue.filter(
      (f) => !pageContext.data.agentOutputs[f.agentKey],
    );
    if (remainingFeedback.length > 0) {
      this.addMessage(
        pageContext,
        "system",
        "⚠️ 还有 " + remainingFeedback.length + " 个反馈将在下次生成时处理",
      );
    }

    this.addMessage(
      pageContext,
      "system",
      "🎉 多智能体协作完成！共完成 " + activeAgents.length + " 个智能体的任务",
    );
    pageContext.saveCreationHistoryToHistory();
    pageContext.setData({ working: false });
    // 不清空currentStep，保留工作流图标状态供查看
    wx.showToast({ title: "协作完成", icon: "success" });
  },
  /**
   * 取消工作流
   */
  cancelWorkflow(pageContext) {
    if (!pageContext.data.working) {
      wx.showToast({ title: "当前没有运行中的任务", icon: "none" });
      return;
    }

    wx.showModal({
      title: "确认取消",
      content: "确定要取消当前的创作任务吗？",
      confirmText: "确定",
      cancelText: "继续创作",
      success: (res) => {
        if (res.confirm) {
          pageContext.setData({ isCancelled: true });
          this.addMessage(pageContext, "system", "⚠️ 正在取消任务...");
          console.log("用户请求取消工作流");
        }
      },
    });
  },

  /**
   * 添加消息
   */
  addMessage(pageContext, sender, content, isTyping = false) {
    const app = getApp();
    const message = {
      id: Date.now(),
      sender,
      senderName:
        sender === "user"
          ? "用户"
          : app.globalData.agents[sender]?.name || sender,
      content,
      timestamp: new Date().getTime(),
      timeStr: this.formatTime(new Date().getTime()),
      isTyping,
    };

    pageContext.setData({
      messages: [...pageContext.data.messages, message],
      toView: "msg-" + pageContext.data.messages.length,
    });
  },

  /**
   * 更新消息
   */
  updateMessage(pageContext, sender, content, isTyping = false) {
    const messages = pageContext.data.messages.map((msg) => {
      if (msg.sender === sender && msg.isTyping) {
        return { ...msg, content, isTyping };
      }
      return msg;
    });

    pageContext.setData({ messages });
  },

  /**
   * 更新消息（带图片/视频数据）
   */
  updateMessageWithData(pageContext, sender, messageData, isTyping = false) {
    const messages = pageContext.data.messages.map((msg) => {
      if (msg.sender === sender && msg.isTyping) {
        return {
          ...msg,
          content: messageData.content,
          images: messageData.images || [],
          videos: messageData.videos || [],
          isTyping,
        };
      }
      return msg;
    });

    pageContext.setData({ messages });
  },

  /**
   * 更新智能体状态
   */
  updateAgentStatus(pageContext, agentKey, status, progress) {
    const agentList = pageContext.data.agentList.map((agent) => {
      if (agent.key === agentKey) {
        return { ...agent, status, progress };
      }
      return agent;
    });

    pageContext.setData({ agentList });
  },

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return hours + ":" + minutes;
  },

  /**
   * 新增：执行带质量检测的创作流程
   * @param {object} pageContext - 页面上下文
   * @param {string} userInput - 用户输入
   * @param {object} options - 选项
   */
  async executeWorkflowWithQualityCheck(pageContext, userInput, options = {}) {
    const {
      enablePreference = true,
      autoOptimize = false,
      generateViralTitles = false,
    } = options;

    // 先执行完整工作流
    await this.executeFullWorkflow(pageContext, userInput);

    // 检查分镜脚本质量
    if (
      pageContext.data.agentOutputs?.script ||
      pageContext.data.agentOutputs?.storyboard
    ) {
      try {
        const scriptData =
          pageContext.data.agentOutputs.script ||
          pageContext.data.agentOutputs.storyboard;
        const QualityManager = require("./quality-detector").QualityManager;
        const qualityManager = new QualityManager(pageContext);

        // 执行完整质量检测流程
        const qualityResult = await qualityManager.fullQualityCheck(
          scriptData,
          {
            autoFix: autoOptimize,
            optimizationLevel: "comprehensive",
            generateTitles: generateViralTitles,
          },
        );

        if (qualityResult.success) {
          // 显示质量报告
          this.addMessage(
            pageContext,
            "system",
            "📊 **质量检测报告**\n\n" + qualityResult.summary,
          );

          // 如果自动优化了，保存优化后的脚本
          if (qualityResult.optimizedScript && autoOptimize) {
            pageContext.data.agentOutputs.storyboard =
              qualityResult.optimizedScript;
            this.addMessage(pageContext, "system", " 已自动优化分镜脚本");

            // 记录用户偏好
            if (enablePreference) {
              const UserPreferenceManager =
                require("./user-preference").UserPreferenceManager;
              const prefManager = new UserPreferenceManager(pageContext);
              prefManager.recordTheme(scriptData.title || "未知主题");
              prefManager.recordStyle("短视频");
              prefManager.addHistoryRecord({
                type: "创作",
                theme: scriptData.title || "未知主题",
                style: "短视频",
                duration: scriptData.totalDuration || 30,
                result: "success",
              });
            }
          }

          // 显示爆款标题建议
          if (
            qualityResult.viralTitles &&
            qualityResult.viralTitles.length > 0
          ) {
            const titlesList = qualityResult.viralTitles
              .map((t) => `- ${t.title}`)
              .join("\n");
            this.addMessage(
              pageContext,
              "system",
              "💡 **爆款标题建议**\n\n" + titlesList,
            );
          }
        }
      } catch (error) {
        console.error("质量检测失败:", error);
        this.addMessage(
          pageContext,
          "system",
          "⚠️ 质量检测失败，但不影响创作流程",
        );
      }
    }
  },

  /**
   * 新增：使用用户偏好推荐热点并启动创作
   * @param {object} pageContext - 页面上下文
   * @param {array} hotspots - 热点列表
   * @returns {object} - 推荐结果
   */
  async recommendHotspotsAndCreate(pageContext, hotspots) {
    try {
      const UserPreferenceManager =
        require("./user-preference").UserPreferenceManager;
      const prefManager = new UserPreferenceManager(pageContext);

      // 获取推荐的热点
      const recommendedHotspots = prefManager.recommendHotspots(hotspots);

      if (recommendedHotspots.length > 0) {
        // 显示推荐的热点
        const topHotspots = recommendedHotspots.slice(0, 3);
        const hotspotsList = topHotspots
          .map((h) => `🔥 ${h.name}（匹配度：${h.matchScore}，${h.reason})`)
          .join("\n\n");

        this.addMessage(
          pageContext,
          "system",
          "📌 **基于您的偏好推荐以下热点**\n\n" + hotspotsList,
        );

        // 自动选择匹配度最高的热点
        const topHotspot = topHotspots[0];
        pageContext.setData({
          inputValue: `【热点话题：${topHotspot.name}】\n${topHotspot.reason}\n\n请根据这个热点创作短视频。`,
        });

        // 启动创作
        await this.executeFullWorkflow(
          pageContext,
          pageContext.data.inputValue,
        );

        return {
          success: true,
          recommendedHotspots,
          selectedHotspot: topHotspot,
        };
      }

      return {
        success: false,
        message: "暂无匹配的热点推荐",
      };
    } catch (error) {
      console.error("推荐热点失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 将图片提示词改写成视频动态提示词
   */
  convertImagePromptToVideoPrompt(imagePrompt, currentIndex, totalCount) {
    // 如果提示词太短，补充上下文
    let prompt = imagePrompt;

    // 添加视频相关的动态描述
    const videoKeywords = [
      "smooth camera movement",
      "dynamic motion",
      "cinematic animation",
      "gentle pan",
      "fluid transitions",
    ];

    // 随机选择一个动态关键词
    const randomKeyword =
      videoKeywords[Math.floor(Math.random() * videoKeywords.length)];

    // 构建视频提示词
    const videoPrompt = `${prompt} with ${randomKeyword}. Create a ${5 + Math.floor(Math.random() * 5)} second cinematic video with smooth camera movement and natural animation. The video should be high quality, with ${imagePrompt.includes("photorealistic") ? "photorealistic" : "aesthetic"} visuals and professional lighting.`;

    console.log(
      `分镜${currentIndex}/${totalCount} 视频prompt: ${videoPrompt.substring(0, 100)}...`,
     );
     return videoPrompt;
  },

  /**
   * 【分步创作】切换分步创作模式
   */
  toggleStepByStepMode(pageContext) {
    const stepByStep = !pageContext.data.stepByStepMode;
    pageContext.setData({
      stepByStepMode: stepByStep,
      currentCreationStep: 0  // 重置到第一步
    });

    console.log(`【分步创作】切换模式: ${stepByStep ? '启用' : '禁用'}`);

    if (stepByStep) {
      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ' 已启用分步创作模式，您可以：\n• 每步预览和确认结果\n• 不满意可重新生成或修改\n• 实时控制TOKEN消耗'
      });
    }
  },

  /**
   * 【分步创作】执行当前步骤
   */
  async executeCurrentStep(pageContext, userInput) {
    const step = pageContext.data.currentCreationStep;

    switch(step) {
      case 0: await this.executeHotspotStep(pageContext, userInput); break;
      case 1: await this.executeScriptStep(pageContext, userInput); break;
      case 2: await this.executeStoryboardStep(pageContext, userInput); break;
      case 3: await this.executeVideoStep(pageContext, userInput); break;
    }
  },

  /**
   * 【分步创作】下一步
   */
  nextStep(pageContext) {
    const current = pageContext.data.currentCreationStep;
    const maxStep = 3;

    if (current < maxStep) {
      const nextStep = current + 1;
      pageContext.setData({ currentCreationStep: nextStep });

      // 更新步骤按钮状态
      const stepButtons = pageContext.data.stepButtons.map((btn, idx) => ({
        ...btn,
        status: idx <= nextStep ? 'completed' : (idx === nextStep ? 'working' : 'pending')
      }));
      pageContext.setData({ stepButtons });

      console.log(`【分步创作】进入步骤 ${nextStep}`);
      this.executeCurrentStep(pageContext, '');
    } else {
      wx.showToast({
        title: '🎉 创作完成！',
        icon: 'success'
      });
      console.log('【分步创作】所有步骤已完成');
    }
  },

  /**
   * 【分步创作】重新执行当前步骤
   */
  retryCurrentStep(pageContext, userInput) {
    this.executeCurrentStep(pageContext, userInput || '');
  },

  /**
   * 【分步创作】步骤0：热点分析
   */
  async executeHotspotStep(pageContext, userInput) {
    console.log('【分步创作】步骤0：热点分析');

    // 如果用户已选择热点，直接使用
    if (pageContext.data.selectedHotspot) {
      pageContext.setData({
        'stepData[0].selectedHotspot': pageContext.data.selectedHotspot,
        'stepButtons[0].status': 'completed'
      });

      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ` 已选择热点：${pageContext.data.selectedHotspot.name}\n来源：${pageContext.data.selectedHotspot.source}\n热度：${pageContext.data.selectedHotspot.heat}`
      });

      return;
    }

    // 调用热点智能体（轻量分析，只消耗0.3 TOKEN）
    try {
      const response = await pageContext.callAIAPI(
        'trendHunter',
        userInput,
        [],
        null,
        { maxTokens: 200 }
      );

      pageContext.setData({
        'stepData[0].aiAnalysis': response.reply,
        'stepButtons[0].status': 'completed'
      });

      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ` 热点分析完成\n\n${response.reply}`
      });
    } catch (error) {
      console.error('【分步创作】热点分析失败:', error);
      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ' 热点分析失败：' + error.message
      });
      pageContext.setData({ 'stepButtons[0].status': 'error' });
    }
  },

  /**
   * 【分步创作】步骤1：脚本创作
   */
  async executeScriptStep(pageContext, userInput) {
    console.log('【分步创作】步骤1：脚本创作');

    // 使用前序步骤的结果
    const hotspot = pageContext.data.selectedHotspot || pageContext.data.stepData[0].selectedHotspot;
    const hotAnalysis = pageContext.data.stepData[0].aiAnalysis;

    // 构建上下文，减少TOKEN消耗
    const context = [];
    if (hotspot) {
      context.push({
        role: 'assistant',
        content: `热点信息：${hotspot.name}，来源：${hotspot.source}，热度：${hotspot.heat}`
      });
    }
    if (hotAnalysis) {
      context.push({
        role: 'assistant',
        content: `热点分析：${hotAnalysis}`
      });
    }

    // 从知识库加载相关案例
    if (pageContext.KnowledgeManager) {
      try {
        const knowledge = await pageContext.KnowledgeManager.loadAgentKnowledge('scriptWriter', userInput);
        if (knowledge.recentCases && knowledge.recentCases.length > 0) {
          context.push({
            role: 'assistant',
            content: `参考类似案例：${knowledge.recentCases[0].input}`
          });
        }
      } catch (error) {
        console.error('【分步创作】加载知识库失败:', error);
      }
    }

    // 生成脚本（中等长度）
    try {
      const response = await pageContext.callAIAPI(
        'scriptWriter',
        userInput,
        context,
        null,
        { maxTokens: 500 }
      );

      pageContext.setData({
        'stepData[1].generatedScript': response.reply,
        'stepData[1].previewScript': response.reply,
        'stepButtons[1].status': 'completed'
      });

      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ` 脚本生成完成\n\n${response.reply.substring(0, 300)}...`
      });

      // 保存成功案例到知识库
      if (pageContext.KnowledgeManager) {
        try {
          await pageContext.KnowledgeManager.saveSuccessCaseToKnowledge('scriptWriter', userInput, response.reply, 5);
        } catch (error) {
          console.error('【分步创作】保存知识库失败:', error);
        }
      }
    } catch (error) {
      console.error('【分步创作】脚本生成失败:', error);
      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ' 脚本生成失败：' + error.message
      });
      pageContext.setData({ 'stepButtons[1].status': 'error' });
    }
  },

  /**
   * 【分步创作】步骤2：分镜设计
   */
  async executeStoryboardStep(pageContext, userInput) {
    console.log('【分步创作】步骤2：分镜设计');

    // 使用脚本步骤的结果
    const script = pageContext.data.stepData[1].userModifiedScript ||
                  pageContext.data.stepData[1].generatedScript;

    if (!script) {
      wx.showToast({
        title: '请先完成脚本创作',
        icon: 'none'
      });
      return;
    }

    // 从知识库加载分镜相关案例
    const context = [];
    if (pageContext.KnowledgeManager) {
      try {
        const knowledge = await pageContext.KnowledgeManager.loadAgentKnowledge('storyboard', script);
        if (knowledge.recentCases && knowledge.recentCases.length > 0) {
          context.push({
            role: 'assistant',
            content: `参考分镜案例：${knowledge.recentCases[0].input}`
          });
        }
      } catch (error) {
        console.error('【分步创作】加载知识库失败:', error);
      }
    }

    // 生成分镜
    try {
      const response = await pageContext.callAIAPI(
        'storyboard',
        '根据脚本设计分镜：' + script,
        [
          { role: 'user', content: script }
        ],
        null,
        { maxTokens: 300 }
      );

      pageContext.setData({
        'stepData[2].generatedStoryboards': response.images || [],
        'stepButtons[2].status': 'completed'
      });

      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ` 分镜设计完成，共生成 ${response.images?.length || 0} 个分镜`
      });

      // 保存成功案例到知识库
      if (pageContext.KnowledgeManager) {
        try {
          await pageContext.KnowledgeManager.saveSuccessCaseToKnowledge('storyboard', script, response.images || [], 4);
        } catch (error) {
          console.error('【分步创作】保存知识库失败:', error);
        }
      }
    } catch (error) {
      console.error('【分步创作】分镜设计失败:', error);
      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ' 分镜设计失败：' + error.message
      });
      pageContext.setData({ 'stepButtons[2].status': 'error' });
    }
  },

  /**
   * 【分步创作】步骤3：视频合成（最终）
   */
  async executeVideoStep(pageContext, userInput) {
    console.log('【分步创作】步骤3：视频合成');

    // 使用所有前序结果，只调用一次
    const script = pageContext.data.stepData[1].userModifiedScript ||
                  pageContext.data.stepData[1].generatedScript;
    const storyboards = pageContext.data.stepData[2].generatedStoryboards;

    if (!script) {
      wx.showToast({
        title: '请先完成脚本创作',
        icon: 'none'
      });
      return;
    }

    const context = [];
    context.push({
      role: 'user',
      content: script
    });

    if (storyboards && storyboards.length > 0) {
      context.push({
        role: 'assistant',
        content: `分镜数量：${storyboards.length}，已准备合成视频`
      });
    }

    // 生成视频（最终，只调用一次）
    try {
      const response = await pageContext.callAIAPI(
        'videoComposer',
        '合成最终视频',
        context,
        storyboards,  // 传递分镜图
        { maxTokens: 200 }
      );

      pageContext.setData({
        'stepData[3].generatedVideo': response.videos?.[0],
        'stepButtons[3].status': 'completed'
      });

      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: '🎉 视频合成完成！'
      });
    } catch (error) {
      console.error('【分步创作】视频合成失败:', error);
      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ' 视频合成失败：' + error.message
      });
      pageContext.setData({ 'stepButtons[3].status': 'error' });
    }
  },

  /**
   * 【分步创作】修改步骤结果
   */
  modifyStepResult(pageContext, step, modifiedContent) {
    switch (step) {
      case 1: // 修改脚本
        pageContext.setData({
          'stepData[1].userModifiedScript': modifiedContent
        });
        break;
      case 2: // 修改分镜
        pageContext.setData({
          'stepData[2].userSelectedStoryboards': modifiedContent
        });
        break;
      case 3: // 修改视频
        pageContext.setData({
          'stepData[3].userModifiedVideo': modifiedContent
        });
        break;
    }

    console.log(`【分步创作】步骤 ${step} 已修改`);
  },

  /**
   * 【分步创作】查看智能体工作内容
   */
  async executeSingleAgentWork(pageContext, agentKey, userInput) {
    console.log(`【查看智能体】${agentKey} 工作内容`);

    pageContext.setData({ working: true });

    try {
      const response = await pageContext.callAIAPI(
        agentKey,
        userInput,
        [],
        null
      );

      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ` ${agentKey} 工作内容：\n\n${response.reply}`
      });

      pageContext.setData({ working: false });
    } catch (error) {
      console.error(`【查看智能体】${agentKey} 失败:`, error);
      pageContext.UIHelper && pageContext.UIHelper.addMessage({
        sender: 'system',
        content: ` ${agentKey} 失败：` + error.message
      });
      pageContext.setData({ working: false });
    }
  },

  /**
   * 【分步创作】跳过当前步骤
   */
  skipCurrentStep(pageContext) {
    const current = pageContext.data.currentCreationStep;
    const maxStep = 3;

    if (current < maxStep) {
      this.nextStep(pageContext);
    }
  },
};

module.exports = WorkflowManager;
