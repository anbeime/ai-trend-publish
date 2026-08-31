class AgentRegistry {
  constructor(pageContext, app) {
    this.page = pageContext;
    this.app = app;
  }

  getAgentOrder(key) {
    const order = { 
      trendHunter: 1,
      scriptWriter: 2,
      storyboard: 3,
      videoComposer: 4,
      qualityChecker: 5,
      platformAdapter: 6,
      autoPublisher: 7
    };
    return order[key] || 99;
  }

  switchTestMode(pageContext, e) {
    const ctx = pageContext || this.page;
    if (!ctx) {
      console.error('AgentRegistry: 缺少页面上下文');
      return;
    }
    ctx.setData({ testMode: e.detail.value });
  }

  selectTestAgent(pageContext, e) {
    const ctx = pageContext || this.page;
    if (!ctx) {
      console.error('AgentRegistry: 缺少页面上下文');
      return;
    }
    ctx.setData({ selectedTestAgent: e.detail.value });
  }

  toggleAgent(pageContext, e) {
    const ctx = pageContext || this.page;
    if (!ctx) {
      console.error('AgentRegistry: 缺少页面上下文');
      return;
    }
    if (ctx.data.working) return;

    const key = e.currentTarget.dataset.key;
    const agentList = ctx.data.agentList.map((agent) => {
      if (agent.key === key) {
        return { ...agent, active: !agent.active };
      }
      return agent;
    });

    // 更新workflow数组中的isActive
    const workflow = ctx.data.workflow.map((item) => {
      if (item.key === key) {
        const agent = agentList.find((a) => a.key === key);
        return {
          ...item,
          isActive: agent ? agent.active : false,
        };
      }
      return item;
    });

    // 计算活跃智能体数量
    const activeAgentCount = agentList.filter((a) => a.active).length;

    ctx.setData({
      agentList,
      workflow,
      activeAgentCount,
    });
  }

  toggleAgentsPanel(pageContext) {
    const ctx = pageContext || this.page;
    if (!ctx) {
      console.error('AgentRegistry: 缺少页面上下文');
      return;
    }
    const collapsed = !ctx.data.agentsPanelCollapsed;
    ctx.setData({ agentsPanelCollapsed: collapsed });
    if (ctx.storageManager) {
      ctx.storageManager.saveAgentsPanelPreference(collapsed);
    }
  }

  getSystemPrompt(pageContext, agentType) {
    const prompts = {
      strategy: "你是策略智能体，负责分析用户需求并制定内容策略。",
      script: "你是脚本智能体，负责创作剧本内容。",
      storyboard: "你是分镜智能体，负责设计视觉分镜。",
      image: "你是图片智能体，负责生成图片。",
      video: "你是视频智能体，负责生成视频。",
      publish: "你是发布智能体，负责内容发布。"
    };
    return prompts[agentType] || "";
  }

  initAgents(pageContext, app) {
    try {
      // 优先使用参数，否则使用存储的实例
      const ctx = pageContext || this.page;
      const appInstance = app || this.app || getApp();
      
      console.log('=== 初始化智能体列表开始 ===');
      console.log('AgentRegistry: ctx =', ctx);
      console.log('AgentRegistry: this.page =', this.page);
      console.log('AgentRegistry: this.app =', this.app);
      
      if (!ctx) {
        console.error('AgentRegistry: 缺少页面上下文 (ctx is null/undefined)');
        return;
      }
      
      if (typeof ctx.data === 'undefined') {
        console.error('AgentRegistry: ctx.data 未定义，ctx 结构:', Object.keys(ctx));
        // 尝试检查是否是有效的页面对象
        if (typeof ctx.setData === 'function') {
          console.log('AgentRegistry: ctx 有 setData 方法，可能是有效的页面对象');
        }
        return;
      }
      
      console.log('ctx.data:', ctx.data);
      console.log('appInstance:', appInstance);
      
      // 确保 appInstance.globalData.agents 存在，如果不存在则使用默认值
      let agents = appInstance && appInstance.globalData ? appInstance.globalData.agents : null;
      if (!agents || Object.keys(agents).length === 0) {
        console.warn('app.globalData.agents 未定义或为空对象，使用默认智能体列表');
        agents = {
          trendHunter: {
            name: '热点追踪',
            icon: '🔥',
            color: '#ff4d4f',
            description: '监控热门内容，推荐选题'
          },
          scriptWriter: {
            name: '脚本创作',
            icon: '',
            color: '#1890ff',
            description: '生成结构化脚本和分镜'
          },
          storyboard: {
            name: '分镜图片制作',
            icon: '🎨',
            color: '#eb2f96',
            description: '生成分镜画面，保持角色一致性'
          },
          videoComposer: {
            name: '视频合成',
            icon: '🎞️',
            color: '#722ed1',
            description: '合成分镜为视频，添加转场和配音'
          },
          qualityChecker: {
            name: '质检审核',
            icon: '',
            color: '#52c41a',
            description: '检查素材完整性和内容合规'
          },
          platformAdapter: {
            name: '平台适配',
            icon: '📱',
            color: '#fa8c16',
            description: '多平台时长、比例、标签适配'
          },
          autoPublisher: {
            name: '自动发布',
            icon: '🚀',
            color: '#13c2c2',
            description: '一键发布到各平台'
          }
        };
      }
      console.log('agents:', agents);
      const agentList = Object.keys(agents)
        .map((key) => ({
          key,
          ...agents[key],
          active: true, // 默认全部启用
          status: "idle",
          progress: 0,
          order: this.getAgentOrder(key),
        }))
        .sort((a, b) => a.order - b.order);
      console.log('agentList initialized:', agentList);
      console.log('agentList length:', agentList.length);

      // 确保 workflow 存在
      if (!ctx.data.workflow) {
        console.warn('ctx.data.workflow 未定义，初始化为空数组');
        ctx.setData({ workflow: [] });
      }

      // Initialize workflow array
      const workflow = ctx.data.workflow.map((item) => {
        const agent = agentList.find((a) => a.key === item.key);
        return {
          ...item,
          isActive: agent ? agent.active : false,
        };
      });

      // 计算活跃智能体数量
      const activeAgentCount = agentList.filter((a) => a.active).length;

      ctx.setData({
        agentList,
        workflow,
        activeAgentCount,
      });
      console.log('智能体面板数据已设置，agentList 长度:', agentList.length);
      console.log('=== 初始化智能体列表完成 ===');
      
      // 显示成功提示（仅开发调试）
      // wx.showToast({ title: '智能体加载完成', icon: 'success' });
    } catch (error) {
      console.error('初始化智能体列表失败:', error);
      console.error('Error stack:', error.stack);
      // 设置空列表作为后备
      const ctx = pageContext || this.page;
      if (ctx && typeof ctx.setData === 'function') {
        try {
          ctx.setData({
            agentList: [],
            workflow: [],
            activeAgentCount: 0,
          });
        } catch (setDataError) {
          console.error('设置空列表失败:', setDataError);
        }
      }
    }
  }
}

module.exports = AgentRegistry;
