# 🚀 AI热点自动发布系统 - 快速开始

## 📊 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    自动化发布流程                             │
└─────────────────────────────────────────────────────────────┘

  ⏰ 定时触发 (8:30, 20:00, 22:00)
        │
        ▼
  🔍 采集热点 (top.miyucaicai.cn)
        │ [API: /api/hot-news]
        │ → 返回 10 篇文章
        ▼
  🎯 筛选爆款 (热度>1万, TOP 3)
        │ [Code节点]
        │ → 3 篇高质量文章
        ▼
  🔄 循环处理
        │
        ├─ 📝 COZE 改写
        │    │ [您的现有工作流]
        │    │ → 标题 + 正文 + 图片
        │    ▼
        ├─ 🎨 排版优化
        │    │ [API: /api/format-wechat]
        │    │ → 微信富文本格式
        │    ▼
        └─ 📲 发布微信
             │ [API: /api/index]
             └─ ✅ 草稿箱

  📈 发布报告
        └─ 成功 / 失败统计
```

---

## 🎯 10分钟快速部署

### 步骤 1: 启动 API 服务
```bash
# 双击运行（Windows）
start-auto-publish.bat

# 或手动启动
cd C:\D\ai-trend-publish
npm install cheerio
vercel dev
```

**验证**: 浏览器打开 `http://localhost:3000/api/hot-news?limit=3`

---

### 步骤 2: 测试 API
```bash
# 运行测试脚本
python test_auto_publish.py
```

**预期输出**:
```
✅ API 服务正常运行
✅ 成功采集 5 篇文章
✅ 排版优化成功
✅ 完整工作流测试成功！
```

---

### 步骤 3: 导入 N8N 工作流

1. 打开 N8N: http://localhost:5678
2. 点击右上角 **"+"** → **"Import from File"**
3. 选择文件: `n8n-auto-publish-workflow.json`
4. 点击 **"Import"**

---

### 步骤 4: 连接 COZE 节点

1. 找到节点: **【COZE改写节点-请连接您的工作流】**
2. 删除这个占位符节点
3. 在 **"循环处理每篇"** 和 **"排版优化"** 之间插入您的 COZE 工作流
4. 配置输入变量:
   ```javascript
   输入URL: {{ $json.url }}
   原标题: {{ $json.title }}
   热度分数: {{ $json.hotScore }}
   ```

5. 确保 COZE 输出格式:
   ```json
   {
     "title": "改写后的标题",
     "content": "改写后的正文（支持 Markdown）",
     "images": ["图片URL1", "图片URL2"] // 可选
   }
   ```

---

### 步骤 5: 配置微信发布

打开节点: **"发布到微信草稿箱"**

修改 URL:
```javascript
// 如果使用 Vercel 部署
https://your-domain.vercel.app/api/index

// 如果本地测试
http://localhost:3000/api/index
```

参数已预配置:
```json
{
  "action": "draft",
  "appId": "wx8410119dfbb7f756",
  "appSecret": "3c93e33e087e57b906f5c341aa5223b9"
}
```

---

### 步骤 6: 测试运行

1. 在 N8N 中点击 **"Execute Workflow"** 手动触发
2. 观察每个节点的执行状态
3. 检查微信公众号草稿箱是否有新文章

**预期结果**:
- ✅ 采集到 10 篇热点
- ✅ 筛选出 3 篇爆款
- ✅ 每篇都成功改写
- ✅ 每篇都成功发布到草稿箱

---

## 📅 自动化设置

### 定时触发配置

工作流已预配置为每天 3 次触发:
- **08:30** - 早高峰
- **20:00** - 晚高峰
- **22:00** - 睡前

**Cron 表达式**: `30 8,20,22 * * *`

### 修改触发时间

编辑节点: **"定时触发 8:30/20:00/22:00"**

```javascript
// 修改为您想要的时间
// 例如：每天 9:00, 15:00, 21:00
cronExpression: "0 9,15,21 * * *"
```

---

## 🎨 自定义配置

### 调整采集数量

编辑节点: **"采集热点文章"**
```javascript
queryParameters: {
  limit: "20",        // 增加到 20 篇
  minScore: "50000"   // 提高热度阈值到 5 万
}
```

### 修改筛选条件

编辑节点: **"筛选爆款（TOP3）"**
```javascript
// 修改筛选逻辑
const filtered = articles.filter(article => {
  // 自定义条件
  if (article.hotScore < 20000) return false;  // 热度 > 2万
  if (article.title.length > 30) return false; // 标题 < 30字

  // 只要包含特定关键词
  const includeKeywords = ['AI', '科技', '创新'];
  if (!includeKeywords.some(kw => article.title.includes(kw))) return false;

  return true;
});

// 修改取前5篇
const top5 = filtered.slice(0, 5);
```

### 添加通知

在最后添加通知节点（钉钉/企业微信/邮件）:

```javascript
// 发送钉钉通知示例
{
  "msgtype": "markdown",
  "markdown": {
    "title": "发布报告",
    "text": `### 📊 ${new Date().toLocaleString()} 发布完成\n\n` +
            `✅ 成功: {{ $json.successCount }} 篇\n` +
            `❌ 失败: {{ $json.failedCount }} 篇`
  }
}
```

---

## 🔧 故障排查

### 问题 1: 采集 API 返回空数组

**原因**: 网站结构变化或网络问题

**解决**:
```bash
# 手动测试
curl "http://localhost:3000/api/hot-news?limit=5&minScore=1000"

# 检查日志
vercel logs
```

**降级方案**: 降低 `minScore` 到 1000

---

### 问题 2: COZE 节点超时

**原因**: COZE API 响应慢

**解决**:
1. 增加超时时间到 120 秒
2. 减少每批处理数量（从 3 篇降到 2 篇）
3. 添加重试逻辑

---

### 问题 3: 微信发布失败

**常见错误码**:

| 错误码 | 原因 | 解决方法 |
|--------|------|----------|
| 40001  | access_token 过期 | 等待自动刷新（2小时有效期）|
| 40164  | IP 未白名单 | 添加 223.73.236.232 |
| 45009  | 接口调用超频 | 增加间隔时间（当前2秒）|
| 40130  | 素材不合法 | 检查图片格式和大小 |

**调试方法**:
```bash
# 查看完整错误信息
# 在 N8N 节点输出中查看 json.error
```

---

## 📊 性能优化

### 1. 缓存优化
在 `api/hot-news.js` 中添加缓存:
```javascript
const CACHE = {
  data: null,
  timestamp: 0,
  ttl: 30 * 60 * 1000  // 30分钟
};

if (Date.now() - CACHE.timestamp < CACHE.ttl) {
  return res.json(CACHE.data);
}
```

### 2. 并发控制
使用 `Split In Batches` 节点:
- 每批 2 篇文章
- 避免同时调用过多 COZE API

### 3. 错误重试
在关键节点添加重试:
- COZE 改写: 重试 2 次
- 微信发布: 重试 1 次
- 间隔: 10 秒

---

## 📈 数据统计

### 追踪发布效果

建议在最后添加数据记录节点:

```javascript
// 保存到数据库或 Google Sheets
{
  date: new Date().toISOString(),
  totalArticles: 3,
  successCount: 3,
  failedCount: 0,
  articles: [
    {
      title: "...",
      hotScore: 15000,
      publishTime: "...",
      wechatDraftId: "..."
    }
  ]
}
```

### 可视化报表

使用 Google Sheets / Notion / Airtable 记录:
- 每日发布数量
- 热点分布（科技/财经/社会）
- 平均热度分数
- 成功率趋势

---

## 🎯 进阶功能

### 1. A/B 测试
为每篇文章生成 2 个版本:
- 标题 A vs 标题 B
- 选择点击率更高的版本

### 2. 智能排期
根据历史数据分析最佳发布时间:
```javascript
// 分析过去30天的阅读量
const bestTime = analyzeBestPublishTime(last30Days);
```

### 3. 多平台发布
同时发布到:
- 微信公众号
- 知乎
- 小红书
- 头条号

### 4. 内容质量检测
在发布前添加质量检测:
- 敏感词过滤
- 原创度检测
- 可读性评分

---

## 📚 相关文件

- **N8N_AUTO_WORKFLOW_GUIDE.md** - 完整技术文档
- **n8n-auto-publish-workflow.json** - 工作流配置
- **api/hot-news.js** - 热点采集 API
- **api/format-wechat.js** - 排版优化 API
- **start-auto-publish.bat** - Windows 启动脚本
- **test_auto_publish.py** - 测试脚本

---

## 💡 最佳实践

1. **每天检查草稿箱**: 人工审核后再发布
2. **定期调整筛选条件**: 根据读者反馈优化
3. **备份工作流**: N8N 定期导出 JSON
4. **监控 API 额度**: COZE、微信 API 调用次数
5. **记录错误日志**: 便于后续优化

---

## 🆘 获取帮助

遇到问题？

1. 检查 N8N 节点输出的详细错误信息
2. 运行测试脚本: `python test_auto_publish.py`
3. 查看 Vercel 日志: `vercel logs`
4. 查看完整文档: `N8N_AUTO_WORKFLOW_GUIDE.md`

---

**创建时间**: 2026-01-04
**版本**: v1.0
**系统状态**: ✅ 可用于生产环境
