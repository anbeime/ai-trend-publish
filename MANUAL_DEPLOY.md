# 🚀 手动部署指南

## 问题说明
当前 `https://mp.miyucaicai.cn/api/wechat/publish` 返回 404，是因为 Cloudflare Pages 需要使用正确的 `_worker.js` 文件。

## 快速修复步骤

### 1. 📁 文件检查确认
当前正确文件已更新：
- ✅ `_worker.js` - 包含完整的 API 处理逻辑
- ✅ `public/_worker.js` - 构建后的生产文件

### 2. 🌐 部署到 Cloudflare Pages

#### 方法A：通过网页控制台部署
1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/pages)
2. 选择项目 `ai-trend-publish`
3. 点击 "Upload assets"
4. 上传整个 `public/` 文件夹

#### 方法B：使用 Wrangler CLI（需要登录）
```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 部署
npx wrangler pages deploy public --project-name ai-trend-publish
```

### 3. 🔍 验证部署

部署完成后，测试以下端点：

```bash
# 健康检查
curl https://mp.miyucaicai.cn/api/health

# 微信发布接口
curl -X POST https://mp.miyucaicai.cn/api/wechat/publish \
  -H "Content-Type: application/json" \
  -d '{"title":"测试","content":"<p>测试内容</p>"}'
```

### 4. 🎯 可用的 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/health` | GET | 服务健康检查 |
| `/api/wechat/publish` | POST | 发布文章到草稿 |
| `/api/wechat/upload-image` | POST | 上传图片 |
| `/api/wechat/token` | POST | 获取访问令牌 |
| `/coze/token` | POST | Coze插件-获取令牌 |
| `/coze/upload` | POST | Coze插件-上传图片 |
| `/coze/draft` | POST | Coze插件-创建草稿 |
| `/coze/publish` | POST | Coze插件-发布文章 |

### 5. 📋 测试用例

#### 测试发布接口
```json
POST /api/wechat/publish
{
  "title": "测试文章标题",
  "content": "<p>这是测试文章的HTML内容</p>",
  "summary": "文章摘要",
  "thumb_media_id": "封面图片ID（可选）"
}
```

#### 预期响应
```json
{
  "success": true,
  "data": {
    "media_id": "返回的媒体ID",
    "access_token": "微信访问令牌"
  },
  "message": "草稿创建成功",
  "timestamp": "2025-12-29T02:30:00.000Z"
}
```

### 6. 🔧 故障排除

#### 如果仍然是 404
1. 确认 `public/_worker.js` 文件是最新的（16.5KB）
2. 检查 Cloudflare Pages 部署日志
3. 清除浏览器缓存

#### 如果 API 错误
1. 检查微信 AppID/Secret 配置
2. 确认 IP 白名单设置
3. 查看错误码详细信息

## 🎉 完成

部署成功后，`https://mp.miyucaicai.cn/api/wechat/publish` 应该能正常工作了！