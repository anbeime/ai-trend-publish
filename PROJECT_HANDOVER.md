# AI热点自动发布系统 - 项目交接文档

**创建时间**: 2026-01-08
**项目目录**: `C:\D\ai-trend-publish`
**N8N目录**: `C:\D\n8n-master`

---

## 一、已完成功能 ✅

### 1. 微信公众号发布API（完成度：100%）

**核心文件**：
- `draft-api.py` - Flask API服务，端口8001
- `wechat_sdk.py` - 微信SDK封装

**配置信息**：
```python
APP_ID = "wx8410119dfbb7f756"
APP_SECRET = "3c93e33e087e57b906f5c341aa5223b9"
```

**API端点**：
- `POST http://127.0.0.1:8001/publish-draft`
- 请求格式：
```json
{
  "title": "文章标题",
  "content": "<p>HTML内容</p>"
}
```

**启动命令**：
```bash
cd C:\D\ai-trend-publish
python draft-api.py
```

**测试脚本**：
- `test_wechat_draft.py` - 已测试成功

### 2. IP白名单问题（已解决）

**问题**：微信公众号API需要IP白名单

**解决方案**：
1. 使用Vercel部署代理API
2. Vercel出口IP已加入白名单
3. Vercel项目：`https://your-domain.vercel.app/api/index`

**相关文档**：
- `PUBLIC_ACCOUNT_IP_WHITELIST_GUIDE.md`
- `WECHAT_PUBLISH_API_GUIDE.md`

### 3. COZE工作流集成（已配置）

**COZE配置**：
- Workflow ID: `7573873083216707599`
- 认证凭证：已配置在N8N中（id: TvfNOcKMWRC0DswG）
- 输入参数名：`input`
- 功能：接收文章内容，生成带图片的HTML

### 4. 热点采集API（已部署）

**API地址**：
- `http://localhost:3000/api/hot-news`
- 支持的热榜源：知乎、B站、微博、36kr、IT之家等

**实现文件**：
- `api/hot-news.js`

---

## 二、N8N工作流状态

### 当前工作流信息

**工作流ID**: `SoLRVvusHdvXBodD`
**工作流名称**: 公众号+coze自动发布文章
**访问链接**: http://localhost:5678/workflow/SoLRVvusHdvXBodD

**工作流文件**：
- 最新版本：`C:\D\n8n-master\workflow_SoLRVvusHdvXBodD.json`
- 导出命令：`npx n8n export:workflow --id=SoLRVvusHdvXBodD --output=xxx.json`

### 工作流节点结构（共14个节点）

```
触发器（3个）：
1. Manual Trigger - 手动触发
2. Schedule Trigger1 - 定时触发（11:20）
3. Webhook触发器 - HTTP触发

主流程：
4. 生成热榜源列表 → bilibili/weibo/36kr/ithome
5. 采集知乎热榜 → 调用 top.miyucaicai.cn
6. 提取热点列表 → 从API响应提取items
7. 过滤偏好标签 → 筛选AI/新能源/芯片等标签
8. 限制10条 → 取前10条
9. 循环处理URL → splitInBatches逐条处理
10. 抓取网页内容 → HTTP Request获取HTML
11. 提取正文内容 → Code节点清理HTML标签
12. 使用Coze改写工作流 → 调用COZE API
13. 转换数据格式 → 格式化输出
14. HTTP Request → 发布到草稿箱（8001端口）
```

---

## 三、当前问题 ⚠️

### 问题描述

**症状**：
1. 采集到的热点信息没有正确传入COZE工作流
2. COZE生成的HTML没有图片
3. 排版需要继续美化

**可能原因**：
1. "提取正文内容"节点的HTML解析有问题
2. COZE工作流收到的内容格式不对
3. 数据在节点之间传递时丢失

### 需要排查的点

1. **检查"抓取网页内容"节点输出**
   - 是否成功获取HTML？
   - 数据在 `json.body` 还是 `json.data` 还是 `binary.data`？

2. **检查"提取正文内容"节点**
   - 输出的 `input` 字段是否有内容？
   - 文本长度是否正常？

3. **检查COZE节点**
   - 实际发送的请求体是什么？
   - COZE返回的原始响应是什么？

### 调试方法

在N8N中运行工作流，点击每个节点查看实际输入输出数据，而不是猜测。

---

## 四、关键配置信息

### 1. N8N凭证

**COZE认证**（id: TvfNOcKMWRC0DswG）：
- Type: HTTP Header Auth
- Header Name: Authorization
- Value: Bearer [COZE_TOKEN]

### 2. 环境变量

```bash
# N8N
N8N_PORT=5678

# 微信公众号
WECHAT_APP_ID=wx8410119dfbb7f756
WECHAT_APP_SECRET=3c93e33e087e57b906f5c341aa5223b9

# draft-api
DRAFT_API_PORT=8001

# 热点API
HOT_NEWS_API_PORT=3000
```

### 3. 启动服务

```bash
# 启动N8N
cd C:\D\n8n-master
n8n start

# 启动draft-api
cd C:\D\ai-trend-publish
python draft-api.py

# 启动热点API（如需要）
cd C:\D\ai-trend-publish
npm run start
```

---

## 五、重要文件清单

### 核心代码
```
C:\D\ai-trend-publish\
├── draft-api.py              # 微信发布API（核心）
├── wechat_sdk.py             # 微信SDK封装
├── api/
│   ├── hot-news.js          # 热点采集API
│   └── format-wechat.js     # 格式化API
```

### 配置文件
```
├── package.json             # Node.js依赖
├── deno.lock                # Deno锁文件
├── wrangler.toml            # Cloudflare配置
```

### 测试脚本
```
├── test_wechat_draft.py     # 草稿发布测试（已通过）
├── test_complete_flow.py    # 完整流程测试
```

### 文档
```
├── WECHAT_PUBLISH_API_GUIDE.md              # 微信API使用指南
├── PUBLIC_ACCOUNT_IP_WHITELIST_GUIDE.md     # IP白名单解决方案
├── N8N_WORKFLOW_GUIDE.md                     # 工作流说明（部分过时）
├── WORKFLOW_FIXED.md                         # 最后的修复记录
```

### N8N工作流
```
C:\D\n8n-master\
├── workflow_SoLRVvusHdvXBodD.json   # 当前工作流（最新）
```

---

## 六、下一步建议

### 方案A：继续调试现有工作流

1. 在N8N界面手动运行工作流
2. 逐个节点查看实际数据输出
3. 找到数据丢失的具体节点
4. 针对性修复

### 方案B：简化工作流

跳过N8N，直接用Python脚本：
```python
# 伪代码
hot_news = fetch_from_api()  # 调用热点API
for item in hot_news:
    html = fetch_webpage(item.url)
    text = extract_content(html)
    result = call_coze(text)  # 调用COZE
    publish_draft(result)  # 发布草稿
```

### 方案C：只用COZE处理URL

修改COZE工作流，让它支持直接接收URL并自己去抓取内容。

---

## 七、交接要点

### 告诉新AI的关键信息

1. **微信发布功能已完全可用**
   - draft-api.py 在8001端口运行正常
   - 可以成功发布草稿到公众号
   - 测试脚本：test_wechat_draft.py

2. **COZE集成已配置好**
   - Workflow ID: 7573873083216707599
   - 输入参数：`input`（接收文章正文）
   - 输出：生成带图片的HTML

3. **问题在N8N工作流的数据传递**
   - "抓取网页内容"→"提取正文内容"→"COZE改写" 这条链路有问题
   - 需要实际查看每个节点的输出数据
   - 不要凭猜测修改，要看实际数据

4. **避免的坑**
   - 不要直接改数据库
   - 不要创建新工作流（已有的工作流大部分节点是对的）
   - 不要改COZE的输入参数名（就是`input`）

---

## 八、联系信息

**微信公众号**：
- APP ID: wx8410119dfbb7f756

**服务端口**：
- N8N: 5678
- draft-api: 8001
- 热点API: 3000

**项目GitHub**（如有）：
- [待补充]

---

**最后更新**: 2026-01-08
**状态**: 90%功能已完成，N8N工作流数据传递待修复
**优先级**: 修复"提取正文内容"节点的HTML解析逻辑

---

## 九、快速验证命令

```bash
# 1. 测试微信发布API
python test_wechat_draft.py

# 2. 测试热点采集
curl http://localhost:3000/api/hot-news?limit=5

# 3. 查看N8N工作流
http://localhost:5678/workflow/SoLRVvusHdvXBodD

# 4. 导出最新工作流
cd C:\D\n8n-master
npx n8n export:workflow --id=SoLRVvusHdvXBodD --output=latest.json
```

---

**交接完毕。祝新AI顺利！**
