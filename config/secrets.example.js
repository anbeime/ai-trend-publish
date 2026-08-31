/**
 * 敏感配置示例文件
 * 
 * 使用方法：
 * 1. 复制此文件为 secrets.js
 * 2. 填入您的实际密钥
 * 3. secrets.js 已添加到 .gitignore，不会被提交到仓库
 */

module.exports = {
  // 腾讯混元 AI 配置
  // 获取方式：https://console.cloud.tencent.com/cam/capi
  hunyuan: {
    secretId: "your_tencent_secret_id_here",
    secretKey: "your_tencent_secret_key_here",
  },
  
  // 智谱 AI 配置
  // 获取方式：https://open.bigmodel.cn/
  zhipu: {
    apiKey: "your_zhipu_api_key_here",
  },
  
  // NVIDIA MiniMax API 配置
  // 获取方式：https://build.nvidia.com/
  minimax: {
    apiKey: "your_nvidia_api_key_here",
  },
  
  // 微信公众号配置（如需本地调试）
  wechat: {
    appId: "your_wechat_appid_here",
    appSecret: "your_wechat_appsecret_here",
  }
};
