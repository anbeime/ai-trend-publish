// 云函数入口文件
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 智谱GLM API配置
const GLM_API_KEY = "da8df5ba954341829f7afd05ca23a889.RrJoTsbaAkGYA6ZU"; // 在这里配置默认的API Key
const GLM_API_BASE = "https://open.bigmodel.cn/api/paas/v4";

const https = require("https");

/**
 * 调用智谱GLM API
 * @param {string} endpoint - API端点 (chat/completions 或 images/generations)
 * @param {object} data - 请求数据
 * @param {string} userApiKey - 用户自定义的API Key（可选）
 */
async function callGLMAPI(endpoint, data, userApiKey) {
  const apiKey = userApiKey || GLM_API_KEY;
  const url = new URL(`${GLM_API_BASE}/${endpoint}`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            success: true,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            success: false,
            error: "响应解析失败",
          });
        }
      });
    });

    req.on("error", (error) => {
      console.error("GLM API调用失败:", error);
      resolve({
        success: false,
        error: error.message || "调用失败",
      });
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, endpoint, data, apiKey } = event;

  console.log("GLM API云函数调用:", { action, endpoint });

  try {
    switch (action) {
      case "chat":
        // 聊天补全
        return await callGLMAPI("chat/completions", data, apiKey);

      case "image":
        // 图像生成
        return await callGLMAPI("images/generations", data, apiKey);

      case "custom":
        // 自定义端点
        return await callGLMAPI(endpoint, data, apiKey);

      default:
        return {
          success: false,
          error: "不支持的操作类型",
        };
    }
  } catch (error) {
    console.error("云函数执行失败:", error);
    return {
      success: false,
      error: error.message || "执行失败",
    };
  }
};
