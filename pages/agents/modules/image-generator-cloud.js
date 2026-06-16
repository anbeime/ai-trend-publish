// image-generator-cloud.js - 使用云开发AI+能力生成图片
const API_CONFIG_KEY = "ai_api_config";

class ImageGeneratorCloud {
  constructor(pageContext) {
    this.page = pageContext;
    this.initialized = false;
    this.model = null;
  }

  // 初始化云开发AI
  async init() {
    if (this.initialized) return true;

    try {
      // 检查基础库版本（使用最新API）
      let sdkVersion = '3.0.0';
      if (typeof wx.getWindowInfo === 'function') {
        const windowInfo = wx.getWindowInfo();
        sdkVersion = windowInfo.SDKVersion || sdkVersion;
      } else if (typeof wx.getSystemInfoSync === 'function') {
        const systemInfo = wx.getSystemInfoSync();
        sdkVersion = systemInfo.SDKVersion || sdkVersion;
      }
      
      const versionNum = parseFloat(sdkVersion);
      if (versionNum < 3.7) {
        console.warn(`当前基础库版本 ${sdkVersion} 不支持AI+能力，需要 >= 3.7.1`);
        return false;
      }

      // 检查云开发AI+能力是否可用
      if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
        console.warn('云开发AI+能力未启用，请确保已开通云开发AI+服务');
        return false;
      }

      // 检查是否已经初始化云开发
      if (!wx.cloud.__initialized) {
        const apiConfig = wx.getStorageSync(API_CONFIG_KEY) || {};
        const env = apiConfig.env || 'invideo-6gidgilyee392cc8';

        wx.cloud.init({ env });
        wx.cloud.__initialized = true;
        console.log('云开发初始化完成，环境ID:', env);
      }

      // 创建图片生成模型
      try {
        this.model = wx.cloud.extend.AI.createModel("hunyuan-image");
      } catch (modelError) {
        console.error('创建混元图片生成模型失败:', modelError);
        return false;
      }
      
      this.initialized = true;
      console.log('云开发AI+图片生成初始化成功');
      return true;
    } catch (error) {
      console.error('云开发AI+初始化失败:', error);
      return false;
    }
  }

  // 使用云开发生成图片（新方法）
  async generateImageCloud(prompt, options = {}) {
    // 检查混元配置是否启用
    const hunyuanConfig = this.page.data.hunyuanConfig || { enabled: false };
    if (!hunyuanConfig.enabled) {
      console.log('混元API未启用，无法使用云开发AI+图片生成');
      throw new Error('CLOUD_AI_NOT_AVAILABLE');
    }

    const {
      size = '1024x1024',
      revise = true,
      footnote = '',
      seed = null
    } = options;

    console.log('调用云开发AI+生成图片:', {
      prompt: prompt.substring(0, 100),
      size,
      revise,
      hasFootnote: !!footnote
    });

    try {
      // 检查模型是否已初始化
      if (!this.initialized || !this.model) {
        const initSuccess = await this.init();
        if (!initSuccess) {
          throw new Error('云开发AI+初始化失败');
        }
      }

      // 构建请求数据
      const requestData = {
        prompt,
        model: "hunyuan-image",
        size,
        revise
      };

      // 添加可选参数
      if (footnote) requestData.footnote = footnote;
      if (seed && typeof seed === 'number') requestData.seed = seed;

      // 调用云函数生成图片
      const result = await wx.cloud.callFunction({
        name: 'generateImage',
        data: requestData
      });

      console.log('云开发图片生成结果:', result);

      // 检查结果
      if (result.result && result.result.success) {
        const { imageUrl, revised_prompt } = result.result;
        
        console.log('图片生成成功:');
        console.log('- 图片URL:', imageUrl);
        console.log('- 优化后的prompt:', revised_prompt);
        
        return {
          success: true,
          imageUrl,
          revisedPrompt: revised_prompt,
          originalPrompt: prompt
        };
      } else {
        const errorCode = result.result?.code || 'UNKNOWN_ERROR';
        const errorMessage = result.result?.message || '图片生成失败';
        
        console.error('图片生成失败:', errorCode, errorMessage);
        throw new Error(`图片生成失败: ${errorMessage} (code: ${errorCode})`);
      }
    } catch (error) {
      console.error('云开发图片生成错误:', error);
      
      // 判断是否是初始化失败，如果是，可以尝试降级到GLM
      if (error.message.includes('初始化失败') || error.message.includes('基础库版本')) {
        console.warn('云开发AI+不可用，尝试降级到GLM...');
        throw new Error('CLOUD_AI_NOT_AVAILABLE');
      }
      
      throw error;
    }
  }

  // 兼容层：统一的图片生成入口
  // 根据混元配置选择：启用则使用云开发AI+，否则使用GLM
  async generateImage(prompt, options = {}) {
    // 检查混元配置是否启用
    const hunyuanConfig = this.page.data.hunyuanConfig || { enabled: false };
    if (hunyuanConfig.enabled) {
      try {
        // 尝试使用云开发AI+（推荐）
        const cloudResult = await this.generateImageCloud(prompt, options);
        return cloudResult.imageUrl;
      } catch (error) {
        if (error.message === 'CLOUD_AI_NOT_AVAILABLE') {
          // 云开发AI+不可用，降级到GLM
          console.log('云开发AI+不可用，降级到GLM图片生成...');
          return await this.fallbackToGLM(prompt);
        } else {
          // 其他错误，直接抛出
          throw error;
        }
      }
    } else {
      // 混元未启用，直接使用GLM
      console.log('混元未启用，使用GLM图片生成...');
      return await this.fallbackToGLM(prompt);
    }
  }

  // 降级到GLM
  async fallbackToGLM(prompt) {
    // 检查是否有GLM的实现
    if (this.page.imageGenerator && this.page.imageGenerator.generateImageGLM) {
      return await this.page.imageGenerator.generateImageGLM(prompt);
    } else {
      throw new Error('GLM图片生成不可用');
    }
  }

  // 批量生成图片（使用云开发）
  async generateImagesBatch(prompts, options = {}) {
    console.log(`批量生成 ${prompts.length} 张图片`);
    
    const results = [];
    
    for (let i = 0; i < prompts.length; i++) {
      try {
        console.log(`生成第 ${i + 1}/${prompts.length} 张图片...`);
        
        const result = await this.generateImageCloud(prompts[i], options);
        results.push({
          index: i + 1,
          prompt: prompts[i],
          success: true,
          ...result
        });
        
        // 添加延迟，避免请求过快
        if (i < prompts.length - 1) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`第 ${i + 1} 张图片生成失败:`, error);
        results.push({
          index: i + 1,
          prompt: prompts[i],
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检查云开发AI+是否可用
  async checkAvailability() {
    try {
      // 获取SDK版本（使用最新API）
      let sdkVersion = '3.0.0';
      if (typeof wx.getWindowInfo === 'function') {
        const windowInfo = wx.getWindowInfo();
        sdkVersion = windowInfo.SDKVersion || sdkVersion;
      } else if (typeof wx.getSystemInfoSync === 'function') {
        const systemInfo = wx.getSystemInfoSync();
        sdkVersion = systemInfo.SDKVersion || sdkVersion;
      }
      
      const versionNum = parseFloat(sdkVersion);
      if (versionNum < 3.7) {
        return {
          available: false,
          reason: `基础库版本过低 (${sdkVersion} < 3.7.1)`
        };
      }

      // 检查云开发AI+能力
      if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
        return {
          available: false,
          reason: '云开发AI+能力未启用，请确保已开通云开发AI+服务'
        };
      }

      // 尝试创建模型以验证实际可用性
      try {
        const testModel = wx.cloud.extend.AI.createModel("hunyuan-image");
        // 如果成功，返回可用
        return {
          available: true,
          version: sdkVersion
        };
      } catch (modelError) {
        return {
          available: false,
          reason: `创建混元图片生成模型失败: ${modelError.message}`
        };
      }
    } catch (error) {
      return {
        available: false,
        reason: error.message
      };
    }
  }
}

module.exports = ImageGeneratorCloud;
