# 社交媒体代理云函数

## 📋 概述

`social-media-proxy` 云函数用于转发小程序请求到外部社交媒体上传API服务，实现多平台视频发布功能。

**架构说明**：

```
小程序前端
    ↓ (wx.cloud.callFunction)
微信云函数 (social-media-proxy)
    ↓ (HTTP请求)
外部API服务 (Python + Playwright)
    ↓ (浏览器自动化)
社交媒体平台 (抖音/小红书/B站/快手/TikTok)
```

## ✨ 功能特性

- ✅ 支持多平台上传：抖音、小红书、B站、快手、TikTok
- ✅ 批量上传到多个平台
- ✅ 健康检查功能
- ✅ 支持的平台列表查询
- ✅ 详细的错误处理和日志
- ✅ 支持环境变量配置
- ✅ 用户认证（可选）

## 📦 安装部署

### 1. 创建云函数目录

```bash
cd cloudfunctions
mkdir social-media-proxy
```

### 2. 安装依赖

```bash
cd social-media-proxy
npm install
```

### 3. 上传云函数

在微信开发者工具中：

1. 右键点击 `social-media-proxy` 文件夹
2. 选择 "上传并部署：云端安装依赖"

### 4. 配置环境变量（推荐）

在云开发控制台 → 云函数 → social-media-proxy → 配置

| 变量名                  | 说明                | 示例值                       | 必填 |
| ----------------------- | ------------------- | ---------------------------- | ---- |
| `SOCIAL_UPLOAD_API_URL` | 外部API服务地址     | `https://api.yourdomain.com` | 是   |
| `API_TIMEOUT`           | API超时时间（毫秒） | `60000`                      | 否   |
| `DEBUG`                 | 调试模式            | `true`/`false`               | 否   |

**开发环境配置**：

```
SOCIAL_UPLOAD_API_URL = http://localhost:8000
DEBUG = true
```

**生产环境配置**：

```
SOCIAL_UPLOAD_API_URL = https://api.yourdomain.com
API_TIMEOUT = 120000
DEBUG = false
```

## 📖 API 文档

### 上传到单个平台

```javascript
wx.cloud
  .callFunction({
    name: "social-media-proxy",
    data: {
      action: "upload",
      platform: "douyin", // douyin, xiaohongshu, bilibili, kuaishou, tiktok
      data: {
        videoUrl: "https://...", // 视频URL（云存储或公网URL）
        title: "视频标题",
        tags: "#标签1 #标签2", // 可选
        account: "default", // 可选，账号标识
      },
    },
  })
  .then((res) => {
    console.log(res.result);
    // {
    //   success: true,
    //   platform: 'douyin',
    //   data: { ... }
    // }
  });
```

### 批量上传到多个平台

```javascript
wx.cloud
  .callFunction({
    name: "social-media-proxy",
    data: {
      action: "batch",
      data: {
        platforms: ["douyin", "xiaohongshu", "bilibili"],
        videoUrl: "https://...",
        title: "视频标题",
        tags: "#标签1 #标签2",
        account: "default",
      },
    },
  })
  .then((res) => {
    console.log(res.result);
    // {
    //   success: true,
    //   results: [
    //     { success: true, platform: 'douyin', data: {...} },
    //     { success: true, platform: 'xiaohongshu', data: {...} },
    //     { success: false, platform: 'bilibili', error: '...' }
    //   ],
    //   summary: { total: 3, success: 2, failed: 1 }
    // }
  });
```

### 健康检查

```javascript
wx.cloud
  .callFunction({
    name: "social-media-proxy",
    data: {
      action: "health",
    },
  })
  .then((res) => {
    console.log(res.result);
    // {
    //   success: true,
    //   apiAvailable: true,
    //   apiBaseUrl: 'https://...',
    //   apiStatus: { status: 'ok' }
    // }
  });
```

### 获取支持的平台列表

```javascript
wx.cloud
  .callFunction({
    name: "social-media-proxy",
    data: {
      action: "platforms",
    },
  })
  .then((res) => {
    console.log(res.result);
    // {
    //   success: true,
    //   platforms: [
    //     { id: 'douyin', name: '抖音', icon: '🎵', status: 'active' },
    //     { id: 'xiaohongshu', name: '小红书', icon: '📕', status: 'active' },
    //     ...
    //   ]
    // }
  });
```

## 🔧 外部API服务要求

### Python FastAPI 示例

```python
# api_server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import uvicorn

app = FastAPI()

class UploadRequest(BaseModel):
    videoUrl: str
    title: str
    tags: str = ""
    account: str = "default"

@app.post("/api/upload/{platform}")
async def upload_video(platform: str, request: UploadRequest):
    """
    外部API需要实现的接口
    """
    try:
        # 根据平台调用不同的上传逻辑
        if platform == "douyin":
            # 调用抖音上传器
            result = upload_to_douyin(request)
        elif platform == "xiaohongshu":
            # 调用小红书上传器
            result = upload_to_xiaohongshu(request)
        # ... 其他平台

        return {"code": 0, "message": "上传成功", "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 响应格式

外部API必须返回以下格式：

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "platform": "douyin",
    "title": "视频标题",
    "videoId": "xxx",
    "url": "https://..."
  }
}
```

**错误响应**：

```json
{
  "code": -1,
  "message": "上传失败：账号未登录"
}
```

## 📱 小程序集成示例

### 创建上传工具类

```javascript
// utils/socialUploader.js
class SocialUploader {
  constructor() {
    this.cloudFunctionName = "social-media-proxy";
  }

  /**
   * 上传到抖音
   */
  async uploadToDouyin(videoUrl, title, options = {}) {
    return this.upload("douyin", videoUrl, title, options);
  }

  /**
   * 上传到小红书
   */
  async uploadToXiaohongshu(videoUrl, title, options = {}) {
    return this.upload("xiaohongshu", videoUrl, title, options);
  }

  /**
   * 批量上传
   */
  async batchUpload(videoUrl, title, platforms, options = {}) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: this.cloudFunctionName,
        data: {
          action: "batch",
          data: {
            platforms,
            videoUrl,
            title,
            ...options,
          },
        },
        success: (res) => {
          if (res.result.success) {
            resolve(res.result);
          } else {
            reject(new Error(res.result.error));
          }
        },
        fail: reject,
      });
    });
  }

  /**
   * 通用上传方法
   */
  async upload(platform, videoUrl, title, options = {}) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: this.cloudFunctionName,
        data: {
          action: "upload",
          platform,
          data: {
            videoUrl,
            title,
            tags: options.tags || "",
            account: options.account || "default",
          },
        },
        success: (res) => {
          if (res.result.success) {
            resolve(res.result);
          } else {
            reject(new Error(res.result.error));
          }
        },
        fail: reject,
      });
    });
  }

  /**
   * 获取支持的平台列表
   */
  async getPlatforms() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: this.cloudFunctionName,
        data: { action: "platforms" },
        success: (res) => {
          resolve(res.result.platforms);
        },
        fail: reject,
      });
    });
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: this.cloudFunctionName,
        data: { action: "health" },
        success: (res) => {
          resolve(res.result);
        },
        fail: reject,
      });
    });
  }
}

module.exports = SocialUploader;
```

### 在页面中使用

```javascript
// pages/agents/agents.js
const SocialUploader = require("../../utils/socialUploader.js");

Page({
  data: {
    videoUrl: "",
    platforms: [],
    selectedPlatforms: [],
  },

  async onLoad() {
    const uploader = new SocialUploader();

    // 加载支持的平台
    const platforms = await uploader.getPlatforms();
    this.setData({ platforms });

    // 检查API服务状态
    const health = await uploader.healthCheck();
    console.log("API服务状态:", health.apiAvailable);
  },

  /**
   * 上传视频
   */
  async onUpload() {
    if (!this.data.videoUrl) {
      wx.showToast({ title: "请先选择视频", icon: "none" });
      return;
    }

    if (this.data.selectedPlatforms.length === 0) {
      wx.showToast({ title: "请至少选择一个平台", icon: "none" });
      return;
    }

    wx.showLoading({ title: "正在上传..." });

    const uploader = new SocialUploader();

    try {
      // 批量上传
      const result = await uploader.batchUpload(
        this.data.videoUrl,
        "我的视频标题",
        this.data.selectedPlatforms,
        {
          tags: "#AI #科技 #创新",
        },
      );

      wx.hideLoading();

      // 显示结果
      wx.showModal({
        title: "上传完成",
        content: `成功: ${result.summary.success}个, 失败: ${result.summary.failed}个`,
        showCancel: false,
      });

      // 处理失败的平台
      const failed = result.results.filter((r) => !r.success);
      if (failed.length > 0) {
        console.error("上传失败的平台:", failed);
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || "上传失败",
        icon: "error",
      });
      console.error("上传错误:", error);
    }
  },

  /**
   * 选择平台
   */
  onTogglePlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    const selected = this.data.selectedPlatforms;
    const index = selected.indexOf(platform);

    if (index === -1) {
      selected.push(platform);
    } else {
      selected.splice(index, 1);
    }

    this.setData({ selectedPlatforms: selected });
  },
});
```

### WXML 页面示例

```xml
<!-- pages/agents/agents.wxml -->
<view class="upload-page">
  <!-- 视频选择 -->
  <view class="section">
    <view class="section-title">选择视频</view>
    <button bindtap="onSelectVideo">选择视频文件</button>
    <view wx:if="{{videoUrl}}">已选择: {{videoUrl}}</view>
  </view>

  <!-- 平台选择 -->
  <view class="section">
    <view class="section-title">选择发布平台</view>
    <view class="platform-list">
      <view
        class="platform-item {{selectedPlatforms.includes(item.id) ? 'selected' : ''}}"
        wx:for="{{platforms}}"
        wx:key="id"
        bindtap="onTogglePlatform"
        data-platform="{{item.id}}"
      >
        <text class="platform-icon">{{item.icon}}</text>
        <text class="platform-name">{{item.name}}</text>
        <view class="platform-status {{item.status}}">{{item.status}}</view>
      </view>
    </view>
  </view>

  <!-- 上传按钮 -->
  <view class="section">
    <button
      type="primary"
      bindtap="onUpload"
      disabled="{{!videoUrl || selectedPlatforms.length === 0}}"
    >
      开始上传
    </button>
  </view>
</view>
```

## 🔒 安全建议

1. **使用HTTPS**
   - 生产环境外部API必须使用HTTPS
   - 在微信公众平台配置服务器域名白名单

2. **用户认证**
   - 在云函数中验证用户登录状态
   - 可配置 `security.requireAuth = true`

3. **域名白名单**
   - 限制允许的API域名，防止配置被篡改
   - 在 `config.js` 中配置 `security.allowedDomains`

4. **请求限流**
   - 在外部API服务中实现限流
   - 防止恶意大量请求

## 🐛 调试技巧

### 启用调试模式

设置环境变量 `DEBUG = true`，云函数会在控制台输出详细日志。

### 查看云函数日志

在云开发控制台 → 云函数 → social-media-proxy → 日志

### 本地测试

使用云开发本地调试功能：

1. 右键点击云函数文件夹
2. 选择 "本地调试"
3. 在弹出的调试窗口中测试

## 📊 错误处理

常见错误及解决方案：

| 错误信息            | 原因             | 解决方案                          |
| ------------------- | ---------------- | --------------------------------- |
| `不支持的平台: xxx` | 平台ID错误       | 检查平台ID是否正确                |
| `网络请求失败`      | 外部API不可达    | 检查API服务是否运行、网络是否通畅 |
| `上传超时`          | 视频过大或网络慢 | 增加 `API_TIMEOUT` 值             |
| `未配置API地址`     | 环境变量未设置   | 在云开发控制台配置环境变量        |

## 📚 相关资源

- [HD_HUMAN上传器项目](C:\E\HD_HUMAN开源\HD_HUMAN\social-auto-upload-main)
- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [小程序云函数文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)

## 📝 更新日志

### v1.0.0 (2026-02-14)

- ✅ 初始版本
- ✅ 支持抖音、小红书、B站、快手、TikTok
- ✅ 批量上传功能
- ✅ 健康检查功能
- ✅ 环境变量配置
