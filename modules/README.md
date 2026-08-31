# Workflow Manager 模块

## 概述
`workflow-manager.js` 是一个独立的工作流管理模块，从 `pages/agents/agents.js` 中提取了多智能体协作的核心功能。

## 包含的方法

### 主要功能方法

1. **startCreation(pageContext)** - 启动创作流程
   - 从原 `sendMessage()` 方法提取
   - 处理 API 配置检查
   - 根据测试模式执行单个智能体或完整工作流

2. **testSingleAgent(pageContext, agentKey, userInput)** - 测试单个智能体
   - 从原 `testSingleAgent()` 方法提取
   - 调用 AI API 并处理响应
   - 更新智能体状态和消息

3. **executeFullWorkflow(pageContext, userInput)** - 执行完整工作流
   - 从原 `executeFullWorkflow()` 方法提取
   - 按顺序执行所有活跃智能体
   - 支持取消、反馈处理、角色三视图生成、AutoGLM 发布等功能

4. **cancelWorkflow(pageContext)** - 取消工作流
   - 新增方法，用于取消正在运行的工作流
   - 设置 `isCancelled` 标志并显示确认对话框

### 辅助方法

5. **addMessage(pageContext, sender, content, isTyping)** - 添加消息
6. **updateMessage(pageContext, sender, content, isTyping)** - 更新消息
7. **updateMessageWithData(pageContext, sender, messageData, isTyping)** - 更新消息（带数据）
8. **updateAgentStatus(pageContext, agentKey, status, progress)** - 更新智能体状态
9. **delay(ms)** - 延迟函数
10. **formatTime(timestamp)** - 格式化时间

## 使用方法

### 1. 在 agents.js 中引入模块

```javascript
// pages/agents/agents.js
const WorkflowManager = require('../../modules/workflow-manager');

Page({
  data: {
    // ...
  },

  // 使用模块方法
  async sendMessage() {
    await WorkflowManager.startCreation(this);
  },

  async testSingleAgent(agentKey, userInput) {
    await WorkflowManager.testSingleAgent(this, agentKey, userInput);
  },

  async executeFullWorkflow(userInput) {
    await WorkflowManager.executeFullWorkflow(this, userInput);
  },

  cancelWorkflow() {
    WorkflowManager.cancelWorkflow(this);
  },

  // ...其他方法
});
```

### 2. 在 WXML 中绑定取消按钮

```xml
<button class="cancel-btn {{working ? '' : 'hidden'}}"
        bindtap="cancelWorkflow"
        hover-class="button-hover">
  取消任务
</button>
```

## 关键改动说明

### 从 `this` 到 `pageContext`
由于这是外部模块，所有原本的 `this` 引用都改为 `pageContext` 参数：

**原代码 (agents.js):**
```javascript
async sendMessage() {
  if (this.data.working) return;
  this.addMessage("user", this.data.inputValue);
  // ...
}
```

**新代码 (workflow-manager.js):**
```javascript
async startCreation(pageContext) {
  if (pageContext.data.working) return;
  this.addMessage(pageContext, "user", pageContext.data.inputValue);
  // ...
}
```

### 模块内方法调用
模块内部方法之间的调用使用 `this.methodName(pageContext, ...)`：

```javascript
// 调用其他模块方法
this.addMessage(pageContext, "system", "开始工作...");
this.updateAgentStatus(pageContext, agentKey, "working", 10);
await this.executeFullWorkflow(pageContext, userInput);
```

### 调用页面方法
调用页面上下文的方法使用 `pageContext.methodName(...)`：

```javascript
// 调用 agents.js 中的方法
const response = await pageContext.callAIAPI(agentKey, userInput, [], null);
const context = pageContext.buildAgentContext(agent.key);
await pageContext.generateAllCharacterTurnarounds(characters);
```

## 依赖关系

### 模块依赖于 agents.js 中的方法：
- `callAIAPI()` - 调用 AI API
- `buildAgentContext()` - 构建智能体上下文
- `extractCharactersFromScript()` - 从脚本提取角色
- `generateAllCharacterTurnarounds()` - 生成角色三视图
- `getPlatformName()` - 获取平台名称
- `callAutoGLMPublish()` - AutoGLM 发布
- `saveCreationHistoryToHistory()` - 保存创作历史
- `showConfigDialog()` - 显示配置对话框

### 模块依赖于 app.globalData：
- `app.globalData.agents` - 智能体配置信息

### 模块依赖于 pageContext.data：
- `working` - 工作状态
- `apiConfigured` - API 配置状态
- `inputValue` - 输入值
- `testMode` - 测试模式
- `selectedTestAgent` - 选中的测试智能体
- `agentList` - 智能体列表
- `agentOutputs` - 智能体输出
- `messages` - 消息列表
- `isCancelled` - 取消标志
- `feedbackQueue` - 反馈队列
- `pendingFeedback` - 待处理反馈
- `characterConsistency` - 角色一致性配置
- `autoglmConfig` - AutoGLM 配置
- `selectedPlatform` - 选中的平台

## 文件位置
```
miniprogram-agent/
├── modules/
│   ├── workflow-manager.js    # 工作流管理模块
│   └── README.md              # 本文档
├── pages/
│   └── agents/
│       └── agents.js          # 主页面文件（使用该模块）
```

## 注意事项

1. **不要修改 agents.js 的原有方法** - 模块只是代码提取，agents.js 保持不变
2. **pageContext 参数** - 所有模块方法的第一个参数必须是页面上下文对象 (this)
3. **模块化优势** - 便于代码维护、测试和复用
4. **向后兼容** - 如果需要，agents.js 可以继续使用原有的内联方法

## 后续改进建议

1. 将更多相关功能提取到独立模块
2. 添加单元测试
3. 优化错误处理
4. 添加更详细的日志记录
5. 考虑使用 TypeScript 增强类型安全

## 版本历史

- **v1.0.0** (2026-01-14) - 初始版本，提取工作流管理核心功能
