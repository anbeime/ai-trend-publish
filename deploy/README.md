# FreeSwitch + 小程序 部署指南

## 架构总览

```
微信小程序
    |
    v (HTTPS, 已备案域名)
国内服务器 (39.108.254.228, 腾讯云)
    |
    +-- Nginx 反向代理
    |     /api/ai/*       → RackNerd:3071/v1/*  (FreeSwitch API)
    |     /api/billing/*  → RackNerd:3073/*     (Enterprise 计费)
    |     /api/publish/*  → localhost:8002/*    (draft-api.py 微信发布)
    |     /api/hotspot/*  → top.miyucaicai.cn    (热点采集)
    |
    v (HTTP, 服务器间直连)
RackNerd VPS (San Jose, 1C/1G/20GB)
    |
    +-- FreeSwitch Core (Docker, 端口 3071)
    |     聚合 18+ 免费 LLM 提供商 + MiniMax + 智谱
    |
    +-- FreeSwitch Enterprise (Docker, 端口 3073)
    |     计费/账户管理 (可选)
    |
    +-- FreeSwitch Dashboard (Docker, 端口 3072)
    |     Web 管理面板
    |
    +-- Nginx (端口 80/443)
    |     HTTPS + 静态文件 + 反向代理
    |
    +-- Skill 商店 (/var/www/skill-store/)
```

## AI 调用优先级

```
小程序 callAI()
    |
    +-- 1. FreeSwitch API 代理 (最高优先级, 18+ 免费 LLM + MiniMax + 智谱)
    |      ↓ 失败时自动降级
    +-- 2. MiniMax TokenPlanPlus 直连
    |      ↓ 失败时自动降级
    +-- 3. 智谱 GLM 直连 (最终降级)
           ↓ 失败
          返回错误
```

---

## 部署步骤

### 第一步：购买 RackNerd VPS

1. 访问: https://www.racknerd.com/NewYear/
2. 选择: **1 GB KVM VPS - $21.99/年**
3. 配置:
   - Operating System: **Ubuntu 22.04** (或 18.04 with Docker Preinstalled)
   - Location: **San Jose, CA** (离亚洲最近的美国西部)
4. 付款后收到邮件，包含 IP 和 root 密码

### 第二步：初始化 VPS

```bash
# SSH 登录 RackNerd VPS
ssh root@YOUR_RACKNERD_IP

# 上传并执行初始化脚本
# 方法1: 直接下载
wget https://raw.githubusercontent.com/anbeime/antinet/main/deploy/racknerd/init-vps.sh
chmod +x init-vps.sh
./init-vps.sh

# 方法2: 手动复制
# 将 deploy/racknerd/init-vps.sh 内容粘贴到 VPS 上执行
```

### 第三步：部署 FreeSwitch

```bash
# 1. 克隆 FreeSwitch 仓库
cd /opt
git clone https://gitee.com/anbeime/api-token.git freeswitch
cd freeswitch

# 2. 复制 docker-compose 配置
# (使用 deploy/racknerd/freeswitch/docker-compose.yml)

# 3. 配置环境变量
cp .env.example .env
vi .env
# 填入 MiniMax / 智谱的 API Key

# 4. 启动
docker-compose up -d

# 5. 验证
curl http://localhost:3071/health
# 应返回 {"status":"ok",...}
```

### 第四步：配置 Nginx + HTTPS

```bash
# 1. 复制 Nginx 配置
cp deploy/racknerd/nginx/freeswitch.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/freeswitch.conf /etc/nginx/sites-enabled/

# 2. 修改配置中的域名
vi /etc/nginx/sites-available/freeswitch.conf
# 替换 YOUR_DOMAIN.com 为你的域名
# 替换 39.108.254.228 为你的国内服务器 IP

# 3. 申请 HTTPS 证书 (需要域名 DNS 指向 VPS)
apt install certbot python3-certbot-nginx
certbot --nginx -d fs.YOUR_DOMAIN.com

# 4. 重载 Nginx
nginx -t && nginx -s reload
```

### 第五步：部署 Skill 商店

```bash
# 执行部署脚本
chmod +x deploy/racknerd/deploy-skill-store.sh
./deploy/racknerd/deploy-skill-store.sh

# 验证
curl http://localhost/skills/
```

### 第六步：配置国内服务器反向代理

在你的腾讯云服务器 (39.108.254.228) 上：

```bash
# 1. 安装 Nginx (如果还没有)
apt install -y nginx

# 2. 复制配置
# 将 deploy/domestic/nginx/miniprogram-api.conf 上传到
# /etc/nginx/conf.d/miniprogram-api.conf

# 3. 修改配置
vi /etc/nginx/conf.d/miniprogram-api.conf
# 替换 api.YOUR_DOMAIN.com 为你的已备案域名
# 替换 RACKNERD_IP 为你的 RackNerd VPS IP

# 4. 配置 HTTPS 证书
# 腾讯云可申请免费 SSL 证书
# 将证书放在 /etc/nginx/ssl/ 目录

# 5. 重载 Nginx
nginx -t && nginx -s reload
```

### 第七步：修改小程序配置

1. 编辑 `config/secrets.js`:
   ```javascript
   freeswitch: {
     // 改为你的已备案域名
     gatewayUrl: "https://api.YOUR_DOMAIN.com/api/ai",
     ...
   }
   ```

2. 在微信公众平台配置域名白名单:
   - 登录 https://mp.weixin.qq.com/
   - 开发管理 → 开发设置 → 服务器域名
   - request 合法域名: `https://api.YOUR_DOMAIN.com`

3. 在微信开发者工具中预览测试

---

## 文件清单

### RackNerd VPS 上需要的文件

| 文件 | 位置 | 用途 |
|------|------|------|
| `init-vps.sh` | /root/ | 系统初始化 |
| `freeswitch/docker-compose.yml` | /opt/freeswitch/ | FreeSwitch 容器编排 |
| `freeswitch/.env` | /opt/freeswitch/ | API Key 配置 |
| `nginx/freeswitch.conf` | /etc/nginx/sites-available/ | Nginx 站点配置 |
| `deploy-skill-store.sh` | /root/ | Skill 商店部署 |

### 国内服务器上需要的文件

| 文件 | 位置 | 用途 |
|------|------|------|
| `domestic/nginx/miniprogram-api.conf` | /etc/nginx/conf.d/ | 反向代理配置 |
| `draft-api.py` | /opt/ (已有) | 微信发布服务 |
| `wechat_sdk.py` | /opt/ (已有) | 微信 SDK |
| `.env` | /opt/ (已有) | 微信密钥配置 |

### 小程序端修改的文件

| 文件 | 修改内容 |
|------|---------|
| `config/secrets.js` | 新增 freeswitch 配置块 |
| `utils/ai-service.js` | 新增 callFreeSwitch() + 调用优先级调整 |

---

## 验证清单

- [ ] RackNerd VPS 初始化完成 (Docker, Nginx, Swap)
- [ ] FreeSwitch 容器启动成功 (`docker ps`)
- [ ] `curl http://localhost:3071/health` 返回正常
- [ ] Nginx 配置正确 (`nginx -t` 通过)
- [ ] HTTPS 证书申请成功
- [ ] 国内服务器 Nginx 反向代理配置完成
- [ ] 小程序 `secrets.js` 中 `gatewayUrl` 已改为已备案域名
- [ ] 微信公众平台域名白名单已添加
- [ ] 微信开发者工具中调用 `callAI()` 测试通过
- [ ] Skill 商店可访问 (`/skills/`)
- [ ] FreeSwitch Dashboard 可访问 (`/dashboard/`)

---

## 常见问题

### Q: 1GB 内存够用吗？
A: 够用。FreeSwitch Core 限制 400MB，Dashboard 300MB，Redis 80MB，加上系统开销约 800MB，2GB Swap 兜底。

### Q: 如果 FreeSwitch 不可用怎么办？
A: 小程序会自动降级到 MiniMax 直连 → 智谱直连，不影响用户体验。

### Q: 需要域名备案吗？
A: RackNerd VPS 的域名不需要备案（国外服务器）。国内服务器的域名需要备案（微信小程序要求）。

### Q: 如何更新 Skill 商店？
A: 重新执行 `deploy-skill-store.sh` 即可，会自动 `git pull` 并更新。

### Q: 如何查看 FreeSwitch 日志？
A: `cd /opt/freeswitch && docker-compose logs -f`
