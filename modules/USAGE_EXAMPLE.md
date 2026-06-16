# WorkflowManager 使用示例

## 快速开始

### 1. 在 agents.js 中引入模块

```javascript
// pages/agents/agents.js
const WorkflowManager = require('../../modules/workflow-manager');

Page({
  data: {
    working: false,
    inputValue: "",
    messages: [],
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

  // 保留原有的依赖方法
  async callAIAPI(agentType, userMessage, context, mediaInfo) {
    // 原有实现
  },

  buildAgentContext(currentAgentKey) {
    // 原有实现
  },

  // ... 其他方法
});
```

### 2. 在 WXML 中绑定取消按钮

```xml
<button class="cancel-btn {{working ? '' : 'hidden'}}"
        bindtap="cancelWorkflow">
  取消任务
</button>
```

## 依赖的 agents.js 方法

WorkflowManager 需要以下方法存在于 agents.js 中:

- `callAIAPI()` - 调用 AI API
- `buildAgentContext()` - 构建智能体上下文
- `extractCharactersFromScript()` - 提取角色 (角色一致性功能需要)
- `generateAllCharacterTurnarounds()` - 生成三视图 (角色一致性功能需要)
- `getPlatformName()` - 获取平台名称 (AutoGLM 需要)
- `callAutoGLMPublish()` - AutoGLM 发布 (自动发布需要)
- `saveCreationHistoryToHistory()` - 保存历史
- `showConfigDialog()` - 显示配置对话框

## 高级用法

### 添加工作流钩子

```javascript
async executeFullWorkflow(userInput) {
  console.log('工作流开始');
  
  try {
    await WorkflowManager.executeFullWorkflow(this, userInput);
    console.log('工作流成功完成');
  } catch (error) {
    console.error('工作流失败:', error);
  }
}
```

### 自定义取消逻辑

```javascript
cancelWorkflow() {
  // 添加取消前的检查
  if (this.hasUnsavedData()) {
    wx.showModal({
      title: '有未保存的数据',
      content: '确定要取消吗？',
      success: (res) => {
        if (res.confirm) {
          WorkflowManager.cancelWorkflow(this);
        }
      },
    });
  } else {
    WorkflowManager.cancelWorkflow(this);
  }
}
```

## 注意事项

1. 所有模块方法的第一个参数必须是页面上下文 (this)
2. 确保所有依赖方法在 agents.js 中存在
3. 模块不修改 agents.js 原有代码，只是代码复用
4. 取消功能通过 isCancelled 标志实现

## 故障排查

**问题: "getApp is not defined"**
- 确保在小程序环境中运行

**问题: "pageContext.XXX is not a function"**
- 检查 agents.js 中是否包含该依赖方法

**问题: 工作流取消后仍在执行**
- 检查 isCancelled 标志是否正确设置
