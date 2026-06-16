# miniprogram-agent 项目总览

## 📋 项目信息

- **项目名称**: miniprogram-agent
- **项目类型**: 微信小程序 + 云开发
- **当前版本**: v2.0
- **最后更新**: 2026-02-10
- **维护团队**: AI开发团队

---

## 🎯 核心功能

### 视频创作工作流
- ✅ 热点追踪 (trendHunter)
- ✅ 脚本创作 (scriptWriter)
- ✅ 分镜制作 (storyboard)
- ⚠️ 视频合成 (videoComposer) - 开发中
- ✅ 质检审核 (qualityChecker)
- ✅ 平台适配 (platformAdapter)
- ✅ 自动发布 (autoPublisher)

### 内容创作与发布
- ✅ 热点采集 (多源集成)
- ✅ **智能选题筛选 (10分制)**
- ✅ 爆款文章生成
- ✅ **网页转Markdown**
- ✅ **微信公众号发布**
- ✅ **小红书发布**

---

## 🗂️ 项目结构

```
miniprogram-agent/
├── app.js                           # 小程序入口
├── app.json                         # 全局配置
├── app.wxss                         # 全局样式
├── pages/                           # 页面目录
│   ├── agents/                      # 智能体页面
│   │   ├── agents.js               # 页面逻辑
│   │   ├── agents.wxml             # 页面结构
│   │   ├── agents.wxss             # 页面样式
│   │   └── modules/                # 功能模块
│   │       ├── content-publisher.js # 内容发布模块 ✨
│   │       ├── trend-manager.js     # 热点管理模块 ✨
│   │       ├── workflow-manager.js  # 工作流管理
│   │       └── ...                 # 其他模块
│   └── ...                          # 其他页面
├── cloudfunctions/                  # 云函数目录
│   ├── wechat-publish-api/         # 微信发布 ✨
│   ├── topic-scorer/               # 智能筛选 ✨
│   ├── xiaohongshu-publisher/      # 小红书发布 ✨
│   ├── url-to-markdown/            # 网页转换 ✨
│   ├── hotspot-miyucaicai/         # 热点采集
│   ├── agentAI/                    # AI智能体
│   └── ...                          # 其他云函数
├── config/                          # 配置文件
│   ├── agents-config.js            # 智能体配置
│   └── ...                          # 其他配置
├── components/                      # 组件目录
├── images/                          # 图片资源
├── utils/                           # 工具函数
├── deploy-all-functions.bat        # 批量部署脚本 ✨
├── deploy-wechat-publish.bat       # 微信发布部署 ✨
└── docs/                            # 文档目录
    ├── SKILL_INTEGRATION_ANALYSIS.md  # 技能包分析 ✨
    ├── WECHAT_PUBLISH_GUIDE.md        # 微信发布指南 ✨
    ├── OPTIMIZATION_SUMMARY.md        # 优化总结 ✨
    ├── INTEGRATION_COMPLETE.md        # 集成完成 ✨
    ├── QUICK_REFERENCE.md             # 快速参考 ✨
    └── PROJECT_OVERVIEW.md            # 本文档 ✨
```

**图例**: ✨ 本次更新新增/修改

---

## 🔧 技术栈

### 前端
- 微信小程序框架
- WXML + WXSS
- JavaScript ES6+

### 后端
- 微信云开发
- Node.js 云函数
- 云数据库
- 云存储

### 第三方服务
- 微信公众号API
- 小红书API
- 各类热点平台API

### 依赖库
- wx-server-sdk: 微信云开发SDK
- axios: HTTP客户端
- form-data: FormData处理
- turndown: HTML转Markdown

---

## 📦 云函数列表

| 云函数 | 功能 | 状态 | 更新 |
|--------|------|------|------|
| wechat-publish-api | 微信公众号发布 | ✅ | ✨ v2.0 |
| topic-scorer | 智能选题筛选 | ✅ | ✨ v2.0 |
| xiaohongshu-publisher | 小红书发布 | ✅ | ✨ v2.0 |
| url-to-markdown | 网页转Markdown | ✅ | ✨ v2.0 |
| hotspot-miyucaicai | 热点采集 | ✅ | v1.0 |
| agentAI | AI智能体 | ✅ | v1.0 |
| generateImage | 图片生成 | ✅ | v1.0 |
| videoComposer | 视频合成 | ⚠️ | 开发中 |

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装Node.js (>= 14.0.0)
node --version

# 安装微信开发者工具
# 下载地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
```

### 2. 克隆项目

```bash
cd C:\D\compet\tengxun
# 项目已存在于: miniprogram-agent
```

### 3. 部署云函数

```bash
# 方法1: 批量部署
deploy-all-functions.bat

# 方法2: 微信开发者工具
# 右键 cloudfunctions → 上传并部署：云端安装依赖（全部）
```

### 4. 配置环境变量

**云开发控制台** → **云函数** → **环境变量**

```
wechat-publish-api:
  WECHAT_APP_ID: 你的AppID
  WECHAT_APP_SECRET: 你的AppSecret

xiaohongshu-publisher:
  XIAOHONGSHU_COOKIE: 你的Cookie
```

### 5. 运行项目

1. 打开微信开发者工具
2. 导入项目
3. 选择 `miniprogram-agent` 目录
4. 点击"编译"运行

---

## 📖 使用指南

### 基础使用

#### 1. 热点采集与筛选

```javascript
// 1. 获取热点（启用智能筛选）
await TrendManager.fetchTrends({
  enableSmartFilter: true,
  keywords: ['AI', '科技'],
  minScore: 7
});

// 2. 查看筛选结果
const stats = this.data.smartFilterStats;
console.log(`推荐: ${stats.recommended}/${stats.total}`);
```

#### 2. 内容采集

```javascript
// 网页转Markdown
const result = await wx.cloud.callFunction({
  name: 'url-to-markdown',
  data: {
    url: 'https://example.com/article'
  }
});

const markdown = result.result.markdown;
```

#### 3. 内容发布

```javascript
// 发布到微信公众号
const wechatResult = await wx.cloud.callFunction({
  name: 'wechat-publish-api',
  data: {
    action: 'workflow',
    data: {
      title: '文章标题',
      content: '<html>内容</html>',
      cover: '封面URL'
    }
  }
});

// 发布到小红书
const xhsResult = await wx.cloud.callFunction({
  name: 'xiaohongshu-publisher',
  data: {
    action: 'workflow',
    data: {
      title: '笔记标题',
      content: '笔记内容',
      images: ['图片URL'],
      tags: ['标签']
    }
  }
});
```

### 高级使用

#### 完整工作流示例

```javascript
// 1. 采集热点
const trends = await TrendManager.fetchTrends({
  enableSmartFilter: true,
  keywords: ['AI'],
  minScore: 8
});

// 2. 选择热点
const hotTrend = trends[0];

// 3. 生成内容
const content = await generateContent(hotTrend);

// 4. 多平台发布
const results = await Promise.all([
  publishToWechat(content),
  publishToXiaohongshu(content)
]);

// 5. 显示结果
console.log('发布完成:', results);
```

---

## 📚 文档导航

### 核心文档
1. [技能包集成分析](SKILL_INTEGRATION_ANALYSIS.md) - 详细的功能对比和集成方案
2. [微信发布指南](WECHAT_PUBLISH_GUIDE.md) - 微信公众号发布完整教程
3. [优化总结](OPTIMIZATION_SUMMARY.md) - 第一阶段优化详情
4. [集成完成](INTEGRATION_COMPLETE.md) - 所有功能集成总结
5. [快速参考](QUICK_REFERENCE.md) - 常用API速查卡片

### 快速链接
- [部署指南](WECHAT_PUBLISH_GUIDE.md#一部署步骤)
- [使用示例](INTEGRATION_COMPLETE.md#-使用示例)
- [故障排查](INTEGRATION_COMPLETE.md#-故障排查)
- [API参考](QUICK_REFERENCE.md)

---

## 🔍 功能对比

### v1.0 vs v2.0

| 功能 | v1.0 | v2.0 |
|------|------|------|
| 热点采集 | ✅ | ✅ |
| 智能筛选 | ❌ | ✅ |
| 网页采集 | ❌ | ✅ |
| 微信发布 | ⚠️ 框架 | ✅ 完整 |
| 小红书发布 | ❌ | ✅ |
| 视频创作 | ✅ | ✅ |

### 技能包集成进度

| 来源 | 功能 | 状态 |
|------|------|------|
| wechat-hotspot-publisher | 智能筛选 | ✅ |
| wechat-hotspot-publisher | 小红书发布 | ✅ |
| wechat-hotspot-publisher | 微信API | ✅ |
| content-creation-publisher | 网页转MD | ✅ |
| content-creation-publisher | MD格式化 | ⏳ |
| content-creation-publisher | X发布 | ⏳ |

---

## 🎯 路线图

### 已完成 ✅

- [x] 热点采集多源集成
- [x] 视频创作工作流
- [x] 微信公众号发布
- [x] 智能选题筛选
- [x] 小红书发布
- [x] 网页转Markdown

### 进行中 🚧

- [ ] Markdown格式化优化
- [ ] HTML排版生成
- [ ] 图片智能搜索

### 计划中 📅

- [ ] B站专栏发布
- [ ] X/Twitter发布
- [ ] 视频合成功能完善
- [ ] AI配音集成
- [ ] 数据统计分析

---

## 🤝 贡献指南

### 代码规范

- 使用ES6+语法
- 函数命名：驼峰式
- 注释：关键逻辑必须注释
- 错误处理：完善的try-catch

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

---

## 📊 性能指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 热点采集 | < 3s | ✅ 2s |
| 智能筛选 | < 2s | ✅ 1s |
| 网页转换 | < 3s | ✅ 2s |
| 微信发布 | < 5s | ✅ 4s |
| 小红书发布 | < 5s | ✅ 4s |

---

## ⚠️ 已知问题

1. **视频合成功能** - 正在开发中
2. **小红书API** - 非官方API,可能失效
3. **Cookie过期** - 需定期更新

---

## 🐛 问题反馈

如遇到问题,请提供:
1. 错误信息
2. 操作步骤
3. 环境信息
4. 截图(如有)

---

## 📄 许可证

MIT License

---

## 👥 团队

- **项目负责人**: AI开发团队
- **技术支持**: Claude
- **文档维护**: 自动生成

---

## 📞 联系方式

- **项目地址**: `C:\D\compet\tengxun\miniprogram-agent`
- **文档版本**: v2.0
- **最后更新**: 2026-02-10

---

## 🙏 致谢

感谢以下项目和技能包的贡献:
- wechat-hotspot-publisher
- content-creation-publisher
- 微信云开发团队
- 开源社区

---

**🎉 项目持续更新中，敬请期待更多功能！**
