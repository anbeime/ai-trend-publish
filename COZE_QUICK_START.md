# 微信公众号极简API - Coze导入指南

## 📋 5个核心工具说明

本API包含5个核心工具，满足80%的使用场景：

### 1. get_access_token - 获取访问令牌
- **用途**: 所有API调用的基础，获取访问令牌
- **必填参数**: appid, secret (grant_type默认为client_credential)
- **返回**: access_token（有效期2小时）

### 2. upload_img - 上传图片素材  
- **用途**: 上传封面图或内容图片
- **必填参数**: access_token, 图片文件
- **可选参数**: type（thumb封面图/image内容图片）
- **返回**: media_id（图片素材ID）

### 3. add_draft - 创建文章草稿
- **用途**: 创建文章草稿，支持图文混合
- **必填参数**: access_token, title, content, thumb_media_id
- **可选参数**: author, digest, show_cover_pic等
- **返回**: media_id（草稿ID）

### 4. publish_article - 发布文章
- **用途**: 将草稿发布到公众号
- **必填参数**: access_token, media_id
- **可选参数**: channel（发布通道）
- **返回**: publish_id（发布ID）

### 5. get_gzh_info - 获取公众号信息
- **用途**: 验证连接和权限，获取公众号基本信息
- **必填参数**: access_token
- **返回**: 公众号昵称、头像、类型等

---

## 🚀 Coze导入步骤

### 第1步：导入OpenAPI文件
1. 打开Coze平台
2. 点击"创建插件" → "导入OpenAPI"
3. 上传 `coze-wechat-openapi.json` 文件
4. 确认导入，Coze会自动解析5个工具

### 第2步：配置服务器信息
在插件设置中配置：
- **服务器URL**: `https://mp.miyucaicai.cn`
- **Headers配置**:
  ```
  User-Agent: Coze/1.0 (MCP Plugin; Wechat Publish)
  Content-Type: application/json
  ```

### 第3步：测试核心链路
按顺序测试以下流程：
1. **获取令牌**: 调用 `get_access_token`
2. **上传图片**: 调用 `upload_img`
3. **创建草稿**: 调用 `add_draft`
4. **发布文章**: 调用 `publish_article`

---

## 📝 使用示例

### 完整发布流程
```yaml
# 1. 获取访问令牌
get_access_token:
  appid: "your_appid"
  secret: "your_secret"

# 2. 上传封面图
upload_img:
  access_token: "从步骤1获取的token"
  type: "thumb"
  media: [选择图片文件]

# 3. 创建草稿
add_draft:
  access_token: "从步骤1获取的token"
  articles:
    - title: "测试文章标题"
      content: "<p>这是文章内容，支持HTML格式</p>"
      thumb_media_id: "从步骤2获取的media_id"
      author: "作者名称"

# 4. 发布文章
publish_article:
  access_token: "从步骤1获取的token"
  media_id: "从步骤3获取的media_id"
```

---

## 🔧 扩展说明

### 如何添加更多工具
如果你需要添加其他工具（如获取历史文章、批量操作等），可以：
1. 复制现有工具的配置
2. 修改 `summary`、`description` 和 `path`
3. 调整参数和响应格式
4. 重新导入OpenAPI文件

### 常见问题
1. **access_token过期**: 有效期2小时，过期后需要重新获取
2. **图片上传失败**: 检查图片格式（支持jpg、png），大小不超过2MB
3. **草稿创建失败**: 确保thumb_media_id有效，标题和内容不为空
4. **发布失败**: 检查公众号权限，确保今日群发次数未用完

---

## 📞 技术支持

- **文档更新**: 2025-12-28 v1.0
- **适用版本**: Coze MCP插件
- **技术要求**: 需要配置IP白名单和代理域名

---

**提示**: 先用这5个核心工具测试完整流程，确认无误后再考虑扩展其他功能。这样能快速验证API集成的可行性。