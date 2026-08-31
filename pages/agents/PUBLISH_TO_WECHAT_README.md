# 推送到公众号功能 - 快速开始

## ✅ 您不需要部署任何额外服务！

所有功能已集成到小程序中，只需几步即可使用。

## 📦 已添加的文件

### 1. 核心模块
- `modules/article-generator.js` - 文章生成模块
- `modules/publisher.js` - 推送发布模块

### 2. 配置文件
- `PUBLISH_TO_WECHAT_GUIDE.md` - 完整使用指南

### 3. 样式文件
- `agents-publish-fab.wxss` - 浮动按钮样式（可选）

## 🚀 快速开始（3步）

### 第1步：配置服务器地址

打开 `pages/agents/modules/publisher.js`，确认服务器地址：

```javascript
constructor(pageContext) {
  this.page = pageContext;
  this.serverUrl = 'http://39.108.254.228:8002';  // ← 确认这里是您的服务器地址
  this.publishEndpoint = '/publish-draft';
  this.timeout = 120000;
}
```

### 第2步：在agents.wxss中添加样式

将 `agents-publish-fab.wxss` 的内容复制到 `agents.wxss` 文件末尾。

### 第3步：在agents.wxml中添加按钮（可选）

在 `agents.wxml` 的 `</view>` 之前添加：

```xml
<!-- 推送到公众号按钮 -->
<view class="publish-fab" bindtap="onAutoPublish">
  <text class="fab-icon">📱</text>
  <text class="fab-label">推送到公众号</text>
</view>
```

## 🎯 工作原理

```
小程序热点数据
    ↓
选择最佳热点（评分最高）
    ↓
生成HTML文章（含封面、标签、样式）
    ↓
POST推送到 http://39.108.254.228:8002/publish-draft
    ↓
您的服务器处理并发布到公众号
```

## 💡 使用方法

### 方法1：自动推送（推荐）

点击右下角的"📱 推送到公众号"浮动按钮，系统会：
1. 自动选择评分最高的热点
2. 生成HTML文章
3. 推送到您的服务器

### 方法2：在代码中调用

```javascript
// 在agents.js控制台测试
const hotspot = {
  name: '测试热点',
  category: '科技',
  score: 9.5,
  heat: 1000000
};

this.publisher.completeWorkflow(hotspot);
```

## 📊 推送数据格式

### 请求数据
```json
{
  "title": "2026年人工智能新突破",
  "content": "<section>...完整HTML内容...</section>",
  "cover_url": "https://via.placeholder.com/900x500/4a6cf7/ffffff?text=Cover"
}
```

### 响应数据（您的服务器应返回）
```json
{
  "success": true,
  "media_id": "xxxxxxxx",
  "message": "推送成功"
}
```

## 🔍 测试功能

### 测试服务器连接

在 `agents.js` 中已添加方法：

```javascript
// 可以在控制台运行
this.publisher.healthCheck();
```

### 查看推送日志

推送过程会在控制台输出详细日志：
```
========== 完整流程开始 ==========
1. 健康检查...
   ✓ 服务器正常
2. 生成文章...
   ✓ 文章生成成功
3. 推送文章...
   ✓ 推送成功
========== 流程完成 ==========
```

## ❓ 常见问题

### Q: 需要部署draft-api.py吗？
A: 不需要！所有功能已集成到小程序中。

### Q: 需要部署新的云函数吗？
A: 不需要！使用现有的热点云函数即可。

### Q: 封面图怎么生成？
A: 当前使用占位图，如需生成真实图片，可以调用 `generateImage` 云函数。

### Q: 服务器地址不正确怎么办？
A: 修改 `publisher.js` 中的 `this.serverUrl`。

### Q: 推送失败怎么办？
A:
1. 检查服务器是否启动
2. 检查防火墙是否开放8002端口
3. 查看控制台日志定位问题

## 📖 详细文档

完整的API使用说明和更多示例，请查看：

📖 **PUBLISH_TO_WECHAT_GUIDE.md**

包含：
- 完整的工作流程
- 三种UI集成方式
- 详细的API说明
- 故障排查指南
- 最佳实践建议

## ✨ 已集成的功能

### agents.js 中已添加的方法：

1. `onSelectHotspotAndPublish(e)` - 选择热点并推送
2. `onAutoPublish()` - 自动选择最佳热点并推送
3. `onTestServerConnection()` - 测试服务器连接

### agents.js 中已初始化的模块：

```javascript
onLoad(options) {
  // ... 其他初始化
  this.articleGenerator = new ArticleGenerator(this);
  this.publisher = new Publisher(this);
  // ...
}
```

## 🎉 开始使用

1. ✅ 配置服务器地址（如果需要）
2. ✅ 添加样式到agents.wxss
3. ✅ 添加按钮到agents.wxml（可选）
4. ✅ 点击"📱 推送到公众号"按钮
5. ✅ 查看推送结果

就这么简单！

---

**提示：** 所有核心代码已集成到agents.js中，您可以直接使用，无需额外部署！
