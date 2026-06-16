## 快速修复步骤（1分钟）

你的工作流已经有"抓取网页"和"提取正文"节点了！

**只需修改1个地方**：

### 打开工作流
http://localhost:5678

找到工作流：`公众号+coze自动发布文章`

### 修改"使用Coze改写工作流"节点

1. 点击这个节点
2. 找到 `JSON Body` 配置
3. **修改前**：
```json
{
  "workflow_id": "7573873083216707599",
  "parameters": {
    "input": "{{ $json.input }}"
  }
}
```

4. **修改后**：
```json
{
  "workflow_id": "7573873083216707599",
  "parameters": {
    "BOT_USER_INPUT": "标题：{{ $json.title }}\n\n正文：{{ $json.input }}"
  }
}
```

5. 点击 `Save`
6. 点击 `Execute Workflow` 测试

---

## 修改说明

**关键变化**：
- ❌ 旧的：`"input": "{{ $json.input }}"`
- ✅ 新的：`"BOT_USER_INPUT": "标题：{{ $json.title }}\n\n正文：{{ $json.input }}"`

**原因**：
- COZE工作流的输入参数名是 `BOT_USER_INPUT`，不是 `input`
- 现在传递格式化的"标题+正文"，COZE能更好地理解

---

修改完成后立即测试！
