# 社交媒体上传API服务

## 📋 概述

对接HD_HUMAN项目中的社交媒体上传器，实现多平台视频自动发布。

### 功能特性

- ✅ 抖音自动上传
- ✅ 小红书自动上传
- ✅ Bilibili自动上传
- ✅ 快手自动上传
- ✅ TikTok自动上传
- 🚧 百家号（开发中）
- 🚧 YouTube（计划中）

### 部署架构

```
小程序前端
    ↓ (wx.cloud.callFunction)
微信云函数 (social-media-proxy)
    ↓ (HTTP请求)
本API服务 (upload-api.py - FastAPI)
    ↓ (动态导入)
HD_HUMAN上传器 (social-auto-upload-main)
    ↓ (浏览器自动化)
社交媒体平台 (抖音/小红书/B站/快手/TikTok)
```

## 🚀 快速开始

### 1. 环境准备

确保服务器已安装：

- Python 3.10+
- pip

### 2. 配置HD_HUMAN项目

将HD_HUMAN项目的 `social-auto-upload-main` 目录放置在合适位置：

```
miniprogram-agent/
├── upload-api.py          # FastAPI服务
├── requirements.txt       # Python依赖
├── .env                 # 环境变量
└── social-auto-upload-main/  # HD_HUMAN上传器项目
    ├── uploader/
    │   ├── douyin_uploader/
    │   ├── xhs_uploader/
    │   ├── bilibili_uploader/
    │   └── ...
    ├── utils/
    └── requirements.txt
```

### 3. 安装依赖

```bash
cd C:\D\compet\tengxun\miniprogram-agent
pip install -r requirements.txt
```

### 4. 配置环境变量

创建 `.env` 文件（可选，也可以直接设置系统环境变量）：

```env
# API服务配置
API_PORT=8002
DEBUG=false

# HD_HUMAN项目路径（如果不在当前目录）
HD_HUMAN_PATH=C:\E\HD_HUMAN开源\HD_HUMAN\social-auto-upload-main
```

### 5. 启动服务

```bash
python upload-api.py
```

服务将启动在：

- http://0.0.0.0:8002

## 📖 API文档

### 健康检查

```http
GET /api/health
```

**响应：**

```json
{
  "status": "ok",
  "service": "Social Media Upload API",
  "timestamp": "2024-02-14T10:30:00Z"
}
```

### 获取平台列表

```http
GET /api/platforms
```

**响应：**

```json
{
  "success": true,
  "platforms": [
    {
      "id": "douyin",
      "name": "抖音",
      "icon": "🎵",
      "status": "active"
    },
    {
      "id": "xiaohongshu",
      "name": "小红书",
      "icon": "📕",
      "status": "active"
    },
    {
      "id": "bilibili",
      "name": "B站",
      "icon": "📺",
      "status": "active"
    },
    {
      "id": "kuaishou",
      "name": "快手",
      "icon": "🎥",
      "status": "active"
    },
    {
      "id": "tiktok",
      "name": "TikTok",
      "icon": "🎬",
      "status": "active"
    }
  ]
}
```

### 上传到单个平台

```http
POST /api/upload/{platform}

Content-Type: multipart/form-data

参数:
- video: 视频文件
- title: 视频标题
- tags: 标签（可选）
- account: 账号标识，默认 "default"

支持的平台:
- douyin - 抖音
- xiaohongshu - 小红书
- bilibili - B站
- kuaishou - 快手
- tiktok - TikTok
- baijiahao - 百家号
- youtube - YouTube
```

**请求示例：**

```bash
curl -X POST \
  -F "video=@/path/to/video.mp4" \
  -F "title=我的视频标题" \
  -F "tags=#AI #科技 #创新" \
  http://0.0.0.0:8002/api/upload/douyin
```

**成功响应：**

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "platform": "douyin",
    "title": "我的视频标题",
    "result": "success"
  }
}
```

**失败响应：**

```json
{
  "code": -1,
  "message": "上传失败：账号未登录",
  "data": null
}
```

### 批量上传

```http
POST /api/batch

Content-Type: application/x-www-form-urlencoded

参数:
- videoUrl: 视频URL（云存储URL或公网URL）
- title: 视频标题
- tags: 标签（可选）
- account: 账号标识，默认 "default"
- platforms: 平台列表JSON数组字符串

示例:
["douyin", "xiaohongshu", "bilibili"]
```

**请求示例：**

```bash
curl -X POST \
  -d "videoUrl=https://example.com/video.mp4" \
  -d "title=批量测试视频" \
  -d "tags=#热门 #推荐" \
  -d 'platforms=["douyin", "xiaohongshu"]' \
  http://0.0.0.0:8002/api/batch
```

**成功响应：**

```json
{
  "success": true,
  "results": [
    {
      "platform": "douyin",
      "success": true,
      "data": {
        "platform": "douyin",
        "title": "批量测试视频",
        "result": "success"
      }
    },
    {
      "platform": "xiaohongshu",
      "success": false,
      "error": "小红书API错误"
    },
    {
      "platform": "bilibili",
      "success": true,
      "data": {
        "platform": "bilibili",
        "title": "批量测试视频",
        "result": "success"
      }
    }
  ],
  "summary": {
    "total": 3,
    "success": 2,
    "failed": 1
  }
}
```

## 🔧 配置说明

### 上传器加载机制

API服务启动时会动态尝试加载HD_HUMAN项目中的上传器模块：

1. **查找上传器目录**：在 `social-auto-upload-main/uploader/` 下查找各平台上传器
2. **动态导入**：
   - 优先使用 `main.py` 导入
   - 尝试识别 `DouYinVideo`、`XhsVideo`、`BilibiliVideo` 等类
   - 尝试识别 `upload` 函数
3. **状态检查**：启动日志会显示哪些上传器成功加载，哪些加载失败

### 调试模式

设置环境变量 `DEBUG=true` 可启用详细日志：

```bash
DEBUG=true python upload-api.py
```

### 端口配置

默认端口：`8002`

可通过环境变量 `API_PORT` 修改：

```env
API_PORT=9000
```

## 🚨 错误处理

### 响应码

| 状态码 | 说明                                   |
| ------ | -------------------------------------- |
| 200    | 请求成功                               |
| 400    | 参数错误（缺少必需字段、平台不支持等） |
| 500    | 服务器内部错误                         |

### 错误响应格式

```json
{
  "code": -1,
  "message": "错误描述",
  "data": null
}
```

## 🔒 安全建议

### 1. HTTPS配置

生产环境强烈建议使用HTTPS：

1. 配置Nginx反向代理
2. 申请SSL证书（Let's Encrypt免费）
3. 修改环境变量中的API地址

### 2. 访问控制

在生产环境中，可以添加IP白名单或认证机制：

```python
# 在upload-api.py中添加
ALLOWED_IPS = os.getenv('ALLOWED_IPS', '').split(',')

@app.middleware("...")
async def check_ip_middleware(request: Request, call_next):
    client_ip = request.client.host
    if ALLOWED_IPS and client_ip not in ALLOWED_IPS:
        return JSONResponse(
            status_code=403,
            content={"error": "Forbidden"}
        )
    return await call_next(request)
```

### 3. 文件大小限制

可以在FastAPI中添加文件大小限制：

```python
from fastapi import UploadFile

@app.post("/api/upload/{platform}")
async def upload_to_platform(
    platform: str,
    video: UploadFile = File(..., max_size=500 * 1024 * 1024)  # 500MB
    ...
):
```

### 4. 速率限制

使用 `slowapi` 添加速率限制：

```bash
pip install slowapi[standard]
```

```python
from slowapi import Limiter, _rate_and_expires

limiter = Limiter(key_func=get_remote_address, rate="10/minute")

@app.post("/api/upload/{platform}")
@limiter.limit("10/minute")
async def upload_to_platform(...):
    ...
```

## 📊 监控与日志

### 查看日志

服务启动后会在控制台输出详细日志：

- `[INFO]` - 常规信息
- `[DEBUG]` - 调试信息（需要启用DEBUG模式）
- `[ERROR]` - 错误信息

### 生产环境建议

1. **使用日志管理**：如 `loguru` 或 `structlog`
2. **监控服务状态**：使用进程管理工具（PM2、Supervisor、systemd）
3. **配置告警**：上传失败时发送通知
4. **定期检查日志**：设置日志轮转，避免日志过大

## 🐛 常见问题

### 1. 上传器未加载

**问题**：启动时显示某个平台上传器加载失败

**原因**：

- HD_HUMAN项目路径不正确
- 上传器模块结构不符合预期
- Python依赖未安装

**解决方案**：

1. 检查 `.env` 文件中的 `HD_HUMAN_PATH` 配置
2. 确保 `social-auto-upload-main` 目录存在
3. 安装HD_HUMAN项目的依赖：
   ```bash
   cd social-auto-upload-main
   pip install -r requirements.txt
   ```

### 2. 视频文件过大

**问题**：上传失败，提示文件大小超限

**解决方案**：

1. 压缩视频文件
2. 检查平台文件大小限制
3. 考虑分片上传（如果上传器支持）

### 3. 网络超时

**问题**：上传过程中超时

**解决方案**：

1. 增加上传超时时间
2. 检查服务器网络连接
3. 使用后台任务队列处理长时间上传

### 4. 账号配置

**问题**：上传失败，提示账号未登录

**解决方案**：

1. 确保HD_HUMAN上传器中已配置正确的账号信息
2. 检查账号Cookie是否过期
3. 重新登录获取新Cookie

## 📱 小程序集成

### 更新云函数环境变量

在微信云开发控制台：

1. 进入云函数页面
2. 选择 `social-media-proxy` 云函数
3. 点击"配置"按钮
4. 添加环境变量：
   - `SOCIAL_UPLOAD_API_URL`: `http://39.108.254.228:8002`
   - `DEBUG`: `false`

### 小程序调用示例

```javascript
// 在小程序页面中调用
wx.cloud
  .callFunction({
    name: "social-media-proxy",
    data: {
      action: "upload",
      platform: "douyin",
      data: {
        videoUrl: "cloud://xxx.mp4", // 云存储URL
        title: "我的精彩视频",
        tags: "#热门 #推荐",
        account: "default",
      },
    },
  })
  .then((res) => {
    if (res.result.success === 0 || res.result.code === 0) {
      wx.showToast({
        title: "上传成功",
        icon: "success",
      });
    } else {
      wx.showToast({
        title: res.result.message || "上传失败",
        icon: "error",
      });
    }
  });
```

### 批量上传示例

```javascript
async function batchUploadToSocialMedia(videoUrl, title) {
  wx.showLoading({ title: "正在批量上传..." });

  try {
    const result = await wx.cloud.callFunction({
      name: "social-media-proxy",
      data: {
        action: "batch",
        data: {
          videoUrl: videoUrl,
          title: title,
          tags: "#AI #科技",
          platforms: JSON.stringify(["douyin", "xiaohongshu", "bilibili"]),
        },
      },
    });

    wx.hideLoading();

    const { success, results, summary } = result.result.data;

    let message = "";
    if (summary.success === summary.total) {
      message = `成功上传到 ${summary.success} 个平台`;
    } else {
      message = `成功: ${summary.success}, 失败: ${summary.failed}`;
    }

    wx.showModal({
      title: "批量上传结果",
      content: `${message}\n\n详细信息请查看控制台`,
      showCancel: false,
    });
  } catch (error) {
    wx.hideLoading();
    wx.showToast({
      title: "上传失败",
      icon: "error",
    });
    console.error("批量上传错误:", error);
  }
}
```

## 🚀 部署到服务器

### 1. 服务器准备

确保服务器已安装Python 3.10+：

```bash
python --version
```

### 2. 上传文件

将以下文件上传到服务器：

```
miniprogram-agent/
├── upload-api.py          # FastAPI服务主文件
├── requirements.txt       # Python依赖
└── social-auto-upload-main/  # HD_HUMAN上传器项目（完整）
    ├── uploader/
    ├── utils/
    ├── requirements.txt
    └── ...
```

### 3. 安装依赖

```bash
cd /path/to/miniprogram-agent
pip install -r requirements.txt
```

### 4. 配置环境

```bash
# 创建 .env 文件
echo "HD_HUMAN_PATH=/path/to/social-auto-upload-main" > .env
echo "API_PORT=8002" >> .env
echo "DEBUG=false" >> .env
```

### 5. 启动服务

```bash
# 前台启动（测试用）
python upload-api.py

# 后台启动（生产用）
nohup python upload-api.py > api.log 2>&1 &

# 或使用进程管理工具
pm2 start social-upload-api
supervisorctl start social-upload-api
```

### 6. 使用systemd管理（Linux服务器）

创建 `/etc/systemd/system/social-upload-api.service`：

```ini
[Unit]
Description=Social Media Upload API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/miniprogram-agent
ExecStart=/usr/bin/python3 /path/to/miniprogram-agent/upload-api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable social-upload-api
sudo systemctl start social-upload-api
sudo systemctl status social-upload-api
```

### 7. 配置Nginx反向代理（推荐）

创建 `/etc/nginx/sites-available/social-upload-api.conf`：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 超时设置（上传可能需要较长时间）
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # 健康检查端点
    location /api/health {
        proxy_pass http://127.0.0.1:8002;
        access_log off;
    }
}
```

重启Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 云函数控制台配置

### 配置环境变量

访问云函数配置页面：

**环境ID**：`invideo-6gidgilyee392cc8`
**云函数**：`social-media-proxy`

添加以下环境变量：

| 变量名                  | 值                           | 说明                              |
| ----------------------- | ---------------------------- | --------------------------------- |
| `SOCIAL_UPLOAD_API_URL` | `http://39.108.254.228:8002` | 外部API服务地址（你的服务器地址） |
| `DEBUG`                 | `false`                      | 调试模式关闭                      |

### 云函数日志

在云开发控制台查看云函数日志：

- 实时监控API调用情况
- 调试错误信息
- 查看上传器加载状态

## 🔗 相关资源

- **HD_HUMAN上传器项目**：`C:\E\HD_HUMAN开源\HD_HUMAN\social-auto-upload-main`
- **微信云开发**：[https://tcb.cloud.tencent.com](https://tcb.cloud.tencent.com)
- **FastAPI文档**：[https://fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **小程序云函数**：[https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 📝 更新日志

### v1.0.0 (2026-02-14)

- ✅ 初始版本
- ✅ 支持抖音、小红书、B站、快手、TikTok
- ✅ 单平台上传接口
- ✅ 批量上传接口
- ✅ 健康检查接口
- ✅ 平台列表查询接口
- ✅ 上传器动态加载机制
- ✅ 完整的文档和部署指南

## 🤝 技术支持

如遇到问题：

1. 检查API服务日志
2. 查看HD_HUMAN上传器项目文档
3. 检查云函数日志
4. 参考本文档中的常见问题部分
