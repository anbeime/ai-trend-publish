# 工作流修复完成

## 修改内容

### 1. COZE节点参数（已恢复原样）
```json
{
  "workflow_id": "7573873083216707599",
  "parameters": {
    "input": "{{ $json.input }}"
  }
}
```

### 2. 提取正文节点（已加强）
- 支持多种HTML数据格式（binary/json.body/json.data）
- 添加详细调试日志
- 自动处理字符串/对象类型转换

## 更新步骤

### 方式1：在N8N界面手动更新（推荐）

1. 打开 http://localhost:5678/workflow/SoLRVvusHdvXBodD
2. 点击"提取正文内容"节点
3. 替换JavaScript代码为：

```javascript
// 提取HTML正文内容
const input = $input.item;

// 获取HTML - 支持多种数据格式
let html = '';
if (input.binary?.data?.data) {
    html = Buffer.from(input.binary.data.data, 'base64').toString('utf-8');
    console.log('[提取正文] 从binary.data获取HTML, 长度:', html.length);
} else if (input.json.body) {
    html = typeof input.json.body === 'string' ? input.json.body : JSON.stringify(input.json.body);
    console.log('[提取正文] 从json.body获取HTML, 长度:', html.length);
} else if (input.json.data) {
    html = typeof input.json.data === 'string' ? input.json.data : JSON.stringify(input.json.data);
    console.log('[提取正文] 从json.data获取HTML, 长度:', html.length);
} else {
    html = JSON.stringify(input.json);
    console.log('[提取正文] 从json获取HTML, 长度:', html.length);
}

if (!html || html.length < 50) {
    console.error('[提取正文] HTML内容为空或太短!', html.substring(0, 200));
}

// 清理HTML标签
let text = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

console.log('[提取正文] 清理后文本长度:', text.length);
console.log('[提取正文] 前100字符:', text.substring(0, 100));

// 限制长度
if (text.length > 8000) {
    text = text.substring(0, 8000) + '...';
    console.log('[提取正文] 已截断到8000字符');
}

const prevData = $('循环处理URL').item.json;

return [{
    json: {
        input: text,
        title: prevData.title,
        url: prevData.input,
        source: prevData.source
    }
}];
```

4. 保存
5. 运行测试，查看日志输出

### 方式2：重新导入JSON（如果方式1太麻烦）

修改后的完整工作流保存在：
`C:\D\n8n-master\workflow_SoLRVvusHdvXBodD.json`

可以在N8N中删除旧工作流，重新导入这个文件。

## 测试建议

运行工作流后，在"提取正文内容"节点查看执行日志：
- 应该看到 `[提取正文] 从xxx获取HTML, 长度: xxxx`
- 应该看到 `[提取正文] 清理后文本长度: xxxx`
- 应该看到 `[提取正文] 前100字符: xxx`

如果看到 `[提取正文] HTML内容为空或太短!`，说明"抓取网页内容"节点有问题。
