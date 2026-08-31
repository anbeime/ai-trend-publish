# 云函数配置更新指南

## 📌 概述

本指南说明如何更新微信云函数 `social-media-proxy` 的环境变量，使其指向新的社交媒体上传API（端口8003）。

---

## 🎯 配置目标

**当前配置**（需要修改）:

```
SOCIAL_UPLOAD_API_URL = http://39.108.254.228:8002
```

**目标配置**:

```
SOCIAL_UPLOAD_API_URL = http://39.108.254.228:8003
```

---

## 📋 步骤1: 登录微信云开发控制台

### 方式A: 通过微信开发者工具

1. 打开微信开发者工具
2. 点击顶部菜单：**云开发** → **云开发控制台**
3. 选择环境：`invideo-6gidgilyee392cc8`

### 方式B: 通过浏览器

1. 访问：https://tcb.cloud.tencent.com/
2. 登录微信账号
3. 选择环境：`invideo-6gidgilyee392cc8`

---

## 📋 步骤2: 定位云函数

1. 在左侧导航栏，点击 **云函数**
2. 找到云函数：`social-media-proxy`
3. 点击进入云函数详情页

---

## 📋 步骤3: 修改环境变量

### 方法1: 通过配置页面

1. 在云函数详情页，点击 **配置** 标签
2. 找到 **环境变量** 部分
3. 点击 **编辑** 按钮

### 修改以下环境变量：

| 变量名                  | 当前值                       | 新值                         | 说明                 |
| ----------------------- | ---------------------------- | ---------------------------- | -------------------- |
| `SOCIAL_UPLOAD_API_URL` | `http://39.108.254.228:8002` | `http://39.108.254.228:8003` | 社交媒体上传API地址  |
| `DEBUG`                 | `false`                      | `false`                      | 调试模式（保持关闭） |

4. 点击 **保存** 按钮

---

## 📋 步骤4: 重新部署云函数

### 自动部署（推荐）

1. 在云函数详情页，点击 **部署** 标签
2. 点击 **上传并部署：云端安装依赖（nodejs16）** 按钮
3. 等待部署完成（约1-2分钟）

### 手动部署（如果自动部署失败）

1. 在微信开发者工具中，找到项目目录：

   ```
   cloudfunctions/social-media-proxy/
   ```

2. 右键点击 `social-media-proxy` 文件夹
3. 选择 **上传并部署：云端安装依赖**
4. 选择运行时：`Node.js 16`
5. 等待上传和部署完成

---

## 📋 步骤5: 验证配置

### 测试1: 健康检查

在微信开发者工具的控制台（Console）中运行：

```javascript
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "health",
  },
  success: (res) => {
    console.log("✅ 健康检查成功:", res.result);

    // 验证返回的URL是否正确
    if (res.result.apiBaseUrl === "http://39.108.254.228:8003") {
      console.log("✅ API地址配置正确");
    } else {
      console.error("❌ API地址配置错误:", res.result.apiBaseUrl);
    }
  },
  fail: (err) => {
    console.error("❌ 健康检查失败:", err);
  },
});
```

**预期输出**:

```javascript
{
  success: true,
  apiAvailable: true,
  apiBaseUrl: "http://39.108.254.228:8003",
  apiStatus: {
    status: "ok",
    service: "Social Media Upload API",
    timestamp: "2026-02-15T10:43:18.123456"
  }
}
```

### 测试2: 获取平台列表

```javascript
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "platforms",
  },
  success: (res) => {
    console.log("✅ 平台列表获取成功:", res.result);

    // 检查返回的平台列表
    if (res.result.success && res.result.platforms.length > 0) {
      console.log("✅ 发现", res.result.platforms.length, "个平台");
      res.result.platforms.forEach((p) => {
        console.log("  -", p.name, p.icon, p.status);
      });
    } else {
      console.error("❌ 平台列表获取失败");
    }
  },
  fail: (err) => {
    console.error("❌ 获取平台列表失败:", err);
  },
});
```

**预期输出**:

```javascript
{
  success: true,
  platforms: [
    { id: "douyin", name: "抖音", icon: "🎵", status: "active" },
    { id: "xiaohongshu", name: "小红书", icon: "📕", status: "active" },
    { id: "bilibili", name: "B站", icon: "📺", status: "active" },
    { id: "kuaishou", name: "快手", icon: "🎥", status: "active" },
    { id: "tiktok", name: "TikTok", icon: "🎬", status: "active" }
  ]
}
```

---

## 🔍 故障排查

### 问题1: 健康检查失败 - API不可用

**症状**:

```javascript
{
  success: false,
  apiAvailable: false,
  apiBaseUrl: "http://39.108.254.228:8003",
  error: "..."
}
```

**原因**: 后端API服务（端口8003）未启动或无法访问

**解决方案**:

```bash
# SSH登录服务器
ssh root@39.108.254.228

# 检查服务状态
sudo systemctl status social-upload-api

# 如果服务未运行，启动它
sudo systemctl start social-upload-api

# 检查端口监听
sudo netstat -tlnp | grep 8003

# 测试本地访问
curl http://localhost:8003/api/health

# 测试外网访问
curl http://39.108.254.228:8003/api/health
```

### 问题2: 健康检查成功但URL仍为旧地址

**症状**:

```javascript
{
  success: true,
  apiAvailable: true,
  apiBaseUrl: "http://39.108.254.228:8002",  // 旧地址！
  ...
}
```

**原因**: 环境变量修改未生效，需要重新部署

**解决方案**:

1. 重新检查云函数环境变量配置
2. 确认 `SOCIAL_UPLOAD_API_URL` 已修改为 `http://39.108.254.228:8003`
3. 重新部署云函数（上传并部署）
4. 等待部署完成后再次测试

### 问题3: 云函数部署失败

**症状**: 部署时报错

**常见错误**:

- 网络连接超时
- 云函数代码有语法错误
- 依赖安装失败

**解决方案**:

1. 检查网络连接
2. 查看云函数日志（在云开发控制台）
3. 重新上传代码

### 问题4: 请求超时

**症状**: 云函数调用超时（超过60秒）

**原因**: 后端API处理时间过长

**解决方案**:

1. 在云函数配置中增加超时时间（最大600秒）
2. 优化后端API性能
3. 使用异步处理

---

## 📊 环境变量完整配置

以下是 `social-media-proxy` 云函数的完整环境变量配置：

| 变量名                  | 值                           | 说明                   | 是否必填 |
| ----------------------- | ---------------------------- | ---------------------- | -------- |
| `SOCIAL_UPLOAD_API_URL` | `http://39.108.254.228:8003` | 社交媒体上传API地址    | ✅ 必填  |
| `API_TIMEOUT`           | `60000`                      | API超时时间（毫秒）    | ⭕ 可选  |
| `DEBUG`                 | `false`                      | 调试模式（true/false） | ⭕ 可选  |

---

## 📝 云函数日志查看

### 通过微信云开发控制台

1. 进入云函数详情页
2. 点击 **日志** 标签
3. 选择时间范围
4. 查看日志输出

### 常见日志示例

**健康检查成功**:

```
[INFO] [social-media-proxy]收到请求: { action: 'health', platform: undefined, hasData: false }
[INFO] [social-media-proxy]用户信息: { openid: 'xxx' }
[DEBUG] [healthCheck]执行健康检查
[DEBUG] [healthCheck]健康检查成功: { status: 'ok', ... }
```

**上传请求**:

```
[INFO] [social-media-proxy]收到请求: { action: 'upload', platform: 'douyin', hasData: true }
[DEBUG] [uploadToDouyin]开始上传到抖音
[INFO] [uploadToDouyin]上传成功: { code: 0, message: '上传成功', ... }
```

**错误示例**:

```
[ERROR] [uploadToDouyin]上传失败: Error: connect ECONNREFUSED
[ERROR] [social-media-proxy]错误: connect ECONNREFUSED
```

---

## ✅ 验证检查清单

完成配置后，请确认以下所有项：

- [ ] 环境变量 `SOCIAL_UPLOAD_API_URL` 已更新为 `http://39.108.254.228:8003`
- [ ] 云函数已重新部署
- [ ] 健康检查测试通过，返回 `apiBaseUrl: "http://39.108.254.228:8003"`
- [ ] 平台列表测试通过，返回正确的平台数据
- [ ] 云函数日志显示请求正常
- [ ] 后端API服务（端口8003）正在运行

---

## 🎯 下一步

云函数配置完成后，您可以通过小程序的发布页面进行测试：

1. 打开微信开发者工具
2. 导航到 `pages/publish/publish` 页面
3. 选择测试平台
4. 选择测试视频
5. 填写标题和标签
6. 点击发布

详细测试步骤请参考：[MULTI_USER_PUBLISHING_GUIDE.md](./MULTI_USER_PUBLISHING_GUIDE.md)

---

## 📚 相关文档

- [多用户发布系统完整指南](./MULTI_USER_PUBLISHING_GUIDE.md)
- [社交媒体上传API文档](./social-upload-api-README.md)
- [微信云函数文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
- [微信云开发控制台](https://tcb.cloud.tencent.com/)

---

## 💡 提示

- **环境变量修改后必须重新部署云函数才能生效**
- **建议在非高峰时段进行配置更新**
- **每次修改后务必进行健康检查测试**
- **保存好API配置信息，避免泄露**

---

**更新日期**: 2026-02-15
**版本**: 1.0.0
