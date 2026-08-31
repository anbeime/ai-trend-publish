# AI热点自动发布系统 & 内容创作小程序

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![WeChat](https://img.shields.io/badge/WeChat-MiniProgram-brightgreen.svg)](https://mp.weixin.qq.com)

一个集成了微信小程序和自动化发布系统的AI内容创作平台，支持热点采集、智能改写和多平台发布。

---

## ✨ 核心特性

### 📱 微信小程序端
- **智能选题筛选** - 10分制打分系统,自动推荐优质选题
- **网页内容采集** - 一键将网页转换为Markdown
- **爆款文章生成** - 5种风格模板,AI智能创作
- **微信公众号发布** - 素材上传+草稿创建一站式
- **小红书发布** - 图文笔记自动发布

### 🤖 自动化系统
- **多AI模型支持** - 集成GPT、Claude、Gemini等多种大语言模型
- **智能热点采集** - 自动从多个平台采集AI相关热点信息
- **AI内容改写** - 使用COZE工作流进行内容优化和改写
- **自动化工作流** - 基于N8N的完整自动化发布流程
- **多平台发布** - 支持微信公众号、小红书等社交媒体
- **云端部署** - 支持Vercel、Cloudflare等云平台部署

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Python >= 3.8 (可选，用于自动化系统)
- 微信开发者工具
- 微信云开发账号
- N8N (可选，用于工作流引擎)

### 微信小程序部署

```bash
# 1. 克隆项目
git clone https://github.com/anbeime/ai-trend-publish.git
cd ai-trend-publish

# 2. 安装依赖
npm install

# 3. 配置环境变量（见CONFIG.md）

# 4. 打开微信开发者工具运行
```

### 自动化系统部署

#### 方案一：COZE + N8N 工作流（推荐）

```bash
# 1. 导入N8N工作流
npx n8n import:workflow --input n8n-auto-publish-workflow.json

# 2. 配置COZE工作流
# 访问 https://www.coze.cn/ 创建工作流

# 3. 启动服务
npm run start:n8n
```

#### 方案二：Vercel部署

```bash
vercel --prod
```

---

## 📖 使用示例

### 智能筛选热点

```javascript
// 启用智能筛选
await TrendManager.fetchTrends({
  enableSmartFilter: true,
  keywords: ['AI', '科技'],
  minScore: 7
});
```

### 发布到微信公众号

```javascript
const result = await wx.cloud.callFunction({
  name: 'wechat-publish-api',
  data: {
    action: 'workflow',
    data: {
      title: '文章标题',
      content: '<html>内容</html>',
      cover: '封面URL'
    }
  }
});
```

### 发布到小红书

```javascript
const result = await wx.cloud.callFunction({
  name: 'xiaohongshu-publisher',
  data: {
    action: 'workflow',
    data: {
      title: '笔记标题',
      content: '笔记内容',
      images: ['图片URL'],
      tags: ['标签']
    }
  }
});
```

---

## 📦 云函数列表

| 云函数 | 功能 | 状态 |
|--------|------|------|
| wechat-publish-api | 微信公众号发布 | ✅ |
| topic-scorer | 智能选题筛选 | ✅ |
| xiaohongshu-publisher | 小红书发布 | ✅ |
| url-to-markdown | 网页转Markdown | ✅ |
| hotspot-miyucaicai | 热点采集 | ✅ |
| agentAI | AI智能体 | ✅ |
| generateImage | 图片生成 | ✅ |

---

## 📊 热点信息采集

### 数据源

- **AI新闻聚合**: http://top.miyucaicai.cn/
- **科技媒体**: 36kr、IT之家、虎嗅等
- **社交平台**: 知乎热榜、B站热门
- **开发者社区**: GitHub Trending、Hacker News

---

## 🔧 技术栈

### 微信小程序
- **前端**: 微信小程序 + WXML + WXSS
- **后端**: 微信云开发 + Node.js云函数
- **AI**: 智能体API

### 自动化系统
- **工作流**: N8N
- **AI服务**: COZE、OpenAI、Claude、Gemini
- **部署**: Vercel、Cloudflare
- **语言**: Node.js、Python

---

## 📚 文档

- [配置说明](CONFIG.md) - 环境变量配置指南
- [项目总览](PROJECT_OVERVIEW.md) - 完整的项目介绍
- [快速参考](QUICK_REFERENCE.md) - API速查卡片

---

## 🗺️ 路线图

### v2.0 (当前) ✅
- [x] 智能选题筛选
- [x] 小红书发布
- [x] 网页转Markdown
- [x] 微信公众号完整发布
- [x] N8N工作流集成

### v2.1 (计划中)
- [ ] Markdown格式化优化
- [ ] HTML排版生成
- [ ] 图片智能搜索
- [ ] B站专栏发布

### v3.0 (未来)
- [ ] X/Twitter发布
- [ ] 视频合成功能
- [ ] AI配音集成
- [ ] 数据统计分析

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 开发规范

```bash
# 代码规范
- ES6+语法
- 驼峰命名
- 完善注释

# 提交规范
feat: 新功能
fix: 修复bug
docs: 文档更新
```

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🙏 致谢

- [N8N](https://n8n.io/) - 工作流自动化平台
- [COZE](https://www.coze.cn/) - AI工作流平台
- [Vercel](https://vercel.com/) - 云平台部署
- 微信云开发团队

---

## 📞 联系

- **项目主页**: https://github.com/anbeime/ai-trend-publish
- **问题反馈**: https://github.com/anbeime/ai-trend-publish/issues
- **版本**: v2.0
- **更新**: 2026-02-13

---

**⭐ 如果这个项目对你有帮助，请给我们一个star！**
