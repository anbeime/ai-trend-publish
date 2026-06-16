# AI热点自动发布系统 & 内容创作平台

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-%3E%3D3.11-brightgreen)](backend/requirements.txt)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![WeChat](https://img.shields.io/badge/WeChat-MiniProgram-brightgreen)](https://mp.weixin.qq.com)

一个集微信小程序 + FastAPI 后端 + React 前端的 **AI 内容创作全栈平台**，支持热点采集、AI 内容生成（文章/视频/数字人）、多平台自动发布。

> 本项目由 [ai-trend-publish-main](https://github.com/anbeime/ai-trend-publish)、[tiktok-gen-main](https://github.com/anbeime/tiktok-gen)、[cobalt](https://github.com/imputnet/cobalt)、[Agent-Reach](https://github.com/anbeime/Agent-Reach) 合并重构而成。

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                   微信小程序 (WeChat Mini Program)            │
│  pages/ · cloudfunctions/ · components/ · config/            │
├─────────────────────────────────────────────────────────────┤
│              React 前端 (Vite + TypeScript)                   │
│  Dashboard · QuickCreate · AssetsStudio · Settings            │
├─────────────────────────────────────────────────────────────┤
│              FastAPI 后端 (Python 3.11+)                       │
│  ┌─────────┬──────────┬──────────┬──────────┬──────────┐    │
│  │ 热点采集 │ AI 生成   │ 多平台发布 │ 媒体下载  │ API 配置 │    │
│  │miyucaicai│ GLM-4   │ 微信     │ cobalt   │ 密钥管理 │    │
│  │ V2EX    │ Agnes    │ 小红书   │ YouTube  │ 提供商   │    │
│  │ 微博    │ TTS      │ 抖音     │ B站      │ 验证     │    │
│  │ 知乎    │ 数字人    │ B站      │ TikTok   │          │    │
│  └─────────┴──────────┴──────────┴──────────┴──────────┘    │
├─────────────────────────────────────────────────────────────┤
│              Celery Worker (异步任务)                          │
│  视频生成 · TTS合成 · 数字人渲染 · 自动发布                    │
├─────────────────────────────────────────────────────────────┤
│              CLI 工具 (Python)                                 │
│  doctor · publish · extract · configure                       │
├─────────────────────────────────────────────────────────────┤
│              基础设施                                          │
│  PostgreSQL · Redis · Docker Compose · Cloudflare Pages       │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心功能

### 热点采集
| 数据源 | 说明 | 实现 |
|--------|------|------|
| [Miyucaicai AI 热榜](https://top.miyucaicai.cn/) | AI 领域热点聚合 | `hotspot_service.py` |
| V2EX | 技术社区热门 | `hotspot_service.py` |
| 微博热搜 | 社交热点 | `hotspot_service.py` |
| 知乎热榜 | 知识问答热点 | `hotspot_service.py` |

### AI 内容生成
- **LLM 文案** — GLM-4.7、Agnes、自定义 OpenAI 兼容模型
- **TTS 语音** — SiliconFlow IndexTTS、302.AI IndexTTS（支持情感控制 + 音色克隆）
- **AI 图片** — Banana Pro、APIMart GPT-Image-2、Agnes Image
- **数字人视频** — WaveSpeed InfiniteTalk、火山引擎 Ark Seedance、Agnes Video
- **工作流引擎** — 7 步 Agent 流水线（热点→脚本→分镜→合成→质检→适配→发布）

### 多平台发布
| 平台 | 状态 | 方式 |
|------|------|------|
| 微信公众号 | ✅ | 草稿箱 API (素材上传 + 创建草稿) |
| 小红书 | ✅ | Cookie 认证 (上传图片 + 发布笔记) |
| 抖音 | 🚧 开发中 | |
| B站 | 🚧 开发中 | |
| Twitter/X | 🚧 开发中 | (channels 框架已就绪) |

### 媒体下载 (内嵌 cobalt 引擎)
| 平台 | 状态 |
|------|------|
| YouTube, Bilibili, TikTok | ✅ |
| 小红书, Twitter/X, Instagram | ✅ |
| Reddit, Vimeo, Facebook | ✅ |
| 抖音, 微博 | 🚧 |

---

## 快速开始

### 环境要求
- Python >= 3.11
- Node.js >= 18.0.0
- Docker & Docker Compose (可选)
- PostgreSQL 15+ & Redis 7+ (可选)

### 启动后端 (FastAPI)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 编辑配置
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

### 启动前端 (React)
```bash
cd frontend
npm install
npm run dev
```

### 启动微信小程序
用微信开发者工具打开项目根目录，配置 `project.config.json` 中的 appid。

### Docker Compose (一键部署)
```bash
docker-compose up -d
```

---

## 项目结构

```
ai-trend-publish-main/
│
├── pages/                     # 微信小程序页面
├── cloudfunctions/            # 微信云函数 (保留)
├── utils/                     # 工具函数 (wechat-publish, crawler 等)
├── config/                    # 智能体/平台/提示词配置
│
├── backend/                   # FastAPI 后端 (来自 tiktok-gen)
│   └── app/
│       ├── api/v1/            # REST API (auth, projects, generation 等)
│       ├── services/
│       │   ├── hotspot_service.py    # 热点采集 (多源)
│       │   ├── generation_service.py # AI 生成 (TTS/脚本/分镜)
│       │   ├── publishing_service.py # 多平台发布 (微信/小红书)
│       │   ├── project_service.py    # 项目管理
│       │   └── ...
│       ├── media/             # ★ 媒体下载模块 (来自 cobalt)
│       │   ├── downloader.py         # 统一下载入口
│       │   └── extractors/           # 各平台解析器
│       ├── publishing/        # ★ 发布连接层 (来自 Agent-Reach)
│       │   ├── publisher.py          # 统一发布接口
│       │   └── channels/             # 各平台发布通道
│       ├── integrations/      # AI 提供方集成
│       ├── tasks/             # Celery 异步任务
│       └── models/            # SQLAlchemy 模型
│
├── frontend/                  # React 前端 (来自 tiktok-gen)
│   ├── App.tsx                # 主应用 (路由 + 认证)
│   ├── pages/                 # 页面组件
│   ├── components/            # UI 组件
│   └── services/              # API 客户端
│
├── cli/                       # CLI 工具 (来自 Agent-Reach)
│   └── agent_reach/
│       ├── cli.py             # CLI 入口
│       └── doctor.py          # 健康检查
│
├── api/ / src/ / public/      # Cloudflare/Deno 部署 (保留)
├── wrangler.toml              # Cloudflare Pages 配置
├── docker-compose.yml         # 生产部署 (PG + Redis + Backend + Frontend)
└── README.md                  # ← 你在这里
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 小程序前端 | WXML + WXSS + JavaScript (ES6+) |
| Web 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 后端 API | FastAPI (Python 3.11) + SQLAlchemy + Pydantic |
| 异步任务 | Celery + Redis |
| 数据库 | PostgreSQL 15 |
| AI 集成 | GLM-4、Agnes AI、SiliconFlow、WaveSpeed、Ark Seedance |
| 部署 | Docker Compose、Cloudflare Pages、微信云开发 |

---

## 相关项目 (已合并)

| 原始项目 | 合并位置 | 功能 |
|----------|----------|------|
| [ai-trend-publish](https://github.com/anbeime/ai-trend-publish) | 根项目 | 微信小程序 + 热点采集 + 公众号/小红书发布 |
| [tiktok-gen](https://github.com/anbeime/tiktok-gen) | `backend/` + `frontend/` | FastAPI 后端 + React 前端 + 数字人视频生成 |
| [cobalt](https://github.com/imputnet/cobalt) | `backend/app/media/` | 媒体下载引擎 (21+ 平台) |
| [Agent-Reach](https://github.com/anbeime/Agent-Reach) | `backend/app/publishing/` + `cli/` | 平台连接层 + CLI 工具 |

---

## 路线图

### v3.0 (当前)
- [x] 统一 FastAPI 后端 + React 前端
- [x] 内嵌 cobalt 媒体下载模块
- [x] 统一多平台发布接口 (Publisher)
- [x] CLI 工具链
- [x] Docker Compose 一键部署

### v3.1 (计划中)
- [ ] 抖音/快手/B站发布通道
- [ ] 热点可视化大屏
- [ ] AI 自动排版优化 (Markdown → 富文本)
- [ ] 发布排期管理

### v4.0 (未来)
- [ ] 视频 AI 一键成片
- [ ] 账号矩阵管理
- [ ] 数据统计分析仪表板
- [ ] 团队协作

---

## 许可证

[MIT License](LICENSE)

## 联系

- **项目主页**: https://github.com/anbeime/ai-trend-publish
- **问题反馈**: https://github.com/anbeime/ai-trend-publish/issues
- **版本**: v3.0
- **更新**: 2026-06-16
