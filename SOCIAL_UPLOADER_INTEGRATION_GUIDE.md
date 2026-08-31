# 社交媒体上传器集成指南

## 📋 项目概述

### HD_HUMAN 项目中的社交媒体上传器
位置: `C:\E\HD_HUMAN开源\HD_HUMAN\social-auto-upload-main`

**功能特性:**
- ✅ 抖音自动上传
- ✅ 视频号自动上传  
- ✅ Bilibili自动上传
- ✅ 小红书自动上传
- ✅ 快手自动上传
- ✅ TikTok自动上传
- 🚧 百家号（开发中）
- 🚧 YouTube（计划中）

## ⚠️ 为什么不能直接移植到小程序

### 1. **技术栈完全不兼容**
```
小程序: JavaScript/TypeScript (微信客户端环境)
上传器: Python + Playwright (服务器/本地环境)
```

### 2. **运行环境限制**
- **小程序环境**: 只能在微信客户端中运行，沙箱环境严格限制
- **上传器需求**: 需要完整的操作系统环境 + 浏览器自动化

### 3. **核心依赖无法满足**
```python
# 上传器核心依赖（requirements.txt）
playwright          # 浏览器自动化（需要安装 Chromium/Firefox）
requests            # HTTP请求
eventlet            # 异步事件处理
schedule            # 定时任务
biliup             # B站上传SDK
xhs                # 小红书SDK
```

**问题:**
- Playwright需要安装完整浏览器（Chromium约170MB）
- 需要本地Chrome浏览器环境
- Python运行时环境（约50MB+）
- 总体积可能超过 **300MB+**

### 4. **小程序包大小限制**
```
主包限制: 2MB
分包限制: 2MB/个
总包限制: 20MB (最大可申请到24MB)
```

**上传器体积远超限制，无法打包！**

### 5. **执行环境差异**
- 小程序云函数有严格的**超时限制**（60秒）
- 视频上传可能需要数分钟甚至更长
- 需要长期运行的后台服务支持

## ✅ 推荐集成方案

### 方案一：部署为独立API服务（推荐）

#### 架构图
```
┌─────────────────┐      HTTP API      ┌──────────────────────┐
│  微信小程序      │ ──────────────────> │  上传服务API         │
│  (前端UI)       │                    │  (Python FastAPI)    │
└─────────────────┘                    └──────────────────────┘
                                                 │
                                                 ▼
                                       ┌──────────────────────┐
                                       │  social-auto-upload  │
                                       │  (核心上传逻辑)       │
                                       └──────────────────────┘
                                                 │
                    ┌────────────────────────────┼───────────────────────┐
                    ▼                            ▼                       ▼
              ┌──────────┐                ┌──────────┐            ┌──────────┐
              │   抖音    │                │  小红书   │            │  B站     │
              └──────────┘                └──────────┘            └──────────┘
```

#### 步骤1: 创建API服务

创建 `api_server.py`:
```python
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
from pathlib import Path
import sys

# 导入上传器
sys.path.append(str(Path(__file__).parent / 'social-auto-upload-main'))
from uploader.douyin_uploader.main import DouYinVideo
from uploader.tencent_uploader.main import TencentVideo
from uploader.xhs_uploader.main import XhsVideo

app = FastAPI(title="社交媒体上传API")

# 允许小程序跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload/douyin")
async def upload_to_douyin(
    video: UploadFile = File(...),
    title: str = Form(...),
    tags: str = Form(""),
    account: str = Form("default")
):
    """上传视频到抖音"""
    try:
        # 保存视频文件
        video_path = f"temp/{video.filename}"
        os.makedirs("temp", exist_ok=True)
        
        with open(video_path, "wb") as f:
            content = await video.read()
            f.write(content)
        
        # 创建meta文件
        meta_path = video_path.replace('.mp4', '.txt')
        with open(meta_path, 'w', encoding='utf-8') as f:
            f.write(f"{title}\n{tags}")
        
        # 上传视频
        app_douyin = DouYinVideo(title, video_path, tags, 0, account)
        await app_douyin.main()
        
        return {
            "code": 0,
            "message": "上传成功",
            "data": {
                "platform": "douyin",
                "title": title
            }
        }
    except Exception as e:
        return {
            "code": -1,
            "message": f"上传失败: {str(e)}"
        }

@app.post("/api/upload/xiaohongshu")
async def upload_to_xhs(
    video: UploadFile = File(...),
    title: str = Form(...),
    tags: str = Form(""),
    account: str = Form("default")
):
    """上传视频到小红书"""
    # 类似实现
    pass

@app.post("/api/upload/bilibili")
async def upload_to_bilibili(
    video: UploadFile = File(...),
    title: str = Form(...),
    tags: str = Form(""),
    account: str = Form("default")
):
    """上传视频到B站"""
    # 类似实现
    pass

@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 步骤2: 创建 Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# 复制项目文件
COPY social-auto-upload-main/ ./social-auto-upload-main/
COPY api_server.py ./

# 安装Python依赖
RUN pip install -r social-auto-upload-main/requirements.txt
RUN pip install fastapi uvicorn python-multipart
RUN playwright install chromium

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["python", "api_server.py"]
```

#### 步骤3: Docker部署
```bash
# 构建镜像
docker build -t social-uploader-api .

# 运行容器
docker run -d -p 8000:8000 \
  -v $(pwd)/cookies:/app/social-auto-upload-main/cookies \
  -v $(pwd)/videos:/app/videos \
  --name uploader-api \
  social-uploader-api
```

#### 步骤4: 小程序调用示例
```javascript
// pages/agents/modules/social-uploader.js

class SocialUploader {
  constructor() {
    this.apiBase = 'http://your-server-ip:8000/api';
    // 生产环境建议使用 HTTPS 和域名
    // this.apiBase = 'https://api.yourdomain.com';
  }

  /**
   * 上传视频到抖音
   */
  async uploadToDouyin(videoPath, title, tags, account = 'default') {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.apiBase}/upload/douyin`,
        filePath: videoPath,
        name: 'video',
        formData: {
          title: title,
          tags: tags,
          account: account
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data);
          } else {
            reject(new Error(data.message));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 上传视频到小红书
   */
  async uploadToXiaohongshu(videoPath, title, tags, account = 'default') {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.apiBase}/upload/xiaohongshu`,
        filePath: videoPath,
        name: 'video',
        formData: {
          title: title,
          tags: tags,
          account: account
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data);
          } else {
            reject(new Error(data.message));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 批量上传到多个平台
   */
  async uploadToMultiplePlatforms(videoPath, config) {
    const platforms = config.platforms || ['douyin', 'xiaohongshu', 'bilibili'];
    const results = [];

    for (const platform of platforms) {
      try {
        let result;
        switch(platform) {
          case 'douyin':
            result = await this.uploadToDouyin(
              videoPath, 
              config.title, 
              config.tags, 
              config.account
            );
            break;
          case 'xiaohongshu':
            result = await this.uploadToXiaohongshu(
              videoPath, 
              config.title, 
              config.tags, 
              config.account
            );
            break;
          // 添加更多平台...
        }
        results.push({
          platform,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = SocialUploader;
```

#### 步骤5: 在agents页面中使用
```javascript
// pages/agents/agents.js
const SocialUploader = require('./modules/social-uploader.js');

Page({
  data: {
    videoPath: '',
    uploadResults: []
  },

  async onPublishToSocialMedia() {
    const uploader = new SocialUploader();
    
    wx.showLoading({ title: '正在发布...' });

    try {
      const results = await uploader.uploadToMultiplePlatforms(
        this.data.videoPath,
        {
          title: '我的视频标题',
          tags: '#AI #科技 #创新',
          platforms: ['douyin', 'xiaohongshu', 'bilibili'],
          account: 'default'
        }
      );

      this.setData({ uploadResults: results });
      
      wx.showToast({
        title: '发布完成',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '发布失败',
        icon: 'error'
      });
      console.error('Upload error:', error);
    } finally {
      wx.hideLoading();
    }
  }
});
```

### 方案二：云函数代理（轻量级）

如果不想部署独立服务器，可以使用云函数作为代理：

```javascript
// cloudfunctions/social-media-proxy/index.js
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { action, platform, videoUrl, title, tags, account } = event;

  // 调用你部署的上传服务API
  const API_BASE = 'http://your-uploader-api.com';

  try {
    const response = await axios.post(
      `${API_BASE}/upload/${platform}`,
      {
        videoUrl,  // 使用云存储URL，让API服务下载
        title,
        tags,
        account
      }
    );

    return {
      code: 0,
      data: response.data
    };
  } catch (error) {
    return {
      code: -1,
      message: error.message
    };
  }
};
```

## 🚀 部署选项对比

| 方案 | 优点 | 缺点 | 成本 |
|------|------|------|------|
| **Docker部署** | 易于部署、环境隔离、可扩展 | 需要服务器 | 约¥50-200/月 |
| **云服务器** | 稳定可靠、公网访问 | 配置较复杂 | 约¥100-500/月 |
| **本地服务** | 完全免费、调试方便 | 需要内网穿透、稳定性差 | 免费 |
| **Serverless** | 按需付费、自动扩展 | 冷启动慢、有执行时间限制 | 约¥10-100/月 |

## 📦 完整部署包结构

建议创建独立的部署包：

```
social-uploader-service/
├── social-auto-upload-main/    # HD_HUMAN项目中的上传器
│   ├── uploader/
│   ├── utils/
│   ├── requirements.txt
│   └── ...
├── api_server.py               # FastAPI服务
├── Dockerfile                  # Docker配置
├── docker-compose.yml          # Docker Compose配置
├── nginx.conf                  # Nginx反向代理配置
├── .env                        # 环境变量
└── README.md                   # 部署说明
```

## 🔧 配置说明

### 1. 环境变量配置 (.env)
```bash
# API服务配置
API_PORT=8000
API_HOST=0.0.0.0

# Chrome路径配置
LOCAL_CHROME_PATH=/usr/bin/chromium

# 账号配置
DOUYIN_ACCOUNT=your_account
XIAOHONGSHU_ACCOUNT=your_account
```

### 2. Nginx反向代理 (nginx.conf)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # 支持大文件上传
        client_max_body_size 500M;
    }
}
```

## 📚 参考资源

### 项目资源
- **源项目位置**: `C:\E\HD_HUMAN开源\HD_HUMAN\social-auto-upload-main`
- **官方仓库**: [social-auto-upload GitHub](https://github.com/search?q=social-auto-upload)
- **使用教程**: [新手级教程](https://juejin.cn/post/7372114027840208911)

### 小程序集成参考
- **当前项目**: `C:\D\compet\tengxun\miniprogram-agent`
- **现有云函数示例**: `cloudfunctions/wechat-publish-api/`
- **小红书发布示例**: `cloudfunctions/xiaohongshu-publisher/`

### 技术文档
- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [Docker官方文档](https://docs.docker.com/)
- [微信小程序网络请求](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)
- [微信小程序上传文件](https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html)

## ⚡ 快速开始

### 最简单的本地测试方案

1. **复制上传器到独立目录**
```bash
# 创建新目录
mkdir C:\D\social-uploader-service
cd C:\D\social-uploader-service

# 复制上传器
xcopy "C:\E\HD_HUMAN开源\HD_HUMAN\social-auto-upload-main" . /E /I
```

2. **安装依赖**
```bash
pip install -r requirements.txt
pip install fastapi uvicorn python-multipart
playwright install chromium
```

3. **创建并运行API服务**
```bash
# 创建上面的 api_server.py
python api_server.py
```

4. **测试API**
```bash
curl http://localhost:8000/api/health
```

5. **配置小程序**
- 在小程序开发工具中开启"不校验合法域名"
- 使用内网穿透工具(如ngrok)暴露本地服务
- 在小程序中调用API

## 💡 最佳实践建议

1. **安全性**
   - 添加API认证（JWT Token）
   - 限制上传文件大小和类型
   - 配置HTTPS证书

2. **性能优化**
   - 使用消息队列（Redis/RabbitMQ）处理上传任务
   - 实现上传进度回调
   - 添加缓存机制

3. **监控告警**
   - 集成日志系统（ELK Stack）
   - 设置上传失败告警
   - 监控服务健康状态

4. **扩展性**
   - 支持多账号管理
   - 实现定时发布功能
   - 添加上传历史记录

## 📞 技术支持

如需进一步的技术支持或有疑问，可以：
1. 查看源项目的 GitHub Issues
2. 参考本文档中的示例代码
3. 根据实际需求调整API设计

---

**总结**: 社交媒体上传器**不能直接打包到小程序**，但可以通过部署为独立API服务的方式，让小程序通过HTTP请求调用上传功能。这是目前最佳的集成方案。
