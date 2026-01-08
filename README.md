# AI热点自动发布系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.8-blue)](pyproject.toml)

一个智能的AI热点内容自动采集、改写和发布系统，支持多种AI模型和发布平台。

## ✨ 核心特性

- 🤖 **多AI模型支持**：集成多种大语言模型（GPT、Claude、Gemini等）
- 📊 **智能热点采集**：自动从多个平台采集AI相关热点信息
- ✍️ **AI内容改写**：使用COZE工作流进行内容优化和改写
- 🔄 **自动化工作流**：基于N8N的完整自动化发布流程
- 📱 **多平台发布**：支持微信公众号、其他社交媒体
- 🌐 **云端部署**：支持Vercel、Cloudflare等云平台部署
- 🔧 **模块化设计**：易于扩展和定制

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Python >= 3.8
- N8N (工作流引擎)
- Git

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/anbeime/ai-trend-publish.git
cd ai-trend-publish
```

2. **安装依赖**

```bash
# 安装Node.js依赖
npm install

# 安装Python依赖
pip install -r requirements.txt
```

3. **配置环境变量**

```bash
cp .env.example .env
# 编辑.env文件，配置微信公众号等信息
```

4. **启动服务**

```bash
# 启动N8N工作流引擎
npm run start:n8n

# 启动AI模型服务
npm run start:ai

# 启动发布服务
npm run start:publish
```

## 📋 自动发布方案

### 方案一：COZE + N8N 工作流（推荐）

最完整的自动化解决方案，结合COZE的AI改写能力和N8N的工作流编排。

#### 配置步骤

1. **导入N8N工作流**

```bash
npx n8n import:workflow --input n8n-auto-publish-workflow.json
```

2. **配置COZE工作流**

- 访问 [COZE平台](https://www.coze.cn/)
- 创建新的工作流，配置输入参数为文章内容
- 获取Workflow ID

3. **配置N8N凭证**

- 在N8N中添加COZE API凭证
- 配置微信公众号凭证

4. **启动自动发布**

```bash
# 工作流会自动：
# 1. 采集热点信息 (http://top.miyucaicai.cn/)
# 2. 过滤AI相关内容
# 3. 调用COZE进行内容改写
# 4. 发布到微信公众号
```

### 方案二：本地AI模型 + 定时任务

使用内置的AI模型服务，完全本地化部署。

#### 配置步骤

1. **启动AI模型服务**

```bash
cd ai-models
python main.py
```

2. **配置定时任务**

```bash
# 使用系统定时任务或GitHub Actions
npm run schedule:publish
```

### 方案三：云端AI服务集成

集成云端AI服务（如OpenAI、Claude API）。

#### 支持的AI服务

- OpenAI GPT系列
- Anthropic Claude
- Google Gemini
- 百度文心一言
- 腾讯混元

#### 配置示例

```javascript
// config/ai.js
module.exports = {
  providers: [
    {
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4",
    },
    {
      name: "claude",
      apiKey: process.env.CLAUDE_API_KEY,
      model: "claude-3-sonnet",
    },
  ],
};
```

## 📊 热点信息采集

### 数据源

项目内置了多个热点信息采集源：

- **AI新闻聚合**：http://top.miyucaicai.cn/
- **科技媒体**：36kr、IT之家、虎嗅等
- **社交平台**：知乎热榜、B站热门
- **开发者社区**：GitHub Trending、Hacker News

### 采集配置

```javascript
// config/sources.js
module.exports = {
  sources: [
    {
      name: "ai-news",
      url: "http://top.miyucaicai.cn/",
      selectors: {
        title: ".news-title",
        content: ".news-content",
        timestamp: ".news-time",
      },
      filters: {
        keywords: ["AI", "人工智能", "机器学习", "深度学习"],
        minScore: 10000,
      },
    },
  ],
};
```

## 🔧 部署选项

### Vercel 部署（推荐）

1. **连接GitHub仓库**

```bash
vercel --prod
```

2. **配置环境变量**

- `WX_APPID`: 微信公众号AppID
- `WX_SECRET`: 微信公众号Secret
- `COZE_API_KEY`: COZE API密钥

3. **IP白名单配置**
   将Vercel的IP范围添加到微信公众号白名单：

```
76.76.19.0/24
76.76.21.0/24
8.209.103.0/24
8.209.104.0/24
```

### Docker 部署

```bash
docker build -t ai-trend-publish .
docker run -p 3000:3000 ai-trend-publish
```

### 传统服务器部署

```bash
npm run build
npm run start:production
```

## 📚 API 文档

### 核心API

- `GET /api/health` - 健康检查
- `POST /api/publish` - 发布文章
- `GET /api/hot-news` - 获取热点信息
- `POST /api/ai/rewrite` - AI内容改写

### COZE插件API

- `POST /coze/token` - 获取微信令牌
- `POST /coze/draft` - 创建草稿
- `POST /coze/publish` - 发布文章

## 🔐 安全配置

### 环境变量

```bash
# 微信公众号配置
WX_APPID=your_app_id
WX_SECRET=your_app_secret

# AI服务配置
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key

# 数据库配置（可选）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_trend_publish

# N8N配置
N8N_ENCRYPTION_KEY=your_encryption_key
```

### IP白名单

确保将服务器IP添加到微信公众号的白名单中。

## 🧪 测试

### 单元测试

```bash
npm test
```

### 集成测试

```bash
npm run test:integration
```

### 手动测试

```bash
# 测试微信发布
python test_wechat_draft.py

# 测试AI改写
python test_ai_rewrite.py

# 测试完整流程
python test_full_workflow.py
```

## 📁 项目结构

```
ai-trend-publish/
├── ai-models/           # AI模型服务
│   ├── app/            # 模型应用代码
│   └── main.py         # 启动脚本
├── api/                # API服务
│   ├── index.js        # 主API文件
│   └── health.js       # 健康检查
├── n8n/                # N8N工作流配置
│   └── workflows/      # 工作流文件
├── public/             # 静态资源
├── config/             # 配置文件
├── scripts/            # 部署脚本
├── test/               # 测试文件
├── .env.example        # 环境变量示例
├── vercel.json         # Vercel配置
├── package.json        # Node.js配置
├── pyproject.toml      # Python配置
└── README.md           # 项目文档
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [N8N](https://n8n.io/) - 工作流自动化平台
- [COZE](https://www.coze.cn/) - AI工作流平台
- [Vercel](https://vercel.com/) - 云平台部署

## 📞 联系我们

- 项目主页: https://github.com/anbeime/ai-trend-publish
- 问题反馈: https://github.com/anbeime/ai-trend-publish/issues
- 邮箱: support@trendpublish.ai

---

**⭐ 如果这个项目对你有帮助，请给我们一个star！**
