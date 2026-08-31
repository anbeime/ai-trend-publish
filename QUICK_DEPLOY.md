# 快速部署指南

## 🚀 一键部署

### 步骤1: 上传文件

**双击运行**: `deploy-server.bat`

会自动完成：

- ✅ 检查本地文件
- ✅ 上传到服务器 `/home/topgo/`
- ✅ 提示下一步操作

---

## 🧪 执行部署

### 步骤2: SSH登录并执行部署

```bash
# SSH登录
ssh root@39.108.254.228

# 进入目录（会自动创建）
cd /home/topgo

# 赋予权限并执行部署
chmod +x deploy-upload-api.sh
./deploy-upload-api.sh
```

### 步骤3: 验证服务

```bash
# 检查服务状态
sudo systemctl status social-upload-api

# 应该看到: Active: active (running)

# 测试健康检查
curl http://localhost:8003/api/health

# 应该返回: {"status": "ok", "service": "Social Media Upload API", ...}
```

---

## ✅ 完成检查

- [ ] 服务 `social-upload-api` 正在运行
- [ ] 端口 8003 正在监听
- [ ] 健康检查返回成功
- [ ] 外网测试通过: http://39.108.254.228:8003/api/health

---

## 🔍 故障排查

### 问题: 服务未启动

```bash
# 查看服务日志
sudo journalctl -u social-upload-api -n 50

# 手动启动查看错误
cd /home/topgo
python3 upload-api.py
```

### 问题: 端口被占用

```bash
# 检查端口占用
sudo netstat -tlnp | grep 8003

# 杀死占用进程
sudo kill -9 <PID>
```

### 问题: 外网无法访问

```bash
# 检查防火墙
sudo firewall-cmd --list-ports

# 如果需要，开放端口
sudo firewall-cmd --add-port=8003/tcp --permanent
sudo firewall-cmd --reload
```

---

## 📋 服务管理

```bash
# 查看状态
sudo systemctl status social-upload-api

# 查看日志（实时）
sudo journalctl -u social-upload-api -f

# 重启服务
sudo systemctl restart social-upload-api

# 停止服务
sudo systemctl stop social-upload-api

# 启动服务
sudo systemctl start social-upload-api
```

---

## 🎯 API访问地址

**服务器内网**:

- 健康检查: http://localhost:8003/api/health
- 平台列表: http://localhost:8003/api/platforms

**外网访问**:

- 健康检查: http://39.108.254.228:8003/api/health
- 平台列表: http://39.108.254.228:8003/api/platforms

---

**部署路径**: `/home/topgo/`
**服务端口**: 8003
**服务名称**: `social-upload-api`

---

**准备好开始部署了吗？** 🚀

**第一步**: 双击运行 `deploy-server.bat`
**第二步**: 按照本指南执行部署
**第三步**: 验证服务正常运行

---

**更新日期**: 2026-02-15
**版本**: 2.0.0
**目录**: /home/topgo
**端口**: 8003
