# Cloudflare Pages 部署指南

## 🎯 目标
让 `https://mp.miyucaicai.cn/` 具备完整的后端API功能，支持 Coze 插件调用。

## 🚀 部署方案

### 方案1：Cloudflare Pages Functions（推荐）

在 `mp.miyucaicai.cn` 域名下部署 Cloudflare Functions，提供微信API代理服务。

#### 第1步：创建 Functions 目录结构
```
mp.miyucaicai.cn/
├── _worker.js          # 主要的 Workers 脚本
├── api/
│   ├── wechat/
│   │   ├── token.js    # 获取 access_token
│   │   ├── draft.js    # 创建草稿
│   │   ├── upload.js   # 上传图片
│   │   └── publish.js  # 发布文章
│   └── health.js       # 健康检查
└── index.html          # 现有的前端页面
```

#### 第2步：主要的 Worker 脚本
```javascript
// _worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // API 路由
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // 静态文件
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 微信 API 代理
  if (path.startsWith('/api/wechat/')) {
    return proxyToWechat(request, env);
  }
  
  // 健康检查
  if (path === '/api/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'TrendPublish API'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('API Not Found', { status: 404 });
}

async function proxyToWechat(request, env) {
  const url = new URL(request.url);
  const wechatUrl = `https://api.weixin.qq.com${url.pathname.replace('/api/wechat', '')}${url.search}`;
  
  // 转发请求到微信 API
  const response = await fetch(wechatUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  return response;
}
```

### 方案2：部署到自己的服务器

如果你有自己的服务器，可以部署 Node.js 服务：

#### 第1步：准备服务器
- 安装 Node.js (v18+)
- 安装 Nginx (可选)
- 准备域名和 SSL 证书

#### 第2步：部署代码
```bash
# 克隆代码
git clone https://github.com/anbeime/ai-trend-publish.git
cd ai-trend-publish

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加微信配置

# 启动服务
npm run start
```

#### 第3步：Nginx 配置
```nginx
server {
    listen 80;
    server_name mp.miyucaicai.cn;
    
    # 静态文件
    location / {
        root /path/to/ai-trend-publish/public;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 方案3：使用 GitHub Actions + Cloudflare（自动化）

#### 第1步：创建 GitHub Actions 工作流
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
      id-token: write

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install Dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to Cloudflare Pages
      uses: cloudflare/pages-action@v1
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        projectName: 'ai-trend-publish'
        directory: 'dist'
```

## 🔧 立即可用的 Coze 插件配置

### 1. 基础 API 配置
```yaml
openapi: 3.0.0
info:
  title: 微信文章发布 API
  version: 1.0.0
servers:
  - url: https://mp.miyucaicai.cn
paths:
  /api/wechat/token:
    get:
      summary: 获取微信访问令牌
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: secret
          in: query
          required: true
          schema: { type: string }
        - name: grant_type
          in: query
          required: true
          schema: { type: string, default: client_credential }
      responses:
        '200':
          description: 返回访问令牌
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token: { type: string }
                  expires_in: { type: integer }

  /api/wechat/draft:
    post:
      summary: 创建文章草稿
      parameters:
        - name: access_token
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                articles:
                  type: array
                  items:
                    type: object
                    properties:
                      title: { type: string }
                      content: { type: string }
                      thumb_media_id: { type: string }
                    required: [title, content, thumb_media_id]
      responses:
        '200':
          description: 创建成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  media_id: { type: string }
```

## 🎯 立即部署步骤

### 第1步：选择部署方案
- **推荐方案1**：Cloudflare Pages Functions（免费、简单）
- **备选方案2**：自己的服务器（完全控制）

### 第2步：实施部署
1. 在 Cloudflare Pages 中连接你的 GitHub 仓库
2. 设置构建配置：`npm run build`
3. 设置环境变量：微信 AppID/Secret

### 第3步：验证部署
访问：`https://mp.miyucaicai.cn/api/health`
应该返回：`{"status":"ok","service":"TrendPublish API"}`

### 第4步：配置 Coze 插件
1. 导入上面的 OpenAPI 配置
2. 设置服务器地址为：`https://mp.miyucaicai.cn`
3. 测试各个 API 接口

## 📋 检查清单

部署前确认：
- [ ] 微信公众平台 IP 白名单已配置 Cloudflare IP
- [ ] 微信 AppID 和 AppSecret 已准备
- [ ] 域名 `mp.miyucaicai.cn` 可正常访问
- [ ] SSL 证书已配置

部署后验证：
- [ ] `https://mp.miyucaicai.cn/api/health` 返回正常
- [ ] 微信 API 代理功能正常
- [ ] Coze 插件可以成功调用接口
- [ ] 文章发布功能完整可用

## 🚨 注意事项

1. **IP 白名单**：Cloudflare Pages 有固定的 IP 范围，需要添加到微信白名单
2. **环境变量**：敏感信息不要暴露在前端代码中
3. **错误处理**：完善的错误处理和日志记录
4. **性能优化**：启用缓存，减少微信 API 调用频率

---

**更新时间**：2025-12-28  
**状态**：待部署