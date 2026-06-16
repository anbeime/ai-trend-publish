class AgentWorkspaceManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.agents = {};
    this.agentWorkspace = [];
    this.initKeyMap();

    // 初始化时复制页面数据到本地副本
    this.syncAgentsFromPage();
  }

  // 从页面同步agents数据到本地
  syncAgentsFromPage() {
    if (this.page && this.page.data && this.page.data.agents) {
      this.agents = { ...this.page.data.agents };
    }
  }

  // 初始化新旧key的映射关系
  initKeyMap() {
    this.keyMap = {
      hotspot: "trendHunter",
      script: "scriptWriter",
      storyboard: "storyboard",
      video: "videoComposer",
      editor: "qualityChecker",
      dataAnalysis: "platformAdapter",
      roleConsistency: "autoPublisher",
    };
  }

  // 点击智能体图标的处理逻辑
  onAgentTap(e) {
    const agentKey = e.currentTarget.dataset.agent;
    console.log('🎯 点击智能体图标:', agentKey);

    // 同步最新的agents数据
    this.syncAgentsFromPage();

    // 优先从页面数据获取agents，否则使用本地副本
    const agents = this.page.data.agents || this.agents;
    const agent = agents[agentKey];
    
    if (!agent) {
      console.warn('⚠️ 智能体不存在:', agentKey, '可用的智能体:', Object.keys(agents));
      wx.showToast({
        title: '智能体不存在',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    console.log(`📊 智能体状态: ${agent.status}, 有输出: ${!!agent.output}`);

    // 点击时直接滚动到工作区
    if (agent.status === "working" || agent.status === "completed" || agent.output) {
      console.log(`✅ 智能体 ${agentKey} 状态: ${agent.status}, 准备滚动`);

      // 优先滚动到工作区卡片
      const targetKey = agent.key || agentKey;
      const agentWorkspace = this.page.data.agentWorkspace || [];
      const workspaceItem = agentWorkspace.find(item => item.key === targetKey);
      
      if (workspaceItem) {
        // 找到工作区卡片，滚动到该位置
        console.log(`📍 滚动到工作区卡片: agent-${targetKey}`);
        this.page.setData({
          toViewWorkspace: `agent-${targetKey}`,
        });
        
        // 如果卡片是折叠状态，自动展开
        if (workspaceItem.collapsed) {
          workspaceItem.collapsed = false;
          this.page.setData({
            agentWorkspace: agentWorkspace
          });
          console.log(`📂 自动展开卡片: ${targetKey}`);
        }
      } else {
        // 没有工作区卡片，尝试滚动到消息位置
        const messages = this.page.data.messages || [];
        const targetIndex = messages.findIndex((msg) => msg.sender === agentKey);

        if (targetIndex >= 0) {
          console.log(`📍 滚动到消息: msg-${targetIndex}`);
          this.page.setData({
            toView: `msg-${targetIndex}`,
          });
        } else {
          console.log('⚠️ 未找到对应的工作区卡片或消息');
          wx.showToast({
            title: '暂无工作内容',
            icon: 'none',
            duration: 1500
          });
        }
      }

      // 如果智能体有输出且已完成，显示简要提示
      if (agent.output && agent.status === "completed") {
        wx.showToast({
          title: `查看${agent.name}工作内容`,
          icon: 'success',
          duration: 1500
        });
      }
    } else {
      console.log(`⏳ 智能体 ${agentKey} 尚未开始工作`);
      wx.showToast({
        title: "该智能体尚未开始工作",
        icon: "none",
        duration: 1500,
      });
    }
  }

  // 切换卡片展开/折叠状态
  toggleAgentCard(e) {
    const agentKey = e.currentTarget.dataset.agent;
    console.log('🔄 切换卡片状态:', agentKey);
    
    // 从页面数据获取最新的工作区数据
    const agentWorkspace = this.page.data.agentWorkspace || this.agentWorkspace;
    const agent = agentWorkspace.find((item) => item.key === agentKey);
    
    if (agent) {
      agent.collapsed = !agent.collapsed;
      console.log(`✅ 卡片 ${agentKey} ${agent.collapsed ? '已折叠' : '已展开'}`);
      
      // 更新页面数据
      this.page.setData({ 
        agentWorkspace: agentWorkspace 
      });
      
      // 同步更新本地副本
      this.agentWorkspace = agentWorkspace;
    } else {
      console.warn('⚠️ 未找到智能体卡片:', agentKey);
    }
  }

  // 更新智能体状态（通过旧key）
  updateAgentStatus(oldKey, status) {
    const newKey = this.keyMap[oldKey];
    if (newKey) {
      this.updateAgentStatusByNewKey(newKey, status);
    }
  }

  // 更新智能体状态（通过新key）
  updateAgentStatusByNewKey(newKey, status) {
    const agent = this.agents[newKey];
    if (agent) {
      agent.status = status;
      this.page.setData({ agents: this.agents });
    }
  }

  // 保存智能体输出
  saveAgentOutput(newKey, output) {
    const agent = this.agents[newKey];
    if (agent) {
      agent.output = output;
      agent.status = "completed";
      this.page.setData({ agents: this.agents });
    }
  }

  // 更新工作区显示
  updateWorkspaceDisplay() {
    // 优先使用页面数据
    this.syncAgentsFromPage();

    this.agentWorkspace = Object.entries(this.page.data.agents || {})
      .filter(([key, agent]) => agent.enabled)
      .map(([key, agent]) => ({
        key: key, // 确保有key属性用于滚动定位
        ...agent,
        collapsed: false, // 默认展开
      }));
    this.page.setData({ agentWorkspace: this.agentWorkspace });
    console.log('📋 更新工作区显示，智能体数量:', this.agentWorkspace.length);
  }

  // 获取智能体输出
  getAgentOutput(newKey) {
    const agent = this.agents[newKey];
    return agent ? agent.output : null;
  }

  // 检查是否有输出
  hasAgentOutput(newKey) {
    return !!this.getAgentOutput(newKey);
  }

  // 清空所有输出
  clearAllOutputs() {
    Object.values(this.agents).forEach((agent) => {
      agent.output = "";
      agent.status = "idle";
    });
    this.page.setData({ agents: this.agents });
  }
}

module.exports = AgentWorkspaceManager;
