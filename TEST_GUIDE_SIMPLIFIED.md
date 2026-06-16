# 🧪 AI热点发布系统 - 简化测试指南

由于网络环境有代理配置，我们采用**分步骤手动测试**的方式。

---

## ✅ 测试准备清单

在开始测试前，确保以下服务已启动：

### 1. cursorweb2api (本地大模型)
```bash
# 方式A: 使用启动脚本
cd C:\D\cursorweb2api
start.bat

# 方式B: 使用 Python
cd C:\D\cursorweb2api
python server.py

# 验证: 浏览器打开
http://localhost:8000/v1/models
```
**预期结果**: 看到可用模型列表

---

### 2. n8n 工作流平台
```bash
cd C:\D\n8n-master
pnpm dev

# 验证: 浏览器打开
http://localhost:5678
```
**预期结果**: 看到 n8n 登录/工作流界面

---

## 🎯 分步测试（无需外网）

### 测试1: COZE 改写功能

1. **打开您现有的 COZE 工作流**
   - 在 N8N 中找到您的 COZE 改写工作流

2. **手动执行测试**
   - 输入一个测试 URL（可以是任意文章）
   - 点击 "Execute Node" 或 "Execute Workflow"

3. **检查输出**
   ```json
   {
     "title": "改写后的标题",
     "content": "改写后的正文内容...",
     "images": ["图片URL1", "图片URL2"]
   }
   ```

**如果成功** ✅ → 进入测试2
**如果失败** ❌ → 检查 COZE 配置、API密钥等

---

### 测试2: 排版优化（本地模拟）

创建测试文件 `test-format.js`:

```javascript
// test-format.js
const formatWechat = require('./api/format-wechat.js').default;

const mockReq = {
  method: 'POST',
  body: {
    title: "【测试】AI技术最新突破",
    content: `
# 核心观点

这是一篇测试文章。

## 重点内容

- 第一点
- 第二点
- 第三点

**重要提示**: 这只是测试。
    `.trim(),
    images: []
  }
};

const mockRes = {
  setHeader: () => {},
  status: (code) => mockRes,
  json: (data) => {
    console.log('✅ 排版优化结果:');
    console.log(JSON.stringify(data, null, 2));
    return mockRes;
  },
  end: () => mockRes
};

formatWechat(mockReq, mockRes);
```

**运行测试**:
```bash
node test-format.js
```

**预期结果**: 输出优化后的 HTML 格式内容

---

### 测试3: 微信发布（使用现有代码）

您已有的 `api/index.js` 和 `wechat_sdk.py` 可以直接使用：

```bash
# 测试微信 Access Token
curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx8410119dfbb7f756&secret=3c93e33e087e57b906f5c341aa5223b9"
```

**预期结果**:
```json
{
  "access_token": "...",
  "expires_in": 7200
}
```

**如果成功** ✅ → 您的微信配置正确
**如果失败** ❌ → 检查 AppID/AppSecret 或 IP 白名单

---

### 测试4: 完整流程（N8N 手动执行）

1. **导入工作流**
   - 打开 n8n: `http://localhost:5678`
   - Import → 选择 `n8n-auto-publish-workflow.json`

2. **关键修改**（适应当前环境）

   **节点1: "采集热点文章"**
   - 暂时禁用或使用本地测试数据
   - 或者手动输入测试数据：
   ```javascript
   // 在 Code 节点中手动创建测试数据
   return [
     {
       json: {
         title: "测试文章标题",
         url: "https://example.com/test",
         hotScore: 15000
       }
     }
   ];
   ```

   **节点2: "COZE改写"**
   - 连接您现有的 COZE 工作流
   - 确保输入/输出格式匹配

   **节点3: "发布到微信"**
   - 使用您现有的发布逻辑
   - 暂时可以只输出到日志，不真正发布

3. **手动执行**
   - 点击 "Execute Workflow"
   - 观察每个节点的执行结果

4. **检查结果**
   - 如果所有节点都是绿色 ✅ → 成功！
   - 如果有红色 ❌ → 查看错误详情

---

## 🔧 最小可行版本（MVP）

如果完整流程太复杂，先测试**最小版本**：

### 简化工作流（仅 3 个节点）

```
[手动触发] → [COZE改写] → [输出日志]
```

1. **删除所有自动化节点**
   - 删除"采集热点"
   - 删除"筛选爆款"
   - 删除"循环处理"
   - 删除"微信发布"

2. **保留核心功能**
   - 只保留 COZE 改写
   - 输出到 Console

3. **手动输入测试**
   ```javascript
   // 手动输入节点
   {
     "url": "https://36kr.com/p/12345",
     "title": "测试标题"
   }
   ```

4. **执行并验证**
   - COZE 是否正常改写
   - 输出格式是否正确

---

## 📋 测试记录表

| 测试项 | 状态 | 备注 |
|--------|------|------|
| cursorweb2api 启动 | ⬜ 未测试 |  |
| n8n 启动 | ⬜ 未测试 |  |
| COZE 改写功能 | ⬜ 未测试 |  |
| 排版优化 | ⬜ 未测试 |  |
| 微信 Access Token | ⬜ 未测试 |  |
| N8N 完整流程 | ⬜ 未测试 |  |
| 开机自启动 | ⬜ 未测试 |  |

---

## 💡 逐步验证建议

### 第1天: 基础服务
- [ ] 启动 cursorweb2api
- [ ] 启动 n8n
- [ ] 验证两个服务都能访问

### 第2天: COZE 改写
- [ ] 在 n8n 中执行 COZE 工作流
- [ ] 验证改写功能正常
- [ ] 记录输出格式

### 第3天: 微信发布
- [ ] 测试微信 API 连接
- [ ] 手动发布一篇测试文章到草稿箱
- [ ] 验证草稿箱能看到文章

### 第4天: 集成测试
- [ ] 在 n8n 中连接所有节点
- [ ] 手动执行完整流程
- [ ] 检查草稿箱中的最终结果

### 第5天: 自动化
- [ ] 配置定时触发器
- [ ] 设置开机自启动
- [ ] 验证自动执行

---

## 🆘 常见问题

### Q1: n8n 无法启动
**解决**: 检查端口 5678 是否被占用
```bash
netstat -ano | findstr :5678
```

### Q2: COZE 节点报错
**解决**: 检查 COZE API 配置、密钥、额度

### Q3: 微信发布失败
**解决**:
1. 检查 IP 白名单（223.73.236.232）
2. 验证 AppID/AppSecret
3. 查看错误码对照表

---

## 📞 需要帮助？

**手动测试成功后，再考虑自动化！**

测试顺序：
1. 手动测试每个组件 ✅
2. 手动执行 n8n 工作流 ✅
3. 配置定时触发 ✅
4. 设置开机自启动 ✅

---

**创建时间**: 2026-01-04
**适用场景**: 网络环境受限时的测试方案
