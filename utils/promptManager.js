/**
 * 智能体提示词管理器
 * 负责加载、获取、更新和保存提示词配置
 */

const { PROMPTS, DEFAULT_PROMPTS } = require('../config/promptConfig.js');

// 本地存储键名
const STORAGE_KEY_CUSTOM_PROMPTS = 'custom_prompts';

class PromptManager {
  constructor() {
    this.prompts = { ...PROMPTS };
    this.isDirty = false;
  }

  /**
   * 获取指定智能体的提示词
   * @param {string} agentType - 智能体类型
   * @returns {string} 提示词
   */
  getPrompt(agentType) {
    return this.prompts[agentType] || "你是一个AI助手，帮助用户创作短视频。请根据用户需求提供专业建议";
  }

  /**
   * 获取所有提示词
   * @returns {Object} 所有提示词
   */
  getAllPrompts() {
    return { ...this.prompts };
  }

  /**
   * 更新指定智能体的提示词
   * @param {string} agentType - 智能体类型
   * @param {string} prompt - 新的提示词
   * @returns {boolean} 是否更新成功
   */
  updatePrompt(agentType, prompt) {
    if (!this.prompts.hasOwnProperty(agentType)) {
      console.warn(`智能体类型 ${agentType} 不存在`);
      return false;
    }

    this.prompts[agentType] = prompt;
    this.isDirty = true;
    return true;
  }

  /**
   * 批量更新提示词
   * @param {Object} promptsObj - 提示词对象
   * @returns {boolean} 是否更新成功
   */
  batchUpdatePrompts(promptsObj) {
    try {
      for (const agentType in promptsObj) {
        if (this.prompts.hasOwnProperty(agentType)) {
          this.prompts[agentType] = promptsObj[agentType];
        }
      }
      this.isDirty = true;
      return true;
    } catch (error) {
      console.error('批量更新提示词失败:', error);
      return false;
    }
  }

  /**
   * 重置指定智能体的提示词为默认值
   * @param {string} agentType - 智能体类型
   * @returns {boolean} 是否重置成功
   */
  resetPrompt(agentType) {
    if (!DEFAULT_PROMPTS.hasOwnProperty(agentType)) {
      console.warn(`智能体类型 ${agentType} 不存在`);
      return false;
    }

    this.prompts[agentType] = DEFAULT_PROMPTS[agentType];
    this.isDirty = true;
    return true;
  }

  /**
   * 重置所有提示词为默认值
   * @returns {boolean} 是否重置成功
   */
  resetAllPrompts() {
    this.prompts = { ...DEFAULT_PROMPTS };
    this.isDirty = true;
    return true;
  }

  /**
   * 应用风格到提示词
   * @param {string} basePrompt - 基础提示词
   * @param {Object} style - 风格配置
   * @returns {Object} 包含prompt和negativePrompt的对象
   */
  applyStyleToPrompt(basePrompt, style) {
    if (!style) {
      return {
        prompt: basePrompt,
        negativePrompt: "",
      };
    }

    // 替换风格占位符
    let prompt = basePrompt;
    
    // 替换风格相关占位符
    const replacements = {
      '{{STYLE_NAME}}': style.name || '日系动漫',
      '{{STYLE_BASE_PROMPT}}': style.basePrompt || '',
      '{{STYLE_EXTENDED_KEYWORDS}}': style.extendedKeywords || '',
      '{{STYLE_CHARACTER_FEATURES}}': style.characterFeatures || '',
      '{{STYLE_FORBIDDEN}}': style.forbidden || '',
      '{{STYLE_KEYWORDS}}': style.extendedKeywords || ''
    };

    for (const key in replacements) {
      prompt = prompt.replace(new RegExp(key, 'g'), replacements[key]);
    }

    // 组合风格提示
    const stylePrompt = `${style.basePrompt}, ${style.extendedKeywords}`;

    // 添加负向提示词（禁止风格）
    const negativePrompt = `(no: ${style.forbidden})`;

    return {
      prompt: `${stylePrompt}, ${prompt}`,
      negativePrompt: negativePrompt,
    };
  }

  /**
   * 保存自定义提示词到本地存储
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveToStorage() {
    if (!this.isDirty) {
      return true;
    }

    try {
      wx.setStorageSync(STORAGE_KEY_CUSTOM_PROMPTS, JSON.stringify(this.prompts));
      this.isDirty = false;
      console.log('提示词已保存到本地存储');
      return true;
    } catch (error) {
      console.error('保存提示词到本地存储失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载自定义提示词
   * @returns {Promise<boolean>} 是否加载成功
   */
  async loadFromStorage() {
    try {
      const customPrompts = wx.getStorageSync(STORAGE_KEY_CUSTOM_PROMPTS);
      if (customPrompts) {
        this.prompts = { ...PROMPTS, ...JSON.parse(customPrompts) };
        console.log('已从本地存储加载自定义提示词');
        return true;
      }
      return false;
    } catch (error) {
      console.error('从本地存储加载提示词失败:', error);
      return false;
    }
  }

  /**
   * 导出提示词为JSON字符串
   * @returns {string} JSON字符串
   */
  exportPrompts() {
    return JSON.stringify(this.prompts, null, 2);
  }

  /**
   * 从JSON字符串导入提示词
   * @param {string} jsonString - JSON字符串
   * @returns {boolean} 是否导入成功
   */
  importPrompts(jsonString) {
    try {
      const importedPrompts = JSON.parse(jsonString);
      
      // 验证导入的提示词
      for (const key in importedPrompts) {
        if (typeof importedPrompts[key] !== 'string') {
          console.warn(`提示词 ${key} 格式不正确`);
          return false;
        }
      }

      // 合并提示词（保留原有的key）
      this.prompts = { ...this.prompts, ...importedPrompts };
      this.isDirty = true;
      console.log('提示词导入成功');
      return true;
    } catch (error) {
      console.error('导入提示词失败:', error);
      return false;
    }
  }

  /**
   * 获取智能体类型列表
   * @returns {Array<string>} 智能体类型数组
   */
  getAgentTypes() {
    return Object.keys(this.prompts);
  }
}

// 创建单例实例
const promptManager = new PromptManager();

module.exports = promptManager;
