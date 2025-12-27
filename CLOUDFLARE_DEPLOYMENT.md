# Cloudflare Pages 部署指南

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+ 
- npm 或 yarn
- Cloudflare 账户
- 微信公众号（已认证的服务号）

### 2. 微信公众号配置
在微信公众平台（https://mp.weixin.qq.com）中：
- 获取 AppID: `wx8410119dfbb7f756`
- 获取 AppSecret: `3c93e33e087e57b906f5c341aa5223b9`

## 🚀 部署步骤

### 第一步：安装依赖
```bash
npm install
```

### 第二步：构建项目
```bash
npm run build
```

### 第三步：登录 Cloudflare
```bash
npx wrangler login
```

### 第四步：部署到 Cloudflare Pages
```bash
npm run deploy
```

或者使用 Wrangler 直接部署：
```bash
npx wrangler pages deploy public
```

## 🔧 配置环境变量

在 Cloudflare Pages 项目设置中添加环境变量：

### Production 环境
```
WX_APPID=wx8410119dfbb7f756
WX_SECRET=3c93e33e087e57b906f5c341aa5223b9
```

### Preview 环境
```
WX_APPID=wx8410119dfbb7f756
WX_SECRET=3c93e33e087e57b906f5c341aa5223b9
```

## 📱 微信公众号白名单配置

### 获取 Cloudflare IP 地址

部署完成后，访问以下接口获取服务器IP：
```
https://your-domain.pages.dev/api/ip
```

### 在微信公众平台配置白名单

1. 登录微信公众平台
2. 进入「开发」->「基本配置」
3. 找到「IP白名单」设置
4. 将获取的IP地址添加到白名单中

**注意**：Cloudflare Pages 使用的IP地址可能会变化，建议：
- 定期检查IP地址
- 添加整个Cloudflare IP段到白名单

### Cloudflare IP 范围
最新IP列表请参考：https://www.cloudflare.com/ips/

## 🎯 API 接口说明

### 健康检查
```
GET /api/health
```

### 微信配置管理
```
GET  /api/wechat/config    # 获取配置状态
POST /api/wechat/config    # 保存微信配置
```

### 微信文章发布
```
POST /api/wechat/publish
Content-Type: application/json

{
  "title": "文章标题",
  "content": "文章内容HTML",
  "summary": "文章摘要",
  "thumb_media_id": "封面图片ID"
}
```

### 微信图片上传
```
POST /api/wechat/upload-image
Content-Type: multipart/form-data

media: [图片文件]
```

### 获取服务器信息
```
GET /api/ip
```

## 🔄 本地开发

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:8788 查看应用

### 构建预览
```bash
npm run build
npm run preview
```

## 📊 功能特性

### ✅ 已实现功能
- [x] 微信公众号配置管理
- [x] 文章发布到草稿
- [x] 图片上传
- [x] 服务器状态监控
- [x] 响应式Web界面

### 🚧 计划功能
- [ ] 多平台发布支持
- [ ] 定时发布功能
- [ ] 文章模板系统
- [ ] 数据统计分析

## 🔍 故障排除

### 1. 微信API调用失败
- 检查AppID和AppSecret是否正确
- 确认服务器IP已添加到微信白名单
- 检查微信公众号是否已认证

### 2. 部署失败
- 确认Wrangler已正确登录
- 检查项目配置文件
- 查看构建日志

### 3. 访问速度慢
- 检查Cloudflare缓存设置
- 确认DNS配置正确

## 📞 技术支持

如遇到问题，请：
1. 检查控制台错误日志
2. 访问 `/api/health` 检查服务状态
3. 确认微信配置正确性

## 🔄 自动部署

可以设置GitHub Actions实现自动部署：

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ai-trend-publish
          directory: public
```

## 🎉 部署完成

部署完成后，你将获得：
- 一个功能完整的Web应用
- 支持微信公众号发布的API
- 实时监控界面
- 自动化的部署流程

开始使用你的智能文章发布工具吧！