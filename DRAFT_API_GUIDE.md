# draft-api.py 使用指南

## 概述

draft-api.py 是一个 Flask 服务，用于自动采集热点、生成公众号爆款文章并推送到发布服务器。

## 功能特性

### 1. 热点采集

- ✅ 微博热搜（模拟数据）
- ✅ 抖音热点（模拟数据）
- ✅ 今日头条热点（模拟数据）

### 2. 智能评分

- ✅ 10分制多维度评分
- ✅ 热度值（40%）
- ✅ 标题吸引力（30%）
- ✅ 时效性（20%）
- ✅ 可读性（10%）

### 3. 文章生成

- ✅ HTML格式，内联CSS样式
- ✅ 封面图生成（混元/智谱AI）
- ✅ 内容图片生成（4-5张）
- ✅ 热点标签（3个）
- ✅ 关键字段高亮
- ✅ 精美排版样式

### 4. 图片生成

- ✅ **混元模型**（腾讯混元AI）- 优先使用
  - API: `TextToImageAsync`
  - 分辨率: 1024x1024 / 768x768
  - 风格: 默认风格
- ✅ **智谱AI**（cogview-3-flash）- 备用方案
  - API: `https://open.bigmodel.cn/api/paas/v4/images/generations`
  - 模型: `cogview-3-flash`
  - 分辨率: 1024x1024

### 5. 推送发布

- ✅ POST到 http://39.108.254.228:8002/publish-draft
- ✅ 超时时间：120秒
- ✅ JSON格式数据

## 环境配置

### 1. 创建 .env 文件

```bash
# 复制示例文件
cp .env.example .env
```

### 2. 编辑 .env 文件

```env
# 微信公众号配置（必需）
WEIXIN_APP_ID=your_wechat_appid
WEIXIN_APP_SECRET=your_wechat_secret

# 腾讯混元AI配置（可选，推荐配置）
# 获取方式：https://console.cloud.tencent.com/cam/capi
HUNYUAN_SECRET_ID=your_id
HUNYUAN_SECRET_KEY=your_key

# 智谱AI配置（请替换为您自己的密钥）
ZHIPU_API_KEY=your_zhipu_api_key_here
```

### 3. 安装依赖

```bash
pip install flask flask-cors requests python-dotenv markdown
```

## 使用方法

### 启动服务

```bash
python draft-api.py
```

服务启动后会显示：

```
========================================
    WeChat Draft API Server
========================================
✓ Running on: http://0.0.0.0:8001
✓ Health Check: GET /health
✓ Auto Publish: POST /auto-publish (推送到 http://39.108.254.228:8002/publish-draft)
✓ Publish Draft: POST /publish-draft
========================================
```

### API端点

#### 1. 健康检查

```bash
curl http://localhost:8001/health
```

响应：

```json
{
  "status": "ok",
  "service": "WeChat Draft Publisher"
}
```

#### 2. 完整流程（推荐）

```bash
curl -X POST http://localhost:8001/auto-publish
```

流程：

1. 采集今日热点
2. 10分制评分选出最爆款
3. 生成图文并茂的文章（含封面和内容图）
4. POST推送到 http://39.108.254.228:8002/publish-draft

响应：

```json
{
  "success": true,
  "hot_topic": {
    "title": "2026年人工智能新突破",
    "heat": 3500000,
    "category": "科技",
    "score": 9.5
  },
  "article": {
    "title": "标题",
    "content_length": 12345,
    "cover_url": "封面图URL"
  },
  "push_result": {
    "success": true,
    "status_code": 200,
    "response": {}
  }
}
```

#### 3. 发布草稿

```bash
curl -X POST http://localhost:8001/publish-draft \
  -H "Content-Type: application/json" \
  -d '{
    "title": "文章标题",
    "content": "HTML内容",
    "cover_url": "封面图URL"
  }'
```

### 测试脚本

创建 `test_auto_publish.py`：

```python
import requests
import json

# 调用完整流程
response = requests.post('http://localhost:8001/auto-publish')
result = response.json()

print("=" * 50)
print("自动发布流程结果")
print("=" * 50)
print(json.dumps(result, ensure_ascii=False, indent=2))
```

运行测试：

```bash
python test_auto_publish.py
```

## 图片生成流程

### 1. 封面图生成

根据文章标题和分类生成封面图：

```python
prompt = f"微信公众号文章封面图，{category}主题，{title}，高清，专业，现代风格，中文文字，简洁大气，1024x1024"
```

**优先级：**

1. 混元模型（如果配置了密钥）
2. 智谱AI（备用方案）
3. 占位图（都失败时）

### 2. 内容图片生成

为文章生成4-5张内容配图：

```
1. {title}背景图
2. {title}数据图表
3. {title}示意图
4. {title}应用场景
5. {title}未来展望
```

每张图片间隔0.5秒，避免API限流。

## 混元模型配置指南

### 1. 开通服务

1. 登录腾讯云控制台：https://console.cloud.tencent.com/
2. 开通腾讯混元AI服务
3. 选择合适的套餐（按量付费或包年包月）

### 2. 获取密钥

1. 进入「访问管理」->「API密钥管理」
2. 创建新的密钥
3. 记录 `SecretId` 和 `SecretKey`

### 3. 配置密钥

编辑 `.env` 文件：

```env
HUNYUAN_SECRET_ID=your_id
HUNYUAN_SECRET_KEY=your_key
```

### 4. 验证配置

启动服务并调用 `/auto-publish`，查看日志：

```
   [混元] 正在生成图片: 微信公众号文章封面图，科技主题，...
   [混元] 异步任务ID: task_xxxxxxxxx
   [混元] 异步任务暂不支持，使用占位图
```

如果看到异步任务提示，说明密钥配置正确。当前版本暂不支持轮询任务状态，将使用占位图。

## 故障排查

### 1. 混元密钥未配置

**现象：**

```
   [混元] 密钥未配置，将使用占位图
```

**解决：**
配置 `.env` 文件中的 `HUNYUAN_SECRET_ID` 和 `HUNYUAN_SECRET_KEY`

### 2. 图片生成失败

**现象：**

```
   [混元] 生成失败: ...
```

**解决：**

- 检查密钥是否正确
- 检查腾讯云账户余额
- 检查是否开通混元AI服务

### 3. 推送超时

**现象：**

```
   ✗ 推送失败: 请求超时（120秒）
```

**解决：**

- 检查目标服务器是否可访问：`ping 39.108.254.228`
- 检查端口是否开放：`telnet 39.108.254.228 8002`
- 检查防火墙设置

### 4. 模块导入失败

**现象：**

```
ModuleNotFoundError: No module named 'flask'
```

**解决：**
安装依赖：

```bash
pip install flask flask-cors requests python-dotenv markdown
```

## 性能优化

### 1. 图片生成缓存

建议添加Redis缓存，避免重复生成相同图片：

```python
import redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def generate_image_with_cache(prompt):
    cache_key = f"image:{hashlib.md5(prompt.encode()).hexdigest()}"
    cached_url = redis_client.get(cache_key)
    if cached_url:
        return cached_url.decode()

    # 生成图片
    image_url = generate_image(prompt)

    # 缓存1天
    redis_client.setex(cache_key, 86400, image_url)
    return image_url
```

### 2. 异步处理

对于大量图片生成，建议使用Celery异步任务：

```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task
def async_generate_image(prompt):
    return generate_image_with_hunyuan(prompt)
```

## 安全建议

1. **不要提交 .env 文件到版本控制**
   - 添加到 `.gitignore`
   - 只提交 `.env.example`

2. **定期更换密钥**
   - 每季度更换一次
   - 使用密钥轮换策略

3. **限制API调用频率**
   - 添加速率限制
   - 使用令牌桶算法

4. **监控日志**
   - 记录所有API调用
   - 设置异常告警

## 更新日志

### v1.1.0 (2026-02-14)

- ✅ 新增混元模型图片生成支持
- ✅ 新增智谱AI图片生成备用方案
- ✅ 优化图片生成流程
- ✅ 添加 .env 配置文件

### v1.0.0 (2026-02-13)

- ✅ 初始版本
- ✅ 热点采集功能
- ✅ 智能评分功能
- ✅ 文章生成功能
- ✅ 推送发布功能

## 联系方式

- 项目地址：[GitHub]
- 问题反馈：[Issues]
- 技术支持：[Email]
