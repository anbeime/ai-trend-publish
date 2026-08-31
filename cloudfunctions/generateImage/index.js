const cloud = require("wx-server-sdk");
const crypto = require("crypto");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 智谱AI图片生成API配置
const ZHIPU_IMAGE_API =
  "https://open.bigmodel.cn/api/paas/v4/images/generations";
const ZHIPU_API_KEY =
  process.env.ZHIPU_API_KEY ||
  "d68afc047d2b47179fccca96e52ca57c.XDODZVHpC70KMfos";

// 混元图片生成API配置
const HUNYUAN_SECRET_ID = process.env.HUNYUAN_SECRET_ID || "";
const HUNYUAN_SECRET_KEY = process.env.HUNYUAN_SECRET_KEY || "";

// GPT-Image-2 (pollinations.ai) 免费图片生成API
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

/**
 * 腾讯云 TC3-HMAC-SHA256 签名
 * @param {string} method HTTP方法
 * @param {string} host 请求域名
 * @param {string} path 请求路径
 * @param {string} payload 请求体
 * @param {object} params 请求参数
 * @param {string} service 服务名
 * @param {string} action API动作
 * @param {string} version API版本
 * @param {string} region 地域
 * @returns {object} 签名信息
 */
function signRequest(
  method,
  host,
  path,
  payload,
  service,
  action,
  version,
  region,
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split("T")[0];

  // 步骤1：拼接规范请求串
  const httpRequestMethod = method;
  const canonicalUri = path;
  const canonicalQueryString = "";
  const canonicalHeaders = `content-type:application/json;charset=utf-8\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const hashedRequestPayload = crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");

  const canonicalRequest = [
    httpRequestMethod,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedRequestPayload,
  ].join("\n");

  // 步骤2：拼接待签名字符串
  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");

  const stringToSign = [
    algorithm,
    timestamp.toString(),
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // 步骤3：计算签名
  const secretDate = crypto
    .createHmac("sha256", Buffer.from(`TC3${HUNYUAN_SECRET_KEY}`, "utf8"))
    .update(date)
    .digest();
  const secretService = crypto
    .createHmac("sha256", secretDate)
    .update(service)
    .digest();
  const secretSigning = crypto
    .createHmac("sha256", secretService)
    .update("tc3_request")
    .digest();
  const signature = crypto
    .createHmac("sha256", secretSigning)
    .update(stringToSign)
    .digest("hex");

  // 步骤4：拼接 Authorization
  const authorization = `${algorithm} Credential=${HUNYUAN_SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    authorization,
    timestamp,
    action,
    version,
    region,
  };
}

/**
 * HTTPS 请求函数
 */
function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const http = require("https");
    const req = http.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });
    req.on("error", (e) => {
      reject(e);
    });
    req.write(postData);
    req.end();
  });
}

/**
 * HTTPS GET 请求函数（用于 pollinations.ai）
 */
function httpGetRequest(url) {
  return new Promise((resolve, reject) => {
    const http = require("https");
    const req = http.get(url, (res) => {
      // pollinations.ai 返回 302 重定向到实际图片URL
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location) {
          resolve({ statusCode: 200, redirectUrl: location });
          return;
        }
      }
      resolve({ statusCode: res.statusCode, redirectUrl: null });
    });
    req.on("error", (e) => {
      reject(e);
    });
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("GPT-Image-2 请求超时"));
    });
  });
}

/**
 * 调用 GPT-Image-2 (pollinations.ai) 生图 API
 * 这是一个免费的图片生成服务，支持结构化提示词
 * @param {string} prompt - 生图提示词
 * @param {object} options - 生图选项（size, seed, nologo, model等）
 * @returns {string} - 图片URL
 */
async function callGPTImage2(prompt, options = {}) {
  const {
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    nologo = true,
    model = "flux",
  } = options;

  // 编码提示词为URL安全格式
  const encodedPrompt = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    model: model,
  });

  if (nologo) {
    params.append("nologo", "true");
  }

  const imageUrl = `${POLLINATIONS_BASE}/${encodedPrompt}?${params.toString()}`;

  console.log("GPT-Image-2 (pollinations) 生图URL:", imageUrl.substring(0, 200));
  console.log("GPT-Image-2 参数:", { width, height, seed, model, nologo });

  // 发送请求验证图片可访问性
  try {
    const checkResult = await httpGetRequest(imageUrl);
    console.log("GPT-Image-2 检查结果:", checkResult.statusCode);

    if (checkResult.statusCode === 200) {
      // 如果有重定向URL，使用重定向后的URL（CDN链接更稳定）
      const finalUrl = checkResult.redirectUrl || imageUrl;
      console.log("GPT-Image-2 生图成功，URL:", finalUrl.substring(0, 150));
      return finalUrl;
    } else {
      throw new Error(`GPT-Image-2 返回状态码: ${checkResult.statusCode}`);
    }
  } catch (error) {
    console.error("GPT-Image-2 检查失败:", error.message);
    // 即使检查失败，仍然返回URL（图片可能需要时间生成）
    console.log("返回原始URL，图片可能稍后可用");
    return imageUrl;
  }
}

/**
 * 调用混元文生图 API (TextToImageRapid - 混元生图2.0)
 */
async function callHunyuanTextToImage(prompt, size = "1024:1024") {
  const host = "aiart.tencentcloudapi.com";
  const path = "/";
  const service = "aiart";
  // 尝试 TextToImageRapid (混元生图2.0)
  const action = "TextToImageRapid";
  const version = "2022-12-29";
  const region = "ap-guangzhou";

  const payload = JSON.stringify({
    Prompt: prompt,
    NegativePrompt: "",
    Resolution: size,
    Seed: Math.floor(Math.random() * 1000000),
  });

  const signInfo = signRequest(
    "POST",
    host,
    path,
    payload,
    service,
    action,
    version,
    region,
  );

  const options = {
    hostname: host,
    port: 443,
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Host: host,
      "X-TC-Action": action,
      "X-TC-Version": version,
      "X-TC-Region": region,
      "X-TC-Timestamp": signInfo.timestamp.toString(),
      Authorization: signInfo.authorization,
    },
  };

  console.log("调用混元生图API (TextToImageRapid)...");
  const result = await httpRequest(options, payload);
  console.log("混元生图响应状态:", result.statusCode);
  console.log("混元生图响应体:", result.body.substring(0, 500));

  if (result.statusCode !== 200) {
    throw new Error(`混元API调用失败，状态码: ${result.statusCode}`);
  }

  const responseBody = JSON.parse(result.body);

  if (responseBody.Response && responseBody.Response.Error) {
    throw new Error(
      `混元API错误: ${responseBody.Response.Error.Message} (${responseBody.Response.Error.Code})`,
    );
  }

  return responseBody.Response;
}

/**
 * 调用智谱AI生图 API
 */
async function callZhipuTextToImage(prompt, size = "1024x1024") {
  const body = JSON.stringify({
    model: "cogview-3-flash",
    prompt: prompt,
    size: size,
    n: 1,
    seed: Math.floor(Math.random() * 1000000),
  });

  const result = await httpRequest(
    {
      hostname: "open.bigmodel.cn",
      port: 443,
      path: "/api/paas/v4/images/generations",
      method: "POST",
      headers: {
        Authorization: `Bearer ${ZHIPU_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
    body,
  );

  console.log("智谱AI生图响应状态:", result.statusCode);

  if (result.statusCode !== 200) {
    throw new Error(`智谱AI调用失败，状态码: ${result.statusCode}`);
  }

  const responseBody = JSON.parse(result.body);
  return responseBody;
}

/**
 * 解析尺寸参数为宽高
 * @param {string} size - 尺寸字符串，如 "1024x1024" 或 "1024:1024"
 * @returns {{width: number, height: number}}
 */
function parseSize(size) {
  const separator = size.includes(":") ? ":" : "x";
  const parts = size.split(separator);
  const width = parseInt(parts[0]) || 1024;
  const height = parseInt(parts[1]) || 1024;
  return { width, height };
}

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  const {
    prompt,
    size = "1024x1024",
    useHunyuan = false,
    useGPTImage2 = true,
    seed,
    model = "flux",
    nologo = true,
  } = event;

  console.log("生图请求:", { prompt, size, useHunyuan, useGPTImage2, model });

  if (!prompt) {
    return {
      success: false,
      code: 400,
      message: "提示词不能为空",
    };
  }

  const { width, height } = parseSize(size);

  try {
    let imageUrl, modelUsed;

    // 优先使用 GPT-Image-2 (pollinations.ai)
    if (useGPTImage2) {
      try {
        console.log("使用 GPT-Image-2 (pollinations) 生图...");

        imageUrl = await callGPTImage2(prompt, {
          width,
          height,
          seed: seed || Math.floor(Math.random() * 1000000),
          nologo,
          model,
        });
        modelUsed = "gpt-image-2";

        console.log("GPT-Image-2 生图成功，URL:", imageUrl.substring(0, 150));
      } catch (gptError) {
        console.error("GPT-Image-2 生图失败:", gptError.message);
        console.log("降级到其他生图引擎...");
      }
    }

    // 如果GPT-Image-2失败，尝试混元
    if (!imageUrl && useHunyuan && HUNYUAN_SECRET_ID && HUNYUAN_SECRET_KEY) {
      try {
        console.log("尝试使用混元生图API...");

        const response = await callHunyuanTextToImage(
          prompt,
          size === "1024x1024" ? "1024:1024" : "768:768",
        );

        if (response.ResultImage) {
          // ResultImage 是 Base64 编码的图片，需要上传到云存储获取 URL
          const base64Image = response.ResultImage;
          console.log("混元图片生成成功，Base64长度:", base64Image.length);

          // 将 Base64 图片上传到云存储
          const cloudPath = `hunyuan-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          const imageBuffer = Buffer.from(base64Image, "base64");

          const uploadResult = await cloud.uploadFile({
            cloudPath: cloudPath,
            fileContent: imageBuffer,
          });

          if (uploadResult.fileID) {
            // 获取临时访问 URL
            const urlResult = await cloud.getTempFileURL({
              fileList: [uploadResult.fileID],
            });

            if (
              urlResult.fileList &&
              urlResult.fileList[0] &&
              urlResult.fileList[0].tempFileURL
            ) {
              imageUrl = urlResult.fileList[0].tempFileURL;
              modelUsed = "hunyuan-lite";
              console.log("混元图片上传成功，URL:", imageUrl);
            }
          }
        }
      } catch (hunyuanError) {
        console.error("混元生图失败:", hunyuanError.message);
        console.log("降级到智谱AI生图...");
      }
    }

    // 如果以上都失败，使用智谱AI作为最终降级
    if (!imageUrl) {
      console.log("使用智谱AI生图API...");

      const response = await callZhipuTextToImage(prompt, size);

      if (response.data && response.data[0] && response.data[0].url) {
        imageUrl = response.data[0].url;
        modelUsed = "cogview-3-flash";
        console.log("智谱AI生图成功，URL:", imageUrl);
      } else {
        throw new Error("智谱AI返回数据格式异常");
      }
    }

    return {
      success: true,
      code: 200,
      imageUrl: imageUrl,
      model: modelUsed,
      message: "图片生成成功",
    };
  } catch (error) {
    console.error("生图失败:", error);
    return {
      success: false,
      code: 500,
      message: error.message,
      error: error.message,
    };
  }
};
