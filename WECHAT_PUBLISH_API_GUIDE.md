# 📱 微信发布 API 完整指南

## 🎯 功能概览

本 API 提供**完整的微信公众号文章发布流程**，支持：
- ✅ 创建草稿
- ✅ 提交发布
- ✅ 查询发布状态
- ✅ 一键完整发布

## 🔗 API 端点列表

### 基础端点
| 端点 | 方法 | 功能 | 说明 |
|------|------|------|------|
| `/coze/token` | POST | 获取访问令牌 | 获取微信 API 调用凭证 |
| `/coze/upload` | POST | 上传图片 | 上传封面图片获取 media_id |
| `/coze/draft` | POST | 创建草稿 | 将文章保存为草稿 |

### 发布端点
| 端点 | 方法 | 功能 | 说明 |
|------|------|------|------|
| `/coze/publish` | POST | 提交发布 | 将草稿提交发布（需要 media_id） |
| `/coze/publish-status` | POST | 查询状态 | 查询发布任务状态 |
| `/coze/publish-complete` | POST | 一键发布 | 完整流程：令牌→草稿→发布 |

---

## 🚀 一键发布（推荐）

### 接口信息
```
POST /coze/publish-complete
```

### 请求参数
```json
{
  "appid": "你的微信公众号AppID",
  "secret": "你的微信公众号AppSecret", 
  "title": "文章标题",
  "content": "文章HTML内容",
  "summary": "文章摘要（可选）",
  "thumb_media_id": "封面图片media_id（可选）"
}
```

### 请求示例
```bash
curl -X POST https://mp.miyucaicai.cn/coze/publish-complete \
  -H "Content-Type: application/json" \
  -d '{
    "appid": "wx8410119dfbb7f756",
    "secret": "3c93e33e087e57b906f5c341aa5223b9",
    "title": "AI技术趋势报告",
    "content": "<h1>AI技术趋势</h1><p>这是关于AI发展的详细内容...</p>",
    "summary": "2024年AI技术发展趋势分析"
  }'
```

### 成功响应
```json
{
  "success": true,
  "data": {
    "access_token": "ACCESS_TOKEN",
    "media_id": "DRAFT_MEDIA_ID", 
    "publish_id": "PUBLISH_ID",
    "msg_data_id": "MSG_DATA_ID",
    "steps": {
      "1.获取令牌": "✅ 成功",
      "2.创建草稿": "✅ 成功", 
      "3.提交发布": "✅ 成功"
    }
  },
  "message": "发布任务提交成功！请使用 publish_id 查询发布状态",
  "next_step": "调用 /coze/publish-status 查询发布状态，publish_id: 123456789",
  "timestamp": "2025-12-29T02:45:00.000Z"
}
```

---

## 📊 发布状态查询

### 接口信息
```
POST /coze/publish-status
```

### 请求参数
```json
{
  "access_token": "ACCESS_TOKEN",
  "publish_id": "PUBLISH_ID"
}
```

### 状态码说明
| 状态码 | 说明 | 处理建议 |
|--------|------|----------|
| 0 | 发布成功 | ✅ 完成 |
| 1 | 发布中 | ⏳ 等待，继续查询 |
| 2 | 原创失败 | ❌ 检查原创声明 |
| 3 | 常规失败 | ❌ 检查内容合规性 |
| 4 | 平台审核不通过 | ❌ 修改违规内容 |
| 5 | 用户删除文章 | ⚠️ 用户主动删除 |
| 6 | 系统封禁文章 | ⚠️ 严重违规 |

### 成功响应示例
```json
{
  "success": true,
  "data": {
    "publish_id": "123456789",
    "publish_status": 0,
    "publish_status_desc": "发布成功",
    "article_id": "ARTICLE_ID",
    "article_detail": {
      "count": 1,
      "item": [{
        "idx": 1,
        "article_url": "https://mp.weixin.qq.com/s/xxxxx"
      }]
    }
  },
  "message": "Status retrieved successfully"
}
```

---

## 📋 分步发布流程

### 第一步：获取访问令牌
```bash
curl -X POST https://mp.miyucaicai.cn/coze/token \
  -H "Content-Type: application/json" \
  -d '{
    "appid": "wx8410119dfbb7f756",
    "secret": "3c93e33e087e57b906f5c341aa5223b9"
  }'
```

### 第二步：创建草稿
```bash
curl -X POST https://mp.miyucaicai.cn/coze/draft \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "ACCESS_TOKEN",
    "articles": [{
      "title": "文章标题",
      "content": "<p>文章内容</p>",
      "thumb_media_id": "封面图片ID"
    }]
  }'
```

### 第三步：提交发布
```bash
curl -X POST https://mp.miyucaicai.cn/coze/publish \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "ACCESS_TOKEN", 
    "media_id": "草稿的media_id"
  }'
```

---

## 🖼️ 图片上传

### 接口信息
```
POST /coze/upload
```

### 请求参数
```
multipart/form-data:
- access_token: ACCESS_TOKEN
- media: 图片文件 (支持 jpg, png)
- type: thumb (封面图片) 或 image (普通图片)
```

### 响应示例
```json
{
  "success": true,
  "data": {
    "media_id": "MEDIA_ID",
    "url": "图片URL"
  },
  "message": "Image uploaded successfully"
}
```

---

## ⚠️ 注意事项

### 1. 权限要求
- ✅ 仅认证服务号可调用
- ✅ 需要在公众平台开通相关权限
- ✅ IP白名单需包含服务器IP

### 2. 发布限制
- 📅 每天发布次数有限制
- 📝 内容需符合平台规范
- 🔍 原创文章需要声明

### 3. 状态查询
- 🔄 发布是异步过程
- ⏱️ 建议轮询状态直至完成
- 📧 完成后会收到事件推送

### 4. 错误处理
常见错误码：
- `48001`: API未授权
- `53503`: 草稿未通过检查
- `53504`: 需前往官网使用草稿
- `53505`: 需手动保存后再发表

---

## 🔧 开发工具

### 测试脚本示例
```javascript
// 完整发布流程示例
async function publishArticle() {
  // 1. 一键发布
  const publishResult = await fetch('https://mp.miyucaicai.cn/coze/publish-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appid: 'YOUR_APPID',
      secret: 'YOUR_SECRET', 
      title: '测试文章',
      content: '<h1>测试内容</h1>'
    })
  }).then(r => r.json());
  
  if (publishResult.success) {
    const publishId = publishResult.data.publish_id;
    
    // 2. 轮询状态
    let status = 'publishing';
    while (status === 'publishing') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResult = await fetch('https://mp.miyucaicai.cn/coze/publish-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: publishResult.data.access_token,
          publish_id: publishId
        })
      }).then(r => r.json());
      
      status = statusResult.data.publish_status;
      console.log('发布状态:', statusResult.data.publish_status_desc);
      
      if (status === 0) {
        console.log('发布成功！文章链接:', statusResult.data.article_detail.item[0].article_url);
        break;
      } else if (status > 1) {
        console.log('发布失败:', statusResult.data.publish_status_desc);
        break;
      }
    }
  }
}
```

---

## 🎉 完成

现在你可以使用完整的微信发布 API 了！推荐使用 `/coze/publish-complete` 一键发布，简单高效。

有问题可以查看日志或联系技术支持。