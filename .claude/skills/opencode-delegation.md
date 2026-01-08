# OpenCode 任务委派技能

## 触发条件

当用户的任务符合以下**任意条件**时，自动启动 OpenCode 多智能体系统协助：

### 1. 复杂项目开发
- 需要创建完整项目结构
- 涉及多个文件协调
- 需要架构设计
- 关键词：`创建项目`、`完整实现`、`架构设计`

### 2. 需要多种 AI 能力
- 用户明确要求使用特定模型
- 需要多角度分析
- 需要对比不同AI的输出
- 关键词：`用GPT分析`、`让DeepSeek推理`、`多个AI对比`

### 3. 完整工作流程
- 需要代码审查 + 测试 + 文档
- 需要CI/CD配置
- 需要完整的质量保证流程
- 关键词：`完整流程`、`审查测试`、`生产级别`

### 4. 自动化任务
- 批量处理
- 持续监控
- 定时任务
- 关键词：`批量`、`自动化`、`持续`

### 5. 用户明确要求
- `启动OpenCode`
- `用多智能体`
- `让团队协作`

## 委派流程

### 步骤1: 通知用户
```
检测到复杂任务，我将启动 OpenCode 多智能体团队协助。

任务类型: [项目开发/多AI协同/完整流程/自动化]
预计需要: [架构师/开发/审查/测试/文档/部署] 智能体

正在启动...
```

### 步骤2: 启动服务
```bash
# 检查 OpenCode 是否已运行
curl -s http://localhost:3000 > /dev/null 2>&1

# 未运行则启动
if [ $? -ne 0 ]; then
    cd C:\D\opencode
    start /B START_FULL_SYSTEM.bat

    # 等待服务启动
    sleep 10
fi
```

### 步骤3: 创建任务
```bash
# 通过 OpenCode API 创建任务
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "project",
    "description": "...",
    "agents": ["architect", "developer", "reviewer"],
    "priority": "high"
  }'
```

### 步骤4: 监控进度
```bash
# 定期检查任务状态
while true; do
    status=$(curl -s http://localhost:3001/api/tasks/123/status)
    echo "进度: $status"

    if [ "$status" == "completed" ]; then
        break
    fi

    sleep 5
done
```

### 步骤5: 汇报结果
```
OpenCode 多智能体团队已完成任务！

完成内容:
- ✅ 架构设计（GPT-5）
- ✅ 代码实现（Claude 4.5）
- ✅ 代码审查（Grok-3）
- ✅ 单元测试（GPT-5 Codex）
- ✅ 技术文档（Gemini 2.5）

结果位置: [路径]
质量报告: [链接]
```

## 判断标准

### 简单任务（我自己做）
```
单文件操作
简单函数编写
代码解释说明
快速问答
文档查询
```

### 复杂任务（委派 OpenCode）
```
多文件项目
需要架构设计
需要完整测试
需要多AI协同
生产级别代码
```

## 示例场景

### 场景1: 创建完整项目
```
用户: "创建一个完整的博客系统，包含前后端和测试"

我的判断: ✅ 复杂项目，需要委派

我的操作:
1. 通知用户启动 OpenCode
2. 委派任务给多智能体:
   - 架构师: 设计系统架构
   - 开发工程师: 实现前后端
   - 测试工程师: 编写测试
   - 文档工程师: 生成文档
3. 监控进度
4. 汇报结果
```

### 场景2: 简单函数
```
用户: "写个快速排序函数"

我的判断: ❌ 简单任务，自己做

我的操作:
1. 直接编写代码
2. 完成！
```

### 场景3: 代码审查
```
用户: "深度审查这个项目，包括安全、性能、测试覆盖率"

我的判断: ✅ 需要多角度分析，委派

我的操作:
1. 启动 OpenCode
2. 调用多个智能体:
   - Grok-3: 代码质量审查
   - DeepSeek R1: 安全漏洞分析
   - Claude 4.5: 性能优化建议
   - GPT-5 Codex: 测试覆盖率检查
3. 整合所有建议
4. 生成综合报告
```

## 关闭策略

### 任务完成后
```bash
# 如果没有新的复杂任务，可以关闭 OpenCode 节省资源
# 但建议保持运行，随时待命
```

### 用户可选
```
用户: "关闭 OpenCode"
我: [执行关闭命令]
```

## 通信接口

### OpenCode API 端点
- `POST /api/tasks` - 创建任务
- `GET /api/tasks/:id` - 查询任务状态
- `GET /api/tasks/:id/result` - 获取结果
- `POST /api/agents/assign` - 分配智能体
- `GET /api/health` - 健康检查

### 智能体选择
```javascript
{
  "architect": "gpt-5",           // 架构设计
  "developer": "claude-4.5-sonnet", // 代码实现
  "reviewer": "grok-3",           // 代码审查
  "tester": "gpt-5-codex",        // 测试
  "documenter": "gemini-2.5-flash", // 文档
  "deployer": "claude-4.5-sonnet"  // 部署
}
```

## 配置选项

### 自动启动阈值
```json
{
  "delegation_threshold": {
    "file_count": 3,          // 超过3个文件自动委派
    "complexity_score": 7,    // 复杂度>7自动委派
    "time_estimate": 300,     // 预计>5分钟自动委派
    "keywords_match": true    // 关键词匹配自动委派
  }
}
```

### 智能体并发
```json
{
  "max_concurrent_agents": 3,
  "enable_parallel": true
}
```

## 优势

✅ **无缝协作** - 用户只需和我对话
✅ **智能判断** - 自动决定是否需要团队
✅ **最优配置** - 简单快速，复杂全面
✅ **资源优化** - 不浪费多智能体在简单任务
✅ **透明过程** - 用户知道发生了什么

## 总结

我是**总管理者和协调者**:
- 判断任务复杂度
- 简单任务自己做
- 复杂任务委派 OpenCode
- 监督进度和质量
- 统一汇报结果

**用户只需和我对话，我会智能调度资源！**
