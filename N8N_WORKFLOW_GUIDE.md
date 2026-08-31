# N8N 自动化工作流修复说明

## 问题诊断

根据你的描述，之前的N8N工作流存在3个关键问题：

1. **采集信息没有正确传入COZE** ❌
   - 原因：COZE工作流无法直接读取URL
   - 症状：COZE收不到文章内容

2. **COZE生成的HTML没有图片** ❌
   - 原因：解析逻辑不完善
   - 症状：草稿箱文章没有图片

3. **排版需要美化** ⚠️
   - 原因：HTML直接输出，没有优化
   - 症状：格式不美观

---

## 修复方案

### 核心改动

**新增2个关键节点** 解决COZE无法读取URL的问题：

```
循环处理
  ↓
【新增】抓取网页内容  ←── 从URL获取HTML
  ↓
【新增】提取正文内容  ←── 解析HTML，提取纯文本
  ↓
COZE改写 ←── 接收 "标题 + 正文文本"
  ↓
解析COZE输出 ←── 增强图片提取逻辑
  ↓
发布草稿
```

---

## 完整工作流节点（11个）

| 序号 | 节点名称 | 功能 | 说明 |
|------|---------|------|------|
| 1 | 定时触发 | 每天 8:30/20:00/22:00 执行 | Cron表达式 |
| 2 | 采集热点 | 调用 `/api/hot-news` | 获取10条热点 |
| 3 | 筛选TOP3 | 按热度/标题/关键词筛选 | 取前3篇 |
| 4 | 循环处理 | 逐篇处理 | splitInBatches |
| 5 | **抓取网页** ⭐ | HTTP GET文章URL | **新增节点** |
| 6 | **提取正文** ⭐ | Cheerio解析HTML | **新增节点** |
| 7 | COZE改写 | 调用扣子工作流 | 传入标题+正文 |
| 8 | 解析COZE输出 | 解析SSE流 | 提取title/content/images |
| 9 | 发布草稿 | 微信公众号API | Vercel代理 |
| 10 | 间隔2秒 | 避免频繁调用 | 防止被限流 |
| 11 | 发布报告 | 生成汇总 | 成功/失败统计 |

---

## 数据流详解

### 1. 热点采集 → 筛选
```json
{
  "data": [
    {
      "title": "AI芯片突破性进展",
      "url": "https://example.com/article/123",
      "hotScore": 15000,
      "publishTime": "2026-01-08",
      "source": "top.miyucaicai.cn"
    }
  ]
}
```

### 2. 抓取网页 → 提取正文
```javascript
// 输入：$json.url
// 输出：
{
  "url": "https://example.com/article/123",
  "title": "AI芯片突破性进展",
  "content": "据悉，某公司今日发布...",  // ← 纯文本，3000字以内
  "contentLength": 1200
}
```

### 3. COZE改写（关键修复）
```json
// 之前错误：只传URL
{
  "workflow_id": "7573873083216707599",
  "parameters": {
    "BOT_USER_INPUT": "https://example.com/..."  // ❌ COZE无法读取
  }
}

// 现在正确：传标题+正文
{
  "workflow_id": "7573873083216707599",
  "parameters": {
    "BOT_USER_INPUT": "标题：AI芯片突破性进展\n\n正文：据悉，某公司今日发布..."  // ✅
  }
}
```

### 4. 解析COZE输出（增强图片提取）
```javascript
// COZE的SSE输出
event: Message
data: {"content": "{\"title\":\"重磅！...\", \"output\":\"<p>...<img src='...'></p>\"}"}

// 解析逻辑增强
const imgMatches = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/g);
console.log('[解析] HTML中图片标签数量:', imgMatches.length);

// 输出
{
  "title": "重磅！AI芯片突破",
  "content": "<p>...</p>",
  "images": [],
  "imageCount": 3  // ← 新增：从HTML提取的图片数量
}
```

---

## 导入和测试

### 方法1：自动导入（推荐）

```bash
cd C:\D\ai-trend-publish
python import_n8n_workflow.py
```

### 方法2：手动导入

1. 打开 N8N：`http://localhost:5678`
2. 点击右上角 `+` → `Import from File`
3. 选择 `n8n-complete-workflow.json`
4. 点击 `Import`

### 方法3：复制JSON直接导入

1. 打开 `n8n-complete-workflow.json`
2. 全选复制内容（Ctrl+A, Ctrl+C）
3. 在N8N中点击 `Import from URL or Clipboard`
4. 粘贴并导入

---

## 配置检查清单

导入后需要修改的配置：

- [ ] **COZE凭证** - 节点"COZE改写"需要配置HTTP Header认证
  - Credential Type: `HTTP Header Auth`
  - Name: `coze`
  - Header Name: `Authorization`
  - Value: `Bearer YOUR_COZE_TOKEN`

- [ ] **微信公众号配置** - 节点"发布草稿"
  ```json
  {
    "appId": "你的appId",        // ← 修改这里
    "appSecret": "你的appSecret"  // ← 修改这里
  }
  ```

- [ ] **Vercel域名** - 节点"发布草稿"
  ```
  https://your-domain.vercel.app/api/index  // ← 修改为你的域名
  ```

---

## 测试流程

### 1. 单步测试

在N8N中手动执行每个节点：

```
✅ 定时触发 → 跳过（手动触发即可）
✅ 采集热点 → 检查是否返回10条数据
✅ 筛选TOP3 → 检查是否正确筛选3篇
✅ 循环处理 → 检查是否逐篇处理
✅ 抓取网页 → 检查是否成功获取HTML
✅ 提取正文 → 检查content长度>100字
✅ COZE改写 → 检查SSE响应
✅ 解析COZE输出 → 检查title/content/imageCount
✅ 发布草稿 → 检查微信草稿箱
```

### 2. 查看日志

每个节点都有console.log输出：

```javascript
// 筛选节点
[筛选] 原始文章数: 10
[筛选] 筛选后文章数: 5
[筛选] 最终选择: 3 篇

// 提取正文节点
[提取正文] 使用选择器: article，提取 1200 字符
[提取正文] 最终内容长度: 1200 字符

// 解析COZE节点
[解析] 找到 5 个Message事件
[解析] 标题: 重磅！AI芯片突破
[解析] 内容长度: 3500
[解析] HTML中图片标签数量: 3
```

### 3. 完整流程测试

1. 点击工作流的 `Execute Workflow` 按钮
2. 观察每个节点的执行状态
3. 检查最后的"发布报告"节点输出

---

## 常见问题

### Q1: 抓取网页失败
**原因**：目标网站有反爬虫
**解决**：在"抓取网页"节点添加User-Agent头

### Q2: 提取正文为空
**原因**：网页结构特殊
**解决**：检查提取正文节点的日志，调整选择器

### Q3: COZE返回空内容
**原因**：工作流ID错误或Token过期
**解决**：检查 `workflow_id` 和 `Authorization` 配置

### Q4: 发布草稿失败
**原因**：微信API配置错误或Token过期
**解决**：检查appId/appSecret，重新获取access_token

---

## 下一步优化

- [ ] **图片处理** - 自动下载COZE生成的图片并上传到微信
- [ ] **排版美化** - 添加format-wechat节点进行HTML优化
- [ ] **错误重试** - 为关键节点添加重试机制
- [ ] **通知推送** - 发布成功后发送通知到微信/邮箱

---

## 文件清单

```
C:\D\ai-trend-publish\
├── n8n-complete-workflow.json       # 完整工作流（含网页抓取）
├── import_n8n_workflow.py           # 自动导入脚本
└── N8N_WORKFLOW_GUIDE.md            # 本说明文档
```

---

**创建时间**: 2026-01-08
**版本**: v3.0
**修复内容**: 新增网页抓取和正文提取节点，解决COZE无法读取URL问题
