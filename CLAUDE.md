# AI热点自动发布系统 - Agent 工作流指南

## 项目上下文

这是一个集成了微信小程序和自动化发布系统的AI内容创作平台，支持热点采集、智能改写和多平台发布。

---

## MANDATORY: Agent Workflow

Every new agent session MUST follow this workflow:

### Step 1: Initialize Environment

```bash
# 微信小程序开发
# 使用微信开发者工具打开项目

# 云函数开发（如需要）
cd cloudfunctions/[function-name]
npm install
```

### Step 2: Select Next Task

Read `task.json` and select ONE task to work on.

Selection criteria (in order of priority):
1. Choose a task where `passes: false`
2. Consider dependencies - fundamental features should be done first
3. Pick the highest-priority incomplete task

### Step 3: Implement the Task

- Read the task description and steps carefully
- Implement the functionality to satisfy all steps
- Follow existing code patterns and conventions
- 微信小程序使用原生开发方式
- 云函数使用 Node.js

### Step 4: Test Thoroughly

After implementation, verify ALL steps in the task:

**强制测试要求（Testing Requirements - MANDATORY）：**

1. **微信小程序页面修改**：
   - 在微信开发者工具中预览
   - 验证页面能正确加载和渲染
   - 验证表单提交、按钮点击等交互功能
   - 检查样式是否正确

2. **云函数修改**：
   - 使用微信开发者工具上传并部署云函数
   - 在云函数测试面板中测试
   - 在小程序端调用验证

3. **所有修改必须通过**：
   - 代码没有语法错误
   - 功能在微信开发者工具中正常工作
   - 云函数部署成功

**测试清单：**
- [ ] 代码没有 JavaScript/TypeScript 错误
- [ ] 页面在微信开发者工具中正常显示
- [ ] 交互功能正常工作
- [ ] 云函数部署成功
- [ ] 端到端流程测试通过

### Step 5: Update Progress

Write your work to `progress.txt`:

```
## [Date] - Task: [task description]

### What was done:
- [specific changes made]

### Testing:
- [how it was tested]

### Notes:
- [any relevant notes for future agents]
```

### Step 6: Commit Changes

**IMPORTANT: 所有更改必须在同一个 commit 中提交，包括 task.json 的更新！**

流程：
1. 更新 `task.json`，将任务的 `passes` 从 `false` 改为 `true`
2. 更新 `progress.txt` 记录工作内容
3. 提交所有更改：

```bash
git add .
git commit -m "[Date] Task [ID]: [task title] - Completed"
```

---

## 项目结构规范

### 微信小程序
- `pages/` - 页面目录
- `components/` - 组件目录
- `utils/` - 工具函数
- `app.js/app.json/app.wxss` - 全局配置

### 云函数
- `cloudfunctions/` - 云函数目录
- 每个云函数独立目录，包含 `index.js` 和 `package.json`

### 配置文件
- `config/` - 配置文件目录
- `docs/` - 文档目录

---

## 开发规范

### 代码风格
- 使用 ES6+ 语法
- 异步操作使用 async/await
- 错误处理使用 try/catch

### 命名规范
- 文件/文件夹：kebab-case
- 组件/页面：PascalCase
- 函数/变量：camelCase
- 常量：UPPER_SNAKE_CASE

### 注释规范
- 函数使用 JSDoc 注释
- 复杂逻辑添加行内注释

---

## 注意事项

1. **微信小程序限制**：
   - 包大小限制 2MB
   - 云函数超时 20 秒
   - 注意用户隐私保护

2. **API 密钥管理**：
   - 敏感信息存储在云函数中
   - 不要提交 .env 文件到 git

3. **测试环境**：
   - 开发时使用微信开发者工具
   - 云函数使用"云开发"环境
