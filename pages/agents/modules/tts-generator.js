// tts-generator.js - 阿里云 TTS 配音模块（使用 CosyVoice v3 + WebSocket）
const QWEN_CONFIG_KEY = "qwen_config";

// 内置默认 API Key（供免费试用）
const DEFAULT_API_KEY = "sk-1c6db0bc6d747339e8e6ea1ec88c84c";

// WebSocket API 地址
// 北京地域
const WS_API_URL_BEIJING = "wss://dashscope.aliyuncs.com/api-ws/v1/inference";
// 新加坡地域
const WS_API_URL_SINGAPORE =
  "wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference";

// 音色配置 - CosyVoice v3 支持的音色
const VOICE_OPTIONS = {
  // 通用音色
  longanyang: {
    name: "龙昂扬",
    description: "通用音色",
    gender: "neutral",
    languages: ["zh", "en"],
  },
  // 女声
  longxiaochun_v2: {
    name: "龙小春v2",
    description: "温柔女声",
    gender: "female",
    languages: ["zh"],
  },
  longwan_v2: {
    name: "龙婉v2",
    description: "知性女声",
    gender: "female",
    languages: ["zh"],
  },
  longyue_v2: {
    name: "龙悦v2",
    description: "活泼女声",
    gender: "female",
    languages: ["zh"],
  },
  longfei_v2: {
    name: "龙飞v2",
    description: "激昂女声",
    gender: "female",
    languages: ["zh"],
  },
  longjialing_v2: {
    name: "龙佳玲v2",
    description: "甜美女声",
    gender: "female",
    languages: ["zh"],
  },
  longyao_v2: {
    name: "龙瑶v2",
    description: "温柔女声",
    gender: "female",
    languages: ["zh"],
  },
  // 男声
  longjielidou_v2: {
    name: "龙杰力道v2",
    description: "沉稳男声",
    gender: "male",
    languages: ["zh"],
  },
  longshuo_v2: {
    name: "龙硕v2",
    description: "磁性男声",
    gender: "male",
    languages: ["zh"],
  },
  longteng_v2: {
    name: "龙腾v2",
    description: "活力男声",
    gender: "male",
    languages: ["zh"],
  },
  longgui_v2: {
    name: "龙桂v2",
    description: "稳重男声",
    gender: "male",
    languages: ["zh"],
  },
  longzhu_v2: {
    name: "龙珠v2",
    description: "少年音",
    gender: "male",
    languages: ["zh"],
  },
  // 特色音色
  longlaotie_v2: {
    name: "龙老铁v2",
    description: "东北口音男声",
    gender: "male",
    languages: ["zh"],
  },
  longshu_v2: {
    name: "龙叔v2",
    description: "中年男声",
    gender: "male",
    languages: ["zh"],
  },
  // 多语言
  longxiaoye_v2: {
    name: "龙小野v2",
    description: "日语女声",
    gender: "female",
    languages: ["ja"],
  },
  longxiaoxia_v2: {
    name: "龙小夏v2",
    description: "粤语女声",
    gender: "female",
    languages: ["yue"],
  },
  longharry_v2: {
    name: "龙哈利v2",
    description: "英文男声",
    gender: "male",
    languages: ["en"],
  },
  longmina_v2: {
    name: "龙米娜v2",
    description: "英文女声",
    gender: "female",
    languages: ["en"],
  },
};

// 默认配置
const DEFAULT_VOICE = "longanyang";
const DEFAULT_MODEL = "cosyvoice-v3-flash";

/**
 * 获取 DashScope API Key
 */
function getDashScopeApiKey() {
  const qwenConfig = wx.getStorageSync(QWEN_CONFIG_KEY);
  // 优先使用用户配置的API Key，否则使用内置默认Key
  return qwenConfig?.apiKey || DEFAULT_API_KEY;
}

class TTSGenerator {
  constructor(pageContext) {
    this.page = pageContext;
    this.wsTask = null;
  }

  /**
   * 获取可用的音色列表
   * @returns {Object} 音色配置
   */
  getVoiceOptions() {
    return VOICE_OPTIONS;
  }

  /**
   * 生成语音 - WebSocket 方式（推荐）
   * @param {string} text - 要转换的文本
   * @param {Object} options - 配置选项
   * @param {string} options.voice - 音色ID
   * @param {string} options.model - 模型名称 (cosyvoice-v3-flash, cosyvoice-v3-plus)
   * @param {string} options.region - 地域 (beijing, singapore)
   * @returns {Promise<Object>} 生成的音频信息
   */
  generateSpeech(text, options = {}) {
    const {
      voice = DEFAULT_VOICE,
      model = DEFAULT_MODEL,
      region = "beijing",
    } = options;

    console.log("[TTS] 开始生成语音:", {
      text: text.substring(0, 50) + "...",
      voice,
      model,
      region,
    });

    // 文本长度检查
    if (!text || text.trim().length === 0) {
      return Promise.reject(new Error("文本内容不能为空"));
    }

    const apiKey = getDashScopeApiKey();
    if (!apiKey) {
      return Promise.reject(
        new Error("未配置 DashScope API Key，请先在设置中配置"),
      );
    }

    // 选择 API 地址
    const wsUrl =
      region === "singapore" ? WS_API_URL_SINGAPORE : WS_API_URL_BEIJING;

    // 文本过长时分段处理
    if (text.length > 1000) {
      console.log("[TTS] 文本过长，自动分段处理");
      return this.generateLongSpeech(text, options);
    }

    return this._generateViaWebSocket(text, voice, model, apiKey, wsUrl);
  }

  /**
   * 通过 WebSocket 生成语音
   * @private
   */
  _generateViaWebSocket(text, voice, model, apiKey, wsUrl) {
    return new Promise((resolve, reject) => {
      // 微信小程序使用 wx.connectSocket
      const socketTask = wx.connectSocket({
        url: wsUrl,
        header: {
          Authorization: `Bearer ${apiKey}`,
        },
        protocols: ["websocket"],
      });

      let audioChunks = [];
      let requestId = null;
      let firstPackageTime = null;
      let isCompleted = false;

      // 连接打开
      socketTask.onOpen(() => {
        console.log("[TTS] WebSocket 连接已建立");
        const startTime = Date.now();

        // 发送合成请求
        const request = {
          header: {
            action: "run-task",
            streaming: "duplex",
          },
          payload: {
            task_group: "audio",
            task: "tts",
            function: "SpeechSynthesizer",
            model: model,
            parameters: {
              voice: voice,
              text_type: "PlainText",
            },
            input: {
              text: text,
            },
          },
        };

        socketTask.send({
          data: JSON.stringify(request),
          success: () => {
            console.log("[TTS] 请求已发送");
            firstPackageTime = startTime;
          },
          fail: (err) => {
            console.error("[TTS] 发送请求失败:", err);
            socketTask.close({});
            reject(new Error("发送TTS请求失败"));
          },
        });
      });

      // 接收消息
      socketTask.onMessage((res) => {
        try {
          // 检查是否是二进制数据（音频）
          if (typeof res.data !== "string") {
            // 二进制音频数据
            audioChunks.push(res.data);
            return;
          }

          // JSON 文本消息
          const message = JSON.parse(res.data);
          console.log("[TTS] 收到消息:", message.header?.event);

          if (message.header?.event === "result-generated") {
            // 音频数据（base64格式）
            if (message.payload?.audio) {
              const audioData = wx.base64ToArrayBuffer(message.payload.audio);
              audioChunks.push(audioData);
            }
            if (message.payload?.request_id) {
              requestId = message.payload.request_id;
            }
          } else if (message.header?.event === "task-finished") {
            // 任务完成
            isCompleted = true;
            socketTask.close({});

            // 合并音频数据
            const totalLength = audioChunks.reduce(
              (sum, chunk) => sum + chunk.byteLength,
              0,
            );
            const combinedBuffer = new ArrayBuffer(totalLength);
            const view = new Uint8Array(combinedBuffer);
            let offset = 0;
            for (const chunk of audioChunks) {
              view.set(new Uint8Array(chunk), offset);
              offset += chunk.byteLength;
            }

            const delay = firstPackageTime ? Date.now() - firstPackageTime : 0;
            console.log(
              `[TTS] 合成完成, 首包延迟: ${delay}ms, 音频大小: ${totalLength}字节`,
            );

            // 保存为临时文件
            const fs = wx.getFileSystemManager();
            const tempFilePath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}.mp3`;
            fs.writeFileSync(tempFilePath, combinedBuffer);

            resolve({
              success: true,
              audioUrl: tempFilePath,
              audioBuffer: combinedBuffer,
              duration: 0, // 需要播放后才能获取
              requestId: requestId,
              firstPackageDelay: delay,
              format: "mp3",
              voice: voice,
              model: model,
            });
          } else if (message.header?.event === "task-failed") {
            // 任务失败
            isCompleted = true;
            socketTask.close({});
            const errorMsg =
              message.payload?.message ||
              message.header?.error_message ||
              "TTS合成失败";
            reject(new Error(errorMsg));
          }
        } catch (e) {
          console.error("[TTS] 解析消息失败:", e);
        }
      });

      // 错误处理
      socketTask.onError((err) => {
        console.error("[TTS] WebSocket 错误:", err);
        if (!isCompleted) {
          reject(new Error(`WebSocket错误: ${err.errMsg}`));
        }
      });

      // 连接关闭
      socketTask.onClose((res) => {
        console.log("[TTS] WebSocket 连接关闭:", res.code, res.reason);
        if (!isCompleted && res.code !== 1000) {
          reject(new Error(`连接异常关闭: ${res.code} ${res.reason}`));
        }
      });

      this.wsTask = socketTask;
    });
  }

  /**
   * 生成长文本语音（分段处理）
   * @param {string} text - 长文本
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 合并后的音频信息
   */
  async generateLongSpeech(text, options = {}) {
    const segments = this.splitText(text, 500);
    const audioSegments = [];

    for (let i = 0; i < segments.length; i++) {
      console.log(`[TTS] 处理第 ${i + 1}/${segments.length} 段`);

      try {
        const result = await this.generateSpeech(segments[i], options);
        audioSegments.push({
          index: i + 1,
          text: segments[i],
          audioUrl: result.audioUrl,
          audioBuffer: result.audioBuffer,
        });

        // 避免请求过快
        if (i < segments.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`[TTS] 第 ${i + 1} 段生成失败:`, error);
        audioSegments.push({
          index: i + 1,
          text: segments[i],
          error: error.message,
        });
      }
    }

    // 合并所有音频
    const successSegments = audioSegments.filter((s) => s.audioBuffer);
    if (successSegments.length > 0) {
      const totalLength = successSegments.reduce(
        (sum, s) => sum + s.audioBuffer.byteLength,
        0,
      );
      const combinedBuffer = new ArrayBuffer(totalLength);
      const view = new Uint8Array(combinedBuffer);
      let offset = 0;
      for (const segment of successSegments) {
        view.set(new Uint8Array(segment.audioBuffer), offset);
        offset += segment.audioBuffer.byteLength;
      }

      const fs = wx.getFileSystemManager();
      const tempFilePath = `${wx.env.USER_DATA_PATH}/tts_long_${Date.now()}.mp3`;
      fs.writeFileSync(tempFilePath, combinedBuffer);

      return {
        success: true,
        audioUrl: tempFilePath,
        audioBuffer: combinedBuffer,
        segments: audioSegments,
        note: "长文本已分段生成并合并",
      };
    }

    return {
      success: false,
      error: "所有段落生成失败",
      segments: audioSegments,
    };
  }

  /**
   * 分割文本
   * @param {string} text - 原始文本
   * @param {number} maxLength - 每段最大长度
   * @returns {Array<string>} 分割后的文本数组
   */
  splitText(text, maxLength = 500) {
    const segments = [];
    let current = "";

    // 按句子分割
    const sentences = text.split(/(?<=[。！？.!?])/);

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLength && current.length > 0) {
        segments.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }

    if (current.trim().length > 0) {
      segments.push(current.trim());
    }

    return segments;
  }

  /**
   * 从脚本中提取旁白文本
   * @param {string} script - 剧本/脚本内容
   * @returns {Array<Object>} 旁白片段列表
   */
  extractNarrationFromScript(script) {
    const narrations = [];
    const lines = script.split("\n");

    let currentScene = null;
    let sceneIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // 检测场景标记
      if (
        trimmed.match(/^(场景|分镜|镜头|SCENE|SCENE\d*)[：:：]/i) ||
        trimmed.match(/^【.*】/) ||
        trimmed.match(/^\d+[\.、]/)
      ) {
        sceneIndex++;
        currentScene = sceneIndex;
      }

      // 提取旁白
      const narrationMatch = trimmed.match(
        /^(旁白|画外音|VO|NARRATOR)[：:：]\s*(.+)$/i,
      );
      if (narrationMatch) {
        narrations.push({
          scene: currentScene,
          type: "narration",
          text: narrationMatch[2],
        });
        continue;
      }

      // 提取对话
      const dialogueMatch = trimmed.match(/^(.+)[：:：]\s*(.+)$/);
      if (dialogueMatch && !trimmed.match(/^(时间|地点|人物|道具)/)) {
        const character = dialogueMatch[1];
        const dialogue = dialogueMatch[2];

        if (character.length <= 10 && dialogue.length > 2) {
          narrations.push({
            scene: currentScene,
            type: "dialogue",
            character: character,
            text: dialogue,
          });
        }
      }
    }

    return narrations;
  }

  /**
   * 为整个脚本生成配音
   * @param {string} script - 脚本内容
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 配音结果
   */
  async generateScriptVoiceover(script, options = {}) {
    console.log("[TTS] 开始为脚本生成配音");

    const narrations = this.extractNarrationFromScript(script);

    if (narrations.length === 0) {
      console.log("[TTS] 未检测到旁白或对话内容");
      return {
        success: false,
        error: "未检测到旁白或对话内容",
      };
    }

    console.log(`[TTS] 检测到 ${narrations.length} 段旁白/对话`);

    const results = [];
    const voiceConfig = options.voiceConfig || {};

    for (const narration of narrations) {
      try {
        // 根据角色选择音色
        let voice = DEFAULT_VOICE;
        if (narration.type === "dialogue" && voiceConfig[narration.character]) {
          voice = voiceConfig[narration.character];
        } else if (narration.type === "narration" && voiceConfig.narrator) {
          voice = voiceConfig.narrator;
        }

        const result = await this.generateSpeech(narration.text, {
          ...options,
          voice: voice,
        });

        results.push({
          ...narration,
          audioUrl: result.audioUrl,
          audioBuffer: result.audioBuffer,
        });

        await this.delay(300);
      } catch (error) {
        console.error(`[TTS] 第 ${narration.scene} 段配音失败:`, error);
        results.push({
          ...narration,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      narrations: results,
    };
  }

  /**
   * 取消当前任务
   */
  cancel() {
    if (this.wsTask) {
      this.wsTask.close({});
      this.wsTask = null;
      console.log("[TTS] 任务已取消");
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒数
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = TTSGenerator;
