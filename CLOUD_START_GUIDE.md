# 🌐 云端微信发布工具使用指南

## 🎯 立即可用的链接

### 🚀 直接API版本（推荐）
```
https://anbeime.github.io/ai-trend-publish/wechat-direct-publisher.html
```

**特点**：
- ✅ 无需本地服务器
- ✅ 直接调用微信API
- ✅ 自动获取IP地址
- ✅ 完整的发布功能
- ✅ 实时错误反馈

### 📱 完整工具版本
```
https://mp.miyucaicai.cn/
```

**特点**：
- ✅ 美观的用户界面
- ✅ 响应式设计
- ❌ 暂无后端支持（静态页面）

### 🔧 测试版本
```
https://anbeime.github.io/ai-trend-publish/simple-test.html
```

## 📋 使用步骤

### 第1步：配置微信白名单
1. 访问直接API版本链接
2. 点击"获取我的IP"按钮
3. 复制显示的IP地址
4. 登录微信公众平台：https://mp.weixin.qq.com
5. 进入"开发" → "基本配置"
6. 在"IP白名单"中添加你的IP
7. 保存配置（等待10分钟生效）

### 第2步：配置公众号信息
1. 在页面中填写：
   - **AppID**：微信公众号AppID
   - **AppSecret**：微信公众号AppSecret
2. 点击"测试连接"验证配置

### 第3步：发布文章
1. 填写文章标题和内容
2. （可选）上传封面图片
3. 点击"直接发布到微信"
4. 等待发布成功提示

### 第4步：验证发布
1. 登录微信公众号后台
2. 查看"草稿箱"
3. 确认文章已成功创建

## 🔍 故障排除

### 问题1：连接测试失败
**症状**：点击"测试连接"提示失败
**解决方案**：
- 检查AppID和AppSecret是否正确
- 确认IP已添加到微信白名单
- 等待白名单配置生效（最长10分钟）

### 问题2：发布失败
**症状**：点击发布后提示错误
**常见错误及解决方案**：

| 错误码 | 说明 | 解决方案 |
|---------|------|----------|
| 40001 | AppSecret无效 | 检查AppSecret是否正确 |
| 40013 | AppID无效 | 检查AppID格式是否正确 |
| 40164 | IP不在白名单 | 重新添加IP到白名单 |
| 42001 | access_token过期 | 重新获取Token |

### 问题3：跨域错误
**症状**：浏览器提示CORS错误
**解决方案**：
- 使用Chrome浏览器的无痕模式
- 或者使用本地服务版本

## 🌟 高级功能

### 本地服务版本（功能更全）
如果需要完整功能，可以启动本地服务：

```bash
# Windows用户
start-wechat-publisher.bat

# 访问
http://localhost:8788/wechat-publisher.html
```

**本地版本优势**：
- ✅ 图片上传功能
- ✅ 自动保存草稿
- ✅ 草稿管理
- ✅ 更稳定的连接

### 部署自己的云端服务
如果需要部署到自己的服务器：

1. **准备服务器**：Node.js环境 + 域名
2. **部署代码**：`git clone` 本仓库
3. **配置环境变量**：微信AppID/Secret
4. **启动服务**：`npm run dev`
5. **配置域名**：绑定到你的域名

## 📱 移动端使用

### 手机访问
1. 在手机浏览器中打开工具链接
2. 添加到主屏幕（像App一样使用）
3. 随时随地发布文章

### 推荐浏览器
- **Chrome**：最佳兼容性
- **Safari**：iOS用户首选
- **微信内置浏览器**：最方便

## 🔐 安全注意事项

### 保护账号安全
- 不要在公共场所使用
- 不要保存页面到公共设备
- 定期更换AppSecret

### 数据安全
- 页面不会存储你的配置信息
- 所有调用都是直接的API请求
- 建议使用测试公众号

## 🎯 快速开始

### 新用户5分钟上手
1. **第1分钟**：访问工具链接
2. **第2分钟**：获取IP并配置白名单
3. **第3分钟**：填写微信配置信息
4. **第4分钟**：创建测试文章
5. **第5分钟**：成功发布到草稿箱

### 常用链接收藏
```
🚀 微信发布工具：https://anbeime.github.io/ai-trend-publish/wechat-direct-publisher.html
🔧 微信公众平台：https://mp.weixin.qq.com
📖 使用文档：https://github.com/anbeime/ai-trend-publish/blob/main/WECHAT_PUBLISHER_GUIDE.md
```

## 📞 获取帮助

### 文档资源
- **详细使用指南**：`WECHAT_PUBLISHER_GUIDE.md`
- **故障排除**：`TESTING_GUIDE.md`
- **项目主页**：GitHub仓库

### 问题反馈
- GitHub Issues：报告问题和建议
- 查看常见问题：仓库Wiki
- 联系开发者：GitHub Issues

---

## 🎉 总结

你现在拥有：
- ✅ **云端可用的发布工具**
- ✅ **无需安装任何软件**
- ✅ **直接调用微信API**
- ✅ **完整的发布功能**

**立即开始**：访问 https://anbeime.github.io/ai-trend-publish/wechat-direct-publisher.html

---

**更新时间**：2025-12-28  
**版本**：v1.0  
**状态**：✅ 云端可用