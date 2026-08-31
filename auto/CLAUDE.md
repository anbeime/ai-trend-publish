# CLAUDE.md - 微信小程序智能体自动化开发指导

> **项目**：miniprogram-agent（微信小程序智能体）  
> **类型**：微信小程序 + 云开发 + AI智能体  
> **开发模式**：🚀 全自动持续开发（无需反复确认）  
> **最后更新**：2026-02-17

---

## 🎯 核心原则

**本项目的开发采用全自动模式，AI助手应：**

1. **自主决策**：根据配置和上下文自主决定下一步行动
2. **持续执行**：完成一个任务后立即开始下一个，无需等待确认
3. **自我验证**：自动检查结果是否符合要求
4. **自动修复**：发现问题时尝试自动修复，无法修复才报告
5. **完整记录**：所有操作记录到 auto/progress.txt

---

## 🚀 自动化开发工作流

### 启动开发（只需一次人工指令）

```markdown
请为"微信小程序智能体项目"进行全自动开发测试。

操作要求：
1. 读取 auto/skills-config.yaml 了解项目配置
2. 读取 auto/task-status.json 了解当前任务状态
3. 按照任务清单持续开发测试，无需等待确认
4. 所有测试报告保存到 auto/reports/ 目录
5. 记录进度到 auto/progress.txt
6. 直到所有任务完成或遇到无法解决的问题

开始执行。
```

---

## 📋 任务清单（开发测试路线图）

### Task 1: 代码规范检查
**状态**: pending → 进行中 → completed  
**预计耗时**: 15分钟

```yaml
title: "代码规范检查"
description: "检查代码规范性和潜在问题"
steps:
  1: "JavaScript规范检查"
     - 检查变量命名规范
     - 检查函数长度和复杂度
     - 检查注释完整性
     - 检查错误处理
     
  2: "WXML/WXSS规范检查"
     - 检查类名命名规范
     - 检查样式复用情况
     - 检查响应式设计
     
  3: "云函数规范检查"
     - 检查入口函数规范
     - 检查错误处理机制
     - 检查日志记录
     - 检查返回值格式
     
  4: "生成检查报告"
     - 汇总所有问题
     - 分级问题严重程度
     - 提供修复建议
```

**输出文件**：`auto/reports/lint-report-[日期].md`

---

### Task 2: 单元测试
**状态**: pending → 进行中 → completed  
**预计耗时**: 30分钟

```yaml
title: "单元测试"
description: "运行单元测试用例"
steps:
  1: "工具函数测试"
     - 测试 utils/ 目录下所有工具函数
     - 测试 formatDate 时间格式化
     - 测试 debounce/throttle 防抖节流
     - 测试数据格式化函数
     
  2: "云函数逻辑测试"
     - 测试 content-optimizer 优化逻辑
     - 测试 hotspot-scorer 评分逻辑
     - 测试 API 响应处理
     - 测试错误处理逻辑
     
  3: "生成测试报告"
     - 统计测试通过率
     - 记录失败用例
     - 生成覆盖率报告
```

**输出文件**：
- `auto/reports/test-report-[日期].md`
- `auto/reports/coverage-report-[日期].html`

---

### Task 3: 云函数测试
**状态**: pending → 进行中 → completed  
**预计耗时**: 45分钟

```yaml
title: "云函数测试"
description: "测试云函数功能"
steps:
  1: "本地调试准备"
     - 检查云函数配置
     - 验证依赖安装
     - 准备测试数据
     
  2: "agentAI 云函数测试"
     - 测试对话接口
     - 测试上下文记忆
     - 测试错误处理
     
  3: "content-optimizer 云函数测试"
     - 测试内容优化接口
     - 测试不同平台格式
     - 测试错误处理
     
  4: "hotspot-collector 云函数测试"
     - 测试热点采集接口
     - 测试数据解析
     - 测试错误处理
     
  5: "wechat-publish-api 云函数测试"
     - 测试发布接口（Mock模式）
     - 测试参数验证
     - 测试错误处理
     
  6: "其他云函数测试"
     - 测试 xiaohongshu-publisher
     - 测试 credit-manager
     - 测试 template-manager
```

**测试场景配置**：参考 `auto/test-config.json`

---

### Task 4: 小程序页面测试
**状态**: pending → 进行中 → completed  
**预计耗时**: 30分钟

```yaml
title: "小程序页面测试"
description: "测试小程序页面功能"
steps:
  1: "首页测试"
     - 测试页面加载
     - 测试数据渲染
     - 测试跳转功能
     
  2: "智能体页面测试"
     - 测试智能体列表
     - 测试智能体详情
     - 测试对话功能
     
  3: "内容创作页面测试"
     - 测试内容生成
     - 测试格式优化
     - 测试图片生成
     
  4: "热点页面测试"
     - 测试热点列表
     - 测试热点详情
     - 测试报告生成
     
  5: "发布页面测试"
     - 测试平台选择
     - 测试发布流程
     - 测试历史记录
```

---

### Task 5: 集成测试
**状态**: pending → 进行中 → completed  
**预计耗时**: 60分钟

```yaml
title: "集成测试"
description: "端到端集成测试"
steps:
  1: "完整流程测试"
     - 用户登录流程
     - 智能体对话流程
     - 内容生成流程
     - 发布流程
     
  2: "多平台发布测试"
     - 微信公众号发布流程
     - 小红书发布流程
     - B站发布流程
     
  3: "异常场景测试"
     - 网络异常处理
     - API限流处理
     - 参数错误处理
     - 超时处理
     
  4: "性能测试"
     - 页面加载时间
     - API响应时间
     - 内存占用检查
```

---

### Task 6: 测试报告汇总
**状态**: pending → 进行中 → completed  
**预计耗时**: 15分钟

```yaml
title: "测试报告汇总"
description: "汇总所有测试结果"
steps:
  1: "收集测试结果"
     - 收集代码检查报告
     - 收集单元测试报告
     - 收集云函数测试报告
     - 收集集成测试报告
     
  2: "生成汇总报告"
     - 统计总体通过率
     - 列出所有问题
     - 提供修复建议
     
  3: "更新任务状态"
     - 更新 task-status.json
     - 记录完成时间
```

**输出文件**：`auto/reports/summary-report-[日期].md`

---

## 🤖 AI自主决策规则

### 自动确认（无需人工干预）

- 测试通过 → 自动继续
- 发现轻微问题 → 自动修复
- 任务步骤完成 → 自动开始下一任务
- 生成报告成功 → 自动继续

### 需要报告的情况

- 测试失败率 > 20%
- 发现严重代码问题
- 云函数无法启动
- 需要人工决策的配置问题

---

## 📝 进度记录规范

### progress.txt 格式

```markdown
## [日期时间] - Task [ID]: [任务标题]

### 状态: [completed / in-progress / failed]

### 已完成:
- [具体完成的内容]

### 测试结果:
- 测试用例: X个
- 通过: X个
- 失败: X个
- 覆盖率: X%

### 遇到的问题:
- [问题描述]

### 下一步:
- [下一步计划]
```

---

## 🎨 输出规范

### 文件命名

```
代码检查报告:  lint-report-20260217.md
单元测试报告:   test-report-20260217.md
覆盖率报告:     coverage-report-20260217.html
云函数测试:     cloud-test-report-20260217.md
集成测试报告:   integration-test-report-20260217.md
汇总报告:       summary-report-20260217.md
```

### 目录结构

```
auto/
├── skills-config.yaml          # 技能配置
├── AI操作指南.md               # 操作指南
├── CLAUDE.md                   # 自动化指导（本文件）
├── task-status.json            # 任务状态
├── test-config.json            # 测试配置
├── progress.txt                # 进度记录
├── scripts/                    # 自动化脚本
│   ├── test_runner.py
│   ├── deploy_helper.py
│   └── ci_template.yml
├── tests/                      # 测试用例
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── reports/                    # 测试报告
    ├── lint-report-*.md
    ├── test-report-*.md
    └── coverage-report-*.html
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

## 🛠️ 推荐技能使用

### 测试开发
- **Python技能**：编写测试脚本
- **JavaScript技能**：编写测试用例

### 报告生成
- **docx技能**：生成Word格式测试报告
- **xlsx技能**：生成测试数据统计表

### 辅助工具
- **WebSearch**：查询测试框架文档

---

## 📚 参考资源

### 微信开发文档
- 小程序框架：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/
- 云函数调试：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/local-debug.html

### 测试框架
- Jest：https://jestjs.io/
- 小程序自动化测试：https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/test.html

---

**最后更新**：2026-02-17  
**版本**：v1.0 - 全自动开发测试模式
