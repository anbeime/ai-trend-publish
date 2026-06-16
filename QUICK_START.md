# 🚀 快速启动指南

## 问题诊断

如果你直接打开HTML文件但没有反应，那是因为**缺少后端服务器**。

## 🔧 正确的使用方法

### 1️⃣ 首次使用（推荐）

**Windows用户：**
```bash
# 方法1：双击运行（最简单）
start-wechat-publisher.bat

# 方法2：命令行运行
cd c:/D/ai-trend-publish
start-wechat-publisher.bat
```

**Mac/Linux用户：**
```bash
cd /path/to/ai-trend-publish
./start-wechat-publisher.sh
```

### 2️⃣ 启动后访问

- 🎯 **测试工具**：http://localhost:3000/test-wechat-publish.html
- 📝 **发布工具**：http://localhost:3000/wechat-publisher.html  
- 🔍 **状态检查**：http://localhost:3000/simple-test.html

### 3️⃣ 验证服务器运行

看到这个提示说明启动成功：
```
服务启动后，请在浏览器中访问: http://localhost:3000/wechat-publisher.html
```

## 🆘 常见问题

### 问题1：启动脚本失败
**症状**：双击没反应或报错
**解决**：
1. 确认安装了Node.js：`node --version`
2. 使用管理员权限运行
3. 检查防火墙设置

### 问题2：端口被占用
**症状**：提示端口3000已使用
**解决**：
```bash
# 查看占用进程
netstat -ano | findstr :3000

# 结束进程
taskkill /PID 进程号 /F

# 或者使用其他端口
set PORT=8080 && start-wechat-publisher.bat
```

### 问题3：依赖包问题
**症状**：提示模块未找到
**解决**：
```bash
cd c:/D/ai-trend-publish
npm install
npm run dev
```

## 🎯 最简单的测试方法

1. **打开简单检查页面**：
   ```
   双击 simple-test.html
   ```

2. **检查服务器状态**：
   - 如果显示"❌ 服务器未运行"，需要先启动服务器
   - 如果显示"✅ 服务器运行正常"，可以正常使用

3. **直接测试微信API**：
   在simple-test.html中输入AppID和AppSecret，点击"直接测试微信API"

## 📱 成功标志

启动成功后，你应该能看到：
- ✅ 命令行窗口显示服务信息
- ✅ 浏览器访问 localhost:3000 有响应
- ✅ API接口返回正常数据

## 🔄 重启服务

如果需要重启：
1. 关闭命令行窗口（Ctrl+C）
2. 重新运行启动脚本
3. 刷新浏览器页面

---

## 🎉 开始使用

一旦服务器正常运行，你就可以：

1. **测试发布功能**：使用 test-wechat-publish.html
2. **发布真实文章**：使用 wechat-publisher.html  
3. **管理配置**：保存微信账号信息

**记住**：必须先启动服务器，然后通过 http://localhost:3000 访问，不能直接打开HTML文件！

---

**需要帮助？** 查看 `TESTING_GUIDE.md` 获取详细测试步骤。