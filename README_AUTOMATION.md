# 微信公众号自动发布系统 - 完整配置说明

## 系统架构

```
热点采集 → COZE改写 → N8N编排 → draft-api.py → 微信草稿箱
```

## 运行的服务

### 1. draft-api.py (端口8001)
- **功能**: 接收文章，处理图片上传，发布到微信
- **启动**:
  ```bash
  cd C:\D\ai-trend-publish
  python draft-api.py
  ```
- **健康检查**: http://127.0.0.1:8001/health

### 2. N8N工作流
- **端口**: 5678
- **工作流**: "公众号+coze自动发布文章"
- **已配置**:
  - COZE API调用
  - HTTP Request → http://127.0.0.1:8001/publish-draft
  - 传递参数: title, content, cover_url

### 3. COZE工作流
- **ID**: 7573873083216707599
- **输出格式**:
  - **方案A (推荐)**: 完整HTML文档，带样式和图片
  - **方案B**: Markdown格式 (draft-api自动转HTML)

## 自动化脚本

### auto_publish.py - 完整自动采集发布
```bash
python C:\D\ai-trend-publish\auto_publish.py
```

**功能**:
- 采集20条热点（优先过滤18个偏好标签）
- COZE改写10篇文章
- 自动发布到微信草稿箱

**配置** (已完成):
- HOT_SOURCES: 今日热榜、知乎热榜、微博热搜等6个源
- PREFERENCE_TAGS: 新能源、AI、芯片、量化等18个标签
- COZE_AUTH_TOKEN: 已配置 (600k点数)
- FIRE_CRAWL_API_KEY: 已配置

## 已解决的问题

### ✅ 图片显示
- Markdown: 自动下载并上传到微信服务器
- HTML: 直接使用COZE的图片链接（外链在编辑器可显示）

### ✅ 样式排版
- **当前方案**: COZE输出HTML，draft-api直接使用
- **备用方案**: draft-api转换Markdown（支持H2/H3标题样式、列表、加粗等）

### ✅ N8N连接问题
- 改用127.0.0.1代替localhost（更稳定）
- **需要**: 重启N8N使配置生效

## 文件说明

| 文件 | 用途 |
|------|------|
| draft-api.py | Flask服务，处理微信发布 |
| auto_publish.py | 完整自动化脚本（采集→改写→发布） |
| wechat_sdk.py | 微信公众号API封装 |
| .env | 存储API密钥和凭证 |

## 测试命令

### 1. 测试draft-api服务
```bash
curl http://127.0.0.1:8001/health
```

### 2. 测试完整发布流程
```bash
python C:\D\ai-trend-publish\test_real_html.py
```

### 3. 运行自动采集发布
```bash
python C:\D\ai-trend-publish\auto_publish.py
```

## 下一步操作

1. **重启N8N**
   ```bash
   # 停止N8N
   taskkill /F /IM n8n.exe
   # 重新启动N8N
   n8n
   ```

2. **测试N8N工作流**
   - 打开N8N: http://localhost:5678
   - 执行"公众号+coze自动发布文章"工作流
   - 检查是否成功发布到草稿箱

3. **设置定时任务** (可选)
   - 使用Windows任务计划程序
   - 每天定时运行auto_publish.py
   - 建议时间: 每天早上9点

## 故障排查

### N8N HTTP Request报错"connection refused"
- 检查draft-api.py是否运行: `curl http://127.0.0.1:8001/health`
- 重启N8N加载新配置
- 检查防火墙设置

### 图片不显示
- Markdown格式: draft-api会自动上传图片到微信
- HTML格式: 外链图片在编辑器可预览，发布后可能需要替换

### COZE改写失败
- 检查COZE_AUTH_TOKEN是否有效
- 检查点数余额: 当前600k
- 查看auto_publish.py日志

## 微信后台
https://mp.weixin.qq.com

草稿箱 → 查看发布的文章

---

**当前状态**: ✅ 系统已配置完成，等待N8N重启测试
