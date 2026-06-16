// 网页转Markdown云函数
// 功能: 将网页内容转换为Markdown格式

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const axios = require('axios');
const TurndownService = require('turndown');

/**
 * 获取网页HTML内容
 * @param {string} url - 网页URL
 */
async function fetchHTML(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    return response.data;
  } catch (error) {
    console.error('[fetchHTML]错误:', error);
    throw new Error(`获取网页失败: ${error.message}`);
  }
}

/**
 * 清理HTML内容
 * @param {string} html - HTML内容
 */
function cleanHTML(html) {
  // 移除script标签
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 移除style标签
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // 移除注释
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // 移除多余的空白
  html = html.replace(/\s+/g, ' ');
  
  return html;
}

/**
 * 提取主要内容
 * @param {string} html - HTML内容
 */
function extractMainContent(html) {
  // 尝试提取主要内容区域
  const patterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // 如果没有找到特定区域，返回body内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1];
  }
  
  return html;
}

/**
 * HTML转Markdown
 * @param {string} html - HTML内容
 * @param {object} options - 转换选项
 */
function htmlToMarkdown(html, options = {}) {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    ...options
  });
  
  // 自定义规则：保留图片
  turndownService.addRule('images', {
    filter: 'img',
    replacement: function(content, node) {
      const alt = node.alt || '';
      const src = node.src || '';
      const title = node.title || '';
      
      if (!src) return '';
      
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }
  });
  
  // 自定义规则：保留链接
  turndownService.addRule('links', {
    filter: 'a',
    replacement: function(content, node) {
      const href = node.href || '';
      const title = node.title || '';
      
      if (!href) return content;
      
      return title ? `[${content}](${href} "${title}")` : `[${content}](${href})`;
    }
  });
  
  // 转换为Markdown
  const markdown = turndownService.turndown(html);
  
  return markdown;
}

/**
 * 格式化Markdown
 * @param {string} markdown - Markdown内容
 */
function formatMarkdown(markdown) {
  // 移除多余的空行（保留最多2个连续空行）
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  // 确保标题前后有空行
  markdown = markdown.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
  markdown = markdown.replace(/(#{1,6} [^\n]+)\n([^\n])/g, '$1\n\n$2');
  
  // 确保列表前后有空行
  markdown = markdown.replace(/([^\n])\n([-*+] )/g, '$1\n\n$2');
  markdown = markdown.replace(/([-*+] [^\n]+)\n([^\n])/g, '$1\n\n$2');
  
  // 确保代码块前后有空行
  markdown = markdown.replace(/([^\n])\n(```)/g, '$1\n\n$2');
  markdown = markdown.replace(/(```)\n([^\n])/g, '$1\n\n$2');
  
  // 移除行尾空白
  markdown = markdown.replace(/ +$/gm, '');
  
  // 确保文件以换行符结尾
  if (!markdown.endsWith('\n')) {
    markdown += '\n';
  }
  
  return markdown;
}

/**
 * 提取元数据
 * @param {string} html - HTML内容
 */
function extractMetadata(html) {
  const metadata = {
    title: '',
    description: '',
    author: '',
    date: '',
    keywords: []
  };
  
  // 提取标题
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }
  
  // 提取meta标签
  const metaPattern = /<meta[^>]*name="([^"]+)"[^>]*content="([^"]+)"[^>]*>/gi;
  let metaMatch;
  
  while ((metaMatch = metaPattern.exec(html)) !== null) {
    const name = metaMatch[1].toLowerCase();
    const content = metaMatch[2];
    
    if (name === 'description') {
      metadata.description = content;
    } else if (name === 'author') {
      metadata.author = content;
    } else if (name === 'keywords') {
      metadata.keywords = content.split(',').map(k => k.trim());
    } else if (name === 'date' || name === 'publish-date') {
      metadata.date = content;
    }
  }
  
  return metadata;
}

/**
 * 完整工作流: 获取网页 -> 转换Markdown
 * @param {string} url - 网页URL
 * @param {object} options - 转换选项
 */
async function completeWorkflow(url, options = {}) {
  try {
    console.log('[completeWorkflow]步骤1: 获取网页内容');
    const html = await fetchHTML(url);
    
    console.log('[completeWorkflow]步骤2: 清理HTML');
    const cleanedHTML = cleanHTML(html);
    
    console.log('[completeWorkflow]步骤3: 提取主要内容');
    const mainContent = extractMainContent(cleanedHTML);
    
    console.log('[completeWorkflow]步骤4: 提取元数据');
    const metadata = extractMetadata(html);
    
    console.log('[completeWorkflow]步骤5: 转换为Markdown');
    let markdown = htmlToMarkdown(mainContent, options);
    
    console.log('[completeWorkflow]步骤6: 格式化Markdown');
    markdown = formatMarkdown(markdown);
    
    // 添加frontmatter
    if (options.includeFrontmatter !== false) {
      const frontmatter = [
        '---',
        `title: "${metadata.title}"`,
        `date: ${metadata.date || new Date().toISOString()}`,
        metadata.author ? `author: "${metadata.author}"` : '',
        metadata.description ? `description: "${metadata.description}"` : '',
        metadata.keywords.length > 0 ? `keywords: [${metadata.keywords.map(k => `"${k}"`).join(', ')}]` : '',
        `source: "${url}"`,
        '---',
        ''
      ].filter(Boolean).join('\n');
      
      markdown = frontmatter + '\n' + markdown;
    }
    
    console.log('[completeWorkflow]转换完成');
    
    return {
      success: true,
      url: url,
      metadata: metadata,
      markdown: markdown,
      length: markdown.length,
      message: '网页转换成功'
    };
    
  } catch (error) {
    console.error('[completeWorkflow]错误:', error);
    throw error;
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { url, options = {} } = event;
  
  console.log('[url-to-markdown]收到请求, url:', url);
  
  try {
    // 参数验证
    if (!url) {
      throw new Error('参数错误: url必须提供');
    }
    
    // URL格式验证
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('参数错误: url必须是HTTP或HTTPS协议');
    }
    
    // 执行转换
    const result = await completeWorkflow(url, options);
    
    return result;
    
  } catch (error) {
    console.error('[url-to-markdown]错误:', error);
    
    // 返回错误信息
    return {
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR',
      errorDetails: {
        url: url,
        message: error.message,
        stack: error.stack
      }
    };
  }
};
