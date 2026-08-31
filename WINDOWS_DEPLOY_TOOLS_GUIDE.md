# Windows部署工具使用指南

## 📋 概述

本指南介绍如何在Windows环境下使用提供的批处理脚本进行服务器部署和API测试。

---

## 🚀 快速开始

### 方式1：一键部署（推荐）

**使用 `deploy-server.bat` 脚本**

```batch
# 双击运行
deploy-server.bat

# 或在命令行中执行
deploy-server.bat
```

**脚本功能**:

1. ✅ 检查本地文件是否存在
2. ✅ 上传 `upload-api.py` 到服务器
3. ✅ 上传 `requirements.txt` 到服务器
4. ✅ 上传 `deploy-upload-api.sh` 到服务器
5. ✅ 检查HD_HUMAN项目状态
6. ✅ 执行部署脚本
7. ✅ 显示下一步操作指引

**配置信息**:

- 服务器：`root@39.108.254.228`
- 远程目录：`/root/miniprogram-agent`
- 本地目录：`C:\D\compet\tengxun\miniprogram-agent`

### 方式2：手动部署

如果自动脚本无法使用，可以手动执行以下步骤：

**步骤1: 上传文件**

```batch
# 上传upload-api.py
scp C:\D\compet\tengxun\miniprogram-agent\upload-api.py root@39.108.254.228:/root/miniprogram-agent/

# 上传requirements.txt
scp C:\D\compet\tengxun\miniprogram-agent\requirements.txt root@39.108.254.228:/root/miniprogram-agent/

# 上传deploy-upload-api.sh
scp C:\D\compet\tengxun\miniprogram-agent\deploy-upload-api.sh root@39.108.254.228:/root/miniprogram-agent/
```

**步骤2: SSH登录服务器**

```batch
ssh root@39.108.254.228
```

**步骤3: 执行部署**

```bash
cd /root/miniprogram-agent
chmod +x deploy-upload-api.sh
./deploy-upload-api.sh
```

---

## 🧪 测试API服务

### 使用 `test-api.bat` 脚本

```batch
# 双击运行
test-api.bat

# 或在命令行中执行
test-api.bat
```

**测试内容**:

1. ✅ 健康检查测试 (`/api/health`)
2. ✅ 平台列表测试 (`/api/platforms`)

**预期输出**:

```
=========================================
后端API快速测试脚本
=========================================

📋 配置信息:
    API地址: http://39.108.254.228:8003

[测试 1/2] 健康检查...
{
  "status": "ok",
  "service": "Social Media Upload API",
  "timestamp": "2026-02-15T10:43:18.123456"
}

✓ 健康检查成功

按任意键继续测试平台列表...

[测试 2/2] 平台列表...
{
  "success": true,
  "platforms": [
    { "id": "douyin", "name": "抖音", "icon": "🎵", "status": "active" },
    ...
  ]
}

✓ 平台列表获取成功

=========================================
测试完成！
=========================================
```

### 手动测试

**测试1: 健康检查**

```batch
curl http://39.108.254.228:8003/api/health
```

**测试2: 平台列表**

```batch
curl http://39.108.254.228:8003/api/platforms
```

**测试3: 浏览器访问**

```
http://39.108.254.228:8003/api/health
http://39.108.254.228:8003/api/platforms
```

---

## 📊 部署验证清单

部署完成后，请验证以下所有项：

### 服务器端

- [ ] 文件已成功上传到服务器
- [ ] 部署脚本已执行
- [ ] 服务 `social-upload-api` 正在运行
- [ ] 端口8003正在监听
- [ ] 健康检查返回成功
- [ ] 平台列表返回正确

### 测试端

- [ ] `test-api.bat` 执行成功
- [ ] 健康检查测试通过
- [ ] 平台列表测试通过
- [ ] 外网访问正常

---

## 🔍 故障排查

### 问题1: SCP连接失败

**症状**: 上传文件时提示"Connection refused"

**解决方案**:

```batch
# 1. 检查SSH连接
ssh root@39.108.254.228

# 2. 检查SSH密钥配置
# 如果使用SSH密钥，确保密钥已添加到ssh-agent

# 3. 检查防火墙
# 确保SSH端口（通常是22）未被阻止
```

### 问题2: 部署脚本执行失败

**症状**: 脚本上传成功但执行失败

**解决方案**:

```bash
# 1. 检查脚本权限
ssh root@39.108.254.228
cd /root/miniprogram-agent
ls -l deploy-upload-api.sh
# 应该是 -rwxr-xr-x

# 2. 手动赋予权限
chmod +x deploy-upload-api.sh

# 3. 检查脚本内容
head deploy-upload-api.sh
```

### 问题3: API服务无法启动

**症状**: 健康检查失败或返回错误

**解决方案**:

```bash
# 1. 检查服务状态
sudo systemctl status social-upload-api

# 2. 查看服务日志
sudo journalctl -u social-upload-api -n 50

# 3. 检查端口占用
sudo netstat -tlnp | grep 8003

# 4. 手动启动查看错误
cd /root/miniprogram-agent
python3 upload-api.py
```

### 问题4: curl命令不存在

**症状**: 运行 `test-api.bat` 时提示"curl不是内部或外部命令"

**解决方案**:

1. **安装curl**
   - Windows 10/11: curl已内置
   - 旧版本Windows: 下载并安装curl for Windows

2. **使用PowerShell替代**

   ```powershell
   # 健康检查
   Invoke-RestMethod -Uri "http://39.108.254.228:8003/api/health"

   # 平台列表
   Invoke-RestMethod -Uri "http://39.108.254.228:8003/api/platforms"
   ```

3. **使用浏览器测试**
   - 直接在浏览器中访问API地址

---

## 📋 脚本说明

### deploy-server.bat

**功能**: 一键上传文件到服务器并执行部署

**使用方法**:

```batch
# 双击运行或命令行执行
deploy-server.bat
```

**执行步骤**:

1. 检查本地文件（upload-api.py, requirements.txt, deploy-upload-api.sh）
2. 上传文件到服务器
3. 检查HD_HUMAN项目状态
4. 执行部署脚本
5. 显示下一步操作指引

**配置**:

```batch
set SERVER=root@39.108.254.228
set REMOTE_DIR=/root/miniprogram-agent
set LOCAL_DIR=C:\D\compet\tengxun\miniprogram-agent
```

### test-api.bat

**功能**: 快速测试已部署的API服务

**使用方法**:

```batch
# 双击运行或命令行执行
test-api.bat
```

**测试内容**:

1. 健康检查 (`/api/health`)
2. 平台列表 (`/api/platforms`)

**配置**:

```batch
set API_URL=http://39.108.254.228:8003
```

---

## 🚀 高级使用

### 自定义部署配置

**修改 `deploy-server.bat` 中的配置**:

```batch
set SERVER=root@39.108.254.228
set REMOTE_DIR=/root/miniprogram-agent
set LOCAL_DIR=C:\D\compet\tengxun\miniprogram-agent
```

### 批量部署

**部署到多个服务器**:

```batch
REM 创建多个部署脚本
REM deploy-server-1.bat (服务器1)
REM deploy-server-2.bat (服务器2)
REM ...
```

### 自动化部署

**结合Windows任务计划程序**:

1. 打开任务计划程序
2. 创建基本任务
3. 设置触发器（定时或事件）
4. 操作：运行 `deploy-server.bat`

---

## 📞 获取帮助

如遇到问题：

1. **查看日志**

   ```bash
   ssh root@39.108.254.228
   sudo journalctl -u social-upload-api -f
   ```

2. **检查服务状态**

   ```bash
   sudo systemctl status social-upload-api
   ```

3. **查看文档**
   - [后台开发测试指南](./BACKEND_DEV_TEST_GUIDE.md)
   - [完整部署指南](./MULTI_USER_PUBLISHING_GUIDE.md)
   - [云函数配置指南](./CLOUD_FUNCTION_UPDATE_GUIDE.md)

4. **联系技术支持**
   - 技术支持：[联系方式]
   - 问题反馈：[反馈渠道]

---

## ✅ 快速检查清单

使用本工具部署和测试时，请确认：

### 部署前

- [ ] 已准备好SSH访问权限
- [ ] 本地文件完整（upload-api.py, requirements.txt, deploy-upload-api.sh）
- [ ] 服务器可访问
- [ ] Python 3.8+ 已安装在服务器上

### 部署后

- [ ] 部署脚本执行成功
- [ ] 服务 `social-upload-api` 正在运行
- [ ] 端口8003正在监听
- [ ] 健康检查测试通过
- [ ] 平台列表测试通过

### 验证

- [ ] 外网访问正常
- [ ] API响应正确
- [ ] 服务日志正常
- [ ] 无错误或警告

---

**更新日期**: 2026-02-15
**版本**: 1.0.0
**状态**: 可用
