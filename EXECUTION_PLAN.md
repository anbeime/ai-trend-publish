# 后台开发测试 - 执行计划

## 📋 总体状态

**准备工作**: ✅ 100% 完成
**执行阶段**: ⏳ 0% （待用户执行）
**测试阶段**: ⏳ 0% （待用户执行）

---

## 🎯 已完成的工作

### 1. 前端UI标记 ✅

- ✅ 页面顶部添加"开发中"横幅
- ✅ 所有发布按钮设置为禁用状态
- ✅ 添加开发中提示弹窗
- ✅ 保留原有代码（注释状态）

### 2. 后端API准备 ✅

- ✅ `upload-api.py` 已配置为端口8003
- ✅ 实现完整的API端点（健康检查、平台列表、上传、批量）
- ✅ 集成HD_HUMAN上传器动态加载机制

### 3. 部署工具准备 ✅

- ✅ `deploy-upload-api.sh` - Linux部署脚本
- ✅ `deploy-server.bat` - Windows一键部署工具
- ✅ `test-api.bat` - Windows快速测试工具

### 4. 文档体系完善 ✅

- ✅ `BACKEND_DEV_TEST_GUIDE.md` - 后台开发测试指南
- ✅ `CLOUD_FUNCTION_UPDATE_GUIDE.md` - 云函数配置指南
- ✅ `WINDOWS_DEPLOY_TOOLS_GUIDE.md` - Windows工具使用指南
- ✅ `DEPLOYMENT_READY_SUMMARY.md` - 准备工作总结
- ✅ `PUBLISH_FEATURE_DEV_STATUS.md` - 开发中状态说明
- ✅ `PUBLISH_FEATURE_DEV_SUMMARY.md` - 更改总结
- ✅ `MULTI_USER_PUBLISHING_GUIDE.md` - 完整部署指南
- ✅ `DEPLOYMENT_SUMMARY.md` - 部署总览

---

## 🚀 需要用户执行的步骤

### 步骤1: 部署后端API服务

**方式A: 使用Windows一键部署工具（推荐）**

```batch
# 在项目目录中双击运行
deploy-server.bat
```

**脚本会自动完成**:

1. 检查本地文件
2. 上传文件到服务器
3. 执行部署脚本
4. 显示部署结果

**方式B: 手动部署**

```bash
# 1. 上传文件到服务器
scp C:\D\compet\tengxun\miniprogram-agent\upload-api.py root@39.108.254.228:/root/miniprogram-agent/
scp C:\D\compet\tengxun\miniprogram-agent\requirements.txt root@39.108.254.228:/root/miniprogram-agent/
scp C:\D\compet\tengxun\miniprogram-agent\deploy-upload-api.sh root@39.108.254.228:/root/miniprogram-agent/

# 2. SSH登录服务器
ssh root@39.108.254.228

# 3. 进入项目目录
cd /root/miniprogram-agent

# 4. 执行部署脚本
chmod +x deploy-upload-api.sh
./deploy-upload-api.sh
```

**验证部署成功**:

```bash
# 检查服务状态
sudo systemctl status social-upload-api

# 应该看到:
# ● social-upload-api.service - Social Media Upload API Service (Port 8003)
#    Active: active (running)
```

### 步骤2: 测试后端API服务

**方式A: 使用Windows快速测试工具**

```batch
# 双击运行
test-api.bat
```

**方式B: 手动测试**

```bash
# 健康检查
curl http://localhost:8003/api/health

# 应该返回:
# {
#   "status": "ok",
#   "service": "Social Media Upload API",
#   "timestamp": "2026-02-15T10:43:18.123456"
# }

# 平台列表
curl http://localhost:8003/api/platforms

# 应该返回包含5个平台的列表

# 外网测试（从本地）
curl http://39.108.254.228:8003/api/health
```

### 步骤3: 更新云函数环境变量

1. **访问微信云开发控制台**
   - https://tcb.cloud.tencent.com/
   - 登录微信账号
   - 选择环境：`invideo-6gidgilyee392cc8`

2. **进入云函数配置**
   - 左侧导航 → 云函数
   - 找到 `social-media-proxy` 云函数
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
   - 点击"保存"按钮
   - 点击"部署"标签
   - 点击"上传并部署：云端安装依赖（nodejs16）"
   - 等待部署完成（约1-2分钟）

### 步骤4: 测试云函数连接

在微信开发者工具控制台（Console）中运行：

```javascript
// 测试健康检查
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "health",
  },
  success: (res) => {
    console.log("✅ 健康检查结果:", res.result);

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

**预期结果**:

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

---

## ✅ 执行检查清单

### 部署检查

- [ ] 文件已上传到服务器（upload-api.py, requirements.txt, deploy-upload-api.sh）
- [ ] 部署脚本已执行
- [ ] 服务 social-upload-api 正在运行
- [ ] 端口8003正在监听

### API测试检查

- [ ] 健康检查返回成功
- [ ] 平台列表返回正确
- [ ] 外网访问正常
- [ ] 服务日志正常

### 云函数检查

- [ ] 云函数环境变量已更新
- [ ] 云函数已重新部署
- [ ] 健康检查测试通过
- [ ] API地址验证正确

---

## 🔍 故障排查快速参考

### 部署阶段

| 问题             | 可能原因   | 解决方案               |
| ---------------- | ---------- | ---------------------- |
| 部署脚本执行失败 | 文件未上传 | 检查文件是否成功上传   |
| 服务无法启动     | 端口被占用 | 检查端口8003是否被占用 |
| 健康检查失败     | 服务未运行 | 检查服务状态并重启     |

### 测试阶段

| 问题           | 可能原因   | 解决方案                   |
| -------------- | ---------- | -------------------------- |
| curl命令不存在 | 未安装     | 使用浏览器或PowerShell测试 |
| 外网无法访问   | 防火墙     | 检查防火墙规则             |
| 响应超时       | 服务启动慢 | 等待几秒后重试             |

### 云函数阶段

| 问题           | 可能原因    | 解决方案         |
| -------------- | ----------- | ---------------- |
| 云函数连接失败 | API地址错误 | 检查环境变量配置 |
| 返回API不可用  | 服务未运行  | 检查服务状态     |
| 超时错误       | 网络问题    | 检查网络连接     |

---

## 📋 详细文档索引

### 部署相关

| 文档                | 说明                 | 路径                             |
| ------------------- | -------------------- | -------------------------------- |
| Windows工具使用指南 | 部署工具使用说明     | `WINDOWS_DEPLOY_TOOLS_GUIDE.md`  |
| 后台开发测试指南    | 详细的部署和测试步骤 | `BACKEND_DEV_TEST_GUIDE.md`      |
| 完整部署指南        | 全面的部署文档       | `MULTI_USER_PUBLISHING_GUIDE.md` |

### 配置相关

| 文档           | 说明               | 路径                             |
| -------------- | ------------------ | -------------------------------- |
| 云函数配置指南 | 云函数环境变量配置 | `CLOUD_FUNCTION_UPDATE_GUIDE.md` |

### 开发相关

| 文档           | 说明               | 路径                             |
| -------------- | ------------------ | -------------------------------- |
| 开发中状态说明 | 前端开发中标记说明 | `PUBLISH_FEATURE_DEV_STATUS.md`  |
| 开发中更改总结 | 开发中标记更改总结 | `PUBLISH_FEATURE_DEV_SUMMARY.md` |

### 测试相关

| 文档           | 说明           | 路径                        |
| -------------- | -------------- | --------------------------- |
| 小程序测试指南 | 小程序功能测试 | `MINIPROGRAM_TEST_GUIDE.md` |

---

## 🎯 执行优先级

### 第一优先级（今天）

1. ⏳ **部署后端API服务** - 使用 deploy-server.bat
2. ⏳ **测试API服务** - 使用 test-api.bat
3. ⏳ **更新云函数环境变量** - 在云开发控制台操作

### 第二优先级（本周）

1. ⏳ **测试云函数连接** - 在微信开发者工具测试
2. ⏳ **配置HD_HUMAN上传器** - 确保上传器正常工作
3. ⏳ **测试单个平台上传** - 验证基本功能

### 第三优先级（下周）

1. ⏳ **测试批量上传** - 验证多平台同时上传
2. ⏳ **实现错误处理** - 完善错误处理和日志
3. ⏳ **性能优化** - 优化API响应时间

---

## 💡 关键要点

### 关于前端UI

- ✅ 前端UI已标记为"开发中"
- ✅ 用户可以预览页面和功能
- ❌ 用户无法执行实际发布
- ✅ 原有代码已保留（注释状态）

### 关于后台开发

- ✅ 后台可以完全独立开发和测试
- ✅ 不依赖前端UI状态
- ✅ 可以使用curl直接测试API
- ✅ 可以使用微信开发者工具测试云函数

### 关于部署

- ✅ 已提供一键部署工具
- ✅ 已提供详细文档
- ✅ 已提供故障排查方案
- ⏳ 需要用户执行实际部署

---

## 📞 技术支持

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

3. **参考文档**
   - 所有文档都在项目目录中
   - 每个文档都包含详细的步骤和故障排查

4. **联系支持**
   - 技术支持：[联系方式]
   - 问题反馈：[反馈渠道]

---

## 🎉 总结

### 已完成 ✅

1. ✅ 前端UI标记为"开发中"
2. ✅ 后端API代码准备完成
3. ✅ 部署脚本和工具准备完成
4. ✅ 完整的文档体系准备完成

### 待执行 ⏳

1. ⏳ 部署后端API到服务器（用户执行）
2. ⏳ 测试API服务（用户执行）
3. ⏳ 更新云函数环境变量（用户执行）
4. ⏳ 测试云函数连接（用户执行）

### 关键优势

- ✅ 完全独立的开发和测试环境
- ✅ 前端UI状态不影响后台开发
- ✅ 完整的工具和文档支持
- ✅ 清晰的执行步骤和检查清单

---

**准备好了吗？可以开始执行部署了！** 🚀

**推荐方式**: 双击运行 `deploy-server.bat`

**详细步骤**: 参考本文档的"🚀 需要用户执行的步骤"部分

---

**更新日期**: 2026-02-15
**版本**: 1.0.0
**状态**: 准备就绪，等待用户执行
