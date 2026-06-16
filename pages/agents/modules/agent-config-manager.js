// agent-config-manager.js - 智能体配置管理器
// 提供配置的读取、更新、导入导出功能

const AGENTS_CONFIG = require('./agents-config.js');

class AgentConfigManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.configs = this.loadConfigs();
  }

  /**
   * 加载配置（优先从本地存储）
   */
  loadConfigs() {
    try {
      const savedConfigs = wx.getStorageSync('agents_custom_config');
      if (savedConfigs) {
        console.log('加载自定义配置');
        return JSON.parse(savedConfigs);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
    
    console.log('使用默认配置');
    return AGENTS_CONFIG;
  }

  /**
   * 保存配置到本地
   */
  saveConfigs() {
    try {
      wx.setStorageSync('agents_custom_config', JSON.stringify(this.configs));
      console.log('配置保存成功');
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }

  /**
   * 获取指定智能体的配置
   */
  getAgentConfig(agentId) {
    return this.configs[agentId] || null;
  }

  /**
   * 获取智能体的完整prompt
   */
  getAgentPrompt(agentId, variables = {}) {
    const config = this.getAgentConfig(agentId);
    if (!config) return null;

    let systemPrompt = config.prompt.system;
    let userPrompt = config.prompt.user;

    // 替换变量
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), variables[key] || '');
      userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });

    return {
      system: systemPrompt,
      user: userPrompt,
      knowledge: config.knowledge
    };
  }

  /**
   * 更新智能体配置
   */
  updateAgentConfig(agentId, updates) {
    if (!this.configs[agentId]) {
      console.error('智能体不存在:', agentId);
      return false;
    }

    // 深度合并配置
    this.configs[agentId] = this.deepMerge(this.configs[agentId], updates);
    
    return this.saveConfigs();
  }

  /**
   * 更新智能体prompt
   */
  updateAgentPrompt(agentId, promptType, content) {
    if (!this.configs[agentId]) {
      console.error('智能体不存在:', agentId);
      return false;
    }

    if (promptType === 'system') {
      this.configs[agentId].prompt.system = content;
    } else if (promptType === 'user') {
      this.configs[agentId].prompt.user = content;
    } else {
      console.error('未知的prompt类型:', promptType);
      return false;
    }

    return this.saveConfigs();
  }

  /**
   * 更新智能体知识库
   */
  updateAgentKnowledge(agentId, knowledgeType, content) {
    if (!this.configs[agentId]) {
      console.error('智能体不存在:', agentId);
      return false;
    }

    if (!this.configs[agentId].knowledge) {
      this.configs[agentId].knowledge = {};
    }

    this.configs[agentId].knowledge[knowledgeType] = content;
    
    return this.saveConfigs();
  }

  /**
   * 添加知识库示例
   */
  addKnowledgeExample(agentId, example) {
    if (!this.configs[agentId]) {
      console.error('智能体不存在:', agentId);
      return false;
    }

    if (!this.configs[agentId].knowledge.examples) {
      this.configs[agentId].knowledge.examples = [];
    }

    this.configs[agentId].knowledge.examples.push(example);
    
    return this.saveConfigs();
  }

  /**
   * 删除知识库示例
   */
  removeKnowledgeExample(agentId, index) {
    if (!this.configs[agentId] || !this.configs[agentId].knowledge.examples) {
      return false;
    }

    this.configs[agentId].knowledge.examples.splice(index, 1);
    
    return this.saveConfigs();
  }

  /**
   * 重置智能体配置为默认值
   */
  resetAgentConfig(agentId) {
    if (!AGENTS_CONFIG[agentId]) {
      console.error('智能体不存在:', agentId);
      return false;
    }

    this.configs[agentId] = JSON.parse(JSON.stringify(AGENTS_CONFIG[agentId]));
    
    return this.saveConfigs();
  }

  /**
   * 重置所有配置
   */
  resetAllConfigs() {
    this.configs = JSON.parse(JSON.stringify(AGENTS_CONFIG));
    return this.saveConfigs();
  }

  /**
   * 导出配置
   */
  exportConfig(agentId = null) {
    if (agentId) {
      return JSON.stringify(this.configs[agentId], null, 2);
    }
    return JSON.stringify(this.configs, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(configJson, agentId = null) {
    try {
      const config = JSON.parse(configJson);
      
      if (agentId) {
        // 导入单个智能体配置
        if (!this.validateAgentConfig(config)) {
          throw new Error('配置格式不正确');
        }
        this.configs[agentId] = config;
      } else {
        // 导入所有配置
        if (!this.validateAllConfigs(config)) {
          throw new Error('配置格式不正确');
        }
        this.configs = config;
      }
      
      return this.saveConfigs();
    } catch (error) {
      console.error('导入配置失败:', error);
      return false;
    }
  }

  /**
   * 验证智能体配置格式
   */
  validateAgentConfig(config) {
    return config &&
           config.id &&
           config.name &&
           config.prompt &&
           config.prompt.system &&
           config.prompt.user;
  }

  /**
   * 验证所有配置格式
   */
  validateAllConfigs(configs) {
    return Object.values(configs).every(config => this.validateAgentConfig(config));
  }

  /**
   * 深度合并对象
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }

  /**
   * 获取所有智能体列表
   */
  getAllAgents() {
    return Object.values(this.configs).map(config => ({
      id: config.id,
      name: config.name,
      icon: config.icon,
      description: config.description,
      enabled: config.enabled,
      order: config.order
    })).sort((a, b) => a.order - b.order);
  }

  /**
   * 启用/禁用智能体
   */
  toggleAgent(agentId) {
    if (!this.configs[agentId]) {
      return false;
    }

    this.configs[agentId].enabled = !this.configs[agentId].enabled;
    
    return this.saveConfigs();
  }

  /**
   * 获取智能体参数
   */
  getAgentParameters(agentId) {
    const config = this.getAgentConfig(agentId);
    return config ? config.parameters : null;
  }

  /**
   * 更新智能体参数
   */
  updateAgentParameters(agentId, parameters) {
    if (!this.configs[agentId]) {
      return false;
    }

    this.configs[agentId].parameters = {
      ...this.configs[agentId].parameters,
      ...parameters
    };
    
    return this.saveConfigs();
  }
}

module.exports = AgentConfigManager;
