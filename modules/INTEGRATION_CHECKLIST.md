# WorkflowManager 集成检查清单

## 步骤 1: 文件验证 ✓

- [x] workflow-manager.js 已创建 (C:\D\compet\tengxun\miniprogram-agent\modules\workflow-manager.js)
- [x] 语法检查通过
- [x] 包含 10 个方法
- [x] 所有 this 已转换为 pageContext
- [x] 模块导出正常

## 步骤 2: 在 agents.js 中集成

### 2.1 引入模块
在 agents.js 文件顶部添加:
```javascript
// pages/agents/agents.js
const WorkflowManager = require('../../modules/workflow-manager');
```

### 2.2 替换或包装方法
选择以下方案之一:

**方案 A: 直接替换 (推荐)**
```javascript
Page({
  // 替换原有方法
  async sendMessage() {
    await WorkflowManager.startCreation(this);
  },

  async testSingleAgent(agentKey, userInput) {
    await WorkflowManager.testSingleAgent(this, agentKey, userInput);
  },

  async executeFullWorkflow(userInput) {
    await WorkflowManager.executeFullWorkflow(this, userInput);
  },

  // 新增方法
  cancelWorkflow() {
    WorkflowManager.cancelWorkflow(this);
  },
});
```

**方案 B: 包装方式 (渐进式)**
```javascript
Page({
  // 保留原方法，重命名
  async sendMessage_OLD() {
    // 原有代码...
  },

  // 新方法调用模块
  async sendMessage() {
    try {
      await WorkflowManager.startCreation(this);
    } catch (error) {
      console.error('WorkflowManager error:', error);
      // 可选: 回退到旧实现
      // await this.sendMessage_OLD();
    }
  },
});
```

### 2.3 验证依赖方法
确保 agents.js 中包含以下方法:

**必需方法:**
- [ ] `callAIAPI(agentType, userMessage, context, mediaInfo)`
- [ ] `buildAgentContext(currentAgentKey)`
- [ ] `showConfigDialog()`

**可选方法 (根据功能启用情况):**
- [ ] `extractCharactersFromScript(scriptOutput)` - 角色一致性
- [ ] `generateAllCharacterTurnarounds(characters)` - 角色一致性
- [ ] `getPlatformName(platform)` - AutoGLM
- [ ] `callAutoGLMPublish(platform, title, description, tags)` - AutoGLM
- [ ] `saveCreationHistoryToHistory()` - 历史记录

## 步骤 3: 更新 WXML

### 3.1 添加取消按钮
在 agents.wxml 中添加:
```xml
<!-- 取消任务按钮 -->
<button 
  class="cancel-btn {{working ? '' : 'hidden'}}"
  bindtap="cancelWorkflow"
  hover-class="button-hover">
  取消任务
</button>
```

### 3.2 验证现有绑定
确保以下绑定正常:
- [ ] `bindtap="sendMessage"` - 发送按钮
- [ ] `bindconfirm="sendMessage"` - 输入框确认

## 步骤 4: 测试功能

### 4.1 基本功能测试
- [ ] 启动创作流程 (完整工作流模式)
- [ ] 测试单个智能体 (单智能体测试模式)
- [ ] 取消工作流
- [ ] 消息正常显示
- [ ] 智能体状态正常更新

### 4.2 高级功能测试 (如果启用)
- [ ] 角色一致性 - 三视图生成
- [ ] 反馈机制 - 用户反馈处理
- [ ] AutoGLM - 自动发布
- [ ] 创作历史保存

### 4.3 边缘情况测试
- [ ] API 未配置时的提示
- [ ] 输入为空时的提示
- [ ] 未选择测试智能体时的提示
- [ ] 工作流执行失败时的错误处理
- [ ] 取消工作流时的确认对话框

## 步骤 5: 性能和日志

### 5.1 性能检查
- [ ] 工作流执行速度正常
- [ ] UI 响应流畅
- [ ] 消息列表滚动正常

### 5.2 日志检查
打开开发者工具控制台，确认:
- [ ] 工作流启动日志
- [ ] 每个智能体执行日志
- [ ] 取消操作日志
- [ ] 错误日志 (如果有)

## 步骤 6: 代码清理 (可选)

### 6.1 如果使用方案 A (直接替换)
- [ ] 删除或注释掉原有的 sendMessage 实现
- [ ] 删除或注释掉原有的 testSingleAgent 实现
- [ ] 删除或注释掉原有的 executeFullWorkflow 实现

### 6.2 代码格式化
- [ ] 格式化 agents.js
- [ ] 检查代码风格一致性

## 步骤 7: 文档更新

- [ ] 更新项目 README (如果有)
- [ ] 更新 API 文档 (如果有)
- [ ] 添加模块使用说明到项目文档

## 常见问题排查

### 问题 1: "Cannot find module '../../modules/workflow-manager'"
**解决方案:** 检查模块文件路径是否正确

### 问题 2: "getApp is not defined"
**解决方案:** 确保在小程序环境中运行，不是在 Node.js 环境

### 问题 3: "pageContext.XXX is not a function"
**解决方案:** 检查 agents.js 中是否包含该依赖方法

### 问题 4: 工作流无法取消
**解决方案:** 检查 isCancelled 标志是否正确设置和检查

### 问题 5: 消息显示异常
**解决方案:** 检查 messages 数组和 toView 滚动配置

## 完成标志

当所有以上检查项都通过后，集成完成! 🎉

## 回滚方案

如果遇到问题需要回滚:

1. 删除或注释掉模块引入:
```javascript
// const WorkflowManager = require('../../modules/workflow-manager');
```

2. 恢复原有方法实现 (如果使用了方案 A)

3. 移除 WXML 中的 cancelWorkflow 按钮

## 技术支持

参考文档:
- README.md - 模块详细说明
- USAGE_EXAMPLE.md - 使用示例
- QUICK_REFERENCE.md - 快速参考
- SUMMARY.md - 提取总结

---
版本: v1.0.0
日期: 2026-01-14
