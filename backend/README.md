# TikTokGen 后端 API

数字人营销短视频快速生成平台后端服务。

## 技术栈

- **Python 3.11+**
- **FastAPI 0.109.0** - Web框架
- **SQLAlchemy 2.0** - ORM
- **PostgreSQL 15+** - 数据库
- **Redis 7.x** - 缓存/任务队列
- **Celery 5.3** - 异步任务

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入实际配置
```

### 3. 初始化数据库

```bash
python init_db.py
```

### 4. 启动服务

```bash
# 启动FastAPI服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001

# 启动Celery Worker (新终端)
celery -A app.tasks worker --loglevel=info --pool=solo
```

### 5. 访问API文档

- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

## API端点

### 认证 `/api/v1/auth`
- `GET /auth/github` - 获取GitHub OAuth URL
- `POST /auth/github/callback` - OAuth回调
- `GET /auth/me` - 获取当前用户
- `POST /auth/logout` - 登出

### 用户 `/api/v1/users`
- `GET /users/me/usage` - 获取用量统计
- `PUT /users/me` - 更新用户信息

### 资产 `/api/v1/assets`
- `GET /assets` - 获取资产列表
- `GET /assets/{id}` - 获取资产详情
- `POST /assets/scripts` - 创建脚本
- `POST /assets/avatars/upload` - 上传形象
- `PUT /assets/{id}` - 更新资产
- `DELETE /assets/{id}` - 删除资产

### 项目 `/api/v1/projects`
- `GET /projects` - 获取项目列表
- `POST /projects` - 创建视频生成任务
- `GET /projects/{id}` - 获取项目详情
- `GET /projects/{id}/status` - 获取项目状态
- `DELETE /projects/{id}` - 删除项目

### 生成 `/api/v1/generation`
- `POST /generation/audio-preview` - 生成音频预览
- `POST /generation/script` - AI生成脚本

## 项目结构

```
backend/
├── app/
│   ├── main.py                  # FastAPI应用入口
│   ├── config.py                # 配置管理
│   ├── database.py              # 数据库连接
│   ├── dependencies.py          # 依赖注入
│   ├── core/                    # 核心模块
│   ├── api/v1/                  # API路由
│   ├── models/                  # 数据模型
│   ├── schemas/                 # Pydantic模式
│   ├── services/                # 业务逻辑
│   ├── integrations/            # 第三方服务
│   └── tasks/                   # Celery任务
├── requirements.txt
├── .env.example
└── init_db.py
```

## 第三方服务

| 服务 | 用途 |
|------|------|
| GitHub OAuth | 用户登录 |
| Index TTS | 语音合成 |
| GLM-4.7 | 脚本生成 |
| WaveSpeed AI | 数字人视频 |
| 阿里云OSS | 文件存储 |
| PostgreSQL | 数据库 |
| Redis | 缓存/队列 |

## 开发说明

### 数据库迁移

```bash
# 查看当前迁移状态
alembic current

# 创建新迁移
alembic revision --autogenerate -m "description"

# 执行迁移
alembic upgrade head
```

### 运行测试

```bash
pytest tests/ -v
```

### Celery监控

```bash
# 启动Flower监控
celery -A app.tasks flower
```

访问 http://localhost:5555

## 环境变量

主要环境变量见 `.env.example`：

- `DATABASE_URL` - PostgreSQL连接URL
- `REDIS_URL` - Redis连接URL
- `JWT_SECRET_KEY` - JWT密钥
- `GITHUB_CLIENT_ID` - GitHub OAuth应用ID
- `GLM_API_KEY` - 智谱AI密钥
- `WAVESPEED_API_KEY` - WaveSpeed API密钥
- `OSS_ACCESS_KEY_ID` - 阿里云OSS密钥

## 注意事项

1. 确保PostgreSQL和Redis服务已启动
2. 首次运行需要执行 `init_db.py` 初始化数据库
3. Celery Worker必须启动才能处理视频生成任务
4. API默认运行在 `http://0.0.0.0:3001`
