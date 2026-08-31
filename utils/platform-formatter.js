/**
 * 多平台内容排版优化工具
 * 支持：微信公众号、小红书、知乎、抖音、B站
 * 功能：HTML排版、Markdown转换、平台特定格式优化
 */

class PlatformFormatter {
  constructor() {
    // 平台配置
    this.platformConfig = {
      '微信公众号': {
        name: 'wechat',
        maxLength: 2000,
        features: ['html', 'markdown', 'highlight'],
        style: {
          lineHeight: 1.8,
          fontSize: '16px',
          color: '#333'
        }
      },
      '小红书': {
        name: 'xiaohongshu',
        maxLength: 1000,
        features: ['emoji', 'hashtag', 'short'],
        style: {
          lineHeight: 1.6,
          fontSize: '15px',
          color: '#333'
        }
      },
      '知乎': {
        name: 'zhihu',
        maxLength: 3000,
        features: ['markdown', 'quote', 'reference'],
        style: {
          lineHeight: 1.8,
          fontSize: '16px',
          color: '#1a1a1a'
        }
      },
      '抖音': {
        name: 'douyin',
        maxLength: 500,
        features: ['emoji', 'hook', 'short'],
        style: {
          lineHeight: 1.5,
          fontSize: '16px',
          color: '#333'
        }
      },
      'B站': {
        name: 'bilibili',
        maxLength: 2000,
        features: ['markdown', 'emoji', 'interactive'],
        style: {
          lineHeight: 1.8,
          fontSize: '15px',
          color: '#333'
        }
      }
    };

    // 颜色配置（用于高亮）
    this.highlightColors = {
      yellow: '#fff3cd',
      green: '#d4edda',
      red: '#f8d7da',
      blue: '#e8f4f8',
      purple: '#f3e5f5',
      orange: '#fff8e1'
    };

    // Emoji映射
    this.emojiMap = {
    tip: '[提示]',
    warning: '[警告]',
    success: '[成功]',
    fire: '[热门]',
      star: '⭐',
    heart: '[心]',
    rocket: '[火箭]',
    target: '[目标]',
    light: '[星星]',
    book: '[书]',
    link: '[链接]',
    idea: '[想法]',
    check: '[对勾]',
      arrow: '→',
      point: '•'
    };
  }

  /**
   * 解析并提取 body 内容（处理 JSON 格式，支持递归解析）
   * @param {string|object} body - 原始 body 内容
   * @param {number} depth - 递归深度
   * @returns {string} 解析后的纯文本内容
   */
  parseBody(body, depth = 0) {
    console.log(`[parseBody] 深度${depth}, 输入类型: ${typeof body}, 长度: ${typeof body === 'string' ? body.length : 'N/A'}`);
    
    if (depth > 15) {
      console.log('[parseBody] 达到最大递归深度，返回原始内容');
      return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    }
    
    let processedBody = body;
    
    // 如果 body 是对象，尝试提取文本
    if (typeof processedBody === 'object' && processedBody !== null) {
      console.log('[parseBody] body 是对象，keys:', Object.keys(processedBody));
      
      // 处理特定结构
      if (processedBody.social_media_post?.description) {
        console.log('[parseBody] 提取 social_media_post.description');
        return this.parseBody(processedBody.social_media_post.description, depth + 1);
      } 
      
      if (processedBody.video_script?.shots) {
        console.log('[parseBody] 转换 video_script.shots');
        const shotsText = processedBody.video_script.shots
          .map((shot, i) => `【分镜${i + 1}】${shot.description || ""}`)
          .join("\n\n");
        return this.parseBody(shotsText, depth + 1);
      }
      
      // 按优先级提取文本字段
      const textFields = ['content', 'description', 'text', 'body'];
      for (const field of textFields) {
        if (processedBody[field] !== undefined && processedBody[field] !== null) {
          console.log(`[parseBody] 找到字段 ${field}, 类型: ${typeof processedBody[field]}`);
          
          if (typeof processedBody[field] === 'string') {
            const str = processedBody[field].trim();
            // 检查是否还是 JSON 字符串，如果是则继续解析
            if ((str.startsWith('{') || str.startsWith('[')) && str.length > 10) {
              console.log(`[parseBody] 字段 ${field} 是JSON字符串，递归解析...`);
              const extracted = this.parseBody(str, depth + 1);
              // 继续检查提取结果，如果还是 JSON 则继续解析
              let finalExtracted = extracted.trim();
              while ((finalExtracted.startsWith('{') || finalExtracted.startsWith('[')) && finalExtracted.length > 10) {
                const nextExtracted = this.parseBody(finalExtracted, depth + 1);
                if (nextExtracted === finalExtracted) break; // 无法继续解析
                finalExtracted = nextExtracted.trim();
              }
              if (!finalExtracted.startsWith('{') && !finalExtracted.startsWith('[')) {
                return finalExtracted;
              }
              // 如果提取结果还是 JSON，继续尝试其他字段
              console.log(`[parseBody] 字段 ${field} 提取后仍是JSON，尝试其他字段`);
            } else {
              // 不是 JSON，直接返回
              console.log(`[parseBody] 从字段 ${field} 提取到纯文本，长度: ${str.length}`);
              return str;
            }
          } else if (typeof processedBody[field] === 'object') {
            console.log(`[parseBody] 字段 ${field} 是对象，递归解析...`);
            const extracted = this.parseBody(processedBody[field], depth + 1);
            // 继续检查提取结果
            let finalExtracted = extracted.trim();
            while ((finalExtracted.startsWith('{') || finalExtracted.startsWith('[')) && finalExtracted.length > 10) {
              const nextExtracted = this.parseBody(finalExtracted, depth + 1);
              if (nextExtracted === finalExtracted) break;
              finalExtracted = nextExtracted.trim();
            }
            if (!finalExtracted.startsWith('{') && !finalExtracted.startsWith('[')) {
              return finalExtracted;
            }
          }
        }
      }
      
      // 如果没有提取到有效内容，转为 JSON 字符串后继续尝试解析
      console.log('[parseBody] 未能从对象中提取有效文本，转为JSON字符串重试');
      processedBody = JSON.stringify(processedBody);
    }
    
    // 如果 body 是字符串，检查是否为 JSON
    if (typeof processedBody === 'string') {
      const trimmed = processedBody.trim();
      console.log(`[parseBody] 字符串长度: ${trimmed.length}, 开头: ${trimmed.substring(0, 30)}`);
      
      if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 10) {
        try {
          const parsed = JSON.parse(trimmed);
          console.log('[parseBody] 成功解析JSON，keys:', typeof parsed === 'object' ? Object.keys(parsed) : 'primitive');
          const extracted = this.parseBody(parsed, depth + 1);
          
          // 继续检查提取结果，如果还是 JSON 则继续解析
          let finalExtracted = extracted.trim();
          let safetyCounter = 0;
          while ((finalExtracted.startsWith('{') || finalExtracted.startsWith('[')) && finalExtracted.length > 10 && safetyCounter < 20) {
            console.log('[parseBody] 提取结果仍是JSON，继续解析...');
            safetyCounter++;
            try {
              const nextParsed = JSON.parse(finalExtracted);
              const nextExtracted = this.parseBody(nextParsed, depth + 1);
              if (nextExtracted === finalExtracted) {
                console.log('[parseBody] 无法继续解析');
                break;
              }
              finalExtracted = nextExtracted.trim();
            } catch (parseErr) {
              console.log('[parseBody] 无法继续解析JSON:', parseErr.message);
              break;
            }
          }
          
          if (!finalExtracted.startsWith('{') && !finalExtracted.startsWith('[')) {
            console.log('[parseBody] 最终提取成功，文本长度:', finalExtracted.length);
            return finalExtracted;
          }
          
          // 如果最终结果还是 JSON，尝试从中提取任何可用的文本内容
          console.log('[parseBody] JSON提取后仍是JSON格式，尝试最终提取...');
          try {
            const finalParsed = JSON.parse(finalExtracted);
            if (typeof finalParsed === 'object' && finalParsed !== null) {
              // 尝试提取任何文本字段
              const textFields = ['content', 'description', 'text', 'body', 'value', 'message'];
              for (const field of textFields) {
                if (finalParsed[field] && typeof finalParsed[field] === 'string' && !finalParsed[field].trim().startsWith('{')) {
                  console.log(`[parseBody] 从最终JSON的 ${field} 字段提取到文本`);
                  return finalParsed[field];
                }
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
          
          // 如果所有尝试都失败，返回提取的结果（即使是 JSON）
          console.log('[parseBody] 无法提取纯文本，返回当前结果');
          return finalExtracted;
        } catch (e) {
          console.log('[parseBody] JSON解析失败，保持原字符串:', e.message);
        }
      }
      
      // 最终检查：确保返回的不是 JSON 格式
      console.log('[parseBody] 最终返回，长度:', trimmed.length);
      return trimmed;
    }
    
    // 确保 body 是字符串
    const result = String(processedBody || '');
    console.log('[parseBody] 最终 body 类型:', typeof result, '长度:', result.length);
    return result;
  }

  /**
   * 主格式化入口
   * @param {Object} content - 内容对象 {title, content, tags, coverSuggestion, optimizationTips}
   * @param {String} platform - 目标平台名称
   * @param {Object} options - 可选配置
   * @returns {Object} 格式化后的内容
   */
  format(content, platform, options = {}) {
    const config = this.platformConfig[platform];
    if (!config) {
      throw new Error(`不支持的平台: ${platform}`);
    }

    const {
      title,
      content: body,
      tags = [],
      coverSuggestion = '',
      optimizationTips = []
    } = content;

    // 根据平台选择格式化方法
    switch (platform) {
      case '微信公众号':
        return this.formatForWeChat(title, body, tags, coverSuggestion, optimizationTips, options);
      case '小红书':
        return this.formatForXiaohongshu(title, body, tags, coverSuggestion, optimizationTips, options);
      case '知乎':
        return this.formatForZhihu(title, body, tags, coverSuggestion, optimizationTips, options);
      case '抖音':
        return this.formatForDouyin(title, body, tags, coverSuggestion, optimizationTips, options);
      case 'B站':
        return this.formatForBilibili(title, body, tags, coverSuggestion, optimizationTips, options);
      default:
        return this.formatDefault(title, body, tags, coverSuggestion, optimizationTips);
    }
  }

  /**
   * 微信公众号格式化（支持HTML排版）
   */
  formatForWeChat(title, body, tags, coverSuggestion, optimizationTips, options = {}) {
    const { useHtml = true, highlight = true } = options;
    
    // 解析 body（处理 JSON 格式）
    const processedBody = this.parseBody(body);
    
    // 标签字符串
    const tagStr = tags.map(t => `#${t}`).join(' ');
    
    // 优化建议
    const tips = optimizationTips.length > 0
      ? optimizationTips.map((t, i) => `${i + 1}. ${t}`).join('\n')
      : '';

    if (useHtml) {
      // 生成HTML格式（秀米模板兼容）
      const htmlContent = this.generateWeChatHTML(title, processedBody, tags, highlight);
      
      return {
        platform: '微信公众号',
        title,
        text: this.formatForWeChatText(title, processedBody, tags, optimizationTips),
        html: htmlContent,
        tags,
        coverSuggestion,
        optimizationTips,
        preview: htmlContent
      };
    }

    // 纯文本格式
    return {
      platform: '微信公众号',
      title,
      text: this.formatForWeChatText(title, processedBody, tags, optimizationTips),
      html: null,
      tags,
      coverSuggestion,
      optimizationTips
    };
  }

  /**
   * 生成微信公众号HTML（纯内联CSS，兼容微信/Obsidian）
   * @param {string} title - 标题
   * @param {string} body - 正文
   * @param {array} tags - 标签
   * @param {boolean} highlight - 是否高亮
   * @param {array} images - 图片数组
   * @param {boolean} fullDocument - 是否生成完整HTML文档（默认false，只生成body内容）
   */
  generateWeChatHTML(title, body, tags, highlight = true, images = [], fullDocument = false) {
    // 使用统一的 parseBody 方法处理正文内容
    const processedBody = this.parseBody(body);
    
    console.log('[generateWeChatHTML] 最终 body 类型:', typeof processedBody, '长度:', processedBody.length);
    
    // 将内容分段
    const paragraphs = processedBody.split('\n\n').filter(p => p.trim());
    
    // 识别标题层级并转换为HTML
    let htmlBody = '';
    let sectionCount = 0;
    let imageIndex = 0;
    
    // 不再添加固定的模板元素，只处理实际内容
    
    // 处理所有段落
    paragraphs.forEach((para, index) => {
      const trimmed = para.trim();
      
      // 先将 Markdown 转换为 HTML
      let processedPara = this.markdownToHtml(trimmed);
      
      // 识别一级标题（一、二、三等）
      if (/^[一二三四五六七八九十]+、/.test(trimmed)) {
        sectionCount++;
        htmlBody += `<h2 style="font-size: 22px; margin-top: 35px; margin-bottom: 18px; color: #2c3e50; border-bottom: 3px solid #667eea; padding-bottom: 10px; font-weight: bold;">${processedPara}</h2>`;
      }
      // 识别二级标题（1.1、2.1等）
      else if (/^\d+\.\d+/.test(trimmed)) {
        htmlBody += `<h3 style="font-size: 18px; margin-top: 25px; margin-bottom: 12px; color: #34495e; font-weight: 600;">${processedPara}</h3>`;
      }
      // 识别三级标题（核心要点、总结等）
      else if (/^(核心要点|总结|结论|建议)/.test(trimmed)) {
        htmlBody += `<h4 style="font-size: 16px; margin-top: 20px; margin-bottom: 10px; color: #57606f; font-weight: 600;">${processedPara}</h4>`;
      }
      // 普通段落
      else {
        // 高亮处理 - 使用内联样式（在 Markdown 转换之后）
        if (highlight) {
          processedPara = this.applyInlineHighlight(processedPara);
        }
        
        htmlBody += `<div style="line-height: 1.8; color: #333; margin-bottom: 16px; text-align: justify; font-size: 16px;">${processedPara}</div>`;
        
        // 每2-3段插入一张图片
        if (index % 3 === 0 && imageIndex < images.length) {
          const img = images[imageIndex];
          htmlBody += `<div style="margin: 25px 0; text-align: center;">
            <img src="${img.url}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" alt="${img.description || '配图'}"/>
            <p style="font-size: 13px; color: #888; margin-top: 10px; font-style: italic;">▲ ${img.description || '相关配图'}</p>
          </div>`;
          imageIndex++;
        }
      }
    });

    // 不再添加固定的网友热评和CTA模板

    // 标签HTML - 使用内联样式
    const tagsHtml = tags.length > 0
      ? tags.map(t => `<span style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 14px; border-radius: 20px; margin-right: 10px; margin-bottom: 10px; font-size: 14px; box-shadow: 0 2px 8px rgba(102,126,234,0.3);">#${t}</span>`).join('')
      : '';

    // 标题HTML
    const titleHtml = `<h1 style="text-align: center; font-size: 26px; margin-bottom: 30px; color: #2c3e50; font-weight: bold; line-height: 1.4;">${title}</h1>`;
    
    // 标签区域HTML
    const tagsSectionHtml = `<div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #eee;">
      <p style="font-size: 15px; color: #666; margin-bottom: 15px; font-weight: 600;">相关标签：</p>
      <div>${tagsHtml}</div>
    </div>`;

    // 如果需要完整HTML文档（用于预览或API发布）
    if (fullDocument) {
      return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #fff;">
    ${titleHtml}
    ${htmlBody}
    ${tagsSectionHtml}
</body>
</html>`;
    }

    // 只返回body内容（用于复制到公众号编辑器）
    // 微信公众号编辑器只需要body内的内容，不需要html/head/body标签
    return `${titleHtml}
${htmlBody}
${tagsSectionHtml}`;
  }
  
  /**
   * 将 Markdown 转换为 HTML
   * 支持：标题、粗体、斜体、代码、列表、引用、链接、图片
   */
  markdownToHtml(text) {
    if (!text || typeof text !== 'string') return text;
    
    let html = text;
    
    // 转义 HTML 特殊字符（先处理，防止 XSS）
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // 处理代码块 ```...```
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #f4f4f4; padding: 15px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 14px; line-height: 1.5; margin: 15px 0;"><code>$1</code></pre>');
    
    // 处理行内代码 `...`
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #e83e8c;">$1</code>');
    
    // 处理图片 ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div style="text-align: center; margin: 20px 0;"><img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"/><p style="font-size: 13px; color: #888; margin-top: 8px;">$1</p></div>');
    
    // 处理链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #667eea; text-decoration: none; border-bottom: 1px solid #667eea;">$1</a>');
    
    // 处理粗体 **...** 或 __...__
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: bold; color: #2d3436;">$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong style="font-weight: bold; color: #2d3436;">$1</strong>');
    
    // 处理斜体 *...* 或 _..._（注意：要先处理完粗体再处理斜体，避免冲突）
    html = html.replace(/\*([^*]+)\*/g, '<em style="font-style: italic; color: #636e72;">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em style="font-style: italic; color: #636e72;">$1</em>');
    
    // 处理删除线 ~~...~~
    html = html.replace(/~~([^~]+)~~/g, '<del style="text-decoration: line-through; color: #b2bec3;">$1</del>');
    
    // 处理引用 > ...
    html = html.replace(/^&gt;\s*(.+)$/gm, '<blockquote style="border-left: 4px solid #667eea; padding: 10px 15px; margin: 15px 0; background: #f8f9fa; color: #555; font-style: italic;">$1</blockquote>');
    
    // 处理无序列表 - ... 或 * ...
    html = html.replace(/(?:^|\n)([-*])\s+(.+)/g, function(match, bullet, content) {
      return '<li style="margin: 8px 0; padding-left: 5px; line-height: 1.6;">' + content + '</li>';
    });
    // 将连续的 li 包装成 ul
    html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>)+/g, '<ul style="margin: 15px 0; padding-left: 25px; list-style-type: disc;">$&</ul>');
    
    // 处理有序列表 1. ...
    html = html.replace(/(?:^|\n)(\d+)\.\s+(.+)/g, function(match, num, content) {
      return '<li style="margin: 8px 0; padding-left: 5px; line-height: 1.6;">' + content + '</li>';
    });
    html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>)+/g, function(match) {
      if (!match.includes('<ul')) {
        return '<ol style="margin: 15px 0; padding-left: 25px; list-style-type: decimal;">' + match + '</ol>';
      }
      return match;
    });
    
    // 处理水平线 --- 或 ***
    html = html.replace(/(?:^|\n)(---+|\*\*\*+)\s*(?:\n|$)/g, '<hr style="border: none; border-top: 2px solid #e0e0e0; margin: 25px 0;"/>');
    
    // 处理 Markdown 标题 # ... ###### ...
    html = html.replace(/^#{6}\s*(.+)$/gm, '<h6 style="font-size: 14px; margin: 15px 0 10px; color: #57606f; font-weight: 600;">$1</h6>');
    html = html.replace(/^#{5}\s*(.+)$/gm, '<h5 style="font-size: 15px; margin: 18px 0 12px; color: #57606f; font-weight: 600;">$1</h5>');
    html = html.replace(/^#{4}\s*(.+)$/gm, '<h4 style="font-size: 16px; margin: 20px 0 12px; color: #57606f; font-weight: 600;">$1</h4>');
    html = html.replace(/^#{3}\s*(.+)$/gm, '<h3 style="font-size: 18px; margin: 25px 0 15px; color: #34495e; font-weight: 600;">$1</h3>');
    html = html.replace(/^#{2}\s*(.+)$/gm, '<h2 style="font-size: 20px; margin: 30px 0 18px; color: #2c3e50; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; font-weight: bold;">$1</h2>');
    html = html.replace(/^#{1}\s*(.+)$/gm, '<h1 style="font-size: 24px; margin: 35px 0 20px; color: #2c3e50; font-weight: bold; line-height: 1.3;">$1</h1>');
    
    // 处理换行符（保留段落格式）
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  }

  /**
   * 应用内联高亮样式（纯内联CSS）
   */
  applyInlineHighlight(text) {
    // 需要高亮的关键词模式
    const patterns = [
      { regex: /(ChatGPT|Claude|GPT-4|AI|人工智能|热点|爆款|流量|算法)/g, color: '#ffeaa7' },
      { regex: /(重要|关键|核心|必须|揭秘|真相)/g, color: '#fab1a0' },
      { regex: /(建议|推荐|技巧|方法|攻略)/g, color: '#55efc4' },
      { regex: /(数据|统计|研究|报告|分析)/g, color: '#74b9ff' },
      { regex: /(注意|警告|避免|风险)/g, color: '#ff7675' },
      { regex: /(原理|概念|理论|本质)/g, color: '#a29bfe' }
    ];

    let highlighted = text;
    patterns.forEach(({ regex, color }) => {
      highlighted = highlighted.replace(regex, (match) => {
        return `<span style="background: linear-gradient(120deg, ${color} 0%, ${color} 100%); background-repeat: no-repeat; background-size: 100% 40%; background-position: 0 88%; padding: 0 4px; font-weight: bold; color: #2d3436;">${match}</span>`;
      });
    });

    return highlighted;
  }

  /**
   * 微信公众号纯文本格式
   */
  formatForWeChatText(title, body, tags, optimizationTips) {
    const tagStr = tags.map(t => `#${t}`).join(' ');
    const tips = optimizationTips.length > 0
      ? optimizationTips.map((t, i) => `${i + 1}. ${t}`).join('\n')
      : '';

    return `${title}

${body}

${tagStr ? `\n相关标签：${tagStr}` : ''}${tips ? `\n\n[发布建议]\n${tips}` : ''}`;
  }

  /**
   * 小红书格式化
   */
  formatForXiaohongshu(title, body, tags, coverSuggestion, optimizationTips, options = {}) {
    const { addEmoji = true, addStructure = true } = options;
    
    // 解析 body（处理 JSON 格式）
    const parsedBody = this.parseBody(body);
    
    // 处理标题
    const processedTitle = addEmoji ? `[热门] ${title}` : title;
    
    // 处理正文 - 添加emoji和结构化
    let processedBody = parsedBody;
    if (addStructure) {
      const paragraphs = parsedBody.split('\n\n').filter(p => p.trim());
      const emojis = ['[提示]', '[星星]', '[热门]', '[标记]', '[闪光]', '[亮点]', '[钻石]', '[目标]'];
      
      processedBody = paragraphs.map((p, index) => {
        const emoji = emojis[index % emojis.length];
        // 每段添加emoji和空行
        return `${addEmoji ? emoji + ' ' : ''}${p}\n`;
      }).join('\n');
    }

    // 标签处理 - 小红书风格
    const tagStr = tags.map(t => `#${t}`).join(' ');
    
    // 优化建议（最多3条）
    const tips = optimizationTips.length > 0
      ? optimizationTips.slice(0, 3).map(t => `• ${t}`).join('\n')
      : '';

    const text = `${processedTitle}

${processedBody}
${tagStr ? `\n${tagStr}` : ''}
${tips ? `\n\n[小贴士]\n${tips}` : ''}

喜欢就点赞收藏吧~`;

    // 生成小红书风格HTML预览
    const htmlContent = this.generateXiaohongshuHTML(processedTitle, processedBody, tags);

    return {
      platform: '小红书',
      title: processedTitle,
      text,
      html: htmlContent,
      tags,
      coverSuggestion,
      optimizationTips: optimizationTips.slice(0, 3)
    };
  }

  /**
   * 知乎格式化
   */
  formatForZhihu(title, body, tags, coverSuggestion, optimizationTips, options = {}) {
    // 知乎风格：Markdown格式，引用块，专业严谨
    
    // 解析 body（处理 JSON 格式）
    const parsedBody = this.parseBody(body);
    
    // 处理正文 - 添加引用和强调
    const paragraphs = parsedBody.split('\n\n').filter(p => p.trim());
    const processedBody = paragraphs.map(p => {
      // 识别总结/结论段落，添加引用格式
      if (p.includes('总结') || p.includes('结论') || p.includes('核心观点')) {
        return `\n> **${p}**\n`;
      }
      // 识别重要观点，添加粗体
      if (p.includes('关键') || p.includes('重要')) {
        return `**${p}**`;
      }
      return p;
    }).join('\n\n');

    // 标签处理
    const tagStr = tags.map(t => `#${t}`).join(' ');
    
    // 优化建议
    const tips = optimizationTips.length > 0
      ? optimizationTips.map((t, i) => `${i + 1}. ${t}`).join('\n')
      : '';

    const text = `### ${title}

---

${processedBody}

---

${tagStr ? `相关话题：${tagStr}` : ''}${tips ? `\n\n**回答建议：**\n${tips}` : ''}`;

    // 生成知乎风格HTML预览
    const htmlContent = this.generateZhihuHTML(title, processedBody, tags);

    return {
      platform: '知乎',
      title: `### ${title}`,
      text,
      html: htmlContent,
      tags,
      coverSuggestion,
      optimizationTips
    };
  }

  /**
   * 抖音格式化
   */
  formatForDouyin(title, body, tags, coverSuggestion, optimizationTips, options = {}) {
    // 抖音风格：口语化、短句、节奏感强、前3秒钩子
    
    // 解析 body（处理 JSON 格式）
    const parsedBody = this.parseBody(body);
    
    // 处理标题 - 添加悬念或情绪化
    const processedTitle = `[手机] ${title}`;
    
    // 处理正文 - 短句化，添加节奏感
    const sentences = parsedBody.split(/[。！？\n]/).filter(s => s.trim());
    const processedBody = sentences.map((s, i) => {
      // 每两句添加一个感叹号和换行，增强节奏感
      if (i % 2 === 0) {
        return `${s}，`;
      } else {
        return `${s}！\n`;
      }
    }).join('');

    // 标签
    const tagStr = tags.map(t => `#${t}`).join(' ');
    
    // 优化建议（最多2条，简洁）
    const tips = optimizationTips.length > 0
      ? optimizationTips.slice(0, 2).map(t => `• ${t}`).join('\n')
      : '';

    const text = `${processedTitle}

${processedBody}
${tagStr ? `${tagStr}\n\n` : ''}${tips ? `[拍摄建议]\n${tips}` : ''}

觉得有用记得点赞收藏~`;

    // 生成抖音风格HTML预览
    const htmlContent = this.generateDouyinHTML(processedTitle, processedBody, tags);

    return {
      platform: '抖音',
      title: processedTitle,
      text,
      html: htmlContent,
      tags,
      coverSuggestion,
      optimizationTips: optimizationTips.slice(0, 2)
    };
  }

  /**
   * B站格式化
   */
  formatForBilibili(title, body, tags, coverSuggestion, optimizationTips, options = {}) {
    // B站风格：活泼、互动性强、适合系列化
    
    // 解析 body（处理 JSON 格式）
    const parsedBody = this.parseBody(body);
    
    // 处理标题
    const processedTitle = `【${title}】`;
    
    // 处理正文 - 添加互动元素
    const paragraphs = parsedBody.split('\n\n').filter(p => p.trim());
    const processedBody = paragraphs.map((p, index) => {
      // 添加标记符号
      return `[标记] ${p}\n`;
    }).join('\n');

    // 标签
    const tagStr = tags.map(t => `#${t}`).join(' ');
    
    // 优化建议
    const tips = optimizationTips.length > 0
      ? optimizationTips.map((t, i) => `${i + 1}. ${t}`).join('\n')
      : '';

    const text = `${processedTitle}

${processedBody}
${tagStr ? `\n相关标签：${tagStr}` : ''}${tips ? `\n\n[UP主小贴士]\n${tips}` : ''}

觉得有用别忘了三连支持一下！`;

    // 生成B站风格HTML预览
    const htmlContent = this.generateBilibiliHTML(processedTitle, processedBody, tags);

    return {
      platform: 'B站',
      title: processedTitle,
      text,
      html: htmlContent,
      tags,
      coverSuggestion,
      optimizationTips
    };
  }

  /**
   * 默认格式化
   */
  formatDefault(title, body, tags, coverSuggestion, optimizationTips) {
    // 解析 body（处理 JSON 格式）
    const parsedBody = this.parseBody(body);
    const tagStr = tags.map(t => `#${t}`).join(' ');
    
    return {
      platform: '默认',
      title,
      text: `${title}\n\n${parsedBody}\n\n${tagStr}`,
      html: null,
      tags,
      coverSuggestion,
      optimizationTips
    };
  }

  /**
   * 智能高亮处理
   * 自动识别关键词并添加高亮
   */
  applyHighlight(text) {
    // 需要高亮的关键词模式
    const patterns = [
      { regex: /(ChatGPT|Claude|GPT-4|AI|人工智能)/g, color: 'highlight-yellow' },
      { regex: /(重要|关键|核心|必须)/g, color: 'highlight-red' },
      { regex: /(建议|推荐|技巧|方法)/g, color: 'highlight-green' },
      { regex: /(数据|统计|研究|报告)/g, color: 'highlight-blue' },
      { regex: /(注意|警告|避免)/g, color: 'highlight-orange' },
      { regex: /(原理|概念|理论)/g, color: 'highlight-purple' }
    ];

    let highlighted = text;
    patterns.forEach(({ regex, color }) => {
      highlighted = highlighted.replace(regex, (match) => {
        return `<mark class="${color}">${match}</mark>`;
      });
    });

    return highlighted;
  }

  /**
   * 批量格式化所有平台
   */
  formatAll(content, options = {}) {
    const platforms = Object.keys(this.platformConfig);
    const results = {};

    platforms.forEach(platform => {
      results[platform] = this.format(content, platform, options);
    });

    return results;
  }

  /**
   * 获取平台特性信息
   */
  getPlatformInfo(platform) {
    return this.platformConfig[platform] || null;
  }

  /**
   * 获取所有平台列表
   */
  getAllPlatforms() {
    return Object.keys(this.platformConfig);
  }

  /**
   * 内容长度检查
   */
  checkLength(content, platform) {
    const config = this.platformConfig[platform];
    if (!config) return { valid: true };

    const length = content.length;
    const valid = length <= config.maxLength;

    return {
      valid,
      length,
      maxLength: config.maxLength,
      remaining: config.maxLength - length,
      warning: length > config.maxLength * 0.9
    };
  }

  /**
   * 智能截断内容
   */
  truncateContent(content, platform, addEllipsis = true) {
    const config = this.platformConfig[platform];
    if (!config || content.length <= config.maxLength) {
      return content;
    }

    let truncated = content.substring(0, config.maxLength);
    
    // 尝试在句子结尾截断
    const lastPeriod = truncated.lastIndexOf('。');
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastNewline);
    
    if (cutPoint > config.maxLength * 0.8) {
      truncated = truncated.substring(0, cutPoint + 1);
    }

    return addEllipsis ? truncated + '\n\n...' : truncated;
  }

  /**
   * 小红书风格HTML预览
   */
  generateXiaohongshuHTML(title, body, tags) {
    const tagHtml = tags.map(t => 
      `<span style="display: inline-block; background: #ff2442; color: white; padding: 4px 12px; border-radius: 16px; margin-right: 8px; margin-bottom: 8px; font-size: 13px;">#${t}</span>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: #fff;">
  <div style="background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%); padding: 15px 20px; border-radius: 12px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 20px; color: white; line-height: 1.4;">${title}</h1>
  </div>
  <div style="font-size: 15px; line-height: 1.8; color: #333; white-space: pre-wrap;">${body}</div>
  <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
    ${tagHtml}
  </div>
  <div style="margin-top: 20px; text-align: center; color: #ff2442; font-size: 14px;">
    喜欢就点赞收藏吧~
  </div>
</body>
</html>`;
  }

  /**
   * 知乎风格HTML预览
   */
  generateZhihuHTML(title, body, tags) {
    const tagHtml = tags.map(t => 
      `<span style="display: inline-block; background: #f6f6f6; color: #1a1a1a; padding: 4px 12px; border-radius: 4px; margin-right: 8px; font-size: 13px;">#${t}</span>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #fff;">
  <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 600;">${title}</h1>
  <div style="border-left: 4px solid #0084ff; padding-left: 16px; margin-bottom: 20px; color: #666; font-size: 14px;">
    本文约 ${body.length} 字，预计阅读 ${Math.ceil(body.length / 500)} 分钟
  </div>
  <div style="font-size: 16px; line-height: 1.8; color: #1a1a1a; white-space: pre-wrap;">${body}</div>
  <div style="margin-top: 30px; padding: 20px; background: #f6f6f6; border-radius: 8px;">
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #8590a6;">相关话题</p>
    ${tagHtml}
  </div>
</body>
</html>`;
  }

  /**
   * 抖音风格HTML预览
   */
  generateDouyinHTML(title, body, tags) {
    const tagHtml = tags.map(t => 
      `<span style="display: inline-block; background: #161823; color: white; padding: 6px 14px; border-radius: 20px; margin-right: 8px; font-size: 13px;">#${t}</span>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: linear-gradient(180deg, #161823 0%, #1a1a2e 100%); color: white;">
  <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 16px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 22px; color: #fe2c55; line-height: 1.4;">${title}</h1>
  </div>
  <div style="font-size: 16px; line-height: 2; color: white; white-space: pre-wrap;">${body}</div>
  <div style="margin-top: 25px;">
    ${tagHtml}
  </div>
  <div style="margin-top: 30px; text-align: center;">
    <span style="display: inline-block; background: #fe2c55; color: white; padding: 10px 30px; border-radius: 25px; font-size: 14px;">点赞收藏</span>
  </div>
</body>
</html>`;
  }

  /**
   * B站风格HTML预览
   */
  generateBilibiliHTML(title, body, tags) {
    const tagHtml = tags.map(t => 
      `<span style="display: inline-block; background: #e3e5e7; color: #222; padding: 4px 12px; border-radius: 6px; margin-right: 8px; font-size: 13px;">#${t}</span>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <h1 style="margin: 0 0 15px 0; font-size: 22px; color: #18191c;">
      <span style="background: #00a1d6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px; margin-right: 10px;">UP</span>
      ${title}
    </h1>
    <div style="font-size: 15px; line-height: 1.8; color: #18191c; white-space: pre-wrap;">${body}</div>
    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e3e5e7;">
      ${tagHtml}
    </div>
    <div style="margin-top: 20px; display: flex; justify-content: space-around; color: #9499a0; font-size: 13px;">
      <span>[点赞]</span>
      <span>[投币]</span>
      <span>[收藏]</span>
      <span>[关注]</span>
    </div>
  </div>
</body>
</html>`;
  }
}

// 导出单例
const platformFormatter = new PlatformFormatter();

module.exports = {
  PlatformFormatter,
  platformFormatter
};
