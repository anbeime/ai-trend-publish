const cloud = require("wx-server-sdk");
const https = require("https");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 智谱AI图片生成API配置
const ZHIPU_IMAGE_API =
  "https://open.bigmodel.cn/api/paas/v4/images/generations";
const ZHIPU_API_KEY = "d68afc047d2b47179fccca96e52ca57c.XDODZVHpC70KMfos";

// 混元图片生成API配置（混元v3）
// 使用混元AI的文本转图片API
const HUNYUAN_IMAGE_API = "https://hunyuan.tencentcloudapi.com";
const HUNYUAN_SECRET_ID = process.env.HUNYUAN_SECRET_ID || "";
const HUNYUAN_SECRET_KEY = process.env.HUNYUAN_SECRET_KEY || "";

// 签名函数
function getAuthorization(
  method,
  host,
  path,
  query,
  body,
  secretId,
  secretKey,
) {
  const crypto = require("crypto");
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().substring(0, 10);

  const credentialScope = `tc3_request`;
  const algorithm = "TC3-HMAC-SHA256";

  // 构建规范请求串
  const httpRequestMethod = method;
  const canonicalUri = path;
  const canonicalQueryString = query;
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const hashedRequestPayload = crypto
    .createHash("sha256")
    .update(body || "")
    .digest("hex");
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

  // 构建待签名字符串
  const hashedCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");
  const credential = `${secretId}/${date}/${credentialScope}`;
  const stringToSign = `${algorithm}\n${timestamp}\n${date}\n${hashedCanonicalRequest}`;

  // 计算签名
  const key = crypto
    .createHmac("sha256", `TC3${secretKey}`)
    .update(date)
    .digest();
  const signingKey = crypto
    .createHmac("sha256", key)
    .update(credentialScope)
    .digest();
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return `${algorithm} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

// 简单的 HTTP 请求函数
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.uri);
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method,
      headers: options.headers,
    };

    const req = https.request(opts, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

exports.main = async (event, context) => {
  const { prompt, size = "1024x1024", seed = null, useHunyuan = false } = event;
  const { OPENID } = cloud.getWXContext();

  console.log("生图请求:", {
    prompt: prompt?.substring(0, 100),
    size,
    useHunyuan,
    OPENID,
  });

  if (!prompt || !prompt.trim()) {
    return {
      success: false,
      code: 400,
      message: "提示词不能为空",
    };
  }

  try {
    let imageUrl, model;

    if (useHunyuan) {
      // 检查混元配置
      if (!HUNYUAN_SECRET_ID || !HUNYUAN_SECRET_KEY) {
        throw new Error(
          "混元密钥未配置，请设置环境变量 HUNYUAN_SECRET_ID 和 HUNYUAN_SECRET_KEY",
        );
      }

      // 使用混元模型生成图片
      console.log("调用混元生图API...");

      const host = "hunyuan.tencentcloudapi.com";
      const path = "/";
      const query = "";
      const body = JSON.stringify({
        Action: "TextToImageAsync",
        Version: "2024-09-17",
        Region: "ap-guangzhou",
        Prompt: prompt,
        PromptNegative: "",
        Style: "101", // 默认风格
        Resolution: size === "1024x1024" ? "1024:1024" : "768:768",
        LogoAdd: 0,
        RspImgType: "url",
      });

      const authorization = getAuthorization(
        "POST",
        host,
        path,
        query,
        body,
        HUNYUAN_SECRET_ID,
        HUNYUAN_SECRET_KEY,
      );

      const result = await httpRequest({
        uri: `https://${host}${path}`,
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
          Host: host,
        },
        body: body,
      });

      console.log("混元生图响应状态:", result.statusCode);
      console.log(
        "混元生图响应body:",
        result.body ? result.body.substring(0, 500) : "N/A",
      );

      if (result.statusCode !== 200) {
        throw new Error(`混元API调用失败，状态码: ${result.statusCode}`);
      }

      // 解析响应
      let responseBody = result.body;
      if (typeof responseBody === "string") {
        try {
          responseBody = JSON.parse(responseBody);
        } catch (e) {
          throw new Error(
            `混元API返回数据解析失败: ${responseBody.substring(0, 200)}`,
          );
        }
      }

      if (!responseBody) {
        throw new Error("混元返回数据为空");
      }

      // 异步任务返回
      if (responseBody.Response && responseBody.Response.TaskId) {
        // 异步生成，需要轮询
        console.log("混元异步任务ID:", responseBody.Response.TaskId);
        throw new Error("混元异步生成暂不支持，请使用GLM");
      }

      // 同步返回
      if (responseBody.Response && responseBody.Response.ImageUrl) {
        imageUrl = responseBody.Response.ImageUrl;
        model = "hunyuan-v3";
      } else if (responseBody.Error) {
        throw new Error(
          `混元API错误: ${responseBody.Error.Message} (${responseBody.Error.Code})`,
        );
      } else {
        throw new Error("混元返回数据格式未知");
      }

      if (!imageUrl) {
        throw new Error("混元未返回图片URL");
      }
    } else {
      // 使用智谱AI生图API
      console.log("调用智谱AI生图API...");

      const body = JSON.stringify({
        model: "cogview-3-flash",
        prompt: prompt,
        size: size,
        n: 1,
        seed: seed || Math.floor(Math.random() * 1000000),
      });

      const result = await httpRequest({
        uri: ZHIPU_IMAGE_API,
        method: "POST",
        headers: {
          Authorization: `Bearer ${ZHIPU_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: body,
      });

      console.log("智谱AI生图响应状态:", result.statusCode);

      if (result.statusCode !== 200) {
        throw new Error(`智谱AI API调用失败，状态码: ${result.statusCode}`);
      }

      // 解析响应
      let responseBody = result.body;
      if (typeof responseBody === "string") {
        try {
          responseBody = JSON.parse(responseBody);
        } catch (e) {
          throw new Error(
            `智谱AI返回数据解析失败: ${responseBody.substring(0, 200)}`,
          );
        }
      }

      if (!responseBody || !responseBody.data || !responseBody.data.length) {
        throw new Error("智谱AI返回数据为空");
      }

      imageUrl = responseBody.data[0].url;
      model = "cogview-3-flash";
    }

    if (!imageUrl) {
      throw new Error("未获取到图片URL");
    }

    console.log("生图成功:", imageUrl.substring(0, 80));

    // 保存生图记录
    const db = cloud.database();
    await db.collection("dream_records").add({
      data: {
        _openid: OPENID,
        type: "image_generation",
        prompt: prompt.substring(0, 500),
        imageUrl: imageUrl,
        size: size,
        model: model,
        createTime: new Date(),
      },
    });

    return {
      success: true,
      code: 0,
      message: "生成成功",
      imageUrl: imageUrl,
      model: model,
    };
  } catch (error) {
    console.error("生图失败:", error.message, error.stack);

    return {
      success: false,
      code: 500,
      message: error.message || "图片生成失败",
      error: error.message,
    };
  }
};
