# WorkflowManager 快速参考

## 导入模块
```javascript
const WorkflowManager = require('../../modules/workflow-manager');
```

## API 方法

### 主要方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `startCreation(pageContext)` | pageContext | 启动创作流程，处理单个智能体测试或完整工作流 |
| `testSingleAgent(pageContext, agentKey, userInput)` | pageContext, 智能体键名, 用户输入 | 测试单个智能体 |
| `executeFullWorkflow(pageContext, userInput)` | pageContext, 用户输入 | 执行完整的多智能体工作流 |
| `cancelWorkflow(pageContext)` | pageContext | 取消正在运行的工作流 |

### 辅助方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `addMessage(pageContext, sender, content, isTyping)` | pageContext, 发送者, 内容, 是否临时 | 添加新消息 |
| `updateMessage(pageContext, sender, content, isTyping)` | pageContext, 发送者, 内容, 是否临时 | 更新消息 |
| `updateMessageWithData(pageContext, sender, messageData, isTyping)` | pageContext, 发送者, 消息数据, 是否临时 | 更新消息(带图片/视频) |
| `updateAgentStatus(pageContext, agentKey, status, progress)` | pageContext, 智能体键名, 状态, 进度 | 更新智能体状态 |
| `delay(ms)` | 毫秒数 | 延迟执行 |
| `formatTime(timestamp)` | 时间戳 | 格式化时间为 HH:MM |

## 快速集成

### 1. 基本用法
```javascript
Page({
  async sendMessage() {
    await WorkflowManager.startCreation(this);
  },

  cancelWorkflow() {
    WorkflowManager.cancelWorkflow(this);
  },
});
```

### 2. WXML 绑定
```xml
<button bindtap="sendMessage">发送</button>
<button bindtap="cancelWorkflow">取消</button>
```

## 依赖方法 (需在 agents.js 中实现)

必需:
- `callAIAPI(agentType, userMessage, context, mediaInfo)`
- `buildAgentContext(currentAgentKey)`
- `showConfigDialog()`

可选 (根据功能需要):
- `extractCharactersFromScript(scriptOutput)`
- `generateAllCharacterTurnarounds(characters)`
- `getPlatformName(platform)`
- `callAutoGLMPublish(platform, title, description, tags)`
- `saveCreationHistoryToHistory()`

## 数据结构

### pageContext.data 需要包含:
```javascript
{
  working: false,              // 工作状态
  apiConfigured: true,         // API 配置状态
  inputValue: "",              // 输入值
  testMode: "workflow",        // 测试模式: "workflow" | "single"
  selectedTestAgent: "",       // 选中的测试智能体
  agentList: [],               // 智能体列表
  messages: [],                // 消息列表
  agentOutputs: {},            // 智能体输出
  isCancelled: false,          // 取消标志
  feedbackQueue: [],           // 反馈队列
  pendingFeedback: {},         // 待处理反馈
  characterConsistency: {      // 角色一致性配置
    enabled: false
  },
  autoglmConfig: {             // AutoGLM 配置
    enabled: false
  },
  selectedPlatform: "douyin",  // 选中的平台
}
```

## 状态码

### 智能体状态 (status)
- `"working"` - 工作中
- `"completed"` - 已完成
- `"error"` - 错误

### 消息发送者 (sender)
- `"user"` - 用户
- `"system"` - 系统
- `[agentKey]` - 智能体键名

## 示例代码

### 完整工作流
```javascript
async executeFullWorkflow(userInput) {
  console.log('开始工作流:', userInput);
  await WorkflowManager.executeFullWorkflow(this, userInput);
  console.log('工作流完成');
}
```

### 单个智能体测试
```javascript
async testAgent() {
  const agentKey = "scriptWriter";
  const userInput = "创作一个短视频脚本";
  await WorkflowManager.testSingleAgent(this, agentKey, userInput);
}
```

### 取消工作流
```javascript
cancelWorkflow() {
  if (this.data.working) {
    WorkflowManager.cancelWorkflow(this);
  }
}
```

## 文件位置
```
miniprogram-agent/modules/workflow-manager.js
```

## 版本
v1.0.0 (2026-01-14)

---
更多详细信息请查看 README.md 和 USAGE_EXAMPLE.md
