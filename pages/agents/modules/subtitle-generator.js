// subtitle-generator.js - 字幕生成模块
// 负责从脚本生成字幕，并合成到视频中

/**
 * SubtitleGenerator - 字幕生成器
 * 功能：
 * 1. 从脚本提取字幕文本
 * 2. 生成 SRT/WebVTT 格式字幕
 * 3. 计算字幕时间轴
 * 4. 与配音音频同步
 */
class SubtitleGenerator {
  constructor(pageContext) {
    this.page = pageContext;
  }

  /**
   * 从脚本生成字幕
   * @param {string} script - 脚本内容
   * @param {Object} options - 配置选项
   * @param {number} options.avgReadSpeed - 平均阅读速度（字/秒），默认 4
   * @param {number} options.minDuration - 最小显示时长（秒），默认 1.5
   * @param {number} options.maxDuration - 最大显示时长（秒），默认 5
   * @param {number} options.maxCharsPerLine - 每行最大字数，默认 20
   * @returns {Array<Object>} 字幕列表
   */
  generateSubtitles(script, options = {}) {
    const {
      avgReadSpeed = 4,
      minDuration = 1.5,
      maxDuration = 5,
      maxCharsPerLine = 20,
    } = options;

    console.log("[Subtitle] 开始生成字幕");

    // 提取需要显示的字幕内容
    const subtitleTexts = this.extractSubtitleText(script);
    
    if (subtitleTexts.length === 0) {
      console.log("[Subtitle] 未提取到字幕内容");
      return [];
    }

    // 生成带时间轴的字幕
    const subtitles = [];
    let currentTime = 0;

    for (const item of subtitleTexts) {
      // 计算显示时长
      const charCount = item.text.length;
      let duration = charCount / avgReadSpeed;
      duration = Math.max(minDuration, Math.min(maxDuration, duration));

      // 如果字幕过长，分割成多行
      const lines = this.splitTextToLines(item.text, maxCharsPerLine);

      subtitles.push({
        index: subtitles.length + 1,
        startTime: currentTime,
        endTime: currentTime + duration,
        duration: duration,
        text: item.text,
        lines: lines,
        type: item.type,
        scene: item.scene,
      });

      currentTime += duration + 0.2; // 0.2秒间隔
    }

    console.log(`[Subtitle] 生成了 ${subtitles.length} 条字幕`);
    return subtitles;
  }

  /**
   * 从脚本提取字幕文本
   * @param {string} script - 脚本内容
   * @returns {Array<Object>} 字幕文本列表
   */
  extractSubtitleText(script) {
    const texts = [];
    const lines = script.split("\n");
    let currentScene = null;
    let sceneIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 检测场景标记
      if (trimmed.match(/^(场景|分镜|镜头|SCENE|SCENE\d*)[：:：]/i) ||
          trimmed.match(/^【.*】/) ||
          trimmed.match(/^\d+[\.、]/)) {
        sceneIndex++;
        currentScene = sceneIndex;
        continue;
      }

      // 提取旁白作为字幕
      const narrationMatch = trimmed.match(/^(旁白|画外音|VO|NARRATOR)[：:：]\s*(.+)$/i);
      if (narrationMatch) {
        texts.push({
          scene: currentScene,
          type: "narration",
          text: narrationMatch[2],
        });
        continue;
      }

      // 提取对话作为字幕
      const dialogueMatch = trimmed.match(/^(.+)[：:：]\s*(.+)$/);
      if (dialogueMatch && !trimmed.match(/^(时间|地点|人物|道具|背景|音乐)/)) {
        const character = dialogueMatch[1].trim();
        const dialogue = dialogueMatch[2].trim();
        
        if (character.length <= 10 && dialogue.length > 2) {
          texts.push({
            scene: currentScene,
            type: "dialogue",
            character: character,
            text: dialogue,
            displayText: `「${character}」${dialogue}`, // 带角色标识
          });
        }
      }

      // 提取纯文本描述（作为备选）
      if (trimmed.length > 10 && trimmed.length < 100 && 
          !trimmed.match(/^[【\[（\(]/) &&
          !trimmed.match(/^(动作|镜头|音乐|音效)/)) {
        // 可以作为场景描述字幕
      }
    }

    return texts;
  }

  /**
   * 将文本分割成多行
   * @param {string} text - 原文本
   * @param {number} maxChars - 每行最大字数
   * @returns {Array<string>} 分割后的行
   */
  splitTextToLines(text, maxChars = 20) {
    if (text.length <= maxChars) {
      return [text];
    }

    const lines = [];
    let current = "";

    // 按标点分割
    const parts = text.split(/(?<=[，。！？、；：,.!?;:])/);

    for (const part of parts) {
      if ((current + part).length > maxChars && current.length > 0) {
        lines.push(current.trim());
        current = part;
      } else {
        current += part;
      }
    }

    if (current.trim().length > 0) {
      lines.push(current.trim());
    }

    return lines;
  }

  /**
   * 根据配音时长调整字幕时间
   * @param {Array<Object>} subtitles - 字幕列表
   * @param {Array<Object>} audioSegments - 配音片段列表
   * @returns {Array<Object>} 调整后的字幕
   */
  syncWithAudio(subtitles, audioSegments) {
    if (!audioSegments || audioSegments.length === 0) {
      return subtitles;
    }

    const syncedSubtitles = [];
    let audioIndex = 0;
    let currentTime = 0;

    for (const subtitle of subtitles) {
      // 找到对应的音频片段
      let matchedAudio = null;
      for (let i = audioIndex; i < audioSegments.length; i++) {
        const audio = audioSegments[i];
        if (audio.scene === subtitle.scene || 
            (audio.text && subtitle.text && audio.text.includes(subtitle.text))) {
          matchedAudio = audio;
          audioIndex = i + 1;
          break;
        }
      }

      if (matchedAudio && matchedAudio.duration) {
        syncedSubtitles.push({
          ...subtitle,
          startTime: currentTime,
          endTime: currentTime + matchedAudio.duration,
          duration: matchedAudio.duration,
          audioUrl: matchedAudio.audioUrl,
        });
        currentTime += matchedAudio.duration + 0.1;
      } else {
        // 没有匹配的音频，使用计算的时间
        syncedSubtitles.push({
          ...subtitle,
          startTime: currentTime,
        });
        currentTime = subtitle.endTime;
      }
    }

    return syncedSubtitles;
  }

  /**
   * 生成 SRT 格式字幕
   * @param {Array<Object>} subtitles - 字幕列表
   * @returns {string} SRT 格式字幕文本
   */
  generateSRT(subtitles) {
    return subtitles.map((sub, index) => {
      const startTime = this.formatSRTTime(sub.startTime);
      const endTime = this.formatSRTTime(sub.endTime);
      const text = sub.lines ? sub.lines.join("\n") : sub.text;
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
    }).join("\n");
  }

  /**
   * 生成 WebVTT 格式字幕
   * @param {Array<Object>} subtitles - 字幕列表
   * @returns {string} WebVTT 格式字幕文本
   */
  generateWebVTT(subtitles) {
    const header = "WEBVTT\n\n";
    const body = subtitles.map((sub, index) => {
      const startTime = this.formatVTTTime(sub.startTime);
      const endTime = this.formatVTTTime(sub.endTime);
      const text = sub.lines ? sub.lines.join("\n") : sub.text;
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
    }).join("\n");

    return header + body;
  }

  /**
   * 格式化 SRT 时间
   * @param {number} seconds - 秒数
   * @returns {string} SRT 时间格式 (00:00:00,000)
   */
  formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  }

  /**
   * 格式化 WebVTT 时间
   * @param {number} seconds - 秒数
   * @returns {string} WebVTT 时间格式 (00:00:00.000)
   */
  formatVTTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  }

  /**
   * 生成字幕样式配置（用于视频合成）
   * @param {Object} options - 样式选项
   * @returns {Object} 字幕样式配置
   */
  generateSubtitleStyle(options = {}) {
    const {
      position = "bottom", // top, center, bottom
      fontSize = 24,
      fontFamily = "Microsoft YaHei",
      fontColor = "#FFFFFF",
      backgroundColor = "rgba(0, 0, 0, 0.7)",
      outlineColor = "#000000",
      outlineWidth = 2,
      animation = "fade", // fade, slide, typewriter
    } = options;

    return {
      position,
      fontSize,
      fontFamily,
      fontColor,
      backgroundColor,
      outlineColor,
      outlineWidth,
      animation,
    };
  }

  /**
   * 为视频生成完整的字幕数据
   * @param {string} script - 脚本内容
   * @param {Array<Object>} audioSegments - 配音片段（可选）
   * @param {Object} styleOptions - 样式选项
   * @returns {Object} 完整字幕数据
   */
  generateCompleteSubtitles(script, audioSegments = null, styleOptions = {}) {
    // 生成基础字幕
    let subtitles = this.generateSubtitles(script, styleOptions);

    // 如果有配音，同步时间
    if (audioSegments && audioSegments.length > 0) {
      subtitles = this.syncWithAudio(subtitles, audioSegments);
    }

    // 生成样式
    const style = this.generateSubtitleStyle(styleOptions);

    // 生成各种格式
    return {
      subtitles: subtitles,
      style: style,
      srt: this.generateSRT(subtitles),
      webvtt: this.generateWebVTT(subtitles),
      totalDuration: subtitles.length > 0 ? 
        subtitles[subtitles.length - 1].endTime : 0,
    };
  }
}

module.exports = SubtitleGenerator;
