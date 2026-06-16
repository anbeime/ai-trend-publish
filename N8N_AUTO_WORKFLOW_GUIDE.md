# N8N 自动热点采集与改写工作流配置指南

## 📋 完整流程

```
定时触发 → 采集热点 → 筛选爆款 → 循环改写 → 发布微信
```

## 🛠️ 节点配置

### 1. Schedule Trigger（定时触发）
```json
{
  "node": "Schedule Trigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 6
        }
      ]
    }
  },
  "description": "每6小时执行一次"
}
```

**推荐时间**：
- 早上 8:00（早高峰）
- 中午 12:00（午休）
- 晚上 18:00（晚高峰）
- 晚上 22:00（睡前）

---

### 2. HTTP Request（采集热点API）
```json
{
  "node": "HTTP Request",
  "parameters": {
    "method": "GET",
    "url": "http://localhost:3000/api/hot-news",
    "queryParameters": {
      "parameters": [
        {
          "name": "limit",
          "value": "10"
        },
        {
          "name": "minScore",
          "value": "10000"
        }
      ]
    },
    "options": {
      "timeout": 30000
    }
  },
  "description": "获取热点文章（热度>1万）"
}
```

**参数说明**：
- `limit`: 最多返回多少篇文章（1-50）
- `minScore`: 最低热度分数（建议 10000 = 1万）

**返回格式**：
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "title": "文章标题",
      "url": "https://example.com/article",
      "hotScore": 15000,
      "publishTime": "2026-01-04",
      "source": "top.miyucaicai.cn",
      "index": 1
    }
  ]
}
```

---

### 3. Code（筛选爆款）
```javascript
{
  "node": "Code",
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": `
// 获取热点数据
const articles = $input.all()[0].json.data;

if (!articles || articles.length === 0) {
  return [];
}

// 筛选条件
const filtered = articles.filter(article => {
  // 1. 热度大于 1 万
  if (article.hotScore < 10000) return false;

  // 2. 标题长度适中（10-50字）
  if (article.title.length < 10 || article.title.length > 50) return false;

  // 3. 排除某些关键词
  const excludeKeywords = ['广告', '推广', '测评'];
  if (excludeKeywords.some(kw => article.title.includes(kw))) return false;

  return true;
});

// 按热度排序，取前5篇
const top5 = filtered
  .sort((a, b) => b.hotScore - a.hotScore)
  .slice(0, 5);

console.log(\`筛选后: \${top5.length} 篇爆款文章\`);

return top5.map(article => ({ json: article }));
`
  },
  "description": "筛选高质量爆款文章"
}
```

**筛选逻辑**：
1. ✅ 热度 > 1万
2. ✅ 标题长度 10-50 字
3. ❌ 排除广告、推广等
4. 🔝 取热度 TOP 5

---

### 4. Loop Over Items（循环处理）
```json
{
  "node": "Loop Over Items",
  "parameters": {
    "batchSize": 1
  },
  "description": "逐篇处理文章"
}
```

---

### 5. 【您现有的改写工作流】
**在此调用您的 COZE 改写节点**

**输入变量映射**：
```javascript
{
  "inputUrl": "{{ $json.url }}",          // 文章链接
  "originalTitle": "{{ $json.title }}",   // 原始标题
  "hotScore": "{{ $json.hotScore }}"      // 热度分数（可用于提示词）
}
```

**提示词优化建议**：
```
你是一个专业的内容改写专家。

原文链接：{{ $json.url }}
原文标题：{{ $json.title }}
文章热度：{{ $json.hotScore }} 阅读

请根据原文内容：
1. 改写标题，更吸引人（保持原意）
2. 提炼核心观点 3-5 条
3. 改写正文，语言通俗易懂
4. 添加引人思考的结尾

目标读者：关注科技/AI趋势的公众号用户
字数要求：800-1200字
语气：专业但不失趣味
```

---

### 6. HTTP Request（发布到微信）
```json
{
  "node": "HTTP Request",
  "parameters": {
    "method": "POST",
    "url": "https://your-domain.vercel.app/api/publish-wechat",
    "bodyParameters": {
      "parameters": [
        {
          "name": "title",
          "value": "={{ $json.rewrittenTitle }}"
        },
        {
          "name": "content",
          "value": "={{ $json.rewrittenContent }}"
        },
        {
          "name": "thumbMediaId",
          "value": "YOUR_MEDIA_ID"
        }
      ]
    },
    "options": {
      "timeout": 60000
    }
  },
  "description": "发布到微信公众号草稿箱"
}
```

**方式A**: 调用 Vercel API（推荐）
- 复用现有的 `api/index.js` 发布逻辑

**方式B**: 调用 Python SDK
```bash
# 创建 HTTP 端点包装 wechat_sdk.py
python wechat_publisher_api.py
```

---

## 🚀 快速部署

### 步骤1: 启动热点采集 API
```bash
cd C:\D\ai-trend-publish

# 安装依赖
npm install cheerio

# 启动 Vercel Dev（本地测试）
vercel dev
```

**测试 API**：
```bash
curl "http://localhost:3000/api/hot-news?limit=5&minScore=10000"
```

---

### 步骤2: 导入 N8N 工作流
1. 打开 N8N: `http://localhost:5678`
2. 点击 "+" → "Import from File"
3. 选择本文档中的节点配置
4. 连接各个节点

---

### 步骤3: 配置变量

在 N8N 中设置环境变量：
```bash
# .env 文件
HOT_NEWS_API=http://localhost:3000/api/hot-news
WECHAT_PUBLISH_API=https://your-domain.vercel.app/api/publish-wechat
WECHAT_APP_ID=wx8410119dfbb7f756
WECHAT_APP_SECRET=3c93e33e087e57b906f5c341aa5223b9
```

---

## 📊 完整工作流示例

```
┌─────────────────┐
│ Schedule Trigger│ 每6小时
│   (Cron: 0 */6 *)│
└────────┬────────┘
         │
         v
┌─────────────────┐
│ HTTP Request    │ GET /api/hot-news
│ (采集热点)       │ limit=10&minScore=10000
└────────┬────────┘
         │ [{title, url, hotScore}...]
         v
┌─────────────────┐
│ Code (筛选)     │ 过滤 + 排序 + Top 5
└────────┬────────┘
         │ [Top 5 爆款]
         v
┌─────────────────┐
│ Loop Over Items │ 逐篇处理
└────────┬────────┘
         │ for each article
         v
┌─────────────────┐
│ COZE 改写       │ url → 改写后内容
│                 │
└────────┬────────┘
         │ {rewrittenTitle, rewrittenContent}
         v
┌─────────────────┐
│ HTTP Request    │ POST /api/publish-wechat
│ (发布微信)       │
└────────┬────────┘
         │
         v
    ✅ 草稿箱
```

---

## 🔧 故障排查

### 问题1: 采集 API 返回空数组
**解决**：
1. 检查 `top.miyucaicai.cn` 是否可访问
2. 降低 `minScore` 阈值（如 5000）
3. 查看 API 日志：`vercel logs`

### 问题2: N8N 改写节点失败
**解决**：
1. 检查 COZE 节点的输入格式
2. 确认 URL 可以正常访问
3. 增加超时时间（60s → 120s）

### 问题3: 微信发布失败
**解决**：
1. 验证 IP 白名单（223.73.236.232）
2. 检查 Access Token 是否有效
3. 查看微信 API 错误码

---

## 📈 性能优化

### 1. 缓存策略
在采集 API 中添加缓存，避免频繁抓取：
```javascript
const CACHE_TTL = 30 * 60 * 1000; // 30分钟
let cachedData = null;
let cacheTime = 0;

if (Date.now() - cacheTime < CACHE_TTL) {
  return res.json(cachedData);
}
```

### 2. 并发控制
N8N 中限制同时改写的文章数：
- 使用 `Split In Batches` 节点
- 每批处理 2-3 篇，避免 COZE API 超载

### 3. 去重检查
发布前检查是否已发布过相同标题：
```javascript
// 在 Code 节点中
const existingTitles = await getPublishedTitles(); // 从数据库获取
const isDuplicate = existingTitles.includes(article.title);
```

---

## 🎯 效果预期

- **采集频率**: 每6小时
- **筛选数量**: 5篇爆款
- **改写时长**: 约 30秒/篇
- **总耗时**: 约 3-5 分钟完成整个流程
- **成功率**: >90%（排除网络波动）

**每日产出**：
- 4次触发 × 5篇文章 = 20篇候选
- 人工审核后发布 2-3篇精品

---

## 📝 后续优化方向

1. **智能筛选**: 使用 AI 分析标题质量、情感倾向
2. **A/B测试**: 生成多个改写版本，选择最优
3. **自动排版**: 添加图片、排版优化
4. **数据分析**: 追踪阅读量、点赞数，优化选题
5. **多平台发布**: 同时发布到知乎、小红书等

---

**创建时间**: 2026-01-04
**版本**: v1.0
**作者**: Claude Code
