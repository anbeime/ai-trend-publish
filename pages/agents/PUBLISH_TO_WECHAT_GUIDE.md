# 小程序推送文章到公众号指南

## 概述

本文档说明如何在您的小程序中使用热点数据生成公众号文章并推送到您的发布服务器。

## ✅ 您不需要部署任何额外服务！

### 已有功能
- ✅ 热点采集（通过云函数）
- ✅ 热点评分（通过云函数）
- ✅ 热点展示（agents页面）

### 新增功能
- ✅ 文章生成（article-generator.js）
- ✅ 推送发布（publisher.js）

## 工作流程

```
小程序热点 → 生成HTML文章 → POST推送 → 您的服务器 → 发布到公众号
```

## 配置说明

### 1. 确认服务器地址

打开 `pages/agents/modules/publisher.js`，确认服务器地址：

```javascript
constructor(pageContext) {
  this.page = pageContext;
  // 您的服务器地址（可修改）
  this.serverUrl = 'http://39.108.254.228:8002';  // ← 修改这里
  this.publishEndpoint = '/publish-draft';
  this.timeout = 120000; // 120秒超时
}
```

**如果您的服务器地址不同，请修改 `this.serverUrl`**

### 2. 小程序调用方式

#### 方式A：在热点列表中添加推送按钮

在 `agents.wxml` 的热点列表项中添加推送按钮：

```xml
<view
  class="trend-item"
  wx:for="{{filteredTrends}}"
  wx:key="id"
  bindtap="selectTrendByTap"
  data-trend="{{item}}"
>
  <view class="trend-item-icon">{{item.icon}}</view>
  <view class="trend-item-content">
    <view class="trend-item-name">{{item.name}}</view>
    <view class="trend-item-reason">{{item.reason}}</view>
    <view class="trend-item-category-tag">{{item.category}}</view>
  </view>
  <view class="trend-item-score">热度{{item.score}}</view>

  <!-- 新增：推送按钮 -->
  <button
    class="trend-publish-btn"
    bindtap="onSelectHotspotAndPublish"
    data-hotspot="{{item}}"
    catchtap="stopPropagation"
  >
    🚀 推送
  </button>
</view>
```

#### 方式B：添加浮动按钮

在 `agents.wxml` 底部添加浮动按钮：

```xml
<!-- 推送到公众号按钮 -->
<view class="publish-fab" bindtap="onAutoPublish">
  <text class="fab-icon">📱</text>
  <text class="fab-label">推送到公众号</text>
</view>
```

在 `agents.wxss` 中添加样式：

```css
.publish-fab {
  position: fixed;
  bottom: 120rpx;
  right: 20rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20rpx 30rpx;
  border-radius: 50rpx;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  gap: 12rpx;
  z-index: 100;
}

.fab-icon {
  font-size: 32rpx;
}

.fab-label {
  font-size: 28rpx;
  font-weight: 500;
}
```

#### 方式C：在输入区域添加推送选项

在输入区域的创作选项中添加推送功能：

```xml
<view class="option-item" bindtap="onAutoPublish">
  <text class="option-icon">📱</text>
  <text class="option-label">推送到公众号</text>
</view>
```

## API调用说明

### 1. 文章生成

```javascript
// 在agents.js中已集成
this.articleGenerator.generateArticleHTML(hotTopic);

// 返回数据：
{
  title: "文章标题",
  content: "HTML内容（内联CSS样式）",
  cover_url: "封面图URL"
}
```

### 2. 推送到服务器

```javascript
// 在agents.js中已集成
this.publisher.publishArticle(article);

// POST数据格式：
{
  title: "文章标题",
  content: "HTML内容",
  cover_url: "封面图URL"
}
```

### 3. 完整流程

```javascript
// 在agents.js中已集成
this.publisher.completeWorkflow(hotTopic);

// 自动完成：
// 1. 健康检查
// 2. 生成文章
// 3. 推送服务器
```

## 快速测试

### 测试1：手动选择热点推送

```javascript
// 在agents.js控制台运行
const hotspot = {
  name: '测试热点',
  category: '科技',
  score: 9.5,
  heat: 1000000
};

this.publisher.completeWorkflow(hotspot);
```

### 测试2：服务器连接测试

```javascript
// 添加测试按钮
<button bindtap="onTestServerConnection">测试服务器连接</button>
```

## 数据格式说明

### 推送数据格式

```json
{
  "title": "2026年人工智能新突破",
  "content": "<section>...完整HTML内容...</section>",
  "cover_url": "https://via.placeholder.com/900x500/4a6cf7/ffffff?text=Cover"
}
```

### 服务器响应格式

您的服务器应该返回：

```json
{
  "success": true,
  "media_id": "xxxxxxxx",
  "message": "推送成功"
}
```

## 故障排查

### 1. 推送失败

**问题：** 推送请求失败

**检查：**
```javascript
// 1. 检查服务器地址是否正确
console.log('服务器地址:', this.publisher.serverUrl);

// 2. 测试服务器连接
this.publisher.healthCheck();

// 3. 查看网络请求日志
// 微信开发者工具 → Network → 查看请求详情
```

**常见原因：**
- 服务器未启动
- 服务器防火墙未开放8002端口
- 小程序未配置域名白名单

### 2. 文章生成失败

**问题：** HTML内容格式错误

**检查：**
```javascript
// 查看生成的文章内容
const article = this.articleGenerator.generateArticleHTML(hotTopic);
console.log('文章标题:', article.title);
console.log('HTML长度:', article.content.length);
console.log('HTML预览:', article.content.substring(0, 200));
```

### 3. 云函数未初始化

**问题：** 无法调用云函数

**解决：**
```javascript
// 检查云开发是否初始化
const app = getApp();
console.log('云开发状态:', app.globalData.cloudInitialized);

if (!app.globalData.cloudInitialized) {
  wx.showModal({
    title: '云开发未初始化',
    content: '请先初始化云开发环境'
  });
}
```

## 完整示例代码

### 示例：完整的推送方法

```javascript
// pages/agents/agents.js

/**
 * 自动推送最佳热点
 */
async onAutoPublish() {
  console.log('自动推送流程');

  // 1. 获取可用热点
  const availableTrends = this.data.availableTrends || this.data.filteredTrends || [];

  if (availableTrends.length === 0) {
    wx.showToast({
      title: '没有可用热点',
      icon: 'none'
    });
    return;
  }

  // 2. 选择最佳热点（评分最高）
  const sortedTrends = [...availableTrends].sort((a, b) => (b.score || 0) - (a.score || 0));
  const bestHotspot = sortedTrends[0];

  console.log('自动选择最佳热点:', bestHotspot);

  // 3. 显示加载状态
  wx.showLoading({
    title: '正在生成并推送...',
    mask: true
  });

  try {
    // 4. 完整流程
    const result = await this.publisher.completeWorkflow(bestHotspot);

    wx.hideLoading();

    // 5. 显示结果
    if (result.success) {
      wx.showModal({
        title: '推送成功',
        content: `文章已推送到发布服务器！\n\n热点：${result.hotTopic.name}\n评分：${result.hotTopic.score}/10`,
        showCancel: false,
        confirmText: '确定'
      });
    } else {
      wx.showModal({
        title: '推送失败',
        content: `错误：${result.error}`,
        showCancel: false,
        confirmText: '确定'
      });
    }
  } catch (error) {
    wx.hideLoading();
    wx.showToast({
      title: '推送失败',
      icon: 'error'
    });
    console.error('推送失败:', error);
  }
}
```

## 最佳实践

### 1. 错误处理

```javascript
try {
  const result = await this.publisher.publishArticle(article);
  // 处理成功
} catch (error) {
  console.error('推送失败:', error);
  wx.showModal({
    title: '推送失败',
    content: `错误：${error.message}`
  });
}
```

### 2. 用户反馈

```javascript
// 显示加载状态
wx.showLoading({ title: '正在推送...', mask: true });

// 显示成功/失败提示
wx.showToast({
  title: '推送成功',
  icon: 'success'
});
```

### 3. 日志记录

```javascript
console.log('推送日志:', {
  hotspot: hotspot,
  article: article,
  result: result
});
```

## 总结

✅ **您需要做的：**

1. 在 `agents.wxml` 中添加UI按钮（三种方式任选其一）
2. 在 `agents.wxss` 中添加样式（如果使用浮动按钮）
3. 修改 `publisher.js` 中的服务器地址（如果需要）
4. 测试推送功能

❌ **您不需要做的：**

1. ❌ 不需要部署 draft-api.py
2. ❌ 不需要部署额外的云函数
3. ❌ 不需要购买服务器（已有）

---

## 技术支持

如有问题，请查看：
- 📖 文章生成模块：`pages/agents/modules/article-generator.js`
- 📖 推送模块：`pages/agents/modules/publisher.js`
- 🔧 配置文件：`pages/agents/agents.js`（已集成）

**核心功能已集成到agents.js中，直接调用即可！**
