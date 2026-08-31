# 用户执行任务清单

## 📋 待执行的任务（需要用户操作）

以下任务需要您手动执行，无法自动完成。

---

## 🚀 任务1: 部署后端API到服务器

### 目标

将 `upload-api.py` 部署到服务器端口 8003

### 执行方式

**方式A: 一键部署（推荐）**

```batch
# 在项目目录中双击运行
C:\D\compet\tengxun\miniprogram-agent\deploy-server.bat
```

**方式B: 手动部署**

```batch
# 1. 上传文件
scp C:\D\compet\tengxun\miniprogram-agent\upload-api.py root@39.108.254.228:/root/miniprogram-agent/
scp C:\D\compet\tengxun\miniprogram-agent\requirements.txt root@39.108.254.228:/root/miniprogram-agent/
scp C:\D\compet\tengxun\miniprogram-agent\deploy-upload-api.sh root@39.108.254.228:/root/miniprogram-agent/

# 2. 执行部署
ssh root@39.108.254.228
cd /root/miniprogram-agent
chmod +x deploy-upload-api.sh
./deploy-upload-api.sh
```

### 验证成功

```bash
# 检查服务状态
sudo systemctl status social-upload-api

# 应该看到: Active: active (running)
```

### 详细说明

参考文档: `BACKEND_DEV_TEST_GUIDE.md`

---

## 🧪 任务2: 测试后端API服务

### 目标

验证API服务正常运行

### 执行方式

**方式A: 使用测试工具**

```batch
# 在项目目录中双击运行
C:\D\compet\tengxun\miniprogram-agent\test-api.bat
```

**方式B: 手动测试**

```bash
# 健康检查
curl http://39.108.254.228:8003/api/health

# 应该返回: {"status": "ok", "service": "Social Media Upload API", ...}

# 平台列表
curl http://39.108.254.228:8003/api/platforms

# 应该返回包含5个平台的列表
```

**方式C: 浏览器测试**

```
访问: http://39.108.254.228:8003/api/health
```

### 验证成功

- [ ] 健康检查返回成功
- [ ] 平台列表返回正确
- [ ] 外网访问正常

### 详细说明

参考文档: `BACKEND_DEV_TEST_GUIDE.md`

---

## 🔧 任务3: 更新云函数环境变量

### 目标

将云函数环境变量指向新的API端口 8003

### 执行步骤

1. **访问微信云开发控制台**
   - 网址: https://tcb.cloud.tencent.com/
   - 登录微信账号
   - 选择环境: `invideo-6gidgilyee392cc8`

2. **进入云函数**
   - 左侧导航 → 云函数
   - 找到: `social-media-proxy`
   - 点击进入

3. **修改环境变量**
   - 点击"配置"标签
   - 找到"环境变量"部分
   - 点击"编辑"按钮

4. **更新配置**
   | 变量名 | 旧值 | 新值 |
   |--------|------|------|
   | `SOCIAL_UPLOAD_API_URL` | `http://39.108.254.228:8002` | `http://39.108.254.228:8003` |
   | `DEBUG` | `false` | `false` |

5. **保存并重新部署**
   - 点击"保存"
   - 点击"部署"标签
   - 点击"上传并部署：云端安装依赖（nodejs16）"
   - 等待部署完成（1-2分钟）

### 验证成功

```javascript
// 在微信开发者工具控制台运行
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: { action: "health" },
  success: (res) => {
    console.log("API地址:", res.result.apiBaseUrl);
    // 应该显示: http://39.108.254.228:8003
  },
});
```

### 详细说明

参考文档: `CLOUD_FUNCTION_UPDATE_GUIDE.md`

---

## 🌐 任务4: 测试云函数连接

### 目标

验证云函数与后端API的连接

### 执行步骤

1. **打开微信开发者工具**
   - 导航到小程序项目
   - 打开调试器 (Console)

2. **运行健康检查测试**

   ```javascript
   wx.cloud.callFunction({
     name: "social-media-proxy",
     data: {
       action: "health",
     },
     success: (res) => {
       console.log("✅ 健康检查成功:", res.result);

       // 验证API地址
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

3. **运行平台列表测试**
   ```javascript
   wx.cloud.callFunction({
     name: "social-media-proxy",
     data: {
       action: "platforms",
     },
     success: (res) => {
       console.log("✅ 平台列表:", res.result);

       if (res.result.success && res.result.platforms.length > 0) {
         console.log("✅ 发现", res.result.platforms.length, "个平台");
       } else {
         console.error("❌ 平台列表获取失败");
       }
     },
     fail: (err) => {
       console.error("❌ 获取平台列表失败:", err);
     },
   });
   ```

### 验证成功

- [ ] 健康检查返回成功
- [ ] API地址为 `http://39.108.254.228:8003`
- [ ] 平台列表返回正确（5个平台）
- [ ] 云函数日志正常

### 详细说明

参考文档: `CLOUD_FUNCTION_UPDATE_GUIDE.md`

---

## ✅ 完整检查清单

### 任务1: 部署后端API

- [ ] 运行 deploy-server.bat 或手动部署
- [ ] 文件成功上传到服务器
- [ ] 部署脚本执行成功
- [ ] 服务 social-upload-api 正在运行
- [ ] 端口 8003 正在监听

### 任务2: 测试后端API

- [ ] 运行 test-api.bat 或手动测试
- [ ] 健康检查返回成功
- [ ] 平台列表返回正确
- [ ] 外网访问正常

### 任务3: 更新云函数

- [ ] 访问云开发控制台
- [ ] 环境变量已更新
- [ ] 云函数已重新部署

### 任务4: 测试云函数连接

- [ ] 健康检查测试通过
- [ ] API地址验证正确
- [ ] 平台列表测试通过
- [ ] 云函数日志正常

---

## 📊 任务执行顺序

```
┌────────────────────┐
│  任务1: 部署服务   │  ← 执行此任务
└────────┬───────────┘
         │ 完成
         ↓
┌────────────────────┐
│  任务2: 测试API     │  ← 然后执行此任务
└────────┬───────────┘
         │ 完成
         ↓
┌────────────────────┐
│  任务3: 更新云函数  │  ← 然后执行此任务
└────────┬───────────┘
         │ 完成
         ↓
┌────────────────────┐
│  任务4: 测试连接     │  ← 最后执行此任务
└────────────────────┘
         │ 完成
         ↓
      🎉 全部完成！
```

---

## 🔍 故障排查

### 任务1失败: 部署失败

**问题**: deploy-server.bat 执行失败

**解决**:

```bash
# 1. 检查SSH连接
ssh root@39.108.254.228

# 2. 检查文件上传
ssh root@39.108.254.228 "ls -la /root/miniprogram-agent/"

# 3. 手动执行部署
ssh root@39.108.254.228 "cd /root/miniprogram-agent && chmod +x deploy-upload-api.sh && ./deploy-upload-api.sh"
```

### 任务2失败: API测试失败

**问题**: 健康检查返回失败

**解决**:

```bash
# 1. 检查服务状态
ssh root@39.108.254.228 "sudo systemctl status social-upload-api"

# 2. 检查端口监听
ssh root@39.108.254.228 "sudo netstat -tlnp | grep 8003"

# 3. 查看服务日志
ssh root@39.108.254.228 "sudo journalctl -u social-upload-api -n 50"
```

### 任务3失败: 云函数更新失败

**问题**: 无法更新环境变量

**解决**:

1. 检查云函数权限
2. 确认是环境管理员
3. 刷新页面重试

### 任务4失败: 云函数连接失败

**问题**: 云函数调用失败或返回错误

**解决**:

1. 检查后端服务状态
2. 验证API地址配置
3. 查看云函数日志
4. 检查网络连接

---

## 📞 技术支持

如遇到问题：

1. **查看详细文档**
   - `BACKEND_DEV_TEST_GUIDE.md` - 后台开发测试指南
   - `CLOUD_FUNCTION_UPDATE_GUIDE.md` - 云函数配置指南
   - `WINDOWS_DEPLOY_TOOLS_GUIDE.md` - Windows工具使用指南

2. **查看服务日志**

   ```bash
   ssh root@39.108.254.228
   sudo journalctl -u social-upload-api -f
   ```

3. **联系技术支持**
   - 技术支持：[联系方式]
   - 问题反馈：[反馈渠道]

---

## 🎯 快速开始

### 推荐执行方式（最快）

**步骤1**: 一键部署

```batch
双击运行: deploy-server.bat
```

**步骤2**: 测试API

```batch
双击运行: test-api.bat
```

**步骤3**: 更新云函数

```
访问: https://tcb.cloud.tencent.com/
更新环境变量: SOCIAL_UPLOAD_API_URL = http://39.108.254.228:8003
```

**步骤4**: 测试连接

```
在微信开发者工具控制台运行健康检查测试
```

---

## 📋 总结

### 已完成（准备工作）

- ✅ 前端UI标记为"开发中"
- ✅ 后端API代码准备完成
- ✅ 部署工具准备完成
- ✅ 完整文档体系准备完成

### 待执行（用户操作）

- ⏳ 任务1: 部署后端API到服务器
- ⏳ 任务2: 测试后端API服务
- ⏳ 任务3: 更新云函数环境变量
- ⏳ 任务4: 测试云函数连接

### 关键要点

- ✅ 所有任务都有详细的执行步骤
- ✅ 所有任务都有验证方法
- ✅ 所有任务都有故障排查方案
- ✅ 提供一键工具简化操作

---

**准备开始了吗？请按照本清单依次执行4个任务！** 🚀

**推荐起点**: 双击运行 `deploy-server.bat`

**详细指南**: 参考 `BACKEND_DEV_TEST_GUIDE.md` 或 `EXECUTION_PLAN.md`

---

**更新日期**: 2026-02-15
**版本**: 1.0.0
**状态**: 准备就绪，等待用户执行
