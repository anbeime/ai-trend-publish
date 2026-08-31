# AI热点自动采集发布系统 - 使用说明

## ✅ 已完成功能

### 1. 微信发布API
- **位置**: `draft-api.py`
- **端口**: 8000
- **功能**: 发布文章到微信公众号草稿箱
- **状态**: ✅ 已修复中文编码问题，可正常发布
- **特点**:
  - 自动上传封面图（cover.jpg）
  - UTF-8编码确保中文正常显示
  - 支持HTML格式和样式

### 2. 自动化流程脚本
- **位置**: `test_auto_flow.py`
- **功能**: 完整流程测试（采集→改写→发布）
- **状态**: ✅ 测试通过，3/3文章成功发布

## 🚀 快速开始

### 方式1: 手动运行（测试用）

```bash
# 1. 启动发布API服务
python draft-api.py

# 2. 运行自动化脚本
python test_auto_flow.py
```

### 方式2: Windows定时任务（自动运行）

**需要管理员权限**，在管理员PowerShell/CMD中运行：

```bash
cd C:\D\ai-trend-publish
python setup_schedule.py
```

这将创建3个定时任务：
- **早上8:00** - AITrendPublish_Morning
- **晚上8:00** - AITrendPublish_Evening
- **晚上10:00** - AITrendPublish_Night

### 方式3: 手动创建Windows定时任务

如果自动创建失败，可以手动创建：

1. 按Win+R，输入 `taskschd.msc` 打开任务计划程序
2. 右键"任务计划程序库" → "创建基本任务"
3. 名称: `AITrendPublish_Morning`
4. 触发器: 每天 8:00
5. 操作: 启动程序
   - 程序: `C:\D\ai-trend-publish\run_auto.bat`
6. 完成

重复创建晚上8:00和10:00的任务。

## 📝 当前状态

### ✅ 正常工作
1. 微信发布API - 中文编码已修复
2. 封面图上传 - cover.jpg自动上传
3. HTML样式 - 支持彩色标注、居中标题等
4. 完整流程 - 采集→改写→发布流程通顺

### ⚠️ 待完善
1. **热点采集API** (端口3000) - 需要确保稳定运行
2. **COZE工作流集成** - 当前使用模拟数据，需要连接真实COZE API
3. **N8N工作流** - 需要确保能调用本地发布API

## 🔧 集成N8N工作流

你现有的N8N工作流（ID: `SoLRVvusHdvXBodD`）需要确保：

1. **HTTP Request节点**配置：
   ```
   URL: http://localhost:8000/publish-draft
   Method: POST
   Body:
   {
     "title": "{{ $json.title }}",
     "content": "{{ $json.content }}"
   }
   ```

2. **COZE节点输出解析**：
   确保解析SSE流输出的title和content字段

3. **测试方法**：
   在N8N界面手动执行工作流，检查是否能成功发布到微信

## 📊 日志查看

自动运行的日志保存在：
```
C:\D\ai-trend-publish\auto_log.txt
```

查看最近的日志：
```bash
tail -n 50 auto_log.txt
```

## 🐛 问题排查

### 问题1: 发布失败 - access_token无效
**原因**: token过期
**解决**: 重启draft-api.py服务

### 问题2: 中文显示乱码
**原因**: 编码问题
**解决**: ✅ 已修复，使用UTF-8字节发送而非JSON自动编码

### 问题3: 没有封面图
**原因**: cover.jpg不存在
**解决**: 准备一张封面图命名为cover.jpg放在项目根目录

### 问题4: N8N工作流执行失败
**原因**: 工作流未激活或COZE凭证配置错误
**解决**: 在N8N界面检查工作流状态和凭证配置

## 📞 服务状态检查

```bash
# 检查draft-api是否运行
netstat -ano | findstr ":8000"

# 检查N8N是否运行
netstat -ano | findstr ":5678"

# 检查热点采集API是否运行
netstat -ano | findstr ":3000"
```

## 🎯 下一步优化建议

1. **优化排版模板** - 可以创建多种文章模板
2. **添加图片支持** - 在文章中插入相关图片
3. **错误通知** - 发布失败时发送通知
4. **数据统计** - 记录发布成功率、热度等数据
5. **去重机制** - 避免重复发布相同内容

---

最后更新: 2026-01-06
