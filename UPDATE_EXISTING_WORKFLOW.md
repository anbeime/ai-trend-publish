# 修改现有工作流：添加网页抓取功能

## 工作流信息
- **工作流名称**: 公众号+coze自动发布文章
- **工作流ID**: SoLRVvusHdvXBodD
- **修改目标**: 在"循环处理"和"COZE改写"之间添加2个节点

---

## 修改步骤（5分钟）

### 1. 打开现有工作流
1. 访问 http://localhost:5678
2. 点击左侧 `工作流` 列表
3. 找到并点击 `公众号+coze自动发布文章`

### 2. 添加"抓取网页"节点

**位置**: 在"循环处理"节点之后

1. 点击"循环处理"节点和下一个节点之间的 `+` 号
2. 搜索并选择 `HTTP Request` 节点
3. 配置如下：

```
节点名称: 抓取网页

【HTTP Request配置】
- Method: GET
- URL: {{ $json.url }}
- Options:
  - Timeout: 20000
```

**备注**: 添加到节点的Notes: "抓取文章网页HTML"

### 3. 添加"提取正文"节点

**位置**: 在"抓取网页"节点之后

1. 点击"抓取网页"节点后的 `+` 号
2. 搜索并选择 `Code` 节点
3. 配置如下：

```
节点名称: 提取正文

【Code配置】
- Mode: Run Once for All Items
- JavaScript Code: (复制下面的代码)
```

**JavaScript代码**:
```javascript
// 提取网页正文内容
const cheerio = require('cheerio');

const input = $input.all()[0];
const html = input.json.data || input.json.body || input.binary?.data?.toString();
const originalUrl = input.json.url || $('循环处理').last().json.url;
const originalTitle = input.json.title || $('循环处理').last().json.title;

if (!html) {
  throw new Error('未获取到网页HTML');
}

console.log(`[提取正文] URL: ${originalUrl}`);
console.log(`[提取正文] 原标题: ${originalTitle}`);

const $ = cheerio.load(html);

// 移除脚本、样式等无关内容
$('script, style, iframe, nav, footer, header, aside, .ad, .advertisement').remove();

// 提取正文的多种策略
let content = '';
const contentSelectors = [
  'article',
  '.article-content, .post-content, .content',
  '.main-content, #content',
  '[class*="content"]',
  'main',
];

for (const selector of contentSelectors) {
  const $content = $(selector).first();
  if ($content.length > 0) {
    content = $content.text().trim();
    if (content.length > 100) {
      console.log(`[提取正文] 使用选择器: ${selector}，提取 ${content.length} 字符`);
      break;
    }
  }
}

// 降级策略：提取body内所有文本
if (!content || content.length < 100) {
  content = $('body').text().trim();
  console.log(`[提取正文] 使用降级策略，提取 ${content.length} 字符`);
}

// 清理内容
content = content
  .replace(/\s+/g, ' ')  // 合并空白
  .replace(/\n{3,}/g, '\n\n')  // 合并多余换行
  .trim()
  .substring(0, 3000);  // 限制在3000字以内

console.log(`[提取正文] 最终内容长度: ${content.length} 字符`);

return [{
  json: {
    url: originalUrl,
    title: originalTitle,
    content: content,
    contentLength: content.length
  }
}];
```

### 4. 修改"COZE改写"节点的输入

1. 点击"COZE改写"节点（之前可能叫"使用Coze改写工作流"）
2. 找到 `JSON Body` 配置
3. 修改 `parameters` 部分：

**原来的（错误）**:
```json
{
  "workflow_id": "7573873083216707599",
  "parameters": {
    "input": "{{ $json.subject }}"
  }
}
```

**改为（正确）**:
```json
{
  "workflow_id": "7573873083216707599",
  "parameters": {
    "BOT_USER_INPUT": "标题：{{ $json.title }}\n\n正文：{{ $json.content }}"
  }
}
```

### 5. 调整节点连接关系

确保连接顺序为：
```
循环处理
  ↓
抓取网页（新增）
  ↓
提取正文（新增）
  ↓
COZE改写
  ↓
解析COZE输出
  ↓
发布草稿
```

**操作方法**:
1. 断开"循环处理"到原来下一个节点的连接
2. 连接"循环处理" → "抓取网页"
3. 连接"抓取网页" → "提取正文"
4. 连接"提取正文" → "COZE改写"
5. 其他连接保持不变

### 6. 优化"解析COZE输出"节点（可选）

如果想增强图片提取，可以在解析节点的代码中添加：

```javascript
// 在解析content后添加
const imgMatches = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/g) || [];
console.log('[解析] HTML中图片标签数量:', imgMatches.length);

// 在返回的json中添加
return [{
  json: {
    title: title,
    content: content,
    images: images,
    imageCount: imgMatches.length  // 新增
  }
}];
```

### 7. 保存并测试

1. 点击右上角 `Save` 保存工作流
2. 点击 `Execute Workflow` 测试运行
3. 观察每个节点的执行情况，特别是：
   - "抓取网页"节点是否成功获取HTML
   - "提取正文"节点是否提取到内容（查看日志）
   - "COZE改写"节点是否收到标题+正文

---

## 验证清单

- [ ] "抓取网页"节点添加成功
- [ ] "提取正文"节点添加成功
- [ ] "COZE改写"节点的输入改为 `BOT_USER_INPUT: "标题：...\n\n正文：..."`
- [ ] 节点连接顺序正确
- [ ] 保存工作流
- [ ] 测试执行成功

---

## 预期效果

修改后，数据流变为：

```
热点URL → 抓取HTML → 提取正文 → COZE("标题+正文") → 生成图文 → 发布
```

**解决的问题**:
- ✅ COZE现在能收到完整的文章内容（不再是空的URL）
- ✅ COZE基于真实内容生成图文（质量更高）
- ✅ 生成的HTML应该包含图片

---

## 常见问题

**Q: 找不到"循环处理"节点？**
A: 可能叫"循环处理每篇"或"splitInBatches"，找类型为 `splitInBatches` 的节点

**Q: cheerio报错？**
A: N8N内置了cheerio，不需要安装。如果报错，检查代码是否完整复制

**Q: 提取的正文为空？**
A: 查看节点的执行日志，可能是目标网站结构特殊，需要调整选择器

---

立即开始修改吧！修改完成后运行一次，告诉我结果。
