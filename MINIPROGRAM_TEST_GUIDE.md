# 小程序发布功能测试指南

## 📋 测试概述

本指南提供完整的小程序发布功能测试流程，包括健康检查、单平台发布、批量发布等测试场景。

---

## 🎯 测试前准备

### 前置条件检查

- [ ] 微信开发者工具已安装并登录
- [ ] 小程序项目已正确配置云开发环境
- [ ] 云函数 `social-media-proxy` 已部署（端口8003）
- [ ] 后端API服务已启动（端口8003）
- [ ] HD_HUMAN上传器项目已配置

### 测试环境验证

**1. 验证云函数环境**

在微信开发者工具控制台运行：

```javascript
// 测试云函数连接
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "health",
  },
  success: (res) => {
    console.log("✅ 云函数连接成功:", res.result);
  },
  fail: (err) => {
    console.error("❌ 云函数连接失败:", err);
  },
});
```

**预期结果**:

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

**2. 验证后端API服务**

```javascript
// 测试平台列表
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "platforms",
  },
  success: (res) => {
    console.log("✅ 平台列表:", res.result);
  },
  fail: (err) => {
    console.error("❌ 获取平台列表失败:", err);
  },
});
```

**预期结果**:

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

## 🧪 测试场景

### 测试场景1: 健康检查

**目的**: 验证云函数与后端API的连接

**步骤**:

1. 打开微信开发者工具
2. 进入小程序发布页面 `pages/publish/publish`
3. 打开控制台（Console）
4. 运行以下代码：

```javascript
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "health",
  },
  success: (res) => {
    console.log("✅ 健康检查成功:", res.result);

    // 验证关键信息
    if (
      res.result.success === true &&
      res.result.apiAvailable === true &&
      res.result.apiBaseUrl === "http://39.108.254.228:8003"
    ) {
      wx.showToast({
        title: "健康检查通过",
        icon: "success",
      });
    } else {
      wx.showToast({
        title: "健康检查异常",
        icon: "none",
      });
    }
  },
  fail: (err) => {
    console.error("❌ 健康检查失败:", err);
    wx.showToast({
      title: "连接失败",
      icon: "error",
    });
  },
});
```

**预期结果**:

- ✅ 显示"健康检查通过"提示
- ✅ 控制台输出正确的响应数据

**测试要点**:

- [ ] 返回 `success: true`
- [ ] 返回 `apiAvailable: true`
- [ ] 返回正确的API地址 `http://39.108.254.228:8003`

---

### 测试场景2: 单平台发布

**目的**: 验证单个平台的视频上传功能

**测试平台**: 抖音（Douyin）

**步骤**:

1. 打开小程序发布页面 `pages/publish/publish`
2. 选择平台：勾选"抖音"
3. 点击"选择视频"按钮，上传测试视频
4. 填写视频信息：
   - 标题：`测试视频 - 单平台发布`
   - 标签：`#测试 #AI #科技`
5. 点击"发布"按钮

**预期结果**:

- ✅ 显示"正在发布..."加载提示
- ✅ 发布完成后显示"发布成功"弹窗
- ✅ 发布结果列表显示抖音上传成功

**验证点**:

```javascript
// 在 publish.js 的 publishToSocialMedia 方法中查看日志
console.log('抖音发布结果:', result);

// 预期输出
{
  success: true,
  platform: 'douyin',
  data: {
    platform: 'douyin',
    title: '测试视频 - 单平台发布',
    result: 'success'
  }
}
```

**测试要点**:

- [ ] 视频选择成功
- [ ] 发布流程正常执行
- [ ] 云函数调用成功
- [ ] 后端API返回成功
- [ ] 显示正确的发布结果

---

### 测试场景3: 批量发布

**目的**: 验证多平台同时发布功能

**测试平台**: 抖音 + 小红书 + B站

**步骤**:

1. 打开小程序发布页面 `pages/publish/publish`
2. 选择平台：勾选"抖音"、"小红书"、"B站"
3. 点击"选择视频"按钮，上传测试视频
4. 填写视频信息：
   - 标题：`测试视频 - 批量发布`
   - 标签：`#测试 #批量 #多平台`
5. 点击"批量发布"按钮

**预期结果**:

- ✅ 显示"正在批量上传..."加载提示
- ✅ 发布完成后显示批量结果弹窗
- ✅ 发布结果列表显示所有平台的上传状态

**验证点**:

```javascript
// 在 publish.js 的 publishToSocialMedia 方法中查看日志
console.log("批量发布结果:", publishResults);

// 预期输出
[
  {
    platform: "douyin",
    success: true,
    message: "上传成功",
  },
  {
    platform: "xiaohongshu",
    success: true,
    message: "上传成功",
  },
  {
    platform: "bilibili",
    success: true,
    message: "上传成功",
  },
];
```

**测试要点**:

- [ ] 所有平台都能正常调用
- [ ] 发布结果显示完整
- [ ] 成功/失败状态正确
- [ ] 显示摘要信息（成功数、失败数）

---

### 测试场景4: 错误处理

**目的**: 验系系统对错误情况的处理

#### 测试4.1: 未选择视频

**步骤**:

1. 不选择视频
2. 直接点击"发布"按钮

**预期结果**:

- ✅ 显示"请先选择视频"提示
- ✅ 不会执行发布操作

#### 测试4.2: 未选择平台

**步骤**:

1. 选择视频
2. 不选择任何平台
3. 点击"发布"按钮

**预期结果**:

- ✅ 显示"请至少选择一个平台"提示
- ✅ 不会执行发布操作

#### 测试4.3: 网络错误模拟

**步骤**:

1. 在云函数中模拟网络错误
2. 执行发布操作

**预期结果**:

- ✅ 显示"发布失败"提示
- ✅ 控制台输出错误信息
- ✅ 不会导致程序崩溃

#### 测试4.4: 后端API不可用

**步骤**:

1. 停止后端API服务（端口8003）
2. 执行发布操作

**预期结果**:

- ✅ 显示"上传失败"提示
- ✅ 控制台输出连接错误信息
- ✅ 系统保持稳定，不崩溃

---

### 测试场景5: 微信公众号发布

**目的**: 验证微信公众号草稿箱发布功能

**步骤**:

1. 打开小程序发布页面 `pages/publish/publish`
2. 点击"启用微信公众号发布"
3. 在弹出的配置指引中填写：
   - AppID：`wx1234567890abcdef`（测试用）
   - AppSecret：`test_secret_12345`（测试用）
   - 文章标题：`测试文章标题`
   - 作者：`测试作者`
   - 摘要：`测试文章摘要`
4. 点击"我已配置完成"
5. 点击"发布"按钮

**预期结果**:

- ✅ 显示微信公众号配置表单
- ✅ 配置保存成功
- ✅ 发布到草稿箱成功（如果账号配置正确）

**测试要点**:

- [ ] 微信公众号配置界面正常显示
- [ ] 配置信息输入正常
- [ ] 发布到草稿箱功能可用

**注意**: 实际发布需要真实的公众号AppID和AppSecret，测试时可以使用模拟数据。

---

## 📊 测试结果记录

### 测试记录表

| 测试场景             | 测试日期 | 测试结果          | 备注 |
| -------------------- | -------- | ----------------- | ---- |
| 健康检查             |          | ⬜ 通过 / ⬜ 失败 |      |
| 单平台发布           |          | ⬜ 通过 / ⬜ 失败 |      |
| 批量发布             |          | ⬜ 通过 / ⬜ 失败 |      |
| 错误处理 - 未选视频  |          | ⬜ 通过 / ⬜ 失败 |      |
| 错误处理 - 未选平台  |          | ⬜ 通过 / ⬜ 失败 |      |
| 错误处理 - 网络错误  |          | ⬜ 通过 / ⬜ 失败 |      |
| 错误处理 - API不可用 |          | ⬜ 通过 / ⬜ 失败 |      |
| 微信公众号发布       |          | ⬜ 通过 / ⬜ 失败 |      |

### 问题记录表

| 问题编号 | 问题描述 | 复现步骤 | 严重程度 | 状态                              |
| -------- | -------- | -------- | -------- | --------------------------------- |
|          |          |          |          | ⬜ 待处理 / ⬜ 处理中 / ⬜ 已解决 |

---

## 🔍 调试技巧

### 1. 查看云函数日志

1. 访问微信云开发控制台
2. 进入云函数 `social-media-proxy`
3. 点击"日志"标签
4. 查看实时日志

### 2. 查看小程序日志

在微信开发者工具中：

- 点击底部"调试器"标签
- 查看 Console 输出
- 查看 Network 请求

### 3. 查看后端API日志

SSH登录服务器后：

```bash
# 查看服务日志
sudo journalctl -u social-upload-api -f

# 查看最近100条日志
sudo journalctl -u social-upload-api -n 100
```

### 4. 使用断点调试

在 `publish.js` 中设置断点：

```javascript
async publishToSocialMedia() {
  console.log('开始发布...');
  debugger; // 设置断点

  const { videoUrl, videoTitle, videoTags, platforms } = this.data;

  // ... 其他代码
}
```

---

## 🚨 常见问题

### Q1: 云函数调用超时

**症状**: 云函数调用超过60秒

**解决方案**:

1. 在云函数配置中增加超时时间（最大600秒）
2. 优化后端API性能
3. 使用异步处理

### Q2: 视频上传失败

**症状**: 提示"上传失败"

**可能原因**:

- 视频文件过大
- 视频格式不支持
- 网络连接不稳定
- 后端API服务异常

**排查步骤**:

1. 检查视频文件大小（建议<500MB）
2. 检查视频格式（建议MP4）
3. 检查网络连接
4. 查看云函数和后端日志

### Q3: 平台显示"上传失败"

**症状**: 某个平台显示上传失败

**可能原因**:

- 平台账号未登录
- Cookie过期
- 平台API限制
- 上传器配置错误

**排查步骤**:

1. 检查HD_HUMAN上传器配置
2. 更新平台账号Cookie
3. 查看后端API日志
4. 联系平台技术支持

### Q4: 发布结果不显示

**症状**: 发布完成后没有显示结果

**解决方案**:

1. 检查 `publishResults` 数据是否正确
2. 检查UI渲染逻辑
3. 查看控制台错误信息

---

## ✅ 测试完成检查清单

完成所有测试后，请确认：

- [ ] 健康检查测试通过
- [ ] 单平台发布测试通过
- [ ] 批量发布测试通过
- [ ] 所有错误处理测试通过
- [ ] 微信公众号发布测试通过
- [ ] 所有测试结果已记录
- [ ] 发现的问题已记录
- [ ] 云函数日志正常
- [ ] 后端API日志正常
- [ ] 小程序运行稳定

---

## 📚 相关文档

- [多用户发布系统部署指南](./MULTI_USER_PUBLISHING_GUIDE.md)
- [云函数配置更新指南](./CLOUD_FUNCTION_UPDATE_GUIDE.md)
- [社交媒体上传API文档](./social-upload-api-README.md)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

---

## 🎉 测试完成

恭喜！您已完成小程序发布功能的测试。

如发现任何问题，请参考调试技巧或联系技术支持。

---

**更新日期**: 2026-02-15
**版本**: 1.0.0
