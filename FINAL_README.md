# AI热点自动发布系统 - 最终配置说明

## 当前状态

### ✅ 已完成配置
1. **微信发布API** (draft-api.py) - 端口8000，支持封面图，UTF-8编码正常
2. **自动化脚本** (auto_publish.py) - 采集→改写→发布完整流程
3. **N8N工作流** - 已配置支持封面图和标题内容
4. **COZE Token** - 已配置到.env文件

### ⚠️ 当前情况
- **COZE账户额度已用完**，需等待刷新
- 自动化脚本会使用**模拟改写**（有完整排版样式）作为临时方案
- COZE恢复后自动切换到真实工作流

## 🚀 启动自动化

### 方式1：手动测试运行
```bash
cd C:\D\ai-trend-publish
python auto_publish.py
```
结果：自动发布3篇文章到微信草稿箱

### 方式2：配置定时任务（需要管理员权限）

**步骤：**
1. 右键点击 **PowerShell** 或 **CMD** → **以管理员身份运行**
2. 执行：
```bash
cd C:\D\ai-trend-publish
python setup_auto_schedule.py
```
3. 成功后会创建3个定时任务：
   - 早上8:00
   - 晚上8:00
   - 晚上10:00

### 方式3：手动创建定时任务

1. 按 **Win+R**，输入 `taskschd.msc`
2. 点击"创建基本任务"
3. 配置：
   - 名称：`AIAutoPublish_Morning`
   - 触发器：每天 8:00
   - 操作：启动程序
   - 程序：`C:\D\ai-trend-publish\run_auto_publish.bat`
4. 重复创建 20:00 和 22:00 的任务

## 📊 系统流程

```
采集热点 → 改写文章 → 发布微信
  ↓           ↓           ↓
端口3000    COZE工作流   端口8000
(可选)     (或模拟改写)  (draft-api)
```

### 当COZE可用时：
- 调用真实COZE工作流生成文章
- 包含COZE生成的封面图
- 高质量内容改写

### 当COZE不可用时：
- 使用模拟改写模板
- 使用默认cover.jpg封面
- 有完整HTML排版样式

## 📝 文件说明

| 文件 | 说明 |
|------|------|
| `auto_publish.py` | 主自动化脚本 |
| `draft-api.py` | 微信发布API服务 |
| `run_auto_publish.bat` | 定时任务启动脚本 |
| `.env` | 配置文件（微信+COZE凭证） |
| `auto_log.txt` | 运行日志 |
| `cover.jpg` | 默认封面图 |

## 🔧 配置文件

`.env` 中的关键配置：
```
WEIXIN_APP_ID=wx8410119dfbb7f756
WEIXIN_APP_SECRET=***
COZE_AUTH_TOKEN=pat_***
```

## 📞 查看日志

```bash
# 查看最近50行日志
type C:\D\ai-trend-publish\auto_log.txt | more

# 或用记事本打开
notepad C:\D\ai-trend-publish\auto_log.txt
```

## 🎯 测试状态

已测试成功：
- ✅ 发布3篇文章到微信（2026-01-06）
- ✅ 中文编码正常显示
- ✅ 封面图自动上传
- ✅ HTML排版样式完整
- ✅ 模拟改写功能正常

等待COZE额度恢复后：
- ⏳ 真实COZE工作流改写
- ⏳ COZE生成的封面图

## 💡 优化建议

1. **采集API** (端口3000) - 配置稳定的热点源
2. **COZE额度** - 等待刷新或升级付费版
3. **多平台发布** - 在N8N中添加其他平台节点（小红书、知乎等）
4. **内容去重** - 避免重复发布相同内容
5. **发布通知** - 发布成功后发送通知

---

**系统已就绪，等待COZE额度恢复或配置定时任务！**

最后更新：2026-01-06
