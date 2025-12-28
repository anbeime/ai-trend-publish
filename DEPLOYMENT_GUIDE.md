# 微信API代理服务部署指南

## 📋 部署选项

你有两种部署方式可选，推荐使用**方案1（Nginx反向代理）**，更简单高效。

---

## 🚀 方案1：Nginx反向代理（推荐）

### 优势
- ✅ 零开发，复制粘贴即用
- ✅ 高性能，支持并发连接
- ✅ 自动处理SSL证书
- ✅ 成熟稳定，运维简单

### 快速部署步骤

#### 1. 安装Nginx
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# Windows
# 下载 nginx for Windows 并解压
```

#### 2. 配置反向代理
```bash
# 下载配置文件
wget https://raw.githubusercontent.com/your-repo/nginx-proxy.conf

# 复制到Nginx配置目录
sudo cp nginx-proxy.conf /etc/nginx/sites-available/wechat-proxy
sudo ln -s /etc/nginx/sites-available/wechat-proxy /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

#### 3. 配置域名解析
将你的域名（如 `mp.miyucaicai.cn`）解析到服务器IP。

#### 4. 配置SSL证书（可选但推荐）
```bash
# 使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d mp.miyucaicai.cn
```

---

## 🔧 方案2：Node.js转发服务（备选）

### 适用场景
- 需要自定义逻辑（如请求日志、缓存等）
- 环境限制无法安装Nginx
- 需要快速测试验证

### 快速部署步骤

#### 1. 运行服务
```bash
# 下载服务文件
wget https://raw.githubusercontent.com/your-repo/simple-proxy-server.js

# 启动服务（端口80需要sudo权限）
sudo node simple-proxy-server.js

# 或使用PM2进程管理
npm install -g pm2
pm2 start simple-proxy-server.js --name "wechat-proxy"
pm2 startup
pm2 save
```

#### 2. 开启日志（可选）
```bash
# 开启详细日志
LOG_REQUESTS=true node simple-proxy-server.js

# 查看PM2日志
pm2 logs wechat-proxy
```

---

## 🔧 关键配置检查

### 1. IP白名单配置
确保在微信公众平台后台添加了服务器IP到白名单：
1. 登录微信公众平台
2. 设置 → 开发者ID → IP白名单
3. 添加你的服务器公网IP

### 2. 域名配置
- **代理域名**: `mp.miyucaicai.cn`（你的实际域名）
- **目标API**: `https://api.weixin.qq.com`
- **健康检查**: `http://你的域名/health`

### 3. 防火墙配置
```bash
# 开放80和443端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload
```

---

## 🧪 测试验证

### 1. 基础连通性测试
```bash
# 测试域名解析
nslookup mp.miyucaicai.cn

# 测试健康检查
curl http://mp.miyucaicai.cn/health

# 测试代理功能
curl "http://mp.miyucaicai.cn/cgi-bin/token?grant_type=client_credential&appid=test&secret=test"
```

### 2. Coze集成测试
1. 在Coze中导入 `coze-wechat-openapi.json`
2. 配置服务器URL：`https://mp.miyucaicai.cn`
3. 测试 `get_access_token` 工具
4. 验证返回的access_token是否有效

---

## 📊 监控和运维

### 性能监控
```bash
# Nginx日志
tail -f /var/log/nginx/wechat_proxy.access.log

# Node.js服务状态
pm2 status
pm2 monit
```

### 常见问题排查

#### 问题1：502 Bad Gateway
**可能原因**：
- 微信API无法访问
- 网络连接问题
- 域名解析错误

**解决方案**：
```bash
# 检查网络连通性
ping api.weixin.qq.com
curl -I https://api.weixin.qq.com

# 检查Nginx配置
sudo nginx -t
```

#### 问题2：40164 IP不在白名单
**解决方案**：
1. 检查IP白名单配置
2. 确认服务器公网IP正确
3. 重新添加IP到微信白名单

#### 问题3：413 Request Entity Too Large
**解决方案**：
```nginx
# 在Nginx配置中增加
client_max_body_size 10M;
```

---

## 📝 维护建议

### 1. 定期备份
- Nginx配置文件
- SSL证书文件
- 域名解析记录

### 2. 监控指标
- 请求响应时间
- 错误率统计
- 带宽使用情况

### 3. 安全加固
- 定期更新Nginx版本
- 配置fail2ban防暴力破解
- 监控异常访问日志

---

## 🆘 技术支持

如果遇到问题，可以：
1. 检查微信API官方文档
2. 查看Nginx/Node.js错误日志
3. 联系技术支持

**部署完成时间预估**：
- Nginx方案：5-10分钟
- Node.js方案：2-5分钟

---

**更新日期**: 2025-12-28
**版本**: v1.0
**适用环境**: Linux/Windows/macOS