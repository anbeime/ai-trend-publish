# 后台开发测试指南

## 📋 概述

虽然前端UI已标记为"开发中"，但后台（服务器端、API、云函数）的开发和测试工作需要继续进行。本指南提供完整的后台开发测试流程。

---

## 🎯 开发目标

### 短期目标（本周）

1. ✅ 部署后端API服务（upload-api.py）到端口8003
2. ✅ 测试API健康检查和所有端点
3. ✅ 更新云函数环境变量指向新API
4. ✅ 验证云函数到API的连接

### 中期目标（下周）

1. ⏳ 配置HD_HUMAN上传器项目
2. ⏳ 测试单个平台上传功能
3. ⏳ 测试批量上传功能
4. ⏳ 实现错误处理和日志记录

### 长期目标（后续）

1. ⏳ 性能优化和异步处理
2. ⏳ 用户认证和权限管理
3. ⏳ 监控和告警系统
4. ⏳ 上线部署和文档完善

---

## 🚀 第一阶段：服务器环境准备

### 步骤1：检查服务器环境

**本地执行**（Windows PowerShell或Git Bash）:

```bash
# SSH登录服务器
ssh root@39.108.254.228

# 检查Python版本
python3 --version

# 检查pip
pip3 --version

# 检查systemd
systemctl --version

# 检查端口占用
sudo netstat -tlnp | grep -E '8002|8003|8004'
```

**预期结果**:

- Python 3.8+ 已安装
- pip 可用
- systemd 可用
- 端口8003未被占用（8002可能被draft-api.py占用）

### 步骤2：创建项目目录

```bash
# 创建项目目录（如果不存在）
mkdir -p /root/miniprogram-agent
cd /root/miniprogram-agent

# 查看目录内容
ls -la
```

**预期结果**:

```
drwxr-xr-x  2 root root 4096 Feb 15 10:43 .
drwxr-xr-x  3 root root 4096 Feb 15 10:43 ..
```

---

## 📤 第二阶段：上传文件到服务器

### 步骤1：上传后端API文件

**本地执行**（Windows）:

```bash
# 进入项目目录
cd C:\D\compet\tengxun\miniprogram-agent

# 上传必要的文件
scp upload-api.py root@39.108.254.228:/root/miniprogram-agent/
scp requirements.txt root@39.108.254.228:/root/miniprogram-agent/
scp deploy-upload-api.sh root@39.108.254.228:/root/miniprogram-agent/
```

**验证上传**:

```bash
# 在服务器上验证文件上传
ssh root@39.108.254.228
cd /root/miniprogram-agent
ls -lh

# 预期输出
# -rw-r--r-- 1 root root 15KB Feb 15 10:43 upload-api.py
# -rw-r--r-- 1 root root 1KB  Feb 15 10:43 requirements.txt
# -rwxr-xr-x 1 root root 4KB  Feb 15 10:43 deploy-upload-api.sh
```

### 步骤2：上传HD_HUMAN上传器项目（如果需要）

**注意**: 如果服务器上已有HD_HUMAN项目，此步骤可跳过。

```bash
# 本地执行
cd C:\D\compet\tengxun\miniprogram-agent

# 上传HD_HUMAN项目
scp -r social-auto-upload-main root@39.108.254.228:/root/miniprogram-agent/
```

**验证上传**:

```bash
# 在服务器上验证
cd /root/miniprogram-agent
ls -la social-auto-upload-main/

# 预期输出（应包含以下目录）
# drwxr-xr-x  uploader/
# drwxr-xr-x  utils/
# -rw-r--r--  requirements.txt
# 等等...
```

---

## 🔧 第三阶段：部署后端API服务

### 步骤1：赋予部署脚本执行权限

```bash
# 进入项目目录
cd /root/miniprogram-agent

# 赋予执行权限
chmod +x deploy-upload-api.sh

# 验证权限
ls -l deploy-upload-api.sh

# 预期输出: -rwxr-xr-x
```

### 步骤2：执行部署脚本

```bash
# 执行部署
./deploy-upload-api.sh
```

**部署脚本会自动完成**:

1. ✅ 检查Python环境
2. ✅ 安装依赖（requirements.txt）
3. ✅ 检查HD_HUMAN项目
4. ✅ 配置systemd服务
5. ✅ 启动服务（端口8003）
6. ✅ 执行健康检查

**预期输出**:

```
=========================================
Social Media Upload API 部署脚本
=========================================

[步骤 1/5] 检查Python环境
✓ Python版本: 3.x.x

[步骤 2/5] 安装依赖
✓ 依赖安装完成

[步骤 3/5] 检查HD_HUMAN项目
✓ HD_HUMAN项目路径存在
✓ 发现 5 个上传器
  - douyin_uploader
  - xiaohongshu_uploader
  - bilibili_uploader
  - kuaishou_uploader
  - tiktok_uploader

[步骤 4/5] 配置systemd服务
✓ Systemd服务文件已创建
✓ 服务启动成功！

[步骤 5/5] 启动服务
✓ 服务启动成功！

=========================================
部署完成！
=========================================

📋 服务信息:
  - 服务名称: social-upload-api
  - 端口: 8003
  - 访问地址: http://39.108.254.228:8003

🔧 管理命令:
  - 查看状态: sudo systemctl status social-upload-api
  - 查看日志: sudo journalctl -u social-upload-api -f
  - 重启服务: sudo systemctl restart social-upload-api
  - 停止服务: sudo systemctl stop social-upload-api

🧪 测试命令:
  - 健康检查: curl http://localhost:8003/api/health
  - 平台列表: curl http://localhost:8003/api/platforms
```

---

## 🧪 第四阶段：测试后端API

### 测试1：服务状态检查

```bash
# 检查服务状态
sudo systemctl status social-upload-api
```

**预期输出**:

```
● social-upload-api.service - Social Media Upload API Service (Port 8003)
   Loaded: loaded (/etc/systemd/system/social-upload-api.service; enabled; vendor preset: enabled)
   Active: active (running) since ...
```

### 测试2：健康检查

```bash
# 本地测试
curl http://localhost:8003/api/health

# 外网测试
curl http://39.108.254.228:8003/api/health
```

**预期输出**:

```json
{
  "status": "ok",
  "service": "Social Media Upload API",
  "timestamp": "2026-02-15T10:43:18.123456"
}
```

### 测试3：平台列表

```bash
# 获取平台列表
curl http://localhost:8003/api/platforms
```

**预期输出**:

```json
{
  "success": true,
  "platforms": [
    {
      "id": "douyin",
      "name": "抖音",
      "icon": "🎵",
      "status": "active"
    },
    {
      "id": "xiaohongshu",
      "name": "小红书",
      "icon": "📕",
      "status": "active"
    },
    {
      "id": "bilibili",
      "name": "B站",
      "icon": "📺",
      "status": "active"
    },
    {
      "id": "kuaishou",
      "name": "快手",
      "icon": "🎥",
      "status": "active"
    },
    {
      "id": "tiktok",
      "name": "TikTok",
      "icon": "🎬",
      "status": "active"
    }
  ]
}
```

### 测试4：查看服务日志

```bash
# 实时查看日志
sudo journalctl -u social-upload-api -f

# 查看最近100条日志
sudo journalctl -u social-upload-api -n 100
```

**预期日志输出**:

```
=========================================
社交媒体上传API服务
=========================================
📋 部署地址: http://0.0.0.0:8003
🔧 调试模式: false
📁 HD_HUMAN路径: /root/miniprogram-agent/social-auto-upload-main
=========================================
✓ HD_HUMAN项目路径存在
✓ 发现上传器目录: 5个
  - douyin_uploader
  - xiaohongshu_uploader
  - bilibili_uploader
  - kuaishou_uploader
  - tiktok_uploader
=========================================
启动API服务...
=========================================
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8003
```

---

## 🌥️ 第五阶段：更新云函数配置

### 步骤1：登录微信云开发控制台

1. 访问：https://tcb.cloud.tencent.com/
2. 登录微信账号
3. 选择环境：`invideo-6gidgilyee392cc8`

### 步骤2：定位云函数

1. 在左侧导航栏，点击 **云函数**
2. 找到云函数：`social-media-proxy`
3. 点击进入云函数详情页

### 步骤3：修改环境变量

1. 在云函数详情页，点击 **配置** 标签
2. 找到 **环境变量** 部分
3. 点击 **编辑** 按钮

**修改以下环境变量**:

| 变量名                  | 当前值                       | 新值                         |
| ----------------------- | ---------------------------- | ---------------------------- |
| `SOCIAL_UPLOAD_API_URL` | `http://39.108.254.228:8002` | `http://39.108.254.228:8003` |
| `DEBUG`                 | `false`                      | `false`                      |

4. 点击 **保存** 按钮

### 步骤4：重新部署云函数

**方法A：通过云开发控制台**

1. 在云函数详情页，点击 **部署** 标签
2. 点击 **上传并部署：云端安装依赖（nodejs16）** 按钮
3. 等待部署完成（约1-2分钟）

**方法B：通过微信开发者工具**

1. 在微信开发者工具中，找到 `cloudfunctions/social-media-proxy/` 目录
2. 右键点击 `social-media-proxy` 文件夹
3. 选择 **上传并部署：云端安装依赖**
4. 选择运行时：`Node.js 16`
5. 等待上传和部署完成

---

## 🧪 第六阶段：测试云函数集成

### 测试1：健康检查测试

在微信开发者工具控制台（Console）中运行：

```javascript
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "health",
  },
  success: (res) => {
    console.log("✅ 健康检查成功:", res.result);

    // 验证返回的URL是否正确
    if (res.result.apiBaseUrl === "http://39.108.254.228:8003") {
      console.log("✅ API地址配置正确");
    } else {
      console.error("❌ API地址配置错误:", res.result.apiBaseUrl);
    }
  },
  fail: (err) => {
    console.error("❌ 健康检查失败:", err);
  },
});
```

**预期输出**:

```javascript
{
  success: true,
  apiAvailable: true,
  apiBaseUrl: "http://39.108.254.228:8003",
  apiStatus: {
    status: "ok",
    service: "Social Media Upload API",
    timestamp: "2026-02-15T10:43:18.123456"
  }
}
```

### 测试2：平台列表测试

```javascript
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "platforms",
  },
  success: (res) => {
    console.log("✅ 平台列表获取成功:", res.result);

    if (res.result.success && res.result.platforms.length > 0) {
      console.log("✅ 发现", res.result.platforms.length, "个平台");
      res.result.platforms.forEach((p) => {
        console.log("  -", p.name, p.icon, p.status);
      });
    } else {
      console.error("❌ 平台列表获取失败");
    }
  },
  fail: (err) => {
    console.error("❌ 获取平台列表失败:", err);
  },
});
```

**预期输出**:

```javascript
{
  success: true,
  platforms: [
    { id: "douyin", name: "抖音", icon: "🎵", status: "active" },
    { id: "xiaohongshu", name: "小红书", icon: "📕", status: "active" },
    { id: "bilibili", name: "B站", icon: "📺", status: "active" },
    { id: "kuaishou", name: "快手", icon: "🎥", status: "active" },
    { id: "tiktok", name: "TikTok", icon: "🎬", status: "active" }
  ]
}
```

### 测试3：查看云函数日志

1. 访问微信云开发控制台
2. 进入云函数 `social-media-proxy`
3. 点击 **日志** 标签
4. 选择时间范围
5. 查看实时日志

**预期日志示例**:

```
[social-media-proxy]收到请求: { action: 'health', platform: undefined, hasData: false }
[social-media-proxy]用户信息: { openid: 'xxx' }
[healthCheck]执行健康检查
[healthCheck]健康检查成功: { status: 'ok', ... }
```

---

## ✅ 测试检查清单

### 后端API测试

- [ ] 服务 social-upload-api 正在运行
- [ ] 端口8003正在监听
- [ ] 健康检查返回成功
- [ ] 平台列表返回正确
- [ ] 服务日志正常输出
- [ ] 外网访问正常（http://39.108.254.228:8003）

### 云函数测试

- [ ] 环境变量已更新为 `http://39.108.254.228:8003`
- [ ] 云函数已重新部署
- [ ] 健康检查测试通过
- [ ] 平台列表测试通过
- [ ] 云函数日志显示正常
- [ ] API地址验证正确

---

## 📊 服务监控

### 查看服务状态

```bash
# 服务状态
sudo systemctl status social-upload-api

# 实时日志
sudo journalctl -u social-upload-api -f

# 最近100条日志
sudo journalctl -u social-upload-api -n 100
```

### 服务管理

```bash
# 重启服务
sudo systemctl restart social-upload-api

# 停止服务
sudo systemctl stop social-upload-api

# 启动服务
sudo systemctl start social-upload-api

# 禁用开机自启
sudo systemctl disable social-upload-api

# 启用开机自启
sudo systemctl enable social-upload-api
```

---

## 🔍 故障排查

### 问题1：服务无法启动

**症状**: `systemctl status social-upload-api` 显示失败

**解决方案**:

```bash
# 查看详细错误日志
sudo journalctl -u social-upload-api -n 50

# 检查端口占用
sudo netstat -tlnp | grep 8003

# 手动启动查看错误
cd /root/miniprogram-agent
python3 upload-api.py
```

### 问题2：云函数连接失败

**症状**: 小程序调用云函数超时或返回错误

**解决方案**:

1. 检查后端服务状态
2. 检查端口监听
3. 测试外网访问
4. 检查防火墙规则
5. 查看云函数日志

### 问题3：健康检查失败

**症状**: API返回健康检查失败

**解决方案**:

1. 检查服务状态
2. 查看服务日志
3. 验证配置文件
4. 检查Python依赖

---

## 📋 下一步计划

### 本周完成

1. ✅ 部署后端API服务
2. ✅ 测试API所有端点
3. ✅ 更新云函数配置
4. ✅ 验证云函数连接

### 下周计划

1. ⏳ 配置HD_HUMAN上传器
2. ⏳ 测试单个平台上传
3. ⏳ 测试批量上传
4. ⏳ 实现错误处理

### 后续优化

1. ⏳ 性能优化
2. ⏳ 监控告警
3. ⏳ 用户认证
4. ⏳ 上线部署

---

## 📚 相关文档

- [完整部署指南](./MULTI_USER_PUBLISHING_GUIDE.md)
- [云函数配置指南](./CLOUD_FUNCTION_UPDATE_GUIDE.md)
- [小程序测试指南](./MINIPROGRAM_TEST_GUIDE.md)
- [部署总结](./DEPLOYMENT_SUMMARY.md)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

---

## 🎉 总结

后台开发测试工作已准备就绪：

1. ✅ 开发测试计划已制定
2. ✅ 部署流程已明确
3. ✅ 测试步骤已定义
4. ✅ 故障排查方案已准备

**下一步**: 执行部署和测试流程！

---

**更新日期**: 2026-02-15
**版本**: 1.0.0
**状态**: 准备就绪，可以开始部署和测试
