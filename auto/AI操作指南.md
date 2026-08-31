# 🤖 AI操作指南 - 微信小程序智能体项目

> **项目**：miniprogram-agent（微信小程序智能体）  
> **类型**：微信小程序 + 云开发 + AI智能体  
> **用途**：指导AI助手快速理解项目结构，执行标准化开发测试操作  
> **版本**：v1.0 | 2026-02-17

---

## 📋 项目概览

```yaml
项目名称: 微信小程序智能体
项目类型: 微信小程序 + 微信云开发
核心功能:
  - AI对话智能体
  - 热点内容生成
  - 多平台内容发布（微信公众号、小红书、B站）
技术栈:
  前端: 微信小程序原生 (WXML/WXSS/JS)
  后端: 微信云开发 (Node.js云函数)
  AI: 智谱AI、Coze平台
```

---

## 🗂️ 目录结构说明

```
miniprogram-agent/
├── 📄 skills-config.yaml          # 技能配置文件（必读）
├── 📄 AI操作指南.md               # 本文件
├── 📄 CLAUDE.md                   # 自动化开发指导
├── 📁 auto/                       # 自动化配置目录
│   ├── skills-config.yaml        # 自动化技能配置
│   ├── AI操作指南.md             # 本文件
│   ├── CLAUDE.md                 # 自动化开发指导
│   ├── task-status.json          # 任务状态跟踪
│   ├── test-config.json          # 测试配置
│   └── scripts/                  # 自动化脚本
│       ├── test_runner.py        # 测试运行器
│       ├── deploy_helper.py      # 部署助手
│       └── ci_template.yml       # CI模板
├── 📁 app.js                      # 小程序入口
├── 📁 app.json                    # 小程序配置
├── 📁 app.wxss                    # 全局样式
├── 📁 pages/                      # 页面目录
│   ├── index/                    # 首页
│   ├── agents/                   # 智能体页面
│   ├── content-creator/          # 内容创作
│   ├── hotspot/                  # 热点功能
│   └── ...
├── 📁 cloudfunctions/             # 云函数目录
│   ├── agentAI/                  # AI对话
│   ├── content-optimizer/        # 内容优化
│   ├── hotspot-collector/        # 热点采集
│   ├── wechat-publish-api/       # 微信发布
│   └── ...
├── 📁 components/                 # 组件目录
├── 📁 utils/                      # 工具函数
├── 📁 config/                     # 配置文件
└── 📁 docs/                       # 项目文档
```

---

## 🚀 快速开始（AI执行清单）

### Step 1: 读取配置
```
操作：读取 auto/skills-config.yaml 文件
目的：了解项目配置、可用技能、测试场景
```

### Step 2: 检查任务状态
```
操作：读取 auto/task-status.json 文件
目的：了解当前开发/测试任务状态
```

### Step 3: 执行自动化任务
```
操作：根据任务状态执行对应的开发或测试任务
目的：推进项目开发或进行质量验证
```

---

## 🛠️ 技能调用规范

### 系统内置技能

| 技能 | 调用方式 | 示例 | 优先级 |
|-----|---------|------|-------|
| docx | `使用 docx 技能...` | 项目文档、API文档 | ⭐⭐⭐⭐ |
| pptx | `使用 pptx 技能...` | 项目演示 | ⭐⭐⭐ |
| xlsx | `使用 xlsx 技能...` | 配置管理、数据分析 | ⭐⭐⭐ |
| python | `使用 python 技能...` | 测试脚本、自动化工具 | ⭐⭐⭐⭐⭐ |
| javascript | `JS开发...` | 小程序代码、云函数 | ⭐⭐⭐⭐⭐ |

---

## 📋 任务执行指南

### Task 1: 代码规范检查

**目标**：检查代码规范性和潜在问题

**执行步骤**：
```
1. 检查 JavaScript 代码规范
   - 检查变量命名
   - 检查函数长度
   - 检查注释完整性
   
2. 检查 WXML/WXSS 规范
   - 检查类名命名
   - 检查样式复用
   
3. 检查云函数规范
   - 检查错误处理
   - 检查日志记录
   
4. 生成检查报告
```

**输出**：代码规范检查报告

---

### Task 2: 单元测试

**目标**：运行单元测试用例

**执行步骤**：
```
1. 测试工具函数 (utils/)
   - 测试 formatDate
   - 测试 debounce/throttle
   - 测试数据格式化
   
2. 测试云函数逻辑
   - 测试 content-optimizer
   - 测试 hotspot-scorer
   - 测试 API响应处理
   
3. 生成测试报告
```

**测试文件位置**：`auto/tests/`

---

### Task 3: 云函数测试

**目标**：测试云函数功能

**执行步骤**：
```
1. 本地调试云函数
   - 启动本地云函数调试
   - 测试各云函数入口
   
2. 验证API响应
   - 测试 agentAI 对话
   - 测试 content-optimizer 优化
   - 测试 hotspot-collector 采集
   - 测试 wechat-publish-api 发布
   
3. 检查错误处理
   - 测试参数错误
   - 测试网络异常
   - 测试API限流
```

**测试场景**：参考 skills-config.yaml 中的 test_scenarios

---

### Task 4: 小程序预览测试

**目标**：生成预览版本并测试

**执行步骤**：
```
1. 检查小程序配置
   - 检查 app.json
   - 检查页面路径
   
2. 验证页面功能
   - 首页加载
   - 智能体对话
   - 内容创作流程
   - 热点功能
   - 发布功能
   
3. 检查样式兼容性
   - 不同屏幕尺寸
   - 深色模式
```

---

### Task 5: 集成测试

**目标**：端到端集成测试

**执行步骤**：
```
1. 完整流程测试
   - 用户登录流程
   - 智能体对话流程
   - 内容生成流程
   - 发布流程
   
2. 多平台发布测试
   - 微信公众号发布
   - 小红书发布
   - B站发布
   
3. 性能测试
   - 页面加载时间
   - API响应时间
   - 内存占用
```

---

## 🔄 完整工作流示例

### 工作流A：日常开发测试

```
Step 1: 配置读取
  → 读取 auto/skills-config.yaml
  → 读取 auto/task-status.json

Step 2: 代码检查
  → 运行代码规范检查
  → 生成检查报告

Step 3: 单元测试
  → 运行 utils 测试
  → 运行云函数逻辑测试
  → 生成测试报告

Step 4: 云函数测试
  → 本地调试各云函数
  → 验证API响应
  → 检查错误处理

Step 5: 集成测试
  → 完整流程测试
  → 多平台发布测试
  → 性能测试

Step 6: 报告生成
  → 汇总测试结果
  → 生成测试报告
  → 更新 task-status.json
```

### 工作流B：发布前验证

```
Step 1: 全量测试
  → 运行所有测试用例
  → 检查测试覆盖率

Step 2: 云函数部署检查
  → 检查云函数配置
  → 验证依赖完整性
  → 检查环境变量

Step 3: 发布检查
  → 检查版本号
  → 检查更新日志
  → 检查配置文件

Step 4: 生成发布报告
```

---

## 📝 输出文件命名规范

```
测试报告:      test-report-[日期].md
代码检查:      lint-report-[日期].md
覆盖率报告:    coverage-report-[日期].html
部署日志:      deploy-log-[日期].txt
```

---

## 📊 测试覆盖要求

| 模块 | 覆盖率要求 | 优先级 |
|-----|-----------|-------|
| utils/ | 90% | ⭐⭐⭐⭐⭐ |
| cloudfunctions/ | 80% | ⭐⭐⭐⭐⭐ |
| pages/ | 60% | ⭐⭐⭐⭐ |
| components/ | 70% | ⭐⭐⭐⭐ |

---

## 🌐 资源链接

### 微信开发文档
- 小程序框架：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/
- 云函数指南：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html

### AI接口文档
- 智谱AI：https://open.bigmodel.cn/
- Coze平台：https://www.coze.cn/

---

## ⚠️ 重要提醒

### 对AI助手的要求

1. **必须先读取 auto/skills-config.yaml 和 auto/task-status.json** 再执行操作
2. **所有测试报告保存到 auto/reports/ 目录**
3. **及时更新任务状态**：更新 auto/task-status.json
4. **记录测试进度**：更新 auto/progress.txt
5. **云函数测试需使用本地调试模式**，不要直接调用生产环境

### 质量检查清单

- [ ] 是否已读取所有配置文件？
- [ ] 代码规范检查是否通过？
- [ ] 单元测试是否全部通过？
- [ ] 云函数测试是否通过？
- [ ] 集成测试是否通过？
- [ ] 测试报告是否生成？
- [ ] 任务状态是否已更新？

---

## 📞 参考资料

- 技能配置：auto/skills-config.yaml
- 自动化指导：auto/CLAUDE.md
- 任务状态：auto/task-status.json
- 测试配置：auto/test-config.json

---

**最后更新**：2026-02-17  
**文档版本**：v1.0  
**适用AI**：所有协助本项目开发的AI助手
