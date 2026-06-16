// modules/workflow-manager.js
// 多智能体工作流管理模块

const WorkflowManager = {
  /**
   * 启动创作流程（sendMessage的逻辑）
   */
  async startCreation(pageContext) {
    if (pageContext.data.working) return;

    if (!pageContext.data.apiConfigured) {
      wx.showModal({
        title: "未配置API",
        content: "请先配置AI API密钥才能使用",
        confirmText: "去配置",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            pageContext.showConfigDialog();
          }
        },
      });
      return;
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
      await this.testSingleAgent(pageContext, pageContext.data.selectedTestAgent, userInput);
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
    this.addMessage(pageContext, agentKey, "正在分析您的需求，稍等片刻...", true);

    try {
      const response = await pageContext.callAIAPI(agentKey, userInput, [], null);
      const imageUrlArray = (response.images || [])
        .filter((img) => img.imageUrl)
        .map((img) => img.imageUrl);
      const messageData = {
        content: response.reply,
        images: response.images || [],
        videos: response.videos || [],
        imageUrlArray: imageUrlArray,
      };
      this.updateMessageWithData(pageContext, agentKey, messageData, false);

      const agentOutputs = pageContext.data.agentOutputs;
      agentOutputs[agentKey] = response.reply;
      pageContext.setData({ agentOutputs });

      this.updateAgentStatus(pageContext, agentKey, "completed", 100);
      wx.showToast({ title: "测试完成", icon: "success" });
    } catch (error) {
      console.error("测试失败:", error);
      this.updateAgentStatus(pageContext, agentKey, "error", 0);
      this.updateMessage(pageContext, agentKey, "测试失败: " + error.message, false);
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

    this.addMessage(pageContext, "system", "🚀 开始多智能体协作，" + activeAgents.length + " 个智能体参与");

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
      this.addMessage(pageContext, "system", "步骤 " + stepNumber + "/" + activeAgents.length + ": " + agent.name + " 开始工作");
      this.addMessage(pageContext, agent.key, "正在分析需求并生成内容...", true);

      try {
        const pendingFeedback = pageContext.data.pendingFeedback[agent.key];
        let finalUserInput = userInput;

        if (pendingFeedback) {
          finalUserInput = userInput + "\n\n【用户反馈】: " + pendingFeedback;
          console.log("使用反馈重新生成 " + agent.key + "，反馈内容：", pendingFeedback);

          const newPendingFeedback = { ...pageContext.data.pendingFeedback };
          delete newPendingFeedback[agent.key];
          pageContext.setData({ pendingFeedback: newPendingFeedback });

          const feedbackQueue = pageContext.data.feedbackQueue.filter((f) => f.agentKey !== agent.key);
          pageContext.setData({ feedbackQueue });
        }

        const context = pageContext.buildAgentContext(agent.key);
        const response = await pageContext.callAIAPI(agent.key, finalUserInput, context, null);

        if (pageContext.data.isCancelled) {
          console.log("工作流在API调用后被取消");
          this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
          pageContext.setData({ working: false, currentStep: 0 });
          return;
        }

        const imageUrlArray = (response.images || []).filter((img) => img.imageUrl).map((img) => img.imageUrl);
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
        };
        pageContext.setData({ agentOutputs });

        if (agent.key === "scriptWriter" && pageContext.data.characterConsistency.enabled) {
          if (pageContext.data.isCancelled) {
            console.log("工作流在角色三视图生成前被取消");
            this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
            pageContext.setData({ working: false, currentStep: 0 });
            return;
          }

          try {
            this.addMessage(pageContext, "system", "🎨 开始生成角色三视图...");
            const scriptOutput = response.reply;
            const characters = pageContext.extractCharactersFromScript(scriptOutput);

            if (characters.length > 0) {
              await pageContext.generateAllCharacterTurnarounds(characters);

              if (pageContext.data.isCancelled) {
                console.log("工作流在角色三视图生成后被取消");
                this.addMessage(pageContext, "system", "⚠️ 用户取消了创作任务");
                pageContext.setData({ working: false, currentStep: 0 });
                return;
              }

              this.addMessage(pageContext, "system", " 已为" + characters.length + "个角色生成三视图，后续场景将保持人物一致性");
            } else {
              this.addMessage(pageContext, "system", "⚠️ 未检测到角色，跳过三视图生成");
            }
          } catch (error) {
            console.error("生成角色三视图失败:", error);
            this.addMessage(pageContext, "system", "⚠️ 角色三视图生成失败：" + error.message);
          }
        }

        this.updateAgentStatus(pageContext, agent.key, "completed", 100);
        this.addMessage(pageContext, "system", " 步骤 " + stepNumber + "/" + activeAgents.length + ": " + agent.name + " 工作完成");

        if (agent.key === "autoPublisher" && pageContext.data.autoglmConfig.enabled) {
          try {
            const platformAdapterOutput = pageContext.data.agentOutputs["platformAdapter"]?.output || "";
            const platform = pageContext.data.selectedPlatform;

            const titleMatch = platformAdapterOutput.match(/标题[:：](.*?)(?:\n|$)/i);
            const descMatch = platformAdapterOutput.match(/描述[:：](.*?)(?:\n|$)/i);
            const tagsMatch = platformAdapterOutput.match(/标签[:：](.*?)(?:\n|$)/i);

            const title = titleMatch ? titleMatch[1].trim() : "未命名视频";
            const description = descMatch ? descMatch[1].trim() : "";
            const tags = tagsMatch ? tagsMatch[1].split(/[,，]/).map((t) => t.trim()).filter((t) => t) : [];

            this.addMessage(pageContext, "system", "📱 正在通过 AutoGLM 发布到 " + pageContext.getPlatformName(platform) + "...");

            const publishResult = await pageContext.callAutoGLMPublish(platform, title, description, tags);

            if (publishResult.success) {
              this.addMessage(pageContext, "system", " 已成功发布到 " + pageContext.getPlatformName(platform) + "！");
            } else {
              this.addMessage(pageContext, "system", "⚠️ AutoGLM 发布失败，请手动发布");
            }
          } catch (error) {
            console.error("AutoGLM 发布失败:", error);
            this.addMessage(pageContext, "system", "⚠️ AutoGLM 发布失败: " + error.message + "，请手动发布");
          }
        }

        if (pendingFeedback) {
          this.addMessage(pageContext, "system", " 已根据您的反馈重新生成 " + agent.name + " 的内容");
        }

        const progressPercent = Math.round(((i + 1) / activeAgents.length) * 100);
        pageContext.setData({ progressPercent });

        if (i < activeAgents.length - 1) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(agent.name + " 执行失败:", error);
        this.updateAgentStatus(pageContext, agent.key, "error", 0);
        this.updateMessage(pageContext, agent.key, "执行失败: " + error.message, false);
        this.addMessage(pageContext, "system", " 步骤 " + stepNumber + "/" + activeAgents.length + ": " + agent.name + " 执行失败");
      }
    }

    const remainingFeedback = pageContext.data.feedbackQueue.filter((f) => !pageContext.data.agentOutputs[f.agentKey]);
    if (remainingFeedback.length > 0) {
      this.addMessage(pageContext, "system", "⚠️ 还有 " + remainingFeedback.length + " 个反馈将在下次生成时处理");
    }

    this.addMessage(pageContext, "system", "🎉 多智能体协作完成！共完成 " + activeAgents.length + " 个智能体的任务");
    pageContext.saveCreationHistoryToHistory();
    pageContext.setData({ working: false });
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
      senderName: sender === "user" ? "用户" : app.globalData.agents[sender]?.name || sender,
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
};

module.exports = WorkflowManager;
