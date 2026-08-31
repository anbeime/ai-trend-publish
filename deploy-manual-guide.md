# 微信小程序云函数手动部署指南

## 📋 前置准备

### 1. 获取小程序代码上传密钥
1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」→「开发管理」→「开发设置」
3. 找到「小程序代码上传」部分
4. 点击「生成」按钮下载代码上传密钥文件（private.key）

### 2. 获取云环境 ID
1. 打开微信开发者工具
2. 点击工具栏的「云开发」按钮
3. 在控制台右上角查看「环境 ID」

## 🚀 部署方法

### 方法一：使用微信开发者工具（推荐）

#### 步骤 1: 打开项目
1. 打开微信开发者工具
2. 点击「导入项目」
3. 选择项目目录：`C:\D\compet\tengxun\miniprogram-agent`
4. 输入你的小程序 AppID
5. 点击「确定」

#### 步骤 2: 初始化云开发环境
1. 点击工具栏的「云开发」按钮
2. 如果没有环境，点击「创建环境」
3. 记录环境 ID，后续配置需要用到

#### 步骤 3: 部署单个云函数
1. 在项目文件树中找到 `cloudfunctions` 目录
2. 右键点击需要部署的云函数文件夹
3. 选择「上传并部署：云端安装依赖」
4. 等待部署完成

#### 步骤 4: 批量部署（可选）
1. 右键点击 `cloudfunctions` 目录
2. 选择「上传并部署：云端安装依赖（不上传 node_modules）」
3. 等待所有云函数部署完成

### 方法二：使用 CloudBase CLI

#### 安装 CloudBase CLI
```bash
npm install -g @cloudbase/cli
```

#### 登录腾讯云
```bash
tcb login
```

#### 部署云函数
```bash
# 进入项目目录
cd C:\D\compet\tengxun\miniprogram-agent

# 部署单个云函数
tcb fn deploy init-collections --env 你的环境ID

# 或者部署所有云函数
tcb fn deploy --env 你的环境ID --all
```

### 方法三：使用 miniprogram-ci

#### 安装 miniprogram-ci
```bash
npm install -g miniprogram-ci
```

#### 设置环境变量
```bash
set WECHAT_APPID=你的小程序APPID
set WECHAT_PRIVATE_KEY_PATH=C:\path\to\private.key
```

#### 运行部署脚本
```bash
node deploy-with-cli.js
```

## 📦 云函数部署顺序

建议按以下顺序部署，确保依赖关系正确：

### 第一阶段：基础云函数
1. `init-collections` - 初始化数据库集合
2. `api-config` - API 配置管理

### 第二阶段：管理类云函数
3. `member-manager` - 会员管理
4. `wechat-account-manager` - 微信公众号账号管理
5. `project-manager` - 项目管理
6. `template-manager` - 模板管理
7. `character-manager` - 角色管理

### 第三阶段：工具类云函数
8. `link-parser` - 链接解析
9. `mediacrawler-hotspot` - 热点数据采集
10. `social-media-proxy` - 社交媒体代理

### 第四阶段：AI 相关云函数
11. `glm-api` - 智谱 GLM API
12. `agentAI` - AI 智能体
13. `chatDream` - 梦境对话
14. `generateDreamPrompt` - 梦境提示词生成
15. `generateImage` - 图片生成
16. `content-optimizer` - 内容优化

### 第五阶段：数据库相关
17. `creationHistory` - 创作历史
18. `creationHistory-initDatabase` - 创作历史数据库初始化
19. `credit-manager` - 积分管理

### 第六阶段：热点相关
20. `hotspot-analyzer` - 热点分析
21. `hotspot-collector` - 热点收集
22. `hotspot-miyucaicai` - 谜语猜猜热点
23. `hotspot-scorer` - 热点评分

### 第七阶段：支付和发布
24. `pay` - 支付功能
25. `topic-scorer` - 话题评分
26. `url-to-markdown` - URL 转 Markdown
27. `video-composer` - 视频合成
28. `viral-video-parser` - 病毒视频解析
29. `wechat-publish-api` - 微信发布 API
30. `wechat-publish-sdk` - 微信发布 SDK
31. `xiaohongshu-publisher` - 小红书发布

## ⚙️ 云函数配置说明

所有云函数已配置以下参数：

| 云函数类型 | 内存配置 | 超时时间 | 说明 |
|-----------|---------|---------|------|
| AI 相关 | 512MB | 60秒 | 需要大量计算 |
| 视频处理 | 1024MB | 60秒 | 需要处理大文件 |
| 数据管理 | 256MB | 60秒 | 轻量级操作 |
| 网络请求 | 512MB | 60秒 | 需要等待外部 API |

## ✅ 验证部署

### 1. 在微信开发者工具中验证
1. 打开「云开发」控制台
2. 点击「云函数」标签
3. 检查所有云函数是否显示在列表中
4. 查看每个云函数的配置是否正确

### 2. 测试云函数
1. 在「云函数」列表中点击某个函数
2. 点击「测试」按钮
3. 输入测试参数
4. 点击「运行」查看结果

### 3. 在小程序中测试
1. 编译运行小程序
2. 测试相关功能
3. 查看云函数调用日志

## 🔧 常见问题

### 问题 1: 部署失败，提示权限不足
**解决方案**: 确保你是小程序的管理员或开发者，并且已经上传了代码上传密钥。

### 问题 2: 云函数调用超时
**解决方案**: 检查云函数的超时配置，AI 相关函数建议设置为 60 秒。

### 问题 3: 依赖安装失败
**解决方案**: 手动进入云函数目录运行 `npm install`，然后重新部署。

### 问题 4: 环境 ID 错误
**解决方案**: 确认使用的是正确的云开发环境 ID，可以在微信开发者工具的云开发控制台查看。

## 📞 获取帮助

- [微信开发者文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [CloudBase CLI 文档](https://docs.cloudbase.net/cli/intro.html)
- [miniprogram-ci 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)

## 📝 部署检查清单

- [ ] 已获取小程序代码上传密钥
- [ ] 已获取云环境 ID
- [ ] 已安装微信开发者工具
- [ ] 已配置正确的 AppID
- [ ] 所有云函数已按顺序部署
- [ ] 已验证云函数配置（内存、超时）
- [ ] 已测试关键功能

---

**注意**: 部署完成后，请确保在小程序的 `app.js` 或相关配置文件中设置正确的云环境 ID。
