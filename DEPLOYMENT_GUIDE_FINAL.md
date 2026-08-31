# 一键部署指南

## 🚀 快速开始

### 前提条件

- SSH访问服务器：`ssh root@39.108.254.228`
- 已准备好这3个文件：
  - `upload-api.py`
  - `requirements.txt`
  - `deploy-upload-api.sh`

---

## 📋 部署步骤

### 步骤1: 上传文件到服务器

**在本地执行**（PowerShell或Git Bash）：

```bash
cd C:\D\compet\tengxun\miniprogram-agent

# 上传文件到服务器的 /root/miniprogram-agent/ 目录
scp upload-api.py root@39.108.254.228:/root/miniprogram-agent/
scp requirements.txt root@39.108.254.228:/root/miniprogram-agent/
scp deploy-upload-api.sh root@39.108.254.228:/root/miniprogram-agent/
```

### 步骤2: 创建目录并部署

**在服务器上执行**：

```bash
# SSH登录服务器
ssh root@39.108.254.228

# 进入项目目录（会自动创建如果不存在）
cd /root/miniprogram-agent

# 赋予部署脚本执行权限
chmod +x deploy-upload-api.sh

# 执行部署脚本
./deploy-upload-api.sh
```

**部署脚本会自动完成**：

1. 检查Python环境
2. 安装依赖（requirements.txt）
3. 配置systemd服务
4. 启动服务（端口8003）
5. 执行健康检查

### 步骤3: 验证服务状态

```bash
# 检查服务状态
sudo systemctl status social-upload-api

# 应该看到: Active: active (running)

# 检查端口监听
sudo netstat -tlnp | grep 8003

# 应该看到: 0.0.0.0:8003

# 本地测试健康检查
curl http://localhost:8003/api/health

# 本地测试平台列表
curl http://localhost:8003/api/platforms
```

### 步骤4: 外网测试

**在本地浏览器或命令行执行**：

```bash
# 外网测试健康检查
curl http://39.108.254.228:8003/api/health

# 外网测试平台列表
curl http://39.108.254.228:8003/api/platforms
```

**或直接在浏览器访问**：

```
http://39.108.254.228:8003/api/health
http://39.108.254.228:8003/api/platforms
```

---

## ✅ 验证检查清单

部署完成后，请确认：

- [ ] 文件已成功上传到 `/root/miniprogram-agent/`
- [ ] 部署脚本执行成功
- [ ] 服务 `social-upload-api` 正在运行
- [ ] 端口 8003 正在监听（绑定 0.0.0.0）
- [ ] 本地健康检查通过：`curl http://localhost:8003/api/health`
- [ ] 外网健康检查通过：`curl http://39.108.254.228:8003/api/health`
- [ ] 平台列表返回正确

---

## 🔍 常见问题

### 问题1: 部署脚本执行失败

**症状**: `./deploy-upload-api.sh` 返回错误

**解决方案**:

```bash
# 检查文件权限
ls -la /root/miniprogram-agent/deploy-upload-api.sh

# 手动赋予权限
chmod +x /root/miniprogram-agent/deploy-upload-api.sh

# 检查Python环境
python3 --version  # 需要 >= 3.8

# 手动安装依赖
pip3 install -r /root/miniprogram-agent/requirements.txt
```

### 问题2: 服务无法启动

**症状**: `systemctl status` 显示服务未运行

**解决方案**:

```bash
# 查看服务日志
sudo journalctl -u social-upload-api -n 50

# 检查端口占用
sudo netstat -tlnp | grep 8003

# 手动启动查看错误
cd /root/miniprogram-agent
python3 upload-api.py
```

### 问题3: 外网无法访问

**症状**: `curl http://39.108.254.228:8003/api/health` 返回错误

**解决方案**:

```bash
# 1. 检查服务是否运行
sudo systemctl status social-upload-api

# 2. 检查防火墙
sudo firewall-cmd --list-ports

# 3. 如果需要开放端口
sudo firewall-cmd --add-port=8003/tcp --permanent
sudo firewall-cmd --reload

# 4. 检查云服务商安全组
# 需要在阿里云/腾讯云控制台开放8003端口
```

---

## 📋 服务管理命令

```bash
# 启动服务
sudo systemctl start social-upload-api

# 停止服务
sudo systemctl stop social-upload-api

# 重启服务
sudo systemctl restart social-upload-api

# 查看状态
sudo systemctl status social-upload-api

# 开机自启
sudo systemctl enable social-upload-api

# 禁用开机自启
sudo systemctl disable social-upload-api

# 查看实时日志
sudo journalctl -u social-upload-api -f

# 查看最近100条日志
sudo journalctl -u social-upload-api -n 100
```

---

## 🎯 API访问地址

### 服务器内访问

```
http://localhost:8003/api/health
http://localhost:8003/api/platforms
```

### 外网访问

```
http://39.108.254.228:8003/api/health
http://39.108.254.228:8003/api/platforms
```

### 响应示例

**健康检查**:

```json
{
  "status": "ok",
  "service": "Social Media Upload API",
  "timestamp": "2026-02-15T10:43:18.123456"
}
```

**平台列表**:

```json
{
  "success": true,
  "platforms": [
    { "id": "douyin", "name": "抖音", "icon": "🎵", "status": "active" },
    { "id": "xiaohongshu", "name": "小红书", "icon": "📕", "status": "active" },
    { "id": "bilibili", "name": "B站", "icon": "📺", "status": "active" },
    { "id": "kuaishou", "name": "快手", "icon": "🎥", "status": "active" },
    { "id": "tiktok", "name": "TikTok", "icon": "🎬", "status": "active" }
  ]
}
```

---

## 📞 技术支持

如遇到问题，请执行以下命令并将结果告诉我：

```bash
# 1. 服务状态
sudo systemctl status social-upload-api

# 2. 端口检查
sudo netstat -tlnp | grep 8003

# 3. 最近日志
sudo journalctl -u social-upload-api -n 20
```

---

## 🎉 部署完成

成功部署后，API服务将：

- ✅ 运行在端口 8003
- ✅ 绑定到 0.0.0.0（允许外网访问）
- ✅ 支持5个平台的上传功能
- ✅ 提供健康检查和平台列表接口
- ✅ 通过 systemd 管理服务

**访问地址**: `http://39.108.254.228:8003/api/health`

---

**更新日期**: 2026-02-15
**版本**: 2.0.0
**状态**: 准备就绪
