// 云函数入口文件 - API配置获取
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 从环境变量读取API配置
const GLM_API_KEY = process.env.GLM_API_KEY || "";
const HUNYUAN_SECRET_ID = process.env.HUNYUAN_SECRET_ID || "";
const HUNYUAN_SECRET_KEY = process.env.HUNYUAN_SECRET_KEY || "";
const QWEN_API_KEY = process.env.QWEN_API_KEY || "";

exports.main = async (event, context) => {
  const { action } = event;

  try {
    switch (action) {
      case "getApiKeys":
        // 返回API配置（不返回密钥本身，只返回是否配置）
        return {
          success: true,
          config: {
            glmConfigured: !!GLM_API_KEY,
            hunyuanConfigured: !!HUNYUAN_SECRET_ID && !!HUNYUAN_SECRET_KEY,
            qwenConfigured: !!QWEN_API_KEY,
          },
        };

      case "getGLMKey":
        // 返回GLM API Key（供前端直接调用API使用）
        if (!GLM_API_KEY) {
          return {
            success: false,
            error: "GLM_API_KEY未在云函数环境变量中配置",
          };
        }
        return {
          success: true,
          apiKey: GLM_API_KEY,
        };

      case "getQWENKey":
        // 返回通义万相API Key
        if (!QWEN_API_KEY) {
          return {
            success: false,
            error: "QWEN_API_KEY未在云函数环境变量中配置",
          };
        }
        return {
          success: true,
          apiKey: QWEN_API_KEY,
        };

      default:
        return {
          success: false,
          error: "不支持的操作",
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
